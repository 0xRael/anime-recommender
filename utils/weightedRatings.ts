import { UserAnimeList, GenreTagMapping, StaffMapping, StudioMapping, VoiceActorMapping } from '../types/anime'

function normalizeString(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '')
}

export function calculateWeightedRatings(userAnimeList: UserAnimeList[]): {
  genreMapping: GenreTagMapping;
  tagMapping: GenreTagMapping;
  staffMapping: StaffMapping;
  studioMapping: StudioMapping;
  voiceActorMapping: VoiceActorMapping;
  watchedAnimeIds: number[];
  meanScore: number;
} {
  const genreMapping: GenreTagMapping = {}
  const tagMapping: GenreTagMapping = {}
  const staffMapping: StaffMapping = {}
  const studioMapping: StudioMapping = {}
  const voiceActorMapping: VoiceActorMapping = {}
  const watchedAnimeIds: number[] = []
  
  let totalScore = 0
  let totalEntries = 0

  userAnimeList.forEach((entry) => {
    if (entry.score > 0) {
      totalScore += entry.score
      totalEntries++
    }
  })

  const meanScore = totalEntries > 0 ? totalScore / totalEntries : 0

  userAnimeList.forEach((entry) => {
    const { score, media, progress } = entry
    const watchHours = (media.duration * progress) / 60
    const rewatchCount = entry.repeat || 0
    const adjustedWatchHours = watchHours * (rewatchCount + 1)

    watchedAnimeIds.push(media.id)

    const updateMapping = (mapping: GenreTagMapping | StaffMapping | StudioMapping | VoiceActorMapping, key: string | number) => {
      if (typeof key === 'string' && 'string' in mapping) {
        if (!mapping[key]) {
          (mapping as GenreTagMapping)[key] = { score: 0, hours: 0 };
        }
        if (score > 0) {
          (mapping as GenreTagMapping)[key].score += (score - meanScore) * adjustedWatchHours;
        }
        (mapping as GenreTagMapping)[key].hours += adjustedWatchHours;
      } else if (typeof key === 'number' && 'number' in mapping) {
        if (!mapping[key]) {
          (mapping as StaffMapping | StudioMapping | VoiceActorMapping)[key] = { score: 0, hours: 0 };
        }
        if (score > 0) {
          (mapping as StaffMapping | StudioMapping | VoiceActorMapping)[key].score += (score - meanScore) * adjustedWatchHours;
        }
        (mapping as StaffMapping | StudioMapping | VoiceActorMapping)[key].hours += adjustedWatchHours;
      }
    };
    
    if(score > 0){
      media.genres.forEach(genre => updateMapping(genreMapping, normalizeString(genre)))
      media.tags.forEach(tag => updateMapping(tagMapping, normalizeString(tag.name)))
      media.staff.edges.forEach(edge => updateMapping(staffMapping, edge.node.id))
      media.studios.edges.forEach(edge => updateMapping(studioMapping, edge.node.id))
      media.characters.edges.forEach(edge => {
        if (edge.voiceActors && edge.voiceActors.length > 0) {
          updateMapping(voiceActorMapping, edge.voiceActors[0].id)
        }
      })
    }
  })

  // Normalize scores
  const normalizeMapping = (mapping: GenreTagMapping | StaffMapping | StudioMapping | VoiceActorMapping) => {
    Object.keys(mapping).forEach((key) => {
      if (typeof key === 'string' && 'string' in mapping) {
        (mapping as GenreTagMapping)[key].score /= (mapping as GenreTagMapping)[key].hours;
      } else if (typeof key === 'number' && 'number' in mapping) {
        (mapping as StaffMapping | StudioMapping | VoiceActorMapping)[key].score /= (mapping as StaffMapping | StudioMapping | VoiceActorMapping)[key].hours;
      }
    });
  };

  normalizeMapping(genreMapping)
  normalizeMapping(tagMapping)
  normalizeMapping(staffMapping)
  normalizeMapping(studioMapping)
  normalizeMapping(voiceActorMapping)

  return { genreMapping, tagMapping, staffMapping, studioMapping, voiceActorMapping, watchedAnimeIds, meanScore }
}
