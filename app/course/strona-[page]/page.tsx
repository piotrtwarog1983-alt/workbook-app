'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function CoursePageRedirect() {
  const router = useRouter()
  const params = useParams()
  const [checking, setChecking] = useState(true)
  
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const token = localStorage.getItem('token')
      
      if (!token) {
        router.replace('/login')
        return
      }

      // Weryfikuj token z serwerem
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          localStorage.removeItem('token')
          router.replace('/login')
          return
        }

        // Token OK - przekieruj na kurs
        router.replace('/course')
      } catch (error) {
        localStorage.removeItem('token')
        router.replace('/login')
      }
    }

    checkAuthAndRedirect()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-lg mb-4 text-white">Przekierowywanie...</p>
      </div>
    </div>
  )
}

