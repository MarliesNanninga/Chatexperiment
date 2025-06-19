import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sollicitatiegesprek Trainer - AI Interview Practice',
  description: 'Oefen je sollicitatievaardigheden met AI-powered gesprekssimulaties. Krijg feedback en bouw zelfvertrouwen op.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <body className="bg-gray-100 min-h-screen" suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  )
}