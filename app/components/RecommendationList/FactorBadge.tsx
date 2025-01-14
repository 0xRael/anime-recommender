import { InfluentialFactor } from '../../../types/anime'
import { X, ExternalLink } from 'lucide-react'

interface FactorBadgeProps {
  factor: InfluentialFactor
  onRemove: () => void
}

export default function FactorBadge({ factor, onRemove }: FactorBadgeProps) {
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
