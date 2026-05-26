import puppeteer from 'puppeteer'
import { put } from '@vercel/blob'
import type { ReceiptData } from '@/types/payment'

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatPaymentMethod(method: string): string {
  switch (method) {
    case 'CASH':
      return 'Cash'
    case 'BANK_TRANSFER':
      return 'Bank Transfer'
    case 'POS':
      return 'POS (Card)'
    default:
      return method
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function buildReceiptHtml(data: ReceiptData): string {
  const { school, student, payment, balance, receiptNumber } = data
  const schoolName = escapeHtml(school.name)
  const schoolAddress = school.address ? escapeHtml(school.address) : ''
  const schoolPhone = school.phone ? escapeHtml(school.phone) : ''
  const logoUrl = school.logoUrl ? escapeHtml(school.logoUrl) : ''
  const studentName = escapeHtml(student.fullName)
  const studentCode = escapeHtml(student.studentCode)
  const studentPhone = escapeHtml(student.phone)
  const safeReceiptNumber = escapeHtml(receiptNumber)
  const safePaymentDate = escapeHtml(formatDate(payment.paymentDate))
  const safePaymentMethod = escapeHtml(formatPaymentMethod(payment.method))
  const safeNotes = payment.notes ? escapeHtml(payment.notes) : ''
  const safeAmount = escapeHtml(formatNaira(payment.amount))
  const safeBalance = escapeHtml(balance <= 0 ? 'Fully Paid ✓' : formatNaira(balance))

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Payment Receipt — ${safeReceiptNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #111827;
      background: #fff;
      padding: 48px;
      font-size: 14px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      border-bottom: 2px solid #111827;
      padding-bottom: 20px;
      margin-bottom: 28px;
    }
    .school-info h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
    .school-info p { font-size: 13px; color: #6b7280; }
    .receipt-label { text-align: right; }
    .receipt-label h2 { font-size: 18px; font-weight: 700; letter-spacing: 0.05em; }
    .receipt-label .receipt-num { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .logo { max-height: 60px; max-width: 120px; object-fit: contain; margin-bottom: 10px; display: block; }
    .section { margin-bottom: 24px; }
    .section-title {
      font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
      text-transform: uppercase; color: #9ca3af; margin-bottom: 10px;
    }
    .info-row {
      display: flex; justify-content: space-between;
      padding: 8px 0; border-bottom: 1px solid #f3f4f6;
    }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #6b7280; font-size: 13px; }
    .info-value { font-weight: 500; color: #111827; font-size: 13px; text-align: right; }
    .total-section {
      border: 2px solid #111827; border-radius: 8px;
      padding: 16px 20px; margin-bottom: 24px;
    }
    .total-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; }
    .total-label { font-size: 13px; color: #6b7280; }
    .amount-paid { font-size: 24px; font-weight: 700; }
    .balance-amount { font-size: 16px; font-weight: 600; }
    .balance-zero { color: #16a34a; }
    .balance-owed { color: #dc2626; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 6px 0; }
    .footer {
      text-align: center; font-size: 11px; color: #9ca3af;
      margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;
    }
    .stamp {
      display: inline-block; border: 2px solid #16a34a; color: #16a34a;
      font-weight: 700; font-size: 13px; letter-spacing: 0.1em;
      padding: 4px 12px; border-radius: 4px; margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="school-info">
      ${logoUrl ? `<img src="${logoUrl}" class="logo" alt="${schoolName} Logo" />` : ''}
      <h1>${schoolName}</h1>
      ${schoolAddress ? `<p>${schoolAddress}</p>` : ''}
      ${schoolPhone ? `<p>${schoolPhone}</p>` : ''}
    </div>
    <div class="receipt-label">
      <h2>PAYMENT RECEIPT</h2>
      <p class="receipt-num">${safeReceiptNumber}</p>
      <p class="receipt-num">${safePaymentDate}</p>
    </div>
  </div>

  <div class="section">
    <p class="section-title">Student Information</p>
    <div class="info-row">
      <span class="info-label">Full Name</span>
      <span class="info-value">${studentName}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Student Code</span>
      <span class="info-value">${studentCode}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Phone</span>
      <span class="info-value">${studentPhone}</span>
    </div>
  </div>

  <div class="section">
    <p class="section-title">Payment Details</p>
    <div class="info-row">
      <span class="info-label">Payment Date</span>
      <span class="info-value">${safePaymentDate}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Payment Method</span>
      <span class="info-value">${safePaymentMethod}</span>
    </div>
    ${safeNotes ? `
    <div class="info-row">
      <span class="info-label">Notes</span>
      <span class="info-value">${safeNotes}</span>
    </div>` : ''}
  </div>

  <div class="total-section">
    <div class="total-row">
      <span class="total-label">Amount Paid</span>
      <span class="amount-paid">${safeAmount}</span>
    </div>
    <hr class="divider" />
    <div class="total-row">
      <span class="total-label">Outstanding Balance</span>
      <span class="balance-amount ${balance <= 0 ? 'balance-zero' : 'balance-owed'}">
        ${safeBalance}
      </span>
    </div>
  </div>

  ${balance <= 0 ? '<div style="text-align:center"><span class="stamp">FULLY PAID</span></div>' : ''}

  <div class="footer">
    <p>This is an official receipt issued by ${schoolName}.</p>
    <p style="margin-top:4px">Powered by Zaya — Driving School Management</p>
  </div>
</body>
</html>`
}

export async function generateReceipt(data: ReceiptData): Promise<string | null> {
  const html = buildReceiptHtml(data)

  // Launch Puppeteer — favor system Chrome for speed on Windows/Linux
  const launchArgs = ['--no-sandbox', '--disable-setuid-sandbox']
  const systemChromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ]

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null

  // Try known system paths first
  for (const executablePath of systemChromePaths) {
    try {
      browser = await puppeteer.launch({
        executablePath,
        args: launchArgs,
        headless: true,
      })
      break
    } catch {
      // continue
    }
  }

  // Fallback to default launch
  if (!browser) {
    try {
      browser = await puppeteer.launch({ args: launchArgs, headless: true })
    } catch (err) {
      console.error('[generateReceipt] No browser found. PDF generation skipped.', err)
      return null
    }
  }

  try {
    const page = await browser.newPage()
    page.setDefaultNavigationTimeout(30000)
    await page.setContent(html, { waitUntil: 'load' })
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true })
    await browser.close()

    // Graceful fallback if Vercel Blob token is missing
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('[generateReceipt] BLOB_READ_WRITE_TOKEN missing. Receipt not uploaded.')
      return null
    }

    const paymentId = data.payment.id
    const { url } = await put(`receipts/${paymentId}.pdf`, Buffer.from(pdfBuffer), {
      access: 'public',
      contentType: 'application/pdf',
    })

    return url
  } catch (err) {
    if (browser) await browser.close()
    console.error('[generateReceipt] Generation failed:', err)
    return null
  }
}
