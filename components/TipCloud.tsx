'use client'

interface TipCloudProps {
  tip: string
}

export function TipCloud({ tip }: TipCloudProps) {
  return (
    <div className="tip-cloud relative bg-gray-800 p-4 shadow-md border border-gray-700">
      <p className="text-white text-sm leading-relaxed">{tip}</p>
    </div>
  )
}

