import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "url required" });

  let browser;
  try {
    const execPath = await chromium.executablePath();
    if (!execPath) throw new Error("Chromium executable not found");

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: execPath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });

    // tunggu JS load
    await page.waitForTimeout(4000);

    const media = await page.evaluate(() => {
      try {
        return [...document.querySelectorAll("video source, video")]
          .map(v => v.src)
          .filter(Boolean);
      } catch {
        return [];
      }
    });

    await browser.close();
    res.json({ success: true, media });

  } catch (e) {
    if (browser) await browser.close();
    res.status(500).json({ error: e.message });
  }
}
