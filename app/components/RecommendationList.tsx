'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { RecommendedAnime, InfluentialFactor } from '../../types/anime'
import { HelpCircle, X, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

interface RecommendationListProps {
  recommendations: RecommendedAnime[]
  onRemoveFactor: (factor: InfluentialFactor) => void
}

export default function RecommendationList({ recommendations, onRemoveFactor }: RecommendationListProps) {
  const [expanded, setExpanded] = useState<number | null>(null)
  const [showPopup, setShowPopup] = useState(false)
  const [expandedFactors, setExpandedFactors] = useState<{ [key: number]: boolean }>({})
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

  // Toggle expanded factors for an anime
  const toggleFactors = (animeId: number) => {
    setExpandedFactors(prev => ({
      ...prev,
      [animeId]: !prev[animeId]
    }))
  }

  // Render factor badges for an anime
  const renderFactorBadges = (anime: RecommendedAnime) => {
    const isExpanded = expandedFactors[anime.id] || false
    const factors = isExpanded ? anime.influentialFactors : anime.influentialFactors.slice(0, 3)

    return (
      <>
        <div className="flex flex-wrap gap-2 mb-2">
          {factors.map((factor, index) => (
            <FactorBadge
              key={index}
              factor={factor}
              onRemove={() => onRemoveFactor(factor)}
            />
          ))}
        </div>
        {anime.influentialFactors.length > 3 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleFactors(anime.id)
            }}
            className="text-sm text-blue-500 hover:text-blue-700 focus:outline-none"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="inline-block mr-1" size={16} />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="inline-block mr-1" size={16} />
                Show more
              </>
            )}
          </button>
        )}
      </>
    )
  }

  return (
    <div className="space-y-4 relative">
      <h2 className="text-2xl font-semibold mb-4">Recommended Anime</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((anime) => (
          <div
            key={anime.id}
            className="bg-white shadow-md rounded-lg p-4 cursor-pointer"
            onClick={() => setExpanded(expanded === anime.id ? null : anime.id)}
          >
            <div className="flex items-center space-x-4">
              <Image
                src={anime.coverImage || '/placeholder.svg'}
                alt={anime.title || 'Anime cover'}
                width={50}
                height={75}
                className="rounded-md object-cover"
              />
              <div>
                <h3 className="text-lg font-medium">
                  {anime.title}
                </h3>
                <p className="text-sm text-gray-600">
                  Predicted Rating: {anime.predictedRating.toFixed(2)}
                </p>
              </div>
            </div>
            {expanded === anime.id && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">
                  Recommended to you because:
                </p>
                {renderFactorBadges(anime)}
                <div className="flex items-center space-x-2 mt-4">
                  <a
                    href={`https://anilist.co/anime/${anime.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    View on AniList
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowPopup(true)
                    }}
                    className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
                    aria-label="Show recommendation info"
                  >
                    <HelpCircle size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div ref={popupRef} className="bg-white p-6 rounded-lg shadow-lg max-w-md">
            <h4 className="text-lg font-semibold mb-2">How recommendations work</h4>
            <p className="text-sm text-gray-600">
              This anime was recommended based on your viewing history, preferences, and recommendations from users with similar taste. The predicted rating is
              calculated using a weighted system that considers your ratings, watch time for similar genres and
              tags, and how often this anime is recommended to fans of anime you've enjoyed.
            </p>
            <button
              onClick={() => setShowPopup(false)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface FactorBadgeProps {
  factor: InfluentialFactor
  onRemove: () => void
}

function FactorBadge({ factor, onRemove }: FactorBadgeProps) {
  const getFactorLink = () => {
    if (factor.id) {
      switch (factor.type) {
        case 'staff':
          return `https://anilist.co/staff/${factor.id}`;
        case 'studio':
          return `https://anilist.co/studio/${factor.id}`;
        case 'voiceActor':
          return `https://anilist.co/staff/${factor.id}`;
        case 'parent':
          return `https://anilist.co/anime/${factor.id}`;
        default:
          return null;
      }
    }
    return null;
  };

  const link = getFactorLink();

  return (
    <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline flex items-center"
          onClick={(e) => e.stopPropagation()}
        >
          {factor.name}
          <ExternalLink size={12} className="ml-1" />
        </a>
      ) : (
        factor.name
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="ml-1 text-blue-500 hover:text-blue-700 focus:outline-none"
      >
        <X size={12} />
      </button>
    </span>
  );
}
