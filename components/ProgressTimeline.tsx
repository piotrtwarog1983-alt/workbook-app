'use client'

import { useTranslation } from '@/lib/LanguageContext'

interface ProgressTimelineProps {
  completedPages: number[]
  onNavigate: (pageNumber: number) => void
}

// Etapy kursu z przypisanymi stronami (klucz id mapuje na klucz w tłumaczeniach)
const STAGES = [
  { id: 1, labelKey: 'light', targetPage: 11 },
  { id: 2, labelKey: 'horizon', targetPage: 17 },
  { id: 3, labelKey: 'composition', targetPage: 22 },
  { id: 4, labelKey: 'perspective', targetPage: 31 },
  { id: 5, labelKey: 'proportions', targetPage: 37 },
  { id: 6, labelKey: 'retouching', targetPage: 42 },
] as const

// Strony z uploadem zdjęć przypisane do etapów
const PROGRESS_PAGE_TO_STAGE: { [key: number]: number } = {
  11: 1,  // światło
  17: 2,  // horyzont
  22: 3,  // kompozycja
  31: 4,  // perspektywa
  37: 5,  // proporcje
  42: 6,  // retusz
}

export function ProgressTimeline({ completedPages, onNavigate }: ProgressTimelineProps) {
  const { t } = useTranslation()
  
  // Sprawdź które etapy są ukończone (mają przynajmniej jedno zdjęcie)
  const completedStages = new Set<number>()
  completedPages.forEach(page => {
    const stage = PROGRESS_PAGE_TO_STAGE[page]
    if (stage) {
      completedStages.add(stage)
    }
  })

  // Mapowanie kluczy na przetłumaczone etykiety
  const getLabel = (labelKey: typeof STAGES[number]['labelKey']) => {
    return t.progress[labelKey]
  }

  return (
    <div className="flex items-start justify-between w-full">
      {STAGES.map((stage, index) => {
        const isCompleted = completedStages.has(stage.id)
        const isLast = index === STAGES.length - 1
        const label = getLabel(stage.labelKey)

        return (
          <div key={stage.id} className="flex items-start">
            {/* Dot z etykietą */}
            <button
              onClick={() => onNavigate(stage.targetPage)}
              className="flex flex-col items-center group"
              title={`${t.progress.goTo} ${label}`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                    : 'bg-gray-700 border-2 border-gray-500'
                } group-hover:scale-110`}
              >
                {isCompleted && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-[10px] mt-1 whitespace-nowrap transition-colors ${
                isCompleted ? 'text-cyan-400' : 'text-gray-400 group-hover:text-white'
              }`}>
                {label}
              </span>
            </button>
            
            {/* Linia łącząca do następnego - stała szerokość */}
            {!isLast && (
              <div className="w-8 h-[2px] mt-2.5 mx-1">
                <div className={`h-full ${isCompleted ? 'bg-cyan-500' : 'bg-gray-600'}`} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

