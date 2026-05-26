import { headers } from 'next/headers'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

type LimitResult = Awaited<ReturnType<Ratelimit['limit']>>

const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

const redis =
  redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken,
      })
    : null

const allowAllLimiter = {
  async limit(): Promise<Pick<LimitResult, 'success'>> {
    return { success: true }
  },
}

export const loginLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '15 m'),
      prefix: 'zaya:login',
    })
  : allowAllLimiter

export const apiLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '15 m'),
      prefix: 'zaya:api',
    })
  : allowAllLimiter

export async function getClientIp(): Promise<string> {
  const requestHeaders = await headers()
  const forwardedFor = requestHeaders.get('x-forwarded-for')
  return forwardedFor?.split(',')[0]?.trim() || requestHeaders.get('x-real-ip') || 'unknown'
}

export async function enforceApiRateLimit(): Promise<Response | null> {
  const ip = await getClientIp()
  const { success } = await apiLimiter.limit(ip)

  if (!success) {
    return Response.json({ error: 'Too many requests' }, { status: 429 })
  }

  return null
}
