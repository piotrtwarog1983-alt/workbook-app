'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface PhotoEditorProps {
  onClose: () => void
  onSave?: (imageData: string) => void
}

type EditorTab = 'adjust' | 'crop'

export function PhotoEditor({ onClose, onSave }: PhotoEditorProps) {
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
  
  // Kadrowanie - współrzędne w pikselach względem wyświetlanego obrazu
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialCropBox, setInitialCropBox] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null)
  const [pinchCenter, setPinchCenter] = useState({ x: 0, y: 0 })
  
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

  // Inicjalizacja ramki kadrowania
  const initCropBox = useCallback((containerWidth: number, containerHeight: number) => {
    const margin = 20
    setCropBox({
      x: margin,
      y: margin,
      width: containerWidth - margin * 2,
      height: containerHeight - margin * 2
    })
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

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

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
  }, [brightness, temperature, tint])

  // Aktualizuj filtry gdy zmieni się obraz lub jego wymiary
  useEffect(() => {
    if (originalImageRef.current && selectedImage && imageSize.width > 0) {
      applyFilters()
    }
  }, [applyFilters, selectedImage, imageSize])

  // Zastosuj kadrowanie
  const applyCrop = useCallback(() => {
    if (!originalImageRef.current || !imageContainerRef.current) return
    
    const container = imageContainerRef.current.getBoundingClientRect()
    const img = originalImageRef.current
    
    // Oblicz skalę między wyświetlanym obrazem a oryginalnym
    const scaleX = img.naturalWidth / container.width
    const scaleY = img.naturalHeight / container.height
    
    // Przelicz współrzędne na oryginalne wymiary
    const srcX = Math.max(0, Math.round(cropBox.x * scaleX))
    const srcY = Math.max(0, Math.round(cropBox.y * scaleY))
    const srcWidth = Math.max(1, Math.round(Math.min(img.naturalWidth - srcX, cropBox.width * scaleX)))
    const srcHeight = Math.max(1, Math.round(Math.min(img.naturalHeight - srcY, cropBox.height * scaleY)))
    
    // Stwórz nowy canvas z przyciętym obrazem
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = srcWidth
    tempCanvas.height = srcHeight
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) return
    
    // Rysuj bezpośrednio z oryginalnego obrazu
    tempCtx.drawImage(
      img, 
      srcX, srcY, srcWidth, srcHeight, 
      0, 0, srcWidth, srcHeight
    )
    
    // Pobierz nowy obraz jako base64
    const croppedImageData = tempCanvas.toDataURL('image/jpeg', 0.95)
    
    // Utwórz nowy obraz
    const croppedImage = new Image()
    croppedImage.onload = () => {
      // Zaktualizuj wszystkie stany
      originalImageRef.current = croppedImage
      setImageSize({ width: croppedImage.naturalWidth, height: croppedImage.naturalHeight })
      setSelectedImage(croppedImageData) // <-- Kluczowe! Zaktualizuj selectedImage
      setBrightness(100) // Reset filtrów po przycięciu
      setTemperature(0)
      setTint(0)
      setActiveTab('adjust')
    }
    croppedImage.src = croppedImageData
  }, [cropBox])

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

      onSave?.(imageData)
    } catch (err) {
      console.error('Błąd zapisywania:', err)
    } finally {
      setIsProcessing(false)
    }
  }, [onSave, applyFilters])

  // Reset filtrów
  const resetFilters = useCallback(() => {
    setBrightness(100)
    setTemperature(0)
    setTint(0)
  }, [])

  // === OBSŁUGA DOTYKU DLA KADROWANIA ===
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault() // Blokuje zoom przeglądarki
    e.stopPropagation()
    
    if (!imageContainerRef.current) return
    
    const containerRect = imageContainerRef.current.getBoundingClientRect()
    
    if (e.touches.length === 1) {
      // Jeden palec - przesuwanie
      const touch = e.touches[0]
      const touchX = touch.clientX - containerRect.left
      const touchY = touch.clientY - containerRect.top
      
      // Sprawdź czy dotyk jest wewnątrz ramki
      if (
        touchX >= cropBox.x &&
        touchX <= cropBox.x + cropBox.width &&
        touchY >= cropBox.y &&
        touchY <= cropBox.y + cropBox.height
      ) {
        setIsDragging(true)
        setDragStart({ x: touch.clientX, y: touch.clientY })
        setInitialCropBox({ ...cropBox })
      }
    } else if (e.touches.length === 2) {
      // Dwa palce - skalowanie (pinch)
      setIsDragging(false)
      setIsResizing(true)
      
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      
      setInitialPinchDistance(distance)
      setInitialCropBox({ ...cropBox })
      
      // Środek pomiędzy palcami
      setPinchCenter({
        x: (touch1.clientX + touch2.clientX) / 2 - containerRect.left,
        y: (touch1.clientY + touch2.clientY) / 2 - containerRect.top
      })
    }
  }, [cropBox])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault() // Blokuje zoom przeglądarki
    e.stopPropagation()
    
    if (!imageContainerRef.current) return
    
    const containerRect = imageContainerRef.current.getBoundingClientRect()
    
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
    } else if (e.touches.length === 2 && isResizing && initialPinchDistance !== null) {
      // Skalowanie ramki
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      
      const scale = distance / initialPinchDistance
      
      // Nowe wymiary
      let newWidth = initialCropBox.width * scale
      let newHeight = initialCropBox.height * scale
      
      // Minimalne wymiary
      const minSize = 50
      newWidth = Math.max(minSize, newWidth)
      newHeight = Math.max(minSize, newHeight)
      
      // Maksymalne wymiary (nie większe niż kontener)
      newWidth = Math.min(containerRect.width, newWidth)
      newHeight = Math.min(containerRect.height, newHeight)
      
      // Wyśrodkuj względem środka pinch
      const centerX = pinchCenter.x
      const centerY = pinchCenter.y
      
      let newX = centerX - newWidth / 2
      let newY = centerY - newHeight / 2
      
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
  }, [isDragging, isResizing, dragStart, initialCropBox, initialPinchDistance, pinchCenter, cropBox.width, cropBox.height])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setInitialPinchDistance(null)
  }, [])

  // Renderowanie zakładki kadrowania
  const renderCropUI = () => {
    if (!selectedImage) return null
    
    // Oblicz proporcje dla wyświetlania
    const aspectRatio = imageSize.width / imageSize.height || 4/5
    
    return (
      <div className="flex flex-col h-full">
        <p className="text-white/70 text-sm text-center mb-2">
          Przesuń ramkę palcem • Ściśnij palcami aby zmienić rozmiar
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
            {/* Obraz */}
            <img 
              src={selectedImage}
              alt="Do kadrowania"
              className="absolute inset-0 w-full h-full object-contain"
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
        
        {/* Przyciski */}
        <div className="flex gap-4 mt-4">
          <button
            onClick={() => setActiveTab('adjust')}
            className="flex-1 py-3 bg-white/10 rounded-xl text-white font-medium active:scale-95 transition-transform"
          >
            Anuluj
          </button>
          <button
            onClick={applyCrop}
            className="flex-1 py-3 bg-green-600 rounded-xl text-white font-medium active:scale-95 transition-transform"
          >
            ✂️ Przytnij
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
            <span className="text-white/70">☀️ Jasność</span>
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
            <span className="text-white/70">🌡️ Temperatura</span>
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
            <span className="text-white/70">🎨 Odcień</span>
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

        {/* Przyciski akcji */}
        <div className="flex gap-4 pt-2">
          <button
            onClick={openFilePicker}
            className="flex-1 py-3 bg-white/10 rounded-xl text-white font-medium active:scale-95 transition-transform"
          >
            Inne zdjęcie
          </button>
          <button
            onClick={savePhoto}
            disabled={isProcessing}
            className="flex-1 py-3 bg-green-600 rounded-xl text-white font-medium active:scale-95 transition-transform disabled:opacity-50"
          >
            {isProcessing ? 'Zapisuję...' : '💾 Zapisz'}
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
          className="w-10 h-10 flex items-center justify-center text-white text-2xl"
        >
          ✕
        </button>
        <span className="text-white font-medium">Edycja zdjęcia</span>
        <button
          onClick={resetFilters}
          className="text-white/70 text-sm px-3 py-1"
        >
          Reset
        </button>
      </div>

      {/* Główna zawartość */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {selectedImage ? (
          activeTab === 'crop' ? (
            renderCropUI()
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
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors bg-white/20 text-white"
                >
                  ☀️ Dostosuj
                </button>
                <button
                  onClick={() => setActiveTab('crop')}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors bg-white/5 text-white/60"
                >
                  ✂️ Kadruj
                </button>
              </div>
              
              {renderAdjustUI()}
            </>
          )
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={openFilePicker}
              className="w-32 h-32 rounded-2xl bg-white/10 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform"
            >
              <svg viewBox="0 0 24 24" className="w-12 h-12 text-white/60" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <span className="text-white/60 text-sm">Wybierz zdjęcie</span>
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
