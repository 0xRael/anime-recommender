import { AnimeEntry, UserAnimeList, InfluentialFactor } from '../../../types/anime'

export function predictRating(
  anime: AnimeEntry,
  genreMapping: any,
  tagMapping: any,
  staffMapping: any,
  studioMapping: any,
  voiceActorMapping: any,
  meanScore: number,
  parentEntry: UserAnimeList | null,
  removedFactors: string[],
  staffMembers: { [id: number]: string }
): { rating: number; factors: InfluentialFactor[] } {
  let totalScore = 0
  let totalWeight = 0
  const factors: InfluentialFactor[] = []

  const updateScore = (mapping: any, id: number, weight: number = 1, name: string, type: 'staff' | 'studio' | 'voiceActor') => {
    if (mapping[id]) {
      const influence = mapping[id].score * mapping[id].hours * weight
      totalScore += influence
      totalWeight += mapping[id].hours * weight
      factors.push({ name, influence, id, type })
    }
  }

  // Genre and tag influence (70%)
  anime.genres.forEach((genre: string) => {
    if (!removedFactors.includes(genre)) {
      const normalizedGenre = genre.toLowerCase().replace(/\s+/g, '')
      if (genreMapping[normalizedGenre]) {
        const influence = genreMapping[normalizedGenre].score * genreMapping[normalizedGenre].hours
        totalScore += influence
        totalWeight += genreMapping[normalizedGenre].hours
        factors.push({ name: genre, influence, id: 0, type: 'genre' })
      }
    }
  })
  anime.tags.forEach((tag: { name: string; rank: number }) => {
    if (!removedFactors.includes(tag.name)) {
      const normalizedTag = tag.name.toLowerCase().replace(/\s+/g, '')
      if (tagMapping[normalizedTag]) {
        const influence = tagMapping[normalizedTag].score * tagMapping[normalizedTag].hours * (tag.rank / 100)
        totalScore += influence
        totalWeight += tagMapping[normalizedTag].hours * (tag.rank / 100)
        factors.push({ name: tag.name, influence, id: 0, type: 'tag' })
      }
    }
  })

  // Staff, studio, and voice actor influence (30%)
  if (!removedFactors.includes('Staff')) {
    anime.staff.edges.forEach((edge: any) => updateScore(staffMapping, edge.node.id, 0.5, staffMembers[edge.node.id] || `Staff ID: ${edge.node.id}`, 'staff'))
  }
  if (!removedFactors.includes('Studio')) {
    anime.studios.edges.forEach((edge: any) => updateScore(studioMapping, edge.node.id, 0.5, `Studio ID: ${edge.node.id}`, 'studio'))
  }
  if (!removedFactors.includes('Voice Actor')) {
    anime.characters.edges.forEach((edge: any) => {
      if (edge.voiceActors && edge.voiceActors.length > 0) {
        updateScore(voiceActorMapping, edge.voiceActors[0].id, 0.5, `Voice Actor ID: ${edge.voiceActors[0].id}`, 'voiceActor')
      }
    })
  }

  // Parent recommendation influence
  if (parentEntry && !removedFactors.includes('Parent Recommendation')) {
    const parentWatchTime = (parentEntry.media.duration * parentEntry.progress) / 60
    const parentWeight = parentWatchTime
    totalScore += parentEntry.score * parentWeight
    totalWeight += parentWeight
    factors.push({
      name: `Parent Recommendation: ${parentEntry.media.title.romaji}`,
      influence: parentEntry.score * parentWeight,
      id: parentEntry.media.id,
      type: 'parent'
    })
  }

  const weightedScore = totalWeight > 0 ? totalScore / totalWeight : 0
  const rating = weightedScore + meanScore
  
  if (totalWeight === 0) {
    totalWeight = 1
  }
  
  // Sort factors by influence and take top 10
  factors.sort((a, b) => b.influence - a.influence)
  const topFactors = factors.slice(0, 10).map(factor => ({
    ...factor,
    influence: Math.round((factor.influence / totalScore) * 100)
  }))

  return { rating, factors: topFactors }
}
