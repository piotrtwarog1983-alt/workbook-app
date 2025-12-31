'use client'

import { useState } from 'react'
import { ProgressGallery } from '../shared/ProgressGallery'
import { DictionaryInline } from '../shared/DictionaryInline'
import { ChatBox } from '../shared/ChatBox'
import { VideoPlayer, VIDEO_PAGES } from '../shared/VideoPlayer'
import { ProgressTimeline } from '../shared/ProgressTimeline'
import { useLanguage } from '@/lib/LanguageContext'

interface FunctionsPanelProps {
  currentPageNumber: number
  completedPages: number[]
  onProgressUpdate: (pages: number[]) => void
  onGoToPage: (pageNumber: number) => void
}

export function FunctionsPanel({
  currentPageNumber,
  completedPages,
  onProgressUpdate,
  onGoToPage
}: FunctionsPanelProps) {
  const { t, language, setLanguage } = useLanguage()
  const [activePanel, setActivePanel] = useState<'gallery' | 'dictionary' | 'chat' | 'video'>('gallery')
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)

  // Auto-switch to video for specific pages
  const shouldShowVideo = VIDEO_PAGES.includes(currentPageNumber)

  return (
    <div className="panel-elegant panel-glow p-5 rounded-2xl h-auto" style={{ minHeight: '680px' }}>
      {/* Panel switching buttons */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        <button
          onClick={() => setActivePanel('gallery')}
          className={`w-14 h-14 flex items-center justify-center ${activePanel === 'gallery' ? 'btn-icon-elegant-active' : 'btn-icon-elegant'}`}
          aria-label={t.course.yourProgress}
          title={t.course.yourProgress}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <button
          onClick={() => setActivePanel('dictionary')}
          className={`w-14 h-14 flex items-center justify-center ${activePanel === 'dictionary' ? 'btn-icon-elegant-active' : 'btn-icon-elegant'}`}
          aria-label={t.dictionary.title}
          title={t.dictionary.title}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </button>

        <button
          onClick={() => setActivePanel('chat')}
          className={`w-14 h-14 flex items-center justify-center ${activePanel === 'chat' ? 'btn-icon-elegant-active' : 'btn-icon-elegant'}`}
          aria-label={t.chat.title}
          title={t.chat.title}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>

        <button
          onClick={() => setActivePanel('video')}
          className={`w-14 h-14 flex items-center justify-center ${activePanel === 'video' || shouldShowVideo ? 'btn-icon-elegant-active' : 'btn-icon-elegant'}`}
          aria-label="Video"
          title="Video"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* Panel content */}
      <div className="w-[380px] h-[520px] overflow-hidden rounded-xl">
        {activePanel === 'gallery' && (
          <ProgressGallery onProgressUpdate={onProgressUpdate} />
        )}
        {activePanel === 'dictionary' && (
          <div className="w-full h-full p-4 panel-elegant panel-glow overflow-auto">
            <DictionaryInline />
          </div>
        )}
        {activePanel === 'chat' && (
          <div className="w-full h-full p-4 panel-elegant panel-glow overflow-auto">
            <ChatBox />
          </div>
        )}
        {activePanel === 'video' && (
          <VideoPlayer pageNumber={currentPageNumber} />
        )}
      </div>

      {/* Progress timeline */}
      <div className="mt-4 mb-3">
        <ProgressTimeline
          completedPages={completedPages}
          onNavigate={onGoToPage}
        />
      </div>

      {/* Language switcher */}
      <div className="relative ml-auto w-14 h-14">
        <button
          onClick={() => setShowLanguageMenu(!showLanguageMenu)}
          className={`w-14 h-14 flex items-center justify-center ${showLanguageMenu ? 'btn-icon-elegant-active' : 'btn-icon-elegant'}`}
          aria-label="Language"
          title="Language"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        </button>

        {showLanguageMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowLanguageMenu(false)} />
            <div className="absolute bottom-48 right-16 py-2 w-36 panel-elegant panel-glow rounded-lg shadow-2xl z-50">
              <button
                onClick={() => { setLanguage('PL'); setShowLanguageMenu(false) }}
                className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                  language === 'PL' ? 'text-cyan-400 bg-cyan-500/10' : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>🇵🇱</span>
                <span>Polski</span>
                {language === 'PL' && (
                  <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => { setLanguage('DE'); setShowLanguageMenu(false) }}
                className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                  language === 'DE' ? 'text-cyan-400 bg-cyan-500/10' : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>🇩🇪</span>
                <span>Deutsch</span>
                {language === 'DE' && (
                  <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => { setLanguage('EN'); setShowLanguageMenu(false) }}
                className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                  language === 'EN' ? 'text-cyan-400 bg-cyan-500/10' : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>🇺🇸</span>
                <span>English</span>
                {language === 'EN' && (
                  <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
