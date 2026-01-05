'use client'

import { useLanguage } from '@/lib/LanguageContext'
import { Language } from '@/lib/translations'

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  const languages: { code: Language; label: string }[] = [
    { code: 'PL', label: 'Polski' },
    { code: 'DE', label: 'Deutsch' },
    { code: 'EN', label: 'English' },
  ]

  return (
    <div className="flex items-center gap-1">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${
            language === lang.code
              ? 'bg-gradient-to-r from-[#C9A962] to-[#D4BC7B] text-white shadow-sm border border-[#C9A962]'
              : 'text-[#6B6560] hover:text-[#C9A962] hover:bg-[#F5F0E8] border border-transparent'
          }`}
          title={lang.label}
        >
          {lang.code}
        </button>
      ))}
    </div>
  )
}










































