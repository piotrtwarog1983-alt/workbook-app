'use client'

import { useState } from 'react'
import { ProgressGallery } from '../shared/ProgressGallery'
import { ChatBox } from '../shared/ChatBox'
import { VideoPlayer } from '../shared/VideoPlayer'
import { useLanguage } from '@/lib/LanguageContext'
import { Language } from '@/lib/translations'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  currentPageNumber: number
  onLogout: () => void
  onProgressUpdate: (pages: number[]) => void
}

export function MobileMenu({
  isOpen,
  onClose,
  currentPageNumber,
  onLogout,
  onProgressUpdate
}: MobileMenuProps) {
  const { t, language, setLanguage } = useLanguage()
  const [activePanel, setActivePanel] = useState<'gallery' | 'chat' | 'video'>('gallery')
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'PL', label: 'Polski', flag: '🇵🇱' },
    { code: 'DE', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'EN', label: 'English', flag: '🇺🇸' },
  ]

  if (!isOpen) return null

  return (
    <div className="lg:hidden fixed inset-0 z-50 bg-[#2D2A26]/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="absolute bottom-0 left-0 right-0 bg-[#FAF8F5] rounded-t-3xl p-4 max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border-t border-[#C9A962]/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-1 bg-[#C9A962]/40 rounded-full"></div>
        </div>
        
        {/* Header with close, language and logout */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[#2D2A26] font-medium">Menu</h3>
          <div className="flex gap-2">
            {/* Language selector */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="p-2 bg-white border border-[#C9A962]/20 rounded-lg text-[#6B6560] flex items-center gap-1 shadow-sm"
              >
                <span>{languages.find(l => l.code === language)?.flag}</span>
                <span className="text-xs">{language}</span>
              </button>
              {showLanguageMenu && (
                <div className="absolute top-full right-0 mt-1 py-1 w-32 bg-white border border-[#C9A962]/20 rounded-lg shadow-xl z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { setLanguage(lang.code); setShowLanguageMenu(false) }}
                      className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                        language === lang.code ? 'text-[#C9A962] bg-[#C9A962]/10' : 'text-[#6B6560] hover:bg-[#F5F0E8]'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={onLogout}
              className="p-2 bg-white border border-[#C9A962]/20 rounded-lg text-[#6B6560] shadow-sm hover:text-[#C9A962]"
              aria-label={t.common.logout}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white border border-[#C9A962]/20 rounded-lg text-[#6B6560] shadow-sm hover:text-[#C9A962]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Panel switching buttons */}
        <div className="flex gap-2 mb-4 justify-center">
          <button
            onClick={() => setActivePanel('gallery')}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activePanel === 'gallery' 
                ? 'bg-gradient-to-r from-[#C9A962] to-[#D4BC7B] text-white shadow-md' 
                : 'bg-white border border-[#C9A962]/20 text-[#6B6560]'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            </svg>
            <span className="text-sm">{t.course.yourProgress}</span>
          </button>
          <button
            onClick={() => setActivePanel('chat')}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activePanel === 'chat' 
                ? 'bg-gradient-to-r from-[#C9A962] to-[#D4BC7B] text-white shadow-md' 
                : 'bg-white border border-[#C9A962]/20 text-[#6B6560]'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm">{t.chat.title}</span>
          </button>
          <button
            onClick={() => setActivePanel('video')}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activePanel === 'video' 
                ? 'bg-gradient-to-r from-[#C9A962] to-[#D4BC7B] text-white shadow-md' 
                : 'bg-white border border-[#C9A962]/20 text-[#6B6560]'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">Video</span>
          </button>
        </div>
        
        {/* Panel content */}
        <div className="flex-1 overflow-hidden rounded-xl min-h-[300px] bg-white border border-[#C9A962]/10 shadow-inner">
          {activePanel === 'gallery' && (
            <ProgressGallery onProgressUpdate={onProgressUpdate} />
          )}
          {activePanel === 'chat' && (
            <div className="w-full h-full p-4 overflow-auto">
              <ChatBox />
            </div>
          )}
          {activePanel === 'video' && (
            <VideoPlayer pageNumber={currentPageNumber} />
          )}
        </div>
      </div>
    </div>
  )
}
