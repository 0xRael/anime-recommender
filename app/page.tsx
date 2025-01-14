'use client'

import { useState } from 'react'
import { Suspense } from 'react'
import AnimeRecommender from './components/AnimeRecommender'
import UsernameForm from './components/UsernameForm'

export default function Home() {
  const [username, setUsername] = useState<string | null>(null)

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">Anime Recommender</h1>
      <UsernameForm onUsernameSubmit={setUsername} />
      {username && (
        <Suspense fallback={<div className="text-center mt-8">Loading recommendations...</div>}>
          <AnimeRecommender username={username} />
        </Suspense>
      )}
    </main>
  )
}
