'use client'

import { useState } from 'react'

interface UsernameFormProps {
  onUsernameSubmit: (username: string) => void
}

export default function UsernameForm({ onUsernameSubmit }: UsernameFormProps) {
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim()) {
      setIsLoading(true)
      setMessage('')
      try {
        // Simulate an API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        onUsernameSubmit(username.trim())
        setMessage('Username set successfully. Fetching recommendations...')
      } catch (error) {
        setMessage('Failed to set username. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-md mx-auto mb-8">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Enter your AniList username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Get Recommendations'}
        </button>
      </div>
      {message && (
        <p className={`text-sm ${message.includes('Failed') ? 'text-red-500' : 'text-green-500'}`}>
          {message}
        </p>
      )}
    </form>
  )
}
