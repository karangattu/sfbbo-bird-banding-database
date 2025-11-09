import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Bird Photo Tagger",
  description: "Tag and search bird banding photos from Google Drive",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">{children}</body>
    </html>
  )
}
