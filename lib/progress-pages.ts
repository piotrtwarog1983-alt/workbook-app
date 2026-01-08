// Strony kursu, na których użytkownik może uploadować zdjęcia postępów
// To są strony z QR kodami do uploadu
export const PROGRESS_PAGES = [14, 19, 28, 34, 39] as const

export type ProgressPageNumber = typeof PROGRESS_PAGES[number]

// Set dla szybkiego sprawdzania czy strona jest stroną postępów
export const PROGRESS_PAGES_SET = new Set<number>(PROGRESS_PAGES)

// Sprawdź czy dana strona jest stroną z uploadem postępów
export function isProgressPage(pageNumber: number): pageNumber is ProgressPageNumber {
  return PROGRESS_PAGES_SET.has(pageNumber)
}

// Mapowanie stron na etapy kursu
export const PAGE_TO_STAGE: Record<ProgressPageNumber, string> = {
  14: 'światło',
  19: 'horyzont',
  28: 'kompozycja',
  34: 'perspektywa',
  39: 'proporcje'
}

// Pobierz etykietę etapu dla strony
export function getStageLabel(pageNumber: ProgressPageNumber): string {
  return PAGE_TO_STAGE[pageNumber] || ''
}










































