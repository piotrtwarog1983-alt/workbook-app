'use client'

import { useEffect } from 'react'

/**
 * Hook do dynamicznego zarządzania wysokością viewportu
 * Rozwiązuje problem z 100vh na urządzeniach mobilnych,
 * gdzie paski przeglądarki (góra/dół) zmieniają rzeczywistą wysokość viewportu
 */
export function useViewportHeight() {
  useEffect(() => {
    // Funkcja do aktualizacji zmiennych CSS
    const updateViewportHeight = () => {
      // Pobierz rzeczywistą wysokość okna
      const vh = window.innerHeight * 0.01
      
      // Ustaw zmienne CSS
      document.documentElement.style.setProperty('--vh', `${window.innerHeight}px`)
      document.documentElement.style.setProperty('--vh-unit', `${vh}px`)
      
      // Wysokość treści = viewport - pasek dolny (80px) - safe areas
      const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-top') || '0')
      const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-bottom') || '0')
      
      const contentHeight = window.innerHeight - 80 - safeAreaBottom
      document.documentElement.style.setProperty('--vh-content', `${contentHeight}px`)
      
      // Debug info (można usunąć w produkcji)
      // console.log('Viewport height:', window.innerHeight, 'Content height:', contentHeight)
    }

    // Funkcja do pobierania safe area insets
    const updateSafeAreas = () => {
      // Próbuj pobrać wartości env() przez tymczasowy element
      const testEl = document.createElement('div')
      testEl.style.cssText = `
        position: fixed;
        top: env(safe-area-inset-top, 0px);
        bottom: env(safe-area-inset-bottom, 0px);
        left: env(safe-area-inset-left, 0px);
        right: env(safe-area-inset-right, 0px);
        pointer-events: none;
        visibility: hidden;
      `
      document.body.appendChild(testEl)
      
      const computed = getComputedStyle(testEl)
      const safeTop = parseInt(computed.top) || 0
      const safeBottom = parseInt(computed.bottom) || 0
      
      document.documentElement.style.setProperty('--safe-area-top', `${safeTop}px`)
      document.documentElement.style.setProperty('--safe-area-bottom', `${safeBottom}px`)
      
      document.body.removeChild(testEl)
    }

    // Inicjalizacja
    updateSafeAreas()
    updateViewportHeight()

    // Event listeners
    window.addEventListener('resize', updateViewportHeight)
    window.addEventListener('orientationchange', () => {
      // Poczekaj na zakończenie zmiany orientacji
      setTimeout(updateViewportHeight, 100)
    })

    // Dla iOS - wykryj zmiany w UI przeglądarki (np. chowanie/pokazywanie paska adresu)
    let lastHeight = window.innerHeight
    const checkHeightChange = setInterval(() => {
      if (window.innerHeight !== lastHeight) {
        lastHeight = window.innerHeight
        updateViewportHeight()
      }
    }, 100)

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateViewportHeight)
      window.removeEventListener('orientationchange', updateViewportHeight)
      clearInterval(checkHeightChange)
    }
  }, [])
}

