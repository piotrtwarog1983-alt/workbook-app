import './globals.css'

export const metadata = {
  title: 'WorkBook - Kurs Fotografii Kulinarnej',
  description: 'Naucz się robić profesjonalne zdjęcia potraw smartfonem',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl">
      <body>
        {children}
      </body>
    </html>
  )
}
