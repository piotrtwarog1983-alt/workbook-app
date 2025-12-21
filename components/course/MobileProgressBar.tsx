'use client'

interface MobileProgressBarProps {
  pages: any[]
  currentPageIndex: number
  onMenuClick: () => void
}

export function MobileProgressBar({ pages, currentPageIndex, onMenuClick }: MobileProgressBarProps) {
  const maxDots = 20
  const visiblePages = pages.slice(0, Math.min(pages.length, maxDots))
  const hasMore = pages.length > maxDots

  return (
    <div className="lg:hidden fixed bottom-4 left-0 right-0 flex justify-center items-center gap-3 z-40 px-4">
      {/* Instagram-style progress dots/bars */}
      <div className="bg-gray-900/70 backdrop-blur-sm px-3 py-2 rounded-full flex items-center gap-1">
        {visiblePages.map((_, idx) => (
          <div
            key={idx}
            className={`h-1 rounded-full transition-all duration-300 ${
              idx === currentPageIndex 
                ? 'w-4 bg-orange-500' 
                : idx < currentPageIndex 
                  ? 'w-1.5 bg-white/60' 
                  : 'w-1.5 bg-white/30'
            }`}
          />
        ))}
        {hasMore && (
          <span className="text-white/50 text-[10px] ml-1">+{pages.length - maxDots}</span>
        )}
      </div>
      
      {/* Menu button */}
      <button
        onClick={onMenuClick}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-500/90 backdrop-blur-sm"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  )
}
