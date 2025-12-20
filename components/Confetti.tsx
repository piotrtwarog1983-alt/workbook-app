'use client'

import { useEffect, useState } from 'react'

interface ConfettiPiece {
  id: number
  x: number
  color: string
  delay: number
  duration: number
  size: number
  rotation: number
  rotationSpeed: number
  shape: 'square' | 'circle' | 'triangle'
}

const COLORS = [
  '#FFD700', // złoty
  '#FF6B6B', // czerwony
  '#4ECDC4', // turkusowy
  '#45B7D1', // niebieski
  '#96CEB4', // zielony
  '#FFEAA7', // żółty
  '#DDA0DD', // różowy
  '#98D8C8', // miętowy
  '#F7DC6F', // jasny żółty
  '#BB8FCE', // fioletowy
]

export function Confetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    // Generuj konfetti
    const generatePieces = () => {
      const newPieces: ConfettiPiece[] = []
      for (let i = 0; i < 150; i++) {
        newPieces.push({
          id: i,
          x: Math.random() * 100,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          delay: Math.random() * 3,
          duration: 3 + Math.random() * 4,
          size: 6 + Math.random() * 10,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 720,
          shape: ['square', 'circle', 'triangle'][Math.floor(Math.random() * 3)] as 'square' | 'circle' | 'triangle',
        })
      }
      setPieces(newPieces)
    }

    generatePieces()

    // Powtórz animację co 7 sekund
    const interval = setInterval(() => {
      generatePieces()
    }, 7000)

    return () => clearInterval(interval)
  }, [])

  if (!isActive) return null

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${piece.x}%`,
            top: '-20px',
            width: `${piece.size}px`,
            height: piece.shape === 'circle' ? `${piece.size}px` : `${piece.size * 0.6}px`,
            backgroundColor: piece.shape !== 'triangle' ? piece.color : 'transparent',
            borderRadius: piece.shape === 'circle' ? '50%' : '2px',
            borderLeft: piece.shape === 'triangle' ? `${piece.size / 2}px solid transparent` : 'none',
            borderRight: piece.shape === 'triangle' ? `${piece.size / 2}px solid transparent` : 'none',
            borderBottom: piece.shape === 'triangle' ? `${piece.size}px solid ${piece.color}` : 'none',
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            transform: `rotate(${piece.rotation}deg)`,
            '--rotation-speed': `${piece.rotationSpeed}deg`,
          } as React.CSSProperties}
        />
      ))}
      
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(var(--rotation-speed, 720deg)) scale(0.5);
            opacity: 0;
          }
        }
        
        .animate-confetti-fall {
          animation: confetti-fall linear forwards;
        }
      `}</style>
    </div>
  )
}




