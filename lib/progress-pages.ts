// Strony kursu, na których użytkownik może uploadować zdjęcia postępów
// Muszą odpowiadać etapom w ProgressTimeline
export const PROGRESS_PAGES = [11, 17, 22, 31, 37, 42] as const

export type ProgressPageNumber = typeof PROGRESS_PAGES[number]

// Set dla szybkiego sprawdzania czy strona jest stroną postępów
export const PROGRESS_PAGES_SET = new Set<number>(PROGRESS_PAGES)

// Sprawdź czy dana strona jest stroną z uploadem postępów
export function isProgressPage(pageNumber: number): pageNumber is ProgressPageNumber {
  return PROGRESS_PAGES_SET.has(pageNumber)
}

// Mapowanie stron na etapy kursu
export const PAGE_TO_STAGE: Record<ProgressPageNumber, string> = {
  11: 'światło',
  17: 'horyzont',
  22: 'kompozycja',
  31: 'perspektywa',
  37: 'proporcje',
  42: 'retusz'
}

// Pobierz etykietę etapu dla strony
export function getStageLabel(pageNumber: ProgressPageNumber): string {
  return PAGE_TO_STAGE[pageNumber] || ''
}







