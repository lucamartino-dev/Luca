// Generates conforme.html — 12 slides, coordinates in inches mirroring the pptx.
const fs = require("fs");

const C = {
  NAVY:"#0E1E38", NAVY2:"#17294A", NAVY3:"#0A1730", AMBER:"#E8A33D", TERRA:"#C0563C",
  ICE:"#EAF1FA", WHITE:"#FFFFFF", INK:"#16233B", SLATE:"#5C6C87", MUTE:"#9DB0CC",
  CARD:"#F4F7FC", LINE:"#D9E2EF", BORD:"#27406B"
};
const HEAD = "'DejaVu Serif', 'FreeSerif', serif";
const BODY = "'DejaVu Sans', 'FreeSans', sans-serif";

let out = [];
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

function slide(bg){ out.push(`<section class="slide" style="background:${bg}">`); }
function end(){ out.push(`</section>`); }

function box(x,y,w,h,o={}){
  const s=[`left:${x}in`,`top:${y}in`,`width:${w}in`,`height:${h}in`];
  if(o.fill) s.push(`background:${o.fill}`);
  s.push(`border-radius:${o.r!=null?o.r:0.09}in`);
  if(o.border) s.push(`border:${o.bw||1}px solid ${o.border}`);
  if(o.shadow) s.push(`box-shadow:0 3px 10px rgba(0,0,0,0.10)`);
  out.push(`<div class="abs" style="${s.join(';')}"></div>`);
}
function text(x,y,w,h,html,o={}){
  const s=[`left:${x}in`,`top:${y}in`,`width:${w}in`,`height:${h}in`];
  s.push(`font-family:${o.face||BODY}`);
  s.push(`font-size:${o.size||14}pt`);
  s.push(`color:${o.color||C.INK}`);
  if(o.bold) s.push(`font-weight:700`);
  if(o.italic) s.push(`font-style:italic`);
  s.push(`text-align:${o.align||'left'}`);
  if(o.spacing) s.push(`letter-spacing:${o.spacing}px`);
  s.push(`line-height:${o.lh||1.18}`);
  const jc = o.valign==='middle'?'center':(o.valign==='bottom'?'flex-end':'flex-start');
  s.push(`display:flex;flex-direction:column;justify-content:${jc}`);
  out.push(`<div class="abs txt" style="${s.join(';')}">${html}</div>`);
}
function circle(x,y,d,n,fill,txt){
  out.push(`<div class="abs" style="left:${x}in;top:${y}in;width:${d}in;height:${d}in;border-radius:50%;background:${fill};display:flex;align-items:center;justify-content:center;font-family:${HEAD};font-weight:700;font-size:${d*26}pt;color:${txt||C.WHITE}">${n}</div>`);
}
function ellipse(x,y,w,h,fill){
  out.push(`<div class="abs" style="left:${x}in;top:${y}in;width:${w}in;height:${h}in;border-radius:50%;background:${fill}"></div>`);
}
function kicker(x,y,t,col){ text(x,y,7,0.3,esc(t.toUpperCase()),{size:11,bold:true,color:col,spacing:2.5,face:BODY}); }
function foot(n,dark){
  text(0.6,7.0,3,0.3,"CONFORME",{size:9,bold:true,color:dark?C.MUTE:C.SLATE,spacing:2});
  text(12.0,7.0,0.7,0.3,String(n).padStart(2,'0'),{size:9,color:dark?C.MUTE:C.SLATE,align:'right'});
}

// ---------- Slide 1 ----------
slide(C.NAVY);
box(10.9,4.9,0.55,1.5,{fill:C.NAVY2,r:0.06,border:C.BORD});
box(11.55,5.6,0.55,0.9,{fill:C.NAVY2,r:0.06,border:C.BORD});
box(12.15,4.2,0.55,2.3,{fill:C.AMBER,r:0.06});
kicker(0.75,1.35,"Proptech · Intelligenza Artificiale · Italia",C.AMBER);
text(0.7,1.65,10,1.4,"Conforme",{size:76,bold:true,color:C.WHITE,face:HEAD});
text(0.75,3.2,9.4,0.7,"L'infrastruttura AI della compravendita immobiliare italiana",{size:22,color:C.ICE});
text(0.75,4.15,9.6,0.6,`<span style="color:${C.MUTE}">Non un altro portale di annunci. </span><span style="color:${C.AMBER};font-style:italic">Digitalizziamo la parte che fa saltare le compravendite: la conformità.</span>`,{size:15});
text(0.75,6.5,8,0.4,"Pitch per investitore  ·  Luca Martino",{size:13,color:C.MUTE});
end();

// ---------- Slide 2 ----------
slide(C.WHITE);
kicker(0.6,0.55,"Il problema",C.TERRA);
text(0.55,0.82,12.2,0.9,"La vetrina è online. La transazione è analogica.",{size:30,bold:true,color:C.INK,face:HEAD});
text(0.55,1.95,8.2,0.9,"Immobiliare.it e Idealista dominano la vetrina. Ma dietro l'annuncio, la compravendita in Italia è ancora lenta, opaca e manuale, e il collo di bottiglia è sempre lo stesso.",{size:15,color:C.SLATE});
const pains=[["1","La conformità blocca tutto","La difformità catastale/urbanistica è la prima causa di rogiti che saltano o si allungano dal notaio."],
["2","I dati vivono in silos","Catasto, archivi edilizi del Comune, visure ipotecarie, APE, vincoli: nessuno di questi sistemi si parla."],
["3","Settimane di lavoro manuale","Per ogni immobile servono geometra, notaio e avvocato per ricostruire un dossier che oggi è tutto a mano."]];
let py=2.95;
pains.forEach(([n,t,d])=>{
  box(0.55,py,12.2,1.15,{fill:C.CARD,border:C.LINE});
  circle(0.85,py+0.28,0.6,n,C.TERRA);
  text(1.7,py,4.6,1.15,esc(t),{size:18,bold:true,color:C.INK,face:HEAD,valign:'middle'});
  text(6.4,py,6.15,1.15,esc(d),{size:14,color:C.SLATE,valign:'middle'});
  py+=1.32;
});
foot(2,false);
end();

// ---------- Slide 3 ----------
slide(C.NAVY);
kicker(0.6,0.6,"L'insight",C.AMBER);
text(0.55,0.95,12.2,1.2,"Chi possiede il layer di conformità e titolo possiede una cosa che in Italia non è mai esistita.",{size:28,bold:true,color:C.WHITE,face:HEAD});
const stats=[["~720.000","compravendite residenziali all'anno in Italia (OMI 2024)",C.AMBER],
["Milioni","di immobili con difformità catastali o urbanistiche da regolarizzare",C.WHITE],
["~€120 mld","transato residenziale all'anno (ordine di grandezza)",C.AMBER]];
let sx=0.55;
stats.forEach(([big,lab,c])=>{
  box(sx,2.55,3.95,2.65,{fill:C.NAVY2,border:C.BORD});
  text(sx+0.25,2.9,3.5,1.0,esc(big),{size:40,bold:true,color:c,face:HEAD});
  text(sx+0.25,4.0,3.5,1.05,esc(lab),{size:14,color:C.ICE});
  sx+=4.15;
});
text(0.55,5.55,12.2,0.7,"L'equivalente di un MLS / registro dei titoli, che il mercato immobiliare italiano, a differenza di quello USA, non ha mai avuto.",{size:15,italic:true,color:C.AMBER});
text(0.55,6.55,11,0.3,"Fonte compravendite: OMI, Agenzia delle Entrate, Rapporto Immobiliare 2025. Transato: stima / ordine di grandezza.",{size:9.5,color:C.MUTE});
foot(3,true);
end();

// ---------- Slide 4 ----------
slide(C.WHITE);
kicker(0.6,0.55,"La soluzione · il punto d'ingresso",C.TERRA);
text(0.55,0.9,12.2,0.9,"Un agente AI che costruisce e verifica la due diligence in ore, non settimane",{size:26,bold:true,color:C.INK,face:HEAD});
const steps=[["Input","Un indirizzo o un dato catastale. Nient'altro."],
["Raccolta","L'agente recupera visure, planimetrie, atti, archivi edilizi e vincoli."],
["Verifica AI","Cross-check automatico catastale ↔ urbanistico ↔ stato di fatto; stima difformità e sanabilità."],
["Certificato","Un dossier di due diligence pronto per agenzia, notaio, banca o fondo."]];
const cw=2.9,gap=0.28,startx=0.55,cy=2.5,ch=3.0;
steps.forEach(([t,d],i)=>{
  const x=startx+i*(cw+gap), now=i===3;
  box(x,cy,cw,ch,{fill:now?C.NAVY:C.CARD,border:now?C.NAVY:C.LINE});
  circle(x+0.28,cy+0.3,0.62,i+1,now?C.AMBER:C.TERRA,now?C.NAVY:C.WHITE);
  text(x+0.28,cy+1.05,cw-0.5,0.5,esc(t),{size:19,bold:true,color:now?C.WHITE:C.INK,face:HEAD});
  text(x+0.28,cy+1.55,cw-0.5,1.3,esc(d),{size:13,color:now?C.ICE:C.SLATE});
  if(i<3) out.push(`<div class="abs" style="left:${x+cw+0.02}in;top:${cy+ch/2-0.13}in;font-size:20pt;color:${C.AMBER};font-weight:700">▶</div>`);
});
text(0.55,5.95,12.2,0.8,`<span style="font-weight:700;color:${C.INK}">Cliente iniziale = B2B. </span><span style="color:${C.SLATE}">Agenzie di rete, notai, banche (perizie mutui), fondi e SGR, aste. Pagano già oggi per questo lavoro, fatto male e lento. Vendiamo tempo e riduzione del rischio, non "AI".</span>`,{size:14});
foot(4,false);
end();

// ---------- Slide 5 ----------
slide(C.NAVY);
kicker(0.6,0.55,"Il vantaggio difendibile",C.AMBER);
text(0.55,0.9,12.2,0.9,"Ogni pratica alimenta un dataset che nessuno può copiare dalla vetrina",{size:27,bold:true,color:C.WHITE,face:HEAD});
ellipse(5.77,3.25,1.8,1.8,C.AMBER);
text(5.77,3.25,1.8,1.8,"DATI<br>PROPRIETARI",{size:15,bold:true,color:C.NAVY,face:HEAD,align:'center',valign:'middle'});
const nodes=[["Più pratiche di due diligence",2.55,2.55],["Più dati verificati di conformità e valore",7.75,2.55],
["Prodotto e valutazioni più accurate",7.75,4.90],["Più clienti, più fiducia, più pratiche",2.55,4.90]];
nodes.forEach(([t,x,y])=>{
  box(x,y,3.0,1.05,{fill:C.NAVY2,border:C.BORD});
  text(x+0.15,y,2.7,1.05,esc(t),{size:13,bold:true,color:C.ICE,align:'center',valign:'middle'});
});
// arrows around the clockwise loop
const arr=[[6.45,2.85,"→"],[9.12,3.9,"↓"],[6.45,5.2,"←"],[3.9,3.9,"↑"]];
arr.forEach(([x,y,g])=>out.push(`<div class="abs" style="left:${x}in;top:${y}in;font-size:24pt;color:${C.AMBER};font-weight:700">${g}</div>`));
text(0.55,6.35,12.2,0.6,"Effetto rete sui dati: costruiamo, pratica dopo pratica, l'MLS e il registro dei titoli che l'Italia non ha mai avuto.",{size:15,italic:true,color:C.AMBER});
foot(5,true);
end();

// ---------- Slide 6 ----------
slide(C.WHITE);
kicker(0.6,0.5,"La visione a 360°",C.TERRA);
text(0.55,0.85,12.2,0.75,"Dal certificato di conformità alla piattaforma dell'intera transazione",{size:26,bold:true,color:C.INK,face:HEAD});
const mods=[["1","Due Diligence AI","Il punto d'ingresso: certificato di conformità automatizzato.","OGGI"],
["2","Valutazione dati-driven","AVM molto più accurato dei dati OMI, basato su transazioni reali.","ESPANSIONE"],
["3","Rails della transazione","Notaio, banca, mutuo e rogito orchestrati in digitale.","ESPANSIONE"],
["4","Sblocco immobili fermi","Eredità e comproprietà frammentate: mappatura e accordo assistiti.","ESPANSIONE"],
["5","Retrofit energetico","Gap di classe, costi e incentivi per la direttiva Case Green.","ESPANSIONE"],
["6","Marketplace finanziario","Mutui e finanziamenti ristrutturazione agganciati al dossier.","ESPANSIONE"]];
const gw=3.95,gh=1.9,gx0=0.55,gy0=1.85,gxg=0.28,gyg=0.28;
mods.forEach((m,i)=>{
  const col=i%3,row=Math.floor(i/3),x=gx0+col*(gw+gxg),y=gy0+row*(gh+gyg),now=m[3]==="OGGI";
  box(x,y,gw,gh,{fill:now?C.NAVY:C.CARD,border:now?C.NAVY:C.LINE});
  circle(x+0.28,y+0.28,0.5,m[0],now?C.AMBER:C.TERRA,now?C.NAVY:C.WHITE);
  text(x+gw-1.8,y+0.32,1.6,0.3,esc(m[3]),{size:9.5,bold:true,spacing:1.2,color:now?C.AMBER:C.SLATE,align:'right'});
  text(x+0.28,y+0.85,gw-0.55,0.4,esc(m[1]),{size:16.5,bold:true,color:now?C.WHITE:C.INK,face:HEAD});
  text(x+0.28,y+1.24,gw-0.55,0.6,esc(m[2]),{size:12.5,color:now?C.ICE:C.SLATE});
});
foot(6,false);
end();

// ---------- Slide 7 ----------
slide(C.WHITE);
kicker(0.6,0.5,"Il mercato",C.TERRA);
text(0.55,0.82,12.2,0.6,"Il mercato target supera di molto il miliardo",{size:27,bold:true,color:C.INK,face:HEAD});
text(0.55,1.42,12.2,0.55,"La sola due diligence tecnico-legale vale ~€1 mld/anno. Con i servizi alla transazione e l'ondata Case Green, il target è multi-miliardo.",{size:14.5,color:C.SLATE});
const tam=[["TAM","~€120 mld transato residenziale/anno + €280 mld di giro d'affari Case Green potenziale","Mercato immobiliare & riqualificazione in Italia",C.NAVY,C.WHITE,C.ICE,8.6],
["SAM","Multi-miliardo € / anno","Servizi tecnico-legali, valutazione e intelligence energetica digitalizzabili",C.TERRA,C.WHITE,"#F6E4DE",6.6],
["SOM","Centinaia di mln","Beachhead 0-3 anni: DD B2B per reti, notai, banche, fondi",C.AMBER,C.NAVY,"#5A4212",4.6]];
let ty=2.15;
tam.forEach(([k,v,d,c,tc,dc,ww])=>{
  box(0.55,ty,ww,1.3,{fill:c});
  text(0.8,ty,1.5,1.3,esc(k),{size:30,bold:true,color:tc,face:HEAD,valign:'middle'});
  text(2.25,ty+0.22,ww-1.65,0.5,esc(v),{size:17,bold:true,color:tc,face:HEAD});
  text(2.25,ty+0.72,ww-1.65,0.5,esc(d),{size:12.5,color:dc});
  ty+=1.5;
});
box(9.35,2.15,3.4,4.3,{fill:C.NAVY});
text(9.6,2.35,2.95,0.5,"I numeri che reggono la tesi",{size:14,bold:true,color:C.AMBER,face:HEAD});
const proof=[["719.578","compravendite residenziali (2024)"],["€2,8 mld","ricavi intermediazione; €36 mld servizi immobiliari"],["€85 mld","investimenti Case Green entro il 2030"],["~500.000","abitazioni/anno da riqualificare"]];
let ppy=3.05;
proof.forEach(([b,d])=>{
  text(9.6,ppy,2.95,0.8,`<span style="font-weight:700;color:${C.WHITE}">${esc(b)} </span><span style="color:${C.ICE}">${esc(d)}</span>`,{size:12.5,lh:1.15});
  ppy+=0.82;
});
text(0.55,6.62,8.6,0.5,"Fonti: OMI–Agenzia delle Entrate (2024); Il Sole 24 Ore; ACCA/BibLus, rinnovabili.it (EPBD). SAM/SOM: stime, da validare in diligence.",{size:9.5,color:C.SLATE});
foot(7,false);
end();

// ---------- Slide 8 ----------
slide(C.NAVY);
kicker(0.6,0.55,"Il modello di ricavi",C.AMBER);
text(0.55,0.9,8,0.8,"Quattro flussi che si accendono in sequenza",{size:27,bold:true,color:C.WHITE,face:HEAD});
const streams=[["Pay-per-dossier / SaaS","Reti di agenzie e notai: canone + pratica"],
["Enterprise","Banche, SGR e fondi: contratti a volume"],
["Dati & AVM in licenza","Valutazioni e dataset di conformità"],
["Take-rate transazioni","Mutui e finanziamenti (fase 2)"]];
let by2=2.3;
streams.forEach(([t,d],i)=>{
  box(0.55,by2,5.7,0.95,{fill:C.NAVY2,border:C.BORD});
  circle(0.78,by2+0.2,0.55,i+1,C.AMBER,C.NAVY);
  text(1.5,by2+0.12,4.6,0.42,esc(t),{size:15.5,bold:true,color:C.WHITE,face:HEAD});
  text(1.5,by2+0.52,4.6,0.35,esc(d),{size:12,color:C.MUTE});
  by2+=1.08;
});
// stacked bar chart (manual)
text(6.7,2.05,6,0.35,"Mix di ricavi nel tempo (illustrativo, % del fatturato)",{size:12,bold:true,color:C.ICE});
const years=[["Anno 1",[70,30,0,0]],["Anno 2",[45,35,15,5]],["Anno 3",[30,32,22,16]]];
const segCols=[C.AMBER,"#6FA8DC",C.TERRA,"#7FC8A9"];
const chX=6.9, chY=2.65, chH=3.3, barW=1.3, barGap=0.75;
years.forEach(([yl,vals],bi)=>{
  const bx=chX+bi*(barW+barGap);
  let acc=0;
  vals.forEach((v,si)=>{
    if(v<=0) return;
    const h=chH*v/100, top=chY+chH-acc-h;
    out.push(`<div class="abs" style="left:${bx}in;top:${top}in;width:${barW}in;height:${h}in;background:${segCols[si]};display:flex;align-items:center;justify-content:center;font-family:${BODY};font-size:9pt;color:${C.NAVY};font-weight:700">${v}%</div>`);
    acc+=h;
  });
  text(bx-0.2,chY+chH+0.08,barW+0.4,0.3,yl,{size:11,color:C.ICE,align:'center'});
});
// legend
const leg=[["SaaS / dossier",C.AMBER],["Enterprise","#6FA8DC"],["Dati & AVM",C.TERRA],["Take-rate","#7FC8A9"]];
let lx=6.9;
leg.forEach(([t,c])=>{
  out.push(`<div class="abs" style="left:${lx}in;top:6.35in;width:0.16in;height:0.16in;background:${c};border-radius:0.02in"></div>`);
  text(lx+0.22,6.31,1.5,0.3,esc(t),{size:10.5,color:C.ICE});
  lx+=1.5;
});
foot(8,true);
end();

// ---------- Slide 9 — Competitive matrix ----------
slide(C.WHITE);
kicker(0.6,0.5,"Analisi competitiva · panorama",C.TERRA);
text(0.55,0.82,12.2,0.6,"Il quadrante “conformità AI + dati Italia” è vuoto",{size:27,bold:true,color:C.INK,face:HEAD});
text(0.55,1.42,12.2,0.5,"Ogni layer della filiera ha un player forte. Nessuno presidia la conformità/titolo con AI e dati pubblici italiani.",{size:14.5,color:C.SLATE});
// y-axis label (vertical) and x-axis label
out.push(`<div class="abs" style="left:0.35in;top:6.05in;width:3.9in;height:0.3in;transform:rotate(-90deg);transform-origin:left top;font-family:${BODY};font-size:11pt;font-weight:700;color:${C.SLATE};letter-spacing:0.5px">▲  Più AI-native · dati Italia</div>`);
text(2.7,6.42,9.5,0.3,"Copertura del layer:  vetrina → conformità → transazione   ▶",{size:11,bold:true,color:C.SLATE});
function qcell(x,y,w,h,hdr,players,hi){
  box(x,y,w,h,{fill:hi?C.NAVY:C.CARD,border:hi?C.NAVY:C.LINE});
  text(x+0.22,y+0.16,w-0.4,0.55,esc(hdr),{size:12.5,bold:true,color:hi?C.AMBER:C.TERRA,face:HEAD,lh:1.1});
  if(hi){
    text(x+0.22,y+0.78,w-0.4,0.5,"CONFORME",{size:24,bold:true,color:C.AMBER,face:HEAD});
    text(x+0.22,y+1.38,w-0.4,0.4,"Orbital (UK) · non opera in Italia",{size:10.5,italic:true,color:C.MUTE});
  } else {
    text(x+0.22,y+0.75,w-0.4,h-0.9,esc(players),{size:12,color:C.SLATE,lh:1.35});
  }
}
const cW=4.85,cH=1.9,cLx=2.7,cRx=7.7,cTy=2.15,cBy=4.2;
qcell(cLx,cTy,cW,cH,"Valutazione AI, solo il prezzo","Reopla / Sprengnetter · CRIF RES · Nomisma · PriceHubble",false);
qcell(cRx,cTy,cW,cH,"Conformità + transazione · AI-native",null,true);
qcell(cLx,cBy,cW,cH,"Vetrina & generazione lead","Immobiliare.it · Idealista · Casa.it · Wikicasa",false);
qcell(cRx,cBy,cW,cH,"Transazione manuale o capital-heavy","iBuyer Casavo · studi di DD (geometri/architetti) · notai",false);
foot(9,false);
end();

// ---------- Slide 10 — Competitor table ----------
slide(C.WHITE);
kicker(0.6,0.5,"Analisi competitiva · dettaglio",C.TERRA);
text(0.55,0.82,12.2,0.6,"Chi fa cosa, e dove si ferma",{size:27,bold:true,color:C.INK,face:HEAD});
const cols=[[0.55,2.55],[3.15,1.75],[4.95,3.05],[8.05,2.9],[11.0,1.75]];
const heads=["Player","Categoria","Punto di forza","Dove si ferma","Minaccia"];
const hy=1.75;
box(0.55,hy,12.2,0.5,{fill:C.NAVY,r:0.06});
heads.forEach((h,i)=>text(cols[i][0]+0.12,hy,cols[i][1]-0.15,0.5,esc(h),{size:11.5,bold:true,color:C.WHITE,valign:'middle'}));
const rows=[
["Immobiliare.it · Idealista","Portali annunci","Vetrina, lead e traffico dominante","Non toccano conformità né transazione","Bassa","g"],
["Casavo","iBuyer","Liquidità in ~30 gg; €385M raccolti","DD interna, non è un prodotto; capital-heavy","Media","a"],
["Reopla · CRIF RES · Nomisma","AVM / valutazione","Stime automatiche accurate, a scala","Solo il prezzo, non conformità/titolo","Media","a"],
["Studi geometri/architetti","DD tradizionale","Competenza normativa profonda","Manuale, frammentata, non AI-native","Bassa","g"],
["Deepki · piattaforme retrofit","Energy / Case Green","Dati energetici e ristrutturazione","Non toccano titolo né transazione","Bassa","g"],
["Orbital (UK)","AI DD legale RE","$60M Series B; 200k transazioni/anno","Focus UK/US; catasto e conformità IT non replicabili","Futura","a"]
];
let ry=2.3; const rh=0.56;
rows.forEach((r,i)=>{
  if(i%2===1) box(0.55,ry,12.2,rh,{fill:"#EEF3FA",r:0.02});
  text(cols[0][0]+0.12,ry,cols[0][1]-0.15,rh,`<span style="font-weight:700;color:${C.INK}">${esc(r[0])}</span>`,{size:11,valign:'middle',lh:1.1});
  text(cols[1][0]+0.12,ry,cols[1][1]-0.15,rh,esc(r[1]),{size:10.5,color:C.SLATE,valign:'middle',lh:1.1});
  text(cols[2][0]+0.12,ry,cols[2][1]-0.15,rh,esc(r[2]),{size:10.5,color:C.SLATE,valign:'middle',lh:1.1});
  text(cols[3][0]+0.12,ry,cols[3][1]-0.15,rh,esc(r[3]),{size:10.5,color:C.SLATE,valign:'middle',lh:1.1});
  const mc = r[5]==="g"?"#3E8E5A":C.TERRA;
  text(cols[4][0]+0.12,ry,cols[4][1]-0.15,rh,`<span style="font-weight:700;color:${mc}">${esc(r[4])}</span>`,{size:10.5,valign:'middle',lh:1.1});
  ry+=rh;
});
box(0.55,ry+0.12,12.2,0.62,{fill:C.NAVY,r:0.06});
text(0.8,ry+0.12,12.0,0.62,`<span style="color:${C.AMBER};font-weight:700">Il quadrante conformità-AI su dati italiani è vuoto: </span><span style="color:${C.ICE}">chi lo occupa per primo costruisce il data-moat che lo blinda, e diventa il layer su cui poggiano tutti gli altri.</span>`,{size:13,valign:'middle'});
text(0.55,ry+0.9,12.2,0.3,"Fonti: EU-Startups/Brighton Park (Orbital, Series B 2026); Economyup/Silicon Canals (Casavo, Reopla); CRIF RES. Dati aggiornati a inizio 2026.",{size:9,color:C.SLATE});
foot(10,false);
end();

// ---------- Slide 11 — International validation (fast-follower) ----------
slide(C.NAVY);
kicker(0.6,0.5,"Validazione internazionale",C.AMBER);
text(0.55,0.78,12.2,1.0,"Il modello funziona già all'estero. In Italia il campo è aperto.",{size:25,bold:true,color:C.WHITE,face:HEAD});
text(0.55,1.92,12.2,0.4,"Chi digitalizza conformità e transazione immobiliare, fuori dall'Italia, diventa unicorno o monopolio quotato.",{size:14,color:C.MUTE});
const proofs=[
["REGNO UNITO","Orbital","$60M","Series B (2026) per l'AI di due diligence legale immobiliare. ~200k transazioni/anno."],
["USA","Qualia","~$1 mld","Valutazione da unicorno; infrastruttura di title & closing. ~$207M raccolti."],
["AUSTRALIA","PEXA","~AU$2 mld","Capitalizzazione in borsa (ASX); ~90% delle transazioni immobiliari nazionali sul suo exchange."]];
let ppx=0.55;
proofs.forEach(([country,name,big,d])=>{
  box(ppx,2.5,3.95,2.85,{fill:C.NAVY2,border:C.BORD});
  text(ppx+0.25,2.73,3.4,0.3,esc(country),{size:11,bold:true,color:C.AMBER,spacing:1.5});
  text(ppx+0.25,3.05,3.4,0.5,esc(name),{size:20,bold:true,color:C.WHITE,face:HEAD});
  text(ppx+0.25,3.67,3.5,0.7,esc(big),{size:34,bold:true,color:C.AMBER,face:HEAD});
  text(ppx+0.25,4.5,3.5,0.8,esc(d),{size:12.5,color:C.ICE,lh:1.3});
  ppx+=4.15;
});
box(0.55,5.5,12.2,0.82,{fill:C.NAVY3,border:C.AMBER});
text(0.85,5.5,11.6,0.82,`<span style="color:${C.AMBER};font-weight:700">In Italia non esiste nessuno di questi. </span><span style="color:${C.ICE}">E il problema, conformità e catasto, è più grande: noi replichiamo il modello e lo adattiamo, per essere il primo player italiano.</span>`,{size:14,valign:'middle'});
text(0.55,6.5,12.2,0.3,"Fonti: Orbital / Brighton Park (Series B 2026); Qualia (Series D, unicorno ~$1 mld); PEXA Group (ASX: PXA). Cifre indicative.",{size:9,color:C.MUTE});
foot(11,true);
end();

// ---------- Slide 12 — Why now ----------
slide(C.WHITE);
kicker(0.6,0.55,"Perché adesso",C.TERRA);
text(0.55,0.9,12,0.8,"Tre venti a favore convergono nel 2026",{size:28,bold:true,color:C.INK,face:HEAD});
const now=[["Direttiva UE “Case Green”","La EPBD (recepimento entro maggio 2026) impone l'adeguamento di ~500.000 abitazioni/anno: ~€85 mld di investimenti entro il 2030. Domanda forzata e finanziabile.",C.TERRA,C.WHITE],
["Agenti AI finalmente maturi","I compiti document-heavy e rule-heavy, come leggere visure, incrociare planimetrie e verificare regole, sono ora automatizzabili con affidabilità.",C.NAVY,C.WHITE],
["Eredità del Superbonus","Un ecosistema di dati, cantieri e pratiche edilizie mai visto prima, oggi disponibile per essere strutturato.",C.AMBER,C.NAVY]];
let ny=2.35;
now.forEach(([t,d,c,tc],i)=>{
  box(0.55,ny,12.2,1.35,{fill:C.CARD,border:C.LINE});
  ellipse(0.85,ny+0.37,0.62,0.62,c);
  text(0.85,ny+0.37,0.62,0.62,String(i+1),{size:18,bold:true,color:tc,face:HEAD,align:'center',valign:'middle'});
  text(1.75,ny,4.5,1.35,esc(t),{size:18,bold:true,color:C.INK,face:HEAD,valign:'middle'});
  text(6.35,ny,6.2,1.35,esc(d),{size:13.5,color:C.SLATE,valign:'middle'});
  ny+=1.5;
});
foot(12,false);
end();

// ---------- Slide 10 ----------
slide(C.NAVY);
kicker(0.6,0.55,"Perché noi",C.AMBER);
text(0.55,0.9,12.2,1.2,"Non scommettiamo sull'AI da costruire. Verticalizziamo una piattaforma che già esiste.",{size:26,bold:true,color:C.WHITE,face:HEAD});
const why=[["Piattaforma agentica pronta","L'infrastruttura AI agentica è già in produzione: non la costruiamo da zero."],
["Competenza AI enterprise","Esperienza consolidata di AI enterprise e integrazione su processi complessi."],
["Time-to-market","Partiamo da una vertical application su un mercato rotto, non da un foglio bianco."]];
let wy=2.7;
why.forEach(([t,d])=>{
  box(0.55,wy,6.4,1.2,{fill:C.NAVY2,border:C.BORD});
  text(0.85,wy+0.16,5.9,0.45,esc(t),{size:18,bold:true,color:C.AMBER,face:HEAD});
  text(0.85,wy+0.6,5.9,0.55,esc(d),{size:13,color:C.ICE});
  wy+=1.35;
});
box(7.5,2.7,5.25,3.9,{fill:C.NAVY3,border:C.BORD});
text(7.8,2.9,4,0.4,"Lo stack",{size:15,bold:true,color:C.MUTE,face:HEAD});
box(7.85,3.4,4.55,0.95,{fill:C.AMBER});
text(7.85,3.5,4.55,0.4,"Conforme",{size:18,bold:true,color:C.NAVY,face:HEAD,align:'center'});
text(7.85,3.92,4.55,0.35,"vertical app · real estate Italia",{size:11,color:C.NAVY,align:'center'});
box(7.85,4.55,4.55,0.85,{fill:C.NAVY2,border:C.AMBER});
text(7.85,4.55,4.55,0.85,"Piattaforma agentica in produzione",{size:14,bold:true,color:C.WHITE,face:HEAD,align:'center',valign:'middle'});
box(7.85,5.55,4.55,0.8,{fill:"#0E2140",border:C.BORD});
text(7.85,5.55,4.55,0.8,"Competenza AI enterprise",{size:13,color:C.ICE,align:'center',valign:'middle'});
foot(13,true);
end();

// ---------- Slide 11 ----------
slide(C.WHITE);
kicker(0.6,0.55,"Roadmap",C.TERRA);
text(0.55,0.9,12,0.8,"Dal wedge alla piattaforma, in tre fasi",{size:28,bold:true,color:C.INK,face:HEAD});
const phases=[["Fase 1","0-18 mesi","Il wedge","Agente di due diligence in produzione. Primi clienti B2B: reti, notai, banche. Costruzione del dataset proprietario.",C.TERRA,C.WHITE],
["Fase 2","18-36 mesi","Dati & transazione","AVM proprietario, rails della transazione digitale, sblocco degli immobili fermi. Il data-moat diventa prodotto.",C.NAVY,C.WHITE],
["Fase 3","36 mesi +","Piattaforma 360°","Intelligence energetica Case Green e marketplace finanziario. Scala nazionale, poi replicabilità europea.",C.AMBER,C.NAVY]];
const pw=3.95,px0=0.55,pxg=0.28,pcy=2.35,pch=3.9;
phases.forEach((ph,i)=>{
  const x=px0+i*(pw+pxg),now=i===0;
  box(x,pcy,pw,pch,{fill:now?C.NAVY:C.CARD,border:now?C.NAVY:C.LINE});
  out.push(`<div class="abs" style="left:${x+0.3}in;top:${pcy+0.35}in;width:1.7in;height:0.5in;border-radius:0.25in;background:${ph[4]};display:flex;align-items:center;justify-content:center;font-family:${HEAD};font-weight:700;font-size:15pt;color:${ph[5]}">${esc(ph[0])}</div>`);
  text(x+0.3,pcy+1.0,pw-0.6,0.35,esc(ph[1]),{size:12,bold:true,color:now?C.AMBER:C.SLATE,spacing:1});
  text(x+0.3,pcy+1.4,pw-0.6,0.6,esc(ph[2]),{size:19,bold:true,color:now?C.WHITE:C.INK,face:HEAD});
  text(x+0.3,pcy+2.05,pw-0.6,1.6,esc(ph[3]),{size:13,color:now?C.ICE:C.SLATE});
});
foot(14,false);
end();

// ---------- Slide 12 ----------
slide(C.NAVY);
box(11.3,0.7,0.5,1.3,{fill:C.NAVY2,r:0.06});
box(11.9,1.2,0.5,0.8,{fill:C.AMBER,r:0.06});
kicker(0.7,1.1,"La proposta",C.AMBER);
text(0.7,1.5,11,1.8,"Costruiamo il layer di fiducia della compravendita immobiliare italiana.",{size:38,bold:true,color:C.WHITE,face:HEAD,lh:1.1});
text(0.7,3.45,11.4,1.2,`<span style="color:${C.ICE}">Immobiliare.it ha digitalizzato l'annuncio. </span><span style="color:${C.AMBER};font-style:italic">Noi digitalizziamo la parte che fa saltare le compravendite, la conformità, e da lì diventiamo il layer di dati e transazione che il mercato immobiliare italiano non ha mai avuto.</span>`,{size:18});
const asks=[["Capitale","per team tecnico + verticale legale e go-to-market B2B"],
["18 mesi","per portare il wedge in produzione e costruire il data-moat"],
["Obiettivo","essere il primo player del layer di conformità in Italia"]];
let ax=0.7;
asks.forEach(([t,d])=>{
  box(ax,5.0,3.85,1.35,{fill:C.NAVY2,border:C.BORD});
  text(ax+0.25,5.15,3.45,0.5,esc(t),{size:19,bold:true,color:C.AMBER,face:HEAD});
  text(ax+0.25,5.65,3.45,0.6,esc(d),{size:12.5,color:C.ICE});
  ax+=4.05;
});
text(0.7,6.75,10,0.4,"Luca Martino",{size:13,color:C.MUTE});
end();

const html=`<!doctype html><html><head><meta charset="utf-8"><style>
@page { size:13.333in 7.5in; margin:0 }
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:#fff}
.slide{position:relative;width:13.333in;height:7.5in;overflow:hidden;page-break-after:always}
.abs{position:absolute}
.txt{overflow:hidden}
</style></head><body>${out.join("\n")}</body></html>`;
fs.writeFileSync("/home/user/Luca/proptech-deck/conforme.html",html);
console.log("HTML written");
