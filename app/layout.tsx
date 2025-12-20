import './globals.css'
import { Providers } from '@/components/Providers'

export const metadata = {
  title: 'WorkBook - Kurs Fotografii Kulinarnej',
  description: 'Naucz się robić profesjonalne zdjęcia potraw smartfonem',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl" className="overflow-x-hidden">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className="overflow-x-hidden max-w-[100vw]">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
