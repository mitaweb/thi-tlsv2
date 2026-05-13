import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TLSV2 - Thi Trực Tuyến',
  description: 'Hệ thống thi trực tuyến',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  )
}
