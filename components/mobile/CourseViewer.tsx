'use client'

import { useState, useEffect, useRef } from 'react'
import Pusher from 'pusher-js'
import { PROGRESS_PAGES, isProgressPage } from '@/lib/progress-pages'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { TipCloud } from '../shared/TipCloud'
import { DictionaryInline } from '../shared/DictionaryInline'
import { ChatBox } from '../shared/ChatBox'
import { PhotoUploadComponent } from '../shared/PhotoUploadComponent'
import { QRCodeUpload } from '../shared/QRCodeUpload'
import { ProgressGallery } from '../shared/ProgressGallery'
import { ProgressEvaluation } from '../shared/ProgressEvaluation'
import { ProgressTimeline } from '../shared/ProgressTimeline'
import { VideoPlayer, VIDEO_PAGES } from '../shared/VideoPlayer'
import { Confetti } from '../shared/Confetti'
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
  const [menuActivePanel, setMenuActivePanel] = useState<'gallery' | 'dictionary' | 'chat' | 'video'>('gallery')
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
  const [isDraggingPage, setIsDraggingPage] = useState(false)
  const pageIndicatorRef = useRef<HTMLDivElement>(null)
  const [showTips, setShowTips] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
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
  const [qrUploading, setQrUploading] = useState(false)
  const [qrUploadStatus, setQrUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const pusherRef = useRef<Pusher | null>(null)
  
  // Touch/swipe navigation wyłączona - koliduje ze scrollowaniem strony
  // Użytkownicy mogą korzystać z przycisków nawigacji lub paska postępu
  
  // Mapowanie języka z kontekstu na format folderów (PL, DE, EN Usa)
  // langFolder - dla bezpośredniego dostępu do plików public
  // language - dla API routes (mają własne mapowanie)
  const langFolderMap: { [key: string]: string } = {
    'EN': 'EN Usa',
    'PL': 'PL',
    'DE': 'DE',
  }
  const langFolder = langFolderMap[language] || language

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

  // Resetuj showVideo przy zmianie strony
  useEffect(() => {
    if (!course) return
    const pages = course.pages || []
    const currentPage = pages[currentPageIndex]
    if (currentPage) {
      setShowVideo(false)
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
        const response = await fetch(`/api/course-tips/${currentPage.pageNumber}/${language}`)
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
    // Resetuj widoczność Tips przy zmianie strony
    setShowTips(false)
  }, [course, currentPageIndex, language])

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

  // Touch/swipe handlers wyłączone - nawigacja przez przyciski i pasek postępu

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
      const textFileUrl = pageContent.textFile.replace(/\/(PL|DE|EN)$/, `/${langFolder}`)
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
  }, [currentPageIndex, course, langFolder])

  // Ładuj teksty dla strony 45 z plików
  useEffect(() => {
    if (!course) return
    
    const pages = course.pages || []
    const currentPage = pages[currentPageIndex]
    if (!currentPage || currentPage.pageNumber !== 45) return

    const loadTexts = async () => {
      try {
        const [res1, res2, res3] = await Promise.all([
          fetch(`/course/strona 45/Wersja/${langFolder}/text1.txt`),
          fetch(`/course/strona 45/Wersja/${langFolder}/text2.txt`),
          fetch(`/course/strona 45/Wersja/${langFolder}/text3.txt`)
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
  }, [currentPageIndex, course, langFolder])

  // Ładuj teksty dla strony 46 z plików
  useEffect(() => {
    if (!course) return
    
    const pages = course.pages || []
    const currentPage = pages[currentPageIndex]
    if (!currentPage || currentPage.pageNumber !== 46) return

    const loadTexts = async () => {
      try {
        const [res1, res2, res3] = await Promise.all([
          fetch(`/course/strona 46/Wersja/${langFolder}/text1.txt`),
          fetch(`/course/strona 46/Wersja/${langFolder}/text2.txt`),
          fetch(`/course/strona 46/Wersja/${langFolder}/text3.txt`)
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
  }, [currentPageIndex, course, langFolder])

  // Ładuj teksty dla strony 47 z plików
  useEffect(() => {
    if (!course) return

    const pages = course.pages || []
    const currentPage = pages[currentPageIndex]
    if (!currentPage || currentPage.pageNumber !== 47) return

    const loadTexts = async () => {
      try {
        const [res1, res2, res3] = await Promise.all([
          fetch(`/course/strona 47/Wersja/${langFolder}/text1.txt`),
          fetch(`/course/strona 47/Wersja/${langFolder}/text2.txt`),
          fetch(`/course/strona 47/Wersja/${langFolder}/text3.txt`)
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
  }, [currentPageIndex, course, langFolder])

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
          fetch(`/api/course-text/32/${language}/label1.txt`),
          fetch(`/api/course-text/32/${language}/label2.txt`)
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
  }, [currentPageIndex, course, langFolder])

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
        const response = await fetch(`/api/course-content/${currentPage.pageNumber}/${language}`)
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
  }, [currentPageIndex, course, langFolder])

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
  
  // Strony które na mobile mają mieć layout jak strona 2 (zdjęcie góra, tekst dół)
  const mobileImageTopTextPages = new Set([4, 8, 11, 13, 18, 23, 26, 31, 37, 42])

  // Strony, które mają mieć czarny tekst zamiast białego
  const pagesWithBlackText = new Set([3, 8, 12, 13, 18, 31, 45, 46, 47, 51])
  const shouldUseBlackText = pagesWithBlackText.has(currentPage.pageNumber)

  return (
    <div 
      className="min-h-screen" 
      style={{ 
        background: isMobile ? ([7, 14, 15, 16, 19, 20, 25, 28, 29, 34, 35, 39, 40].includes(currentPage?.pageNumber || 0) ? '#1a1a1a' : '#000000') : '#1a1d24',
        width: isMobile ? '100%' : 'auto',
        maxWidth: isMobile ? '100vw' : 'none',
        overflowX: isMobile ? 'hidden' : 'visible',
        overflowY: 'auto',
        paddingBottom: isMobile ? '0' : '0' // Pasek jest fixed, więc nie potrzeba paddingu
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
          padding: isMobile ? '0' : '32px 24px',
          marginLeft: isMobile ? '0' : '24px',
          overflow: isMobile ? 'hidden' : 'visible',
          background: isMobile ? ([7, 14, 15, 16, 19, 20, 25, 28, 29, 34, 35, 39, 40].includes(currentPage?.pageNumber || 0) ? '#1a1a1a' : '#000000') : undefined
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
              {/* Ikony Tips i Video na stronie kursu - stałe pozycje */}
              {isMobile ? (
                <>
                  {/* Ikona żarówki - Tips - stała pozycja */}
                  {tips.length > 0 && (
                    <div className="absolute top-4 right-4 z-50">
                      {!showTips ? (
                        <button
                          onClick={() => setShowTips(true)}
                          className="relative w-12 h-12 flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80 active:opacity-60 bg-transparent border-none p-0"
                          aria-label="Pokaż wskazówki"
                        >
                          <Image
                            src="/course/ikony/żarówka.png"
                            alt="Wskazówki"
                            width={48}
                            height={48}
                            className="object-contain"
                          />
                        </button>
                      ) : (
                        <div className="fixed top-4 right-4 z-[100] bg-black/60 backdrop-blur-md rounded-2xl p-4 max-w-[280px]">
                          <div className="space-y-2">
                      {tips.map((tip, index) => (
                        <TipCloud key={index} tip={tip} />
                      ))}
                          </div>
                          <button
                            onClick={() => setShowTips(false)}
                            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-white/60 hover:text-white/90 text-lg transition-colors"
                            aria-label="Ukryj wskazówki"
                          >
                            ×
                          </button>
          </div>
                      )}
                    </div>
                  )}
                  
                  {/* Ikona Movie - Video - stała pozycja */}
                  {currentPage && VIDEO_PAGES.includes(currentPage.pageNumber) && (
                    <div className="absolute top-4 right-4 z-50" style={{ top: tips.length > 0 ? '68px' : '16px' }}>
                      {!showVideo ? (
                        <button
                          onClick={() => setShowVideo(true)}
                          className="relative w-12 h-12 flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80 active:opacity-60 bg-transparent border-none p-0"
                          aria-label="Odtwórz film"
                        >
                          <Image
                            src="/course/ikony/Movie.png"
                            alt="Film"
                            width={48}
                            height={48}
                            className="object-contain"
                          />
                        </button>
                      ) : (
                        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center">
                          <button
                            onClick={() => setShowVideo(false)}
                            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white text-2xl z-10"
                            aria-label="Zamknij film"
                          >
                            ×
                          </button>
                          <div className="w-full h-full flex items-center justify-center p-4">
                            <VideoPlayer pageNumber={currentPage.pageNumber} minimal={true} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                // Desktop layout
                <div className="w-64 flex-shrink-0 space-y-4">
                  {/* Ikona żarówki - Tips */}
                  {tips.length > 0 && (
                    <>
                      {!showTips ? (
                        <button
                          onClick={() => setShowTips(true)}
                          className="relative w-12 h-12 flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80 active:opacity-60 bg-transparent border-none p-0"
                          aria-label="Pokaż wskazówki"
                        >
                          <Image
                            src="/course/ikony/żarówka.png"
                            alt="Wskazówki"
                            width={48}
                            height={48}
                            className="object-contain"
                          />
                        </button>
                      ) : (
                        <div className="relative bg-black/60 backdrop-blur-md rounded-2xl p-4">
                          <div className="space-y-2">
                            {tips.map((tip, index) => (
                              <TipCloud key={index} tip={tip} />
                            ))}
                          </div>
                          <button
                            onClick={() => setShowTips(false)}
                            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-white/60 hover:text-white/90 text-lg transition-colors"
                            aria-label="Ukryj wskazówki"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Ikona Movie - Video */}
                  {currentPage && VIDEO_PAGES.includes(currentPage.pageNumber) && (
                    <>
                      {!showVideo ? (
                        <button
                          onClick={() => setShowVideo(true)}
                          className="relative w-12 h-12 flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80 active:opacity-60 bg-transparent border-none p-0"
                          aria-label="Odtwórz film"
                        >
                          <Image
                            src="/course/ikony/Movie.png"
                            alt="Film"
                            width={48}
                            height={48}
                            className="object-contain"
                          />
                        </button>
                      ) : (
                        <div className="relative">
                          <VideoPlayer pageNumber={currentPage.pageNumber} minimal={true} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Container for course content - responsive */}
              <div 
                className="glow-wrapper"
                style={{ 
                  width: isMobile ? '100%' : '850px',
                  maxWidth: isMobile ? '100%' : '850px',
                  padding: isMobile ? '0' : '12px',
                  borderRadius: isMobile ? '0' : '16px',
                  background: isMobile ? ([7, 14, 15, 16, 19, 20, 25, 28, 29, 34, 35, 39, 40].includes(currentPage.pageNumber) ? '#1a1a1a' : '#000000') : (currentPage.pageNumber === 1 || isProgressEvaluation || currentPage.pageNumber === 19) ? '#000000' : 'rgba(35, 40, 50, 0.4)', 
                  border: isMobile ? 'none' : (currentPage.pageNumber === 16 || currentPage.pageNumber === 1) ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                  overflow: isMobile ? 'auto' : 'visible',
                  flexShrink: 0
                }}
              >
                <div className={`relative ${isMobile ? 'overflow-y-auto' : 'overflow-hidden'} ${isMobile ? 'rounded-none' : 'rounded-xl'} scroll-transition-wrapper`} style={{ background: isMobile ? ([7, 14, 15, 16, 19, 20, 25, 28, 29, 34, 35, 39, 40].includes(currentPage.pageNumber) ? '#1a1a1a' : '#000000') : (currentPage.pageNumber === 1 || currentPage.pageNumber === 14 || currentPage.pageNumber === 19 || isProgressEvaluation) ? '#000000' : '#ffffff', WebkitOverflowScrolling: isMobile ? 'touch' : undefined }}>
                  {/* Exiting page overlay during transition */}
                  {isTransitioning && exitingPageIndex !== null && (
                    <div 
                      className={`course-container ${transitionDirection === 'up' ? 'page-exit-to-top' : 'page-exit-to-bottom'}`}
                      style={{ background: isMobile ? ([7, 14, 15, 16, 19, 20, 25, 28, 29, 34, 35, 39, 40].includes(currentPage.pageNumber) ? '#1a1a1a' : '#000000') : (currentPage.pageNumber === 1 || currentPage.pageNumber === 14 || currentPage.pageNumber === 19 || isProgressEvaluation) ? '#000000' : '#ffffff' }}
                    />
                  )}
                  {/* Current page */}
                  <div 
                    className={`course-container overflow-y-auto relative ${isTransitioning ? (transitionDirection === 'up' ? 'page-enter-from-bottom' : 'page-enter-from-top') : ''}`}
                    style={{ 
                      background: isMobile ? ([7, 14, 15, 16, 19, 20, 25, 28, 29, 34, 35, 39, 40].includes(currentPage.pageNumber) ? '#1a1a1a' : '#000000') : (currentPage.pageNumber === 1 || currentPage.pageNumber === 14 || currentPage.pageNumber === 19 || isProgressEvaluation) ? '#000000' : '#ffffff',
                      WebkitOverflowScrolling: 'touch' // Smooth scrolling na iOS
                    }}
                  >
                    <div 
                      className="absolute inset-0"
                    >
                {currentPage.pageNumber === 1 && isMobile ? (
                  // Strona 1 - zdjęcie hero-mobile (1620x3150, proporcje 9:17.5)
                  <div className="absolute inset-0 w-full h-full">
                    <Image
                      src="/course/strona 1/Foto/hero-mobile.jpg"
                      alt="Hero"
                      fill
                      className="object-cover object-top"
                      priority={true}
                      sizes="100vw"
                    />
                  </div>
                ) : isGridLayout ? (
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
                  // Strona 2: Dwa kontenery - zdjęcie i tekst (dla wszystkich rozmiarów)
                  currentPage.pageNumber === 2 ? (
                    <div 
                      className="w-full h-full bg-white"
                      style={{
                        display: 'grid',
                        gridTemplateRows: 'auto 1fr',
                        paddingBottom: '0'
                      }}
                    >
                      {/* KONTENER 1: Zdjęcie */}
                      <div 
                        className="relative w-full overflow-hidden rounded-2xl"
                      >
                        <Image
                          src={content.imageUrl?.startsWith('/') ? content.imageUrl : `/course/strona ${currentPage.pageNumber}/Foto/${content.imageUrl}`}
                          alt={currentPage.title || `Strona ${currentPage.pageNumber}`}
                          fill
                          className="object-cover object-top"
                          priority={currentPageIndex === 1}
                          sizes="100vw"
                        />
                      </div>
                      {/* KONTENER 2: Tekst - wycentrowany */}
                      <div 
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%',
                          padding: '16px',
                          paddingTop: '4px',
                          paddingBottom: '16px'
                        }}
                      >
                        <div 
                          className="bg-gray-50 border border-gray-200 rounded-2xl p-5"
                          style={{
                            width: '100%',
                            maxWidth: '90%',
                            textAlign: 'center'
                          }}
                        >
                          {loadingText ? (
                            <div className="text-gray-400 text-center">Ładowanie...</div>
                          ) : (
                            <div className="text-sm sm:text-base font-sans text-gray-900 leading-relaxed text-center font-bold">
                              {overlayText.split(/\n\s*\n/).filter(p => p.trim()).map((paragraph: string, index: number) => (
                                <p key={index} className={index > 0 ? 'mt-4' : ''}>
                                  {paragraph.trim()}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                  // DESKTOP: oryginalny layout
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
                        <div 
                          className={`w-[60%] max-w-[60%] pl-6 md:pl-8 lg:pl-12 pr-4 ${currentPage.pageNumber !== 2 ? 'pb-6 md:pb-8 lg:pb-12' : ''}`}
                          style={{ paddingBottom: currentPage.pageNumber === 2 ? '15%' : undefined }}
                        >
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
                  )
                ) : isQuoteText ? (
                  // Layout z cytatem na górze i tekstem poniżej - oba wyśrodkowane
                  <div className="relative w-full h-full flex flex-col items-center justify-center p-8">
                    {loadingText ? (
                      <div className="text-gray-400">Ładowanie...</div>
                    ) : (
                      <>
                        {/* Cytat na górze - wyśrodkowany, większy i pogrubiony */}
                        {overlayText.includes('---') && (
                          <div className="text-center mb-8 w-full max-w-3xl bg-gray-50 border border-gray-200 rounded-2xl p-6 md:p-8">
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
                                    <div className="text-base md:text-lg lg:text-xl font-serif text-gray-900 text-right pr-4 md:pr-8">
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
                          <div className="w-full max-w-3xl bg-gray-50 border border-gray-200 rounded-2xl p-6 md:p-8">
                            <div className="text-base md:text-lg lg:text-xl font-serif text-gray-900 leading-relaxed whitespace-pre-line text-center">
                              {overlayText.split('---')[1]?.trim()}
                            </div>
                          </div>
                        )}
                        {!overlayText.includes('---') && (
                          <div className="w-full max-w-3xl bg-gray-50 border border-gray-200 rounded-2xl p-6 md:p-8">
                            <div className="text-base md:text-lg lg:text-xl font-serif text-gray-900 leading-relaxed whitespace-pre-line text-center">
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
                  // MOBILE: Zdjęcie na dole, tekst nad nim - wycentrowany (Strona 5)
                  isMobile && currentPage.pageNumber === 5 ? (
                    <div className="relative w-full h-full bg-white" style={{ paddingBottom: '0' }}>
                      {/* Zdjęcie na samym dole */}
                      <div 
                        className="absolute bottom-0 left-0 right-0 w-full overflow-hidden"
                        style={{ 
                          height: '100vw',
                          aspectRatio: '1/1',
                          zIndex: 0
                        }}
                      >
                        <Image
                          src={content.imageUrl?.startsWith('/') ? content.imageUrl : `/course/strona ${currentPage.pageNumber}/Foto/${content.imageUrl}`}
                          alt={currentPage.title || `Strona ${currentPage.pageNumber}`}
                          fill
                          className="object-cover object-top"
                          priority={false}
                          sizes="100vw"
                        />
                      </div>
                      {/* Tekst nad zdjęciem - nachodzi na zdjęcie, wysoko */}
                      <div className="absolute inset-0 flex items-start justify-center px-4" style={{ paddingTop: 'calc(3rem - 5%)', marginTop: '5%' }}>
                        {loadingText ? (
                          <div className="text-gray-400 text-center">Ładowanie...</div>
                        ) : (
                          <div className="text-sm sm:text-base font-sans text-gray-900 text-center bg-gray-100 border-2 border-gray-300 rounded-2xl px-5" style={{ paddingTop: '0.966rem', paddingBottom: '0.966rem', lineHeight: '1.4' }}>
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
                                    // Pierwszy akapit to tytuł "Gotowy? Zaczynamy!"
                                    if (index === 0 && trimmedParagraph.includes('Gotowy')) {
                                      const titleLine = trimmedParagraph.split('\n')[0].trim()
                                      return (
                                        <div key={index}>
                                          <h2 className="font-bold text-xl mb-3 text-center">
                                            {titleLine}
                                          </h2>
                                          {trimmedParagraph.split('\n').slice(1).filter(l => l.trim()).length > 0 && (
                                            <p className="mb-3 whitespace-pre-line text-center">
                                              {trimmedParagraph.split('\n').slice(1).join('\n').trim()}
                                            </p>
                                          )}
                                        </div>
                                      )
                                    }
                                    return (
                                      <p key={index} className={index > 0 ? 'mt-4' : ''}>
                                        {trimmedParagraph}
                                      </p>
                                    )
                                  })}
                                  {afterSeparator && (
                                    <div className="mt-6 pt-4 border-t border-gray-300">
                                      <p className="whitespace-pre-line">{afterSeparator}</p>
                                    </div>
                                  )}
                                </>
                              )
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // DESKTOP: Oryginalny layout - zdjęcie pełne, tekst na górze
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
                    <div className="absolute top-0 left-0 right-0 px-6 md:px-8 lg:px-12" style={{ paddingTop: 'calc(2rem - 5%)', marginTop: '5%' }}>
                      {loadingText ? (
                        <div className="text-gray-400">Ładowanie...</div>
                      ) : (
                        <div className="text-black bg-gray-50 border-2 border-gray-700 rounded-2xl px-6 md:px-8 max-w-3xl mx-auto" style={{ paddingTop: '1.162rem', paddingBottom: '1.162rem', lineHeight: '1.4' }}>
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
                  )
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
                  <div className={`relative w-full h-full flex items-center justify-center p-8 ${[7, 14, 15, 16, 19, 20, 25, 28, 29, 34, 35, 39, 40].includes(currentPage.pageNumber) ? '' : 'bg-white'}`} style={[7, 14, 15, 16, 19, 20, 25, 28, 29, 34, 35, 39, 40].includes(currentPage.pageNumber) ? { background: '#1a1a1a' } : {}}>
                    {loadingText ? (
                      <div className="text-gray-400">Ładowanie...</div>
                    ) : (
                      <div className="text-center w-full max-w-3xl bg-gray-50 border border-gray-200 rounded-2xl p-6 md:p-8">
                        <div className={`font-serif whitespace-pre-line text-gray-900 leading-relaxed ${currentPage.pageNumber === 43 ? 'text-xl md:text-2xl lg:text-3xl' : ''}`}>
                          {currentPage.pageNumber === 43 ? (
                            (overlayText || content.text || '').split('\n\n').filter((p: string) => p.trim()).map((paragraph: string, index: number) => (
                              <p key={index} className={index > 0 ? 'mt-4' : ''}>
                                {paragraph.trim()}
                              </p>
                            ))
                          ) : (
                            (overlayText || content.text || '').split('\n').map((line: string, index: number) => (
                              <div 
                                key={index} 
                                className={
                                  currentPage.pageNumber === 6
                                    ? 'text-2xl md:text-3xl lg:text-4xl'
                                    : currentPage.pageNumber === 35
                                    ? 'text-3xl md:text-4xl lg:text-5xl'
                                    : index === 0
                                    ? 'text-4xl md:text-5xl lg:text-6xl'
                                    : 'text-2xl md:text-3xl lg:text-4xl'
                                }
                              >
                                {line}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : isFormattedText ? (
                  // Tekst z formatowaniem (pogrubione nagłówki)
                  <div 
                    className={`relative w-full h-full flex justify-center p-8 overflow-y-auto ${[7, 14, 15, 16, 19, 20, 25, 28, 29, 34, 35, 39, 40].includes(currentPage.pageNumber) ? '' : 'bg-white'}`}
                    style={{
                      background: [7, 14, 15, 16, 19, 20, 25, 28, 29, 34, 35, 39, 40].includes(currentPage.pageNumber) ? '#1a1a1a' : undefined,
                      alignItems: (currentPage.pageNumber === 10 && language === 'DE') || (currentPage.pageNumber === 44 && language === 'DE' && isMobile) || (currentPage.pageNumber === 48 && language === 'DE') ? 'flex-start' : 'center',
                      paddingTop: currentPage.pageNumber === 10 && language === 'DE' ? '6rem' 
                        : currentPage.pageNumber === 44 && language === 'DE' && isMobile ? 'calc(2rem + 25%)' 
                        : currentPage.pageNumber === 48 && language === 'DE' ? 'calc(2rem + 25%)'
                        : '2rem'
                    }}
                  >
                    {loadingText ? (
                      <div className="text-gray-400">Ładowanie...</div>
                    ) : (
                      <div className={`w-full max-w-3xl mx-auto ${currentPage.pageNumber === 10 ? 'bg-gray-50 border border-gray-200 rounded-2xl p-6 md:p-8' : currentPage.pageNumber === 44 ? 'bg-gray-50 border border-gray-200 rounded-2xl p-6 md:p-8' : currentPage.pageNumber === 48 ? 'bg-gray-50 border border-gray-200 rounded-2xl p-6 md:p-8' : ''}`} style={currentPage.pageNumber === 48 && language === 'DE' ? { textAlign: 'center' } : undefined}>
                        <div className="text-base md:text-lg lg:text-xl font-serif text-gray-900 leading-relaxed whitespace-pre-line text-center" style={currentPage.pageNumber === 48 && language === 'DE' ? { textAlign: 'center' } : undefined}>
                          {(overlayText || '').split(/\r?\n\r?\n/).filter(p => p.trim()).map((paragraph: string, index: number) => {
                            // Sprawdź czy akapit zaczyna się od ** (pogrubiony nagłówek)
                            const isBold = paragraph.trim().startsWith('**') && paragraph.trim().endsWith('**')
                            const cleanParagraph = paragraph.trim().replace(/\*\*/g, '')
                            
                            if (isBold) {
                              return (
                                <p key={index} className="font-bold mb-3 mt-6 first:mt-0 text-center" style={currentPage.pageNumber === 48 && language === 'DE' ? { textAlign: 'center' } : undefined}>
                                  {cleanParagraph}
                                </p>
                              )
                            } else {
                              // Sprawdź czy akapit zawiera ** w środku (pogrubiony fragment)
                              const parts = paragraph.split(/(\*\*.*?\*\*)/g)
                              return (
                                <p key={index} className="mb-4 text-center" style={currentPage.pageNumber === 48 && language === 'DE' ? { textAlign: 'center' } : undefined}>
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
                  // QR kod do uploadu zdjęć z postępami - tylko desktop
                  // Na mobile pokazujemy przyciski aparatu i galerii z uploadem
                  isMobile ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center p-8" style={{ backgroundColor: '#1a1a1a' }}>
                      {/* Nagłówek */}
                      {qrPageContent && (
                        <h2 className="text-xl md:text-2xl font-serif text-gray-200 text-center mb-10 px-4">
                          {qrPageContent}
                        </h2>
                      )}
                      
                      {/* Kontener na przyciski */}
                      <div className="flex flex-col items-center gap-6 w-full max-w-xs">
                        {/* Przycisk aparatu */}
                        <button
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem('token')
                              if (!token) {
                                alert('Musisz być zalogowany')
                                return
                              }

                              setQrUploading(true)
                              setQrUploadStatus('idle')

                              let uploadId = userUploadId
                              if (!uploadId) {
                                const response = await fetch('/api/user/upload-id', {
                                  headers: { 'Authorization': `Bearer ${token}` }
                                })
                                const data = await response.json()
                                if (!data.uploadId) {
                                  alert('Nie udało się pobrać ID użytkownika')
                                  setQrUploading(false)
                                  return
                                }
                                uploadId = data.uploadId
                                setUserUploadId(uploadId)
                              }

                              const input = document.createElement('input')
                              input.type = 'file'
                              input.accept = 'image/*'
                              input.capture = 'environment'
                              input.onchange = async (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0]
                                if (file) {
                                  try {
                                    const formData = new FormData()
                                    formData.append('image', file)
                                    formData.append('pageNumber', currentPage.pageNumber.toString())
                                    formData.append('uploadId', uploadId!)

                                    const uploadResponse = await fetch('/api/upload-photo', {
                                      method: 'POST',
                                      headers: { 'Authorization': `Bearer ${token}` },
                                      body: formData
                                    })

                                    if (uploadResponse.ok) {
                                      setQrUploadStatus('success')
                                      setCompletedPages(prev => [...new Set([...prev, currentPage.pageNumber])])
                                      setTimeout(() => setQrUploadStatus('idle'), 3000)
                                    } else {
                                      setQrUploadStatus('error')
                                      setTimeout(() => setQrUploadStatus('idle'), 3000)
                                    }
                                  } catch (err) {
                                    console.error('Upload error:', err)
                                    setQrUploadStatus('error')
                                    setTimeout(() => setQrUploadStatus('idle'), 3000)
                                  } finally {
                                    setQrUploading(false)
                                  }
                                } else {
                                  setQrUploading(false)
                                }
                              }
                              input.click()
                            } catch (err) {
                              console.error('Error:', err)
                              alert('Wystąpił błąd')
                              setQrUploading(false)
                            }
                          }}
                          disabled={qrUploading}
                          className={`relative w-[120px] h-[120px] rounded-[32px] overflow-hidden transition-all duration-150 ${qrUploading ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.95] active:translate-y-1'}`}
                          style={{ 
                            boxShadow: '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)',
                            padding: 0,
                            border: 'none',
                            backgroundImage: qrUploading ? 'none' : 'url(/course/ikony/aparat.png)',
                            backgroundSize: '100% 100%',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                          }}
                          onMouseDown={(e) => {
                            if (!qrUploading) {
                              e.currentTarget.style.boxShadow = 'inset 0 2px 10px rgba(0, 0, 0, 0.3), -5px 5px 20px rgba(150, 150, 150, 0.3), -10px 10px 40px rgba(120, 120, 120, 0.2)'
                            }
                          }}
                          onMouseUp={(e) => {
                            if (!qrUploading) {
                              e.currentTarget.style.boxShadow = '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!qrUploading) {
                              e.currentTarget.style.boxShadow = '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)'
                            }
                          }}
                          onTouchStart={(e) => {
                            if (!qrUploading) {
                              e.currentTarget.style.boxShadow = 'inset 0 2px 10px rgba(0, 0, 0, 0.3), -5px 5px 20px rgba(150, 150, 150, 0.3), -10px 10px 40px rgba(120, 120, 120, 0.2)'
                            }
                          }}
                          onTouchEnd={(e) => {
                            if (!qrUploading) {
                              e.currentTarget.style.boxShadow = '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)'
                            }
                          }}
                        >
                          {qrUploading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]">
                              <svg className="animate-spin h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </div>
                          ) : null}
                        </button>

                        {/* Przycisk galerii - otwiera galerię i uploaduje - ukryty na stronach 7, 15, 20, 29, 35, 40 */}
                        {![7, 15, 20, 29, 35, 40].includes(currentPage.pageNumber) && (
                        <button
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem('token')
                              if (!token) {
                                alert('Musisz być zalogowany')
                                return
                              }

                              setQrUploading(true)
                              setQrUploadStatus('idle')

                              // Pobierz uploadId (użyj istniejącego lub pobierz nowy)
                              let uploadId = userUploadId
                              if (!uploadId) {
                                const response = await fetch('/api/user/upload-id', {
                                  headers: { 'Authorization': `Bearer ${token}` }
                                })
                                const data = await response.json()
                                if (!data.uploadId) {
                                  alert('Nie udało się pobrać ID użytkownika')
                                  setQrUploading(false)
                                  return
                                }
                                uploadId = data.uploadId
                                setUserUploadId(uploadId)
                              }

                              // Otwórz galerię (bez capture)
                              const input = document.createElement('input')
                              input.type = 'file'
                              input.accept = 'image/*'
                              // BEZ input.capture - pozwala wybrać z galerii
                              input.onchange = async (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0]
                                if (file) {
                                  try {
                                    const formData = new FormData()
                                    formData.append('image', file)
                                    formData.append('pageNumber', currentPage.pageNumber.toString())
                                    formData.append('uploadId', uploadId!)

                                    const uploadResponse = await fetch('/api/upload-photo', {
                                      method: 'POST',
                                      headers: { 'Authorization': `Bearer ${token}` },
                                      body: formData
                                    })

                                    if (uploadResponse.ok) {
                                      setQrUploadStatus('success')
                                      setCompletedPages(prev => [...new Set([...prev, currentPage.pageNumber])])
                                      setTimeout(() => setQrUploadStatus('idle'), 3000)
                                    } else {
                                      setQrUploadStatus('error')
                                      setTimeout(() => setQrUploadStatus('idle'), 3000)
                                    }
                                  } catch (err) {
                                    console.error('Upload error:', err)
                                    setQrUploadStatus('error')
                                    setTimeout(() => setQrUploadStatus('idle'), 3000)
                                  } finally {
                                    setQrUploading(false)
                                  }
                                } else {
                                  setQrUploading(false)
                                }
                              }
                              input.click()
                            } catch (err) {
                              console.error('Error:', err)
                              alert('Wystąpił błąd')
                              setQrUploading(false)
                            }
                          }}
                          disabled={qrUploading}
                          className={`inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold text-lg rounded-full shadow-lg hover:from-green-600 hover:to-green-700 active:scale-95 transition-all ${qrUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {language === 'DE' ? 'Aus Galerie wählen' : language === 'EN' ? 'Choose from Gallery' : 'Wybierz z galerii'}
                        </button>
                        )}
                      </div>

                      {/* Status uploadu */}
                      {qrUploadStatus === 'success' && (
                        <div className="mt-4 text-green-600 text-base font-semibold animate-pulse flex items-center gap-2">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {language === 'DE' ? 'Foto wurde hochgeladen!' : 'Zdjęcie zostało przesłane!'}
                        </div>
                      )}
                      {qrUploadStatus === 'error' && (
                        <div className="mt-4 text-red-600 text-base font-semibold flex items-center gap-2">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          {language === 'DE' ? 'Fehler beim Hochladen' : 'Błąd podczas przesyłania'}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Desktop - pokaż QR kod
                    <QRCodeUpload pageNumber={currentPage.pageNumber} headerText={qrPageContent} />
                  )
                ) : isProgressEvaluation ? (
                  // Ocena postępów z suwakiem
                  <ProgressEvaluation pageNumber={currentPage.pageNumber} language={language as 'PL' | 'DE' | 'EN'} />
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
                  // Strona 8 - na mobile jak strona 2
                  isMobile && currentPage.pageNumber === 8 ? (
                    // MOBILE: Zdjęcie na dole, tekst wyżej
                    <div className="relative w-full h-full bg-white" style={{ paddingBottom: '0' }}>
                      {/* Kontener ze zdjęciem na dole */}
                      <div 
                        className="relative w-full overflow-hidden rounded-2xl"
                        style={{
                          position: 'absolute',
                          bottom: '-10px',
                          left: 0,
                          right: 0,
                          width: '100%',
                          height: '100vw',
                          aspectRatio: '1/1',
                          zIndex: 0
                        }}
                      >
                        <Image
                          src={content.imageUrl?.startsWith('/') ? content.imageUrl : `/course/strona ${currentPage.pageNumber}/Foto/${content.imageUrl}`}
                          alt={currentPage.title || `Strona ${currentPage.pageNumber}`}
                          fill
                          className="object-cover object-top"
                          priority={false}
                          sizes="100vw"
                        />
                      </div>
                      {/* Tekst wyżej - przesunięty o 30% w górę */}
                      <div 
                        className="absolute inset-0 flex items-center justify-center px-4"
                        style={{
                          top: '25%',
                          transform: 'translateY(-50%)',
                          zIndex: 10
                        }}
                      >
                        <div 
                          className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-2xl p-5"
                        >
                          {loadingText ? (
                            <div className="text-gray-400 text-center">Ładowanie...</div>
                          ) : (
                            <div className="text-sm sm:text-base font-sans text-gray-900 leading-relaxed text-center">
                              {overlayText.split('\n\n').filter(p => p.trim()).map((paragraph: string, index: number) => (
                                <p key={index} className={index > 0 ? 'mt-4' : ''}>
                                  {paragraph.trim()}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // DESKTOP lub inne strony: oryginalny layout
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
                    <div className="absolute inset-0 flex items-start justify-center pt-12 md:pt-16 lg:pt-20 px-6 md:px-8 lg:px-12">
                      {loadingText ? (
                        <div className="text-white">Ładowanie...</div>
                      ) : (
                        <div className="w-full max-w-3xl bg-gray-50 border border-gray-200 rounded-2xl p-6 md:p-8">
                          <div className="text-base md:text-lg lg:text-xl font-serif text-gray-900 leading-relaxed whitespace-pre-line text-center">
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
                  )
                ) : isImageOverlayTextFile ? (
                  // Layout z zdjęciem na cały kontener i tekstem z pliku nałożonym na zdjęcie
                  // Na mobile dla wybranych stron (4,8,11,13,18,23,26,31,37,42) - dwa kontenery
                  isMobile && mobileImageTopTextPages.has(currentPage.pageNumber) ? (
                    <div 
                      className="w-full h-full bg-white"
                      style={currentPage.pageNumber === 23 || currentPage.pageNumber === 18 || currentPage.pageNumber === 13 || currentPage.pageNumber === 4 || currentPage.pageNumber === 11 || currentPage.pageNumber === 31 || currentPage.pageNumber === 37 || currentPage.pageNumber === 42 ? {
                        position: 'relative',
                        paddingBottom: '0' // Miejsce na pasek dolny
                      } : {
                        display: 'grid',
                        gridTemplateRows: 'auto 1fr', // Kontener zdjęcia auto (kwadratowy), tekst wypełnia resztę
                        paddingBottom: '0' // Miejsce na pasek dolny
                      }}
                    >
                      {/* KONTENER 1: Zdjęcie - kwadratowy (dla strony 23, 18, 31, 37 i 42 będzie na dole) */}
                      {currentPage.pageNumber === 23 || currentPage.pageNumber === 18 || currentPage.pageNumber === 31 || currentPage.pageNumber === 37 || currentPage.pageNumber === 42 ? null : (
                        <div 
                          className={`relative w-full overflow-hidden ${(currentPage.pageNumber === 13 || currentPage.pageNumber === 11 || currentPage.pageNumber === 4) ? 'rounded-2xl' : ''}`}
                          style={{
                            aspectRatio: '1/1', // Zawsze kwadratowy
                            position: currentPage.pageNumber === 13 || currentPage.pageNumber === 4 || currentPage.pageNumber === 11 ? 'absolute' : undefined,
                            bottom: currentPage.pageNumber === 13 ? '-10px' : currentPage.pageNumber === 11 ? '-10px' : currentPage.pageNumber === 4 ? '-10px' : undefined,
                            left: currentPage.pageNumber === 13 || currentPage.pageNumber === 4 || currentPage.pageNumber === 11 ? 0 : undefined,
                            right: currentPage.pageNumber === 13 || currentPage.pageNumber === 4 || currentPage.pageNumber === 11 ? 0 : undefined,
                            width: currentPage.pageNumber === 13 || currentPage.pageNumber === 4 || currentPage.pageNumber === 11 ? '100%' : undefined,
                            height: currentPage.pageNumber === 13 || currentPage.pageNumber === 4 || currentPage.pageNumber === 11 ? '100vw' : undefined,
                            zIndex: currentPage.pageNumber === 13 || currentPage.pageNumber === 4 || currentPage.pageNumber === 11 ? 0 : undefined
                          }}
                        >
                        <Image
                          src={content.imageUrl?.startsWith('/') ? content.imageUrl : `/course/strona ${currentPage.pageNumber}/Foto/${content.imageUrl}`}
                          alt={currentPage.title || `Strona ${currentPage.pageNumber}`}
                          fill
                          className="object-cover object-top"
                            priority={currentPage.pageNumber === 13}
                          sizes="100vw"
                        />
                      </div>
                      )}
                      {/* KONTENER 2: Tekst - wycentrowany (dla strony 23, 31, 37 i 42 będzie na górze, dla strony 18 na środku) */}
                      <div 
                        style={{
                          display: 'flex',
                          alignItems: currentPage.pageNumber === 4 ? 'flex-start' : currentPage.pageNumber === 13 ? 'flex-start' : (currentPage.pageNumber === 23 || currentPage.pageNumber === 11 || currentPage.pageNumber === 31 || currentPage.pageNumber === 37 || currentPage.pageNumber === 42) ? 'flex-start' : currentPage.pageNumber === 18 ? 'center' : 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: currentPage.pageNumber === 23 || currentPage.pageNumber === 18 || currentPage.pageNumber === 13 || currentPage.pageNumber === 4 || currentPage.pageNumber === 11 || currentPage.pageNumber === 31 || currentPage.pageNumber === 37 || currentPage.pageNumber === 42 ? '100%' : '100%',
                          padding: '16px',
                          paddingTop: (currentPage.pageNumber === 23 || currentPage.pageNumber === 11 || currentPage.pageNumber === 31 || currentPage.pageNumber === 37 || currentPage.pageNumber === 42 || currentPage.pageNumber === 4) ? '24px' : '16px',
                          position: currentPage.pageNumber === 18 || currentPage.pageNumber === 13 || currentPage.pageNumber === 4 || currentPage.pageNumber === 11 || currentPage.pageNumber === 31 || currentPage.pageNumber === 37 || currentPage.pageNumber === 42 ? 'absolute' : undefined,
                          top: currentPage.pageNumber === 18 ? '35%' : currentPage.pageNumber === 13 ? '62%' : currentPage.pageNumber === 4 ? '20%' : currentPage.pageNumber === 11 ? '30%' : (currentPage.pageNumber === 31 || currentPage.pageNumber === 37 || currentPage.pageNumber === 42) ? '5%' : undefined,
                          left: currentPage.pageNumber === 18 || currentPage.pageNumber === 13 || currentPage.pageNumber === 4 || currentPage.pageNumber === 11 || currentPage.pageNumber === 31 || currentPage.pageNumber === 37 || currentPage.pageNumber === 42 ? 0 : undefined,
                          right: currentPage.pageNumber === 18 || currentPage.pageNumber === 13 || currentPage.pageNumber === 4 || currentPage.pageNumber === 11 || currentPage.pageNumber === 31 || currentPage.pageNumber === 37 || currentPage.pageNumber === 42 ? 0 : undefined,
                          transform: currentPage.pageNumber === 18 ? 'translateY(-50%)' : currentPage.pageNumber === 13 ? 'translateY(-50%)' : (currentPage.pageNumber === 11 || currentPage.pageNumber === 31 || currentPage.pageNumber === 37 || currentPage.pageNumber === 42) ? 'translateY(-15%)' : undefined,
                          zIndex: currentPage.pageNumber === 18 || currentPage.pageNumber === 13 || currentPage.pageNumber === 4 || currentPage.pageNumber === 11 || currentPage.pageNumber === 31 || currentPage.pageNumber === 37 || currentPage.pageNumber === 42 ? 10 : undefined
                        }}
                      >
                        <div 
                          className="bg-gray-50 border border-gray-200 rounded-2xl p-5"
                          style={{
                            width: '100%',
                            maxWidth: '90%',
                            textAlign: 'center',
                            marginTop: currentPage.pageNumber === 13 ? '0' : currentPage.pageNumber === 18 ? '0' : (currentPage.pageNumber === 23 || currentPage.pageNumber === 31 || currentPage.pageNumber === 37 || currentPage.pageNumber === 42) ? '60%' : undefined,
                            transform: currentPage.pageNumber === 13 ? undefined : undefined
                          }}
                        >
                        {loadingText ? (
                          <div className="text-gray-400 text-center">Ładowanie...</div>
                        ) : (
                            <div 
                              className={`${[4, 11, 23, 31, 37, 42].includes(currentPage.pageNumber) && isMobile ? 'text-4xl sm:text-5xl' : 'text-sm sm:text-base'} font-sans text-gray-900 leading-relaxed`}
                              style={{ textAlign: 'center' }}
                            >
                            {overlayText.split('\n\n').filter(p => p.trim()).map((paragraph: string, index: number) => (
                                <p key={index} className={index > 0 ? 'mt-4' : ''} style={{ textAlign: 'center' }}>
                                {paragraph.trim()}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      </div>
                      {/* KONTENER 3: Zdjęcie - kwadratowy (dla strony 23, 18, 31, 37 i 42 na dole) */}
                      {(currentPage.pageNumber === 23 || currentPage.pageNumber === 18 || currentPage.pageNumber === 31 || currentPage.pageNumber === 37 || currentPage.pageNumber === 42) && (
                        <div 
                          className={`overflow-hidden ${(currentPage.pageNumber === 31 || currentPage.pageNumber === 37 || currentPage.pageNumber === 42) ? 'rounded-2xl' : ''}`}
                          style={{
                            position: 'absolute',
                            bottom: currentPage.pageNumber === 42 ? '-10px' : currentPage.pageNumber === 31 ? '-10px' : currentPage.pageNumber === 18 ? '-10px' : (currentPage.pageNumber === 37 ? '-10px' : '-10px'), // Na samym dole dla strony 18, 31 i 42
                            left: 0,
                            right: 0,
                            width: '100%',
                            height: '100vw' // Kwadratowy - szerokość ekranu
                          }}
                        >
                          <Image
                            src={content.imageUrl?.startsWith('/') ? content.imageUrl : `/course/strona ${currentPage.pageNumber}/Foto/${content.imageUrl}`}
                            alt={currentPage.title || `Strona ${currentPage.pageNumber}`}
                            fill
                            className="object-cover object-top"
                            priority={false}
                            sizes="100vw"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    // DESKTOP lub mobile dla innych stron: oryginalny layout z tekstem na zdjęciu
                  <div className="relative w-full h-full">
                    <div 
                      className={`${(currentPage.pageNumber === 45 || currentPage.pageNumber === 46 || currentPage.pageNumber === 47) && isMobile ? "absolute left-0 right-0 bottom-0" : "absolute inset-0"} ${currentPage.pageNumber === 45 && isMobile ? 'overflow-hidden rounded-2xl' : ''}`}
                      style={(currentPage.pageNumber === 45 || currentPage.pageNumber === 46 || currentPage.pageNumber === 47) && isMobile ? { top: currentPage.pageNumber === 45 ? '45%' : currentPage.pageNumber === 46 ? '45%' : currentPage.pageNumber === 47 ? '45%' : '15%' } : undefined}
                    >
                    <Image
                      src={content.imageUrl?.startsWith('/') ? content.imageUrl : `/course/strona ${currentPage.pageNumber}/Foto/${content.imageUrl}`}
                      alt={currentPage.title || `Strona ${currentPage.pageNumber}`}
                      fill
                      className="object-cover"
                        style={
                          currentPage.pageNumber === 12 && isMobile 
                            ? { objectPosition: 'center 35%' } 
                            : undefined
                        }
                      priority={currentPageIndex === 11 || currentPage.pageNumber === 47}
                      sizes="(max-width: 768px) 100vw, 800px"
                    />
                    </div>
                    {/* Tekst nałożony na zdjęcie */}
                    {content.textPosition === 'top-center' ? (
                      <div
                        className="absolute left-1/2 -translate-x-1/2 w-full max-w-3xl px-6 md:px-8 lg:px-12"
                        style={{ top: currentPage.pageNumber === 37 ? '0%' : currentPage.pageNumber === 42 ? '15%' : currentPage.pageNumber === 45 ? '21%' : currentPage.pageNumber === 46 ? '18%' : currentPage.pageNumber === 47 ? '23%' : '15%' }}
                      >
                        {loadingText ? (
                          <div className="text-white text-center">Ładowanie...</div>
                        ) : (
                          <div
                            className={`font-serif text-gray-900 leading-relaxed whitespace-pre-line text-center ${
                              currentPage.pageNumber === 42
                                ? 'text-4xl md:text-5xl lg:text-6xl xl:text-7xl'
                                : currentPage.pageNumber === 45
                                ? 'text-xl md:text-2xl lg:text-3xl bg-gray-50 border border-gray-200 rounded-2xl p-6 md:p-8'
                                : currentPage.pageNumber === 46
                                ? 'text-xl md:text-2xl lg:text-3xl bg-gray-50 border border-gray-200 rounded-2xl p-6 md:p-8'
                                : currentPage.pageNumber === 47
                                ? 'text-xl md:text-2xl lg:text-3xl bg-gray-50 border border-gray-200 rounded-2xl p-6 md:p-8'
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
                        style={{ top: currentPage.pageNumber === 23 ? '20%' : '12%' }}
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
                                ? 'text-xl md:text-2xl lg:text-3xl bg-gray-50 border border-gray-200 rounded-2xl p-6 md:p-8'
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
                          content.textPosition === 'top' ? (currentPage.pageNumber === 12 && isMobile ? 'items-end justify-center' : 'items-start justify-center')
                        : content.textPosition === 'top-left' ? 'items-start justify-center'
                        : content.textPosition === 'top-right' ? 'items-start justify-center'
                        : content.textPosition === 'bottom' ? 'items-end justify-center' 
                        : content.textPosition === 'bottom-left' ? 'items-end justify-center'
                        : content.textPosition === 'bottom-right' ? 'items-end justify-center'
                          : content.textPosition === 'bottom-center' ? 'items-end justify-center'
                        : 'items-center justify-center'
                      } ${
                          content.textPosition === 'top' ? (currentPage.pageNumber === 12 && isMobile ? 'pb-8' : 'pt-8 md:pt-12 lg:pt-16')
                        : content.textPosition === 'top-left' || content.textPosition === 'top-right' ? 'pt-8 md:pt-12 lg:pt-16'
                        : content.textPosition === 'bottom' ? 'pb-8 md:pb-12 lg:pb-16'
                        : content.textPosition === 'bottom-left' || content.textPosition === 'bottom-right' ? 'pb-8 md:pb-12 lg:pb-16'
                        : ''
                      } ${
                        content.textPosition === 'top-left' || content.textPosition === 'top-right' || content.textPosition === 'bottom-left' || content.textPosition === 'bottom-right' 
                          ? 'px-6 md:px-8 lg:px-12' 
                          : 'px-6 md:px-8 lg:px-12'
                        }`}
                        style={
                          currentPage.pageNumber === 4 ? { paddingBottom: '22%' } 
                          : currentPage.pageNumber === 13 ? { top: '-6%' }
                          : currentPage.pageNumber === 18 ? { top: '20%' }
                          : undefined
                        }
                      >
                        {loadingText ? (
                          <div className="text-white">Ładowanie...</div>
                        ) : (
                          <div 
                            className={`${currentPage.pageNumber === 4 ? 'inline-block' : 'w-full'} ${content.textPosition === 'top-left' || content.textPosition === 'top-right' || content.textPosition === 'bottom-left' || content.textPosition === 'bottom-right' ? 'max-w-2xl' : currentPage.pageNumber === 4 ? '' : 'max-w-3xl'}`}
                            style={currentPage.pageNumber === 12 ? { marginLeft: '3%' } : undefined}
                          >
                            <div 
                              className={`${currentPage.pageNumber === 13 ? 'text-sm md:text-base lg:text-lg xl:text-xl' : currentPage.pageNumber === 12 ? 'text-base md:text-lg lg:text-xl xl:text-2xl' : currentPage.pageNumber === 18 && language === 'EN' ? 'text-base md:text-lg lg:text-xl' : currentPage.pageNumber === 18 && (language === 'PL' || language === 'DE') ? 'text-base md:text-lg lg:text-xl xl:text-2xl' : currentPage.pageNumber === 4 ? 'text-2xl md:text-3xl lg:text-4xl xl:text-5xl' : 'text-lg md:text-xl lg:text-2xl xl:text-3xl'} font-serif text-gray-900 leading-relaxed whitespace-pre-line text-center ${currentPage.pageNumber === 4 ? 'bg-transparent border border-gray-200 rounded-2xl px-4 md:px-6 py-4 md:py-5' : (currentPage.pageNumber === 12 || currentPage.pageNumber === 13 || currentPage.pageNumber === 18) ? 'bg-transparent border border-gray-200 rounded-2xl p-6 md:p-8' : ''}`}
                              style={currentPage.pageNumber === 18 ? { marginTop: '20%' } : undefined}
                            >
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
                      <div className={`absolute left-0 right-0 flex gap-2 md:gap-6 px-2 md:px-8 lg:px-12 pb-4 ${isMobile ? 'flex-row' : 'flex-col md:flex-row'}`} style={{ bottom: '0%' }}>
                        <div className="flex-1 text-center bg-gray-50 border border-gray-200 rounded-2xl p-2 md:p-3">
                          <p className={`${isMobile ? 'text-[7px]' : 'text-[9px]'} md:text-[10px] lg:text-xs font-serif text-gray-900`}>
                            {page45Texts.text1}
                          </p>
                        </div>
                        <div className="flex-1 text-center bg-gray-50 border border-gray-200 rounded-2xl p-2 md:p-3" style={{ marginLeft: '7%' }}>
                          <p className={`${isMobile ? 'text-[7px]' : 'text-[9px]'} md:text-[10px] lg:text-xs font-serif text-gray-900`}>
                            {page45Texts.text2}
                          </p>
                        </div>
                        <div className="flex-1 text-center bg-gray-50 border border-gray-200 rounded-2xl p-2 md:p-3" style={{ marginLeft: '7%' }}>
                          <p className={`${isMobile ? 'text-[7px]' : 'text-[9px]'} md:text-[10px] lg:text-xs font-serif text-gray-900`}>
                            {page45Texts.text3}
                          </p>
                        </div>
                      </div>
                    )}
                    {/* 3 kontenery z tekstem na dole dla strony 46 */}
                    {currentPage.pageNumber === 46 && (
                      <div className={`absolute left-0 right-0 flex gap-2 md:gap-6 px-2 md:px-8 lg:px-12 ${isMobile ? 'flex-row' : 'flex-col md:flex-row'}`} style={{ bottom: '7%' }}>
                        <div className="flex-1 text-center bg-gray-50 border border-gray-200 rounded-2xl p-3 md:p-4">
                          <p className={`${isMobile ? 'text-[10px]' : 'text-sm'} md:text-base lg:text-lg font-serif text-gray-900`}>
                            {page46Texts.text1}
                          </p>
                        </div>
                        <div className="flex-1 text-center bg-gray-50 border border-gray-200 rounded-2xl p-3 md:p-4" style={{ marginLeft: '8%' }}>
                          <p className={`${isMobile ? 'text-[10px]' : 'text-sm'} md:text-base lg:text-lg font-serif text-gray-900`}>
                            {page46Texts.text2}
                          </p>
                        </div>
                        <div className="flex-1 text-center bg-gray-50 border border-gray-200 rounded-2xl p-3 md:p-4" style={{ marginLeft: '8%' }}>
                          <p className={`${isMobile ? 'text-[10px]' : 'text-sm'} md:text-base lg:text-lg font-serif text-gray-900`}>
                            {page46Texts.text3}
                          </p>
                        </div>
                      </div>
                    )}
                    {/* 3 kontenery z tekstem na dole dla strony 47 */}
                    {currentPage.pageNumber === 47 && (
                      <div className={`absolute left-0 right-0 flex gap-2 md:gap-6 px-2 md:px-8 lg:px-12 ${isMobile ? 'flex-row' : 'flex-col md:flex-row'}`} style={{ bottom: '5%' }}>
                        <div className="flex-1 text-center bg-gray-50 border border-gray-200 rounded-2xl p-3 md:p-4">
                          <p className={`${isMobile ? 'text-[10px]' : 'text-sm'} md:text-base lg:text-lg font-serif text-gray-900`}>
                            {page47Texts.text1}
                          </p>
                        </div>
                        <div className="flex-1 text-center bg-gray-50 border border-gray-200 rounded-2xl p-3 md:p-4" style={{ marginLeft: '8%' }}>
                          <p className={`${isMobile ? 'text-[10px]' : 'text-sm'} md:text-base lg:text-lg font-serif text-gray-900`}>
                            {page47Texts.text2}
                          </p>
                        </div>
                        <div className="flex-1 text-center bg-gray-50 border border-gray-200 rounded-2xl p-3 md:p-4" style={{ marginLeft: '8%' }}>
                          <p className={`${isMobile ? 'text-[10px]' : 'text-sm'} md:text-base lg:text-lg font-serif text-gray-900`}>
                            {page47Texts.text3}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  )
                ) : isImageOverlayTextWhite ? (
                  // Layout z zdjęciem na cały kontener i białym tekstem z pliku nałożonym na zdjęcie
                  // Strona 26 - na mobile jak strona 2
                  isMobile && currentPage.pageNumber === 26 ? (
                    // MOBILE: Zdjęcie na dole, tekst na górze
                    <div className="relative w-full h-full bg-white" style={{ paddingBottom: '0' }}>
                      {/* Kontener ze zdjęciem na dole */}
                      <div 
                        className="relative w-full overflow-hidden rounded-2xl"
                        style={{
                          position: 'absolute',
                          bottom: '-10px',
                          left: 0,
                          right: 0,
                          width: '100%',
                          height: '100vw',
                          aspectRatio: '1/1',
                          zIndex: 0
                        }}
                      >
                        <Image
                          src={content.imageUrl?.startsWith('/') ? content.imageUrl : `/course/strona ${currentPage.pageNumber}/Foto/${content.imageUrl}`}
                          alt={currentPage.title || `Strona ${currentPage.pageNumber}`}
                          fill
                          className="object-cover object-top"
                          priority={false}
                          sizes="100vw"
                        />
                      </div>
                      {/* Tekst na górze */}
                      <div 
                        className="absolute inset-0 flex items-start justify-center px-4 pt-8"
                        style={{
                          top: '15%',
                          zIndex: 10
                        }}
                      >
                        <div className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-2xl p-5">
                        {loadingText ? (
                          <div className="text-gray-400 text-center">Ładowanie...</div>
                        ) : (
                          <div className={`${currentPage.pageNumber === 26 && isMobile ? 'text-4xl sm:text-5xl' : 'text-sm sm:text-base'} font-sans text-gray-900 leading-relaxed text-center px-2`}>
                            {overlayText.split('\n\n').filter(p => p.trim()).map((paragraph: string, index: number) => (
                              <p key={index} className={index > 0 ? 'mt-4' : ''}>
                                {paragraph.trim()}
                              </p>
                            ))}
                          </div>
                        )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // DESKTOP lub inne strony: oryginalny layout
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
                  )
                ) : isWhiteHeaderImage ? (
                  // Layout z białym tłem, tekstem na górze i zdjęciem 70%
                  <div className="relative w-full h-full bg-white flex flex-col items-center justify-center">
                    <div className={`flex-none w-full bg-white flex items-center justify-center px-6 md:px-8 lg:px-12 py-6 ${currentPage.pageNumber === 33 ? '' : ''}`} style={currentPage.pageNumber === 33 ? { marginTop: '20%' } : undefined}>
                      {loadingText ? (
                        <div className="text-gray-600">Ładowanie...</div>
                      ) : (
                        <div className="w-full max-w-4xl mx-auto">
                          <div className={`text-base md:text-lg lg:text-xl xl:text-2xl font-serif text-gray-900 leading-relaxed whitespace-pre-line text-center ${currentPage.pageNumber === 33 ? 'bg-transparent border border-gray-200 rounded-2xl p-6 md:p-8' : ''}`}>
                            {overlayText.split('\n\n').filter(p => p.trim()).map((paragraph: string, index: number) => (
                              <p key={index} className={index > 0 ? 'mt-4' : ''}>
                                {paragraph.trim()}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-none aspect-square relative mx-auto w-[70%]" style={{ minHeight: '400px', marginTop: currentPage.pageNumber === 33 ? '20%' : undefined }}>
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
                  <div className={`relative w-full h-full ${[7, 14, 15, 16, 19, 20, 25, 28, 29, 34, 35, 39, 40].includes(currentPage.pageNumber) ? '' : 'bg-black'} ${(currentPage.pageNumber === 14 || currentPage.pageNumber === 34 || currentPage.pageNumber === 39) ? '' : `flex flex-col items-center ${(currentPage.pageNumber === 19 || currentPage.pageNumber === 25) ? 'justify-end' : 'justify-center'}`}`} style={[7, 14, 15, 16, 19, 20, 25, 28, 29, 34, 35, 39, 40].includes(currentPage.pageNumber) ? { background: '#1a1a1a' } : {}}>
                    {/* Czarne tło z białym tekstem na górze */}
                    <div 
                      className={`flex-none w-full flex items-center justify-center px-6 md:px-8 lg:px-12 ${[7, 14, 15, 16, 19, 20, 25, 28, 29, 34, 35, 39, 40].includes(currentPage.pageNumber) ? '' : 'bg-black'}`}
                      style={{ 
                        ...([7, 14, 15, 16, 19, 20, 25, 28, 29, 34, 35, 39, 40].includes(currentPage.pageNumber) ? { background: '#1a1a1a' } : {}),
                        paddingTop: currentPage.pageNumber === 25 ? '40px' 
                          : (currentPage.pageNumber === 14 || currentPage.pageNumber === 19) ? '24px' 
                          : '24px', 
                        paddingBottom: (currentPage.pageNumber === 14 || currentPage.pageNumber === 19) ? '16px' 
                          : currentPage.pageNumber === 39 && isMobile ? '48px' 
                          : '24px',
                        marginTop: currentPage.pageNumber === 39 && isMobile ? '-3%' 
                          : currentPage.pageNumber === 14 ? '0' 
                          : '0',
                        position: currentPage.pageNumber === 14 ? 'absolute' : undefined,
                        top: currentPage.pageNumber === 14 ? '25%' : undefined,
                        left: currentPage.pageNumber === 14 ? 0 : undefined,
                        right: currentPage.pageNumber === 14 ? 0 : undefined,
                        transform: currentPage.pageNumber === 14 ? 'translateY(-50%)' : undefined,
                        zIndex: currentPage.pageNumber === 14 ? 1 : undefined
                      }}
                    >
                      {loadingText ? (
                        <div className="text-white">Ładowanie...</div>
                      ) : (
                        <div className="w-full max-w-4xl mx-auto">
                          <div 
                            className={`${currentPage.pageNumber === 25 ? 'text-sm md:text-base lg:text-lg xl:text-xl' : 'text-base md:text-lg lg:text-xl xl:text-2xl'} font-serif text-white leading-relaxed whitespace-pre-line text-center ${currentPage.pageNumber === 14 ? 'bg-transparent border border-gray-200 rounded-2xl p-6 md:p-8' : currentPage.pageNumber === 19 ? 'bg-transparent border border-gray-200 rounded-2xl px-6 md:px-8' : (currentPage.pageNumber === 25 || currentPage.pageNumber === 28 || currentPage.pageNumber === 34 || currentPage.pageNumber === 39) ? 'bg-transparent border border-white rounded-2xl' : ''}`}
                            style={currentPage.pageNumber === 19 ? { paddingTop: '1.1875rem', paddingBottom: '1.1875rem', marginTop: '14%' } : (currentPage.pageNumber === 25 || currentPage.pageNumber === 28 || currentPage.pageNumber === 34 || currentPage.pageNumber === 39) ? { 
                              paddingTop: '0.75rem', 
                              paddingBottom: '0.75rem', 
                              paddingLeft: '1.5rem', 
                              paddingRight: '1.5rem', 
                              marginTop: currentPage.pageNumber === 25 ? (language === 'DE' ? '10%' : '8%') : currentPage.pageNumber === 34 ? '25%' : currentPage.pageNumber === 39 ? '8%' : undefined
                            } : undefined}
                          >
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
                    <div 
                      className={`flex-none ${currentPage.pageNumber === 39 ? 'aspect-[3/4]' : (currentPage.pageNumber === 28 ? '' : 'aspect-square')} relative overflow-hidden rounded-2xl ${(currentPage.pageNumber === 14 || currentPage.pageNumber === 19 || currentPage.pageNumber === 25 || currentPage.pageNumber === 28 || currentPage.pageNumber === 34 || currentPage.pageNumber === 39) ? 'w-full' : 'w-[70%] mx-auto'}`}
                      style={{ 
                        minHeight: (currentPage.pageNumber === 19 || currentPage.pageNumber === 25) ? '350px' : (currentPage.pageNumber === 14 ? undefined : '400px'),
                        height: (currentPage.pageNumber === 14 || currentPage.pageNumber === 28 || currentPage.pageNumber === 34) ? '100vw' : (currentPage.pageNumber === 39 ? 'calc(100vw * 4 / 3)' : undefined),
                        paddingTop: currentPage.pageNumber === 39 && isMobile ? '5%' : '0',
                        marginTop: (currentPage.pageNumber === 19 || currentPage.pageNumber === 25) ? 'auto' : undefined,
                        position: (currentPage.pageNumber === 14 || currentPage.pageNumber === 34 || currentPage.pageNumber === 39) ? 'absolute' : undefined,
                        bottom: currentPage.pageNumber === 34 ? '-35px' : currentPage.pageNumber === 39 ? '-30px' : currentPage.pageNumber === 14 ? '-10px' : undefined,
                        left: (currentPage.pageNumber === 14 || currentPage.pageNumber === 34 || currentPage.pageNumber === 39) ? 0 : undefined,
                        right: (currentPage.pageNumber === 14 || currentPage.pageNumber === 34 || currentPage.pageNumber === 39) ? 0 : undefined,
                        width: (currentPage.pageNumber === 14 || currentPage.pageNumber === 28 || currentPage.pageNumber === 34 || currentPage.pageNumber === 39) ? '100%' : undefined,
                        borderRadius: currentPage.pageNumber === 28 ? '1rem' : undefined,
                        borderTopLeftRadius: currentPage.pageNumber === 28 ? '1rem' : undefined,
                        borderTopRightRadius: currentPage.pageNumber === 28 ? '1rem' : undefined,
                        borderBottomLeftRadius: currentPage.pageNumber === 28 ? '1rem' : undefined,
                        borderBottomRightRadius: currentPage.pageNumber === 28 ? '1rem' : undefined
                      }}
                    >
                      <Image
                        src={content.imageUrl?.startsWith('/') ? content.imageUrl : `/course/strona ${currentPage.pageNumber}/Foto/${content.imageUrl}`}
                        alt={currentPage.title || `Strona ${currentPage.pageNumber}`}
                        fill
                        className={currentPage.pageNumber === 28 ? 'object-cover rounded-2xl' : 'object-contain'}
                        style={currentPage.pageNumber === 28 ? { borderRadius: '1rem' } : undefined}
                        priority={currentPageIndex === 13 || currentPageIndex === 18}
                        sizes={(currentPage.pageNumber === 14 || currentPage.pageNumber === 19 || currentPage.pageNumber === 25 || currentPage.pageNumber === 28 || currentPage.pageNumber === 34 || currentPage.pageNumber === 39) ? "100vw" : "(max-width: 768px) 70vw, 560px"}
                      />
                    </div>
                  </div>
                ) : isTwoImagesContainer ? (
                  // Layout z białym tłem, tekstem na górze i dwoma kontenerami na zdjęcia (70% powierzchni)
                  <div className="relative w-full h-full bg-white flex flex-col items-center justify-center">
                    {/* Tekst przesunięty 20% w dół */}
                    <div 
                      className="flex-1 flex justify-center px-6 md:px-8 lg:px-12 w-full items-start pt-24"
                      style={currentPage.pageNumber === 24 ? { marginTop: '14%' } : undefined}
                    >
                      <div className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-serif text-gray-900 leading-relaxed text-center whitespace-pre-line bg-transparent border border-gray-200 rounded-2xl p-6 md:p-8">
                        {overlayText || content.text}
                      </div>
                    </div>
                    {/* Kontener na dwa zdjęcia - większy (zdjęcia lekko w górę) */}
                    <div className={`flex-none flex items-start justify-center ${currentPage.pageNumber === 24 ? 'gap-0 px-0' : 'gap-4 px-6 md:px-8 lg:px-12'} pb-4 w-full`} style={{ flex: '1.2', marginTop: currentPage.pageNumber === 24 ? '7%' : undefined, marginLeft: currentPage.pageNumber === 24 ? '0%' : undefined }}>
                      <div 
                        className={`flex ${currentPage.pageNumber === 24 ? 'gap-0 w-full' : 'gap-4 mx-auto'}`}
                        style={{ 
                          width: currentPage.pageNumber === 24 ? '100%' : '95%',
                          aspectRatio: currentPage.pageNumber === 24 ? undefined : '2 / 1'
                        }}
                      >
                        {/* Kontener na pierwsze zdjęcie */}
                          <div 
                            className="flex-1 relative aspect-square overflow-hidden"
                            style={currentPage.pageNumber === 24 ? { 
                              borderTopLeftRadius: '24px', 
                              borderBottomLeftRadius: '24px' 
                            } : undefined}
                          >
                          <Image
                            src={content.image1Url?.startsWith('/') ? content.image1Url : `/course/strona ${currentPage.pageNumber}/Foto/${content.image1Url}`}
                            alt="Zdjęcie 24-1"
                            fill
                            className="object-contain"
                            priority={currentPageIndex === 23}
                            sizes={currentPage.pageNumber === 24 ? "50vw" : "(max-width: 768px) 35vw, 280px"}
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
                        <div 
                          className="flex-1 relative aspect-square overflow-hidden"
                          style={currentPage.pageNumber === 24 ? { 
                            borderTopRightRadius: '24px', 
                            borderBottomRightRadius: '24px' 
                          } : undefined}
                        >
                          <Image
                            src={content.image2Url?.startsWith('/') ? content.image2Url : `/course/strona ${currentPage.pageNumber}/Foto/${content.image2Url}`}
                            alt="Zdjęcie 24-2"
                            fill
                            className="object-contain"
                            priority={currentPageIndex === 23}
                            sizes={currentPage.pageNumber === 24 ? "50vw" : "(max-width: 768px) 35vw, 280px"}
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
                      style={{ 
                        paddingTop: currentPage.pageNumber === 32 && isMobile ? '28%' : (currentPage.pageNumber === 38 && isMobile ? '28%' : '8%'),
                        marginTop: currentPage.pageNumber === 38 ? '2%' : undefined
                      }}
                    >
                      {loadingText ? (
                        <div className="text-gray-400 text-center">Ładowanie...</div>
                      ) : (
                        <div className={`text-lg md:text-xl lg:text-2xl xl:text-3xl font-serif text-gray-900 leading-relaxed whitespace-pre-line text-center ${currentPage.pageNumber === 27 ? 'bg-transparent border border-gray-200 rounded-2xl p-6 md:p-8' : currentPage.pageNumber === 32 ? 'bg-transparent border border-gray-200 rounded-2xl p-6 md:p-8' : currentPage.pageNumber === 38 ? 'bg-gray-50 border border-gray-200 rounded-2xl p-6 md:p-8' : ''}`}>
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
                        {/* Strzałka lewa - przy krawędzi kontenera, nachodzi na zdjęcie - tylko desktop */}
                        {content.iconUrl && !isMobile && (
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
                        {/* Strzałka prawa - przy krawędzi kontenera, nachodzi na zdjęcie - tylko desktop */}
                        {content.iconUrlRight && !isMobile && (
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
                        <div className="flex gap-4 w-full max-w-[600px]" style={{ marginTop: isMobile ? '60%' : '30%' }}>
                          {/* Lewa kolumna - flat lay */}
                          <div className="flex-1 flex flex-col items-center relative">
                            <span className="text-xl md:text-2xl font-serif text-black absolute bg-transparent border border-gray-200 rounded-2xl px-3 py-1" style={{ top: '-50%' }}>{page32Labels.label1 || '- flat lay'}</span>
                            <div className={`relative w-full ${currentPage.pageNumber === 32 && isMobile ? 'aspect-[4/5] overflow-hidden rounded-l-2xl' : 'aspect-square'}`} style={{ transform: isMobile ? 'scale(1.15)' : undefined }}>
                              <Image
                                src={content.image1Url?.startsWith('/') ? content.image1Url : `/course/strona ${currentPage.pageNumber}/Foto/${content.image1Url}`}
                                alt="Flat lay"
                                fill
                                className={currentPage.pageNumber === 32 && isMobile ? "object-cover rounded-l-2xl" : "object-contain"}
                                priority
                                sizes="(max-width: 768px) 45vw, 300px"
                              />
                            </div>
                          </div>
                          {/* Prawa kolumna - 45 stopni */}
                          <div className="flex-1 flex flex-col items-center relative">
                            <span className="text-xl md:text-2xl font-serif text-black absolute bg-transparent border border-gray-200 rounded-2xl px-3 py-1" style={{ top: '-50%' }}>{page32Labels.label2 || '- 45 stopni'}</span>
                            <div className={`relative w-full ${currentPage.pageNumber === 32 && isMobile ? 'aspect-[4/5] overflow-hidden rounded-r-2xl' : 'aspect-square'}`} style={{ transform: isMobile ? 'scale(1.15)' : undefined }}>
                              <Image
                                src={content.image2Url?.startsWith('/') ? content.image2Url : `/course/strona ${currentPage.pageNumber}/Foto/${content.image2Url}`}
                                alt="45 stopni"
                                fill
                                className={currentPage.pageNumber === 32 && isMobile ? "object-cover rounded-r-2xl" : "object-contain"}
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
                      <div 
                          className={`flex-1 flex items-center justify-center pb-8 w-full ${currentPage.pageNumber === 38 && isMobile ? 'px-0' : 'gap-4 px-6 md:px-8 lg:px-12'}`}
                        style={{ 
                            paddingTop: currentPage.pageNumber === 38 && isMobile ? '15%' : '0%',
                            marginTop: currentPage.pageNumber === 38 ? '5%' : currentPage.pageNumber === 27 ? '8%' : undefined,
                            gap: currentPage.pageNumber === 38 && isMobile ? 0 : undefined
                        }}
                      >
                          <div 
                            className={`${currentPage.pageNumber === 27 ? 'flex flex-col' : currentPage.pageNumber === 38 && isMobile ? '' : 'flex'} ${currentPage.pageNumber === 38 && isMobile ? '' : currentPage.pageNumber === 27 ? '' : 'gap-4'} w-full ${currentPage.pageNumber === 27 ? 'max-w-[75%]' : (currentPage.pageNumber === 38 && isMobile ? 'max-w-full' : 'max-w-[90%]')}`}
                            style={currentPage.pageNumber === 38 && isMobile ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 } : (currentPage.pageNumber === 27 && isMobile ? { gap: '5%' } : undefined)}
                          >
                        <div className={`${currentPage.pageNumber === 27 ? 'w-full' : currentPage.pageNumber === 38 && isMobile ? 'w-full' : 'flex-1'} relative ${(currentPage.pageNumber === 27 && isMobile) ? 'aspect-[1800/2230] overflow-hidden rounded-2xl' : (currentPage.pageNumber === 38 && isMobile ? 'aspect-square overflow-hidden rounded-l-2xl' : 'aspect-square')}`} style={currentPage.pageNumber === 38 && isMobile ? { transform: 'scale(1.00)', margin: 0, padding: 0 } : undefined}>
                          <Image
                            src={content.image1Url?.startsWith('/') ? content.image1Url : `/course/strona ${currentPage.pageNumber}/Foto/${content.image1Url}`}
                                alt="Zdjęcie 1"
                            fill
                            className={(currentPage.pageNumber === 27 && isMobile) ? "object-cover rounded-2xl" : (currentPage.pageNumber === 38 && isMobile ? "object-cover rounded-l-2xl" : "object-contain")}
                            sizes={currentPage.pageNumber === 38 && isMobile ? "50vw" : "(max-width: 768px) 35vw, 280px"}
                          />
                            </div>
                        <div className={`${currentPage.pageNumber === 27 ? 'w-full' : currentPage.pageNumber === 38 && isMobile ? 'w-full' : 'flex-1'} relative ${(currentPage.pageNumber === 27 && isMobile) ? 'aspect-[2250/1670] overflow-hidden rounded-2xl' : (currentPage.pageNumber === 38 && isMobile ? 'aspect-square overflow-hidden rounded-r-2xl' : 'aspect-square')}`} style={currentPage.pageNumber === 38 && isMobile ? { transform: 'scale(1.00)', margin: 0, padding: 0 } : undefined}>
                          <Image
                            src={content.image2Url?.startsWith('/') ? content.image2Url : `/course/strona ${currentPage.pageNumber}/Foto/${content.image2Url}`}
                                alt="Zdjęcie 2"
                            fill
                            className={(currentPage.pageNumber === 27 && isMobile) ? "object-cover rounded-2xl" : (currentPage.pageNumber === 38 && isMobile ? "object-cover rounded-r-2xl" : "object-contain")}
                            sizes={currentPage.pageNumber === 38 && isMobile ? "50vw" : "(max-width: 768px) 35vw, 280px"}
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
                      {/* Tekst pod zdjęciem - przesunięty w górę */}
                      <div className="flex-1 px-4 pb-6 bg-white flex items-start justify-center" style={{ paddingTop: '39%' }}>
                        <div className="w-full max-w-md bg-transparent border border-gray-200 rounded-2xl p-5">
                          {loadingText ? (
                            <div className="text-gray-400 text-center">Ładowanie...</div>
                          ) : (
                            <div className="text-sm sm:text-base font-sans text-gray-900 leading-relaxed text-center">
                              {overlayText.split('\n\n').filter(p => p.trim()).map((paragraph: string, index: number) => (
                                <p key={index} className={index > 0 ? 'mt-4' : ''}>
                                  {paragraph.trim()}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
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
                          <div className="bg-transparent border border-gray-200 rounded-2xl p-6 md:p-8">
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
                  <div 
                    className="relative w-full h-full flex justify-center p-8 bg-white overflow-y-auto"
                    style={{
                      alignItems: currentPage.pageNumber === 51 && language === 'DE' ? 'flex-start' : 'center',
                      paddingTop: currentPage.pageNumber === 51 && language === 'DE' ? 'calc(2rem + 20%)' : '2rem'
                    }}
                  >
                    {loadingText ? (
                      <div className="text-gray-400">Ładowanie...</div>
                    ) : (
                      <div className="w-full flex items-center justify-center">
                        <div className="text-center max-w-4xl bg-gray-50 border border-gray-200 rounded-2xl p-6 md:p-8">
                          <div className="text-3xl md:text-5xl lg:text-6xl font-bold font-serif text-gray-900 leading-relaxed whitespace-pre-line">
                            {(overlayText || '').trim()}
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
                      <button
                        onClick={() => {
                          setLanguage('EN')
                          setShowLanguageMenu(false)
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                          language === 'EN' 
                            ? 'text-cyan-400 bg-cyan-500/10' 
                            : 'text-gray-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span>🇺🇸</span>
                        <span>English</span>
                        {language === 'EN' && (
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

      {/* Mobile: Instagram-style progress bar + menu button */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50" style={{ background: '#1a1a1a', height: '80px', padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', borderTop: 'none' }}>
        {/* System oznaczania stron - na całą szerokość, max 20px wysokości */}
        <div 
          className="w-full flex items-center justify-between px-2"
          style={{ 
            height: '20px',
            maxHeight: '20px',
            background: '#1a1a1a'
          }}
        >
          {/* Kropki postępu */}
          <div 
            ref={pageIndicatorRef}
            className="w-full flex items-center justify-between relative"
            onTouchStart={(e) => {
              if (!pageIndicatorRef.current) return
              const touch = e.touches[0]
              const rect = pageIndicatorRef.current.getBoundingClientRect()
              const x = touch.clientX - rect.left
              const width = rect.width
              const pageIndex = Math.round((x / width) * (pages.length - 1))
              if (pageIndex >= 0 && pageIndex < pages.length) {
                setIsDraggingPage(true)
                setCurrentPageIndex(pageIndex)
              }
            }}
            onTouchMove={(e) => {
              if (!isDraggingPage || !pageIndicatorRef.current) return
              e.preventDefault()
              const touch = e.touches[0]
              const rect = pageIndicatorRef.current.getBoundingClientRect()
              const x = touch.clientX - rect.left
              const width = rect.width
              const pageIndex = Math.max(0, Math.min(pages.length - 1, Math.round((x / width) * (pages.length - 1))))
              if (pageIndex !== currentPageIndex) {
                setCurrentPageIndex(pageIndex)
              }
            }}
            onTouchEnd={() => {
              setIsDraggingPage(false)
            }}
          >
            {pages.map((page: any, idx: number) => (
              idx === currentPageIndex ? (
                <span 
              key={idx}
                  className="text-white font-medium leading-none"
                  style={{ fontSize: '10px', textAlign: 'center' }}
                >
                  {page.pageNumber}
                </span>
              ) : (
                <div
                  key={idx}
                  className={`rounded-full transition-all duration-300 ${
                    idx < currentPageIndex 
                      ? 'bg-white/60' 
                      : 'bg-white/30'
                  }`}
                  style={{ width: '3px', height: '3px' }}
                />
              )
            ))}
          </div>
        </div>
        
        {/* Menu button - kontener z strzałka.png */}
        <div className="flex justify-center items-center" style={{ marginTop: '-2px' }}>
        <button
          onClick={() => setShowMobileMenu(true)}
            className="relative w-[40px] h-[40px] rounded-[10px] overflow-hidden transition-all duration-150 active:scale-[0.95] active:translate-y-1"
            style={{ 
              boxShadow: '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)',
              padding: 0,
              border: 'none',
              backgroundImage: 'url(/course/ikony/strzałka.png)',
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.boxShadow = 'inset 0 2px 10px rgba(0, 0, 0, 0.3), -5px 5px 20px rgba(150, 150, 150, 0.3), -10px 10px 40px rgba(120, 120, 120, 0.2)'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.boxShadow = '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)'
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.boxShadow = 'inset 0 2px 10px rgba(0, 0, 0, 0.3), -5px 5px 20px rgba(150, 150, 150, 0.3), -10px 10px 40px rgba(120, 120, 120, 0.2)'
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.boxShadow = '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)'
            }}
          />
        </div>
      </div>

      {/* Mobile: Functions modal */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)}>
          <div 
            className="fixed inset-0 p-4 overflow-hidden flex flex-col"
            style={{ background: '#1a1a1a' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-auto pt-4">
              <h3 className="text-white font-medium">Menu</h3>
        </div>

            {/* Zawartość menu - zawsze widoczne */}
            <div className="flex-1 overflow-auto mt-4" style={{ paddingBottom: '100px' }}>
              {menuActivePanel === 'gallery' && (
                <ProgressGallery onProgressUpdate={setCompletedPages} />
              )}
              {menuActivePanel === 'dictionary' && (
                <div className="w-full h-full p-4 bg-gray-800 rounded-xl overflow-auto">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">{t.dictionary.title}</h3>
                  <DictionaryInline />
                </div>
              )}
              {menuActivePanel === 'chat' && (
                <div className="w-full h-full p-4 bg-gray-800 rounded-xl overflow-auto">
                  <ChatBox />
                </div>
              )}
              {menuActivePanel === 'video' && currentPage && (
                <VideoPlayer pageNumber={currentPage.pageNumber} />
              )}
      </div>

            {/* Pasek dolny z przyciskami - fixed na dole */}
            <div className="fixed bottom-0 left-0 right-0 flex justify-around items-center gap-2 p-4" style={{ background: '#1a1a1a', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
              {/* Star - Twoje postępy */}
              <button
                onClick={() => setMenuActivePanel('gallery')}
                className="relative w-[40px] h-[40px] rounded-[10px] overflow-hidden transition-all duration-150 active:scale-[0.95] active:translate-y-1"
                style={{ 
                  boxShadow: '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)',
                  padding: 0,
                  border: 'none',
                  backgroundImage: 'url(/course/ikony/Star.png)',
                  backgroundSize: '100% 100%',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.boxShadow = 'inset 0 2px 10px rgba(0, 0, 0, 0.3), -5px 5px 20px rgba(150, 150, 150, 0.3), -10px 10px 40px rgba(120, 120, 120, 0.2)'
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.boxShadow = '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)'
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.boxShadow = 'inset 0 2px 10px rgba(0, 0, 0, 0.3), -5px 5px 20px rgba(150, 150, 150, 0.3), -10px 10px 40px rgba(120, 120, 120, 0.2)'
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.boxShadow = '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)'
                }}
              />
              
              {/* Chat */}
              <button
                onClick={() => setMenuActivePanel('chat')}
                className="relative w-[40px] h-[40px] rounded-[10px] overflow-hidden transition-all duration-150 active:scale-[0.95] active:translate-y-1"
                style={{ 
                  boxShadow: '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)',
                  padding: 0,
                  border: 'none',
                  backgroundImage: 'url(/course/ikony/Chat.png)',
                  backgroundSize: '100% 100%',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.boxShadow = 'inset 0 2px 10px rgba(0, 0, 0, 0.3), -5px 5px 20px rgba(150, 150, 150, 0.3), -10px 10px 40px rgba(120, 120, 120, 0.2)'
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.boxShadow = '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)'
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.boxShadow = 'inset 0 2px 10px rgba(0, 0, 0, 0.3), -5px 5px 20px rgba(150, 150, 150, 0.3), -10px 10px 40px rgba(120, 120, 120, 0.2)'
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.boxShadow = '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)'
                }}
              />
              
              {/* Video */}
              <button
                onClick={() => setMenuActivePanel('video')}
                className="relative w-[40px] h-[40px] rounded-[10px] overflow-hidden transition-all duration-150 active:scale-[0.95] active:translate-y-1"
                style={{ 
                  boxShadow: '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)',
                  padding: 0,
                  border: 'none',
                  backgroundImage: 'url(/course/ikony/Video.png)',
                  backgroundSize: '100% 100%',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.boxShadow = 'inset 0 2px 10px rgba(0, 0, 0, 0.3), -5px 5px 20px rgba(150, 150, 150, 0.3), -10px 10px 40px rgba(120, 120, 120, 0.2)'
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.boxShadow = '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)'
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.boxShadow = 'inset 0 2px 10px rgba(0, 0, 0, 0.3), -5px 5px 20px rgba(150, 150, 150, 0.3), -10px 10px 40px rgba(120, 120, 120, 0.2)'
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.boxShadow = '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)'
                }}
              />
              
              {/* Info - Słownik fotografa */}
              <button
                onClick={() => setMenuActivePanel('dictionary')}
                className="relative w-[40px] h-[40px] rounded-[10px] overflow-hidden transition-all duration-150 active:scale-[0.95] active:translate-y-1"
                style={{ 
                  boxShadow: '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)',
                  padding: 0,
                  border: 'none',
                  backgroundImage: 'url(/course/ikony/Info.png)',
                  backgroundSize: '100% 100%',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.boxShadow = 'inset 0 2px 10px rgba(0, 0, 0, 0.3), -5px 5px 20px rgba(150, 150, 150, 0.3), -10px 10px 40px rgba(120, 120, 120, 0.2)'
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.boxShadow = '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)'
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.boxShadow = 'inset 0 2px 10px rgba(0, 0, 0, 0.3), -5px 5px 20px rgba(150, 150, 150, 0.3), -10px 10px 40px rgba(120, 120, 120, 0.2)'
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.boxShadow = '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)'
                }}
              />
              
              {/* cofnij - zamyka menu */}
              <button
                onClick={() => setShowMobileMenu(false)}
                className="relative w-[40px] h-[40px] rounded-[10px] overflow-hidden transition-all duration-150 active:scale-[0.95] active:translate-y-1"
                style={{ 
                  boxShadow: '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)',
                  padding: 0,
                  border: 'none',
                  backgroundImage: 'url(/course/ikony/cofnij.png)',
                  backgroundSize: '100% 100%',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.boxShadow = 'inset 0 2px 10px rgba(0, 0, 0, 0.3), -5px 5px 20px rgba(150, 150, 150, 0.3), -10px 10px 40px rgba(120, 120, 120, 0.2)'
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.boxShadow = '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)'
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.boxShadow = 'inset 0 2px 10px rgba(0, 0, 0, 0.3), -5px 5px 20px rgba(150, 150, 150, 0.3), -10px 10px 40px rgba(120, 120, 120, 0.2)'
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.boxShadow = '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)'
                }}
              />
              
              {/* ustawienia - zmiana języka */}
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="relative w-[40px] h-[40px] rounded-[10px] overflow-hidden transition-all duration-150 active:scale-[0.95] active:translate-y-1"
                style={{ 
                  boxShadow: '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)',
                  padding: 0,
                  border: 'none',
                  backgroundImage: 'url(/course/ikony/ustawienia.png)',
                  backgroundSize: '100% 100%',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.boxShadow = 'inset 0 2px 10px rgba(0, 0, 0, 0.3), -5px 5px 20px rgba(150, 150, 150, 0.3), -10px 10px 40px rgba(120, 120, 120, 0.2)'
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.boxShadow = '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)'
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.boxShadow = 'inset 0 2px 10px rgba(0, 0, 0, 0.3), -5px 5px 20px rgba(150, 150, 150, 0.3), -10px 10px 40px rgba(120, 120, 120, 0.2)'
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.boxShadow = '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)'
                }}
              />
              
              {/* Logout - wylogowanie konta */}
              <button
                onClick={handleLogout}
                className="relative w-[40px] h-[40px] rounded-[10px] overflow-hidden transition-all duration-150 active:scale-[0.95] active:translate-y-1"
                style={{ 
                  boxShadow: '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)',
                  padding: 0,
                  border: 'none',
                  backgroundImage: 'url(/course/ikony/Logout.png)',
                  backgroundSize: '100% 100%',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.boxShadow = 'inset 0 2px 10px rgba(0, 0, 0, 0.3), -5px 5px 20px rgba(150, 150, 150, 0.3), -10px 10px 40px rgba(120, 120, 120, 0.2)'
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.boxShadow = '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)'
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.boxShadow = 'inset 0 2px 10px rgba(0, 0, 0, 0.3), -5px 5px 20px rgba(150, 150, 150, 0.3), -10px 10px 40px rgba(120, 120, 120, 0.2)'
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.boxShadow = '-10px 10px 30px rgba(150, 150, 150, 0.5), -15px 15px 50px rgba(120, 120, 120, 0.3), 3px -3px 20px rgba(150, 150, 150, 0.2)'
                }}
              />
            </div>
            
            {/* Menu wyboru języka */}
            {showLanguageMenu && (
              <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 py-2 w-36 bg-gray-800 rounded-lg shadow-2xl z-50">
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
              <button
                  onClick={() => {
                    setLanguage('EN')
                    setShowLanguageMenu(false)
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                    language === 'EN' 
                      ? 'text-cyan-400 bg-cyan-500/10' 
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>🇬🇧</span>
                  <span>English</span>
                  {language === 'EN' && (
                    <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                  )}
              </button>
            </div>
              )}
            
                </div>
        </div>
      )}
    </div>
  )
}




