'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CourseViewer } from '@/components/CourseViewer'

export default function CoursePage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
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
          // Token nieprawidłowy - usuń i przekieruj
          localStorage.removeItem('token')
          router.replace('/login')
          return
        }

        setIsAuthenticated(true)
      } catch (error) {
        console.error('Auth check error:', error)
        localStorage.removeItem('token')
        router.replace('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-white">Sprawdzanie autoryzacji...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Router przekieruje
  }

  return (
    <div>
      <CourseViewer courseSlug="fotografia-kulinarna" />
    </div>
  )
}

