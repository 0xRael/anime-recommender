'use client'

import { useState, useEffect, useRef } from 'react'
import { RecommendedAnime, InfluentialFactor } from '../../../types/anime'
import AnimeCard from './AnimeCard'
import InfoPopup from './InfoPopup'

interface RecommendationListProps {
  recommendations: RecommendedAnime[]
  onRemoveFactor: (factor: InfluentialFactor) => void
}

export default function RecommendationList({ recommendations, onRemoveFactor }: RecommendationListProps) {
  const [expanded, setExpanded] = useState<number | null>(null)
  const [showPopup, setShowPopup] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

  // Handle click outside popup
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowPopup(false)
      }
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowPopup(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscapeKey)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [])

  return (
    <div className="space-y-4 relative">
      <h2 className="text-2xl font-semibold mb-4">Recommended Anime</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((anime) => (
          <AnimeCard
            key={anime.id}
            anime={anime}
            expanded={expanded === anime.id}
            onExpand={() => setExpanded(expanded === anime.id ? null : anime.id)}
            onRemoveFactor={onRemoveFactor}
            onShowPopup={() => setShowPopup(true)}
          />
        ))}
      </div>
      {showPopup && (
        <InfoPopup onClose={() => setShowPopup(false)} popupRef={popupRef} />
      )}
    </div>
  )
}

