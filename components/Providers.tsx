'use client'

import { LanguageProvider } from '@/lib/LanguageContext'
import { DeviceProvider } from '@/lib/DeviceContext'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <DeviceProvider>
        {children}
      </DeviceProvider>
    </LanguageProvider>
  )
}










































