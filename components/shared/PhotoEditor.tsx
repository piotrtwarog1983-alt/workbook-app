'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useLanguage } from '@/lib/LanguageContext'

interface PhotoEditorProps {
  onClose: () => void
  onSave?: (imageData: string) => void
}

type EditorTab = 'adjust' | 'crop' | 'focus'

export function PhotoEditor({ onClose, onSave }: PhotoEditorProps) {
  // Tłumaczenia
  const { t } = useLanguage()
  
  // Stan edytora
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState<EditorTab>('adjust')
  
  // Wymiary obrazu
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  
  // Parametry edycji
  const [brightness, setBrightness] = useState(100)
  const [temperature, setTemperature] = useState(0)
  const [tint, setTint] = useState(0)
  const [sharpness, setSharpness] = useState(100) // 0-200, 100 = normal, >100 = wyostrzenie, <100 = rozmycie
  
  // Selektywna ostrość (Focus) - wyostrzanie tekstury wewnątrz elipsy
  const [focusEnabled, setFocusEnabled] = useState(false)
  const [focusEllipse, setFocusEllipse] = useState({ x: 0.5, y: 0.5, radiusX: 0.3, radiusY: 0.25 }) // wartości 0-1 (proporcje obrazu)
  const [focusSharpness, setFocusSharpness] = useState(50) // 0-100, siła wyostrzenia wewnątrz
  const [focusFeather, setFocusFeather] = useState(30) // 0-100, rozmiar przejścia
  const [focusInvert, setFocusInvert] = useState(false) // false = wyostrzenie wewnątrz, true = wyostrzenie na zewnątrz
  const [isDraggingFocus, setIsDraggingFocus] = useState(false)
  const [isResizingFocusX, setIsResizingFocusX] = useState(false) // resize poziomy
  const [isResizingFocusY, setIsResizingFocusY] = useState(false) // resize pionowy
  const focusContainerRef = useRef<HTMLDivElement>(null)
  
  
  // Kadrowanie - współrzędne w pikselach względem wyświetlanego obrazu
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialCropBox, setInitialCropBox] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null)
  const [initialPinchX, setInitialPinchX] = useState<number | null>(null)
  const [initialPinchY, setInitialPinchY] = useState<number | null>(null)
  const [pinchCenter, setPinchCenter] = useState({ x: 0, y: 0 })
  
  // Obrót obrazu
  const [rotation, setRotation] = useState(0) // w stopniach
  const [initialRotation, setInitialRotation] = useState(0)
  const [initialTouchAngle, setInitialTouchAngle] = useState(0)
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const originalImageRef = useRef<HTMLImageElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cropContainerRef = useRef<HTMLDivElement>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)

  // Otwórz selektor plików
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Inicjalizacja ramki kadrowania - proporcje 4:5
  const initCropBox = useCallback((containerWidth: number, containerHeight: number) => {
    const aspectRatio = 4 / 5 // Stałe proporcje 4:5
    const margin = 20
    
    const availableWidth = containerWidth - margin * 2
    const availableHeight = containerHeight - margin * 2
    
    let cropWidth: number
    let cropHeight: number
    
    // Dopasuj do dostępnej przestrzeni zachowując proporcje 4:5
    if (availableWidth / availableHeight > aspectRatio) {
      // Dostępna przestrzeń jest szersza - dopasuj do wysokości
      cropHeight = availableHeight
      cropWidth = cropHeight * aspectRatio
    } else {
      // Dostępna przestrzeń jest wyższa - dopasuj do szerokości
      cropWidth = availableWidth
      cropHeight = cropWidth / aspectRatio
    }
    
    // Wyśrodkuj ramkę
    const x = (containerWidth - cropWidth) / 2
    const y = (containerHeight - cropHeight) / 2
    
    setCropBox({ x, y, width: cropWidth, height: cropHeight })
  }, [])

  // Obsługa wyboru pliku
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const imgSrc = reader.result as string
        setSelectedImage(imgSrc)
        
        // Reset parametrów
        setBrightness(100)
        setTemperature(0)
        setTint(0)
        setSharpness(100)
        setRotation(0)
        setFocusEnabled(false)
        setFocusEllipse({ x: 0.5, y: 0.5, radiusX: 0.3, radiusY: 0.25 })
        setFocusSharpness(50)
        setFocusFeather(30)
        setFocusInvert(false)
        setActiveTab('adjust')
        
        // Pobierz wymiary obrazu
        const img = new Image()
        img.onload = () => {
          setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
          originalImageRef.current = img
        }
        img.src = imgSrc
      }
      reader.readAsDataURL(file)
    }
  }, [])

  // Inicjalizacja ramki gdy przełączamy na tryb kadrowania
  useEffect(() => {
    if (activeTab === 'crop' && imageContainerRef.current && selectedImage) {
      const rect = imageContainerRef.current.getBoundingClientRect()
      initCropBox(rect.width, rect.height)
    }
  }, [activeTab, selectedImage, initCropBox])

  // Zastosuj filtry do canvas
  const applyFilters = useCallback(() => {
    if (!canvasRef.current || !originalImageRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = originalImageRef.current

    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    ctx.drawImage(img, 0, 0)

    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let data = imageData.data
    const width = canvas.width
    const height = canvas.height

    // Najpierw podstawowe filtry kolorów
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i]
      let g = data[i + 1]
      let b = data[i + 2]

      const brightnessFactor = brightness / 100
      r = Math.min(255, r * brightnessFactor)
      g = Math.min(255, g * brightnessFactor)
      b = Math.min(255, b * brightnessFactor)

      if (temperature > 0) {
        r = Math.min(255, r + temperature * 0.5)
        b = Math.max(0, b - temperature * 0.3)
      } else if (temperature < 0) {
        r = Math.max(0, r + temperature * 0.3)
        b = Math.min(255, b - temperature * 0.5)
      }

      if (tint > 0) {
        g = Math.max(0, g - tint * 0.3)
      } else if (tint < 0) {
        g = Math.min(255, g - tint * 0.3)
      }

      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
    }

    ctx.putImageData(imageData, 0, 0)

    // Selektywna ostrość (Focus) - wyostrzanie tekstury wewnątrz elipsy
    // Pokazuj podgląd zarówno gdy focusEnabled, jak i gdy jesteśmy w trybie focus (activeTab === 'focus')
    if ((focusEnabled || activeTab === 'focus') && focusSharpness > 0) {
      // Stwórz wyostrzoną wersję obrazu
      const sharpCanvas = document.createElement('canvas')
      sharpCanvas.width = width
      sharpCanvas.height = height
      const sharpCtx = sharpCanvas.getContext('2d')
      if (sharpCtx) {
        sharpCtx.drawImage(canvas, 0, 0)
        
        // Pobierz dane
        const originalData = ctx.getImageData(0, 0, width, height)
        const tempData = sharpCtx.getImageData(0, 0, width, height)
        const resultData = ctx.createImageData(width, height)
        
        // Parametry elipsy w pikselach
        const centerX = focusEllipse.x * width
        const centerY = focusEllipse.y * height
        const radiusXPx = focusEllipse.radiusX * width
        const radiusYPx = focusEllipse.radiusY * height
        const avgRadius = (radiusXPx + radiusYPx) / 2
        const featherPx = (focusFeather / 100) * avgRadius // rozmiar przejścia
        
        // Siła wyostrzenia (0.0 - 2.0)
        const strength = focusSharpness / 50
        
        // Kernel unsharp mask dla wyostrzania
        const kernel = [
          0, -1 * strength, 0,
          -1 * strength, 1 + 4 * strength, -1 * strength,
          0, -1 * strength, 0
        ]
        
        // Przetwórz każdy piksel
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4
            
            // Znormalizowana odległość od środka elipsy (0 = środek, 1 = krawędź elipsy)
            const normalizedDist = Math.sqrt(
              ((x - centerX) / radiusXPx) ** 2 + ((y - centerY) / radiusYPx) ** 2
            )
            
            // Feather jako proporcja promienia
            const featherRatio = featherPx / avgRadius
            
            // Oblicz współczynnik wyostrzenia (1 = pełne wyostrzenie, 0 = brak)
            let sharpenFactor: number
            if (normalizedDist <= 1 - featherRatio) {
              sharpenFactor = 1 // Wewnątrz - pełne wyostrzenie
            } else if (normalizedDist >= 1 + featherRatio) {
              sharpenFactor = 0 // Zewnątrz - brak wyostrzenia
            } else {
              // Strefa przejścia - gładki gradient
              sharpenFactor = 1 - (normalizedDist - (1 - featherRatio)) / (2 * featherRatio)
              // Smooth step dla bardziej naturalnego przejścia
              sharpenFactor = sharpenFactor * sharpenFactor * (3 - 2 * sharpenFactor)
            }
            
            // Odwróć jeśli focusInvert jest true (wyostrzenie na zewnątrz)
            if (focusInvert) {
              sharpenFactor = 1 - sharpenFactor
            }
            
            // Jeśli jesteśmy w strefie wyostrzenia i nie na krawędzi
            if (sharpenFactor > 0 && y > 0 && y < height - 1 && x > 0 && x < width - 1) {
              // Zastosuj kernel konwolucji
              let r = 0, g = 0, b = 0
              for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                  const kidx = ((y + ky) * width + (x + kx)) * 4
                  const kIdx = (ky + 1) * 3 + (kx + 1)
                  r += tempData.data[kidx] * kernel[kIdx]
                  g += tempData.data[kidx + 1] * kernel[kIdx]
                  b += tempData.data[kidx + 2] * kernel[kIdx]
                }
              }
              
              // Mieszaj oryginalny z wyostrzonym według sharpenFactor
              resultData.data[idx] = Math.max(0, Math.min(255, Math.round(
                originalData.data[idx] * (1 - sharpenFactor) + r * sharpenFactor
              )))
              resultData.data[idx + 1] = Math.max(0, Math.min(255, Math.round(
                originalData.data[idx + 1] * (1 - sharpenFactor) + g * sharpenFactor
              )))
              resultData.data[idx + 2] = Math.max(0, Math.min(255, Math.round(
                originalData.data[idx + 2] * (1 - sharpenFactor) + b * sharpenFactor
              )))
            } else {
              // Poza strefą wyostrzenia - oryginalny obraz
              resultData.data[idx] = originalData.data[idx]
              resultData.data[idx + 1] = originalData.data[idx + 1]
              resultData.data[idx + 2] = originalData.data[idx + 2]
            }
            resultData.data[idx + 3] = 255
          }
        }
        
        ctx.putImageData(resultData, 0, 0)
      }
    }

    // Globalna ostrość/rozmycie (jeśli focus nie jest włączony)
    if (!focusEnabled && sharpness !== 100) {
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      const tempCtx = tempCanvas.getContext('2d')
      if (tempCtx) {
        tempCtx.drawImage(canvas, 0, 0)
        
        if (sharpness > 100) {
          // Wyostrzanie (sharpness > 100)
          const strength = (sharpness - 100) / 100 // 0.0 - 1.0
          imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const tempData = tempCtx.getImageData(0, 0, canvas.width, canvas.height)
          
          // Kernel unsharp mask (wyostrzanie)
          const kernel = [
            0, -1 * strength, 0,
            -1 * strength, 1 + 4 * strength, -1 * strength,
            0, -1 * strength, 0
          ]
          
          const newData = new Uint8ClampedArray(imageData.data)
          
          for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
              let r = 0, g = 0, b = 0
              
              for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                  const idx = ((y + ky) * width + (x + kx)) * 4
                  const kIdx = (ky + 1) * 3 + (kx + 1)
                  
                  r += tempData.data[idx] * kernel[kIdx]
                  g += tempData.data[idx + 1] * kernel[kIdx]
                  b += tempData.data[idx + 2] * kernel[kIdx]
                }
              }
              
              const idx = (y * width + x) * 4
              newData[idx] = Math.max(0, Math.min(255, r))
              newData[idx + 1] = Math.max(0, Math.min(255, g))
              newData[idx + 2] = Math.max(0, Math.min(255, b))
            }
          }
          
          imageData.data.set(newData)
          ctx.putImageData(imageData, 0, 0)
        } else if (sharpness < 100) {
          // Rozmycie (sharpness < 100)
          const blurAmount = (100 - sharpness) / 100 // 0.0 - 1.0
          const radius = Math.round(blurAmount * 3) // max 3px blur
          
          if (radius > 0) {
            imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const tempData = tempCtx.getImageData(0, 0, canvas.width, canvas.height)
            
            const newData = new Uint8ClampedArray(imageData.data)
            
            for (let y = radius; y < height - radius; y++) {
              for (let x = radius; x < width - radius; x++) {
                let r = 0, g = 0, b = 0, count = 0
                
                for (let ky = -radius; ky <= radius; ky++) {
                  for (let kx = -radius; kx <= radius; kx++) {
                    const idx = ((y + ky) * width + (x + kx)) * 4
                    r += tempData.data[idx]
                    g += tempData.data[idx + 1]
                    b += tempData.data[idx + 2]
                    count++
                  }
                }
                
                const idx = (y * width + x) * 4
                newData[idx] = Math.round(r / count)
                newData[idx + 1] = Math.round(g / count)
                newData[idx + 2] = Math.round(b / count)
              }
            }
            
            imageData.data.set(newData)
            ctx.putImageData(imageData, 0, 0)
          }
        }
      }
    }
  }, [brightness, temperature, tint, sharpness, focusEnabled, focusEllipse, focusSharpness, focusFeather, focusInvert, activeTab])
  
  // Aktualizuj filtry gdy zmieni się obraz, wymiary lub parametry
  useEffect(() => {
    if (originalImageRef.current && selectedImage && imageSize.width > 0) {
      applyFilters()
    }
  }, [applyFilters, selectedImage, imageSize])

  // Zastosuj kadrowanie z obrotem
  const applyCrop = useCallback(() => {
    if (!originalImageRef.current || !imageContainerRef.current) return
    
    const container = imageContainerRef.current.getBoundingClientRect()
    const img = originalImageRef.current
    
    // Oblicz skalę między wyświetlanym obrazem a oryginalnym
    const scaleX = img.naturalWidth / container.width
    const scaleY = img.naturalHeight / container.height
    
    // Jeśli jest obrót, najpierw obróć cały obraz
    if (rotation !== 0) {
      // Stwórz canvas do obrócenia całego obrazu
      const rotatedCanvas = document.createElement('canvas')
      const rotatedCtx = rotatedCanvas.getContext('2d')
      if (!rotatedCtx) return
      
      const angleRad = rotation * Math.PI / 180
      const cos = Math.abs(Math.cos(angleRad))
      const sin = Math.abs(Math.sin(angleRad))
      
      // Nowe wymiary po obrocie
      const newWidth = Math.round(img.naturalWidth * cos + img.naturalHeight * sin)
      const newHeight = Math.round(img.naturalHeight * cos + img.naturalWidth * sin)
      
      rotatedCanvas.width = newWidth
      rotatedCanvas.height = newHeight
      
      // Przesuń do środka, obróć, narysuj
      rotatedCtx.translate(newWidth / 2, newHeight / 2)
      rotatedCtx.rotate(angleRad)
      rotatedCtx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
      
      // Oblicz przesunięcie spowodowane obrotem
      const offsetX = (newWidth - img.naturalWidth) / 2
      const offsetY = (newHeight - img.naturalHeight) / 2
      
      // Przelicz współrzędne na obrócony obraz
      const srcX = Math.max(0, Math.round(cropBox.x * scaleX + offsetX))
      const srcY = Math.max(0, Math.round(cropBox.y * scaleY + offsetY))
      const srcWidth = Math.max(1, Math.round(cropBox.width * scaleX))
      const srcHeight = Math.max(1, Math.round(cropBox.height * scaleY))
      
      // Stwórz canvas na przycięty fragment
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = srcWidth
      tempCanvas.height = srcHeight
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) return
      
      tempCtx.drawImage(
        rotatedCanvas,
        srcX, srcY, srcWidth, srcHeight,
        0, 0, srcWidth, srcHeight
      )
      
      const croppedImageData = tempCanvas.toDataURL('image/jpeg', 0.95)
      
      const croppedImage = new Image()
      croppedImage.onload = () => {
        originalImageRef.current = croppedImage
        setImageSize({ width: croppedImage.naturalWidth, height: croppedImage.naturalHeight })
        setSelectedImage(croppedImageData)
        setBrightness(100)
        setTemperature(0)
        setTint(0)
        setSharpness(100)
        setRotation(0)
        setActiveTab('adjust')
      }
      croppedImage.src = croppedImageData
    } else {
      // Bez obrotu - standardowe przycinanie
      const srcX = Math.max(0, Math.round(cropBox.x * scaleX))
      const srcY = Math.max(0, Math.round(cropBox.y * scaleY))
      const srcWidth = Math.max(1, Math.round(Math.min(img.naturalWidth - srcX, cropBox.width * scaleX)))
      const srcHeight = Math.max(1, Math.round(Math.min(img.naturalHeight - srcY, cropBox.height * scaleY)))
      
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = srcWidth
      tempCanvas.height = srcHeight
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) return
      
      tempCtx.drawImage(
        img,
        srcX, srcY, srcWidth, srcHeight,
        0, 0, srcWidth, srcHeight
      )
      
      const croppedImageData = tempCanvas.toDataURL('image/jpeg', 0.95)
      
      const croppedImage = new Image()
      croppedImage.onload = () => {
        originalImageRef.current = croppedImage
        setImageSize({ width: croppedImage.naturalWidth, height: croppedImage.naturalHeight })
        setSelectedImage(croppedImageData)
        setBrightness(100)
        setTemperature(0)
        setTint(0)
        setSharpness(100)
        setActiveTab('adjust')
      }
      croppedImage.src = croppedImageData
    }
  }, [cropBox, rotation])

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

  // Zapisz zdjęcie
  const savePhoto = useCallback(async () => {
    if (!canvasRef.current) return
    
    setIsProcessing(true)
    
    try {
      applyFilters()
      const imageData = canvasRef.current.toDataURL('image/jpeg', 0.9)
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const fileName = `TheOne-edited-${timestamp}.jpg`

      const base64Response = await fetch(imageData)
      const blob = await base64Response.blob()

      // Wykryj iOS (Safari na iPhone/iPad)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
      
      // Na iOS użyj Web Share API, na innych platformach - automatyczne pobieranie
      if (isIOS && navigator.share && navigator.canShare) {
        try {
          const file = new File([blob], fileName, { type: 'image/jpeg' })
          const shareData = { files: [file] }
          
          if (navigator.canShare(shareData)) {
            await navigator.share(shareData)
          } else {
            downloadViaLink(blob, fileName)
          }
        } catch (shareErr) {
          if ((shareErr as Error).name !== 'AbortError') {
            downloadViaLink(blob, fileName)
          }
        }
      } else {
        // Android/Desktop - automatyczne pobieranie
        downloadViaLink(blob, fileName)
      }

      onSave?.(imageData)
    } catch (err) {
      console.error('Błąd zapisywania:', err)
    } finally {
      setIsProcessing(false)
    }
  }, [onSave, applyFilters, downloadViaLink])

  // Reset filtrów
  const resetFilters = useCallback(() => {
    setBrightness(100)
    setTemperature(0)
    setTint(0)
    setSharpness(100)
    setRotation(0)
    setFocusEnabled(false)
    setFocusEllipse({ x: 0.5, y: 0.5, radiusX: 0.3, radiusY: 0.25 })
    setFocusSharpness(50)
    setFocusFeather(30)
    setFocusInvert(false)
  }, [])

  // === OBSŁUGA DOTYKU DLA KADROWANIA ===
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault() // Blokuje zoom przeglądarki
    e.stopPropagation()
    
    if (!imageContainerRef.current) return
    
    const containerRect = imageContainerRef.current.getBoundingClientRect()
    const centerX = containerRect.width / 2
    const centerY = containerRect.height / 2
    
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      const touchX = touch.clientX - containerRect.left
      const touchY = touch.clientY - containerRect.top
      
      // Sprawdź czy dotyk jest wewnątrz ramki kadrowania
      const isInsideCropBox = 
        touchX >= cropBox.x &&
        touchX <= cropBox.x + cropBox.width &&
        touchY >= cropBox.y &&
        touchY <= cropBox.y + cropBox.height
      
      if (isInsideCropBox) {
        // Wewnątrz ramki - przesuwanie ramki
        setIsDragging(true)
        setIsRotating(false)
        setDragStart({ x: touch.clientX, y: touch.clientY })
        setInitialCropBox({ ...cropBox })
      } else {
        // Poza ramką - obracanie obrazu
        setIsRotating(true)
        setIsDragging(false)
        setInitialRotation(rotation)
        // Oblicz początkowy kąt od środka obrazu do palca
        const angle = Math.atan2(touchY - centerY, touchX - centerX) * (180 / Math.PI)
        setInitialTouchAngle(angle)
      }
    } else if (e.touches.length === 2) {
      // Dwa palce - skalowanie (pinch)
      setIsDragging(false)
      setIsRotating(false)
      setIsResizing(true)
      
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      
      // Zapamiętaj początkowe odległości X i Y osobno
      const distanceX = Math.abs(touch2.clientX - touch1.clientX)
      const distanceY = Math.abs(touch2.clientY - touch1.clientY)
      
      setInitialPinchDistance(distance)
      setInitialPinchX(distanceX)
      setInitialPinchY(distanceY)
      setInitialCropBox({ ...cropBox })
      
      // Środek pomiędzy palcami
      setPinchCenter({
        x: (touch1.clientX + touch2.clientX) / 2 - containerRect.left,
        y: (touch1.clientY + touch2.clientY) / 2 - containerRect.top
      })
    }
  }, [cropBox, rotation])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault() // Blokuje zoom przeglądarki
    e.stopPropagation()
    
    if (!imageContainerRef.current) return
    
    const containerRect = imageContainerRef.current.getBoundingClientRect()
    const centerX = containerRect.width / 2
    const centerY = containerRect.height / 2
    
    if (e.touches.length === 1 && isDragging) {
      // Przesuwanie ramki
      const touch = e.touches[0]
      const deltaX = touch.clientX - dragStart.x
      const deltaY = touch.clientY - dragStart.y
      
      let newX = initialCropBox.x + deltaX
      let newY = initialCropBox.y + deltaY
      
      // Ogranicz do kontenera
      newX = Math.max(0, Math.min(containerRect.width - cropBox.width, newX))
      newY = Math.max(0, Math.min(containerRect.height - cropBox.height, newY))
      
      setCropBox(prev => ({
        ...prev,
        x: newX,
        y: newY
      }))
    } else if (e.touches.length === 1 && isRotating) {
      // Obracanie obrazu
      const touch = e.touches[0]
      const touchX = touch.clientX - containerRect.left
      const touchY = touch.clientY - containerRect.top
      
      // Oblicz aktualny kąt od środka obrazu do palca
      const currentAngle = Math.atan2(touchY - centerY, touchX - centerX) * (180 / Math.PI)
      
      // Różnica kątów
      let deltaAngle = currentAngle - initialTouchAngle
      
      // Nowy kąt obrotu
      let newRotation = initialRotation + deltaAngle
      
      // Ogranicz do ±45 stopni
      newRotation = Math.max(-45, Math.min(45, newRotation))
      
      setRotation(newRotation)
    } else if (e.touches.length === 2 && isResizing && initialPinchDistance !== null) {
      // Skalowanie ramki - zachowuje proporcje 4:5
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      
      const aspectRatio = 4 / 5 // Stałe proporcje
      
      // Aktualna odległość między palcami
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      
      // Oblicz skalę (jednolitą dla obu wymiarów)
      const scale = currentDistance / initialPinchDistance
      
      // Nowa szerokość z zachowaniem proporcji
      let newWidth = initialCropBox.width * scale
      let newHeight = newWidth / aspectRatio
      
      // Minimalne wymiary
      const minWidth = 80
      const minHeight = minWidth / aspectRatio
      newWidth = Math.max(minWidth, newWidth)
      newHeight = Math.max(minHeight, newHeight)
      
      // Maksymalne wymiary (nie większe niż kontener, z zachowaniem proporcji)
      if (newWidth > containerRect.width) {
        newWidth = containerRect.width
        newHeight = newWidth / aspectRatio
      }
      if (newHeight > containerRect.height) {
        newHeight = containerRect.height
        newWidth = newHeight * aspectRatio
      }
      
      // Wyśrodkuj względem środka pinch
      const cX = pinchCenter.x
      const cY = pinchCenter.y
      
      let newX = cX - newWidth / 2
      let newY = cY - newHeight / 2
      
      // Ogranicz do kontenera
      newX = Math.max(0, Math.min(containerRect.width - newWidth, newX))
      newY = Math.max(0, Math.min(containerRect.height - newHeight, newY))
      
      setCropBox({
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      })
    }
  }, [isDragging, isResizing, isRotating, dragStart, initialCropBox, initialPinchDistance, initialRotation, initialTouchAngle, pinchCenter, cropBox.width, cropBox.height])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setIsRotating(false)
    setInitialPinchDistance(null)
    setInitialPinchX(null)
    setInitialPinchY(null)
  }, [])

  // Renderowanie zakładki kadrowania
  const renderCropUI = () => {
    if (!selectedImage) return null
    
    // Oblicz proporcje dla wyświetlania
    const aspectRatio = imageSize.width / imageSize.height || 4/5
    
    return (
      <div className="flex flex-col h-full">
        <p className="text-white/70 text-sm text-center mb-2">
          {t.editor.cropHint}
        </p>
        
        {/* Kontener obrazu z ramką kadrowania */}
        <div 
          ref={cropContainerRef}
          className="flex-1 flex items-center justify-center overflow-hidden"
        >
          <div 
            ref={imageContainerRef}
            className="relative bg-black"
            style={{ 
              width: '100%',
              maxWidth: '400px',
              aspectRatio: aspectRatio,
              maxHeight: 'calc(100vh - 350px)',
              touchAction: 'none' // Blokuje zoom przeglądarki na tym elemencie
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Obraz z obrotem */}
            <img 
              src={selectedImage}
              alt="Do kadrowania"
              className="absolute inset-0 w-full h-full object-contain transition-transform duration-75"
              style={{ transform: `rotate(${rotation}deg)` }}
              draggable={false}
            />
            
            {/* Ciemna warstwa poza ramką */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Góra */}
              <div 
                className="absolute left-0 right-0 top-0 bg-black/70"
                style={{ height: cropBox.y }}
              />
              {/* Dół */}
              <div 
                className="absolute left-0 right-0 bottom-0 bg-black/70"
                style={{ height: `calc(100% - ${cropBox.y + cropBox.height}px)` }}
              />
              {/* Lewa */}
              <div 
                className="absolute left-0 bg-black/70"
                style={{ 
                  top: cropBox.y, 
                  height: cropBox.height,
                  width: cropBox.x
                }}
              />
              {/* Prawa */}
              <div 
                className="absolute right-0 bg-black/70"
                style={{ 
                  top: cropBox.y, 
                  height: cropBox.height,
                  width: `calc(100% - ${cropBox.x + cropBox.width}px)`
                }}
              />
            </div>
            
            {/* Ramka kadrowania */}
            <div 
              className="absolute border-2 border-white pointer-events-none"
              style={{
                left: cropBox.x,
                top: cropBox.y,
                width: cropBox.width,
                height: cropBox.height
              }}
            >
              {/* Siatka 3x3 */}
              <div className="absolute inset-0">
                {/* Linie pionowe */}
                <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white/50" />
                <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/50" />
                {/* Linie poziome */}
                <div className="absolute left-0 right-0 top-1/3 h-px bg-white/50" />
                <div className="absolute left-0 right-0 top-2/3 h-px bg-white/50" />
              </div>
              
              {/* Narożniki - wskaźniki wizualne */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white" />
            </div>
          </div>
        </div>
        
        {/* Suwak obrotu */}
        <div className="mt-3 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/70 flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              {t.editor.rotation}
            </span>
            <span className="text-yellow-400 font-mono w-16 text-right">{rotation.toFixed(1)}°</span>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-px h-3 bg-white/50" />
            </div>
            <input
              type="range"
              min={-45}
              max={45}
              step={0.1}
              value={rotation}
              onChange={(e) => setRotation(parseFloat(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer"
            />
          </div>
          <div className="flex justify-between text-xs text-white/40">
            <span>-45°</span>
            <button 
              onClick={() => setRotation(0)}
              className="text-white/60 hover:text-white transition-colors flex items-center gap-1"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              {t.editor.reset}
            </button>
            <span>+45°</span>
          </div>
        </div>
        
        {/* Przyciski */}
        <div className="flex gap-4 mt-4">
          <button
            onClick={() => {
              setActiveTab('adjust')
              setRotation(0) // Reset obrotu przy anulowaniu
            }}
            className="flex-1 py-3 bg-white/10 rounded-xl text-white font-medium active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            {t.editor.cancel}
          </button>
          <button
            onClick={applyCrop}
            className="flex-1 py-3 bg-green-600 rounded-xl text-white font-medium active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2v4M6 12v10M18 2v10M18 18v4" strokeLinecap="round" />
              <path d="M6 6h12a2 2 0 012 2v4M2 18h10a2 2 0 002-2V6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t.editor.crop}
          </button>
        </div>
      </div>
    )
  }

  // Renderowanie zakładki dostosowań
  const renderAdjustUI = () => {
    if (!selectedImage) return null
    
    return (
      <div className="space-y-4">
        {/* Jasność */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/70 flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {t.editor.brightness}
            </span>
            <span className="text-yellow-400 font-mono">{brightness}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={200}
            value={brightness}
            onChange={(e) => setBrightness(parseInt(e.target.value))}
            className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer"
          />
        </div>

        {/* Temperatura */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/70 flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 4v10.54a4 4 0 11-4 0V4a2 2 0 014 0z" />
                <circle cx="12" cy="18" r="2" fill="currentColor" />
              </svg>
              {t.editor.temperature}
            </span>
            <span className="text-yellow-400 font-mono">{temperature > 0 ? '+' : ''}{temperature}</span>
          </div>
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-white to-orange-500 opacity-30" />
            <input
              type="range"
              min={-100}
              max={100}
              value={temperature}
              onChange={(e) => setTemperature(parseInt(e.target.value))}
              className="relative w-full h-2 bg-transparent rounded-full appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Odcień */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/70 flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a10 10 0 0110 10" />
                <path d="M12 2a10 10 0 00-10 10" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
              {t.editor.tint}
            </span>
            <span className="text-yellow-400 font-mono">{tint > 0 ? '+' : ''}{tint}</span>
          </div>
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500 via-white to-pink-500 opacity-30" />
            <input
              type="range"
              min={-100}
              max={100}
              value={tint}
              onChange={(e) => setTint(parseInt(e.target.value))}
              className="relative w-full h-2 bg-transparent rounded-full appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Ostrość/tekstura */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/70 flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6M12 17v6M23 12h-6M7 12H1" strokeLinecap="round" />
                <circle cx="12" cy="12" r="8" opacity="0.5" />
              </svg>
              {t.editor.sharpness || 'Ostrość'}
            </span>
            <span className="text-yellow-400 font-mono">
              {sharpness > 100 ? '+' : ''}{sharpness - 100}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={200}
            value={sharpness}
            onChange={(e) => setSharpness(parseInt(e.target.value))}
            className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-white/40">
            <span>Rozmycie</span>
            <span>Normal</span>
            <span>Ostrość</span>
          </div>
        </div>

        {/* Przyciski akcji */}
        <div className="flex gap-4 pt-2">
          <button
            onClick={openFilePicker}
            className="flex-1 py-3 bg-white/10 rounded-xl text-white font-medium active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
              <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t.editor.otherPhoto}
          </button>
          <button
            onClick={savePhoto}
            disabled={isProcessing}
            className="flex-1 py-3 bg-green-600 rounded-xl text-white font-medium active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
              <polyline points="17,21 17,13 7,13 7,21" />
              <polyline points="7,3 7,8 15,8" />
            </svg>
            {isProcessing ? t.editor.saving : t.editor.save}
          </button>
        </div>
      </div>
    )
  }

  // Obsługa dotyku dla Focus (elipsa)
  const handleFocusTouchStart = useCallback((e: React.TouchEvent) => {
    if (!focusContainerRef.current) return
    e.preventDefault()
    
    const rect = focusContainerRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    const touchX = (touch.clientX - rect.left) / rect.width
    const touchY = (touch.clientY - rect.top) / rect.height
    
    // Znormalizowana odległość od środka elipsy
    const normalizedDist = Math.sqrt(
      ((touchX - focusEllipse.x) / focusEllipse.radiusX) ** 2 + 
      ((touchY - focusEllipse.y) / focusEllipse.radiusY) ** 2
    )
    
    const edgeThreshold = 0.15
    
    // Sprawdź czy dotyk jest na lewej/prawej krawędzi (resize X)
    const isNearLeftRight = Math.abs(touchX - focusEllipse.x) > focusEllipse.radiusX * 0.7 &&
                            Math.abs(touchY - focusEllipse.y) < focusEllipse.radiusY * 0.5
    
    // Sprawdź czy dotyk jest na górnej/dolnej krawędzi (resize Y)
    const isNearTopBottom = Math.abs(touchY - focusEllipse.y) > focusEllipse.radiusY * 0.7 &&
                            Math.abs(touchX - focusEllipse.x) < focusEllipse.radiusX * 0.5
    
    if (Math.abs(normalizedDist - 1) < edgeThreshold) {
      if (isNearLeftRight) {
        setIsResizingFocusX(true)
        setIsResizingFocusY(false)
        setIsDraggingFocus(false)
      } else if (isNearTopBottom) {
        setIsResizingFocusY(true)
        setIsResizingFocusX(false)
        setIsDraggingFocus(false)
      } else {
        // Krawędź ukośna - resize proporcjonalny
        setIsResizingFocusX(true)
        setIsResizingFocusY(true)
        setIsDraggingFocus(false)
      }
    } else if (normalizedDist < 1) {
      setIsDraggingFocus(true)
      setIsResizingFocusX(false)
      setIsResizingFocusY(false)
    }
  }, [focusEllipse])

  const handleFocusTouchMove = useCallback((e: React.TouchEvent) => {
    if (!focusContainerRef.current) return
    e.preventDefault()
    
    const rect = focusContainerRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    const touchX = (touch.clientX - rect.left) / rect.width
    const touchY = (touch.clientY - rect.top) / rect.height
    
    if (isDraggingFocus) {
      // Przesuń środek elipsy
      setFocusEllipse(prev => ({
        ...prev,
        x: Math.max(0.1, Math.min(0.9, touchX)),
        y: Math.max(0.1, Math.min(0.9, touchY))
      }))
    } else if (isResizingFocusX || isResizingFocusY) {
      const deltaX = Math.abs(touchX - focusEllipse.x)
      const deltaY = Math.abs(touchY - focusEllipse.y)
      
      setFocusEllipse(prev => ({
        ...prev,
        radiusX: isResizingFocusX ? Math.max(0.08, Math.min(0.45, deltaX)) : prev.radiusX,
        radiusY: isResizingFocusY ? Math.max(0.08, Math.min(0.45, deltaY)) : prev.radiusY
      }))
    }
  }, [isDraggingFocus, isResizingFocusX, isResizingFocusY, focusEllipse.x, focusEllipse.y])

  const handleFocusTouchEnd = useCallback(() => {
    setIsDraggingFocus(false)
    setIsResizingFocusX(false)
    setIsResizingFocusY(false)
  }, [])

  // Renderowanie zakładki Focus
  const renderFocusUI = () => {
    if (!selectedImage) return null
    
    const aspectRatio = imageSize.width / imageSize.height || 4/5
    
    return (
      <div className="flex flex-col h-full">
        <p className="text-white/70 text-sm text-center mb-2">
          {t.editor.focusHint || 'Przeciągnij środek • Krawędź zmienia rozmiar'}
        </p>
        
        {/* Kontener obrazu z okręgiem focus */}
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <div 
            ref={focusContainerRef}
            className="relative bg-black"
            style={{ 
              width: '100%',
              maxWidth: '400px',
              aspectRatio: aspectRatio,
              maxHeight: 'calc(100vh - 450px)',
              touchAction: 'none'
            }}
            onTouchStart={handleFocusTouchStart}
            onTouchMove={handleFocusTouchMove}
            onTouchEnd={handleFocusTouchEnd}
          >
            {/* Obraz z zastosowanymi filtrami */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-contain"
            />
            
            {/* Wizualizacja elipsy focus */}
            <div 
              className="absolute border-2 border-white rounded-full pointer-events-none"
              style={{
                left: `${(focusEllipse.x - focusEllipse.radiusX) * 100}%`,
                top: `${(focusEllipse.y - focusEllipse.radiusY) * 100}%`,
                width: `${focusEllipse.radiusX * 200}%`,
                height: `${focusEllipse.radiusY * 200}%`,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)'
              }}
            >
              {/* Punkt środkowy */}
              <div 
                className="absolute w-5 h-5 bg-white rounded-full border-2 border-gray-400"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              />
              {/* Wskaźniki zmiany rozmiaru pionowego (góra/dół) */}
              <div className="absolute top-0 left-1/2 w-3 h-3 bg-yellow-400 rounded-full -translate-x-1/2 -translate-y-1/2 border border-white" />
              <div className="absolute bottom-0 left-1/2 w-3 h-3 bg-yellow-400 rounded-full -translate-x-1/2 translate-y-1/2 border border-white" />
              {/* Wskaźniki zmiany rozmiaru poziomego (lewo/prawo) */}
              <div className="absolute left-0 top-1/2 w-3 h-3 bg-blue-400 rounded-full -translate-x-1/2 -translate-y-1/2 border border-white" />
              <div className="absolute right-0 top-1/2 w-3 h-3 bg-blue-400 rounded-full translate-x-1/2 -translate-y-1/2 border border-white" />
            </div>
          </div>
        </div>
        
        {/* Kontrolki */}
        <div className="mt-3 space-y-3">
          {/* Siła wyostrzenia */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-white/70">{t.editor.sharpnessStrength || 'Siła wyostrzenia'}</span>
              <span className="text-yellow-400 font-mono">{focusSharpness}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={focusSharpness}
              onChange={(e) => setFocusSharpness(parseInt(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer"
            />
          </div>
          
          {/* Rozmiar przejścia */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-white/70">{t.editor.feather || 'Przejście'}</span>
              <span className="text-yellow-400 font-mono">{focusFeather}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={focusFeather}
              onChange={(e) => setFocusFeather(parseInt(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer"
            />
          </div>
          
          {/* Przełącznik odwrócenia */}
          <button
            onClick={() => setFocusInvert(!focusInvert)}
            className={`w-full py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              focusInvert ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/70'
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a10 10 0 0110 10" fill={focusInvert ? 'currentColor' : 'none'} />
            </svg>
            {focusInvert 
              ? (t.editor.sharpnessOutside || 'Wyostrzenie na zewnątrz')
              : (t.editor.sharpnessInside || 'Wyostrzenie wewnątrz')
            }
          </button>
        </div>
        
        {/* Przyciski */}
        <div className="flex gap-4 mt-4">
          <button
            onClick={() => {
              setFocusEnabled(false)
              setActiveTab('adjust')
            }}
            className="flex-1 py-3 bg-white/10 rounded-xl text-white font-medium active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            {t.editor.cancel}
          </button>
          <button
            onClick={() => {
              setFocusEnabled(true)
              setActiveTab('adjust')
            }}
            className="flex-1 py-3 bg-green-600 rounded-xl text-white font-medium active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20,6 9,17 4,12" />
            </svg>
            {t.editor.apply || 'Zastosuj'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* Nagłówek */}
      <div className="flex items-center justify-between p-4 bg-black/80">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center text-white"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <span className="text-white font-medium">{t.editor.title}</span>
        <button
          onClick={resetFilters}
          className="text-white/70 text-sm px-3 py-1 flex items-center gap-1"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          {t.editor.reset}
        </button>
      </div>

      {/* Główna zawartość */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {selectedImage ? (
          <>
            {activeTab === 'crop' ? (
              renderCropUI()
            ) : activeTab === 'focus' ? (
              renderFocusUI()
            ) : (
              <>
                {/* Podgląd obrazu z filtrami */}
                <div className="flex-1 flex items-center justify-center overflow-hidden mb-4">
                  <canvas
                    ref={canvasRef}
                    className="max-w-full max-h-full object-contain rounded-lg"
                    style={{ maxHeight: 'calc(100vh - 400px)' }}
                  />
                </div>
                
                {/* Zakładki */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setActiveTab('adjust')}
                    className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors bg-white/20 text-white flex items-center justify-center gap-2"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                    </svg>
                    {t.editor.adjust}
                  </button>
                  <button
                    onClick={() => setActiveTab('focus')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      focusEnabled ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/60'
                    }`}
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <circle cx="12" cy="12" r="7" opacity="0.5" />
                      <circle cx="12" cy="12" r="10" opacity="0.3" />
                    </svg>
                    {t.editor.focus || 'Focus'}
                  </button>
                  <button
                    onClick={() => setActiveTab('crop')}
                    className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors bg-white/5 text-white/60 flex items-center justify-center gap-2"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 2v4M6 12v10M18 2v10M18 18v4" strokeLinecap="round" />
                      <path d="M6 6h12a2 2 0 012 2v4M2 18h10a2 2 0 002-2V6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {t.editor.cropTab}
                  </button>
                </div>
                
                {renderAdjustUI()}
              </>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={openFilePicker}
              className="w-40 h-40 rounded-2xl bg-white/10 flex flex-col items-center justify-center gap-4 active:scale-95 transition-transform border-2 border-dashed border-white/30 hover:border-white/50"
            >
              {/* Ikona dodawania zdjęcia */}
              <div className="relative">
                <svg viewBox="0 0 24 24" className="w-16 h-16 text-white/60" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                  <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {/* Plus w rogu */}
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
              </div>
              <span className="text-white/70 text-sm font-medium">{t.editor.selectPhoto}</span>
            </button>
          </div>
        )}
      </div>

      {/* Ukryty input do wyboru plików */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
