'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function CoursePageRedirect() {
  const router = useRouter()
  const params = useParams()
  
  useEffect(() => {
    // Przekieruj na główną stronę kursu
    router.replace('/course')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-lg mb-4">Przekierowywanie...</p>
        <p className="text-sm text-gray-500">
          Strony kursu są dostępne na <a href="/course" className="text-primary-600 underline">/course</a>
        </p>
      </div>
    </div>
  )
}

