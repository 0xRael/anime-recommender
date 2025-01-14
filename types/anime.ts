export interface AnimeEntry {
    id: number
    title: {
      romaji: string
    }
    genres: string[]
    tags: {
      name: string
      rank: number
    }[]
    coverImage: {
      medium: string
    }
    meanScore: number
    duration: number
    episodes: number
    staff: {
      edges: {
        node: {
          id: number
        }
      }[]
    }
    studios: {
      edges: {
        node: {
          id: number
        }
      }[]
    }
    characters: {
      edges: {
        voiceActors: {
          id: number
        }[]
      }[]
    }
    recommendations: {
      nodes: {
        mediaRecommendation: {
          id: number
        }
        rating: number
      }[]
    }
  }
  
  export interface UserAnimeList {
    id: number
    score: number
    progress: number
    repeat: number
    media: AnimeEntry
    status: string;
  }
  
  export interface GenreTagMapping {
    [key: string]: {
      score: number
      hours: number
    }
  }
  
  export interface StaffMapping {
    [key: number]: {
      score: number
      hours: number
    }
  }
  
  export interface StudioMapping {
    [key: number]: {
      score: number
      hours: number
    }
  }
  
  export interface VoiceActorMapping {
    [key: number]: {
      score: number
      hours: number
    }
  }
  
  export interface InfluentialFactor {
    name: string;
    influence: number;
    id?: number;
    type: 'staff' | 'studio' | 'voiceActor' | 'parent' | 'genre' | 'tag';
  }
  
  export interface RecommendedAnime {
    id: number
    title: string
    predictedRating: number
    coverImage: string
    influentialFactors: InfluentialFactor[]
    recommendationRating: number
    genres?: string[]
    tags?: { name: string; rank: number }[]
    meanScore?: number
    staff?: { node: { id: number } }[]
    studios?: { node: { id: number } }[]
    characters?: { voiceActors: { id: number }[] }[]
  }
  
  export interface StaffMember {
    id: number
    name: {
      full: string
    }
  }
  