'use client'

import { LanguageProvider } from '@/lib/LanguageContext'
import { DeviceProvider } from '@/lib/DeviceContext'
import { useViewportHeight } from '@/hooks/useViewportHeight'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  // Inicjalizuje dynamiczne zarządzanie wysokością viewportu
  useViewportHeight()
  
  return (
    <LanguageProvider>
      <DeviceProvider>
        {children}
      </DeviceProvider>
    </LanguageProvider>
  )
}










































