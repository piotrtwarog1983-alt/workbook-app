'use client'

import { useLanguage } from '@/lib/LanguageContext'

interface UpdateNotificationProps {
  onUpdate: () => void
  onDismiss?: () => void
}

export function UpdateNotification({ onUpdate, onDismiss }: UpdateNotificationProps) {
  const { t } = useLanguage()
  
  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ 
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
      {/* Modal container */}
      <div 
        className="relative w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(35, 40, 50, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 0 60px 15px rgba(255, 255, 255, 0.08), 0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Glow effect top */}
        <div 
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)'
          }}
        />
        
        {/* Content */}
        <div className="p-6 text-center">
          {/* Icon */}
          <div 
            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5"
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(79, 70, 229, 0.3) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.4)'
            }}
          >
            <svg 
              className="w-8 h-8 text-indigo-400" 
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
          </div>
          
          {/* Title */}
          <h2 className="text-xl font-semibold text-white mb-2">
            {t.common.updateAvailable}
          </h2>
          
          {/* Description */}
          <p className="text-sm text-white/60 mb-6">
            {t.common.updateDescription}
          </p>
          
          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onUpdate}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(79, 70, 229, 0.9) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)'
              }}
            >
              {t.common.updateNow}
            </button>
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="w-full py-3 px-4 rounded-xl font-medium text-white/70 transition-all duration-200 hover:text-white hover:bg-white/5 active:scale-[0.98]"
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                {t.common.later}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
