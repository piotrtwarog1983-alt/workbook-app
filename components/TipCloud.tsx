'use client'

interface TipCloudProps {
  tip: string
}

export function TipCloud({ tip }: TipCloudProps) {
  return (
    <div className="tip-cloud relative bg-white p-4 shadow-md">
      <p className="text-gray-800 text-sm leading-relaxed">{tip}</p>
    </div>
  )
}

