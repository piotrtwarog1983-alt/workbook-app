'use client'

import dynamic from 'next/dynamic'
import { useDevice } from '@/lib/DeviceContext'

// Dynamiczne importy - każda wersja ładowana osobno
const DesktopCourseViewer = dynamic(
  () => import('./desktop/CourseViewer').then(mod => mod.CourseViewer),
  { 
    ssr: false
  }
)

const MobileCourseViewer = dynamic(
  () => import('./mobile/CourseViewer').then(mod => mod.CourseViewer),
  { 
    ssr: false
  }
)

interface CourseViewerWrapperProps {
  courseSlug: string
}

export function CourseViewerWrapper({ courseSlug }: CourseViewerWrapperProps) {
  const { device, isLoading } = useDevice()

  // Czekaj na wykrycie urządzenia
  if (isLoading) {
    return null
  }

  // Renderuj odpowiednią wersję na podstawie wykrytego urządzenia
  if (device === 'mobile') {
    return <MobileCourseViewer courseSlug={courseSlug} />
  }

  return <DesktopCourseViewer courseSlug={courseSlug} />
}


