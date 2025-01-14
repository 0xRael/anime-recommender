import Image from 'next/image'
import { RecommendedAnime, InfluentialFactor } from '../../../types/anime'
import FactorBadges from './FactorBadges'
import { HelpCircle } from 'lucide-react'

interface AnimeCardProps {
  anime: RecommendedAnime
  expanded: boolean
  onExpand: () => void
  onRemoveFactor: (factor: InfluentialFactor) => void
  onShowPopup: () => void
}

export default function AnimeCard({ anime, expanded, onExpand, onRemoveFactor, onShowPopup }: AnimeCardProps) {
  return (
    <div
      className="bg-gray-800 shadow-md rounded-lg p-4 cursor-pointer"
      onClick={onExpand}
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
        <h3 className="text-lg font-medium text-white">
        {anime.title}
        </h3>
        <p className="text-sm text-gray-400">
        Predicted Rating: {anime.predictedRating.toFixed(2)}
        </p>
      </div>
      </div>
      {expanded && (
      <div className="mt-4">
        <p className="text-sm text-gray-400 mb-2">
        Recommended to you because:
        </p>
        <FactorBadges factors={anime.influentialFactors} onRemoveFactor={onRemoveFactor} />
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
          onShowPopup()
          }}
          className="p-1 text-gray-400 hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
          aria-label="Show recommendation info"
        >
          <HelpCircle size={20} />
        </button>
        </div>
      </div>
      )}
    </div>
  )
}

