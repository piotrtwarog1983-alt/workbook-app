'use client'

interface TipCloudProps {
  tip: string
}

export function TipCloud({ tip }: TipCloudProps) {
  return (
    <div className="tip-cloud relative rounded-lg p-3">
      <p className="text-white/95 text-sm leading-relaxed">{tip}</p>
    </div>
  )
}

