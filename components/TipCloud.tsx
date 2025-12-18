'use client'

interface TipCloudProps {
  tip: string
}

export function TipCloud({ tip }: TipCloudProps) {
  return (
    <div className="tip-cloud relative bg-gray-800/80 backdrop-blur-sm border border-gray-700 p-4 shadow-lg">
      <p className="text-white text-sm leading-relaxed">{tip}</p>
    </div>
  )
}

