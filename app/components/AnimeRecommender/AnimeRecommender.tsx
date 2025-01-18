'use client'

import { useState, useEffect, useCallback } from 'react'
import { ApolloError } from '@apollo/client'
import { fetchUserAnimeList, fetchRecommendedAnimeDetails } from './api'
import { calculateWeightedRatings } from '../../../utils/weightedRatings'
import { UserAnimeList, RecommendedAnime, AnimeEntry, InfluentialFactor } from '../../../types/anime'
import RecommendationList from '../RecommendationList/RecommendationList'
import { predictRating } from './utils'

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

      const newRecommendations = recommendedAnimeDetails.map(anime => {
        const { rating, factors } = predictRating(
          anime,
          genreMapping,
          tagMapping,
          staffMapping,
          studioMapping,
          voiceActorMapping,
          meanScore,
          filteredUserAnimeList.find(entry => entry.media.id === anime.id) || null,
          removedFactors,
          staffMembers
        )
        return {
          id: anime.id,
          title: anime.title.romaji,
          predictedRating: rating,
          coverImage: anime.coverImage?.medium || '',
          influentialFactors: factors,
          recommendationRating: 0 // or any other default value
        }
      })

      setRecommendations(newRecommendations.filter(rec => !isNaN(rec.predictedRating)))
    } catch (error) {
      console.error('Error fetching recommendations:', error)
      if (error instanceof ApolloError) {
        console.error('GraphQL Errors:', error.graphQLErrors)
        console.error('Network Error:', error.networkError)
      }
      setError('An error occurred while fetching recommendations. Please try again later.')
    }
  }, [username])

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
          removedFactors,
          staffMembers
        )

        const recommendationRating = parentEntry
          ? parentEntry.media.recommendations?.nodes?.find(rec => rec.mediaRecommendation && rec.mediaRecommendation.id === anime.id)?.rating ?? 0
          : 0

        return {
          id: anime.id,
          title: anime.title.romaji,
          predictedRating: rating,
          coverImage: anime.coverImage?.medium || '',
          influentialFactors: factors,
          recommendationRating: recommendationRating
        }
      })
      .filter((recommendation): recommendation is RecommendedAnime => recommendation !== null)
      .sort((a, b) => b.predictedRating - a.predictedRating)
      .slice(0, 60) // Limit to top 60 recommendations

    setRecommendations(predictedRecommendations)
  }, [recommendedAnime, mappings, userAnimeList, removedFactors, staffMembers])

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

