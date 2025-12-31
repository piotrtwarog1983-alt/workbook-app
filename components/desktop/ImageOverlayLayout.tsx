'use client'

import Image from 'next/image'

interface ImageOverlayLayoutProps {
  imageUrl: string
  pageNumber: number
  title?: string
  overlayText: string
  loadingText: boolean
  textPosition?: 'left' | 'right' | 'center'
  isPriority?: boolean
  isMobile?: boolean
}

export function ImageOverlayLayout({
  imageUrl,
  pageNumber,
  title,
  overlayText,
  loadingText,
  textPosition = 'left',
  isPriority = false,
  isMobile = false
}: ImageOverlayLayoutProps) {
  const imageSrc = imageUrl?.startsWith('/') ? imageUrl : `/course/strona ${pageNumber}/Foto/${imageUrl}`

  // Mobile layout: image top, text bottom
  if (isMobile && pageNumber === 2) {
    return (
      <div className="relative w-full h-full flex flex-col">
        {/* Image top - 60% */}
        <div className="relative h-[60%]">
          <Image
            src={imageSrc}
            alt={title || `Strona ${pageNumber}`}
            fill
            className="object-cover object-top"
            priority={isPriority}
            sizes="100vw"
          />
        </div>
        {/* Text bottom - 40% */}
        <div className="h-[40%] bg-white flex items-start justify-center p-4 overflow-y-auto">
          <div className="text-sm font-sans leading-relaxed text-black font-bold text-center">
            {loadingText ? (
              'Ładowanie...'
            ) : (
              overlayText.split(/\n\s*\n/).filter(p => p.trim()).map((paragraph, index) => (
                <p key={index} className={index > 0 ? 'mt-4' : ''}>
                  {paragraph.trim()}
                </p>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  // Desktop layout
  return (
    <div className="relative w-full h-full">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src={imageSrc}
          alt={title || `Strona ${pageNumber}`}
          fill
          className="object-cover"
          priority={isPriority}
          sizes="(max-width: 768px) 100vw, 800px"
        />
      </div>
      
      {/* Text overlay */}
      {textPosition === 'left' && (
        <div className="absolute inset-0 flex items-end">
          <div className="w-[60%] max-w-[60%] pl-6 md:pl-8 lg:pl-12 pr-4 pb-6 md:pb-8 lg:pb-12">
            <div className={`text-sm md:text-base lg:text-lg font-sans leading-relaxed text-black ${pageNumber === 2 ? 'font-bold' : ''}`}>
              {loadingText ? (
                'Ładowanie...'
              ) : (
                overlayText.split(/\n\s*\n/).filter(p => p.trim()).map((paragraph, index) => {
                  const trimmedParagraph = paragraph.trim()
                  const isSecondParagraph = trimmedParagraph.includes('gwiazdkami Michelin') ||
                                            trimmedParagraph.includes('JRE Guide Deutschland')
                  return (
                    <p 
                      key={index} 
                      className={
                        isSecondParagraph 
                          ? 'mt-10 mb-10' 
                          : index === 0 
                          ? 'mb-6' 
                          : 'mt-6'
                      }
                      style={isSecondParagraph ? { marginTop: '2.5rem', marginBottom: '2.5rem' } : undefined}
                    >
                      {trimmedParagraph}
                    </p>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
      
      {textPosition === 'right' && (
        <div className="absolute inset-0 flex items-center justify-end">
          <div className="w-1/3 pr-6 md:pr-8 lg:pr-12 text-right">
            <div className="text-sm md:text-base lg:text-lg font-sans leading-relaxed text-black whitespace-pre-line">
              {loadingText ? 'Ładowanie...' : overlayText}
            </div>
          </div>
        </div>
      )}
      
      {textPosition === 'center' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2/3 text-center px-6 md:px-8">
            <div className="text-sm md:text-base lg:text-lg font-sans leading-relaxed text-black whitespace-pre-line">
              {loadingText ? 'Ładowanie...' : overlayText}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
