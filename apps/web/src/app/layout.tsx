import type { Metadata } from 'next'
import './components/styles/tailwind.css'

export const metadata: Metadata = {
  title: 'QueryMindAI — Ask questions, not SQL',
  description: 'SQL Editor and AI Assistant',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-white">
        {children}
      </body>
    </html>
  )
}
