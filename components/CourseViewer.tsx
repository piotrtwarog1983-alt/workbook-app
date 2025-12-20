'use client'

import { useState, useEffect, useRef } from 'react'
import Pusher from 'pusher-js'
import { PROGRESS_PAGES, isProgressPage } from '@/lib/progress-pages'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { TipCloud } from './TipCloud'
import { DictionaryInline } from './DictionaryInline'
import { ChatBox } from './ChatBox'
import { PhotoUploadComponent } from './PhotoUploadComponent'
import { QRCodeUpload } from './QRCodeUpload'
import { ProgressGallery } from './ProgressGallery'
import { ProgressEvaluation } from './ProgressEvaluation'
import { ProgressTimeline } from './ProgressTimeline'
import { VideoPlayer, VIDEO_PAGES } from './VideoPlayer'
import { Confetti } from './Confetti'
import { MOCK_COURSE } from '@/lib/mock-data'
import { useTranslation, useLanguage } from '@/lib/LanguageContext'
import { Language } from '@/lib/translations'

interface CoursePage {
  id: string
  pageNumber: number
  title?: string
  content?: string
  imageUrl?: string
  tips?: string
}

interface CourseViewerProps {
  courseSlug: string
}

// MOCK_COURSE jest importowany z @/lib/mock-data

export function CourseViewer({ courseSlug }: CourseViewerProps) {
  const router = useRouter()
  const { t, language, setLanguage } = useLanguage()
  const [course, setCourse] = useState<any>(null)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activePanel, setActivePanel] = useState<'gallery' | 'dictionary' | 'chat' | 'video'>('gallery')
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [overlayText, setOverlayText] = useState<string>('')
  const [loadingText, setLoadingText] = useState(false)
  const [completedPages, setCompletedPages] = useState<number[]>([])
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionDirection, setTransitionDirection] = useState<'up' | 'down' | null>(null)
  const [animationClass, setAnimationClass] = useState<string>('')
  const [fileTips, setFileTips] = useState<string[]>([])
  const [exitingPageIndex, setExitingPageIndex] = useState<number | null>(null)
  const [userUploadId, setUserUploadId] = useState<string | null>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [page45Texts, setPage45Texts] = useState<{ text1: string; text2: string; text3: string }>({
    text1: '',
    text2: '',
    text3: ''
  })
  const [page46Texts, setPage46Texts] = useState<{ text1: string; text2: string; text3: string }>({
    text1: '',
    text2: '',
    text3: ''
  })
  const [page47Texts, setPage47Texts] = useState<{ text1: string; text2: string; text3: string }>({
    text1: '',
    text2: '',
    text3: ''
  })
  const [page32Labels, setPage32Labels] = useState<{ label1: string; label2: string }>({
    label1: '',
    label2: ''
  })
  const [qrPageContent, setQrPageContent] = useState<string>('')
  const pusherRef = useRef<Pusher | null>(null)
  
  // Mapowanie języka z kontekstu na format folderów (PL, DE)
  const currentLang = language

  // Sprawdź czy użytkownik jest zalogowany
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.replace('/login')
    }
  }, [router])

  // Zapisz aktualną stronę do localStorage przy każdej zmianie
  useEffect(() => {
    if (course && currentPageIndex >= 0) {
      localStorage.setItem('lastCoursePage', currentPageIndex.toString())
    }
  }, [currentPageIndex, course])

  // Automatyczne przełączanie na panel video dla stron 44-48
  useEffect(() => {
    if (!course) return
    const pages = course.pages || []
    const currentPage = pages[currentPageIndex]
    if (currentPage && VIDEO_PAGES.includes(currentPage.pageNumber)) {
      setActivePanel('video')
    } else if (activePanel === 'video') {
      // Jeśli opuściliśmy stronę z video, wróć do galerii
      setActivePanel('gallery')
    }
  }, [currentPageIndex, course])

  // Check if we're on mobile (must be with other hooks)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Funkcja wylogowania - zapisz ostatnią stronę przed wylogowaniem
  const handleLogout = () => {
    // Zapisz ostatnią stronę przed wylogowaniem
    localStorage.setItem('lastCoursePage', currentPageIndex.toString())
    localStorage.removeItem('token')
    router.replace('/login')
  }

  // Pobierz uploadId użytkownika i nasłuchuj na nowe uploady
  useEffect(() => {
    const fetchUploadIdAndSetupPusher = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const response = await fetch('/api/user/upload-id', {
          headers: { 'Authorization': `Bearer ${token}` },
        })

        if (!response.ok) return

        const data = await response.json()
        if (data.uploadId) {
          setUserUploadId(data.uploadId)
          
          // Pobierz początkowy stan postępów
          fetchCompletedPages(data.uploadId)
        }
      } catch (error) {
        console.error('Error fetching upload ID:', error)
      }
    }

    fetchUploadIdAndSetupPusher()
  }, [])

  // Funkcja do pobierania ukończonych stron
  const fetchCompletedPages = async (uploadIdValue: string) => {
    try {
      const token = localStorage.getItem('token')
      const completed: number[] = []

      for (const pageNumber of PROGRESS_PAGES) {
        try {
          const response = await fetch(`/api/check-upload?page=${pageNumber}&uploadId=${uploadIdValue}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          })
          const data = await response.json()
          if (data.uploaded && data.imageUrl) {
            completed.push(pageNumber)
          }
        } catch (error) {
          console.error(`Error checking upload for page ${pageNumber}:`, error)
        }
      }

      setCompletedPages(completed)
    } catch (error) {
      console.error('Error fetching completed pages:', error)
    }
  }

  // Nasłuchuj na Pusher events dla nowych uploadów
  useEffect(() => {
    if (!userUploadId) return

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

    if (pusherKey && pusherCluster) {
      pusherRef.current = new Pusher(pusherKey, {
        cluster: pusherCluster,
      })

      const channel = pusherRef.current.subscribe(`progress-${userUploadId}`)
      
      channel.bind('photo:uploaded', (data: { pageNumber: number; imageUrl: string }) => {
        console.log('CourseViewer: Received photo:uploaded event:', data)
        // Dodaj stronę do ukończonych jeśli jeszcze jej nie ma
        setCompletedPages(prev => {
          if (!prev.includes(data.pageNumber)) {
            return [...prev, data.pageNumber]
          }
          return prev
        })
      })

      return () => {
        channel.unbind_all()
        channel.unsubscribe()
        pusherRef.current?.disconnect()
      }
    }
  }, [userUploadId])

useEffect(() => {
  let isActive = true

  async function fetchCourse() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/courses/${courseSlug}`)
      const data = await response.json()

      if (!isActive) return

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Nie udało się pobrać kursu')
      }

      setCourse(data)
      
      // Przywróć ostatnią stronę z localStorage
      const savedPage = localStorage.getItem('lastCoursePage')
      if (savedPage) {
        const pageIndex = parseInt(savedPage, 10)
        if (!isNaN(pageIndex) && pageIndex >= 0 && pageIndex < (data.pages?.length || 51)) {
          setCurrentPageIndex(pageIndex)
        }
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Course fetch error:', err)
      if (!isActive) return

      if (courseSlug === MOCK_COURSE.slug) {
        setCourse(MOCK_COURSE)
        setError('Nie udało się połączyć z bazą - wyświetlamy dane lokalne.')
        setLoading(false)
      } else {
        setError('Błąd ładowania kursu')
        setLoading(false)
      }
    }
  }

  fetchCourse()

  return () => {
    isActive = false
  }
}, [courseSlug])

  // Pobierz tipy z plików dla aktualnej strony
  useEffect(() => {
    if (!course) return
    
    const pages = course.pages || []
    const currentPage = pages[currentPageIndex]
    if (!currentPage) return

    const fetchTips = async () => {
      try {
        const response = await fetch(`/api/course-tips/${currentPage.pageNumber}/${currentLang}`)
        const data = await response.json()
        if (data.tips && Array.isArray(data.tips)) {
          setFileTips(data.tips)
        } else {
          setFileTips([])
        }
      } catch (error) {
        console.error('Error fetching tips:', error)
        setFileTips([])
      }
    }

    fetchTips()
  }, [course, currentPageIndex, currentLang])

  // Keyboard navigation - musi być przed warunkowymi returnami (reguły hooków React)
  useEffect(() => {
    if (!course) return // Nie dodawaj listenera jeśli nie ma kursu

    const pages = course.pages || []
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isTransitioning) return
      if (e.key === 'ArrowLeft' && currentPageIndex > 0) {
        setExitingPageIndex(currentPageIndex)
        setCurrentPageIndex(currentPageIndex - 1)
        setTransitionDirection('down')
        setIsTransitioning(true)
        setTimeout(() => {
          setIsTransitioning(false)
          setTransitionDirection(null)
          setExitingPageIndex(null)
        }, 800)
      } else if (e.key === 'ArrowRight' && currentPageIndex < pages.length - 1) {
        setExitingPageIndex(currentPageIndex)
        setCurrentPageIndex(currentPageIndex + 1)
        setTransitionDirection('up')
        setIsTransitioning(true)
        setTimeout(() => {
          setIsTransitioning(false)
          setTransitionDirection(null)
          setExitingPageIndex(null)
        }, 800)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentPageIndex, course, isTransitioning])

  // Wczytaj tekst z pliku dla strony z overlay lub quote-text
  useEffect(() => {
    if (!course) return
    
    const pages = course.pages || []
    const currentPage = pages[currentPageIndex]
    if (!currentPage) return

    const pageContent = parseContent(currentPage.content)
    if ((pageContent?.type === 'image-overlay' || pageContent?.type === 'quote-text' || pageContent?.type === 'image-overlay-text-top' || pageContent?.type === 'text-image-split' || pageContent?.type === 'formatted-text' || pageContent?.type === 'image-overlay-text-file' || pageContent?.type === 'image-overlay-text-white' || pageContent?.type === 'black-header-image' || pageContent?.type === 'white-header-image' || pageContent?.type === 'two-images-top-text' || pageContent?.type === 'three-images-top-text' || pageContent?.type === 'dictionary' || pageContent?.type === 'simple-text' || pageContent?.type === 'two-images-container' || pageContent?.type === 'image-top-text-bottom') && pageContent?.textFile) {
      setLoadingText(true)
      // Dynamicznie zmień język w URL na podstawie aktualnego języka
      const textFileUrl = pageContent.textFile.replace(/\/(PL|DE)$/, `/${currentLang}`)
      fetch(textFileUrl)
        .then((res) => res.json())
        .then((data) => {
          if (data.content) {
            setOverlayText(data.content)
          }
          setLoadingText(false)
        })
        .catch((err) => {
          console.error('Error loading text:', err)
          setOverlayText('') // Fallback - użyj pustego tekstu
          setLoadingText(false)
        })
    } else {
      setOverlayText('')
    }
  }, [currentPageIndex, course, currentLang])

  // Ładuj teksty dla strony 45 z plików
  useEffect(() => {
    if (!course) return
    
    const pages = course.pages || []
    const currentPage = pages[currentPageIndex]
    if (!currentPage || currentPage.pageNumber !== 45) return

    const loadTexts = async () => {
      try {
        const [res1, res2, res3] = await Promise.all([
          fetch(`/course/strona 45/Wersja/${currentLang}/text1.txt`),
          fetch(`/course/strona 45/Wersja/${currentLang}/text2.txt`),
          fetch(`/course/strona 45/Wersja/${currentLang}/text3.txt`)
        ])
        
        const [text1, text2, text3] = await Promise.all([
          res1.ok ? res1.text() : '',
          res2.ok ? res2.text() : '',
          res3.ok ? res3.text() : ''
        ])
        
        setPage45Texts({ text1, text2, text3 })
      } catch (err) {
        console.error('Error loading page 45 texts:', err)
      }
    }
    
    loadTexts()
  }, [currentPageIndex, course, currentLang])

  // Ładuj teksty dla strony 46 z plików
  useEffect(() => {
    if (!course) return
    
    const pages = course.pages || []
    const currentPage = pages[currentPageIndex]
    if (!currentPage || currentPage.pageNumber !== 46) return

    const loadTexts = async () => {
      try {
        const [res1, res2, res3] = await Promise.all([
          fetch(`/course/strona 46/Wersja/${currentLang}/text1.txt`),
          fetch(`/course/strona 46/Wersja/${currentLang}/text2.txt`),
          fetch(`/course/strona 46/Wersja/${currentLang}/text3.txt`)
        ])
        
        const [text1, text2, text3] = await Promise.all([
          res1.ok ? res1.text() : '',
          res2.ok ? res2.text() : '',
          res3.ok ? res3.text() : ''
        ])
        
        setPage46Texts({ text1, text2, text3 })
      } catch (err) {
        console.error('Error loading page 46 texts:', err)
      }
    }
    
    loadTexts()
  }, [currentPageIndex, course, currentLang])

  // Ładuj teksty dla strony 47 z plików
  useEffect(() => {
    if (!course) return

    const pages = course.pages || []
    const currentPage = pages[currentPageIndex]
    if (!currentPage || currentPage.pageNumber !== 47) return

    const loadTexts = async () => {
      try {
        const [res1, res2, res3] = await Promise.all([
          fetch(`/course/strona 47/Wersja/${currentLang}/text1.txt`),
          fetch(`/course/strona 47/Wersja/${currentLang}/text2.txt`),
          fetch(`/course/strona 47/Wersja/${currentLang}/text3.txt`)
        ])

        const [text1, text2, text3] = await Promise.all([
          res1.ok ? res1.text() : '',
          res2.ok ? res2.text() : '',
          res3.ok ? res3.text() : ''
        ])

        setPage47Texts({ text1, text2, text3 })
      } catch (err) {
        console.error('Error loading page 47 texts:', err)
      }
    }

    loadTexts()
  }, [currentPageIndex, course, currentLang])

  // Ładuj etykiety dla strony 32 z plików
  useEffect(() => {
    if (!course) return

    const pages = course.pages || []
    const currentPage = pages[currentPageIndex]
    if (!currentPage || currentPage.pageNumber !== 32) {
      setPage32Labels({ label1: '', label2: '' })
      return
    }

    const loadLabels = async () => {
      try {
        const [res1, res2] = await Promise.all([
          fetch(`/api/course-text/32/${currentLang}/label1.txt`),
          fetch(`/api/course-text/32/${currentLang}/label2.txt`)
        ])

        const [data1, data2] = await Promise.all([
          res1.ok ? res1.json() : { content: '' },
          res2.ok ? res2.json() : { content: '' }
        ])

        setPage32Labels({ 
          label1: data1.content?.trim() || '- flat lay',
          label2: data2.content?.trim() || '- 45 stopni'
        })
      } catch (err) {
        console.error('Error loading page 32 labels:', err)
        setPage32Labels({ label1: '- flat lay', label2: '- 45 stopni' })
      }
    }

    loadLabels()
  }, [currentPageIndex, course, currentLang])

  // Ładuj tekst nagłówka dla stron QR upload (7, 15, 20, 29, 35, 40, 49)
  const qrUploadPages = [7, 15, 20, 29, 35, 40, 49]
  useEffect(() => {
    if (!course) return

    const pages = course.pages || []
    const currentPage = pages[currentPageIndex]
    if (!currentPage || !qrUploadPages.includes(currentPage.pageNumber)) {
      setQrPageContent('')
      return
    }

    const loadQrContent = async () => {
      try {
        const response = await fetch(`/api/course-content/${currentPage.pageNumber}/${currentLang}`)
        if (response.ok) {
          const data = await response.json()
          setQrPageContent(data.content?.trim() || '')
        } else {
          setQrPageContent('')
        }
      } catch (err) {
        console.error('Error loading QR page content:', err)
        setQrPageContent('')
      }
    }

    loadQrContent()
  }, [currentPageIndex, course, currentLang])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-white">{t.course.loadingCourse}</div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error || 'Kurs nie został znaleziony'}</div>
      </div>
    )
  }

  const pages: CoursePage[] = course.pages || []
  const currentPage = pages[currentPageIndex]

  // Sprawdź czy można przejść do następnej strony
  // Blokuje jeśli aktualna strona wymaga uploadu zdjęcia i nie zostało ono dodane
  // TODO: Przywróć blokowanie po zakończeniu prac nad responsywnością
  const canGoToNextPage = (): boolean => {
    // TYMCZASOWO WYŁĄCZONE NA CZAS PRAC
    return true
    
    /*
    if (!currentPage) return false
    const pageNumber = currentPage.pageNumber
    
    // Jeśli strona wymaga uploadu (jest stroną z QR), sprawdź czy zdjęcie zostało dodane
    if (isProgressPage(pageNumber)) {
      return completedPages.includes(pageNumber)
    }
    
    // Inne strony - można przejść dalej
    return true
    */
  }

  const nextPage = () => {
    if (currentPageIndex < pages.length - 1 && !isTransitioning && canGoToNextPage()) {
      setExitingPageIndex(currentPageIndex)
      setCurrentPageIndex(currentPageIndex + 1)
      setTransitionDirection('up')
      setIsTransitioning(true)
      setTimeout(() => {
        setIsTransitioning(false)
        setTransitionDirection(null)
        setExitingPageIndex(null)
      }, 800)
    }
  }

  const prevPage = () => {
    if (currentPageIndex > 0 && !isTransitioning) {
      setExitingPageIndex(currentPageIndex)
      setCurrentPageIndex(currentPageIndex - 1)
      setTransitionDirection('down')
      setIsTransitioning(true)
      setTimeout(() => {
        setIsTransitioning(false)
        setTransitionDirection(null)
        setExitingPageIndex(null)
      }, 800)
    }
  }

  // Nawigacja do konkretnej strony po numerze strony
  const goToPage = (pageNumber: number) => {
    if (isTransitioning) return
    
    const targetIndex = pages.findIndex((p: CoursePage) => p.pageNumber === pageNumber)
    if (targetIndex === -1 || targetIndex === currentPageIndex) return
    
    // Następna strona = z dołu do góry (up), poprzednia = z góry do dołu (down)
    const direction = targetIndex > currentPageIndex ? 'up' : 'down'
    setExitingPageIndex(currentPageIndex)
    setCurrentPageIndex(targetIndex)
    setTransitionDirection(direction)
    setIsTransitioning(true)
    
    setTimeout(() => {
      setIsTransitioning(false)
      setTransitionDirection(null)
      setExitingPageIndex(null)
    }, 800)
  }

  const parseTips = (tipsJson?: string): string[] => {
    if (!tipsJson) return []
    try {
      const parsed = JSON.parse(tipsJson)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const parseContent = (contentJson?: string): any => {
    if (!contentJson) return null
    try {
      return JSON.parse(contentJson)
    } catch {
      return { text: contentJson }
    }
  }

  // Tipy z plików mają priorytet, jeśli brak to fallback do mock-data
  const mockTips = parseTips(currentPage?.tips)
  const tips = fileTips.length > 0 ? fileTips : mockTips
  const content = parseContent(currentPage?.content)

  // Sprawdź typ layoutu
  const isGridLayout = content?.type === 'grid-2x2' && content?.panels
  const isImageOverlay = content?.type === 'image-overlay'
  const isImageOverlayText = content?.type === 'image-overlay-text'
  const isImageOverlayTextTop = content?.type === 'image-overlay-text-top'
  const isQuoteText = content?.type === 'quote-text'
  const isSimpleText = content?.type === 'simple-text'
  const isForm = content?.type === 'form'
  const isPhotoUpload = content?.type === 'photo-upload'
  const isQRUpload = content?.type === 'qr-upload'
  const isProgressEvaluation = content?.type === 'progress-evaluation'
  const isTextImageSplit = content?.type === 'text-image-split'
  const isFormattedText = content?.type === 'formatted-text'
  const isImageOverlayTextFile = content?.type === 'image-overlay-text-file'
  const isImageOverlayTextWhite = content?.type === 'image-overlay-text-white'
  const isDictionary = content?.type === 'dictionary'
  const isWhiteHeaderImage = content?.type === 'white-header-image'
  const isBlackHeaderImage = content?.type === 'black-header-image'
  const isTwoImagesContainer = content?.type === 'two-images-container'
  const isTwoImagesTopText = content?.type === 'two-images-top-text'
  const isImageTopTextBottom = content?.type === 'image-top-text-bottom'
  const isThreeImagesTopText = content?.type === 'three-images-top-text'

  // Strony, które mają mieć czarny tekst zamiast białego
  const pagesWithBlackText = new Set([3, 8, 12, 13, 18, 31, 45, 46, 47, 51])
  const shouldUseBlackText = pagesWithBlackText.has(currentPage.pageNumber)

  return (
    <div 
      className="min-h-screen" 
      style={{ 
        background: '#1a1d24',
        width: isMobile ? '100%' : 'auto',
        maxWidth: isMobile ? '100vw' : 'none',
        overflowX: isMobile ? 'hidden' : 'visible',
        overflowY: 'auto'
      }}
    >
      {/* Konfetti na stronie 51 (finał kursu) */}
      {currentPage.pageNumber === 51 && <Confetti />}
      
      {/* Main responsive layout */}
      <div 
        className="mx-auto"
        style={{
          width: isMobile ? '100%' : 'auto',
          maxWidth: isMobile ? '100%' : '1700px',
          padding: isMobile ? '4px' : '32px 24px',
          marginLeft: isMobile ? '0' : '24px',
          overflow: isMobile ? 'hidden' : 'visible'
        }}
      >
        <div className="flex flex-col lg:flex-row gap-1 lg:gap-8 items-start">
          {/* Left side - Tips and course content */}
          <div 
            style={{
              width: isMobile ? '100%' : 'auto',
              maxWidth: isMobile ? '100%' : 'none',
              overflow: isMobile ? 'hidden' : 'visible'
            }}
          >
            <div className="flex flex-col lg:flex-row gap-1 lg:gap-8 items-start">
              {/* Tips - po lewej stronie (ukryte na mobile, zawsze widoczne na desktop) */}
              {!isMobile && (
                <div className="w-64 flex-shrink-0">
                  {tips.length > 0 && (
                    <div className="space-y-3">
                      {tips.map((tip, index) => (
                        <TipCloud key={index} tip={tip} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Container for course content - responsive */}
              <div 
                className="glow-wrapper"
                style={{ 
                  width: isMobile ? '100%' : '825px',
                  maxWidth: isMobile ? '100%' : '825px',
                  padding: isMobile ? '0' : '16px',
                  borderRadius: isMobile ? '0' : '16px',
                  background: 'rgba(35, 40, 50, 0.4)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  overflow: isMobile ? 'hidden' : 'visible',
                  flexShrink: 0
                }}
              >
                <div className="relative overflow-hidden rounded-xl scroll-transition-wrapper" style={{ background: '#ffffff' }}>
                  {/* Exiting page overlay during transition */}
                  {isTransitioning && exitingPageIndex !== null && (
                    <div 
                      className={`course-container ${transitionDirection === 'up' ? 'page-exit-to-top' : 'page-exit-to-bottom'}`}
                      style={{ background: '#ffffff' }}
                    />
                  )}
                  {/* Current page */}
                  <div 
                    className={`course-container bg-white overflow-hidden relative ${isTransitioning ? (transitionDirection === 'up' ? 'page-enter-from-bottom' : 'page-enter-from-top') : ''}`}
                  >
                    <div 
                      className="absolute inset-0"
                      style={currentPage.pageNumber !== 38 ? { marginLeft: '-3%' } : {}}
                    >
                {isGridLayout ? (
                  // Layout 2x2 dla pierwszej strony
                  <div className="grid grid-cols-2 grid-rows-2 w-full h-full relative">
                    {content.panels.map((panel: any, index: number) => (
                      <div key={index} className="relative w-full h-full overflow-hidden">
                        {panel.type === 'image' ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={panel.imageUrl?.startsWith('/') ? panel.imageUrl : `/course/strona ${currentPage.pageNumber}/Foto/${panel.imageUrl}`}
                              alt={`Panel ${index + 1}`}
                              fill
                              className="object-cover"
                              priority={currentPageIndex === 0 && index < 2}
                              sizes="(max-width: 768px) 50vw, 400px"
                            />
                          </div>
                        ) : panel.type === 'text' ? (
                          <div className={`w-full h-full flex items-center justify-center p-6 ${
                            panel.backgroundColor === 'dark' 
                              ? 'bg-gray-900 text-white' 
                              : 'bg-white text-gray-900'
                          }`}>
                            <div className="text-center">
                              <div className="text-xs md:text-sm font-sans mb-2 tracking-wider">
                                {panel.text.split('\n\n')[0]}
                              </div>
                              <div className="text-lg md:text-2xl lg:text-3xl font-serif mb-4">
                                {panel.text.split('\n\n')[1]}
                              </div>
                              <div className="text-2xl mb-4 text-orange-500">★</div>
                              <div className="text-xs md:text-sm font-sans mb-2 tracking-wider">
                                {panel.text.split('\n\n')[3]}
                              </div>
                              <div className="text-xs md:text-sm font-sans">
                                {panel.text.split('\n\n')[4]}
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : isImageOverlay ? (
                  // Layout z obrazem jako tłem i tekstem na wierzchu
                  <div className="relative w-full h-full">
                    {/* Zdjęcie jako tło - rozciągnięte na całym kontenerze */}
                    <div className="absolute inset-0">
                      <Image
                        src={content.imageUrl?.startsWith('/') ? content.imageUrl : `/course/strona ${currentPage.pageNumber}/Foto/${content.imageUrl}`}
                        alt={currentPage.title || `Strona ${currentPage.pageNumber}`}
                        fill
                        className="object-cover"
                        priority={currentPageIndex === 1}
                        sizes="(max-width: 768px) 100vw, 800px"
                      />
                    </div>
                    {/* Tekst nałożony na zdjęcie */}
                    {content.textPosition === 'left' && (
                      <div className="absolute inset-0 flex items-end">
                        <div className="w-[60%] max-w-[60%] pl-6 md:pl-8 lg:pl-12 pr-4 pb-6 md:pb-8 lg:pb-12">
                          <div className={`text-sm md:text-base lg:text-lg font-sans leading-relaxed text-black ${currentPage.pageNumber === 2 ? 'font-bold' : ''}`}>
                            {loadingText ? (
                              'Ładowanie...'
                            ) : (
                              overlayText.split(/\n\s*\n/).filter(p => p.trim()).map((paragraph: string, index: number) => {
                                const trimmedParagraph = paragraph.trim()
                                // Drugi akapit (o Michelin) ma większe odstępy - sprawdzamy różne warianty tekstu
                                const isSecondParagraph = trimmedParagraph.includes('Fotografowałam dla restauracji wyróżnionych gwiazdkami Michelin') || 
                                                          trimmedParagraph.includes('gwiazdkami Michelin') ||
                                                          trimmedParagraph.includes('JRE Guide Deutschland')
                                return (
                                  <p 
                                    key={index} 
                                    className={
                                      isSecondParagraph 
                                        ? 'mt-10 mb-10' 
                                        : index === 0 
                                        ? 'mb-6' 
                                        : 'mt-6'
                                    }
                                    style={isSecondParagraph ? { marginTop: '2.5rem', marginBottom: '2.5rem' } : undefined}
                                  >
                                    {trimmedParagraph}
                                  </p>
                                )
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {content.textPosition === 'right' && (
                      <div className="absolute inset-0 flex items-center justify-end">
                        <div className="w-1/3 pr-6 md:pr-8 lg:pr-12 text-right">
                          <div className="text-sm md:text-base lg:text-lg font-sans leading-relaxed text-black whitespace-pre-line">
                            {loadingText ? 'Ładowanie...' : overlayText}
                          </div>
                        </div>
                      </div>
                    )}
                    {content.textPosition === 'center' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2/3 text-center px-6 md:px-8">
                          <div className="text-sm md:text-base lg:text-lg font-sans leading-relaxed text-black whitespace-pre-line">
                            {loadingText ? 'Ładowanie...' : overlayText}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : isQuoteText ? (
                  // Layout z cytatem na górze i tekstem poniżej - oba wyśrodkowane
                  <div className="relative w-full h-full flex flex-col items-center justify-center p-8">
                    {loadingText ? (
                      <div className="text-gray-400">Ładowanie...</div>
                    ) : (
                      <>
                        {/* Cytat na górze - wyśrodkowany, większy i pogrubiony */}
                        {overlayText.includes('---') && (
                          <div className="text-center mb-12 w-full">
                            {(() => {
                              const quoteText = overlayText.split('---')[0].trim()
                              // Sprawdź czy jest autor (zaczyna się od "-")
                              const authorMatch = quoteText.match(/\n\s*-\s*(.+)$/)
                              if (authorMatch) {
                                const quote = quoteText.replace(/\n\s*-\s*.+$/, '').trim()
                                const author = authorMatch[1]
                                return (
                                  <>
                                    <div className="text-xl md:text-2xl lg:text-3xl font-serif font-bold text-gray-900 leading-relaxed mb-4">
                                      {quote}
                                    </div>
                                    <div className="text-base md:text-lg lg:text-xl font-serif text-gray-900 text-right pr-8 md:pr-12 lg:pr-16">
                                      - {author}
                                    </div>
                                  </>
                                )
                              }
                              return (
                                <div className="text-xl md:text-2xl lg:text-3xl font-serif font-bold text-gray-900 leading-relaxed">
                                  {quoteText}
                                </div>
                              )
                            })()}
                          </div>
                        )}
                        {/* Tekst poniżej - wyśrodkowany */}
                        {overlayText.includes('---') && (
                          <div className="w-full max-w-4xl text-center">
                            <div className="text-base md:text-lg lg:text-xl font-serif text-gray-900 leading-relaxed whitespace-pre-line">
                              {overlayText.split('---')[1]?.trim()}
                            </div>
                          </div>
                        )}
                        {!overlayText.includes('---') && (
                          <div className="text-center w-full">
                            <div className="text-base md:text-lg lg:text-xl font-serif text-gray-900 leading-relaxed whitespace-pre-line">
                              {overlayText}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : isImageOverlayText ? (
                  // Layout z obrazem jako tłem i tekstem nałożonym w określonej lokalizacji
                  <div className="relative w-full h-full">
                    {/* Zdjęcie jako tło - rozciągnięte na całym kontenerze */}
                    <div className="absolute inset-0">
                      <Image
                        src={content.imageUrl?.startsWith('/') ? content.imageUrl : `/course/strona ${currentPage.pageNumber}/Foto/${content.imageUrl}`}
                        alt={currentPage.title || `Strona ${currentPage.pageNumber}`}
                        fill
                        className="object-cover"
                        priority={currentPageIndex === 3}
                        sizes="(max-width: 768px) 100vw, 800px"
                      />
                    </div>
                    {/* Tekst nałożony na zdjęcie */}
                    {content.overlayText && (
                      <div
                        className={`absolute ${
                          content.textPosition === 'bottom-center' 
                            ? 'bottom-[20%] left-1/2 -translate-x-1/2' 
                            : content.textPosition === 'bottom'
                            ? 'bottom-[30%] left-1/2 -translate-x-1/2'
                            : content.textPosition === 'top-center'
                            ? 'left-1/2 -translate-x-1/2'
                            : content.textPosition === 'top-center-lower'
                            ? 'top-24 left-1/2 -translate-x-1/2'
                            : content.textPosition === 'center'
                            ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                            : 'bottom-8 left-8'
                        }`}
                        style={
                          content.textPosition === 'top-center' && currentPage.pageNumber === 42
                            ? { top: '15%' }
                            : content.textPosition === 'top-center'
                            ? { top: '16' }
                            : undefined
                        }
                      >
                        <div
                          className={`font-serif text-black font-normal ${
                            currentPage.pageNumber === 42
                              ? 'text-4xl md:text-5xl lg:text-6xl'
                              : 'text-5xl md:text-6xl lg:text-7xl xl:text-8xl'
                          }`}
                        >
                          {content.overlayText}
                        </div>
                      </div>
                    )}
                  </div>
                ) : isImageOverlayTextTop ? (
                  // Layout z obrazem jako tłem i tekstem na górze
                  <div className="relative w-full h-full">
                    {/* Zdjęcie jako tło - rozciągnięte na całym kontenerze */}
                    <div className="absolute inset-0">
                      <Image
                        src={content.imageUrl?.startsWith('/') ? content.imageUrl : `/course/strona ${currentPage.pageNumber}/Foto/${content.imageUrl}`}
                        alt={currentPage.title || `Strona ${currentPage.pageNumber}`}
                        fill
                        className="object-cover"
                        priority={currentPageIndex === 4}
                        sizes="(max-width: 768px) 100vw, 800px"
                      />
                    </div>
                    {/* Tekst na górze */}
                    <div className="absolute top-0 left-0 right-0 pt-8 px-6 md:px-8 lg:px-12">
                      {loadingText ? (
                        <div className="text-gray-400">Ładowanie...</div>
                      ) : (
                        <div className="text-black">
                          {(() => {
                            if (!overlayText) return null
                            
                            // Podziel tekst na części (separator ---)
                            const parts = overlayText.split('---')
                            const beforeSeparator = parts[0].trim()
                            const afterSeparator = parts[1]?.trim() || ''
                            
                            // Podziel część przed separatorem na akapity
                            const paragraphs = beforeSeparator.split(/\n\s*\n/).filter(p => p.trim())
                            
                            return (
                              <>
                                {paragraphs.map((paragraph: string, index: number) => {
                                  const trimmedParagraph = paragraph.trim()
                                  // Pierwszy akapit to tytuł "Gotowy? Zaczynamy!" - tylko ten jest pogrubiony i wyśrodkowany
                                  if (index === 0 && trimmedParagraph.includes('Gotowy')) {
                                    // Wyciągnij tylko "Gotowy? Zaczynamy!" (pierwsza linia)
                                    const titleLine = trimmedParagraph.split('\n')[0].trim()
                                    return (
                                      <div key={index}>
                                        <h2 
                                          className="font-serif mb-4 text-center"
                                          style={{ 
                                            fontWeight: 'bold', 
                                            fontSize: '1.5rem',
                                            lineHeight: '1.5',
                                            marginBottom: '1rem',
                                            textAlign: 'center'
                                          }}
                                        >
                                          {titleLine}
                                        </h2>
                                        {/* Jeśli są kolejne linie w tym akapicie, wyświetl je bez pogrubienia */}
                                        {trimmedParagraph.split('\n').slice(1).filter(l => l.trim()).length > 0 && (
                                          <p 
                                            className="font-serif mb-3 whitespace-pre-line text-center"
                                            style={{ 
                                              fontWeight: 'normal', 
                                              fontSize: '1.125rem',
                                              lineHeight: '1.6'
                                            }}
                                          >
                                            {trimmedParagraph.split('\n').slice(1).join('\n').trim()}
                                          </p>
                                        )}
                                      </div>
                                    )
                                  }
                                  // Pozostałe akapity - większa czcionka, bez pogrubienia
                                  return (
                                    <p 
                                      key={index} 
                                      className="font-serif mb-3 whitespace-pre-line text-center"
                                      style={{ 
                                        fontWeight: 'normal', 
                                        fontSize: '1.125rem',
                                        lineHeight: '1.6'
                                      }}
                                    >
                                      {trimmedParagraph}
                                    </p>
                                  )
                                })}
                                {/* Tekst po separatorze - z większą przerwą, większa czcionka, bez pogrubienia */}
                                {afterSeparator && (
                                  <p 
                                    className="font-serif mt-6 whitespace-pre-line text-center"
                                    style={{ 
                                      fontWeight: 'normal', 
                                      fontSize: '1.125rem',
                                      lineHeight: '1.6',
                                      marginTop: '1.5rem'
                                    }}
                                  >
                                    {afterSeparator}
                                  </p>
                                )}
                              </>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                ) : currentPage?.imageUrl ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={currentPage.imageUrl.startsWith('/') ? currentPage.imageUrl : `/course/strona ${currentPage.pageNumber}/Foto/${currentPage.imageUrl}`}
                      alt={currentPage.title || `Strona ${currentPage.pageNumber}`}
                      fill
                      className="object-contain"
                      priority={currentPageIndex === 0}
                      sizes="(max-width: 768px) 100vw, 800px"
                    />
                  </div>
                ) : isSimpleText ? (
                  // Prosty tekst wyśrodkowany na białym tle
                  <div className="relative w-full h-full flex items-center justify-center p-8 bg-white">
                    {loadingText ? (
                      <div className="text-gray-400">Ładowanie...</div>
                    ) : (
                      <div className="text-center w-full">
                        <div className="font-serif whitespace-pre-line text-gray-900 leading-relaxed">
                          {(overlayText || content.text || '').split('\n').map((line: string, index: number) => (
                          <div 
                            key={index} 
                            className={
                              currentPage.pageNumber === 6
                                ? 'text-2xl md:text-3xl lg:text-4xl'
                                : currentPage.pageNumber === 35
                                ? 'text-3xl md:text-4xl lg:text-5xl'
                                : currentPage.pageNumber === 43
                                ? 'text-2xl md:text-3xl lg:text-4xl'
                                : index === 0
                                ? 'text-4xl md:text-5xl lg:text-6xl'
                                : 'text-2xl md:text-3xl lg:text-4xl'
                            }
                          >
                            {line}
                          </div>
                        ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : isFormattedText ? (
                  // Tekst z formatowaniem (pogrubione nagłówki)
                  <div className="relative w-full h-full flex items-center justify-center p-8 bg-white overflow-y-auto">
                    {loadingText ? (
                      <div className="text-gray-400">Ładowanie...</div>
                    ) : (
                      <div className="w-full max-w-3xl mx-auto">
                        <div className="text-base md:text-lg lg:text-xl font-serif text-gray-900 leading-relaxed whitespace-pre-line text-center">
                          {overlayText.split('\n\n').filter(p => p.trim()).map((paragraph: string, index: number) => {
                            // Sprawdź czy akapit zaczyna się od ** (pogrubiony nagłówek)
                            const isBold = paragraph.trim().startsWith('**') && paragraph.trim().endsWith('**')
                            const cleanParagraph = paragraph.trim().replace(/\*\*/g, '')
                            
                            if (isBold) {
                              return (
                                <p key={index} className="font-bold mb-3 mt-6 first:mt-0 text-center">
                                  {cleanParagraph}
                                </p>
                              )
                            } else {
                              // Sprawdź czy akapit zawiera ** w środku (pogrubiony fragment)
                              const parts = paragraph.split(/(\*\*.*?\*\*)/g)
                              return (
                                <p key={index} className="mb-4 text-center">
                                  {parts.map((part, partIndex) => {
                                    if (part.startsWith('**') && part.endsWith('**')) {
                                      return <strong key={partIndex}>{part.replace(/\*\*/g, '')}</strong>
                                    }
                                    return <span key={partIndex}>{part}</span>
                                  })}
                                </p>
                              )
                            }
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : isPhotoUpload ? (
                  // Kontener do uploadu zdjęć
                  <PhotoUploadComponent pageNumber={currentPage.pageNumber} />
                ) : isQRUpload ? (
                  // Tylko QR kod do uploadu zdjęć z postępami
                  <QRCodeUpload pageNumber={currentPage.pageNumber} headerText={qrPageContent} />
                ) : isProgressEvaluation ? (
                  // Ocena postępów z suwakiem
                  <ProgressEvaluation pageNumber={currentPage.pageNumber} language={language as 'PL' | 'DE'} />
                ) : isForm ? (
                  // Formularz oceny zdjęcia
                  <div className="relative w-full h-full flex items-center justify-center p-8 bg-white overflow-y-auto">
                    <div className="w-full max-w-2xl space-y-6">
                      {/* Ocena ogólna */}
                      <div>
                        <label className="block text-base md:text-lg font-serif mb-3 text-gray-900">
                          Ocena ogólna zdjęcia:
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <label key={num} className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                              />
                              <span className="ml-2 text-gray-900">{num}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Jasność */}
                      <div>
                        <label className="block text-base md:text-lg font-serif mb-3 text-gray-900">
                          jasność
                        </label>
                        <div className="flex gap-4">
                          {['za ciemno', 'OK', 'za jasno'].map((option) => (
                            <label key={option} className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name="brightness"
                                value={option}
                                className="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500"
                              />
                              <span className="ml-2 text-gray-900">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Czy zdjęcie jest proste? */}
                      <div>
                        <label className="block text-base md:text-lg font-serif mb-3 text-gray-900">
                          Czy zdjęcie jest proste?
                        </label>
                        <div className="flex gap-4">
                          {['tak', 'nie', 'nie wiem'].map((option) => (
                            <label key={option} className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name="straight"
                                value={option}
                                className="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500"
                              />
                              <span className="ml-2 text-gray-900">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Czy potrawa jest w dobrym miejscu? */}
                      <div>
                        <label className="block text-base md:text-lg font-serif mb-3 text-gray-900">
                          Czy potrawa jest w dobrym miejscu na zdjęciu?
                        </label>
                        <div className="flex gap-4">
                          {['tak', 'nie', 'nie wiem'].map((option) => (
                            <label key={option} className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name="placement"
                                value={option}
                                className="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500"
                              />
                              <span className="ml-2 text-gray-900">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Kąt kadrowania */}
                      <div>
                        <label className="block text-base md:text-lg font-serif mb-3 text-gray-900">
                          Kąt kadrowania: Czy kąt pasuje do potrawy i pokazuje ją dobrze?
                        </label>
                        <div className="flex gap-4">
                          {['tak', 'nie', 'nie wiem'].map((option) => (
                            <label key={option} className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name="angle"
                                value={option}
                                className="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500"
                              />
                              <span className="ml-2 text-gray-900">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Naturalność proporcji */}
                      <div>
                        <label className="block text-base md:text-lg font-serif mb-3 text-gray-900">
                          Naturalność proporcji: Czy talerz i potrawa wyglądają naturalnie (proporcje nie są „dziwne")?
                        </label>
                        <div className="flex gap-4">
                          {['tak', 'nie', 'nie wiem'].map((option) => (
                            <label key={option} className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name="proportions"
                                value={option}
                                className="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500"
                              />
                              <span className="ml-2 text-gray-900">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : isTextImageSplit ? (
                  // Layout z zdjęciem na cały kontener i tekstem nałożonym na górze
                  <div className="relative w-full h-full">
                    <Image
                      src={content.imageUrl?.startsWith('/') ? content.imageUrl : `/course/strona ${currentPage.pageNumber}/Foto/${content.imageUrl}`}
                      alt={currentPage.title || `Strona ${currentPage.pageNumber}`}
                      fill
                      className="object-cover"
                      priority={currentPageIndex === 7}
                      sizes="(max-width: 768px) 100vw, 800px"
                    />
                    {/* Tekst nałożony na zdjęcie na górze */}
                    <div className="absolute inset-0 flex items-start justify-center pt-16 md:pt-20 lg:pt-24 px-6 md:px-8 lg:px-12">
                      {loadingText ? (
                        <div className="text-white">Ładowanie...</div>
                      ) : (
                        <div className="w-full max-w-3xl">
                          <div className="text-base md:text-lg lg:text-xl font-serif text-gray-900 leading-relaxed whitespace-pre-line">
                            {overlayText.split('\n\n').filter(p => p.trim()).map((paragraph: string, index: number) => (
                              <p key={index} className={index > 0 ? 'mt-4' : ''}>
                                {paragraph.trim()}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : isImageOverlayTextFile ? (
                  // Layout z zdjęciem na cały kontener i tekstem z pliku nałożonym na zdjęcie
                  <div className="relative w-full h-full">
                    <Image
                      src={content.imageUrl?.startsWith('/') ? content.imageUrl : `/course/strona ${currentPage.pageNumber}/Foto/${content.imageUrl}`}
                      alt={currentPage.title || `Strona ${currentPage.pageNumber}`}
                      fill
                      className="object-cover"
                      priority={currentPageIndex === 11}
                      sizes="(max-width: 768px) 100vw, 800px"
                    />
                    {/* Tekst nałożony na zdjęcie */}
                    {content.textPosition === 'top-center' ? (
                      <div
                        className="absolute left-1/2 -translate-x-1/2 w-full max-w-3xl px-6 md:px-8 lg:px-12"
                        style={{ top: currentPage.pageNumber === 37 ? '0%' : currentPage.pageNumber === 42 ? '15%' : '15%' }}
                      >
                        {loadingText ? (
                          <div className="text-white text-center">Ładowanie...</div>
                        ) : (
                          <div
                            className={`font-serif text-gray-900 leading-relaxed whitespace-pre-line text-center ${
                              currentPage.pageNumber === 42
                                ? 'text-4xl md:text-5xl lg:text-6xl xl:text-7xl'
                                : currentPage.pageNumber === 45
                                ? 'text-2xl md:text-3xl lg:text-4xl'
                                : currentPage.pageNumber === 46
                                ? 'text-2xl md:text-3xl lg:text-4xl'
                                : currentPage.pageNumber === 47
                                ? 'text-2xl md:text-3xl lg:text-4xl'
                                : 'text-4xl md:text-5xl lg:text-6xl'
                            }`}
                          >
                            {overlayText.split('\n\n').filter(p => p.trim()).map((paragraph: string, index: number) => (
                              <p key={index} className={index > 0 ? 'mt-4' : ''}>
                                {paragraph.trim()}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : content.textPosition === 'top-center-lower' ? (
                      <div
                        className="absolute left-1/2 -translate-x-1/2 w-full max-w-3xl px-6 md:px-8 lg:px-12"
                        style={{ top: currentPage.pageNumber === 23 ? '35%' : '12%' }}
                      >
                        {loadingText ? (
                          <div className="text-white text-center">Ładowanie...</div>
                        ) : (
                          <div
                            className={`font-serif text-gray-900 leading-relaxed whitespace-pre-line text-center ${
                              currentPage.pageNumber === 42
                                ? 'text-4xl md:text-5xl lg:text-6xl xl:text-7xl'
                                : currentPage.pageNumber === 45
                                ? 'text-2xl md:text-3xl lg:text-4xl'
                                : currentPage.pageNumber === 46
                                ? 'text-2xl md:text-3xl lg:text-4xl'
                                : currentPage.pageNumber === 47
                                ? 'text-2xl md:text-3xl lg:text-4xl'
                                : 'text-4xl md:text-5xl lg:text-6xl'
                            }`}
                          >
                            {overlayText.split('\n\n').filter(p => p.trim()).map((paragraph: string, index: number) => (
                              <p key={index} className={index > 0 ? 'mt-4' : ''}>
                                {paragraph.trim()}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div 
                        className={`absolute inset-0 flex ${
                          content.textPosition === 'top' ? 'items-start justify-center' 
                          : content.textPosition === 'top-left' ? 'items-start justify-center'
                          : content.textPosition === 'top-right' ? 'items-start justify-center'
                          : content.textPosition === 'bottom' ? 'items-end justify-center' 
                          : content.textPosition === 'bottom-left' ? 'items-end justify-center'
                          : content.textPosition === 'bottom-right' ? 'items-end justify-center'
                          : content.textPosition === 'bottom-center' ? 'items-end justify-center'
                          : 'items-center justify-center'
                        } ${
                          content.textPosition === 'top' ? 'pt-8 md:pt-12 lg:pt-16' 
                          : content.textPosition === 'top-left' || content.textPosition === 'top-right' ? 'pt-8 md:pt-12 lg:pt-16'
                          : content.textPosition === 'bottom' ? 'pb-8 md:pb-12 lg:pb-16'
                          : content.textPosition === 'bottom-left' || content.textPosition === 'bottom-right' ? 'pb-8 md:pb-12 lg:pb-16'
                          : ''
                        } ${
                          content.textPosition === 'top-left' || content.textPosition === 'top-right' || content.textPosition === 'bottom-left' || content.textPosition === 'bottom-right' 
                            ? 'px-6 md:px-8 lg:px-12' 
                            : 'px-6 md:px-8 lg:px-12'
                        }`}
                        style={currentPage.pageNumber === 4 ? { paddingBottom: '35%' } : undefined}
                      >
                        {loadingText ? (
                          <div className="text-white">Ładowanie...</div>
                        ) : (
                          <div className={`w-full ${content.textPosition === 'top-left' || content.textPosition === 'top-right' || content.textPosition === 'bottom-left' || content.textPosition === 'bottom-right' ? 'max-w-2xl' : 'max-w-3xl'}`}>
                            <div className={`${currentPage.pageNumber === 13 ? 'text-sm md:text-base lg:text-lg xl:text-xl' : currentPage.pageNumber === 12 ? 'text-base md:text-lg lg:text-xl xl:text-2xl' : 'text-lg md:text-xl lg:text-2xl xl:text-3xl'} font-serif text-gray-900 leading-relaxed whitespace-pre-line text-center ${currentPage.pageNumber === 4 ? 'font-bold' : ''}`}>
                            {overlayText.split('\n\n').filter(p => p.trim()).map((paragraph: string, index: number) => (
                              <p key={index} className={index > 0 ? 'mt-4' : ''}>
                                {paragraph.trim()}
                              </p>
                            ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {/* 3 kontenery z tekstem na dole dla strony 45 */}
                    {currentPage.pageNumber === 45 && (
                      <div className="absolute left-0 right-0 flex flex-col md:flex-row gap-4 md:gap-6 px-6 md:px-8 lg:px-12" style={{ bottom: '0%' }}>
                        <div className="flex-1 text-center">
                          <p className="text-xs md:text-sm lg:text-base font-serif text-gray-900">
                            {page45Texts.text1}
                          </p>
                        </div>
                        <div className="flex-1 text-center">
                          <p className="text-xs md:text-sm lg:text-base font-serif text-gray-900">
                            {page45Texts.text2}
                          </p>
                        </div>
                        <div className="flex-1 text-center">
                          <p className="text-xs md:text-sm lg:text-base font-serif text-gray-900">
                            {page45Texts.text3}
                          </p>
                        </div>
                      </div>
                    )}
                    {/* 3 kontenery z tekstem na dole dla strony 46 */}
                    {currentPage.pageNumber === 46 && (
                      <div className="absolute left-0 right-0 flex flex-col md:flex-row gap-4 md:gap-6 px-6 md:px-8 lg:px-12" style={{ bottom: '13%' }}>
                        <div className="flex-1 text-center">
                          <p className="text-sm md:text-base lg:text-lg font-serif text-gray-900">
                            {page46Texts.text1}
                          </p>
                        </div>
                        <div className="flex-1 text-center">
                          <p className="text-sm md:text-base lg:text-lg font-serif text-gray-900">
                            {page46Texts.text2}
                          </p>
                        </div>
                        <div className="flex-1 text-center">
                          <p className="text-sm md:text-base lg:text-lg font-serif text-gray-900">
                            {page46Texts.text3}
                          </p>
                        </div>
                      </div>
                    )}
                    {/* 3 kontenery z tekstem na dole dla strony 47 */}
                    {currentPage.pageNumber === 47 && (
                      <div className="absolute left-0 right-0 flex flex-col md:flex-row gap-4 md:gap-6 px-6 md:px-8 lg:px-12" style={{ bottom: '13%' }}>
                        <div className="flex-1 text-center">
                          <p className="text-sm md:text-base lg:text-lg font-serif text-gray-900">
                            {page47Texts.text1}
                          </p>
                        </div>
                        <div className="flex-1 text-center">
                          <p className="text-sm md:text-base lg:text-lg font-serif text-gray-900">
                            {page47Texts.text2}
                          </p>
                        </div>
                        <div className="flex-1 text-center">
                          <p className="text-sm md:text-base lg:text-lg font-serif text-gray-900">
                            {page47Texts.text3}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : isImageOverlayTextWhite ? (
                  // Layout z zdjęciem na cały kontener i białym tekstem z pliku nałożonym na zdjęcie
                  <div className="relative w-full h-full">
                    <Image
                      src={content.imageUrl?.startsWith('/') ? content.imageUrl : `/course/strona ${currentPage.pageNumber}/Foto/${content.imageUrl}`}
                      alt={currentPage.title || `Strona ${currentPage.pageNumber}`}
                      fill
                      className="object-cover"
                      priority={currentPageIndex === 25}
                      sizes="(max-width: 768px) 100vw, 800px"
                    />
                    {/* Biały tekst nałożony na zdjęcie */}
                    {content.textPosition === 'top-center' ? (
                      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-6 md:px-8 lg:px-12">
                        <div className="max-w-3xl mx-auto">
                          {loadingText ? (
                            <div className="text-white text-center">Ładowanie...</div>
                          ) : (
                            <div className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif text-white leading-relaxed whitespace-pre-line text-center">
                              {overlayText.split('\n\n').filter(p => p.trim()).map((paragraph: string, index: number) => (
                                <p key={index} className={index > 0 ? 'mt-4' : ''}>
                                  {paragraph.trim()}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className={`absolute inset-0 flex ${
                        content.textPosition === 'top' ? 'items-start justify-center' 
                        : content.textPosition === 'top-left' ? 'items-start justify-start'
                        : content.textPosition === 'top-right' ? 'items-start justify-end'
                        : content.textPosition === 'bottom' ? 'items-end justify-center' 
                        : content.textPosition === 'bottom-left' ? 'items-end justify-start'
                        : content.textPosition === 'bottom-right' ? 'items-end justify-end'
                        : content.textPosition === 'center' ? 'items-center justify-center'
                        : 'items-center justify-center'
                      } ${
                        content.textPosition === 'top' ? 'pt-24 md:pt-32 lg:pt-40' 
                        : content.textPosition === 'top-left' || content.textPosition === 'top-right' ? 'pt-8 md:pt-12 lg:pt-16'
                        : content.textPosition === 'bottom' ? 'pb-8 md:pb-12 lg:pb-16'
                        : content.textPosition === 'bottom-left' || content.textPosition === 'bottom-right' ? 'pb-8 md:pb-12 lg:pb-16'
                        : ''
                      } ${
                        content.textPosition === 'top-left' || content.textPosition === 'top-right' || content.textPosition === 'bottom-left' || content.textPosition === 'bottom-right' 
                          ? 'px-6 md:px-8 lg:px-12' 
                          : 'px-6 md:px-8 lg:px-12'
                      }`}>
                        {loadingText ? (
                          <div className="text-white">Ładowanie...</div>
                        ) : (
                          <div className={`w-full ${content.textPosition === 'top-left' || content.textPosition === 'top-right' || content.textPosition === 'bottom-left' || content.textPosition === 'bottom-right' ? 'max-w-2xl' : 'max-w-3xl'}`}>
                            <div className={`text-lg md:text-xl lg:text-2xl xl:text-3xl font-serif text-white leading-relaxed whitespace-pre-line ${content.textPosition === 'center' || content.textPosition === 'bottom' || !content.textPosition ? 'text-center' : ''}`}>
                            {overlayText.split('\n\n').filter(p => p.trim()).map((paragraph: string, index: number) => (
                              <p key={index} className={index > 0 ? 'mt-4' : ''}>
                                {paragraph.trim()}
                              </p>
                            ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : isWhiteHeaderImage ? (
                  // Layout z białym tłem, tekstem na górze i zdjęciem 70%
                  <div className="relative w-full h-full bg-white flex flex-col items-center justify-center">
                    <div className="flex-none w-full bg-white flex items-center justify-center px-6 md:px-8 lg:px-12 py-6">
                      {loadingText ? (
                        <div className="text-gray-600">Ładowanie...</div>
                      ) : (
                        <div className="w-full max-w-4xl mx-auto">
                          <div className="text-base md:text-lg lg:text-xl xl:text-2xl font-serif text-gray-900 leading-relaxed whitespace-pre-line text-center">
                            {overlayText.split('\n\n').filter(p => p.trim()).map((paragraph: string, index: number) => (
                              <p key={index} className={index > 0 ? 'mt-4' : ''}>
                                {paragraph.trim()}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-none aspect-square relative mx-auto w-[70%]" style={{ minHeight: '400px' }}>
                      <Image
                        src={content.imageUrl?.startsWith('/') ? content.imageUrl : `/course/strona ${currentPage.pageNumber}/Foto/${content.imageUrl}`}
                        alt={currentPage.title || `Strona ${currentPage.pageNumber}`}
                        fill
                        className="object-contain"
                        priority={currentPageIndex === 32}
                        sizes="(max-width: 768px) 70vw, 560px"
                      />
                    </div>
                  </div>
                ) : isBlackHeaderImage ? (
                  // Layout z czarnym nagłówkiem i kwadratowym zdjęciem (70% powierzchni)
                  <div className="relative w-full h-full bg-black flex flex-col items-center justify-center">
                    {/* Czarne tło z białym tekstem na górze */}
                    <div 
                      className="flex-none w-full bg-black flex items-center justify-center px-6 md:px-8 lg:px-12"
                      style={{ 
                        paddingTop: currentPage.pageNumber === 25 ? '40px' : (currentPage.pageNumber === 14 || currentPage.pageNumber === 19) ? '24px' : '24px', 
                        paddingBottom: (currentPage.pageNumber === 14 || currentPage.pageNumber === 19) ? '16px' : '24px' 
                      }}
                    >
                      {loadingText ? (
                        <div className="text-white">Ładowanie...</div>
                      ) : (
                        <div className="w-full max-w-4xl mx-auto">
                          <div className={`${currentPage.pageNumber === 25 ? 'text-sm md:text-base lg:text-lg xl:text-xl' : 'text-base md:text-lg lg:text-xl xl:text-2xl'} font-serif text-white leading-relaxed whitespace-pre-line text-center`}>
                            {overlayText.split('\n\n').filter(p => p.trim()).map((paragraph: string, index: number) => (
                              <p key={index} className={index > 0 ? 'mt-4' : ''}>
                                {paragraph.trim()}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Kwadratowy kontener zdjęcia - wycentrowany */}
                    <div className={`flex-none aspect-square relative mx-auto ${(currentPage.pageNumber === 14 || currentPage.pageNumber === 19) ? 'w-[68%]' : 'w-[70%]'}`} style={{ minHeight: (currentPage.pageNumber === 14 || currentPage.pageNumber === 19) ? '350px' : '400px' }}>
                      <Image
                        src={content.imageUrl?.startsWith('/') ? content.imageUrl : `/course/strona ${currentPage.pageNumber}/Foto/${content.imageUrl}`}
                        alt={currentPage.title || `Strona ${currentPage.pageNumber}`}
                        fill
                        className="object-contain"
                        priority={currentPageIndex === 13 || currentPageIndex === 18}
                        sizes={currentPage.pageNumber === 14 || currentPage.pageNumber === 19 ? "(max-width: 768px) 77vw, 659px" : "(max-width: 768px) 70vw, 560px"}
                      />
                    </div>
                  </div>
                ) : isTwoImagesContainer ? (
                  // Layout z białym tłem, tekstem na górze i dwoma kontenerami na zdjęcia (70% powierzchni)
                  <div className="relative w-full h-full bg-white flex flex-col items-center justify-center">
                    {/* Tekst wyśrodkowany w pionie między górą a kontenerami zdjęć */}
                    <div className="flex-1 flex items-center justify-center px-6 md:px-8 lg:px-12 w-full">
                      <div className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-serif text-gray-900 leading-relaxed text-center whitespace-pre-line">
                        {overlayText || content.text}
                      </div>
                    </div>
                    {/* Kontener na dwa zdjęcia - 70% powierzchni całkowitej kontenera głównego */}
                    <div className="flex-none flex items-center justify-center gap-4 px-6 md:px-8 lg:px-12 pb-8 w-full">
                      <div 
                        className="flex gap-4 mx-auto"
                        style={{ 
                          width: '95%',
                          aspectRatio: '2 / 1'
                        }}
                      >
                        {/* Kontener na pierwsze zdjęcie */}
                          <div className="flex-1 relative aspect-square">
                          <Image
                            src={content.image1Url?.startsWith('/') ? content.image1Url : `/course/strona ${currentPage.pageNumber}/Foto/${content.image1Url}`}
                            alt="Zdjęcie 24-1"
                            fill
                            className="object-contain"
                            priority={currentPageIndex === 23}
                            sizes="(max-width: 768px) 35vw, 280px"
                          />
                            {currentPage.pageNumber === 32 && (
                              <div
                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                style={{ transform: 'translate(-40%, -10%)' }}
                              >
                                <span className="text-center text-2xl md:text-3xl lg:text-4xl font-serif text-gray-900 drop-shadow-[0_2px_4px_rgba(255,255,255,0.9)]">
                                  {page32Labels.label1 || '- flat lay'}
                                </span>
                              </div>
                            )}
                        </div>
                        {/* Kontener na drugie zdjęcie */}
                        <div className="flex-1 relative aspect-square">
                          <Image
                            src={content.image2Url?.startsWith('/') ? content.image2Url : `/course/strona ${currentPage.pageNumber}/Foto/${content.image2Url}`}
                            alt="Zdjęcie 24-2"
                            fill
                            className="object-contain"
                            priority={currentPageIndex === 23}
                            sizes="(max-width: 768px) 35vw, 280px"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                    ) : isTwoImagesTopText ? (
                  // Layout z białym tłem, tekstem na górze i dwoma kontenerami na zdjęcia
                  <div className="relative w-full h-full bg-white flex flex-col items-center overflow-visible">
                    {/* Tekst na górze */}
                    <div
                      className="flex-none px-6 md:px-8 lg:px-12 w-full"
                      style={{ paddingTop: '8%' }}
                    >
                      {loadingText ? (
                        <div className="text-gray-400 text-center">Ładowanie...</div>
                      ) : (
                        <div className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-serif text-gray-900 leading-relaxed whitespace-pre-line text-center">
                          {currentPage.pageNumber === 32 ? (
                            (() => {
                              const lines = overlayText.split('\n').filter((l) => l.trim())
                              const title = lines[0] || ''
                              return (
                                <p className="m-0">{title}</p>
                              )
                            })()
                          ) : (
                            <div className="flex flex-col space-y-12">
                              {overlayText.split('\n\n').filter(p => p.trim()).map((paragraph: string, index: number) => (
                                <p key={index} className="m-0">
                                  {paragraph.trim()}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Kontener na dwa zdjęcia z etykietami - strona 32 */}
                    {currentPage.pageNumber === 32 ? (
                      <div className="flex-1 flex items-start justify-center w-full px-4 pb-2 pt-2 relative">
                        {/* Strzałka lewa - przy krawędzi kontenera, nachodzi na zdjęcie */}
                        {content.iconUrl && (
                          <div 
                            className="absolute pointer-events-none z-10"
                            style={{ left: '0%', top: '20%', width: '280px', height: '280px' }}
                          >
                            <Image
                              src={content.iconUrl}
                              alt="Strzałka"
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}
                        {/* Strzałka prawa - przy krawędzi kontenera, nachodzi na zdjęcie */}
                        {content.iconUrlRight && (
                          <div 
                            className="absolute pointer-events-none z-10"
                            style={{ right: '0%', top: '20%', width: '252px', height: '252px' }}
                          >
                            <Image
                              src={content.iconUrlRight}
                              alt="Strzałka"
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}
                        <div className="flex gap-8 w-full max-w-[600px]" style={{ marginTop: '30%' }}>
                          {/* Lewa kolumna - flat lay */}
                          <div className="flex-1 flex flex-col items-center relative">
                            <span className="text-xl md:text-2xl font-serif text-black absolute" style={{ top: '-50%' }}>{page32Labels.label1 || '- flat lay'}</span>
                            <div className="relative w-full aspect-square">
                              <Image
                                src={content.image1Url?.startsWith('/') ? content.image1Url : `/course/strona ${currentPage.pageNumber}/Foto/${content.image1Url}`}
                                alt="Flat lay"
                                fill
                                className="object-contain"
                                priority
                                sizes="(max-width: 768px) 45vw, 300px"
                              />
                            </div>
                          </div>
                          {/* Prawa kolumna - 45 stopni */}
                          <div className="flex-1 flex flex-col items-center relative">
                            <span className="text-xl md:text-2xl font-serif text-black absolute" style={{ top: '-50%' }}>{page32Labels.label2 || '- 45 stopni'}</span>
                            <div className="relative w-full aspect-square">
                              <Image
                                src={content.image2Url?.startsWith('/') ? content.image2Url : `/course/strona ${currentPage.pageNumber}/Foto/${content.image2Url}`}
                                alt="45 stopni"
                                fill
                                className="object-contain"
                                priority
                                sizes="(max-width: 768px) 45vw, 300px"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Nakładka strzałki dla innych stron */}
                        {content.iconUrl && (
                          <div
                            className="absolute pointer-events-none z-20"
                            style={{ top: '24%', left: '2%', width: '150px', height: '150px' }}
                          >
                            <Image
                              src={content.iconUrl?.startsWith('/') ? content.iconUrl : `/course/strona ${currentPage.pageNumber}/Foto/${content.iconUrl}`}
                              alt="Ikona kierunku"
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}
                        {/* Kontener na dwa zdjęcia - inne strony */}
                        <div className="flex-1 flex items-center justify-center gap-4 px-6 md:px-8 lg:px-12 pb-8 w-full">
                          <div 
                            className="flex gap-4 w-full max-w-[90%]"
                          >
                            <div className="flex-1 relative aspect-square">
                              <Image
                                src={content.image1Url?.startsWith('/') ? content.image1Url : `/course/strona ${currentPage.pageNumber}/Foto/${content.image1Url}`}
                                alt="Zdjęcie 1"
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 35vw, 280px"
                              />
                            </div>
                            <div className="flex-1 relative aspect-square">
                              <Image
                                src={content.image2Url?.startsWith('/') ? content.image2Url : `/course/strona ${currentPage.pageNumber}/Foto/${content.image2Url}`}
                                alt="Zdjęcie 2"
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 35vw, 280px"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : isImageTopTextBottom ? (
                  // Layout strona 2 - różny dla desktop i mobile
                  isMobile ? (
                    // MOBILE: Zdjęcie na górze, tekst pod kontenerem
                    <div className="relative w-full h-full bg-white flex flex-col overflow-y-auto">
                      {/* Zdjęcie na górze - mniejsza wysokość dla więcej miejsca na tekst */}
                      <div className="relative w-full flex-shrink-0" style={{ height: '35vh', minHeight: '250px' }}>
                        <Image
                          src={content.imageUrl?.startsWith('/') ? content.imageUrl : `/course/strona ${currentPage.pageNumber}/Foto/${content.imageUrl}`}
                          alt={currentPage.title || `Strona ${currentPage.pageNumber}`}
                          fill
                          className="object-cover object-top"
                          priority={currentPageIndex === 1}
                          sizes="100vw"
                        />
                      </div>
                      {/* Tekst pod zdjęciem - więcej miejsca */}
                      <div className="flex-1 px-6 py-8 bg-white flex items-start justify-center">
                        {loadingText ? (
                          <div className="text-gray-400 text-center">Ładowanie...</div>
                        ) : (
                          <div className="text-sm sm:text-base font-sans text-gray-900 leading-relaxed text-center px-2 pt-4">
                            {overlayText.split('\n\n').filter(p => p.trim()).map((paragraph: string, index: number) => (
                              <p key={index} className={index > 0 ? 'mt-4' : ''}>
                                {paragraph.trim()}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // DESKTOP: Oryginalny layout - zdjęcie pełne, tekst na zdjęciu po lewej
                    <div className="relative w-full h-full">
                      {/* Zdjęcie jako tło */}
                      <div className="absolute inset-0">
                        <Image
                          src={content.imageUrl?.startsWith('/') ? content.imageUrl : `/course/strona ${currentPage.pageNumber}/Foto/${content.imageUrl}`}
                          alt={currentPage.title || `Strona ${currentPage.pageNumber}`}
                          fill
                          className="object-cover"
                          priority={currentPageIndex === 1}
                          sizes="825px"
                        />
                      </div>
                      {/* Tekst na zdjęciu - lewa strona, dół */}
                      <div className="absolute inset-0 flex items-end">
                        <div className="w-[60%] max-w-[60%] pl-6 md:pl-8 lg:pl-12 pr-4 pb-6 md:pb-8 lg:pb-12">
                          <div className="text-sm md:text-base lg:text-lg font-sans leading-relaxed text-black font-bold">
                            {loadingText ? (
                              'Ładowanie...'
                            ) : (
                              overlayText.split(/\n\s*\n/).filter(p => p.trim()).map((paragraph: string, index: number) => {
                                const trimmedParagraph = paragraph.trim()
                                const isSecondParagraph = trimmedParagraph.includes('Fotografowałam') || 
                                                          trimmedParagraph.includes('gwiazdkami Michelin') ||
                                                          trimmedParagraph.includes('JRE Guide')
                                return (
                                  <p 
                                    key={index} 
                                    className={isSecondParagraph ? 'mt-10 mb-10' : index === 0 ? 'mb-6' : 'mt-6'}
                                    style={isSecondParagraph ? { marginTop: '2.5rem', marginBottom: '2.5rem' } : undefined}
                                  >
                                    {trimmedParagraph}
                                  </p>
                                )
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                ) : isThreeImagesTopText ? (
                  // Layout z białym tłem, tekstem na górze i trzema kontenerami na zdjęcia (50% wysokości, 3 kolumny)
                  <div className="relative w-full h-full bg-white flex flex-col items-center">
                    {/* Tekst na górze */}
                    <div
                      className="flex-none px-6 md:px-8 lg:px-12 pt-8 md:pt-12 lg:pt-16 w-full"
                      style={{ paddingTop: '12%' }}
                    >
                      {loadingText ? (
                        <div className="text-gray-400 text-center">Ładowanie...</div>
                      ) : (
                        <div className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-serif text-gray-900 leading-relaxed whitespace-pre-line text-center">
                          <div className="flex flex-col space-y-12">
                            {overlayText.split('\n\n').filter(p => p.trim()).map((paragraph: string, index: number) => (
                              <p key={index} className="m-0">
                                {paragraph.trim()}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Kontenery na trzy zdjęcia */}
                    <div className="flex-1 flex items-center justify-center gap-4 px-6 md:px-8 lg:px-12 pb-8">
                      <div
                        className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full"
                        style={{ maxWidth: '95%' }}
                      >
                        {[content.image1Url, content.image2Url, content.image3Url].map((img: string, idx: number) => (
                          <div key={idx} className="relative w-full" style={{ aspectRatio: '1 / 1' }}>
                            {img && (
                              <Image
                                src={img.startsWith('/') ? img : `/course/strona ${currentPage.pageNumber}/Foto/${img}`}
                                alt={`Zdjęcie ${currentPage.pageNumber}-${idx + 1}`}
                                fill
                                className="object-contain"
                                priority={currentPageIndex === 44}
                                sizes="(max-width: 768px) 90vw, 300px"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : currentPage.pageNumber === 51 && isDictionary ? (
                  // Strona 51 - finał kursu - wycentrowany tekst dużą czcionką
                  <div className="relative w-full h-full flex items-center justify-center p-8 bg-white overflow-y-auto">
                    {loadingText ? (
                      <div className="text-gray-400">Ładowanie...</div>
                    ) : (
                      <div className="w-full flex items-center justify-center">
                        <div className="text-center max-w-4xl">
                          <div className="text-3xl md:text-5xl lg:text-6xl font-bold font-serif text-gray-900 leading-relaxed whitespace-pre-line">
                            {overlayText}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : isDictionary ? (
                  // Słowniczek pojęć
                  <div className="relative w-full h-full flex items-center justify-center p-8 bg-white overflow-y-auto">
                    {loadingText ? (
                      <div className="text-gray-400">Ładowanie...</div>
                    ) : (
                      <div className="w-full max-w-3xl">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-gray-900 text-center mb-8">
                          SŁOWNICZEK
                        </h2>
                        <div className="text-base md:text-lg lg:text-xl font-serif text-gray-900 leading-relaxed whitespace-pre-line">
                          {overlayText.split('\n\n').filter(p => p.trim()).map((paragraph: string, index: number) => {
                            // Sprawdź czy akapit zaczyna się od ** (pogrubiony termin)
                            const isBold = paragraph.trim().startsWith('**') && paragraph.trim().endsWith('**')
                            const cleanParagraph = paragraph.trim().replace(/\*\*/g, '')
                            
                            if (isBold) {
                              return (
                                <div key={index} className="mb-4 mt-6 first:mt-0">
                                  <h3 className="font-bold text-lg md:text-xl mb-2">{cleanParagraph}</h3>
                                </div>
                              )
                            } else {
                              // Sprawdź czy akapit zawiera ** w środku (pogrubiony fragment)
                              const parts = paragraph.split(/(\*\*.*?\*\*)/g)
                              return (
                                <p key={index} className="mb-4">
                                  {parts.map((part, partIndex) => {
                                    if (part.startsWith('**') && part.endsWith('**')) {
                                      return <strong key={partIndex}>{part.replace(/\*\*/g, '')}</strong>
                                    }
                                    return <span key={partIndex}>{part}</span>
                                  })}
                                </p>
                              )
                            }
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : content?.text ? (
                  <div className="relative w-full h-full flex items-center justify-center p-8">
                    <div className="text-center w-full">
                      <div className="text-xl md:text-3xl lg:text-4xl font-serif whitespace-pre-line text-gray-900">
                        {content.text}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-gray-400">
                    Brak treści
                  </div>
                )}
                    </div>
                  </div>
                </div>

                {/* Page indicator - poza białym kontenerem kursu */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 text-sm rounded">
                  {currentPageIndex + 1} / {pages.length}
                </div>

                {/* Navigation arrows - hidden on mobile */}
                {currentPageIndex > 0 && (
                  <button
                    onClick={prevPage}
                    className="hidden lg:block absolute left-0 -bottom-2 -translate-x-20 p-4 z-10 nav-arrow-elegant"
                    aria-label="Poprzednia strona"
                  >
                    <svg
                      className="w-6 h-6 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  </button>
                )}

                {currentPageIndex < pages.length - 1 && (
                  <button
                    onClick={nextPage}
                    disabled={!canGoToNextPage()}
                    className={`hidden lg:block absolute right-0 -bottom-2 translate-x-20 p-4 z-10 ${
                      canGoToNextPage() 
                        ? 'nav-arrow-elegant' 
                        : 'opacity-30 cursor-not-allowed bg-gray-800/50 rounded-full'
                    }`}
                    aria-label={canGoToNextPage() ? t.common.next : t.course.unlockNextStep}
                    title={canGoToNextPage() ? t.common.next : t.course.unlockNextStep}
                  >
                    {canGoToNextPage() ? (
                      <svg
                        className="w-6 h-6 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-6 h-6 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Gallery z postępami - po prawej stronie (ukryte na mobile) */}
          <div className="hidden lg:block w-[32rem] flex-shrink-0 ml-24 relative">
            {/* Przełącznik języka i wylogowanie */}
            <div className="flex items-center justify-between mb-4 gap-2 w-full">
              <div className="flex-1 min-w-0">
                <ProgressTimeline completedPages={completedPages} onNavigate={goToPage} />
              </div>
              <button
                onClick={handleLogout}
                className="w-10 h-10 flex items-center justify-center btn-elegant flex-shrink-0"
                aria-label={t.common.logout}
                title={t.common.logout}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
            
            {/* Kontener z przełączanymi widokami */}
            <div className="mt-4 h-[680px] overflow-hidden rounded-2xl">
              {activePanel === 'gallery' && (
                <ProgressGallery onProgressUpdate={setCompletedPages} />
              )}
              {activePanel === 'dictionary' && (
                <div className="w-full lg:w-[32rem] h-full p-4 panel-elegant panel-glow overflow-auto rounded-2xl">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">{t.dictionary.title}</h3>
                  <DictionaryInline />
                </div>
              )}
              {activePanel === 'chat' && (
                <div className="w-full lg:w-[32rem] h-full p-4 panel-elegant panel-glow overflow-auto rounded-2xl">
                  <ChatBox />
                </div>
              )}
              {activePanel === 'video' && currentPage && (
                <VideoPlayer pageNumber={currentPage.pageNumber} />
              )}
            </div>

            {/* Panel switching buttons */}
            <div className="flex gap-3 mt-4">
              {/* Gallery button - ikona aparatu */}
              <button
                onClick={() => setActivePanel('gallery')}
                className={`w-14 h-14 flex items-center justify-center ${activePanel === 'gallery' ? 'btn-icon-elegant-active' : 'btn-icon-elegant'}`}
                aria-label={t.course.yourProgress}
                title={t.course.yourProgress}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>

              {/* Dictionary button - ikona książki */}
              <button
                onClick={() => setActivePanel('dictionary')}
                className={`w-14 h-14 flex items-center justify-center ${activePanel === 'dictionary' ? 'btn-icon-elegant-active' : 'btn-icon-elegant'}`}
                aria-label={t.dictionary.title}
                title={t.dictionary.title}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </button>

              {/* Chat button - ikona wiadomości */}
              <button
                onClick={() => setActivePanel('chat')}
                className={`w-14 h-14 flex items-center justify-center ${activePanel === 'chat' ? 'btn-icon-elegant-active' : 'btn-icon-elegant'}`}
                aria-label={t.chat.title}
                title={t.chat.title}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </button>

              {/* Video button - ikona play */}
              <button
                onClick={() => setActivePanel('video')}
                className={`w-14 h-14 flex items-center justify-center ${activePanel === 'video' ? 'btn-icon-elegant-active' : 'btn-icon-elegant'}`}
                aria-label="Video"
                title="Video"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>

              {/* Language button wrapper z relative dla dropdown - ml-auto przesuwa na prawo */}
              <div className="relative ml-auto w-14 h-14">
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className={`w-14 h-14 flex items-center justify-center ${showLanguageMenu ? 'btn-icon-elegant-active' : 'btn-icon-elegant'}`}
                  aria-label="Language"
                  title="Language"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                </button>
                
                {/* Language dropdown menu - bezpośrednio przy przycisku */}
                {showLanguageMenu && (
                  <>
                    {/* Backdrop do zamykania menu */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowLanguageMenu(false)}
                    />
                    {/* Menu - nad przyciskiem */}
                    <div className="absolute bottom-48 right-16 py-2 w-36 panel-elegant panel-glow rounded-lg shadow-2xl z-50">
                      <button
                        onClick={() => {
                          setLanguage('PL')
                          setShowLanguageMenu(false)
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                          language === 'PL' 
                            ? 'text-cyan-400 bg-cyan-500/10' 
                            : 'text-gray-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span>🇵🇱</span>
                        <span>Polski</span>
                        {language === 'PL' && (
                          <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setLanguage('DE')
                          setShowLanguageMenu(false)
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                          language === 'DE' 
                            ? 'text-cyan-400 bg-cyan-500/10' 
                            : 'text-gray-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span>🇩🇪</span>
                        <span>Deutsch</span>
                        {language === 'DE' && (
                          <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile: Floating navigation and menu button */}
      <div className="lg:hidden fixed bottom-4 left-0 right-0 flex justify-center items-center gap-3 z-40 px-4">
        {/* Page indicator */}
        <div className="bg-gray-900/80 backdrop-blur-sm text-white/80 text-sm px-3 py-2 rounded-full">
          {currentPageIndex + 1} / {pages.length}
        </div>
        
        {/* Previous button */}
        <button
          onClick={prevPage}
          disabled={currentPageIndex === 0}
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            currentPageIndex === 0 ? 'bg-gray-700/50 opacity-30' : 'bg-gray-900/80 backdrop-blur-sm'
          }`}
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {/* Next button */}
        <button
          onClick={nextPage}
          disabled={!canGoToNextPage() || currentPageIndex >= pages.length - 1}
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            (!canGoToNextPage() || currentPageIndex >= pages.length - 1) ? 'bg-gray-700/50 opacity-30' : 'bg-gray-900/80 backdrop-blur-sm'
          }`}
        >
          {canGoToNextPage() ? (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )}
        </button>
        
        {/* Menu button */}
        <button
          onClick={() => setShowMobileMenu(true)}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-orange-500/90 backdrop-blur-sm"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile: Functions modal */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-3xl p-4 max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-1 bg-gray-600 rounded-full"></div>
            </div>
            
            {/* Header with close and logout */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-medium">Menu</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleLogout}
                  className="p-2 bg-gray-800 rounded-lg text-white/70"
                  aria-label={t.common.logout}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 bg-gray-800 rounded-lg text-white/70"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Panel switching buttons */}
            <div className="flex gap-2 mb-4 justify-center">
              <button
                onClick={() => setActivePanel('gallery')}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 ${
                  activePanel === 'gallery' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
                <span className="text-sm">{t.course.yourProgress}</span>
              </button>
              <button
                onClick={() => setActivePanel('dictionary')}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 ${
                  activePanel === 'dictionary' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-sm">{t.dictionary.title}</span>
              </button>
            </div>
            <div className="flex gap-2 mb-4 justify-center">
              <button
                onClick={() => setActivePanel('chat')}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 ${
                  activePanel === 'chat' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-sm">{t.chat.title}</span>
              </button>
              <button
                onClick={() => setActivePanel('video')}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 ${
                  activePanel === 'video' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">Video</span>
              </button>
            </div>
            
            {/* Panel content */}
            <div className="flex-1 overflow-hidden rounded-xl min-h-[300px]">
              {activePanel === 'gallery' && (
                <ProgressGallery onProgressUpdate={setCompletedPages} />
              )}
              {activePanel === 'dictionary' && (
                <div className="w-full h-full p-4 panel-elegant panel-glow overflow-auto rounded-xl">
                  <DictionaryInline />
                </div>
              )}
              {activePanel === 'chat' && (
                <div className="w-full h-full p-4 panel-elegant panel-glow overflow-auto rounded-xl">
                  <ChatBox />
                </div>
              )}
              {activePanel === 'video' && currentPage && (
                <VideoPlayer pageNumber={currentPage.pageNumber} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


