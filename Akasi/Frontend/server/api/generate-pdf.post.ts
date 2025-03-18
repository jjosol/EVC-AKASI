import { defineEventHandler, readBody } from 'h3'
import puppeteer from 'puppeteer'

export default defineEventHandler(async (event) => {
  try {
    const { html } = await readBody(event)
    
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    await page.goto('http://localhost:3000') // Ensure the base URL is set
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    })

    await browser.close()

    return new Response(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=report.pdf'
      }
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return new Response(JSON.stringify({ error: 'Failed to generate PDF' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
})