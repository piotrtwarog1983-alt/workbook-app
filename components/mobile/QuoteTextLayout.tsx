'use client'

interface QuoteTextLayoutProps {
  overlayText: string
  loadingText: boolean
}

export function QuoteTextLayout({ overlayText, loadingText }: QuoteTextLayoutProps) {
  if (loadingText) {
    return (
      <div className="relative w-full h-full flex items-center justify-center p-8">
        <div className="text-gray-400">Ładowanie...</div>
      </div>
    )
  }

  const hasQuoteSeparator = overlayText.includes('---')

  if (hasQuoteSeparator) {
    const quoteText = overlayText.split('---')[0].trim()
    const contentText = overlayText.split('---')[1]?.trim()
    
    // Check for author (starts with "-")
    const authorMatch = quoteText.match(/\n\s*-\s*(.+)$/)
    const quote = authorMatch ? quoteText.replace(/\n\s*-\s*.+$/, '').trim() : quoteText
    const author = authorMatch ? authorMatch[1] : null

    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center p-8">
        {/* Quote at top */}
        <div className="text-center mb-12 w-full">
          <div className="text-xl md:text-2xl lg:text-3xl font-serif font-bold text-gray-900 leading-relaxed mb-4">
            {quote}
          </div>
          {author && (
            <div className="text-base md:text-lg lg:text-xl font-serif text-gray-900 text-right pr-8 md:pr-12 lg:pr-16">
              - {author}
            </div>
          )}
        </div>
        
        {/* Content below */}
        {contentText && (
          <div className="w-full max-w-4xl text-center">
            <div className="text-base md:text-lg lg:text-xl font-serif text-gray-900 leading-relaxed whitespace-pre-line">
              {contentText}
            </div>
          </div>
        )}
      </div>
    )
  }

  // No separator - just show text
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-8">
      <div className="text-center w-full">
        <div className="text-base md:text-lg lg:text-xl font-serif text-gray-900 leading-relaxed whitespace-pre-line">
          {overlayText}
        </div>
      </div>
    </div>
  )
}
