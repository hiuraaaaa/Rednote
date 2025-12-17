import chromium from "@sparticuz/chrome-aws-lambda";
import puppeteer from "puppeteer-core";

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "url required" });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });

    // tunggu kemungkinan player load
    await page.waitForTimeout(3000);

    const media = await page.evaluate(() => {
      const out = [];

      document.querySelectorAll("video source, video").forEach(el => {
        if (el.src && el.src.startsWith("http")) out.push(el.src);
      });

      return [...new Set(out)];
    });

    await browser.close();

    if (media.length === 0) {
      return res.status(404).json({ error: "media not found" });
    }

    res.json({
      success: true,
      media
    });

  } catch (e) {
    if (browser) await browser.close();
    res.status(500).json({ error: e.message });
  }
}
