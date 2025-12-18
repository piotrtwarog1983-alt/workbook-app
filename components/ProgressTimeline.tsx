'use client'

interface ProgressTimelineProps {
  completedPages: number[]
  onNavigate: (pageNumber: number) => void
}

// Etapy kursu z przypisanymi stronami
const STAGES = [
  { id: 1, label: 'światło', targetPage: 7 },
  { id: 2, label: 'horyzont', targetPage: 15 },
  { id: 3, label: 'kompozycja', targetPage: 20 },
  { id: 4, label: 'perspektywa', targetPage: 29 },
  { id: 5, label: 'proporcje', targetPage: 35 },
  { id: 6, label: 'retusz', targetPage: 49 },
]

// Strony z uploadem zdjęć przypisane do etapów
const PROGRESS_PAGE_TO_STAGE: { [key: number]: number } = {
  7: 1,   // światło
  15: 2,  // horyzont
  20: 3,  // kompozycja
  29: 4,  // perspektywa
  35: 5,  // proporcje
  40: 5,  // proporcje (dodatkowe)
  49: 6,  // retusz
}

export function ProgressTimeline({ completedPages, onNavigate }: ProgressTimelineProps) {
  // Sprawdź które etapy są ukończone (mają przynajmniej jedno zdjęcie)
  const completedStages = new Set<number>()
  completedPages.forEach(page => {
    const stage = PROGRESS_PAGE_TO_STAGE[page]
    if (stage) {
      completedStages.add(stage)
    }
  })

  return (
    <div className="flex items-center justify-center w-full">
      {STAGES.map((stage, index) => {
        const isCompleted = completedStages.has(stage.id)
        const isLast = index === STAGES.length - 1

        return (
          <div key={stage.id} className="flex items-center">
            {/* Dot z etykietą */}
            <button
              onClick={() => onNavigate(stage.targetPage)}
              className="flex flex-col items-center group"
              title={`Przejdź do: ${stage.label}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                    : 'bg-gray-700 border-2 border-gray-500'
                } group-hover:scale-110`}
              >
                {isCompleted && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-[10px] mt-1 whitespace-nowrap transition-colors ${
                isCompleted ? 'text-cyan-400' : 'text-gray-400 group-hover:text-white'
              }`}>
                {stage.label}
              </span>
            </button>

            {/* Linia łącząca (nie dla ostatniego) */}
            {!isLast && (
              <div className="w-8 sm:w-10 lg:w-12 h-[2px] mx-1 relative">
                <div className={`absolute inset-0 ${isCompleted ? 'bg-cyan-500' : 'bg-gray-600'}`} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
