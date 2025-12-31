// Typy dla komponentów CourseViewer

export interface CoursePage {
  id: string
  pageNumber: number
  title?: string
  content?: string
  imageUrl?: string
  tips?: string
}

export interface CourseViewerProps {
  courseSlug: string
}

// Props dla komponentów Mobile i Desktop
export interface CourseViewerSharedProps {
  course: any
  currentPageIndex: number
  setCurrentPageIndex: (index: number) => void
  loading: boolean
  error: string
  activePanel: 'gallery' | 'dictionary' | 'chat' | 'video'
  setActivePanel: (panel: 'gallery' | 'dictionary' | 'chat' | 'video') => void
  showLanguageMenu: boolean
  setShowLanguageMenu: (show: boolean) => void
  overlayText: string
  setOverlayText: (text: string) => void
  loadingText: boolean
  setLoadingText: (loading: boolean) => void
  completedPages: number[]
  setCompletedPages: (pages: number[] | ((prev: number[]) => number[])) => void
  isTransitioning: boolean
  setIsTransitioning: (transitioning: boolean) => void
  transitionDirection: 'up' | 'down' | null
  setTransitionDirection: (direction: 'up' | 'down' | null) => void
  animationClass: string
  setAnimationClass: (className: string) => void
  fileTips: string[]
  setFileTips: (tips: string[]) => void
  exitingPageIndex: number | null
  setExitingPageIndex: (index: number | null) => void
  userUploadId: string | null
  setUserUploadId: (id: string | null) => void
  showMobileMenu: boolean
  setShowMobileMenu: (show: boolean) => void
  page45Texts: { text1: string; text2: string; text3: string }
  setPage45Texts: (texts: { text1: string; text2: string; text3: string }) => void
  page46Texts: { text1: string; text2: string; text3: string }
  setPage46Texts: (texts: { text1: string; text2: string; text3: string }) => void
  page47Texts: { text1: string; text2: string; text3: string }
  setPage47Texts: (texts: { text1: string; text2: string; text3: string }) => void
  page32Labels: { label1: string; label2: string }
  setPage32Labels: (labels: { label1: string; label2: string }) => void
  qrPageContent: string
  setQrPageContent: (content: string) => void
  qrUploading: boolean
  setQrUploading: (uploading: boolean) => void
  qrUploadStatus: 'idle' | 'success' | 'error'
  setQrUploadStatus: (status: 'idle' | 'success' | 'error') => void
  mobileTexts: Record<number, string>
  setMobileTexts: (texts: Record<number, string> | ((prev: Record<number, string>) => Record<number, string>)) => void
  mobileQRTexts: Record<number, string>
  setMobileQRTexts: (texts: Record<number, string> | ((prev: Record<number, string>) => Record<number, string>)) => void
  language: 'PL' | 'DE' | 'EN'
  setLanguage: (lang: 'PL' | 'DE' | 'EN') => void
  t: any
  router: any
  handleLogout: () => void
  goToPage: (pageNumber: number) => void
  parseTips: (tipsJson?: string) => string[]
  parseContent: (contentJson?: string) => any
}
