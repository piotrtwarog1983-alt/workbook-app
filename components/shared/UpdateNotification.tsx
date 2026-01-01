'use client'

interface UpdateNotificationProps {
  onUpdate: () => void
  onDismiss?: () => void
}

export function UpdateNotification({ onUpdate, onDismiss }: UpdateNotificationProps) {
  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[9999] bg-blue-600 text-white px-4 py-3 shadow-lg"
      style={{ 
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        paddingBottom: '12px'
      }}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Ikona odświeżania */}
          <svg 
            className="w-5 h-5 flex-shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          <p className="text-sm font-medium truncate">
            Dostępna nowa wersja
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 text-sm hover:bg-blue-700 rounded transition-colors"
            >
              Później
            </button>
          )}
          <button
            onClick={onUpdate}
            className="px-4 py-1.5 text-sm font-semibold bg-white text-blue-600 rounded hover:bg-blue-50 transition-colors active:scale-95"
          >
            Odśwież
          </button>
        </div>
      </div>
    </div>
  )
}

