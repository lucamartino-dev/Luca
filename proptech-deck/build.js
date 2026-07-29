const pptxgen = require("pptxgenjs");
const p = new pptxgen();
p.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
const W = 13.3, H = 7.5;

// ---- Palette ----
const NAVY  = "0E1E38";  // deep background
const NAVY2 = "17294A";  // panel / card on dark
const AMBER = "E8A33D";  // accent (Italian warmth)
const TERRA = "C0563C";  // secondary accent
const ICE   = "EAF1FA";  // light bg
const WHITE = "FFFFFF";
const INK   = "16233B";  // dark text on light
const SLATE = "5C6C87";  // muted text on light
const MUTE  = "9DB0CC";  // muted text on dark
const CARD  = "F4F7FC";  // light card
const LINE  = "D9E2EF";

const HEAD = "Cambria";
const BODY = "Calibri";

// ---- helpers ----
function bg(slide, color){ slide.background = { color }; }

function kicker(slide, text, x, y, color, acc){
  slide.addText(text.toUpperCase(), {
    x, y, w: 6, h: 0.3, fontFace: BODY, fontSize: 12, bold: true,
    color: acc || AMBER, charSpacing: 3, align: "left", margin: 0
  });
}

function pageNum(slide, n, dark){
  slide.addText(String(n).padStart(2,"0"), {
    x: W-0.9, y: H-0.55, w: 0.5, h: 0.3, align: "right",
    fontFace: BODY, fontSize: 10, color: dark ? MUTE : SLATE, margin: 0
  });
  slide.addText("CONFORME", {
    x: 0.6, y: H-0.55, w: 3, h: 0.3, align: "left",
    fontFace: BODY, fontSize: 10, bold:true, color: dark ? MUTE : SLATE, charSpacing: 2, margin: 0
  });
}

function numCircle(slide, x, y, d, n, fill, txtcol){
  slide.addShape(p.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color: fill } });
  slide.addText(String(n), { x, y, w: d, h: d, align:"center", valign:"middle",
    fontFace: HEAD, fontSize: 18, bold:true, color: txtcol || WHITE, margin:0 });
}

// =========================================================
// SLIDE 1 — TITLE
// =========================================================
let s = p.addSlide(); bg(s, NAVY);
// subtle building-block motif (bottom-right nodes)
const blocks = [[10.9,4.9,1.5],[11.55,5.6,0.9],[12.15,4.2,2.3]];
blocks.forEach(([bx,by,bh],i)=>{
  s.addShape(p.ShapeType.roundRect, { x:bx, y:by, w:0.55, h:bh, rectRadius:0.06,
    fill:{ color: i===2?AMBER:NAVY2 }, line:{ color: i===2?AMBER:"22375E", width:1 } });
});
kicker(s, "Proptech · Intelligenza Artificiale · Italia", 0.75, 1.35, AMBER);
s.addText("Conforme", { x:0.7, y:1.7, w:9.5, h:1.5, fontFace:HEAD, fontSize:76, bold:true, color:WHITE, margin:0 });
s.addText("L'infrastruttura AI della compravendita immobiliare italiana", {
  x:0.75, y:3.25, w:9.2, h:0.7, fontFace:BODY, fontSize:22, color:ICE, margin:0 });
s.addText([
  { text:"Non un altro portale di annunci. ", options:{ color:MUTE } },
  { text:"Digitalizziamo la parte che fa saltare le compravendite: la conformità.", options:{ color:AMBER, italic:true } }
], { x:0.75, y:4.15, w:9.4, h:0.6, fontFace:BODY, fontSize:15, margin:0 });
s.addText("Pitch per investitore  ·  Luca Martino", {
  x:0.75, y:6.5, w:8, h:0.4, fontFace:BODY, fontSize:13, color:MUTE, margin:0 });

// =========================================================
// SLIDE 2 — THE PROBLEM
// =========================================================
s = p.addSlide(); bg(s, WHITE);
kicker(s, "Il problema", 0.6, 0.55, TERRA);
s.addText("La vetrina è online. La transazione è analogica.", {
  x:0.55, y:0.82, w:12.2, h:0.9, fontFace:HEAD, fontSize:30, bold:true, color:INK, margin:0 });
s.addText("Immobiliare.it e Idealista dominano la vetrina. Ma dietro l'annuncio, la compravendita in Italia è ancora lenta, opaca e manuale, e il collo di bottiglia è sempre lo stesso.", {
  x:0.55, y:1.95, w:8.2, h:0.9, fontFace:BODY, fontSize:16, color:SLATE, margin:0 });

const pains = [
  ["1","La conformità blocca tutto","La difformità catastale/urbanistica è la prima causa di rogiti che saltano o si allungano dal notaio."],
  ["2","I dati vivono in silos","Catasto, archivi edilizi del Comune, visure ipotecarie, APE, vincoli: nessuno di questi sistemi si parla."],
  ["3","Settimane di lavoro manuale","Per ogni immobile servono geometra, notaio e avvocato per ricostruire un dossier che oggi è tutto a mano."]
];
let py = 2.95;
pains.forEach(([n,t,d])=>{
  s.addShape(p.ShapeType.roundRect, { x:0.55, y:py, w:12.2, h:1.15, rectRadius:0.08,
    fill:{ color:CARD }, line:{ color:LINE, width:1 } });
  numCircle(s, 0.85, py+0.28, 0.6, n, TERRA);
  s.addText(t, { x:1.7, y:py+0.16, w:4.6, h:0.5, fontFace:HEAD, fontSize:18, bold:true, color:INK, margin:0, valign:"middle" });
  s.addText(d, { x:6.4, y:py+0.16, w:6.15, h:0.85, fontFace:BODY, fontSize:14, color:SLATE, margin:0, valign:"middle" });
  py += 1.32;
});
pageNum(s, 2, false);

// =========================================================
// SLIDE 3 — THE INSIGHT (dark, stats)
// =========================================================
s = p.addSlide(); bg(s, NAVY);
kicker(s, "L'insight", 0.6, 0.6, AMBER);
s.addText("Chi possiede il layer di conformità e titolo possiede una cosa che in Italia non è mai esistita.", {
  x:0.55, y:0.95, w:12.2, h:1.2, fontFace:HEAD, fontSize:28, bold:true, color:WHITE, margin:0 });

const stats = [
  ["~720.000","compravendite residenziali all'anno in Italia (OMI 2024)","AMBER"],
  ["Milioni","di immobili con difformità catastali o urbanistiche da regolarizzare","WHITE"],
  ["~€120 mld","transato residenziale all'anno (ordine di grandezza)","AMBER"]
];
let sx = 0.55;
stats.forEach(([big,lab,c])=>{
  s.addShape(p.ShapeType.roundRect, { x:sx, y:2.55, w:3.95, h:2.65, rectRadius:0.1,
    fill:{ color:NAVY2 }, line:{ color:"27406B", width:1 } });
  s.addText(big, { x:sx+0.25, y:2.95, w:3.45, h:1.0, fontFace:HEAD, fontSize:44, bold:true,
    color: c==="AMBER"?AMBER:WHITE, margin:0 });
  s.addText(lab, { x:sx+0.25, y:4.0, w:3.5, h:1.05, fontFace:BODY, fontSize:14, color:ICE, margin:0 });
  sx += 4.15;
});
s.addText("L'equivalente di un MLS / registro dei titoli, che il mercato immobiliare italiano, a differenza di quello USA, non ha mai avuto.", {
  x:0.55, y:5.55, w:12.2, h:0.7, fontFace:BODY, fontSize:15, italic:true, color:AMBER, margin:0 });
s.addText("Fonte compravendite: OMI, Agenzia delle Entrate, Rapporto Immobiliare 2025. Transato: stima / ordine di grandezza.", {
  x:0.55, y:6.55, w:11, h:0.3, fontFace:BODY, fontSize:10, color:MUTE, margin:0 });
pageNum(s, 3, true);

// =========================================================
// SLIDE 4 — THE WEDGE / SOLUTION (process flow)
// =========================================================
s = p.addSlide(); bg(s, WHITE);
kicker(s, "La soluzione · il punto d'ingresso", 0.6, 0.55, TERRA);
s.addText("Un agente AI che costruisce e verifica la due diligence in ore, non settimane", {
  x:0.55, y:0.9, w:12.2, h:0.9, fontFace:HEAD, fontSize:28, bold:true, color:INK, margin:0 });

const steps = [
  ["Input","Un indirizzo o un dato catastale. Nient'altro."],
  ["Raccolta","L'agente recupera visure, planimetrie, atti, archivi edilizi e vincoli."],
  ["Verifica AI","Cross-check automatico catastale ↔ urbanistico ↔ stato di fatto; stima difformità e sanabilità."],
  ["Certificato","Un dossier di due diligence pronto per agenzia, notaio, banca o fondo."]
];
const cw = 2.9, gap = 0.28, startx = 0.55, cy = 2.5, ch = 3.0;
steps.forEach(([t,d],i)=>{
  const x = startx + i*(cw+gap);
  s.addShape(p.ShapeType.roundRect, { x, y:cy, w:cw, h:ch, rectRadius:0.09,
    fill:{ color: i===3?NAVY:CARD }, line:{ color: i===3?NAVY:LINE, width:1 } });
  numCircle(s, x+0.28, cy+0.3, 0.62, i+1, i===3?AMBER:TERRA, i===3?NAVY:WHITE);
  s.addText(t, { x:x+0.28, y:cy+1.05, w:cw-0.5, h:0.5, fontFace:HEAD, fontSize:19, bold:true,
    color: i===3?WHITE:INK, margin:0 });
  s.addText(d, { x:x+0.28, y:cy+1.55, w:cw-0.5, h:1.3, fontFace:BODY, fontSize:13,
    color: i===3?ICE:SLATE, margin:0 });
  if(i<3){
    s.addShape(p.ShapeType.rightArrow, { x:x+cw+0.02, y:cy+ch/2-0.12, w:0.24, h:0.24,
      fill:{ color:AMBER } });
  }
});
s.addText([
  { text:"Cliente iniziale = B2B. ", options:{ bold:true, color:INK } },
  { text:"Agenzie di rete, notai, banche (perizie mutui), fondi e SGR, aste. Pagano già oggi per questo lavoro, fatto male e lento. Vendiamo tempo e riduzione del rischio, non “AI”.", options:{ color:SLATE } }
], { x:0.55, y:5.95, w:12.2, h:0.8, fontFace:BODY, fontSize:14, margin:0 });
pageNum(s, 4, false);

// =========================================================
// SLIDE 5 — THE MOAT (data flywheel)
// =========================================================
s = p.addSlide(); bg(s, NAVY);
kicker(s, "Il vantaggio difendibile", 0.6, 0.55, AMBER);
s.addText("Ogni pratica alimenta un dataset che nessuno può copiare dalla vetrina", {
  x:0.55, y:0.9, w:12.2, h:0.9, fontFace:HEAD, fontSize:27, bold:true, color:WHITE, margin:0 });

// central hub
const hubX=5.77, hubY=3.25, hubD=1.8;
s.addShape(p.ShapeType.ellipse, { x:hubX, y:hubY, w:hubD, h:hubD, fill:{ color:AMBER } });
s.addText("DATI\nPROPRIETARI", { x:hubX, y:hubY, w:hubD, h:hubD, align:"center", valign:"middle",
  fontFace:HEAD, fontSize:15, bold:true, color:NAVY, margin:0 });

const nodes = [
  ["Più pratiche di due diligence", 2.55, 2.55],
  ["Più dati verificati di conformità e valore", 7.75, 2.55],
  ["Prodotto e valutazioni più accurate", 7.75, 4.90],
  ["Più clienti, più fiducia, più pratiche", 2.55, 4.90]
];
nodes.forEach(([t,x,y])=>{
  s.addShape(p.ShapeType.roundRect, { x, y, w:3.0, h:1.05, rectRadius:0.09,
    fill:{ color:NAVY2 }, line:{ color:"27406B", width:1 } });
  s.addText(t, { x:x+0.15, y, w:2.7, h:1.05, align:"center", valign:"middle",
    fontFace:BODY, fontSize:13, bold:true, color:ICE, margin:0 });
});
// clockwise loop arrows
[["6.45","2.9","rightArrow",0],["9.15","3.95","rightArrow",90],["6.45","5.25","rightArrow",180],["3.95","3.95","rightArrow",270]]
  .forEach(([ax,ay,sh,rot])=>{
    s.addShape(p.ShapeType[sh], { x:parseFloat(ax), y:parseFloat(ay), w:0.34, h:0.24, rotate:rot, fill:{ color:AMBER } });
  });
s.addText("Effetto rete sui dati: costruiamo, pratica dopo pratica, l'MLS e il registro dei titoli che l'Italia non ha mai avuto.", {
  x:0.55, y:6.35, w:12.2, h:0.6, fontFace:BODY, fontSize:15, italic:true, color:AMBER, margin:0 });
pageNum(s, 5, true);

// =========================================================
// SLIDE 6 — 360 VISION (module grid)
// =========================================================
s = p.addSlide(); bg(s, WHITE);
kicker(s, "La visione a 360°", 0.6, 0.5, TERRA);
s.addText("Dal certificato di conformità alla piattaforma dell'intera transazione", {
  x:0.55, y:0.85, w:12.2, h:0.75, fontFace:HEAD, fontSize:26, bold:true, color:INK, margin:0 });

const mods = [
  ["1","Due Diligence AI","Il punto d'ingresso: certificato di conformità automatizzato.","OGGI"],
  ["2","Valutazione dati-driven","AVM molto più accurato dei dati OMI, basato su transazioni reali.","ESPANSIONE"],
  ["3","Rails della transazione","Notaio, banca, mutuo e rogito orchestrati in digitale.","ESPANSIONE"],
  ["4","Sblocco immobili fermi","Eredità e comproprietà frammentate: mappatura e accordo assistiti.","ESPANSIONE"],
  ["5","Retrofit energetico","Gap di classe, costi e incentivi per la direttiva Case Green.","ESPANSIONE"],
  ["6","Marketplace finanziario","Mutui e finanziamenti ristrutturazione agganciati al dossier.","ESPANSIONE"]
];
const gw=3.95, gh=1.9, gx0=0.55, gy0=1.85, gxg=0.28, gyg=0.28;
mods.forEach((m,i)=>{
  const col=i%3, row=Math.floor(i/3);
  const x=gx0+col*(gw+gxg), y=gy0+row*(gh+gyg);
  const isNow = m[3]==="OGGI";
  s.addShape(p.ShapeType.roundRect, { x, y, w:gw, h:gh, rectRadius:0.08,
    fill:{ color: isNow?NAVY:CARD }, line:{ color: isNow?NAVY:LINE, width:1 } });
  numCircle(s, x+0.28, y+0.28, 0.5, m[0], isNow?AMBER:TERRA, isNow?NAVY:WHITE);
  s.addText(m[3], { x:x+gw-1.8, y:y+0.34, w:1.6, h:0.3, align:"right",
    fontFace:BODY, fontSize:10, bold:true, charSpacing:1.5,
    color: isNow?AMBER:SLATE, margin:0 });
  s.addText(m[1], { x:x+0.28, y:y+0.85, w:gw-0.55, h:0.4, fontFace:HEAD, fontSize:16.5, bold:true,
    color: isNow?WHITE:INK, margin:0 });
  s.addText(m[2], { x:x+0.28, y:y+1.24, w:gw-0.55, h:0.6, fontFace:BODY, fontSize:12.5,
    color: isNow?ICE:SLATE, margin:0 });
});
pageNum(s, 6, false);

// =========================================================
// SLIDE 7 — MARKET (TAM/SAM/SOM)
// =========================================================
s = p.addSlide(); bg(s, WHITE);
kicker(s, "Il mercato", 0.6, 0.5, TERRA);
s.addText("Il mercato target supera di molto il miliardo", {
  x:0.55, y:0.82, w:12.2, h:0.6, fontFace:HEAD, fontSize:27, bold:true, color:INK, margin:0 });
s.addText("La sola due diligence tecnico-legale vale ~€1 mld/anno. Con i servizi alla transazione e l'ondata Case Green, il target è multi-miliardo.", {
  x:0.55, y:1.42, w:12.2, h:0.55, fontFace:BODY, fontSize:14.5, color:SLATE, margin:0 });

const tam = [
  ["TAM","~€120 mld transato residenziale/anno + €280 mld di giro d'affari Case Green potenziale","Mercato immobiliare & riqualificazione in Italia", NAVY, WHITE, ICE, 8.6],
  ["SAM","Multi-miliardo € / anno","Servizi tecnico-legali, valutazione e intelligence energetica digitalizzabili", TERRA, WHITE, "F6E4DE", 6.6],
  ["SOM","Centinaia di mln","Beachhead 0-3 anni: DD B2B per reti, notai, banche, fondi", AMBER, NAVY, "5A4212", 4.6]
];
let ty=2.15;
tam.forEach(([k,v,d,c,tc,dc,ww])=>{
  s.addShape(p.ShapeType.roundRect, { x:0.55, y:ty, w:ww, h:1.3, rectRadius:0.09, fill:{ color:c } });
  s.addText(k, { x:0.8, y:ty+0.15, w:1.5, h:1.0, fontFace:HEAD, fontSize:30, bold:true, color:tc, margin:0, valign:"middle" });
  s.addText(v, { x:2.25, y:ty+0.22, w:ww-1.65, h:0.5, fontFace:HEAD, fontSize:17, bold:true, color:tc, margin:0 });
  s.addText(d, { x:2.25, y:ty+0.72, w:ww-1.65, h:0.5, fontFace:BODY, fontSize:12.5, color:dc, margin:0 });
  ty += 1.5;
});
// right proof box
s.addShape(p.ShapeType.roundRect, { x:9.35, y:2.15, w:3.4, h:4.3, rectRadius:0.09, fill:{ color:NAVY }, line:{ color:NAVY, width:1 } });
s.addText("I numeri che reggono la tesi", { x:9.6, y:2.35, w:2.95, h:0.7, fontFace:HEAD, fontSize:14, bold:true, color:AMBER, margin:0 });
s.addText([
  { text:"719.578 ", options:{ bold:true, color:WHITE } },
  { text:"compravendite residenziali (2024)\n", options:{ color:ICE, breakLine:true } },
  { text:"€2,8 mld ", options:{ bold:true, color:WHITE } },
  { text:"ricavi intermediazione; €36 mld servizi immobiliari\n", options:{ color:ICE, breakLine:true } },
  { text:"€85 mld ", options:{ bold:true, color:WHITE } },
  { text:"investimenti Case Green entro il 2030\n", options:{ color:ICE, breakLine:true } },
  { text:"~500.000 ", options:{ bold:true, color:WHITE } },
  { text:"abitazioni/anno da riqualificare", options:{ color:ICE } }
], { x:9.6, y:3.15, w:2.95, h:3.2, fontFace:BODY, fontSize:12.5, margin:0, paraSpaceAfter:11 });
s.addText("Fonti: OMI–Agenzia delle Entrate (2024); Il Sole 24 Ore; ACCA/BibLus, rinnovabili.it (EPBD). SAM/SOM: stime, da validare in diligence.", {
  x:0.55, y:6.62, w:8.6, h:0.5, fontFace:BODY, fontSize:9.5, color:SLATE, margin:0 });
pageNum(s, 7, false);

// =========================================================
// SLIDE 8 — BUSINESS MODEL (streams + chart)
// =========================================================
s = p.addSlide(); bg(s, NAVY);
kicker(s, "Il modello di ricavi", 0.6, 0.55, AMBER);
s.addText("Quattro flussi che si accendono in sequenza", {
  x:0.55, y:0.9, w:8, h:0.8, fontFace:HEAD, fontSize:27, bold:true, color:WHITE, margin:0 });

const streams = [
  ["Pay-per-dossier / SaaS","Reti di agenzie e notai: canone + pratica"],
  ["Enterprise","Banche, SGR e fondi: contratti a volume"],
  ["Dati & AVM in licenza","Valutazioni e dataset di conformità"],
  ["Take-rate transazioni","Mutui e finanziamenti (fase 2)"]
];
let by2=2.3;
streams.forEach(([t,d],i)=>{
  s.addShape(p.ShapeType.roundRect, { x:0.55, y:by2, w:5.7, h:0.95, rectRadius:0.08,
    fill:{ color:NAVY2 }, line:{ color:"27406B", width:1 } });
  numCircle(s, 0.78, by2+0.2, 0.55, i+1, AMBER, NAVY);
  s.addText(t, { x:1.5, y:by2+0.12, w:4.6, h:0.42, fontFace:HEAD, fontSize:15.5, bold:true, color:WHITE, margin:0 });
  s.addText(d, { x:1.5, y:by2+0.52, w:4.6, h:0.35, fontFace:BODY, fontSize:12, color:MUTE, margin:0 });
  by2 += 1.08;
});

// stacked column: revenue mix growth
const chartData = [
  { name:"SaaS / dossier", labels:["Anno 1","Anno 2","Anno 3"], values:[70,45,30] },
  { name:"Enterprise",     labels:["Anno 1","Anno 2","Anno 3"], values:[30,35,32] },
  { name:"Dati & AVM",     labels:["Anno 1","Anno 2","Anno 3"], values:[0,15,22] },
  { name:"Take-rate",      labels:["Anno 1","Anno 2","Anno 3"], values:[0,5,16] }
];
s.addText("Mix di ricavi nel tempo (illustrativo, % del fatturato)", {
  x:6.7, y:2.05, w:6, h:0.35, fontFace:BODY, fontSize:12, bold:true, color:ICE, margin:0 });
s.addChart(p.ChartType.bar, chartData, {
  x:6.6, y:2.5, w:6.2, h:4.1, barDir:"col", barGrouping:"stacked",
  chartColors:[AMBER, "6FA8DC", TERRA, "7FC8A9"],
  showValue:true, dataLabelPosition:"ctr", dataLabelColor:NAVY, dataLabelFontFace:BODY, dataLabelFontSize:9, dataLabelFormatCode:'0"%"',
  showLegend:true, legendPos:"b", legendColor:ICE, legendFontFace:BODY, legendFontSize:11,
  catAxisLabelColor:ICE, catAxisLabelFontFace:BODY, catAxisLabelFontSize:11,
  valAxisHidden:true, valGridLine:{ style:"none" }, catGridLine:{ style:"none" },
  showTitle:false, chartColorsOpacity:100
});
pageNum(s, 8, true);

// =========================================================
// SLIDE 9 — COMPETITIVE MATRIX
// =========================================================
s = p.addSlide(); bg(s, WHITE);
kicker(s, "Analisi competitiva · panorama", 0.6, 0.5, TERRA);
s.addText("Il quadrante “conformità AI + dati Italia” è vuoto", {
  x:0.55, y:0.82, w:12.2, h:0.6, fontFace:HEAD, fontSize:27, bold:true, color:INK, margin:0 });
s.addText("Ogni layer della filiera ha un player forte. Nessuno presidia la conformità/titolo con AI e dati pubblici italiani.", {
  x:0.55, y:1.42, w:12.2, h:0.5, fontFace:BODY, fontSize:14.5, color:SLATE, margin:0 });
s.addText("Più AI-native · dati Italia", { x:-1.55, y:3.85, w:3.9, h:0.3, rotate:270,
  fontFace:BODY, fontSize:11, bold:true, color:SLATE, align:"center", margin:0 });
s.addText("Copertura del layer:  vetrina → conformità → transazione", {
  x:2.7, y:6.42, w:9.5, h:0.3, fontFace:BODY, fontSize:11, bold:true, color:SLATE, margin:0 });
function qcell(x,y,w,h,hdr,players,hi){
  s.addShape(p.ShapeType.roundRect, { x, y, w, h, rectRadius:0.08,
    fill:{ color: hi?NAVY:CARD }, line:{ color: hi?NAVY:LINE, width:1 } });
  s.addText(hdr, { x:x+0.22, y:y+0.16, w:w-0.4, h:0.55, fontFace:HEAD, fontSize:12.5, bold:true,
    color: hi?AMBER:TERRA, margin:0 });
  if(hi){
    s.addText("CONFORME", { x:x+0.22, y:y+0.78, w:w-0.4, h:0.5, fontFace:HEAD, fontSize:24, bold:true, color:AMBER, margin:0 });
    s.addText("Orbital (UK) · non opera in Italia", { x:x+0.22, y:y+1.38, w:w-0.4, h:0.4, fontFace:BODY, fontSize:10.5, italic:true, color:MUTE, margin:0 });
  } else {
    s.addText(players, { x:x+0.22, y:y+0.75, w:w-0.4, h:h-0.9, fontFace:BODY, fontSize:12, color:SLATE, margin:0 });
  }
}
const cW=4.85,cH=1.9,cLx=2.7,cRx=7.7,cTy=2.15,cBy=4.2;
qcell(cLx,cTy,cW,cH,"Valutazione AI, solo il prezzo","Reopla / Sprengnetter · CRIF RES · Nomisma · PriceHubble",false);
qcell(cRx,cTy,cW,cH,"Conformità + transazione · AI-native",null,true);
qcell(cLx,cBy,cW,cH,"Vetrina & generazione lead","Immobiliare.it · Idealista · Casa.it · Wikicasa",false);
qcell(cRx,cBy,cW,cH,"Transazione manuale o capital-heavy","iBuyer Casavo · studi di DD (geometri/architetti) · notai",false);
pageNum(s, 9, false);

// =========================================================
// SLIDE 10 — COMPETITOR TABLE
// =========================================================
s = p.addSlide(); bg(s, WHITE);
kicker(s, "Analisi competitiva · dettaglio", 0.6, 0.5, TERRA);
s.addText("Chi fa cosa, e dove si ferma", {
  x:0.55, y:0.82, w:12.2, h:0.6, fontFace:HEAD, fontSize:27, bold:true, color:INK, margin:0 });
const tcols=[[0.55,2.55],[3.15,1.75],[4.95,3.05],[8.05,2.9],[11.0,1.75]];
const theads=["Player","Categoria","Punto di forza","Dove si ferma","Minaccia"];
const thy=1.75;
s.addShape(p.ShapeType.roundRect, { x:0.55, y:thy, w:12.2, h:0.5, rectRadius:0.06, fill:{ color:NAVY } });
theads.forEach((h,i)=>s.addText(h, { x:tcols[i][0]+0.12, y:thy, w:tcols[i][1]-0.15, h:0.5,
  fontFace:BODY, fontSize:11.5, bold:true, color:WHITE, valign:"middle", margin:0 }));
const trows=[
["Immobiliare.it · Idealista","Portali annunci","Vetrina, lead e traffico dominante","Non toccano conformità né transazione","Bassa","g"],
["Casavo","iBuyer","Liquidità in ~30 gg; €385M raccolti","DD interna, non è un prodotto; capital-heavy","Media","a"],
["Reopla · CRIF RES · Nomisma","AVM / valutazione","Stime automatiche accurate, a scala","Solo il prezzo, non conformità/titolo","Media","a"],
["Studi geometri/architetti","DD tradizionale","Competenza normativa profonda","Manuale, frammentata, non AI-native","Bassa","g"],
["Deepki · piattaforme retrofit","Energy / Case Green","Dati energetici e ristrutturazione","Non toccano titolo né transazione","Bassa","g"],
["Orbital (UK)","AI DD legale RE","$60M Series B; 200k transazioni/anno","Focus UK/US; catasto e conformità IT non replicabili","Futura","a"]
];
let tby=2.3; const trh=0.56;
trows.forEach((r,i)=>{
  if(i%2===1) s.addShape(p.ShapeType.roundRect, { x:0.55, y:tby, w:12.2, h:trh, rectRadius:0.02, fill:{ color:"EEF3FA" } });
  s.addText(r[0], { x:tcols[0][0]+0.12, y:tby, w:tcols[0][1]-0.15, h:trh, fontFace:BODY, fontSize:11, bold:true, color:INK, valign:"middle", margin:0 });
  s.addText(r[1], { x:tcols[1][0]+0.12, y:tby, w:tcols[1][1]-0.15, h:trh, fontFace:BODY, fontSize:10.5, color:SLATE, valign:"middle", margin:0 });
  s.addText(r[2], { x:tcols[2][0]+0.12, y:tby, w:tcols[2][1]-0.15, h:trh, fontFace:BODY, fontSize:10.5, color:SLATE, valign:"middle", margin:0 });
  s.addText(r[3], { x:tcols[3][0]+0.12, y:tby, w:tcols[3][1]-0.15, h:trh, fontFace:BODY, fontSize:10.5, color:SLATE, valign:"middle", margin:0 });
  s.addText(r[4], { x:tcols[4][0]+0.12, y:tby, w:tcols[4][1]-0.15, h:trh, fontFace:BODY, fontSize:10.5, bold:true, color: r[5]==="g"?"3E8E5A":TERRA, valign:"middle", margin:0 });
  tby+=trh;
});
s.addShape(p.ShapeType.roundRect, { x:0.55, y:tby+0.12, w:12.2, h:0.62, rectRadius:0.06, fill:{ color:NAVY } });
s.addText([
  { text:"Il quadrante conformità-AI su dati italiani è vuoto: ", options:{ color:AMBER, bold:true } },
  { text:"chi lo occupa per primo costruisce il data-moat che lo blinda, e diventa il layer su cui poggiano tutti gli altri.", options:{ color:ICE } }
], { x:0.8, y:tby+0.12, w:12.0, h:0.62, fontFace:BODY, fontSize:13, valign:"middle", margin:0 });
s.addText("Fonti: EU-Startups / Brighton Park (Orbital, Series B 2026); Economyup / Silicon Canals (Casavo, Reopla); CRIF RES. Dati a inizio 2026.", {
  x:0.55, y:tby+0.9, w:12.2, h:0.3, fontFace:BODY, fontSize:9, color:SLATE, margin:0 });
pageNum(s, 10, false);

// =========================================================
// SLIDE 11 — INTERNATIONAL VALIDATION (fast-follower)
// =========================================================
s = p.addSlide(); bg(s, NAVY);
kicker(s, "Validazione internazionale", 0.6, 0.5, AMBER);
s.addText("Il modello funziona già all'estero. In Italia il campo è aperto.", {
  x:0.55, y:0.78, w:12.2, h:1.0, fontFace:HEAD, fontSize:25, bold:true, color:WHITE, margin:0 });
s.addText("Chi digitalizza conformità e transazione immobiliare, fuori dall'Italia, diventa unicorno o monopolio quotato.", {
  x:0.55, y:1.92, w:12.2, h:0.4, fontFace:BODY, fontSize:14, color:MUTE, margin:0 });
const proofs = [
  ["REGNO UNITO","Orbital","$60M","Series B (2026) per l'AI di due diligence legale immobiliare. ~200k transazioni/anno."],
  ["USA","Qualia","~$1 mld","Valutazione da unicorno; infrastruttura di title & closing. ~$207M raccolti."],
  ["AUSTRALIA","PEXA","~AU$2 mld","Capitalizzazione in borsa (ASX); ~90% delle transazioni immobiliari nazionali sul suo exchange."]
];
let ppx = 0.55;
proofs.forEach(([country,name,big,d])=>{
  s.addShape(p.ShapeType.roundRect, { x:ppx, y:2.5, w:3.95, h:2.85, rectRadius:0.1,
    fill:{ color:NAVY2 }, line:{ color:"27406B", width:1 } });
  s.addText(country, { x:ppx+0.25, y:2.73, w:3.4, h:0.3, fontFace:BODY, fontSize:11, bold:true, color:AMBER, charSpacing:1.5, margin:0 });
  s.addText(name, { x:ppx+0.25, y:3.05, w:3.4, h:0.5, fontFace:HEAD, fontSize:20, bold:true, color:WHITE, margin:0 });
  s.addText(big, { x:ppx+0.25, y:3.67, w:3.5, h:0.7, fontFace:HEAD, fontSize:34, bold:true, color:AMBER, margin:0 });
  s.addText(d, { x:ppx+0.25, y:4.5, w:3.5, h:0.8, fontFace:BODY, fontSize:12.5, color:ICE, margin:0 });
  ppx += 4.15;
});
s.addShape(p.ShapeType.roundRect, { x:0.55, y:5.5, w:12.2, h:0.82, rectRadius:0.08, fill:{ color:"0A1730" }, line:{ color:AMBER, width:1 } });
s.addText([
  { text:"In Italia non esiste nessuno di questi. ", options:{ color:AMBER, bold:true } },
  { text:"E il problema, conformità e catasto, è più grande: noi replichiamo il modello e lo adattiamo, per essere il primo player italiano.", options:{ color:ICE } }
], { x:0.85, y:5.5, w:11.6, h:0.82, fontFace:BODY, fontSize:14, valign:"middle", margin:0 });
s.addText("Fonti: Orbital / Brighton Park (Series B 2026); Qualia (Series D, unicorno ~$1 mld); PEXA Group (ASX: PXA). Cifre indicative.", {
  x:0.55, y:6.5, w:12.2, h:0.3, fontFace:BODY, fontSize:9, color:MUTE, margin:0 });
pageNum(s, 11, false);

// =========================================================
// SLIDE 12 — WHY NOW
// =========================================================
s = p.addSlide(); bg(s, WHITE);
kicker(s, "Perché adesso", 0.6, 0.55, TERRA);
s.addText("Tre venti a favore convergono nel 2026", {
  x:0.55, y:0.9, w:12, h:0.8, fontFace:HEAD, fontSize:28, bold:true, color:INK, margin:0 });

const now = [
  ["Direttiva UE “Case Green”","La EPBD (recepimento entro maggio 2026) impone l'adeguamento di ~500.000 abitazioni/anno: ~€85 mld di investimenti entro il 2030. Domanda forzata e finanziabile.", TERRA],
  ["Agenti AI finalmente maturi","I compiti document-heavy e rule-heavy, come leggere visure, incrociare planimetrie e verificare regole, sono ora automatizzabili con affidabilità.", NAVY],
  ["Eredità del Superbonus","Un ecosistema di dati, cantieri e pratiche edilizie mai visto prima, oggi disponibile per essere strutturato.", AMBER]
];
let ny=2.35;
now.forEach(([t,d,c],i)=>{
  s.addShape(p.ShapeType.roundRect, { x:0.55, y:ny, w:12.2, h:1.35, rectRadius:0.09,
    fill:{ color:CARD }, line:{ color:LINE, width:1 } });
  s.addShape(p.ShapeType.ellipse, { x:0.85, y:ny+0.37, w:0.62, h:0.62, fill:{ color:c } });
  s.addText(String(i+1), { x:0.85, y:ny+0.37, w:0.62, h:0.62, align:"center", valign:"middle",
    fontFace:HEAD, fontSize:18, bold:true, color: c===AMBER?NAVY:WHITE, margin:0 });
  s.addText(t, { x:1.75, y:ny+0.2, w:4.5, h:0.95, fontFace:HEAD, fontSize:18, bold:true, color:INK, margin:0, valign:"middle" });
  s.addText(d, { x:6.35, y:ny+0.18, w:6.2, h:1.0, fontFace:BODY, fontSize:13.5, color:SLATE, margin:0, valign:"middle" });
  ny += 1.5;
});
pageNum(s, 12, false);

// =========================================================
// SLIDE 10 — WHY US
// =========================================================
s = p.addSlide(); bg(s, NAVY);
kicker(s, "Perché noi", 0.6, 0.55, AMBER);
s.addText("Non scommettiamo sull'AI da costruire. Verticalizziamo una piattaforma che già esiste.", {
  x:0.55, y:0.9, w:12.2, h:1.2, fontFace:HEAD, fontSize:26, bold:true, color:WHITE, margin:0 });

const why = [
  ["Piattaforma agentica pronta","L'infrastruttura AI agentica è già in produzione: non la costruiamo da zero."],
  ["Competenza AI enterprise","Esperienza consolidata di AI enterprise e integrazione su processi complessi."],
  ["Time-to-market","Partiamo da una vertical application su un mercato rotto, non da un foglio bianco."]
];
let wy=2.7;
why.forEach(([t,d],i)=>{
  s.addShape(p.ShapeType.roundRect, { x:0.55, y:wy, w:6.4, h:1.2, rectRadius:0.09,
    fill:{ color:NAVY2 }, line:{ color:"27406B", width:1 } });
  s.addText(t, { x:0.85, y:wy+0.16, w:5.8, h:0.45, fontFace:HEAD, fontSize:18, bold:true, color:AMBER, margin:0 });
  s.addText(d, { x:0.85, y:wy+0.6, w:5.9, h:0.55, fontFace:BODY, fontSize:13, color:ICE, margin:0 });
  wy += 1.35;
});
// right: stack diagram
s.addShape(p.ShapeType.roundRect, { x:7.5, y:2.7, w:5.25, h:3.9, rectRadius:0.1, fill:{ color:"0A1730" }, line:{ color:"27406B", width:1 } });
s.addText("Lo stack", { x:7.8, y:2.9, w:4, h:0.4, fontFace:HEAD, fontSize:15, bold:true, color:MUTE, margin:0 });
s.addShape(p.ShapeType.roundRect, { x:7.85, y:3.4, w:4.55, h:0.95, rectRadius:0.08, fill:{ color:AMBER } });
s.addText("Conforme", { x:7.85, y:3.5, w:4.55, h:0.4, align:"center", fontFace:HEAD, fontSize:18, bold:true, color:NAVY, margin:0 });
s.addText("vertical app · real estate Italia", { x:7.85, y:3.92, w:4.55, h:0.35, align:"center", fontFace:BODY, fontSize:11, color:NAVY, margin:0 });
s.addShape(p.ShapeType.roundRect, { x:7.85, y:4.55, w:4.55, h:0.85, rectRadius:0.08, fill:{ color:NAVY2 }, line:{ color:AMBER, width:1 } });
s.addText("Piattaforma agentica in produzione", { x:7.85, y:4.55, w:4.55, h:0.85, align:"center", valign:"middle", fontFace:HEAD, fontSize:14, bold:true, color:WHITE, margin:0 });
s.addShape(p.ShapeType.roundRect, { x:7.85, y:5.55, w:4.55, h:0.8, rectRadius:0.08, fill:{ color:"0E2140" }, line:{ color:"27406B", width:1 } });
s.addText("Competenza AI enterprise", { x:7.85, y:5.55, w:4.55, h:0.8, align:"center", valign:"middle", fontFace:BODY, fontSize:13, color:ICE, margin:0 });
pageNum(s, 13, true);

// =========================================================
// SLIDE 11 — ROADMAP
// =========================================================
s = p.addSlide(); bg(s, WHITE);
kicker(s, "Roadmap", 0.6, 0.55, TERRA);
s.addText("Dal wedge alla piattaforma, in tre fasi", {
  x:0.55, y:0.9, w:12, h:0.8, fontFace:HEAD, fontSize:28, bold:true, color:INK, margin:0 });

const phases = [
  ["Fase 1","0-18 mesi","Il wedge","Agente di due diligence in produzione. Primi clienti B2B: reti, notai, banche. Costruzione del dataset proprietario.", TERRA],
  ["Fase 2","18-36 mesi","Dati & transazione","AVM proprietario, rails della transazione digitale, sblocco degli immobili fermi. Il data-moat diventa prodotto.", NAVY],
  ["Fase 3","36 mesi +","Piattaforma 360°","Intelligence energetica Case Green e marketplace finanziario. Scala nazionale, poi replicabilità europea.", AMBER]
];
const pw=3.95, px0=0.55, pxg=0.28, pcy=2.35, pch=3.9;
phases.forEach((ph,i)=>{
  const x=px0+i*(pw+pxg);
  s.addShape(p.ShapeType.roundRect, { x, y:pcy, w:pw, h:pch, rectRadius:0.1,
    fill:{ color: i===0?NAVY:CARD }, line:{ color: i===0?NAVY:LINE, width:1 } });
  s.addShape(p.ShapeType.roundRect, { x:x+0.3, y:pcy+0.35, w:1.7, h:0.5, rectRadius:0.25, fill:{ color: ph[4] } });
  s.addText(ph[0], { x:x+0.3, y:pcy+0.35, w:1.7, h:0.5, align:"center", valign:"middle",
    fontFace:HEAD, fontSize:15, bold:true, color: ph[4]===AMBER?NAVY:WHITE, margin:0 });
  s.addText(ph[1], { x:x+0.3, y:pcy+1.0, w:pw-0.6, h:0.35, fontFace:BODY, fontSize:12, bold:true,
    color: i===0?AMBER:SLATE, charSpacing:1, margin:0 });
  s.addText(ph[2], { x:x+0.3, y:pcy+1.4, w:pw-0.6, h:0.6, fontFace:HEAD, fontSize:19, bold:true,
    color: i===0?WHITE:INK, margin:0 });
  s.addText(ph[3], { x:x+0.3, y:pcy+2.05, w:pw-0.6, h:1.6, fontFace:BODY, fontSize:13,
    color: i===0?ICE:SLATE, margin:0 });
});
pageNum(s, 14, false);

// =========================================================
// SLIDE 12 — THE ASK / CLOSING
// =========================================================
s = p.addSlide(); bg(s, NAVY);
s.addShape(p.ShapeType.roundRect, { x:11.3, y:0.7, w:0.5, h:1.3, rectRadius:0.06, fill:{ color:NAVY2 } });
s.addShape(p.ShapeType.roundRect, { x:11.9, y:1.2, w:0.5, h:0.8, rectRadius:0.06, fill:{ color:AMBER } });
kicker(s, "La proposta", 0.7, 1.1, AMBER);
s.addText("Costruiamo il layer di fiducia della compravendita immobiliare italiana.", {
  x:0.7, y:1.5, w:11, h:1.8, fontFace:HEAD, fontSize:38, bold:true, color:WHITE, margin:0 });
s.addText([
  { text:"Immobiliare.it ha digitalizzato l'annuncio. ", options:{ color:ICE } },
  { text:"Noi digitalizziamo la parte che fa saltare le compravendite, la conformità, e da lì diventiamo il layer di dati e transazione che il mercato immobiliare italiano non ha mai avuto.", options:{ color:AMBER, italic:true } }
], { x:0.7, y:3.45, w:11.4, h:1.2, fontFace:BODY, fontSize:18, margin:0 });

const asks = [
  ["Capitale","per team tecnico + verticale legale e go-to-market B2B"],
  ["18 mesi","per portare il wedge in produzione e costruire il data-moat"],
  ["Obiettivo","essere il primo player del layer di conformità in Italia"]
];
let ax=0.7;
asks.forEach(([t,d])=>{
  s.addShape(p.ShapeType.roundRect, { x:ax, y:5.0, w:3.85, h:1.35, rectRadius:0.09, fill:{ color:NAVY2 }, line:{ color:"27406B", width:1 } });
  s.addText(t, { x:ax+0.25, y:5.15, w:3.4, h:0.5, fontFace:HEAD, fontSize:19, bold:true, color:AMBER, margin:0 });
  s.addText(d, { x:ax+0.25, y:5.65, w:3.45, h:0.6, fontFace:BODY, fontSize:12.5, color:ICE, margin:0 });
  ax += 4.05;
});
s.addText("Luca Martino", {
  x:0.7, y:6.75, w:10, h:0.4, fontFace:BODY, fontSize:13, color:MUTE, margin:0 });

p.writeFile({ fileName: "/home/user/Luca/proptech-deck/Conforme_Pitch.pptx" }).then(f=>console.log("Saved:", f));
