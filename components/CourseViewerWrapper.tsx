'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useDevice } from '@/lib/DeviceContext'

// Komponent loadera z logo
const LogoLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-black">
    <img
      src="/course/ikony/theone.png"
      alt="Loading"
      className="w-32 h-32 object-contain"
    />
  </div>
)

// Dynamiczne importy - każda wersja ładowana osobno
const DesktopCourseViewer = dynamic(
  () => import('./desktop/CourseViewer').then(mod => mod.CourseViewer),
  { 
    ssr: false,
    loading: () => <LogoLoader />
  }
)

const MobileCourseViewer = dynamic(
  () => import('./mobile/CourseViewer').then(mod => mod.CourseViewer),
  { 
    ssr: false,
    loading: () => <LogoLoader />
  }
)

interface CourseViewerWrapperProps {
  courseSlug: string
}

export function CourseViewerWrapper({ courseSlug }: CourseViewerWrapperProps) {
  const { device, isLoading } = useDevice()
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)

  // Minimalny czas wyświetlania animacji - 3 sekundy
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  // Pokazuj loader dopóki nie minie minimum 3 sekund LUB trwa ładowanie
  if (!minTimeElapsed || isLoading) {
    return <LogoLoader />
  }

  // Renderuj odpowiednią wersję na podstawie wykrytego urządzenia
  if (device === 'mobile') {
    return <MobileCourseViewer courseSlug={courseSlug} />
  }

  return <DesktopCourseViewer courseSlug={courseSlug} />
}


