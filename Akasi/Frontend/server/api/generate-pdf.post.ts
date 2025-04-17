import { defineEventHandler, readBody } from 'h3'
import puppeteer from 'puppeteer'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { html, conclusionText } = body
    
    if (!html) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'HTML content is required' })
      }
    }
    
    console.log('Launching puppeteer...')
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    
    console.log('Setting page content...')
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    })
    
    console.log('Generating PDF...')
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
    console.log('PDF generated successfully')

    // Return PDF buffer with proper headers
    event.node.res.setHeader('Content-Type', 'application/pdf')
    event.node.res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"')
    return pdf
  } catch (error) {
    console.error('PDF generation error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate PDF' })
    }
  }
})