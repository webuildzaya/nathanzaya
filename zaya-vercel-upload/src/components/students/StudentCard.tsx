import Link from 'next/link'
import Image from 'next/image'
import type { StudentListItem } from '@/types/student'
import StudentStatusBadge from './StudentStatusBadge'

interface Props {
  student: StudentListItem
}

export default function StudentCard({ student }: Props) {
  const initials = student.fullName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <Link
      href={`/students/${student.id}`}
      className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-sm active:bg-gray-50 transition-all"
    >
      {/* Avatar */}
      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center overflow-hidden">
        {student.photoUrl ? (
          <Image
            src={student.photoUrl}
            alt={student.fullName}
            width={48}
            height={48}
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="text-blue-600 font-semibold text-sm">{initials}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{student.fullName}</p>
        <p className="text-xs text-gray-500 mt-0.5">{student.studentCode}</p>
        {student.coursePackage && (
          <p className="text-xs text-gray-500 truncate mt-0.5">{student.coursePackage.name}</p>
        )}
      </div>

      {/* Badge */}
      <div className="flex-shrink-0">
        <StudentStatusBadge status={student.paymentStatus} type="payment" />
      </div>
    </Link>
  )
}
