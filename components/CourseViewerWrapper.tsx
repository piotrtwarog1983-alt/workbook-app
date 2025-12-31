'use client'

import dynamic from 'next/dynamic'
import { useDevice } from '@/lib/DeviceContext'

// Dynamiczne importy - każda wersja ładowana osobno
const DesktopCourseViewer = dynamic(
  () => import('./desktop/CourseViewer').then(mod => mod.CourseViewer),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-gray-400">Ładowanie wersji desktopowej...</div>
      </div>
    )
  }
)

const MobileCourseViewer = dynamic(
  () => import('./mobile/CourseViewer').then(mod => mod.CourseViewer),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-gray-400">Ładowanie wersji mobilnej...</div>
      </div>
    )
  }
)

interface CourseViewerWrapperProps {
  courseSlug: string
  initialPage?: number
}

export function CourseViewerWrapper({ courseSlug, initialPage }: CourseViewerWrapperProps) {
  const { device, isLoading } = useDevice()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-gray-400">Wykrywanie urządzenia...</div>
      </div>
    )
  }

  // Renderuj odpowiednią wersję na podstawie wykrytego urządzenia
  if (device === 'mobile') {
    return <MobileCourseViewer courseSlug={courseSlug} initialPage={initialPage} />
  }

  return <DesktopCourseViewer courseSlug={courseSlug} initialPage={initialPage} />
}


