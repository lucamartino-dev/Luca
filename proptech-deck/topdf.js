const { chromium } = require("playwright-core");
(async () => {
  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    args: ["--no-sandbox"]
  });
  const page = await browser.newPage();
  await page.goto("file:///home/user/Luca/proptech-deck/conforme.html", { waitUntil: "networkidle" });
  await page.pdf({
    path: "/home/user/Luca/proptech-deck/Conforme_Pitch.pdf",
    width: "13.333in",
    height: "7.5in",
    printBackground: true,
    preferCSSPageSize: true
  });
  await browser.close();
  console.log("PDF written");
})();
