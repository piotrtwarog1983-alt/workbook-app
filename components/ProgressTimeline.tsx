'use client'

import { PROGRESS_PAGES } from '@/lib/progress-pages'

interface ProgressTimelineProps {
  completedPages: number[]
  onNavigate?: (pageNumber: number) => void
}

// Mapowanie stron do etapów
const STAGE_MAPPING: Record<number, string> = {
  7: 'światło',
  15: 'horyzont',
  20: 'kompozycja',
  29: 'perspektywa',
  35: 'proporcje',
  40: 'retusz',
  49: 'retusz', // Druga część retuszu
}

// Mapowanie etapów na strony docelowe (do nawigacji)
const STAGE_TARGET_PAGES: Record<number, number> = {
  7: 11,   // światło → strona 11
  15: 17,  // horyzont → strona 17
  20: 22,  // kompozycja → strona 22
  29: 31,  // perspektywa → strona 31
  35: 37,  // proporcje → strona 37
  40: 42,  // retusz → strona 42
}

const STAGES = [
  { page: 7, name: 'światło' },
  { page: 15, name: 'horyzont' },
  { page: 20, name: 'kompozycja' },
  { page: 29, name: 'perspektywa' },
  { page: 35, name: 'proporcje' },
  { page: 40, name: 'retusz' },
] as const

export function ProgressTimeline({ completedPages, onNavigate }: ProgressTimelineProps) {
  const completedPagesSet = new Set(completedPages)
  
  // Sprawdź, które etapy są ukończone
  const isStageCompleted = (stagePage: number) => {
    if (stagePage === 40) {
      // Etap retuszu jest ukończony, jeśli przesłano zdjęcie na stronie 40 lub 49
      return completedPagesSet.has(40) || completedPagesSet.has(49)
    }
    return completedPagesSet.has(stagePage)
  }
  
  // Znajdź pierwszy nieukończony etap
  const firstIncompleteIndex = STAGES.findIndex(stage => !isStageCompleted(stage.page))
  const completedStagesCount = firstIncompleteIndex === -1 ? STAGES.length : firstIncompleteIndex

  return (
    <div className="w-full mb-4">
      <div className="relative">
        {/* Linia osi */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/20 rounded-full">
          {/* Wypełniona część */}
          <div
            className="absolute top-0 left-0 h-full bg-primary-500 transition-all duration-500 rounded-full"
            style={{
              width: `${(completedStagesCount / STAGES.length) * 100}%`,
            }}
          />
        </div>

        {/* Punkty etapów */}
        <div className="relative flex justify-between">
          {STAGES.map((stage, index) => {
            const isCompleted = isStageCompleted(stage.page)
            const isNext = index === completedStagesCount && !isCompleted

            const targetPage = STAGE_TARGET_PAGES[stage.page]
            
            const handleClick = () => {
              if (onNavigate && targetPage) {
                onNavigate(targetPage)
              }
            }

            return (
              <button
                key={stage.page}
                onClick={handleClick}
                className="flex flex-col items-center relative group cursor-pointer"
                title={`Przejdź do strony ${targetPage}`}
              >
                {/* Punkt */}
                <div
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${
                    isCompleted
                      ? 'bg-primary-500 border-primary-500 group-hover:bg-primary-400'
                      : isNext
                      ? 'bg-primary-500/20 border-primary-500 group-hover:bg-primary-500/30'
                      : 'bg-white/10 border-white/20 group-hover:bg-white/20 group-hover:border-white/30'
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isNext ? 'bg-primary-500' : 'bg-white/30'
                      }`}
                    />
                  )}
                </div>

                {/* Etykieta */}
                <div className="mt-2 text-center">
                  <div
                    className={`text-xs font-medium transition-colors duration-200 ${
                      isCompleted ? 'text-primary-400 group-hover:text-primary-300' : isNext ? 'text-primary-400 group-hover:text-primary-300' : 'text-gray-500 group-hover:text-gray-400'
                    }`}
                  >
                    {stage.name}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

