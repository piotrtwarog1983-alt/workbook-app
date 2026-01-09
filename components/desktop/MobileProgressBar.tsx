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
      <div className="px-3 py-2 rounded-full flex items-center gap-1">
        {visiblePages.map((_, idx) => (
          <div
            key={idx}
            className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${
              idx === currentPageIndex 
                ? 'w-5 bg-white shadow-md' 
                : idx < currentPageIndex 
                  ? 'w-2 bg-white/70' 
                  : 'w-2 bg-white/40'
            }`}
          />
        ))}
        {hasMore && (
          <span className="text-white text-[10px] ml-1 font-medium drop-shadow-md">+{pages.length - maxDots}</span>
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
