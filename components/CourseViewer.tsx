'use client'

import { useState, useEffect } from 'react'
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
import { MOCK_COURSE } from '@/lib/mock-data'

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
  const [course, setCourse] = useState<any>(null)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activePanel, setActivePanel] = useState<'gallery' | 'dictionary' | 'chat'>('gallery')
  const [overlayText, setOverlayText] = useState<string>('')
  const [loadingText, setLoadingText] = useState(false)
  const [completedPages, setCompletedPages] = useState<number[]>([])
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionDirection, setTransitionDirection] = useState<'up' | 'down' | null>(null)
  const [animationClass, setAnimationClass] = useState<string>('')
  const [fileTips, setFileTips] = useState<string[]>([])
  const [currentLang] = useState('PL') // Obecny język - można rozbudować o przełącznik

  // Funkcja wylogowania
  const handleLogout = () => {
    localStorage.removeItem('token')
    router.replace('/login')
  }

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
        setTransitionDirection('down')
        setIsTransitioning(true)
        setAnimationClass('course-container-slide-out-down')
        setTimeout(() => {
          setCurrentPageIndex(currentPageIndex - 1)
          setAnimationClass('course-container-slide-in-down')
          setTimeout(() => {
            setIsTransitioning(false)
            setTransitionDirection(null)
            setAnimationClass('')
          }, 800)
        }, 800)
      } else if (e.key === 'ArrowRight' && currentPageIndex < pages.length - 1) {
        setTransitionDirection('up')
        setIsTransitioning(true)
        setAnimationClass('course-container-slide-out-up')
        setTimeout(() => {
          setCurrentPageIndex(currentPageIndex + 1)
          setAnimationClass('course-container-slide-in-up')
          setTimeout(() => {
            setIsTransitioning(false)
            setTransitionDirection(null)
            setAnimationClass('')
          }, 800)
        }, 800)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentPageIndex, course, isTransitioning, transitionDirection, animationClass])

  // Wczytaj tekst z pliku dla strony z overlay lub quote-text
  useEffect(() => {
    if (!course) return
    
    const pages = course.pages || []
    const currentPage = pages[currentPageIndex]
    if (!currentPage) return

    const pageContent = parseContent(currentPage.content)
    if ((pageContent?.type === 'image-overlay' || pageContent?.type === 'quote-text' || pageContent?.type === 'image-overlay-text-top' || pageContent?.type === 'text-image-split' || pageContent?.type === 'formatted-text' || pageContent?.type === 'image-overlay-text-file' || pageContent?.type === 'image-overlay-text-white' || pageContent?.type === 'black-header-image' || pageContent?.type === 'white-header-image' || pageContent?.type === 'two-images-top-text' || pageContent?.type === 'three-images-top-text' || pageContent?.type === 'dictionary' || pageContent?.type === 'simple-text') && pageContent?.textFile) {
      setLoadingText(true)
      fetch(pageContent.textFile)
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
  }, [currentPageIndex, course])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Ładowanie kursu...</div>
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

  const nextPage = () => {
    if (currentPageIndex < pages.length - 1 && !isTransitioning) {
      setTransitionDirection('up')
      setIsTransitioning(true)
      setAnimationClass('course-container-slide-out-up')
      setTimeout(() => {
        setCurrentPageIndex(currentPageIndex + 1)
        setAnimationClass('course-container-slide-in-up')
        setTimeout(() => {
          setIsTransitioning(false)
          setTransitionDirection(null)
          setAnimationClass('')
        }, 800)
      }, 800)
    }
  }

  const prevPage = () => {
    if (currentPageIndex > 0 && !isTransitioning) {
      setTransitionDirection('down')
      setIsTransitioning(true)
      setAnimationClass('course-container-slide-out-down')
      setTimeout(() => {
        setCurrentPageIndex(currentPageIndex - 1)
        setAnimationClass('course-container-slide-in-down')
        setTimeout(() => {
          setIsTransitioning(false)
          setTransitionDirection(null)
          setAnimationClass('')
        }, 800)
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
    setTransitionDirection(direction)
    setIsTransitioning(true)
    setAnimationClass(direction === 'up' ? 'course-container-slide-out-up' : 'course-container-slide-out-down')
    
    setTimeout(() => {
      setCurrentPageIndex(targetIndex)
      setAnimationClass(direction === 'up' ? 'course-container-slide-in-up' : 'course-container-slide-in-down')
      setTimeout(() => {
        setIsTransitioning(false)
        setTransitionDirection(null)
        setAnimationClass('')
      }, 800)
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
  const isThreeImagesTopText = content?.type === 'three-images-top-text'

  // Strony, które mają mieć czarny tekst zamiast białego
  const pagesWithBlackText = new Set([3, 8, 12, 13, 18, 31, 45, 46, 47, 51])
  const shouldUseBlackText = pagesWithBlackText.has(currentPage.pageNumber)

  return (
    <div className="min-h-screen" style={{ background: '#1a1d24' }}>
      <div className="max-w-[1700px] ml-6 mr-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left side - Tips and course content */}
          <div className="w-full lg:flex-1 order-1 lg:order-0 flex-shrink-0">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Tips - po lewej stronie */}
              <div className="w-full lg:w-64 lg:flex-shrink-0">
                {tips.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Tipy</h3>
                    {tips.map((tip, index) => (
                      <TipCloud key={index} tip={tip} />
                    ))}
                  </div>
                )}
              </div>

              {/* Square container for course content */}
              <div className="w-full lg:w-[855px] flex-shrink-0 relative p-4 rounded-2xl glow-wrapper" style={{ background: 'rgba(35, 40, 50, 0.4)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div className="relative overflow-hidden rounded-xl">
                  <div 
                    className={`course-container bg-white overflow-hidden relative ${animationClass}`}
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
                          <div className="text-sm md:text-base lg:text-lg font-sans leading-relaxed text-black">
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
                                            className="font-serif mb-3 whitespace-pre-line"
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
                                      className="font-serif mb-3 whitespace-pre-line"
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
                                    className="font-serif mt-6 whitespace-pre-line"
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
                      <div className="w-full max-w-3xl">
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
                  <QRCodeUpload pageNumber={currentPage.pageNumber} />
                ) : isProgressEvaluation ? (
                  // Ocena postępów z suwakiem
                  <ProgressEvaluation pageNumber={currentPage.pageNumber} />
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
                        style={{ top: currentPage.pageNumber === 42 ? '15%' : '15%' }}
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
                            {currentPage.pageNumber === 46 ? (
                              <p>Balans bieli – temperatura. Przesuń suwak, tak żeby zdjęcie było jak najbardziej zbliżone do białego – ani zbyt niebieski, ani za żółte</p>
                            ) : currentPage.pageNumber === 47 ? (
                              <p>Balans bieli – odcień. Poszukaj balansu pomiędzy zielenią a fioletem</p>
                            ) : (
                              overlayText.split('\n\n').filter(p => p.trim()).map((paragraph: string, index: number) => (
                                <p key={index} className={index > 0 ? 'mt-4' : ''}>
                                  {paragraph.trim()}
                                </p>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`absolute inset-0 flex ${
                        content.textPosition === 'top' ? 'items-start justify-center' 
                        : content.textPosition === 'top-left' ? 'items-start justify-center'
                        : content.textPosition === 'top-right' ? 'items-start justify-center'
                        : content.textPosition === 'bottom' ? 'items-end justify-center' 
                        : content.textPosition === 'bottom-left' ? 'items-end justify-center'
                        : content.textPosition === 'bottom-right' ? 'items-end justify-center'
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
                      }`}>
                        {loadingText ? (
                          <div className="text-white">Ładowanie...</div>
                        ) : (
                          <div className={`w-full ${content.textPosition === 'top-left' || content.textPosition === 'top-right' || content.textPosition === 'bottom-left' || content.textPosition === 'bottom-right' ? 'max-w-2xl' : 'max-w-3xl'}`}>
                            <div className={`text-lg md:text-xl lg:text-2xl xl:text-3xl font-serif text-gray-900 leading-relaxed whitespace-pre-line text-center`}>
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
                      <div className="absolute bottom-0 left-0 right-0 flex flex-col md:flex-row gap-4 md:gap-6 px-6 md:px-8 lg:px-12 pb-6 md:pb-8 lg:pb-12">
                        <div className="flex-1 text-center">
                          <p className="text-sm md:text-base lg:text-lg font-serif text-gray-900">
                            kontury tracą wyrazistość, a danie jest za jasne, nie widać wielu elementów
                          </p>
                        </div>
                        <div className="flex-1 text-center">
                          <p className="text-sm md:text-base lg:text-lg font-serif text-gray-900">
                            idealnie wyważone, talerz i jego struktura jest zachowana, a danie widoczne
                          </p>
                        </div>
                        <div className="flex-1 text-center">
                          <p className="text-sm md:text-base lg:text-lg font-serif text-gray-900">
                            właśnie tak najczęściej wygląda zdjęcie bez obróbki na telefonie. Wystarczy je lekko rozjaśnić, aby nabrało szlachetności
                          </p>
                        </div>
                      </div>
                    )}
                    {/* 3 kontenery z tekstem na dole dla strony 46 */}
                    {currentPage.pageNumber === 46 && (
                      <div className="absolute left-0 right-0 flex flex-col md:flex-row gap-4 md:gap-6 px-6 md:px-8 lg:px-12" style={{ bottom: '20%' }}>
                        <div className="flex-1 text-center">
                          <p className="text-sm md:text-base lg:text-lg font-serif text-gray-900">
                            zbyt niebieskie
                          </p>
                        </div>
                        <div className="flex-1 text-center">
                          <p className="text-sm md:text-base lg:text-lg font-serif text-gray-900">
                            poprawne
                          </p>
                        </div>
                        <div className="flex-1 text-center">
                          <p className="text-sm md:text-base lg:text-lg font-serif text-gray-900">
                            zbyt żółte
                          </p>
                        </div>
                      </div>
                    )}
                    {/* 3 kontenery z tekstem na dole dla strony 47 */}
                    {currentPage.pageNumber === 47 && (
                      <div className="absolute left-0 right-0 flex flex-col md:flex-row gap-4 md:gap-6 px-6 md:px-8 lg:px-12" style={{ bottom: '15%' }}>
                        <div className="flex-1 text-center">
                          <p className="text-sm md:text-base lg:text-lg font-serif text-gray-900">
                            zbyt zielone
                          </p>
                        </div>
                        <div className="flex-1 text-center">
                          <p className="text-sm md:text-base lg:text-lg font-serif text-gray-900">
                            poprawne
                          </p>
                        </div>
                        <div className="flex-1 text-center">
                          <p className="text-sm md:text-base lg:text-lg font-serif text-gray-900">
                            zbyt fioletowe
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
                  <div className="relative w-full h-full bg-white flex flex-col items-center justify-start">
                    <div className="flex-none bg-white flex items-center justify-center px-6 md:px-8 lg:px-12 py-8 pt-12">
                      {loadingText ? (
                        <div className="text-gray-600">Ładowanie...</div>
                      ) : (
                        <div className="w-full max-w-4xl">
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
                    <div className="flex-none aspect-square relative mt-8 mb-8 w-[70%]" style={{ minHeight: '400px' }}>
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
                  <div className="relative w-full h-full bg-black flex flex-col items-center justify-start">
                    {/* Czarne tło z białym tekstem na górze */}
                    <div className="flex-none bg-black flex items-center justify-center px-6 md:px-8 lg:px-12 py-8 pt-12">
                      {loadingText ? (
                        <div className="text-white">Ładowanie...</div>
                      ) : (
                        <div className="w-full max-w-4xl">
                          <div className="text-base md:text-lg lg:text-xl xl:text-2xl font-serif text-white leading-relaxed whitespace-pre-line text-center">
                            {overlayText.split('\n\n').filter(p => p.trim()).map((paragraph: string, index: number) => (
                              <p key={index} className={index > 0 ? 'mt-4' : ''}>
                                {paragraph.trim()}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Kwadratowy kontener zdjęcia - 70% powierzchni głównego kontenera (77% dla stron 14 i 19) */}
                    <div className={`flex-none aspect-square relative mt-8 mb-8 ${currentPage.pageNumber === 14 || currentPage.pageNumber === 19 ? 'w-[77%]' : 'w-[70%]'}`} style={{ minHeight: '400px' }}>
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
                  <div className="relative w-full h-full bg-white flex flex-col">
                    {/* Tekst wyśrodkowany w pionie między górą a kontenerami zdjęć */}
                    <div className="flex-1 flex items-center px-6 md:px-8 lg:px-12">
                      <div className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-serif text-gray-900 leading-relaxed text-left whitespace-pre-line">
                        {content.text}
                      </div>
                    </div>
                    {/* Kontener na dwa zdjęcia - 70% powierzchni całkowitej kontenera głównego */}
                    <div className="flex-none flex items-center justify-center gap-4 px-6 md:px-8 lg:px-12 pb-8">
                      <div 
                        className="flex gap-4"
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
                                  - flat lay
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
                  <div className="relative w-full h-full bg-white flex flex-col">
                    {/* Tekst na górze */}
                    <div
                      className="flex-none px-6 md:px-8 lg:px-12 pt-8 md:pt-12 lg:pt-16"
                      style={{ paddingTop: '12%' }}
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
                                <div className="flex flex-col space-y-6">
                                  <p className="m-0">{title}</p>
                                </div>
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
                    {/* Nakładka strzałki, aby nachodziła na zdjęcie */}
                    {content.iconUrl && (
                      <div
                        className="absolute pointer-events-none z-20"
                        style={{ top: '24%', left: '-6%', width: '300px', height: '300px' }}
                      >
                        <Image
                          src={content.iconUrl?.startsWith('/') ? content.iconUrl : `/course/strona ${currentPage.pageNumber}/Foto/${content.iconUrl}`}
                          alt="Ikona kierunku"
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                    {/* Kontener na dwa zdjęcia */}
                    <div className="flex-1 flex items-center justify-center gap-4 px-6 md:px-8 lg:px-12 pb-8">
                      <div 
                        className="flex gap-4"
                        style={{ 
                          width: '95%',
                          aspectRatio: '2 / 1'
                        }}
                      >
                        {/* Kontener na pierwsze zdjęcie */}
                        <div className="flex-1 relative aspect-square">
                          <Image
                            src={content.image1Url?.startsWith('/') ? content.image1Url : `/course/strona ${currentPage.pageNumber}/Foto/${content.image1Url}`}
                            alt="Zdjęcie 27-1"
                            fill
                            className="object-contain"
                            priority={currentPageIndex === 26}
                            sizes="(max-width: 768px) 35vw, 280px"
                          />
                          {currentPage.pageNumber === 32 && (
                            <div className="absolute top-[-32%] left-1/2 -translate-x-1/2 w-full flex items-start justify-center pointer-events-none">
                              <span className="text-center text-2xl md:text-3xl lg:text-4xl font-serif text-black drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]">
                                - flat lay
                              </span>
                            </div>
                          )}
                        </div>
                        {/* Kontener na drugie zdjęcie */}
                        <div className="flex-1 relative aspect-square">
                          <Image
                            src={content.image2Url?.startsWith('/') ? content.image2Url : `/course/strona ${currentPage.pageNumber}/Foto/${content.image2Url}`}
                            alt="Zdjęcie 27-2"
                            fill
                            className="object-contain"
                            priority={currentPageIndex === 26}
                            sizes="(max-width: 768px) 35vw, 280px"
                          />
                          {currentPage.pageNumber === 32 && (
                            <div className="absolute top-[-32%] left-1/2 -translate-x-1/2 w-full flex items-start justify-center pointer-events-none">
                              <span className="text-center text-2xl md:text-3xl lg:text-4xl font-serif text-black drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]">
                                - 45 stopni
                              </span>
                            </div>
                          )}
                          {currentPage.pageNumber === 32 && content.iconUrlRight && (
                            <div
                              className="absolute pointer-events-none z-20"
                              style={{ top: '-26%', right: '-26%', width: '300px', height: '300px' }}
                            >
                              <Image
                                src={content.iconUrlRight?.startsWith('/') ? content.iconUrlRight : `/course/strona ${currentPage.pageNumber}/Foto/${content.iconUrlRight}`}
                                alt="Ikona kierunku prawa"
                                fill
                                className="object-contain"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : isThreeImagesTopText ? (
                  // Layout z białym tłem, tekstem na górze i trzema kontenerami na zdjęcia (50% wysokości, 3 kolumny)
                  <div className="relative w-full h-full bg-white flex flex-col">
                    {/* Tekst na górze */}
                    <div
                      className="flex-none px-6 md:px-8 lg:px-12 pt-8 md:pt-12 lg:pt-16"
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

                    {/* Page indicator */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 text-sm">
                      {currentPageIndex + 1} / {pages.length}
                    </div>
                  </div>
                </div>

                {/* Navigation arrows - poza kontenerem */}
                {currentPageIndex > 0 && (
                  <button
                    onClick={prevPage}
                    className="absolute left-0 top-[80%] -translate-y-1/2 -translate-x-20 p-4 z-10 nav-arrow-elegant"
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
                    className="absolute right-0 top-[80%] -translate-y-1/2 translate-x-20 p-4 z-10 nav-arrow-elegant"
                    aria-label="Następna strona"
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
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Gallery z postępami - po prawej stronie */}
          <div className="w-full lg:w-[32rem] order-2 lg:order-1 flex-shrink-0 mt-8 lg:ml-24">
            {/* Oś postępów z przyciskiem wylogowania */}
            <div className="flex items-center justify-between mb-4 gap-4">
              <div className="flex-1 min-w-0 max-w-[400px]">
                <ProgressTimeline completedPages={completedPages} onNavigate={goToPage} />
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-sm font-medium flex items-center gap-2 btn-elegant flex-shrink-0"
              >
                <svg
                  className="w-4 h-4"
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
                Wyloguj
              </button>
            </div>
            
            {/* Kontener z przełączanymi widokami - stała wysokość */}
            <div className="mt-4 h-[680px] overflow-hidden rounded-2xl">
              {activePanel === 'gallery' && (
                <ProgressGallery onProgressUpdate={setCompletedPages} />
              )}
              {activePanel === 'dictionary' && (
                <div className="w-full lg:w-[32rem] h-full p-4 panel-elegant panel-glow overflow-auto rounded-2xl">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Słownik pojęć</h3>
                  <DictionaryInline />
                </div>
              )}
              {activePanel === 'chat' && (
                <div className="w-full lg:w-[32rem] h-full p-4 panel-elegant panel-glow overflow-auto rounded-2xl">
                  <ChatBox />
                </div>
              )}
            </div>

            {/* Panel switching buttons */}
            <div className="flex gap-3 mt-4">
              {/* Gallery button - ikona aparatu */}
              <button
                onClick={() => setActivePanel('gallery')}
                className={`p-4 ${activePanel === 'gallery' ? 'btn-icon-elegant-active' : 'btn-icon-elegant'}`}
                aria-label="Twoje postępy"
                title="Twoje postępy"
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
                className={`p-4 ${activePanel === 'dictionary' ? 'btn-icon-elegant-active' : 'btn-icon-elegant'}`}
                aria-label="Słownik pojęć"
                title="Słownik pojęć"
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
                className={`p-4 ${activePanel === 'chat' ? 'btn-icon-elegant-active' : 'btn-icon-elegant'}`}
                aria-label="Wiadomości"
                title="Wiadomości"
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
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}


