const {chromium}=require('/opt/node22/lib/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:939,height:1331}});
for (const s of process.argv.slice(2)){await p.goto('file://'+__dirname+'/'+s+'.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);await p.screenshot({path:__dirname+'/'+s+'.png'});}
await b.close();})();
