export interface CastMember {
  id: number;
  name: string;
  character?: string;
  job?: string;
  profile_path?: string;
  order?: number;
  known_for_department?: string;
}

export interface SeriesDataProp {
  name?: string;
  title?: string;
  genres?: { id: number; name: string }[];
  genre?: { genres?: string[] };
  origin_country?: string[];
}

export interface AnimeCharacterData {
  character: {
    name: string;
    native?: string;
    image?: string;
  };
  role: string;
  voice_actors?: VoiceActorRef[];
}

export interface VoiceActorRef {
  person: {
    id: number;
    name: string;
    native?: string;
    image?: string;
  };
  language: string;
}

export interface PersonDetailsData {
  name: string;
  profile_path?: string;
  known_for_department?: string;
  birthday?: string;
  credits: CreditItem[];
}

export interface CreditItem {
  id: number;
  title?: string;
  name?: string;
  character?: string;
  job?: string;
  poster_path?: string;
  media_type?: string;
  vote_average?: number;
  popularity?: number;
  release_date?: string;
  first_air_date?: string;
}

export interface VoiceActorDetailsData {
  name: { full: string; native?: string };
  image?: { large?: string };
  age?: number;
  dateOfBirth?: { year?: number; month?: number; day?: number };
  characterMedia?: {
    edges?: CharacterMediaEdge[];
  };
}

export interface CharacterMediaEdge {
  node: {
    id: number;
    title: { romaji?: string; english?: string };
    type?: string;
    coverImage?: { large?: string };
    startDate?: { year?: number };
    meanScore?: number;
  };
  characters?: { id: number; name: { full: string } }[];
  characterRole?: string;
}

export interface CastCrewProps {
  tmdbId: number;
  mediaType: 'tv' | 'movie';
  onPersonClick?: (personId: number) => void;
  seriesData?: SeriesDataProp;
}
