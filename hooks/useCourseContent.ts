'use client'

import { useState, useEffect } from 'react'
import Pusher from 'pusher-js'
import { PROGRESS_PAGES, isProgressPage } from '@/lib/progress-pages'
import { MOCK_COURSE } from '@/lib/mock-data'

interface UseCourseContentProps {
  courseSlug: string
  currentPageIndex: number
  currentLang: 'PL' | 'DE'
}

interface CourseContentState {
  course: any
  loading: boolean
  error: string
  overlayText: string
  loadingText: boolean
  fileTips: string[]
  completedPages: number[]
  userUploadId: string | null
  qrPageContent: string
  page45Texts: { text1: string; text2: string; text3: string }
  page46Texts: { text1: string; text2: string; text3: string }
  page47Texts: { text1: string; text2: string; text3: string }
  page32Labels: { label1: string; label2: string }
}

export function useCourseContent({
  courseSlug,
  currentPageIndex,
  currentLang
}: UseCourseContentProps): CourseContentState {
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [overlayText, setOverlayText] = useState('')
  const [loadingText, setLoadingText] = useState(false)
  const [fileTips, setFileTips] = useState<string[]>([])
  const [completedPages, setCompletedPages] = useState<number[]>([])
  const [userUploadId, setUserUploadId] = useState<string | null>(null)
  const [qrPageContent, setQrPageContent] = useState('')
  const [page45Texts, setPage45Texts] = useState({ text1: '', text2: '', text3: '' })
  const [page46Texts, setPage46Texts] = useState({ text1: '', text2: '', text3: '' })
  const [page47Texts, setPage47Texts] = useState({ text1: '', text2: '', text3: '' })
  const [page32Labels, setPage32Labels] = useState({ label1: '', label2: '' })

  // Fetch course data
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
    return () => { isActive = false }
  }, [courseSlug])

  // Fetch user upload ID and setup Pusher
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
          fetchCompletedPages(data.uploadId)
        }
      } catch (error) {
        console.error('Error fetching upload ID:', error)
      }
    }

    fetchUploadIdAndSetupPusher()
  }, [])

  // Fetch completed pages
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

  // Pusher subscription for real-time updates
  useEffect(() => {
    if (!userUploadId) return

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

    if (pusherKey && pusherCluster) {
      const pusher = new Pusher(pusherKey, { cluster: pusherCluster })
      const channel = pusher.subscribe(`progress-${userUploadId}`)
      
      channel.bind('photo:uploaded', (data: { pageNumber: number; imageUrl: string }) => {
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
        pusher.disconnect()
      }
    }
  }, [userUploadId])

  // Fetch tips
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

  // Fetch overlay text
  useEffect(() => {
    if (!course) return
    
    const pages = course.pages || []
    const currentPage = pages[currentPageIndex]
    if (!currentPage) return

    const parseContent = (contentJson?: string): any => {
      if (!contentJson) return null
      try {
        return JSON.parse(contentJson)
      } catch {
        return { text: contentJson }
      }
    }

    const pageContent = parseContent(currentPage.content)
    const textTypes = [
      'image-overlay', 'quote-text', 'image-overlay-text-top', 'text-image-split',
      'formatted-text', 'image-overlay-text-file', 'image-overlay-text-white',
      'black-header-image', 'white-header-image', 'two-images-top-text',
      'three-images-top-text', 'dictionary', 'simple-text', 'two-images-container',
      'image-top-text-bottom'
    ]

    if (pageContent && textTypes.includes(pageContent.type) && pageContent.textFile) {
      setLoadingText(true)
      const textFileUrl = pageContent.textFile.replace(/\/(PL|DE)$/, `/${currentLang}`)
      fetch(textFileUrl)
        .then((res) => res.json())
        .then((data) => {
          if (data.content) setOverlayText(data.content)
          setLoadingText(false)
        })
        .catch((err) => {
          console.error('Error loading text:', err)
          setOverlayText('')
          setLoadingText(false)
        })
    } else {
      setOverlayText('')
    }
  }, [currentPageIndex, course, currentLang])

  // Fetch page-specific texts (45, 46, 47)
  useEffect(() => {
    if (!course) return
    
    const pages = course.pages || []
    const currentPage = pages[currentPageIndex]
    if (!currentPage) return

    const loadPageTexts = async (pageNum: number, setter: Function) => {
      try {
        const [res1, res2, res3] = await Promise.all([
          fetch(`/course/strona ${pageNum}/Wersja/${currentLang}/text1.txt`),
          fetch(`/course/strona ${pageNum}/Wersja/${currentLang}/text2.txt`),
          fetch(`/course/strona ${pageNum}/Wersja/${currentLang}/text3.txt`)
        ])
        
        const [text1, text2, text3] = await Promise.all([
          res1.ok ? res1.text() : '',
          res2.ok ? res2.text() : '',
          res3.ok ? res3.text() : ''
        ])
        
        setter({ text1, text2, text3 })
      } catch (err) {
        console.error(`Error loading page ${pageNum} texts:`, err)
      }
    }

    if (currentPage.pageNumber === 45) loadPageTexts(45, setPage45Texts)
    if (currentPage.pageNumber === 46) loadPageTexts(46, setPage46Texts)
    if (currentPage.pageNumber === 47) loadPageTexts(47, setPage47Texts)
  }, [currentPageIndex, course, currentLang])

  // Fetch page 32 labels
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

  // Fetch QR page content
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

  return {
    course,
    loading,
    error,
    overlayText,
    loadingText,
    fileTips,
    completedPages,
    userUploadId,
    qrPageContent,
    page45Texts,
    page46Texts,
    page47Texts,
    page32Labels
  }
}
