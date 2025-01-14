import './globals.css'

export const metadata = {
  title: 'Anime Recommender',
  description: 'Get personalized anime recommendations based on your AniList profile',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-100 text-gray-900 font-sans dark:bg-gray-900 dark:text-gray-100">{children}</body>
    </html>
  )
}
