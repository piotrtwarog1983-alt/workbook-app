'use client'

import { useState } from 'react'
import { ProgressGallery } from '../ProgressGallery'
import { DictionaryInline } from '../DictionaryInline'
import { ChatBox } from '../ChatBox'
import { VideoPlayer } from '../VideoPlayer'
import { useLanguage } from '@/lib/LanguageContext'

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
  const { t } = useLanguage()
  const [activePanel, setActivePanel] = useState<'gallery' | 'dictionary' | 'chat' | 'video'>('gallery')

  if (!isOpen) return null

  return (
    <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-3xl p-4 max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-1 bg-gray-600 rounded-full"></div>
        </div>
        
        {/* Header with close and logout */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-medium">Menu</h3>
          <div className="flex gap-2">
            <button
              onClick={onLogout}
              className="p-2 bg-gray-800 rounded-lg text-white/70"
              aria-label={t.common.logout}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-gray-800 rounded-lg text-white/70"
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
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 ${
              activePanel === 'gallery' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            </svg>
            <span className="text-sm">{t.course.yourProgress}</span>
          </button>
          <button
            onClick={() => setActivePanel('dictionary')}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 ${
              activePanel === 'dictionary' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-sm">{t.dictionary.title}</span>
          </button>
        </div>
        <div className="flex gap-2 mb-4 justify-center">
          <button
            onClick={() => setActivePanel('chat')}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 ${
              activePanel === 'chat' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm">{t.chat.title}</span>
          </button>
          <button
            onClick={() => setActivePanel('video')}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 ${
              activePanel === 'video' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400'
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
        <div className="flex-1 overflow-hidden rounded-xl min-h-[300px]">
          {activePanel === 'gallery' && (
            <ProgressGallery onProgressUpdate={onProgressUpdate} />
          )}
          {activePanel === 'dictionary' && (
            <div className="w-full h-full p-4 panel-elegant panel-glow overflow-auto rounded-xl">
              <DictionaryInline />
            </div>
          )}
          {activePanel === 'chat' && (
            <div className="w-full h-full p-4 panel-elegant panel-glow overflow-auto rounded-xl">
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
