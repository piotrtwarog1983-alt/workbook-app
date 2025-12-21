'use client'

import Image from 'next/image'

interface Panel {
  type: 'image' | 'text'
  imageUrl?: string
  text?: string
  backgroundColor?: 'dark' | 'light'
}

interface GridLayoutProps {
  panels: Panel[]
  pageNumber: number
  isPriority?: boolean
}

export function GridLayout({ panels, pageNumber, isPriority = false }: GridLayoutProps) {
  return (
    <div className="grid grid-cols-2 grid-rows-2 w-full h-full relative">
      {panels.map((panel, index) => (
        <div key={index} className="relative w-full h-full overflow-hidden">
          {panel.type === 'image' ? (
            <div className="relative w-full h-full">
              <Image
                src={panel.imageUrl?.startsWith('/') ? panel.imageUrl : `/course/strona ${pageNumber}/Foto/${panel.imageUrl}`}
                alt={`Panel ${index + 1}`}
                fill
                className="object-cover"
                priority={isPriority && index < 2}
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
                  {panel.text?.split('\n\n')[0]}
                </div>
                <div className="text-lg md:text-2xl lg:text-3xl font-serif mb-4">
                  {panel.text?.split('\n\n')[1]}
                </div>
                <div className="text-2xl mb-4 text-orange-500">★</div>
                <div className="text-xs md:text-sm font-sans mb-2 tracking-wider">
                  {panel.text?.split('\n\n')[3]}
                </div>
                <div className="text-xs md:text-sm font-sans">
                  {panel.text?.split('\n\n')[4]}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}
