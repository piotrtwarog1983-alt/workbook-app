'use client'

import Link from 'next/link'

export default function Home() {
  const lemonSqueezyCheckoutUrl = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL || 'https://your-store.lemonsqueezy.com/checkout/buy/your-product-id'

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-6 text-gray-900">
            WorkBook
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Naucz się robić profesjonalne zdjęcia potraw smartfonem
          </p>
          <p className="text-lg text-gray-500 mb-8">
            W ciągu jednego dnia nauczysz się robić zdjęcia warte Twoich dań
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-semibold mb-4">Co zawiera kurs?</h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">✓</span>
              <span>Podstawy fotografii kulinarnej</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">✓</span>
              <span>Zdjęcia z góry na białym tle</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">✓</span>
              <span>Ustawienia smartfona</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">✓</span>
              <span>Praktyczne ćwiczenia</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">✓</span>
              <span>Tipy i wskazówki od profesjonalisty</span>
            </li>
          </ul>
        </div>

        <div className="text-center">
          <a
            href={lemonSqueezyCheckoutUrl}
            className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Kup teraz
          </a>
        </div>

        <div className="mt-12 text-center text-gray-500">
          <p>Po zakupie otrzymasz email z linkiem do założenia konta</p>
        </div>
      </div>
    </div>
  )
}

