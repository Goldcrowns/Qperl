import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'qperl — your AI workspace',
  description: 'Compare, create and collaborate with the best AI models in one beautiful workspace.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body>{children}</body></html>
}
