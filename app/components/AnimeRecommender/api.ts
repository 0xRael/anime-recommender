import { gql } from '@apollo/client'
import client from '../../../lib/apollo-client'
import { UserAnimeList, AnimeEntry } from '../../../types/anime'

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

export async function fetchUserAnimeList(username: string): Promise<UserAnimeList[]> {
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
    throw error
  }
}

export async function fetchRecommendedAnimeDetails(ids: number[]): Promise<AnimeEntry[]> {
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
    throw error
  }
}
