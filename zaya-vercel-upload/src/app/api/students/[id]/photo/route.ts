import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { enforceApiRateLimit } from '@/lib/rateLimit'
import { put } from '@vercel/blob'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await enforceApiRateLimit()
  if (limited) return limited

  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { schoolId: true, role: true },
  })
  if (!user) return Response.json({ error: 'User not found' }, { status: 403 })

  if (!['SUPER_ADMIN', 'STAFF'].includes(user.role)) {
    return Response.json({ error: 'Access denied' }, { status: 403 })
  }

  const { id } = await params

  // Confirm student belongs to this school
  const student = await prisma.student.findFirst({
    where: { id, schoolId: user.schoolId },
    select: { id: true },
  })
  if (!student) return Response.json({ error: 'Student not found' }, { status: 404 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('photo')
  if (!file || !(file instanceof Blob)) {
    return Response.json({ error: 'No photo provided' }, { status: 400 })
  }

  // Server-side MIME type check
  if (!ALLOWED_MIME.includes(file.type)) {
    return Response.json(
      { error: 'Only JPEG, PNG, and WebP images are accepted' },
      { status: 415 }
    )
  }

  if (file.size > MAX_SIZE) {
    return Response.json({ error: 'Photo must be smaller than 2MB' }, { status: 413 })
  }

  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp'
  const filename = `photos/${crypto.randomUUID()}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const { url } = await put(filename, buffer, {
    access: 'public',
    contentType: file.type,
  })

  await prisma.student.update({
    where: { id, schoolId: user.schoolId },
    data: { photoUrl: url },
  })

  return Response.json({ photoUrl: url })
}
