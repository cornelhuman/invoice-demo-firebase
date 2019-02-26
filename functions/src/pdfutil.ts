import * as puppeteer from "puppeteer";
import * as os from "os";
import * as path from "path";

class PDFUtil {
  async generatepdf(html: string) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle2" });
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2
    });
    const filepath = path.join(os.tmpdir(), "invoice.pdf");
    const pdf = await page.pdf({ path: filepath, format: "A4" });
    await browser.close();
    return pdf;
  }
}

export { PDFUtil };
