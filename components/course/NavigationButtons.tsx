'use client'

interface NavigationButtonsProps {
  currentPageIndex: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
  canGoNext: boolean
}

export function NavigationButtons({
  currentPageIndex,
  totalPages,
  onPrev,
  onNext,
  canGoNext
}: NavigationButtonsProps) {
  return (
    <div className="hidden lg:flex items-center gap-4 mt-4">
      {/* Previous button */}
      <button
        onClick={onPrev}
        disabled={currentPageIndex === 0}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
          currentPageIndex === 0
            ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
            : 'bg-gray-700/80 text-white hover:bg-orange-500/80'
        }`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      {/* Page indicator */}
      <div className="text-white/60 text-sm font-medium">
        {currentPageIndex + 1} / {totalPages}
      </div>
      
      {/* Next button */}
      <button
        onClick={onNext}
        disabled={currentPageIndex === totalPages - 1 || !canGoNext}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
          currentPageIndex === totalPages - 1 || !canGoNext
            ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
            : 'bg-gray-700/80 text-white hover:bg-orange-500/80'
        }`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
