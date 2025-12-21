// Utility functions for the application

/**
 * Parse tips JSON string to array
 */
export function parseTips(tipsJson?: string): string[] {
  if (!tipsJson) return []
  try {
    const parsed = JSON.parse(tipsJson)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Parse content JSON string
 */
export function parseContent(contentJson?: string): any {
  if (!contentJson) return null
  try {
    return JSON.parse(contentJson)
  } catch {
    return { text: contentJson }
  }
}

/**
 * Get content type from parsed content
 */
export function getContentType(content: any): string {
  return content?.type || 'unknown'
}

/**
 * Check if content is a specific type
 */
export function isContentType(content: any, type: string): boolean {
  return content?.type === type
}

/**
 * Build image URL for course page
 */
export function buildCourseImageUrl(imageUrl: string, pageNumber: number): string {
  if (!imageUrl) return ''
  return imageUrl.startsWith('/') 
    ? imageUrl 
    : `/course/strona ${pageNumber}/Foto/${imageUrl}`
}

/**
 * Content types that require text file loading
 */
export const TEXT_FILE_CONTENT_TYPES = [
  'image-overlay',
  'quote-text',
  'image-overlay-text-top',
  'text-image-split',
  'formatted-text',
  'image-overlay-text-file',
  'image-overlay-text-white',
  'black-header-image',
  'white-header-image',
  'two-images-top-text',
  'three-images-top-text',
  'dictionary',
  'simple-text',
  'two-images-container',
  'image-top-text-bottom'
]

/**
 * Pages that should use black text instead of white
 */
export const PAGES_WITH_BLACK_TEXT = new Set([3, 8, 12, 13, 18, 31, 45, 46, 47, 51])

/**
 * Pages that use mobile image-top-text-bottom layout
 */
export const MOBILE_IMAGE_TOP_TEXT_PAGES = new Set([4, 8, 11, 13, 18, 23, 26, 31, 37, 42])

/**
 * QR upload page numbers
 */
export const QR_UPLOAD_PAGES = [7, 15, 20, 29, 35, 40, 49]

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => { inThrottle = false }, limit)
    }
  }
}
