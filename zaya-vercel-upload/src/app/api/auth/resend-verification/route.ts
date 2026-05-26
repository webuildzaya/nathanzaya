import { z } from 'zod'
import { enforceApiRateLimit } from '@/lib/rateLimit'

// ── In-memory rate limit store ────────────────────────────────────────────────
// Structure: { email → { count, windowStart } }
// Resets after 1 hour. Fits perfectly for a single-process Next.js dev server.
// In production, swap this for Redis or a DB-backed store.
const rateLimit = new Map<string, { count: number; windowStart: number }>()

const MAX_ATTEMPTS = 3
const WINDOW_MS = 60 * 60 * 1000 // 1 hour

const schema = z.object({
  email: z.string().email('Invalid email address'),
})

// ── POST /api/auth/resend-verification ────────────────────────────────────────
export async function POST(request: Request) {
  const limited = await enforceApiRateLimit()
  if (limited) return limited

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid email' },
      { status: 422 }
    )
  }

  const { email } = parsed.data
  const key = email.toLowerCase()
  const now = Date.now()

  // Check rate limit
  const existing = rateLimit.get(key)
  if (existing) {
    const elapsed = now - existing.windowStart
    if (elapsed < WINDOW_MS) {
      if (existing.count >= MAX_ATTEMPTS) {
        const minutesLeft = Math.ceil((WINDOW_MS - elapsed) / 60_000)
        return Response.json(
          {
            error: `Too many resend attempts. Please wait ${minutesLeft} minute${
              minutesLeft === 1 ? '' : 's'
            } before trying again.`,
          },
          { status: 429 }
        )
      }
      // Increment within window
      existing.count += 1
      rateLimit.set(key, existing)
    } else {
      // Window expired — reset
      rateLimit.set(key, { count: 1, windowStart: now })
    }
  } else {
    rateLimit.set(key, { count: 1, windowStart: now })
  }

  // ── Send verification email ──────────────────────────────────────────────
  // Zaya currently uses magic-link style auth — verification emails are
  // sent via NextAuth's email provider or a transactional email service.
  //
  // For the current build (credentials-only, no email provider configured),
  // we log the resend event and return success. Wire in your email provider
  // (e.g. Resend, Nodemailer, SendGrid) here when ready.
  //
  // Example with Resend:
  //   import { Resend } from 'resend'
  //   const resend = new Resend(process.env.RESEND_API_KEY)
  //   await resend.emails.send({
  //     from: 'noreply@yourdomain.com',
  //     to: email,
  //     subject: 'Verify your Zaya account',
  //     html: `<p>Click <a href="${verificationUrl}">here</a> to verify.</p>`,
  //   })

  console.log(`[resend-verification] Resend requested for: ${email}`)

  return Response.json({
    success: true,
    message: 'Verification email sent. Please check your inbox.',
  })
}
