--!strict
--[[
	Robuxback SDK — da mettere in ServerScriptService (ModuleScript).

	Cosa fa:
	  1. legge il launchData del deep link e attribuisce la partita al giocatore
	     che è arrivato dalla nostra app;
	  2. segnala ogni acquisto andato a buon fine, così il giocatore matura
	     il cashback;
	  3. se la rete cade, mette in coda e ritenta (con backlog su DataStore).

	Autenticazione: il segreto sta nello store dei Secrets di Roblox e non è
	leggibile dal codice del gioco. Crea il secret dalla Creator Dashboard con
	dominio uguale al dominio delle nostre API.

	Uso minimo:

		local Robuxback = require(script.Robuxback)
		Robuxback.start({ baseUrl = "https://api.robuxback.example", keyId = "key_..." })
		MarketplaceService.ProcessReceipt = Robuxback.wrapProcessReceipt(function(receiptInfo)
			-- la tua logica di consegna del prodotto
			return Enum.ProductPurchaseDecision.PurchaseGranted
		end)
]]

local HttpService = game:GetService("HttpService")
local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local DataStoreService = game:GetService("DataStoreService")

local Robuxback = {}

type Options = {
	baseUrl: string,
	keyId: string,
	secretName: string?, -- nome del secret in Roblox (default: "robuxback")
	devSecret: string?, -- solo per test in Studio, mai in produzione
	heartbeatSeconds: number?,
	maxRetries: number?,
	verbose: boolean?,
}

type Session = {
	sessionId: string,
	expiresAt: number,
	cashbackPercent: number,
}

local options: Options? = nil
local authHeader: any = nil
local sessions: { [number]: Session } = {}
local outbox: { { path: string, body: { [string]: any }, attempts: number } } = {}
local outboxStore: DataStore? = nil
local running = false

local function log(...: any)
	if options and options.verbose then
		print("[Robuxback]", ...)
	end
end

local function warnOnce(message: string)
	warn("[Robuxback] " .. message)
end

--[[ Costruisce l'header Authorization. In produzione usa un Secret, che
     Roblox non lascia stampare né concatenare in stringhe arbitrarie. ]]
local function buildAuthHeader(opts: Options): any
	if opts.devSecret then
		if not RunService:IsStudio() then
			warnOnce("devSecret usato fuori da Studio: passa ai Secrets di Roblox")
		end
		return "Bearer " .. opts.keyId .. "." .. opts.devSecret
	end
	local secretName = opts.secretName or "robuxback"
	local ok, secret = pcall(function()
		return HttpService:GetSecret(secretName)
	end)
	if not ok then
		error("[Robuxback] secret '" .. secretName .. "' non trovato: crealo nella Creator Dashboard")
	end
	return secret:AddPrefix("Bearer " .. opts.keyId .. ".")
end

local function request(path: string, body: { [string]: any }?): (boolean, any)
	local opts = options
	if not opts then
		return false, "SDK non inizializzato"
	end
	local success, response = pcall(function()
		return HttpService:RequestAsync({
			Url = opts.baseUrl .. path,
			Method = if body then "POST" else "GET",
			Headers = {
				["Content-Type"] = "application/json",
				["Authorization"] = authHeader,
			},
			Body = if body then HttpService:JSONEncode(body) else nil,
		})
	end)
	if not success then
		return false, response
	end
	if not response.Success then
		-- 4xx: richiesta sbagliata, inutile ritentare. 5xx: riprovabile.
		return false, {
			status = response.StatusCode,
			body = response.Body,
			retryable = response.StatusCode >= 500 or response.StatusCode == 429,
		}
	end
	local decoded = nil
	if response.Body and #response.Body > 0 then
		local ok, parsed = pcall(HttpService.JSONDecode, HttpService, response.Body)
		decoded = if ok then parsed else nil
	end
	return true, decoded
end

--[[ ─── coda di invio ─────────────────────────────────────────────────────
	Un acquisto già consegnato al giocatore non può essere perso: se la nostra
	API non risponde, la segnalazione resta in coda e viene ritentata. Quello
	che resta alla chiusura del server finisce in un outbox su DataStore.
]]

local function enqueue(path: string, body: { [string]: any })
	table.insert(outbox, { path = path, body = body, attempts = 0 })
end

local function flushOutbox()
	local pending = outbox
	outbox = {}
	local maxRetries = (options and options.maxRetries) or 6

	for _, item in pending do
		local ok, err = request(item.path, item.body)
		if ok then
			log("inviato", item.path, item.body.receiptId)
		else
			local retryable = typeof(err) ~= "table" or err.retryable ~= false
			item.attempts += 1
			if retryable and item.attempts < maxRetries then
				table.insert(outbox, item)
			else
				warnOnce("segnalazione scartata dopo " .. item.attempts .. " tentativi: " .. HttpService:JSONEncode(item.body))
			end
		end
	end
end

local function persistOutbox()
	if #outbox == 0 or not outboxStore then
		return
	end
	local key = "outbox_" .. game.JobId
	local ok, err = pcall(function()
		(outboxStore :: DataStore):SetAsync(key, outbox, {}, nil)
	end)
	if not ok then
		warnOnce("outbox non salvato: " .. tostring(err))
	end
end

local function drainPersistedOutbox()
	if not outboxStore then
		return
	end
	local ok, pages = pcall(function()
		return (outboxStore :: DataStore):ListKeysAsync("outbox_", 20)
	end)
	if not ok then
		return
	end
	for _, entry in pages:GetCurrentPage() do
		local readOk, stored = pcall(function()
			return (outboxStore :: DataStore):GetAsync(entry.KeyName)
		end)
		if readOk and typeof(stored) == "table" then
			for _, item in stored do
				table.insert(outbox, item)
			end
			pcall(function()
				(outboxStore :: DataStore):RemoveAsync(entry.KeyName)
			end)
		end
	end
	if #outbox > 0 then
		log("ripresi", #outbox, "invii dal backlog")
		flushOutbox()
	end
end

--[[ ─── attribuzione ─────────────────────────────────────────────────────── ]]

local function attribute(player: Player)
	local launchToken: string? = nil
	local joinOk, joinData = pcall(function()
		return player:GetJoinData()
	end)
	if joinOk and joinData and typeof(joinData.LaunchData) == "string" and #joinData.LaunchData > 0 then
		launchToken = joinData.LaunchData
	end

	local body: { [string]: any } = {
		robloxUserId = player.UserId,
		jobId = game.JobId,
	}
	if launchToken then
		body.launchToken = launchToken
	end

	local ok, response = request("/v1/game/session/attribute", body)
	if not ok then
		log("attribuzione fallita per", player.Name, response)
		return
	end
	if not response or not response.attributed then
		return -- giocatore organico: nessun cashback, nessun rumore
	end

	sessions[player.UserId] = {
		sessionId = response.sessionId,
		expiresAt = os.time() + 60 * 60,
		cashbackPercent = response.cashbackPercent or 0,
	}
	log(player.Name, "attribuito, cashback", response.cashbackPercent .. "%")
	Robuxback.onAttributed:Fire(player, sessions[player.UserId])
end

--[[ ─── API pubblica ─────────────────────────────────────────────────────── ]]

local attributedSignal = Instance.new("BindableEvent")
Robuxback.onAttributed = attributedSignal.Event
Robuxback._attributedSignal = attributedSignal

--- Il giocatore è arrivato dalla nostra app e sta maturando cashback?
function Robuxback.isAttributed(player: Player): boolean
	local session = sessions[player.UserId]
	return session ~= nil
end

--- Percentuale di cashback attiva per questo giocatore (0 se non attribuito).
function Robuxback.getCashbackPercent(player: Player): number
	local session = sessions[player.UserId]
	return if session then session.cashbackPercent else 0
end

--- Segnala un acquisto. Idempotente lato server sulla coppia (gioco, receiptId).
function Robuxback.reportPurchase(userId: number, receiptId: string, productId: number, robuxSpent: number, productName: string?)
	if robuxSpent <= 0 then
		return
	end
	enqueue("/v1/game/purchase", {
		receiptId = receiptId,
		robloxUserId = userId,
		productId = productId,
		robuxSpent = robuxSpent,
		productName = productName,
		purchasedAt = os.time() * 1000,
	})
	task.defer(flushOutbox)
end

--[[ Avvolge il tuo ProcessReceipt: il prodotto viene consegnato dalla tua
     logica e solo dopo, se la consegna è andata a buon fine, segnaliamo
     l'acquisto. Se la tua logica fallisce, non paghiamo cashback. ]]
function Robuxback.wrapProcessReceipt(handler: (receiptInfo: any) -> Enum.ProductPurchaseDecision)
	return function(receiptInfo: any): Enum.ProductPurchaseDecision
		local decision = handler(receiptInfo)
		if decision == Enum.ProductPurchaseDecision.PurchaseGranted then
			local ok, err = pcall(function()
				Robuxback.reportPurchase(
					receiptInfo.PlayerId,
					tostring(receiptInfo.PurchaseId),
					receiptInfo.ProductId,
					receiptInfo.CurrencySpent
				)
			end)
			if not ok then
				warnOnce("segnalazione acquisto fallita: " .. tostring(err))
			end
		end
		return decision
	end
end

--[[ I gamepass non passano da ProcessReceipt: aggancia questo handler se
     vendi anche gamepass. Il prezzo arriva da GetProductInfo. ]]
function Robuxback.trackGamePassPurchases()
	MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, gamePassId, wasPurchased)
		if not wasPurchased then
			return
		end
		local ok, info = pcall(function()
			return MarketplaceService:GetProductInfo(gamePassId, Enum.InfoType.GamePass)
		end)
		if not ok or not info or not info.PriceInRobux then
			return
		end
		Robuxback.reportPurchase(
			player.UserId,
			string.format("gp-%d-%d-%d", player.UserId, gamePassId, os.time()),
			gamePassId,
			info.PriceInRobux,
			info.Name
		)
	end)
end

function Robuxback.start(opts: Options)
	assert(not running, "[Robuxback] start() chiamato due volte")
	assert(opts.baseUrl and opts.keyId, "[Robuxback] baseUrl e keyId sono obbligatori")
	assert(RunService:IsServer(), "[Robuxback] il SDK gira solo sul server")
	options = opts
	authHeader = buildAuthHeader(opts)
	running = true

	local storeOk, store = pcall(function()
		return DataStoreService:GetDataStore("RobuxbackOutbox")
	end)
	outboxStore = if storeOk then store else nil

	for _, player in Players:GetPlayers() do
		task.spawn(attribute, player)
	end
	Players.PlayerAdded:Connect(function(player)
		task.spawn(attribute, player)
	end)
	Players.PlayerRemoving:Connect(function(player)
		local session = sessions[player.UserId]
		sessions[player.UserId] = nil
		if session then
			enqueue("/v1/game/session/end", { sessionId = session.sessionId })
			task.defer(flushOutbox)
		end
	end)

	-- Heartbeat: tiene viva la sessione di chi gioca a lungo, e ritenta la coda.
	task.spawn(function()
		local interval = opts.heartbeatSeconds or 120
		while running do
			task.wait(interval)
			for _, session in sessions do
				enqueue("/v1/game/session/heartbeat", { sessionId = session.sessionId })
			end
			flushOutbox()
		end
	end)

	task.spawn(drainPersistedOutbox)

	game:BindToClose(function()
		running = false
		flushOutbox()
		persistOutbox()
	end)

	log("avviato su", opts.baseUrl)
end

return Robuxback
