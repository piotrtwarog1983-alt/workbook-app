'use client'

import dynamic from 'next/dynamic'

// Lazy load heavy components
export const LazyChatBox = dynamic(
  () => import('../ChatBox').then(mod => ({ default: mod.ChatBox })),
  { 
    loading: () => <div className="animate-pulse bg-gray-800 h-full rounded-xl" />,
    ssr: false 
  }
)

export const LazyDictionaryInline = dynamic(
  () => import('../DictionaryInline').then(mod => ({ default: mod.DictionaryInline })),
  { 
    loading: () => <div className="animate-pulse bg-gray-800 h-full rounded-xl" />,
    ssr: false 
  }
)

export const LazyProgressGallery = dynamic(
  () => import('../ProgressGallery').then(mod => ({ default: mod.ProgressGallery })),
  { 
    loading: () => <div className="animate-pulse bg-gray-800 h-full rounded-xl" />,
    ssr: false 
  }
)

export const LazyVideoPlayer = dynamic(
  () => import('../VideoPlayer').then(mod => ({ default: mod.VideoPlayer })),
  { 
    loading: () => <div className="animate-pulse bg-gray-800 h-full rounded-xl" />,
    ssr: false 
  }
)

export const LazyQRCodeUpload = dynamic(
  () => import('../QRCodeUpload').then(mod => ({ default: mod.QRCodeUpload })),
  { 
    loading: () => <div className="animate-pulse bg-gray-200 h-full rounded-xl" />,
    ssr: false 
  }
)

export const LazyConfetti = dynamic(
  () => import('../Confetti').then(mod => ({ default: mod.Confetti })),
  { ssr: false }
)
