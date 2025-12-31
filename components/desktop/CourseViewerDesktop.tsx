'use client'

import { CourseViewerSharedProps } from './types'

interface CourseViewerDesktopProps extends CourseViewerSharedProps {
  // Dodatkowe props specyficzne dla desktop jeśli potrzebne
}

export function CourseViewerDesktop(props: CourseViewerDesktopProps) {
  const {
    course,
    currentPageIndex,
    completedPages,
    isTransitioning,
    transitionDirection,
    exitingPageIndex,
    activePanel,
    setActivePanel,
    language,
  } = props

  const pages = course?.pages || []
  const currentPage = pages[currentPageIndex]

  return (
    <div className="relative" style={{ height: '100%' }}>
      <div 
        className="relative overflow-hidden rounded-xl scroll-transition-wrapper" 
        style={{ background: '#ffffff', height: '100%' }}
      >
        {/* TODO: Renderowanie desktop - będzie dodane w następnym etapie */}
        <div className="flex items-center justify-center h-full text-gray-500">
          Desktop view - renderowanie w trakcie implementacji...
          {currentPage && <div className="ml-4">Strona {currentPage.pageNumber}</div>}
        </div>
      </div>
    </div>
  )
}

