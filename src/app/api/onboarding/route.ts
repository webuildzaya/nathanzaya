import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { enforceApiRateLimit } from '@/lib/rateLimit'

const normalisePhone = (value: string) => value.replace(/[\s-]/g, '')

const onboardingSchema = z.object({
  schoolName: z.string().trim().min(2, 'School name must be at least 2 characters'),
  schoolAddress: z.string().trim().min(5, 'Please enter a valid address'),
  schoolPhone: z.preprocess(
    (value) => (typeof value === 'string' ? normalisePhone(value) : value),
    z.string().regex(/^(\+234|0)[789][0-9]\d{8}$/, 'Enter a valid Nigerian phone number')
  ),
  schoolEmail: z
    .string()
    .trim()
    .email('Invalid email')
    .optional()
    .or(z.literal('')),
  numInstructors: z.coerce.number().int().min(1, 'At least 1 instructor required'),
  numVehicles: z.coerce.number().int().min(1, 'At least 1 vehicle required'),
  referralSource: z.string().trim().optional(),
})

export async function POST(request: Request) {
  const limited = await enforceApiRateLimit()
  if (limited) return limited

  // 1. Auth check
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // 2. Get user and their linked school
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { schoolId: true, role: true },
  })
  if (!user) return Response.json({ error: 'User not found' }, { status: 403 })

  // 3. Parse and validate body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = onboardingSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    const firstError = Object.values(fieldErrors).flat()[0]

    return Response.json(
      {
        error: firstError || 'Please check the highlighted fields.',
        issues: fieldErrors,
      },
      { status: 422 }
    )
  }

  const {
    schoolName,
    schoolAddress,
    schoolPhone,
    schoolEmail,
    numInstructors,
    numVehicles,
    referralSource,
  } = parsed.data

  try {
    // 4. Update the school record that was created during signup
    await prisma.school.update({
      where: { id: user.schoolId },
      data: {
        name: schoolName,
        address: schoolAddress,
        phone: schoolPhone,
        email: schoolEmail || null,
        onboardingComplete: true,
      },
    })

    // 5. Update user record with extra metadata and mark as onboarded
    await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        ...(referralSource && { referralSource }),
        isOnboarded: true,
        isSetupComplete: true,
      },
    })

    // NOTE: numInstructors / numVehicles are UI-collected preferences stored
    // locally — actual Instructor and Vehicle records are created later via
    // the Instructors and Vehicles management pages. For now we just return
    // them echoed back so the front-end can display a summary if needed.
    return Response.json({
      success: true,
      meta: { numInstructors, numVehicles },
    })
  } catch (error) {
    console.error('[ONBOARDING_ERROR]', error)
    return Response.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
