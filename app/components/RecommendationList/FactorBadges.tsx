import { useState } from 'react'
import { InfluentialFactor } from '../../../types/anime'
import FactorBadge from './FactorBadge'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface FactorBadgesProps {
  factors: InfluentialFactor[]
  onRemoveFactor: (factor: InfluentialFactor) => void
}

export default function FactorBadges({ factors, onRemoveFactor }: FactorBadgesProps) {
  const [expanded, setExpanded] = useState(false)
  const displayedFactors = expanded ? factors : factors.slice(0, 3)

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-2">
        {displayedFactors.map((factor, index) => (
          <FactorBadge
            key={index}
            factor={factor}
            onRemove={() => onRemoveFactor(factor)}
          />
        ))}
      </div>
      {factors.length > 3 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
          className="text-sm text-blue-500 hover:text-blue-700 focus:outline-none"
        >
          {expanded ? (
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
