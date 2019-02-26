import * as functions from "firebase-functions";
import * as cors from "cors";
import * as puppeteer from "puppeteer";
import * as os from "os";
import * as path from "path";
import * as sgmail from "@sendgrid/mail";
import {PDFUtil} from './pdfutil';

// corsTesting123
// Good guess, we need cors to work and it needs to be a POST
// GET has limits on the query lenght so you can only send small documents at best
export const corstesting123 = functions.https.onRequest((req, res) => {
  const corsHandler = cors({ origin: true });
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(500).json({
        message: "Not Allowed, please POST the message"
      });
      return;
    }
    res.status(200).send("Hello from Firebase with Cors working");
  });
});

// sendPDFEmail
// Receive the from,to,title,body and document/html to convert to pdf and send with sendgrid
// Sendgrid API keys to be stored in the following way
// firebase functions:config:set sendgridservice.key="API KEY" sendgridservice.id="THE CLIENT ID"
// firebase functions:config:get
// in code
// functions.config().someservice.id
export const sendpdfemail = functions
.runWith({ memory: "1GB" })
.https.onRequest((req, res) => {
  const corsHandler = cors({ origin: true });
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(500).json({
        message: "Not Allowed, please POST the message"
      });
      return;
    }
    const emailFrom = req.body.emailFrom;
    const emailTo = req.body.emailTo;
    const emailSubject = req.body.emailSubject;
    const emailBody = req.body.emailBody;
    const html = JSON.parse(req.body.html);

    // generate the pdf file
    const pdfutil = new PDFUtil();
    const pdf = await pdfutil.generatepdf(html)
    console.log(pdf);

    // get the sendgrid api key
    const API_KEY = functions.config().sendgridservice.key
    console.log(API_KEY);
    sgmail.setApiKey(API_KEY);

    // todo attach the pdf file
    const msg = {
      to: emailTo,
      from: emailFrom,
      subject: emailSubject,
      //text: "and easy to do anywhere, even with Node.js",
      html: emailBody
    };
    console.log(msg);
    await sgmail.send(msg);
    res.status(200).send("Email was sent");
  });
});

// html2pdf
// Receive html and return a pdf
export const html2pdf = functions
  .runWith({ memory: "1GB" })
  .https.onRequest((req, res) => {
    const corsHandler = cors({ origin: true });
    corsHandler(req, res, async () => {
      console.log("Receive html parameter");
      const html = JSON.parse(req.body.html);
      //console.log(html);
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
      });
      //console.log(browser);
      const page = await browser.newPage();
      //console.log(page);
      //await page.setContent('<h1> This is the PDF Header</h1>');
      await page.setContent(html, { waitUntil: "networkidle2" });

      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 2
      });
      //await page.goto('https://news.ycombinator.com', {waitUntil: 'networkidle2'});
      //console.log('Page Content set');
      const filepath = path.join(os.tmpdir(), "invoice.pdf");
      const pdf = await page.pdf({ path: filepath, format: "A4" });
      //console.log(pdf);
      await browser.close();
      res.send(pdf);
    });
  });
