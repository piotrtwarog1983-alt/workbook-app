'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, Language, TranslationKeys } from './translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: TranslationKeys
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Wykryj język przeglądarki
function detectBrowserLanguage(): Language {
  if (typeof window === 'undefined') return 'PL'
  
  const browserLang = navigator.language || (navigator as any).userLanguage || ''
  const langCode = browserLang.toLowerCase().split('-')[0]
  
  // Mapowanie kodów języków
  if (langCode === 'de') return 'DE'
  if (langCode === 'pl') return 'PL'
  
  // Domyślnie polski
  return 'PL'
}

// Pobierz zapisany język z localStorage
function getSavedLanguage(): Language | null {
  if (typeof window === 'undefined') return null
  const saved = localStorage.getItem('app-language')
  if (saved === 'PL' || saved === 'DE') return saved
  return null
}

// Zapisz język do localStorage
function saveLanguage(lang: Language): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('app-language', lang)
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('PL')
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Sprawdź zapisany język, jeśli nie ma - wykryj z przeglądarki
    const savedLang = getSavedLanguage()
    const detectedLang = savedLang || detectBrowserLanguage()
    setLanguageState(detectedLang)
    setIsInitialized(true)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    saveLanguage(lang)
  }

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language] as TranslationKeys,
  }

  // Pokaż dzieci dopiero po inicjalizacji, aby uniknąć mismatch SSR
  if (!isInitialized) {
    return null
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Hook do pobierania samych tłumaczeń (bez settera)
export function useTranslation() {
  const { t, language } = useLanguage()
  return { t, language }
}








