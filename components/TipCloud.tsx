'use client'

interface TipCloudProps {
  tip: string
}

export function TipCloud({ tip }: TipCloudProps) {
  return (
    <div className="tip-cloud relative p-4 w-full max-w-full">
      <p className="text-white/90 text-sm leading-relaxed break-words">{tip}</p>
    </div>
  )
}

