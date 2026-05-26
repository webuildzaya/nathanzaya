export async function sendWhatsApp(phone: string, message: string) {
  const formattedPhone = formatNigerianPhone(phone)

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: { body: message },
      }),
    }
  )

  if (!response.ok) {
    await sendSMS(phone, message) // automatic fallback
  }
}

export async function sendSMS(phone: string, message: string) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AfricasTalking = require('africastalking')
  const client = AfricasTalking({
    apiKey: process.env.AFRICASTALKING_API_KEY,
    username: process.env.AFRICASTALKING_USERNAME,
  })
  await client.SMS.send({
    to: [formatNigerianPhone(phone)],
    message,
  })
}

function formatNigerianPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('0')) return '+234' + cleaned.slice(1)
  if (cleaned.startsWith('234')) return '+' + cleaned
  return '+234' + cleaned
}
