'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { CourseViewerSharedProps, CoursePage } from './types'

interface CourseViewerMobileProps extends CourseViewerSharedProps {
  scrollContainerRef: React.RefObject<HTMLDivElement>
  pagesRef: React.MutableRefObject<(HTMLDivElement | null)[]>
  visiblePageRange: { start: number; end: number }
  setVisiblePageRange: (range: { start: number; end: number }) => void
}

export function CourseViewerMobile(props: CourseViewerMobileProps) {
  const {
    course,
    currentPageIndex,
    setCurrentPageIndex,
    completedPages,
    setCompletedPages,
    userUploadId,
    setUserUploadId,
    qrUploading,
    setQrUploading,
    qrUploadStatus,
    setQrUploadStatus,
    mobileTexts,
    mobileQRTexts,
    language,
    scrollContainerRef,
    pagesRef,
    visiblePageRange,
    setVisiblePageRange,
  } = props

  const pages = course?.pages || []

  return (
    <div 
      ref={scrollContainerRef}
      className="relative overflow-y-auto"
      style={{ 
        background: '#ffffff',
        height: 'calc(100vh - 120px)',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      }}
    >
      {/* TODO: Renderowanie stron mobile - będzie dodane w następnym etapie */}
      <div className="p-4 text-center text-gray-500">
        Mobile view - renderowanie w trakcie implementacji...
      </div>
    </div>
  )
}

