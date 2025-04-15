import puppeteer from "puppeteer";

async function convertHtmlToPdf(htmlContent) {
  const browser = await puppeteer.launch({ headless: "shell" }); // you can try { headless: true }
  const page = await browser.newPage();
  await page.setContent(htmlContent);
  await page.pdf({
    path: "./madePDF.pdf",
    format: "A4",
  });
  await browser.close();

  console.log("PDF has been saved!");
}