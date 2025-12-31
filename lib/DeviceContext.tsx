'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type DeviceType = 'desktop' | 'mobile' | null

interface DeviceContextType {
  device: DeviceType
  isMobile: boolean
  isDesktop: boolean
  isLoading: boolean
}

const DeviceContext = createContext<DeviceContextType>({
  device: null,
  isMobile: false,
  isDesktop: false,
  isLoading: true,
})

export function useDevice() {
  return useContext(DeviceContext)
}

interface DeviceProviderProps {
  children: ReactNode
}

// Breakpoint dla mobile (px)
const MOBILE_BREAKPOINT = 1024

export function DeviceProvider({ children }: DeviceProviderProps) {
  const [device, setDevice] = useState<DeviceType>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkDevice = () => {
      // Sprawdzamy szerokość ekranu
      const isMobileWidth = window.innerWidth < MOBILE_BREAKPOINT
      
      // Dodatkowo sprawdzamy user-agent dla pewności
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(userAgent)
      
      // Urządzenie jest mobile jeśli ma małą szerokość LUB ma mobile user-agent
      const isMobile = isMobileWidth || isMobileUserAgent
      
      setDevice(isMobile ? 'mobile' : 'desktop')
      setIsLoading(false)
    }

    // Sprawdź przy załadowaniu
    checkDevice()

    // Nasłuchuj na zmiany rozmiaru okna
    window.addEventListener('resize', checkDevice)
    
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  const value: DeviceContextType = {
    device,
    isMobile: device === 'mobile',
    isDesktop: device === 'desktop',
    isLoading,
  }

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  )
}

// HOC do renderowania komponentu tylko dla określonego urządzenia
export function withDevice<P extends object>(
  DesktopComponent: React.ComponentType<P>,
  MobileComponent: React.ComponentType<P>
) {
  return function DeviceAwareComponent(props: P) {
    const { device, isLoading } = useDevice()

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="animate-pulse text-gray-400">Ładowanie...</div>
        </div>
      )
    }

    if (device === 'mobile') {
      return <MobileComponent {...props} />
    }

    return <DesktopComponent {...props} />
  }
}


