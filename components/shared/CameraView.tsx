'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { PhotoEditor } from './PhotoEditor'
import { useLanguage } from '@/lib/LanguageContext'

interface CameraViewProps {
  onCapture?: (imageData: string) => void
  onClose?: () => void
  pageNumber?: number
  showGridOverlay?: boolean
  showLevel?: boolean
}

export function CameraView({ 
  onCapture, 
  onClose, 
  pageNumber,
  showGridOverlay = true,
  showLevel = true 
}: CameraViewProps) {
  // Tłumaczenia
  const { t } = useLanguage()
  
  // Stan kamery
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  
  // Zoom
  const [zoom, setZoom] = useState(1)
  const [minZoom, setMinZoom] = useState(1)
  const [maxZoom, setMaxZoom] = useState(1)
  
  // Grid overlay - siatka 3x3 zawsze widoczna
  // Odczytaj zapisane ustawienie Fokus z localStorage
  const [sepiaEnabled, setSepiaEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cameraFocusEnabled')
      return saved === 'true'
    }
    return false
  })
  
  // Poziomnica
  const [tiltX, setTiltX] = useState(0) // lewo-prawo
  const [tiltY, setTiltY] = useState(0) // przód-tył
  const [isLevelSupported, setIsLevelSupported] = useState(false)
  
  // Wizualne potwierdzenie zdjęcia
  const [photoFlash, setPhotoFlash] = useState(false)
  const [photoCount, setPhotoCount] = useState(0)
  
  // Edytor zdjęć
  const [showEditor, setShowEditor] = useState(false)
  
  // Bokeh na żywo (rozmycie górnej części kadru)
  const [bokehEnabled, setBokehEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cameraBokehEnabled')
      return saved === 'true'
    }
    return false
  })
  const [bokehIntensity, setBokehIntensity] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cameraBokehIntensity')
      return saved ? parseInt(saved) : 8
    }
    return 8
  })
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  // Pinch-to-zoom
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null)
  const [initialZoom, setInitialZoom] = useState(1)

  // Sprawdź czy jesteśmy w bezpiecznym kontekście (HTTPS lub localhost)
  const isSecureContext = typeof window !== 'undefined' && (
    window.isSecureContext || 
    window.location.protocol === 'https:' || 
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  )

  // Uruchomienie kamery
  const startCamera = useCallback(async () => {
    try {
      setError(null)
      
      // Sprawdź czy mamy bezpieczny kontekst
      if (!isSecureContext) {
        setError(t.camera.requiresHttps)
        return
      }

      // Sprawdź czy API jest dostępne
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError(t.camera.browserNotSupported)
        return
      }
      
      // Zatrzymaj poprzedni stream jeśli istnieje
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          // Autofokus ciągły - domyślnie fokusuje w centrum kadru
          focusMode: 'continuous',
        } as MediaTrackConstraints,
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsActive(true)

        // Sprawdź możliwości zoom - ograniczamy do max 3x
        const track = stream.getVideoTracks()[0]
        const capabilities = track.getCapabilities() as any
        
        if (capabilities.zoom) {
          const deviceMinZoom = capabilities.zoom.min || 1
          const deviceMaxZoom = capabilities.zoom.max || 1
          setMinZoom(deviceMinZoom)
          setMaxZoom(Math.min(deviceMaxZoom, 3)) // Maksymalnie 3x zoom
          setZoom(deviceMinZoom)
          
          // Wymuś ustawienie zoom na minimum (1:1) przy starcie
          try {
            const constraints = { advanced: [{ zoom: deviceMinZoom }] } as any
            await track.applyConstraints(constraints)
          } catch (zoomErr) {
            console.warn('Nie udało się ustawić zoom:', zoomErr)
          }
        }
      }
    } catch (err: any) {
      console.error('Camera error:', err)
      if (err.name === 'NotAllowedError') {
        setError(t.camera.noPermission)
      } else if (err.name === 'NotFoundError') {
        setError(t.camera.notFound)
      } else if (err.name === 'NotSupportedError' || err.name === 'SecurityError') {
        setError(t.camera.requiresHttps)
      } else {
        setError(`${t.camera.error}: ${err.message}`)
      }
    }
  }, [facingMode, isSecureContext, t.camera])

  // Zatrzymanie kamery
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsActive(false)
  }, [])

  // Zmiana zoom
  const handleZoomChange = useCallback((newZoom: number) => {
    const clampedZoom = Math.min(Math.max(newZoom, minZoom), maxZoom)
    setZoom(clampedZoom)

    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0]
      const capabilities = track.getCapabilities() as any
      
      if (capabilities.zoom) {
        const constraints = { advanced: [{ zoom: clampedZoom }] } as any
        track.applyConstraints(constraints).catch(console.error)
      }
    }
  }, [minZoom, maxZoom])

  // Szybki blur dla górnej części zdjęcia - 90% to gradient
  const fastBlurTopRegion = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number, 
    height: number,
    intensity: number
  ) => {
    // Blur do górnej 1/3 wysokości
    const blurEndY = Math.floor(height / 3)
    // Gradient zaczyna się od 10% wysokości bluru (90% to gradient)
    const fullBlurEndY = Math.floor(blurEndY * 0.1)
    
    // Mocniejsza intensywność - taka sama jak podgląd (0.7 * intensity)
    const maxRadius = Math.min(12, Math.round(intensity * 0.7))
    if (maxRadius < 1) return
    
    const imageData = ctx.getImageData(0, 0, width, blurEndY)
    const pixels = imageData.data
    const result = new Uint8ClampedArray(pixels.length)
    
    // Próbkowanie co 2 piksele dla wydajności
    const step = 2
    
    for (let y = 0; y < blurEndY; y++) {
      // Oblicz siłę blur - 90% to gradient
      let strength = 1
      if (y > fullBlurEndY) {
        // Płynne przejście od 100% do 0%
        strength = 1 - ((y - fullBlurEndY) / (blurEndY - fullBlurEndY))
      }
      const radius = Math.round(maxRadius * strength)
      
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        
        if (radius < 1) {
          // Bez blur - kopiuj piksel
          result[i] = pixels[i]
          result[i + 1] = pixels[i + 1]
          result[i + 2] = pixels[i + 2]
          result[i + 3] = pixels[i + 3]
          continue
        }
        
        let r = 0, g = 0, b = 0, count = 0
        
        for (let ky = -radius; ky <= radius; ky += step) {
          for (let kx = -radius; kx <= radius; kx += step) {
            const nx = Math.min(width - 1, Math.max(0, x + kx))
            const ny = Math.min(blurEndY - 1, Math.max(0, y + ky))
            const idx = (ny * width + nx) * 4
            r += pixels[idx]
            g += pixels[idx + 1]
            b += pixels[idx + 2]
            count++
          }
        }
        
        result[i] = r / count
        result[i + 1] = g / count
        result[i + 2] = b / count
        result[i + 3] = pixels[i + 3]
      }
    }
    
    // Zastosuj wynik
    imageData.data.set(result)
    ctx.putImageData(imageData, 0, 0)
  }, [])

  // Funkcja pomocnicza do pobierania przez link (fallback)
  const downloadViaLink = useCallback((blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 100)
  }, [])

  // Robienie zdjęcia i zapisywanie na telefonie - przycięte do proporcji siatki 4:5
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return

    const videoWidth = video.videoWidth
    const videoHeight = video.videoHeight

    // Oblicz obszar siatki (proporcje 4:5, wyśrodkowany)
    const gridAspectRatio = 4 / 5
    const videoAspectRatio = videoWidth / videoHeight
    
    let cropWidth: number
    let cropHeight: number
    let cropX: number
    let cropY: number
    
    if (videoAspectRatio > gridAspectRatio) {
      // Video jest szersze - przytnij boki
      cropHeight = videoHeight
      cropWidth = videoHeight * gridAspectRatio
      cropX = (videoWidth - cropWidth) / 2
      cropY = 0
    } else {
      // Video jest wyższe - przytnij góra/dół
      cropWidth = videoWidth
      cropHeight = videoWidth / gridAspectRatio
      cropX = 0
      cropY = (videoHeight - cropHeight) / 2
    }

    // Ustaw canvas na rozmiar przyciętego obrazu (proporcje 4:5)
    canvas.width = cropWidth
    canvas.height = cropHeight

    // Rysuj przycięty fragment video na canvas
    ctx.drawImage(
      video, 
      cropX, cropY, cropWidth, cropHeight,  // źródło (przycięty obszar)
      0, 0, cropWidth, cropHeight           // cel (cały canvas)
    )

    // Jeśli bokeh jest włączone - nałóż blur na górną 1/3 zdjęcia
    if (bokehEnabled && bokehIntensity > 0) {
      fastBlurTopRegion(ctx, canvas.width, canvas.height, bokehIntensity)
    }

    // Pobierz dane obrazu jako base64
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9)
    
    // Nazwa pliku z datą i numerem strony
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const fileName = pageNumber 
      ? `TheOne-strona${pageNumber}-${timestamp}.jpg`
      : `TheOne-${timestamp}.jpg`

    // Konwertuj base64 na blob
    const base64Response = await fetch(imageDataUrl)
    const blob = await base64Response.blob()

    // Wykryj iOS (Safari na iPhone/iPad)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    
    // Na iOS użyj Web Share API (jedyny sposób zapisu do galerii), na innych platformach - automatyczne pobieranie
    if (isIOS && navigator.share && navigator.canShare) {
      try {
        const file = new File([blob], fileName, { type: 'image/jpeg' })
        const shareData = { files: [file] }
        
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData)
        } else {
          downloadViaLink(blob, fileName)
        }
      } catch (err) {
        // Użytkownik anulował - ignoruj
        if ((err as Error).name !== 'AbortError') {
          downloadViaLink(blob, fileName)
        }
      }
    } else {
      // Android/Desktop - automatyczne pobieranie
      downloadViaLink(blob, fileName)
    }

    // Krótka wizualna informacja o zapisaniu (flash ekranu)
    setPhotoFlash(true)
    setTimeout(() => setPhotoFlash(false), 200)
    
    // Zwiększ licznik zdjęć
    setPhotoCount(prev => prev + 1)
  }, [pageNumber, bokehEnabled, bokehIntensity, fastBlurTopRegion, downloadViaLink])

  // Przełączanie efektu sepii (zapisuje do localStorage)
  const toggleSepia = useCallback(() => {
    setSepiaEnabled(prev => {
      const newValue = !prev
      localStorage.setItem('cameraFocusEnabled', String(newValue))
      return newValue
    })
  }, [])

  // Inicjalizacja DeviceOrientation dla poziomicy
  useEffect(() => {
    if (!showLevel || typeof window === 'undefined') return

    const handleOrientation = (event: Event) => {
      const orientationEvent = event as DeviceOrientationEvent
      if (orientationEvent.gamma !== null && orientationEvent.beta !== null) {
        setIsLevelSupported(true)
        // gamma: obrót wokół osi Y (-90 do 90) - przechył lewo/prawo
        // beta: obrót wokół osi X (-180 do 180) - przechył przód/tył
        setTiltX(orientationEvent.gamma)
        setTiltY(orientationEvent.beta - 90) // Normalizacja dla trzymania pionowego
      }
    }

    // Sprawdź czy potrzebna jest zgoda (iOS 13+)
    if (typeof window !== 'undefined') {
      const DeviceOrientationEvent = (window as any).DeviceOrientationEvent
      if (DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then((response: string) => {
            if (response === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation)
            }
          })
          .catch(console.error)
      } else {
        window.addEventListener('deviceorientation', handleOrientation as EventListener)
      }
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation as EventListener)
    }
  }, [showLevel])

  // Uruchomienie kamery przy montowaniu
  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  // Restart kamery przy zmianie facingMode
  useEffect(() => {
    if (isActive) {
      startCamera()
    }
  }, [facingMode])

  // Obsługa pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      setInitialPinchDistance(distance)
      setInitialZoom(zoom)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance !== null) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const scale = distance / initialPinchDistance
      const newZoom = initialZoom * scale
      handleZoomChange(newZoom)
    }
  }

  const handleTouchEnd = () => {
    setInitialPinchDistance(null)
  }

  // Renderowanie grid overlay - siatka 3x3 zawsze widoczna
  // Środkowy prostokąt = sygnalizator pozycji (czerwona sepia gdy nieprawidłowa)
  const renderGridOverlay = () => {
    // Sprawdzenie prawidłowości pozycji
    // pitchAngle: 0° = pionowo, 90° = poziomo, >90° = przechylony za bardzo
    const rawPitchAngle = Math.abs(Math.round(tiltY))
    const pitchAngle = Math.min(90, rawPitchAngle) // Dla wyświetlania (max 90)
    
    // Prawidłowe kąty: 0-40° (lekko pochylony) lub 87-93° (flat lay)
    // Nieprawidłowe: 40-87° oraz >93°
    const isPitchOk = (rawPitchAngle >= 0 && rawPitchAngle <= 40) || (rawPitchAngle >= 87 && rawPitchAngle <= 93)
    const isLevelOk = Math.abs(tiltX) <= 5
    const isPositionOk = !isLevelSupported || (isPitchOk && isLevelOk)
    
    return (
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {/* Siatka z ciemnym tłem wokół (box-shadow) */}
        <div 
          className="relative w-full h-full max-w-[80vw]"
          style={{ 
            aspectRatio: '4/5', 
            maxHeight: '70vh',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.9)'
          }}
        >
            {/* Efekt bokeh - tylko górna 1/3 kadru z płynnym gradientem (90% gradientu) */}
          {bokehEnabled && (
            <div 
              className="absolute inset-0"
              style={{ 
                // Intensywność blur dla podglądu
                backdropFilter: `blur(${Math.round(bokehIntensity * 0.7)}px)`,
                WebkitBackdropFilter: `blur(${Math.round(bokehIntensity * 0.7)}px)`,
                // Gradient zajmuje 90% - tylko 10% na górze to pełny blur, reszta to płynne przejście
                maskImage: `linear-gradient(to bottom, black 0%, black 3%, rgba(0,0,0,0.9) 6%, rgba(0,0,0,0.75) 12%, rgba(0,0,0,0.6) 18%, rgba(0,0,0,0.45) 22%, rgba(0,0,0,0.3) 26%, rgba(0,0,0,0.15) 30%, transparent 33.33%)`,
                WebkitMaskImage: `linear-gradient(to bottom, black 0%, black 3%, rgba(0,0,0,0.9) 6%, rgba(0,0,0,0.75) 12%, rgba(0,0,0,0.6) 18%, rgba(0,0,0,0.45) 22%, rgba(0,0,0,0.3) 26%, rgba(0,0,0,0.15) 30%, transparent 33.33%)`
              }} 
            />
          )}
          
          {/* Efekt sepii na zewnętrznych prostokątach (jeśli włączony) - działa razem z bokeh */}
          {sepiaEnabled && (
            <>
              {/* Górny rząd - sepia działa też gdy bokeh włączone (nakłada się na blur) */}
              <div className="absolute top-0 left-0 w-1/3 h-1/3" style={{ backdropFilter: 'sepia(0.8) brightness(0.9)' }} />
              <div className="absolute top-0 left-1/3 w-1/3 h-1/3" style={{ backdropFilter: 'sepia(0.8) brightness(0.9)' }} />
              <div className="absolute top-0 left-2/3 w-1/3 h-1/3" style={{ backdropFilter: 'sepia(0.8) brightness(0.9)' }} />
              {/* Środkowy rząd - tylko boki */}
              <div className="absolute top-1/3 left-0 w-1/3 h-1/3" style={{ backdropFilter: 'sepia(0.8) brightness(0.9)' }} />
              <div className="absolute top-1/3 left-2/3 w-1/3 h-1/3" style={{ backdropFilter: 'sepia(0.8) brightness(0.9)' }} />
              {/* Dolny rząd */}
              <div className="absolute top-2/3 left-0 w-1/3 h-1/3" style={{ backdropFilter: 'sepia(0.8) brightness(0.9)' }} />
              <div className="absolute top-2/3 left-1/3 w-1/3 h-1/3" style={{ backdropFilter: 'sepia(0.8) brightness(0.9)' }} />
              <div className="absolute top-2/3 left-2/3 w-1/3 h-1/3" style={{ backdropFilter: 'sepia(0.8) brightness(0.9)' }} />
            </>
          )}
          
          {/* ŚRODKOWY PROSTOKĄT = SYGNALIZATOR POZYCJI */}
          {/* Czerwone obramowanie gdy pozycja nieprawidłowa */}
          {!isPositionOk && isLevelSupported && (
            <div 
              className="absolute top-1/3 left-1/3 w-1/3 h-1/3 border-2 border-red-500 transition-all duration-300" 
            />
          )}

          {/* Linie siatki 3x3 - zawsze widoczne */}
          <div className={`absolute top-0 bottom-0 left-1/3 w-px transition-colors ${isPositionOk ? 'bg-white/40' : 'bg-red-500/60'}`} />
          <div className={`absolute top-0 bottom-0 left-2/3 w-px transition-colors ${isPositionOk ? 'bg-white/40' : 'bg-red-500/60'}`} />
          <div className={`absolute left-0 right-0 top-1/3 h-px transition-colors ${isPositionOk ? 'bg-white/40' : 'bg-red-500/60'}`} />
          <div className={`absolute left-0 right-0 top-2/3 h-px transition-colors ${isPositionOk ? 'bg-white/40' : 'bg-red-500/60'}`} />
          {/* Ramka zewnętrzna */}
          <div className={`absolute inset-0 border transition-colors ${isPositionOk ? 'border-white/30' : 'border-red-500/60'}`} />
        </div>
      </div>
    )
  }

  // Renderowanie kąta przechyłu (tylko na górze ekranu) - uproszczony wskaźnik
  const renderLevel = () => {
    if (!showLevel || !isLevelSupported) return null

    // Kąt przechyłu (pitch)
    const pitchAngle = Math.min(90, Math.max(0, Math.abs(Math.round(tiltY))))

    return (
      <>
        {/* Kąt przechyłu - minimalistyczny wskaźnik */}
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2">
          <div className="px-4 py-2 bg-black/60 rounded-xl backdrop-blur-sm border border-white/20 flex items-center gap-2">
            <span className="text-white/60 text-sm">{t.camera.angle}:</span>
            <span className="text-white text-lg font-bold min-w-[3ch] text-center">
              {pitchAngle}°
            </span>
          </div>
        </div>
      </>
    )
  }
  
  // Renderowanie poziomicy (w dolnym panelu)
  const renderLevelIndicator = () => {
    if (!isLevelSupported) return null
    
    // Odchylenie poziomicy: -5 do 5° = OK, poza tym = ŹLE
    const isLevelOk = Math.abs(tiltX) <= 5
    
    return (
      <div className="flex justify-center mb-4">
        <div className="relative w-40 h-8 bg-black/40 rounded-full overflow-hidden border border-white/20">
          {/* Środkowe znaczniki (cel) */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-5 bg-white/40" />
          <div className="absolute top-1/2 left-1/4 transform -translate-y-1/2 w-0.5 h-2 bg-white/30" />
          <div className="absolute top-1/2 left-3/4 transform -translate-y-1/2 w-0.5 h-2 bg-white/30" />
          
          {/* Bańka poziomu (oczko) - zmienia kolor na czerwony gdy odchylenie > 5° */}
          <div 
            className={`absolute top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full transition-all duration-100 shadow-lg ${
              isLevelOk 
                ? 'bg-green-500 shadow-green-500/50' 
                : 'bg-red-500 shadow-red-500/50'
            }`}
            style={{ 
              left: `calc(50% + ${Math.max(-60, Math.min(60, tiltX * 1.5))}px - 8px)` 
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* Flash przy robieniu zdjęcia */}
      {photoFlash && (
        <div className="absolute inset-0 z-50 bg-white pointer-events-none animate-pulse" />
      )}
      
      {/* Nagłówek */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
        {/* Przycisk zamknięcia */}
        <button
          onClick={() => {
            stopCamera()
            onClose?.()
          }}
          className="w-10 h-10 flex items-center justify-center text-white text-2xl"
        >
          ✕
        </button>

        {/* Informacja o stronie lub licznik zdjęć */}
        <span className="text-white text-sm opacity-70">
          {pageNumber ? `${t.camera.page} ${pageNumber}` : ''}
          {photoCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-green-500/30 rounded-full text-green-400">
              📷 {photoCount}
            </span>
          )}
        </span>

        {/* Pusty element dla wyrównania */}
        <div className="w-10 h-10" />
      </div>

      {/* Podgląd kamery */}
      <div 
        className="flex-1 relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-red-400 text-lg mb-4">{error}</p>
              
              {/* Przycisk do ponownej próby */}
              <button
                onClick={startCamera}
                className="px-6 py-3 bg-white/20 rounded-full text-white mb-4"
              >
                {t.camera.tryAgain}
              </button>
              
              {/* Fallback - użyj natywnego aparatu */}
              <div className="mt-4">
                <p className="text-white/60 text-sm mb-3">{t.camera.orUseNative}</p>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file && onCapture) {
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        onCapture(reader.result as string)
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                  className="hidden"
                  id="camera-fallback-input"
                />
                <label
                  htmlFor="camera-fallback-input"
                  className="inline-block px-6 py-3 bg-blue-500 rounded-full text-white cursor-pointer hover:bg-blue-600 transition-colors"
                >
                  📷 {t.camera.openCamera}
                </label>
              </div>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ 
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
              }}
            />
            
            {/* Grid overlay */}
            {renderGridOverlay()}
            
            {/* Poziomnica */}
            {renderLevel()}
          </>
        )}
      </div>

      {/* Dolny panel z kontrolkami */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 pb-8">
        {/* Zoom: wskaźnik cyfrowy bezpośrednio nad suwakiem */}
        {maxZoom > minZoom && (
          <div className="mb-2.5">
            {/* Aktualne przybliżenie - bezpośrednio NAD suwakiem */}
            <div className="flex justify-center">
              <span className="text-yellow-400 text-lg font-bold">{zoom.toFixed(1)}x</span>
            </div>
            {/* Suwak zoom */}
            <div className="flex items-center justify-center gap-4 -mt-0.5">
              <span className="text-white text-sm">1x</span>
              <div className="relative">
                <input
                  type="range"
                  min={minZoom}
                  max={maxZoom}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                  className="w-48 h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #fff ${((zoom - minZoom) / (maxZoom - minZoom)) * 100}%, rgba(255,255,255,0.3) ${((zoom - minZoom) / (maxZoom - minZoom)) * 100}%)`
                  }}
                />
              </div>
              <span className="text-white text-sm">3x</span>
            </div>
          </div>
        )}
        
        {/* Suwak Bokeh (gdy włączony) */}
        {bokehEnabled && (
          <div className="mb-2">
            <div className="flex items-center justify-center gap-3">
              <span className="text-white/60 text-xs">Bokeh:</span>
              <input
                type="range"
                min={2}
                max={20}
                value={bokehIntensity}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  setBokehIntensity(value)
                  localStorage.setItem('cameraBokehIntensity', String(value))
                }}
                className="w-32 h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
              />
              <span className="text-purple-400 text-sm font-bold w-8">{bokehIntensity}px</span>
            </div>
          </div>
        )}
        
        {/* Poziomnica - między zoomem a przyciskami */}
        {renderLevelIndicator()}

        {/* Główne przyciski */}
        <div className="flex items-center justify-center gap-6">
          {/* Przycisk sepii - podświetla środek siatki */}
          <button
            onClick={toggleSepia}
            className={`w-11 h-11 flex items-center justify-center rounded-full ${sepiaEnabled ? 'bg-amber-600/60' : 'bg-white/10'}`}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" fill={sepiaEnabled ? "currentColor" : "none"} />
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
            </svg>
          </button>

          {/* Przycisk bokeh - rozmycie tła */}
          <button
            onClick={() => {
              const newValue = !bokehEnabled
              setBokehEnabled(newValue)
              localStorage.setItem('cameraBokehEnabled', String(newValue))
            }}
            className={`w-11 h-11 flex items-center justify-center rounded-full ${bokehEnabled ? 'bg-purple-600/60' : 'bg-white/10'}`}
          >
            <span className="text-lg">🔮</span>
          </button>

          {/* Przycisk zdjęcia */}
          <button
            onClick={capturePhoto}
            disabled={!isActive}
            className="w-20 h-20 flex items-center justify-center rounded-full bg-white border-4 border-white/30 active:scale-95 transition-transform disabled:opacity-50"
          >
            <div className="w-16 h-16 rounded-full bg-white" />
          </button>

          {/* Przycisk edycji zdjęć */}
          <button
            onClick={() => {
              stopCamera() // Zatrzymaj kamerę żeby zwolnić zasoby
              setShowEditor(true)
            }}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6" />
              <circle cx="8" cy="6" r="2" fill="currentColor" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <circle cx="14" cy="12" r="2" fill="currentColor" />
              <line x1="4" y1="18" x2="20" y2="18" />
              <circle cx="10" cy="18" r="2" fill="currentColor" />
            </svg>
          </button>
        </div>

        {/* Etykiety */}
        <div className="flex items-center justify-center gap-6 mt-2">
          <span className={`text-xs w-11 text-center ${sepiaEnabled ? 'text-amber-400' : 'text-white/60'}`}>
            {t.camera.focus}
          </span>
          <span className={`text-xs w-11 text-center ${bokehEnabled ? 'text-purple-400' : 'text-white/60'}`}>
            {t.camera.bokeh}
          </span>
          <span className="text-white/60 text-xs w-20 text-center">{t.camera.photo}</span>
          <span className="text-white/60 text-xs w-11 text-center">{t.camera.edit}</span>
        </div>
      </div>

      {/* Ukryty canvas do robienia zdjęć */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Edytor zdjęć */}
      {showEditor && (
        <PhotoEditor 
          onClose={() => {
            setShowEditor(false)
            startCamera() // Wznów kamerę po zamknięciu edytora
          }}
        />
      )}
    </div>
  )
}

