'use client'

import { useState, useEffect, useCallback } from 'react'
import { gql, ApolloError } from '@apollo/client'
import client from '../../lib/apollo-client'
import { calculateWeightedRatings } from '../../utils/weightedRatings'
import { UserAnimeList, RecommendedAnime, AnimeEntry, StaffMember, InfluentialFactor } from '../../types/anime'
import RecommendationList from './RecommendationList'

// GraphQL queries
const GET_USER_ANIME_LIST = gql`
  query GetUserAnimeList($username: String!) {
    MediaListCollection(userName: $username, type: ANIME) {
      lists {
        entries {
          id
          score
          progress
          repeat
          status
          media {
            id
            title {
              romaji
            }
            genres
            tags {
              name
              rank
            }
            meanScore
            duration
            episodes
            staff {
              edges {
                node {
                  id
                }
              }
            }
            studios {
              edges {
                node {
                  id
                }
              }
            }
            characters {
              edges {
                voiceActors {
                  id
                }
              }
            }
            recommendations(sort: RATING_DESC, page: 1, perPage: 5) {
              nodes {
                mediaRecommendation {
                  id
                }
                rating
              }
            }
          }
        }
      }
    }
  }
`

const GET_RECOMMENDED_ANIME = gql`
  query GetRecommendedAnime($ids: [Int]) {
    Page(page: 1, perPage: 50) {
      media(id_in: $ids, type: ANIME) {
        id
        title {
          romaji
        }
        genres
        tags {
          name
          rank
        }
        meanScore
        coverImage {
          medium
        }
        staff {
          edges {
            node {
              id
            }
          }
        }
        studios {
          edges {
            node {
              id
            }
          }
        }
        characters {
          edges {
            voiceActors {
              id
            }
          }
        }
      }
    }
  }
`

// Helper functions for data fetching
async function fetchUserAnimeList(username: string): Promise<UserAnimeList[]> {
  console.log(`Fetching anime list for user: ${username}`)
  try {
    const { data } = await client.query({
      query: GET_USER_ANIME_LIST,
      variables: { username },
    })
    if (!data?.MediaListCollection?.lists) {
      console.error('Invalid data structure received from API')
      return []
    }
    return data.MediaListCollection.lists.flatMap((list: any) => list.entries || [])
  } catch (error) {
    console.error('Error fetching user anime list:', error)
    if (error instanceof ApolloError) {
      console.error('GraphQL Errors:', error.graphQLErrors)
      console.error('Network Error:', error.networkError)
    }
    throw error
  }
}

async function fetchRecommendedAnimeDetails(ids: number[]): Promise<AnimeEntry[]> {
  console.log(`Fetching details for ${ids.length} recommended anime`)
  try {
    const { data } = await client.query({
      query: GET_RECOMMENDED_ANIME,
      variables: { ids },
    })
    if (!data.Page || !data.Page.media) {
      console.error('Invalid data structure received from API')
      return []
    }
    return data.Page.media
  } catch (error) {
    console.error(`Error fetching recommended anime details:`, error)
    if (error instanceof ApolloError) {
      console.error('GraphQL Errors:', error.graphQLErrors)
      console.error('Network Error:', error.networkError)
    }
    throw error
  }
}

interface AnimeRecommenderProps {
  username: string
}

export default function AnimeRecommender({ username }: AnimeRecommenderProps) {
  const [recommendedAnime, setRecommendedAnime] = useState<AnimeEntry[]>([])
  const [recommendations, setRecommendations] = useState<RecommendedAnime[]>([])
  const [error, setError] = useState<string | null>(null)
  const [removedFactors, setRemovedFactors] = useState<string[]>([])
  const [userAnimeList, setUserAnimeList] = useState<UserAnimeList[]>([])
  const [staffMembers, setStaffMembers] = useState<{ [id: number]: string }>({})
  const [mappings, setMappings] = useState<{
    genreMapping: any;
    tagMapping: any;
    staffMapping: any;
    studioMapping: any;
    voiceActorMapping: any;
    meanScore: number;
  } | null>(null)

  // Fetch recommendations data
  const fetchRecommendations = useCallback(async () => {
    try {
      const fetchedUserAnimeList = await fetchUserAnimeList(username)
      const filteredUserAnimeList = fetchedUserAnimeList.filter(
        entry => entry.status !== 'PLANNING' && entry.status !== 'DROPPED'
      )
      setUserAnimeList(filteredUserAnimeList)

      if (filteredUserAnimeList.length === 0) {
        setError("No anime found in the user's list. Please make sure you've added anime to your AniList profile.")
        return
      }

      const { genreMapping, tagMapping, staffMapping, studioMapping, voiceActorMapping, watchedAnimeIds, meanScore } = calculateWeightedRatings(filteredUserAnimeList)
      setMappings({ genreMapping, tagMapping, staffMapping, studioMapping, voiceActorMapping, meanScore })
      
      // Collect recommendation IDs from user's watched anime
      let recommendationIds = new Set<number>()
      filteredUserAnimeList.forEach(entry => {
        if (entry.score > 0 && entry.media && entry.media.recommendations) {
          entry.media.recommendations.nodes?.forEach(rec => {
            if (rec && rec.mediaRecommendation && rec.mediaRecommendation.id && !watchedAnimeIds.includes(rec.mediaRecommendation.id)) {
              recommendationIds.add(rec.mediaRecommendation.id)
            }
          })
        }
      })

      if (recommendationIds.size === 0) {
        setError('No recommendations found. Please try again later or contact support if the issue persists.')
        return
      }

      // Fetch details for recommended anime
      const recommendedAnimeDetails = await fetchRecommendedAnimeDetails(Array.from(recommendationIds))
      setRecommendedAnime(recommendedAnimeDetails)

      if (recommendedAnimeDetails.length === 0) {
        setError('No recommendations found. Please try again later or contact support if the issue persists.')
        return
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error)
      if (error instanceof ApolloError) {
        console.error('GraphQL Errors:', error.graphQLErrors)
        console.error('Network Error:', error.networkError)
      }
      setError('An error occurred while fetching recommendations. Please try again later.')
    }
  }, [username])

  // Predict rating for a single anime
  const predictRating = useCallback((
    anime: AnimeEntry,
    genreMapping: any,
    tagMapping: any,
    staffMapping: any,
    studioMapping: any,
    voiceActorMapping: any,
    meanScore: number,
    parentEntry: UserAnimeList | null,
    removedFactors: string[]
  ): { rating: number; factors: InfluentialFactor[] } => {
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
  }, [staffMembers])

  // Calculate recommendations based on user's anime list and preferences
  const calculateRecommendations = useCallback(() => {
    if (!mappings || recommendedAnime.length === 0) return

    const { genreMapping, tagMapping, staffMapping, studioMapping, voiceActorMapping, meanScore } = mappings

    const predictedRecommendations = recommendedAnime
      .map((anime) => {
        if (!anime || !anime.id || !anime.title || !anime.title.romaji) {
          console.error('Invalid anime data:', anime)
          return null
        }
        const parentEntry = userAnimeList.find(entry => 
          entry.media.recommendations?.nodes?.some(rec => rec.mediaRecommendation && rec.mediaRecommendation.id === anime.id)
        )
        const { rating, factors } = predictRating(
          anime,
          genreMapping,
          tagMapping,
          staffMapping,
          studioMapping,
          voiceActorMapping,
          meanScore,
          parentEntry || null,
          removedFactors
        )

        return {
          id: anime.id,
          title: anime.title.romaji,
          predictedRating: rating,
          coverImage: anime.coverImage?.medium || '',
          influentialFactors: factors,
          recommendationRating: parentEntry ? parentEntry.media.recommendations?.nodes?.find(rec => rec.mediaRecommendation && rec.mediaRecommendation.id === anime.id)?.rating || 0 : 0
        }
      })
      .filter((recommendation): recommendation is RecommendedAnime => recommendation !== null)
      .sort((a, b) => b.predictedRating - a.predictedRating)
      .slice(0, 60) // Limit to top 60 recommendations

    setRecommendations(predictedRecommendations)
  }, [recommendedAnime, mappings, userAnimeList, removedFactors, predictRating])

  useEffect(() => {
    fetchRecommendations().catch(error => {
      console.error('Error in fetchRecommendations:', error)
      setError('An unexpected error occurred. Please try again later.')
    })
  }, [fetchRecommendations])

  useEffect(() => {
    calculateRecommendations()
  }, [calculateRecommendations])

  // Handle removal of factors from recommendations
  const handleRemoveFactor = useCallback((factor: InfluentialFactor) => {
    setRemovedFactors(prev => {
      switch(factor.type) {
        case 'parent':
          return [...prev, 'Parent Recommendation'];
        case 'staff':
          return [...prev, 'Staff'];
        case 'studio':
          return [...prev, 'Studio'];
        case 'voiceActor':
          return [...prev, 'Voice Actor'];
        case 'genre':
        case 'tag':
          return [...prev, factor.name];
        default:
          return prev;
      }
    });
  }, []);

  if (error) {
    return <div className="text-center mt-8 text-red-500">{error}</div>
  }

  if (recommendations.length === 0) {
    return <div className="text-center mt-8">Loading recommendations...</div>
  }

  return <RecommendationList recommendations={recommendations} onRemoveFactor={handleRemoveFactor} />
}
