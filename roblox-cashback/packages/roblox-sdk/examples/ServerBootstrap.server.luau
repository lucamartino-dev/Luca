--!strict
-- Esempio completo di integrazione lato partner.
-- Va in ServerScriptService insieme al ModuleScript Robuxback.

local MarketplaceService = game:GetService("MarketplaceService")
local ServerScriptService = game:GetService("ServerScriptService")

local Robuxback = require(ServerScriptService.Robuxback)

Robuxback.start({
	baseUrl = "https://api.robuxback.example",
	keyId = "key_sostituiscimi",
	-- Il segreto vive nello store dei Secrets di Roblox, non nel codice.
	secretName = "robuxback",
	verbose = true,
})
Robuxback.trackGamePassPurchases()

-- La tua logica di consegna resta la tua: noi la avvolgiamo soltanto.
local function grantProduct(receiptInfo)
	local player = game:GetService("Players"):GetPlayerByUserId(receiptInfo.PlayerId)
	if not player then
		-- Il giocatore è uscito: Roblox ritenterà il receipt più avanti.
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
	if receiptInfo.ProductId == 123456 then
		player.leaderstats.Monete.Value += 100
	end
	return Enum.ProductPurchaseDecision.PurchaseGranted
end

MarketplaceService.ProcessReceipt = Robuxback.wrapProcessReceipt(grantProduct)
