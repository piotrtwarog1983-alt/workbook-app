'use client'

import { useState, useEffect, useCallback } from 'react'

interface CoursePage {
  id: string
  pageNumber: number
  title?: string
  content?: string
  imageUrl?: string
  tips?: string
}

interface NavigationState {
  currentPageIndex: number
  isTransitioning: boolean
  transitionDirection: 'up' | 'down' | null
  exitingPageIndex: number | null
}

interface TouchState {
  touchStart: { x: number; y: number } | null
  touchEnd: { x: number; y: number } | null
}

interface UseCourseNavigationProps {
  pages: CoursePage[]
  canGoToNextPage?: () => boolean
}

interface UseCourseNavigationReturn extends NavigationState {
  nextPage: () => void
  prevPage: () => void
  goToPage: (pageNumber: number) => void
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: () => void
  setCurrentPageIndex: (index: number) => void
}

const TRANSITION_DURATION = 800
const MIN_SWIPE_DISTANCE = 30

export function useCourseNavigation({
  pages,
  canGoToNextPage = () => true
}: UseCourseNavigationProps): UseCourseNavigationReturn {
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionDirection, setTransitionDirection] = useState<'up' | 'down' | null>(null)
  const [exitingPageIndex, setExitingPageIndex] = useState<number | null>(null)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)

  // Przywróć ostatnią stronę z localStorage
  useEffect(() => {
    const savedPage = localStorage.getItem('lastCoursePage')
    if (savedPage) {
      const pageIndex = parseInt(savedPage, 10)
      if (!isNaN(pageIndex) && pageIndex >= 0 && pageIndex < pages.length) {
        setCurrentPageIndex(pageIndex)
      }
    }
  }, [pages.length])

  // Zapisz aktualną stronę do localStorage
  useEffect(() => {
    if (currentPageIndex >= 0) {
      localStorage.setItem('lastCoursePage', currentPageIndex.toString())
    }
  }, [currentPageIndex])

  const startTransition = useCallback((direction: 'up' | 'down', fromIndex: number) => {
    setExitingPageIndex(fromIndex)
    setTransitionDirection(direction)
    setIsTransitioning(true)
    setTimeout(() => {
      setIsTransitioning(false)
      setTransitionDirection(null)
      setExitingPageIndex(null)
    }, TRANSITION_DURATION)
  }, [])

  const nextPage = useCallback(() => {
    if (currentPageIndex < pages.length - 1 && !isTransitioning && canGoToNextPage()) {
      startTransition('up', currentPageIndex)
      setCurrentPageIndex(currentPageIndex + 1)
    }
  }, [currentPageIndex, pages.length, isTransitioning, canGoToNextPage, startTransition])

  const prevPage = useCallback(() => {
    if (currentPageIndex > 0 && !isTransitioning) {
      startTransition('down', currentPageIndex)
      setCurrentPageIndex(currentPageIndex - 1)
    }
  }, [currentPageIndex, isTransitioning, startTransition])

  const goToPage = useCallback((pageNumber: number) => {
    if (isTransitioning) return
    
    const targetIndex = pages.findIndex((p) => p.pageNumber === pageNumber)
    if (targetIndex === -1 || targetIndex === currentPageIndex) return
    
    const direction = targetIndex > currentPageIndex ? 'up' : 'down'
    startTransition(direction, currentPageIndex)
    setCurrentPageIndex(targetIndex)
  }, [pages, currentPageIndex, isTransitioning, startTransition])

  // Touch handlers for mobile swipe
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }, [])

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return
    
    const distanceX = touchStart.x - touchEnd.x
    const distanceY = touchStart.y - touchEnd.y
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY)
    
    if (isHorizontalSwipe && Math.abs(distanceX) > MIN_SWIPE_DISTANCE) {
      if (distanceX > 0) {
        nextPage()
      } else {
        prevPage()
      }
    }
    
    setTouchStart(null)
    setTouchEnd(null)
  }, [touchStart, touchEnd, nextPage, prevPage])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isTransitioning) return
      if (e.key === 'ArrowLeft') {
        prevPage()
      } else if (e.key === 'ArrowRight') {
        nextPage()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isTransitioning, nextPage, prevPage])

  return {
    currentPageIndex,
    isTransitioning,
    transitionDirection,
    exitingPageIndex,
    nextPage,
    prevPage,
    goToPage,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    setCurrentPageIndex
  }
}
