'use client'

interface ProgressTimelineProps {
  completedPages: number[]
  onNavigate: (pageNumber: number) => void
}

// Etapy kursu z przypisanymi stronami
const STAGES = [
  { id: 1, label: 'światło', targetPage: 11 },
  { id: 2, label: 'kompozycja', targetPage: 22 },
  { id: 3, label: 'perspektywa', targetPage: 31 },
  { id: 4, label: 'stylizacja', targetPage: 37 },
  { id: 5, label: 'edycja', targetPage: 44 },
  { id: 6, label: 'finał', targetPage: 51 },
]

// Strony z uploadem zdjęć przypisane do etapów
const PROGRESS_PAGE_TO_STAGE: { [key: number]: number } = {
  7: 1,   // światło
  15: 2,  // kompozycja
  20: 2,  // kompozycja
  29: 3,  // perspektywa
  35: 4,  // stylizacja
  40: 5,  // edycja
  49: 6,  // finał
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
    <div className="flex items-center justify-between w-full">
      {STAGES.map((stage, index) => {
        const isCompleted = completedStages.has(stage.id)
        const isLast = index === STAGES.length - 1

        return (
          <div key={stage.id} className="flex items-center flex-1">
            {/* Dot z etykietą */}
            <button
              onClick={() => onNavigate(stage.targetPage)}
              className="flex flex-col items-center group relative"
              title={`Przejdź do: ${stage.label}`}
            >
              <div
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  isCompleted
                    ? 'timeline-dot-completed'
                    : 'bg-gray-600 border border-gray-500'
                } group-hover:scale-125`}
              />
              <span className="text-[10px] text-gray-400 mt-1 whitespace-nowrap group-hover:text-white transition-colors">
                {stage.label}
              </span>
            </button>

            {/* Linia łącząca (nie dla ostatniego) */}
            {!isLast && (
              <div className="flex-1 h-[2px] mx-1 bg-gray-700">
                <div
                  className={`h-full transition-all duration-500 ${
                    isCompleted ? 'bg-green-500' : 'bg-transparent'
                  }`}
                  style={{ width: isCompleted ? '100%' : '0%' }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
