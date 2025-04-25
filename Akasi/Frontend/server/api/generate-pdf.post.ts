import { defineEventHandler, readBody } from 'h3'
import puppeteer from 'puppeteer'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { 
      html, 
      conclusionStudent, 
      conclusionTeaching, 
      conclusionNonTeaching 
    } = body
    
    if (!html) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'HTML content is required' })
      }
    }
    
    // Process HTML content - insert conclusions if provided
    let processedHtml = html;
    
    if (conclusionStudent) {
      processedHtml = processedHtml.replace(
        /<textarea[^>]*id="conclusion-student"[^>]*>.*?<\/textarea>/g,
        `<textarea id="conclusion-student" name="conclusion-student" rows="4">${conclusionStudent}</textarea>`
      );
    }
    
    if (conclusionTeaching) {
      processedHtml = processedHtml.replace(
        /<textarea[^>]*id="conclusion-teaching"[^>]*>.*?<\/textarea>/g,
        `<textarea id="conclusion-teaching" name="conclusion-teaching" rows="4">${conclusionTeaching}</textarea>`
      );
    }
    
    if (conclusionNonTeaching) {
      processedHtml = processedHtml.replace(
        /<textarea[^>]*id="conclusion-nonteaching"[^>]*>.*?<\/textarea>/g,
        `<textarea id="conclusion-nonteaching" name="conclusion-nonteaching" rows="4">${conclusionNonTeaching}</textarea>`
      );
    }
    
    console.log('Launching puppeteer...')
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    
    console.log('Setting page content...')
    await page.setContent(processedHtml, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    })
    
    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready')
    
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