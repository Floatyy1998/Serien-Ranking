import {
  Add as AddIcon,
  CalendarToday,
  Check as CheckIcon,
  CheckCircle,
  Close as CloseIcon,
  Movie as MovieIcon,
  Tv as TvIcon,
  Group as GroupIcon,
  Brush,
  Star,
  TheaterComedy,
  Warning,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../App";
import { colors } from "../../../theme";
import { useMovieList } from "../../../contexts/MovieListProvider";
import { useSeriesList } from "../../../contexts/OptimizedSeriesListProvider";
import { translateJob } from "../../../services/tmdbJobTranslations";

interface TmdbDialogProps {
  open: boolean;
  loading: boolean;
  data: any;
  type: "movie" | "tv";
  onClose: () => void;
  onAdd?: () => void;
  adding?: boolean;
  showAddButton?: boolean;
  viewOnlyMode?: boolean;
}

const TmdbDialog: React.FC<TmdbDialogProps> = ({
  open,
  loading,
  data,
  type,
  onClose,
  onAdd,
  adding = false,
}) => {
  // Suchfeld für Cast/Crew
  const [searchTerm, setSearchTerm] = useState("");
  const auth = useAuth();
  const user = auth?.user;
  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();

  // Tab State
  const [currentTab, setCurrentTab] = useState(0);
  const [castData, setCastData] = useState<any[]>([]);
  const [crewData, setCrewData] = useState<any[]>([]);
  const [castLoading, setCastLoading] = useState(false);
  const [videosData, setVideosData] = useState<any[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [personDialogOpen, setPersonDialogOpen] = useState(false);
  const [personLoading, setPersonLoading] = useState(false);
  const [personCredits, setPersonCredits] = useState<any>({
    cast: [],
    crew: [],
  });
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [addingTitles, setAddingTitles] = useState<Set<number>>(new Set());
  const [animeCharacters, setAnimeCharacters] = useState<any[]>([]);
  const [animeLoading, setAnimeLoading] = useState(false);
  
  // Snackbar State für Feedback
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Cast Data vorab laden beim Dialog öffnen
  useEffect(() => {
    if (data?.id && open) {
      // Anime-Erkennung - Japanische, chinesische und koreanische Animation
      const isAnime = data.origin_country?.some((country: string) =>
        ["JP", "CN", "KR"].includes(country),
      );

      if (isAnime) {
        // Bei Anime: Charaktere + Crew laden
        fetchAnimeCharacters();
        fetchCastData(data.id); // Für Crew-Daten
      } else {
        // Bei Non-Anime: Normal Cast + Crew laden
        fetchCastData(data.id);
      }
    }
  }, [data?.id, open, type]);

  // Videos Data laden
  useEffect(() => {
    if (data?.id && open && currentTab === 2) {
      fetchVideosData(data.id);
    }
  }, [data?.id, open, currentTab, type]);

  const fetchCastData = async (tmdbId: number) => {
    try {
      setCastLoading(true);
      const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;
      let url = "";
      if (type === "tv") {
        url = `https://api.themoviedb.org/3/tv/${tmdbId}/aggregate_credits?api_key=${TMDB_API_KEY}&language=de-DE`;
      } else {
        url = `https://api.themoviedb.org/3/movie/${tmdbId}/credits?api_key=${TMDB_API_KEY}&language=de-DE`;
      }
      const response = await fetch(url);
      const result = await response.json();
      setCastData(result.cast || []);
      setCrewData(result.crew || []);
    } catch (error) {
      // console.error("Error fetching cast data:", error);
      setCastData([]);
      setCrewData([]);
    } finally {
      setCastLoading(false);
    }
  };

  const fetchAnimeCharacters = async () => {
    try {
      setAnimeLoading(true);

      // AniList GraphQL Query
      const query = `
        query ($search: String) {
          Media(search: $search, type: ANIME) {
            id
            title {
              romaji
              english
              native
            }
            characters(sort: ROLE, perPage: 30) {
              edges {
                node {
                  id
                  name {
                    first
                    last
                    native
                  }
                  image {
                    large
                  }
                }
                role
                voiceActors(language: JAPANESE, sort: LANGUAGE) {
                  id
                  name {
                    first
                    last
                    native
                  }
                  image {
                    large
                  }
                  languageV2
                }
              }
            }
          }
        }
      `;

      const response = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          variables: {
            search: data.name || data.title,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`AniList API Error: ${response.status}`);
      }

      const result = await response.json();

      if (result.data?.Media?.characters?.edges) {
        // Transformiere AniList Daten ins erwartete Format
        const transformedCharacters = result.data.Media.characters.edges
          .filter(
            (edge: any) => edge.voiceActors && edge.voiceActors.length > 0,
          )
          .map((edge: any) => ({
            character: {
              name: `${edge.node.name.first || ""} ${
                edge.node.name.last || ""
              }`.trim(),
              images: {
                jpg: {
                  image_url: edge.node.image.large,
                },
              },
            },
            role: edge.role === "MAIN" ? "Hauptrolle" : "Nebenrolle",
            voice_actors: edge.voiceActors.map((va: any) => ({
              person: {
                name: `${va.name.first || ""} ${va.name.last || ""}`.trim(),
                images: {
                  jpg: {
                    image_url: va.image.large,
                  },
                },
              },
              language: "Japanese",
            })),
          }));

        setAnimeCharacters(transformedCharacters);
      }
    } catch (error) {
      // console.error("Error fetching anime characters from AniList:", error);
      // console.log("Fallback: Zeige TMDB Cast statt Anime Charaktere");
      setAnimeCharacters([]);
      // Cast-Daten sind bereits geladen, werden normal angezeigt
    } finally {
      setAnimeLoading(false);
    }
  };

  const fetchVideosData = async (tmdbId: number) => {
    try {
      setVideosLoading(true);
      const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;
      const url = `https://api.themoviedb.org/3/${type}/${tmdbId}/videos?api_key=${TMDB_API_KEY}&language=de-DE`;
      const response = await fetch(url);
      const result = await response.json();

      // Sortiere Videos: Trailer zuerst, dann nach Veröffentlichungsdatum
      const sortedVideos = (result.results || []).sort((a: any, b: any) => {
        if (a.type === "Trailer" && b.type !== "Trailer") return -1;
        if (b.type === "Trailer" && a.type !== "Trailer") return 1;
        return (
          new Date(b.published_at).getTime() -
          new Date(a.published_at).getTime()
        );
      });

      setVideosData(sortedVideos);
    } catch (error) {
      // console.error("Error fetching videos data:", error);
      setVideosData([]);
    } finally {
      setVideosLoading(false);
    }
  };

  const fetchPersonData = async (
    personId: number,
    isCrewMember: boolean = false,
  ) => {
    try {
      setPersonLoading(true);
      setCreditsLoading(true);
      const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;

      // Person Details und Credits parallel laden
      const [personResponse, creditsResponse] = await Promise.all([
        fetch(
          `https://api.themoviedb.org/3/person/${personId}?api_key=${TMDB_API_KEY}&language=de-DE`,
        ),
        fetch(
          `https://api.themoviedb.org/3/person/${personId}/combined_credits?api_key=${TMDB_API_KEY}&language=de-DE`,
        ),
      ]);

      const personResult = await personResponse.json();
      const creditsResult = await creditsResponse.json();

      // Sortiere Credits nach Popularität und Datum, aber filtere Talkshows aus
      const sortedCast = (creditsResult.cast || [])
        .filter((credit: any) => {
          // Filtere den aktuellen Film/Serie aus (über den der Dialog geöffnet wurde)
          if (credit.id === data.id) {
            return false;
          }

          // Filtere Talkshows aus basierend auf Genre-IDs
          // Genre ID 10767 = Talk, 10763 = News
          if (credit.genre_ids && Array.isArray(credit.genre_ids)) {
            if (
              credit.genre_ids.includes(10767) ||
              credit.genre_ids.includes(10763)
            ) {
              return false;
            }
          }

          // Filtere auch "Self" und "Guest" Auftritte aus (deutsch und englisch)
          if (credit.character) {
            const character = credit.character.toLowerCase();
            if (
              character === "self" ||
              character === "guest" ||
              character === "herself" ||
              character === "himself" ||
              character === "sie selbst" ||
              character === "er selbst" ||
              character === "gast" ||
              character === "moderator" ||
              character.includes("guest") ||
              character.includes("self") ||
              character.includes("gast") ||
              character.includes("moderator")
            ) {
              return false;
            }
          }

          return true;
        })
        .sort((a: any, b: any) => {
          // Erst nach Popularität, dann nach Datum
          if (b.popularity !== a.popularity) {
            return (b.popularity || 0) - (a.popularity || 0);
          }
          const dateA = a.release_date || a.first_air_date || "0000";
          const dateB = b.release_date || b.first_air_date || "0000";
          return dateB.localeCompare(dateA);
        })
        .slice(0, 20); // Begrenzen auf 20 bekannteste

      // Sortiere Crew Credits nach Popularität und filtere
      const sortedCrew = (creditsResult.crew || [])
        .filter((credit: any) => {
          // Filtere den aktuellen Film/Serie aus
          if (credit.id === data.id) {
            return false;
          }
          return true;
        })
        .sort((a: any, b: any) => {
          // Erst nach Popularität, dann nach Datum
          if (b.popularity !== a.popularity) {
            return (b.popularity || 0) - (a.popularity || 0);
          }
          const dateA = a.release_date || a.first_air_date || "0000";
          const dateB = b.release_date || b.first_air_date || "0000";
          return dateB.localeCompare(dateA);
        })
        .slice(0, 20);

      setSelectedPerson(personResult);
      // Zeige nur relevante Credits basierend auf Click-Kontext
      if (isCrewMember) {
        // Bei Crew-Mitgliedern: Nur Crew Credits anzeigen
        setPersonCredits({ crew: sortedCrew, cast: [] });
      } else {
        // Bei Cast-Mitgliedern: Nur Cast Credits anzeigen
        setPersonCredits({ cast: sortedCast, crew: [] });
      }
      setPersonDialogOpen(true);
    } catch (error) {
      // console.error("Error fetching person data:", error);
      setPersonDialogOpen(false);
    } finally {
      setPersonLoading(false);
      setCreditsLoading(false);
    }
  };

  const handlePersonClick = (person: any, isCrewMember: boolean = false) => {
    fetchPersonData(person.id, isCrewMember);
  };

  const handleVoiceActorClick = async (voiceActor: any) => {
    try {
      setPersonLoading(true);
      setPersonDialogOpen(true);
      
      const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;

      // Validierung der Voice Actor Daten
      if (!voiceActor?.person?.name) {
        // console.warn("Voice Actor hat keinen Namen:", voiceActor);
        setPersonLoading(false);
        return;
      }

      // Erstmal schauen, ob der Voice Actor bereits in den TMDB Cast-Daten ist
      const tmdbCastMatch = castData.find((castMember: any) => {
        if (!castMember?.name) return false;
        const tmdbName = castMember.name.toLowerCase();
        const voiceActorName = voiceActor.person.name.toLowerCase();

        // Exakte Übereinstimmung
        if (tmdbName === voiceActorName) return true;

        // Gedrehte Namen (Vor-/Nachname)
        const tmdbParts = tmdbName.split(" ");
        const vaParts = voiceActorName.split(" ");
        if (tmdbParts.length === 2 && vaParts.length === 2) {
          if (tmdbParts[0] === vaParts[1] && tmdbParts[1] === vaParts[0]) {
            return true;
          }
        }

        // Bekannte Varianten
        const knownVariants: { [key: string]: string[] } = {
          "yuuki kaji": ["yuki kaji", "kaji yuki"],
          "yui ishikawa": ["ishikawa yui"],
          "marina inoue": ["inoue marina"],
          "yuu kobayashi": ["yu kobayashi", "kobayashi yu"],
        };

        const variants = knownVariants[voiceActorName] || [];
        return variants.includes(tmdbName);
      });

      if (tmdbCastMatch) {
        // Perfekt! Voice Actor ist bereits in TMDB Cast-Daten
        await fetchPersonData(tmdbCastMatch.id, false);
      } else {
        // Fallback: Lade Voice Actor Daten von AniList
        try {
          // console.log("Fetching voice actor data from AniList for:", voiceActor.person.name, "ID:", voiceActor.person.id);
          
          // Zuerst versuchen wir es mit der ID
          if (voiceActor.person.id && typeof voiceActor.person.id === 'number') {
            const query = `
              query ($id: Int) {
                Staff(id: $id) {
                  id
                  name {
                    full
                    native
                  }
                  image {
                    large
                  }
                  description
                  primaryOccupations
                  age
                  yearsActive
                  homeTown
                  bloodType
                  characterMedia(page: 1, perPage: 50, sort: FAVOURITES_DESC) {
                    edges {
                      node {
                        id
                        title {
                          romaji
                          english
                          native
                        }
                        format
                        startDate {
                          year
                        }
                        coverImage {
                          large
                        }
                        popularity
                      }
                      characters {
                        id
                        name {
                          full
                        }
                        image {
                          large
                        }
                      }
                    }
                  }
                }
              }
            `;

            const response = await fetch("https://graphql.anilist.co", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
              },
              body: JSON.stringify({
                query,
                variables: {
                  id: parseInt(voiceActor.person.id),
                },
              }),
            });

            if (response.ok) {
              const result = await response.json();
              const staffData = result.data?.Staff;

              if (staffData && staffData.characterMedia?.edges?.length > 0) {
                // Filtere die aktuelle Serie/Film aus den Credits heraus
                const currentSeriesId = data?.id;
                
                // Transformiere AniList Daten ins TMDB Format
                const titleMap = new Map(); // Map für Deduplizierung
                
                staffData.characterMedia.edges
                  .filter((edge: any) => edge.node.id !== currentSeriesId) // Filtere aktuelle Serie aus
                  .forEach((edge: any, index: number) => {
                    // Bevorzuge englischen Titel, dann romaji, dann native
                    const preferredTitle = edge.node.title.english || edge.node.title.romaji || edge.node.title.native;
                    
                    // Umfassende Bereinigung des Titels
                    const cleanTitle = preferredTitle
                      .replace(/[:\-–]?\s*Cour \d+/gi, '') // Entferne "Cour 2"
                      .replace(/[:\-–]?\s*(Season|S)\s*\d+/gi, '') // Entferne "Season 2", "S2" 
                      .replace(/[:\-–]?\s*\d+(st|nd|rd|th)\s+Season/gi, '') // Entferne "2nd Season"
                      .replace(/[:\-–]?\s*Part\s+\d+/gi, '') // Entferne "Part 2"
                      .replace(/\s*\(TV\)/gi, '') // Entferne "(TV)"
                      .replace(/\s+/g, ' ') // Normalisiere Leerzeichen
                      .trim();
                    
                    // Erstelle einen noch strikteren Normalisierungs-Key
                    const normalizedKey = cleanTitle
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, '') // Entferne ALLE Sonderzeichen für den Key
                      .trim();
                    
                    if (!normalizedKey) return; // Skip wenn kein gültiger Titel
                    
                    const existing = titleMap.get(normalizedKey);
                    const newCredit = {
                      id: edge.node.id,
                      credit_id: `anilist-${staffData.id}-${edge.node.id}-${index}`,
                      title: cleanTitle, // Verwende den bereinigten Titel für Anzeige
                      name: cleanTitle,
                      original_title: preferredTitle, // Behalte Original für Debug
                      poster_path: edge.node.coverImage?.large,
                      is_anilist_image: true,
                      character: edge.characters?.[0]?.name?.full || "Charakter",
                      media_type: edge.node.format === "MOVIE" ? "movie" : "tv",
                      first_air_date: edge.node.startDate?.year ? `${edge.node.startDate.year}-01-01` : null,
                      release_date: edge.node.startDate?.year ? `${edge.node.startDate.year}-01-01` : null,
                      popularity: edge.node.popularity || 0,
                    };
                    
                    // Nur hinzufügen wenn nicht existiert oder populärer
                    if (!existing || newCredit.popularity > existing.popularity) {
                      titleMap.set(normalizedKey, newCredit);
                    }
                  });
                
                // Konvertiere Map zu Array
                const uniqueCredits = Array.from(titleMap.values());
                
                // Suche TMDB IDs für AniList Titel
                // console.log(`Searching TMDB IDs for ${uniqueCredits.length} AniList titles...`);
                for (const credit of uniqueCredits) {
                  try {
                    const searchQuery = encodeURIComponent(credit.title);
                    const searchUrl = credit.media_type === "movie" 
                      ? `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${searchQuery}&language=de-DE`
                      : `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${searchQuery}&language=de-DE`;
                    
                    const searchResponse = await fetch(searchUrl);
                    if (searchResponse.ok) {
                      const searchData = await searchResponse.json();
                      if (searchData.results && searchData.results.length > 0) {
                        // Nimm das erste Ergebnis (meist das relevanteste)
                        credit.tmdb_id = searchData.results[0].id;
                        credit.tmdb_title = searchData.results[0].title || searchData.results[0].name;
                      }
                    }
                  } catch (error) {
                    // console.error(`Error searching TMDB for "${credit.title}":`, error);
                  }
                }
                
                // console.log(`AniList: ${staffData.characterMedia.edges.length} roles → ${uniqueCredits.length} unique titles`);
                // console.log('Found TMDB IDs for:', uniqueCredits.filter(c => c.tmdb_id).length, 'titles');

                // Versuche zuerst die Biographie von TMDB zu holen
                let biography = null;
                let tmdbPersonId = null;
                
                try {
                  // console.log("Searching TMDB for:", staffData.name?.full || voiceActor.person.name);
                  
                  // Versuche mit dem Namen eine TMDB Person zu finden
                  const tmdbSearchResponse = await fetch(
                    `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(staffData.name?.full || voiceActor.person.name)}&language=de-DE`
                  );
                  
                  if (tmdbSearchResponse.ok) {
                    const tmdbSearchData = await tmdbSearchResponse.json();
                    // console.log("TMDB search results:", tmdbSearchData.results?.length || 0, "results found");
                    
                    if (tmdbSearchData.results && tmdbSearchData.results.length > 0) {
                      tmdbPersonId = tmdbSearchData.results[0].id;
                      
                      // Hole detaillierte Person-Daten von TMDB - zuerst auf Deutsch
                      const tmdbPersonResponseDe = await fetch(
                        `https://api.themoviedb.org/3/person/${tmdbPersonId}?api_key=${TMDB_API_KEY}&language=de-DE`
                      );
                      
                      if (tmdbPersonResponseDe.ok) {
                        const tmdbPersonDataDe = await tmdbPersonResponseDe.json();
                        if (tmdbPersonDataDe.biography && tmdbPersonDataDe.biography.trim() !== "") {
                          biography = tmdbPersonDataDe.biography;
                          // console.log("Using TMDB German biography");
                        } else {
                          // Fallback auf Englisch wenn Deutsch leer ist
                          // console.log("German TMDB biography is empty, trying English");
                          const tmdbPersonResponseEn = await fetch(
                            `https://api.themoviedb.org/3/person/${tmdbPersonId}?api_key=${TMDB_API_KEY}&language=en-US`
                          );
                          
                          if (tmdbPersonResponseEn.ok) {
                            const tmdbPersonDataEn = await tmdbPersonResponseEn.json();
                            if (tmdbPersonDataEn.biography && tmdbPersonDataEn.biography.trim() !== "") {
                              biography = tmdbPersonDataEn.biography;
                              // console.log("Using TMDB English biography");
                            }
                          }
                        }
                      }
                    }
                  }
                } catch (tmdbError) {
                  // console.error("Error fetching TMDB data:", tmdbError);
                }
                
                // Falls keine TMDB Biographie, formatiere AniList Beschreibung
                if (!biography && staffData.description) {
                  // Entferne Markdown-Formatierung und formatiere für bessere Lesbarkeit
                  biography = staffData.description
                    .replace(/__(.*?)__/g, '$1') // Entferne __ formatting
                    .replace(/\[(.*?)\]\((.*?)\)/g, '$1') // Entferne Markdown Links
                    .replace(/\n\n/g, '\n') // Reduziere doppelte Zeilenumbrüche
                    .trim();
                  // console.log("Using formatted AniList description");
                }
                
                if (!biography) {
                  biography = `Japanischer Synchronsprecher (声優, Seiyuu)\n\nKeine zusätzlichen Informationen verfügbar.`;
                }

                // Setze Voice Actor Daten
                setSelectedPerson({
                  id: tmdbPersonId || staffData.id, // Verwende TMDB ID wenn verfügbar
                  name: staffData.name?.full || voiceActor.person.name,
                  profile_path: staffData.image?.large || voiceActor.person.images?.jpg?.image_url,
                  biography: biography,
                  known_for_department: "Acting",
                  birthday: null,
                  deathday: null,
                  place_of_birth: staffData.homeTown || "Japan",
                  homepage: null,
                  is_from_anilist: true, // Markierung dass Daten von AniList kommen
                });

                // Filtere den aktuellen Titel aus und sortiere nach Popularität
                const filteredCredits = uniqueCredits
                  .filter((credit: any) => {
                    // Filtere den aktuellen Titel aus (vergleiche TMDB-ID falls vorhanden)
                    if (credit.tmdb_id && credit.tmdb_id === data.id) {
                      return false;
                    }
                    // Vergleiche auch den Titel als Fallback
                    if (credit.title === data.name || credit.title === data.title) {
                      return false;
                    }
                    return true;
                  })
                  .sort((a: any, b: any) => b.popularity - a.popularity);

                setPersonCredits({ cast: filteredCredits.slice(0, 20), crew: [] });
                setPersonLoading(false);
                setCreditsLoading(false);
                // console.log("Successfully loaded voice actor roles from AniList");
                return;
              }
            }
          }

          // Falls ID-Suche fehlschlägt, versuche Namenssuche
          // console.log("ID search failed, trying name search for:", voiceActor.person.name);
          const nameSearchQuery = `
            query ($search: String) {
              Staff(search: $search) {
                id
                name {
                  full
                  native
                }
                image {
                  large
                }
                description
                primaryOccupations
                characterMedia(page: 1, perPage: 50, sort: FAVOURITES_DESC) {
                  edges {
                    node {
                      id
                      title {
                        romaji
                        english
                        native
                      }
                      format
                      startDate {
                        year
                      }
                      coverImage {
                        large
                      }
                      popularity
                    }
                    characters {
                      id
                      name {
                        full
                      }
                    }
                  }
                }
              }
            }
          `;

          const nameResponse = await fetch("https://graphql.anilist.co", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
            },
            body: JSON.stringify({
              query: nameSearchQuery,
              variables: {
                search: voiceActor.person.name,
              },
            }),
          });

          if (nameResponse.ok) {
            const nameResult = await nameResponse.json();
            const staffData = nameResult.data?.Staff;

            if (staffData && staffData.characterMedia?.edges?.length > 0) {
              // Filtere die aktuelle Serie/Film aus den Credits heraus
              const currentSeriesId = data?.id;
              
              const titleMap = new Map();
              
              staffData.characterMedia.edges
                .filter((edge: any) => edge.node.id !== currentSeriesId)
                .forEach((edge: any, index: number) => {
                  const preferredTitle = edge.node.title.english || edge.node.title.romaji || edge.node.title.native;
                  
                  // Umfassende Bereinigung des Titels (gleich wie oben)
                  const cleanTitle = preferredTitle
                    .replace(/[:\-–]?\s*Cour \d+/gi, '')
                    .replace(/[:\-–]?\s*(Season|S)\s*\d+/gi, '')
                    .replace(/[:\-–]?\s*\d+(st|nd|rd|th)\s+Season/gi, '')
                    .replace(/[:\-–]?\s*Part\s+\d+/gi, '')
                    .replace(/\s*\(TV\)/gi, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                  
                  // Erstelle einen noch strikteren Normalisierungs-Key
                  const normalizedKey = cleanTitle
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, '')
                    .trim();
                  
                  if (!normalizedKey) return;
                  
                  const existing = titleMap.get(normalizedKey);
                  const newCredit = {
                    id: edge.node.id,
                    credit_id: `anilist-name-${staffData.id}-${edge.node.id}-${index}`,
                    title: cleanTitle,
                    name: cleanTitle,
                    original_title: preferredTitle,
                    poster_path: edge.node.coverImage?.large,
                    is_anilist_image: true,
                    character: edge.characters?.[0]?.name?.full || "Charakter",
                    media_type: edge.node.format === "MOVIE" ? "movie" : "tv",
                    first_air_date: edge.node.startDate?.year ? `${edge.node.startDate.year}-01-01` : null,
                    release_date: edge.node.startDate?.year ? `${edge.node.startDate.year}-01-01` : null,
                    popularity: edge.node.popularity || 0,
                  };
                  
                  if (!existing || newCredit.popularity > existing.popularity) {
                    titleMap.set(normalizedKey, newCredit);
                  }
                });
              
              const uniqueCredits = Array.from(titleMap.values());
              
              // Suche TMDB IDs für AniList Titel
              // console.log(`Name search: Searching TMDB IDs for ${uniqueCredits.length} AniList titles...`);
              for (const credit of uniqueCredits) {
                try {
                  const searchQuery = encodeURIComponent(credit.title);
                  const searchUrl = credit.media_type === "movie" 
                    ? `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${searchQuery}&language=de-DE`
                    : `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${searchQuery}&language=de-DE`;
                  
                  const searchResponse = await fetch(searchUrl);
                  if (searchResponse.ok) {
                    const searchData = await searchResponse.json();
                    if (searchData.results && searchData.results.length > 0) {
                      credit.tmdb_id = searchData.results[0].id;
                      credit.tmdb_title = searchData.results[0].title || searchData.results[0].name;
                    }
                  }
                } catch (error) {
                  // console.error(`Error searching TMDB for "${credit.title}":`, error);
                }
              }
              
              // console.log(`Name search: ${staffData.characterMedia.edges.length} roles → ${uniqueCredits.length} unique titles`);
              // console.log('Found TMDB IDs for:', uniqueCredits.filter(c => c.tmdb_id).length, 'titles');

              // Versuche zuerst die Biographie von TMDB zu holen
              let biography = null;
              let tmdbPersonId = null;
              
              try {
                // console.log("Searching TMDB for (name search):", staffData.name?.full || voiceActor.person.name);
                
                const tmdbSearchResponse = await fetch(
                  `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(staffData.name?.full || voiceActor.person.name)}&language=de-DE`
                );
                
                if (tmdbSearchResponse.ok) {
                  const tmdbSearchData = await tmdbSearchResponse.json();
                  // console.log("TMDB search results (name search):", tmdbSearchData.results?.length || 0, "results found");
                  
                  if (tmdbSearchData.results && tmdbSearchData.results.length > 0) {
                    tmdbPersonId = tmdbSearchData.results[0].id;
                    
                    const tmdbPersonResponseDe = await fetch(
                      `https://api.themoviedb.org/3/person/${tmdbPersonId}?api_key=${TMDB_API_KEY}&language=de-DE`
                    );
                    
                    if (tmdbPersonResponseDe.ok) {
                      const tmdbPersonDataDe = await tmdbPersonResponseDe.json();
                      if (tmdbPersonDataDe.biography && tmdbPersonDataDe.biography.trim() !== "") {
                        biography = tmdbPersonDataDe.biography;
                        // console.log("Using TMDB German biography (name search)");
                      } else {
                        // console.log("German TMDB biography is empty, trying English (name search)");
                        const tmdbPersonResponseEn = await fetch(
                          `https://api.themoviedb.org/3/person/${tmdbPersonId}?api_key=${TMDB_API_KEY}&language=en-US`
                        );
                        
                        if (tmdbPersonResponseEn.ok) {
                          const tmdbPersonDataEn = await tmdbPersonResponseEn.json();
                          if (tmdbPersonDataEn.biography && tmdbPersonDataEn.biography.trim() !== "") {
                            biography = tmdbPersonDataEn.biography;
                            // console.log("Using TMDB English biography (name search)");
                          }
                        }
                      }
                    }
                  }
                }
              } catch (tmdbError) {
                // console.error("Error fetching TMDB data (name search):", tmdbError);
              }
              
              if (!biography && staffData.description) {
                biography = staffData.description
                  .replace(/__(.*?)__/g, '$1')
                  .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
                  .replace(/\n\n/g, '\n')
                  .trim();
                // console.log("Using formatted AniList description (name search)");
              }
              
              if (!biography) {
                biography = `Japanischer Synchronsprecher (声優, Seiyuu)\n\nKeine zusätzlichen Informationen verfügbar.`;
              }

              setSelectedPerson({
                id: tmdbPersonId || staffData.id,
                name: staffData.name?.full || voiceActor.person.name,
                profile_path: staffData.image?.large || voiceActor.person.images?.jpg?.image_url,
                biography: biography,
                known_for_department: "Acting",
                birthday: null,
                deathday: null,
                place_of_birth: "Japan",
                homepage: null,
                is_from_anilist: true,
              });

              // Filtere den aktuellen Titel aus und sortiere nach Popularität
              const filteredCredits = uniqueCredits
                .filter((credit: any) => {
                  // Filtere den aktuellen Titel aus (vergleiche TMDB-ID falls vorhanden)
                  if (credit.tmdb_id && credit.tmdb_id === data.id) {
                    return false;
                  }
                  // Vergleiche auch den Titel als Fallback
                  if (credit.title === data.name || credit.title === data.title) {
                    return false;
                  }
                  return true;
                })
                .sort((a: any, b: any) => b.popularity - a.popularity);
                
              setPersonCredits({ cast: filteredCredits.slice(0, 20), crew: [] });
              setPersonLoading(false);
              setCreditsLoading(false);
              // console.log("Successfully loaded voice actor roles from AniList via name search");
              return;
            }
          }
        } catch (anilistError) {
          // console.error("Error fetching voice actor from AniList:", anilistError);
        }

        // Ultimate Fallback wenn AniList auch fehlschlägt
        const fallbackPersonData = {
          id: voiceActor.person.id || Math.random(),
          name: voiceActor.person.name || "Unbekannter Sprecher",
          profile_path: voiceActor.person.images?.jpg?.image_url || null,
          biography: `Japanischer Synchronsprecher (声優, Seiyuu)\n\nKeine zusätzlichen Informationen verfügbar.`,
          known_for_department: "Acting",
          birthday: null,
          deathday: null,
          place_of_birth: "Japan",
          popularity: 1.0,
        };

        setSelectedPerson(fallbackPersonData);
        setPersonCredits({ cast: [], crew: [] });
        setPersonLoading(false);
        setCreditsLoading(false);
      }
    } catch (error) {
      // console.error("Error matching voice actor with TMDB cast:", error);
      setPersonLoading(false);
      setPersonDialogOpen(false);
    }
  };

  // Prüfe ob Titel bereits in Liste ist
  const isTitleInList = (credit: any) => {
    if (!user) return false;

    // Bei AniList Credits verwende die TMDB ID wenn vorhanden
    if (credit.is_anilist_image && credit.tmdb_id) {
      if (credit.media_type === "movie") {
        return movieList.some((movie) => movie.id === credit.tmdb_id);
      } else {
        return seriesList.some((series) => series.id === credit.tmdb_id);
      }
    }
    
    // Fallback f\u00fcr AniList ohne TMDB ID - sollte selten vorkommen
    if (credit.is_anilist_image) {
      return false; // Wenn wir keine TMDB ID haben, k\u00f6nnen wir nicht sicher sein
    }
    
    // Standard TMDB ID Vergleich
    if (credit.media_type === "movie") {
      return movieList.some((movie) => movie.id === credit.id);
    } else {
      return seriesList.some((series) => series.id === credit.id);
    }
  };

  // Füge Titel zur Liste hinzu
  const handleAddTitle = async (credit: any) => {
    if (!user || addingTitles.has(credit.id)) return;

    try {
      setAddingTitles((prev) => new Set(prev.add(credit.id)));

      // Verwende tmdb_id für AniList-Einträge, ansonsten die normale id
      const tmdbId = credit.is_anilist_image && credit.tmdb_id ? credit.tmdb_id : credit.id;
      
      if (credit.is_anilist_image && !credit.tmdb_id) {
        setSnackbar({
          open: true,
          message: `Keine TMDB-ID für "${credit.title || credit.name}" gefunden. Titel kann nicht hinzugefügt werden.`,
          severity: 'warning',
        });
        setAddingTitles((prev) => {
          const newSet = new Set(prev);
          newSet.delete(credit.id);
          return newSet;
        });
        return;
      }

      const titleData = {
        user: import.meta.env.VITE_USER,
        id: tmdbId,
        uuid: user.uid,
      };

      const endpoint =
        credit.media_type === "movie"
          ? "https://serienapi.konrad-dinges.de/addMovie"
          : "https://serienapi.konrad-dinges.de/add";

      const res = await fetch(endpoint, {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(titleData),
      });

      if (res.ok) {
        // Erfolg-Meldung
        const titleName = credit.tmdb_title || credit.title || credit.name;
        
        // Zeige Snackbar mit längerer Duration und besserer Sichtbarkeit
        setTimeout(() => {
          setSnackbar({
            open: true,
            message: `"${titleName}" wurde erfolgreich zu deiner ${credit.media_type === "movie" ? "Film" : "Serien"}-Liste hinzugefügt`,
            severity: 'success',
          });
        }, 100);
        
        // Refresh der Listen würde hier stattfinden
        // Das passiert automatisch durch die Context Provider
        // WICHTIG: Dialog bleibt geöffnet, damit der Nutzer weitere Titel hinzufügen kann
      } else {
        // Fehler vom Server
        setSnackbar({
          open: true,
          message: `Fehler beim Hinzufügen von "${credit.title || credit.name}". Bitte versuche es später erneut.`,
          severity: 'error',
        });
      }
    } catch (error) {
      // console.error("Error adding title:", error);
      setSnackbar({
        open: true,
        message: `Netzwerkfehler beim Hinzufügen von "${credit.title || credit.name}"`,
        severity: 'error',
      });
    } finally {
      setAddingTitles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(credit.id);
        return newSet;
      });
    }
  };

  // Prüfe ob bereits in eigener Liste hinzugefügt
  const alreadyAdded = useMemo(() => {
    if (!data || !user) return false;

    if (type === "tv") {
      return seriesList.some((series) => series.id === data.id);
    } else {
      return movieList.some((movie) => movie.id === data.id);
    }
  }, [data, type, seriesList, movieList, user]);

  // Zeige Add-Button nur wenn User eingeloggt und noch nicht hinzugefügt
  const canAdd = user && !alreadyAdded;
  return (
    <>
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableRestoreFocus
      slotProps={{
        paper: {
          sx: {
            maxHeight: "95vh",
            background: colors.background.gradient.dark,
            borderRadius: "20px",
            border: `1px solid ${colors.border.subtle}`,
            overflow: "hidden",
            boxShadow: `${colors.shadow.dialog}, 0 0 30px ${colors.status.warning}30`,
            color: colors.text.secondary,
          },
        },
      }}
    >
      {loading ? (
        <DialogContent sx={{ textAlign: "center", py: 8 }}>
          <CircularProgress sx={{ color: "var(--theme-primary)", mb: 2 }} />
          <Typography variant="h6" color={"var(--theme-primary)"}>
            Lade Daten...
          </Typography>
        </DialogContent>
      ) : data ? (
        <>
          <DialogTitle
            sx={{
              textAlign: "center",
              position: "relative",
              background: colors.background.gradient.dark,
              backdropFilter: "blur(15px)",
              borderBottom: `1px solid ${colors.border.lighter}`,
              color: colors.text.secondary,
              fontWeight: 600,
              fontSize: "1.25rem",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                flexDirection: "column",
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {type === "tv" ? <TvIcon sx={{ fontSize: '2rem', color: colors.status.warning }} /> : <MovieIcon sx={{ fontSize: '2rem', color: colors.status.warning }} />}
                <Typography
                  variant="h4"
                  sx={{ fontWeight: "bold", color: colors.status.warning }}
                >
                  {type === "tv" ? data.name : data.title}
                  {data.first_air_date &&
                    ` (${new Date(data.first_air_date).getFullYear()})`}
                  {data.release_date &&
                    ` (${new Date(data.release_date).getFullYear()})`}
                </Typography>
              </Box>
              <Chip
                icon={type === "tv" ? <TvIcon sx={{ fontSize: '1rem' }} /> : <MovieIcon sx={{ fontSize: '1rem' }} />}
                label={type === "tv" ? "Serie" : "Film"}
                size="small"
                sx={{
                  backgroundColor: `${colors.text.accent}20`,
                  borderColor: colors.text.accent,
                  color: colors.text.accent,
                  fontWeight: "bold",
                }}
              />
            </Box>

            <IconButton
              onClick={onClose}
              sx={{
                position: "absolute",
                right: 16,
                top: "50%",
                transform: "translateY(-50%)",
                color: colors.text.placeholder,
                background: colors.overlay.light,
                backdropFilter: "blur(10px)",
                borderRadius: "12px",
                "&:hover": {
                  background: colors.overlay.white,
                  color: colors.text.secondary,
                  transform: "translateY(-50%) scale(1.05)",
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <Tabs
            value={currentTab}
            onChange={(_, newValue) => setCurrentTab(newValue)}
            sx={{
              borderBottom: `1px solid ${colors.border.subtle}`,
              backgroundColor: colors.background.surface,
              "& .MuiTab-root": {
                color: colors.text.placeholder,
                "&.Mui-selected": {
                  color: "var(--theme-primary)",
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "var(--theme-primary)",
              },
            }}
          >
            <Tab label="Details" />
            <Tab label="Cast" />
            <Tab label="Videos" />
          </Tabs>
          <DialogContent
            sx={{
              p: 0,
              background: colors.background.gradient.light,
              backdropFilter: "blur(10px)",
              color: colors.text.secondary,
            }}
          >
            {currentTab === 0 && (
              <Box
                display="flex"
                gap={3}
                flexDirection={{ xs: "column", md: "row" }}
              >
                {data.poster_path && (
                  <Box sx={{ flexShrink: 0 }} mt={1.5}>
                    <Box
                      component="img"
                      src={data.poster_path?.startsWith('http') ? data.poster_path : `https://image.tmdb.org/t/p/w300${data.poster_path}`}
                      alt={type === "tv" ? data.name : data.title}
                      sx={{
                        width: { xs: "200px", md: "250px" },
                        height: "auto",
                        borderRadius: 2,
                        boxShadow: colors.shadow.button,
                        mx: { xs: "auto", md: 0 },
                        display: "block",
                      }}
                    />
                  </Box>
                )}
                <Box flex={1}>
                  {data.overview && (
                    <Box mb={2} mt={1.5}>
                      <Typography
                        variant="h4"
                        gutterBottom
                        sx={{ color: "var(--theme-primary)" }}
                      >
                        Beschreibung
                      </Typography>
                      <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                        {data.overview}
                      </Typography>
                    </Box>
                  )}
                  <Box display="flex" flexDirection="column" gap={1.5}>
                    {data.vote_average !== undefined &&
                      data.vote_average !== null && (
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ color: colors.text.muted }}
                          >
                            TMDB Bewertung
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Star sx={{ fontSize: '1rem', color: '#fbbf24' }} />
                            <Typography variant="body1">
                              {data.vote_average.toFixed(1)}/10
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    {data.genres && data.genres.length > 0 && (
                      <Box>
                        <Typography variant="body2" sx={{ color: "#9e9e9e" }}>
                          Genres
                        </Typography>
                        <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                          {data.genres.map((genre: any) => (
                            <span
                              key={genre.id}
                              style={{
                                background: "var(--theme-primary)",
                                color: colors.text.secondary,
                                borderRadius: 6,
                                padding: "2px 8px",
                                marginRight: 4,
                              }}
                            >
                              {genre.name}
                            </span>
                          ))}
                        </Box>
                      </Box>
                    )}
                    {type === "tv" &&
                      data.number_of_seasons !== undefined &&
                      data.number_of_seasons !== null &&
                      data.number_of_seasons > 0 && (
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ color: colors.text.muted }}
                          >
                            Staffeln
                          </Typography>
                          <Typography variant="body1">
                            {data.number_of_seasons} Staffel(n)
                            {data.number_of_episodes !== undefined &&
                              data.number_of_episodes !== null &&
                              data.number_of_episodes > 0 && (
                                <> • {data.number_of_episodes} Episoden</>
                              )}
                          </Typography>
                        </Box>
                      )}
                    {type === "movie" &&
                      data.runtime !== undefined &&
                      data.runtime !== null &&
                      data.runtime > 0 && (
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ color: colors.text.muted }}
                          >
                            Laufzeit
                          </Typography>
                          <Typography variant="body1">
                            {data.runtime} Minuten
                          </Typography>
                        </Box>
                      )}
                  </Box>
                </Box>
              </Box>
            )}
            {currentTab === 1 && (
              <Box px={2} py={3}>
                {/* Suchfeld für Cast/Crew */}
                <Box mb={2} display="flex" justifyContent="center">
                  <input
                    type="text"
                    placeholder="Suche nach Name oder Rolle..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: "100%",
                      maxWidth: 400,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: `1px solid var(--theme-primary)`,
                      outline: "none",
                      fontSize: 16,
                      background: colors.background.input,
                      color: colors.text.secondary,
                      boxShadow: colors.shadow.light,
                    }}
                  />
                </Box>
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{ color: "var(--theme-primary)", mb: 3 }}
                >
                  Cast & Crew
                </Typography>
                {castLoading ? (
                  <Box textAlign="center" py={3}>
                    <CircularProgress
                      sx={{ color: "var(--theme-primary)", mb: 2 }}
                    />
                    <Typography variant="body1">Lade Cast-Daten...</Typography>
                  </Box>
                ) : (
                  <Box sx={{ maxHeight: "600px", overflowY: "auto", pr: 1 }}>
                    {/* Anime Charaktere Sektion - höchste Priorität */}
                    {animeCharacters.length > 0 && (
                      <Box mb={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                          <Brush sx={{ fontSize: '1.5rem', color: colors.status.warning }} />
                          <Typography
                            variant="h5"
                            sx={{
                              color: colors.status.warning,
                              fontWeight: "bold",
                            }}
                          >
                            Anime-Charaktere ({animeCharacters.length})
                          </Typography>
                        </Box>
                        <Box
                          display="grid"
                          gap={2}
                          gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))"
                        >
                          {animeCharacters
                            .filter((char: any) => {
                              // Nur japanische Voice Actors
                              const hasJapaneseVA = char.voice_actors?.some(
                                (va: any) => va.language === "Japanese",
                              );
                              if (!hasJapaneseVA) return false;

                              if (!searchTerm) return true;
                              const characterName = (
                                char.character?.name || ""
                              ).toLowerCase();
                              const japaneseVA = char.voice_actors?.find(
                                (va: any) => va.language === "Japanese",
                              );
                              const voiceActor = japaneseVA?.person?.name || "";
                              const role = (char.role || "").toLowerCase();
                              const searchLower = searchTerm.toLowerCase();

                              // Deutsche Suchbegriffe unterstützen
                              const roleMatches =
                                role.includes(searchLower) ||
                                (searchLower.includes("haupt") &&
                                  role.includes("hauptrolle")) ||
                                (searchLower.includes("neben") &&
                                  role.includes("nebenrolle")) ||
                                (searchLower.includes("main") &&
                                  role.includes("hauptrolle")) ||
                                (searchLower.includes("supporting") &&
                                  role.includes("nebenrolle"));

                              return (
                                characterName.includes(searchLower) ||
                                voiceActor
                                  .toLowerCase()
                                  .includes(searchLower) ||
                                roleMatches
                              );
                            })
                            .slice(0, 20)
                            .map((char: any, idx: number) => (
                              <Box
                                key={`anime-char-${
                                  char.character?.mal_id || idx
                                }`}
                                onClick={() => {
                                  const japaneseVA = char.voice_actors?.find(
                                    (va: any) => va.language === "Japanese",
                                  );
                                  if (japaneseVA) {
                                    handleVoiceActorClick(japaneseVA);
                                  }
                                }}
                                sx={{
                                  background: colors.button.secondary,
                                  borderRadius: 3,
                                  p: 2,
                                  textAlign: "center",
                                  backdropFilter: "blur(10px)",
                                  border: `2px solid ${colors.status.warning}30`,
                                  transition: "all 0.3s ease",
                                  cursor: "pointer",
                                  "&:hover": {
                                    background:
                                      colors.button.secondaryHover,
                                    transform: "translateY(-5px) scale(1.02)",
                                    borderColor: colors.status.warning,
                                  },
                                }}
                              >
                                {/* Charakterbild und Voice Actor nebeneinander */}
                                <Box
                                  display="flex"
                                  justifyContent="center"
                                  gap={1}
                                  mb={2}
                                >
                                  <Box sx={{ position: "relative" }}>
                                    <Avatar
                                      src={
                                        char.character?.images?.jpg?.image_url
                                      }
                                      alt={char.character?.name}
                                      sx={{
                                        width: 80,
                                        height: 80,
                                        border: `2px solid ${colors.status.warning}`,
                                      }}
                                    />
                                  </Box>

                                  {(() => {
                                    const japaneseVA = char.voice_actors?.find(
                                      (va: any) => va.language === "Japanese",
                                    );
                                    return japaneseVA ? (
                                      <Box sx={{ position: "relative" }}>
                                        <Avatar
                                          src={
                                            japaneseVA.person?.images?.jpg
                                              ?.image_url
                                          }
                                          alt={japaneseVA.person?.name}
                                          sx={{
                                            width: 80,
                                            height: 80,
                                            border:
                                              "2px solid var(--theme-primary)",
                                          }}
                                        />
                                      </Box>
                                    ) : null;
                                  })()}
                                </Box>

                                {/* Charaktername */}
                                <Typography
                                  variant="subtitle1"
                                  sx={{
                                    fontWeight: "bold",
                                    color: colors.status.warning,
                                    mb: 0.5,
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  {char.character?.name}
                                </Typography>

                                {/* Rolle */}
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: colors.status.warning,
                                    fontWeight: "bold",
                                    mb: 1,
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  {char.role}
                                </Typography>

                                {/* Voice Actor Info - Nur Japanisch */}
                                {(() => {
                                  const japaneseVA = char.voice_actors?.find(
                                    (va: any) => va.language === "Japanese",
                                  );
                                  return japaneseVA ? (
                                    <Box>
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          color: "var(--theme-primary)",
                                          fontWeight: "bold",
                                          mb: 0.5,
                                          fontSize: "0.75rem",
                                        }}
                                      >
                                        {japaneseVA.person?.name}
                                      </Typography>
                                    </Box>
                                  ) : null;
                                })()}
                              </Box>
                            ))}
                        </Box>
                      </Box>
                    )}

                    {animeLoading && (
                      <Box textAlign="center" py={2} mb={3}>
                        <CircularProgress
                          size={24}
                          sx={{ color: "#ffd700", mb: 1 }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ color: colors.status.warning }}
                        >
                          Lade Anime-Charaktere von AniList...
                        </Typography>
                      </Box>
                    )}

                    {/* Hinweis wenn AniList fehlgeschlagen bei Anime */}
                    {(() => {
                      const isAnime = data.origin_country?.some(
                        (country: string) =>
                          ["JP", "CN", "KR"].includes(country),
                      );

                      return (
                        isAnime &&
                        animeCharacters.length === 0 &&
                        !animeLoading &&
                        castData.length > 0
                      );
                    })() && (
                      <Box
                        textAlign="center"
                        py={2}
                        mb={3}
                        sx={{
                          background: `${colors.status.warning}10`,
                          borderRadius: 2,
                          border: `1px solid ${colors.status.warning}30`,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ color: colors.status.warning }}
                        >
                          <Warning sx={{ fontSize: '0.875rem', mr: 0.5, verticalAlign: 'middle' }} />
                          AniList nicht erreichbar - Zeige TMDB Cast-Daten
                        </Typography>
                      </Box>
                    )}

                    {/* Cast Sektion - Bei Non-Anime ODER wenn Anime Charaktere fehlgeschlagen */}
                    {(() => {
                      const isAnime = data.origin_country?.some(
                        (country: string) =>
                          ["JP", "CN", "KR"].includes(country),
                      );

                      // Zeige Cast wenn: Nicht-Anime ODER (Anime aber keine Charaktere geladen)
                      const showCast =
                        !isAnime ||
                        (isAnime &&
                          animeCharacters.length === 0 &&
                          !animeLoading);

                      return (
                        showCast &&
                        castData.filter((actor: any) => actor.profile_path)
                          .length > 0
                      );
                    })() && (
                      <Box mb={4}>
                        <Typography
                          variant="h5"
                          sx={{
                            color: colors.status.warning,
                            mb: 2,
                            fontWeight: "bold",
                          }}
                        >
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                            <TheaterComedy sx={{ fontSize: '1.2rem' }} />
                            Schauspieler ({castData.filter((actor: any) => actor.profile_path).length})
                          </Box>
                        </Typography>
                        <Box
                          display="grid"
                          gap={2}
                          gridTemplateColumns="repeat(auto-fill, minmax(180px, 1fr))"
                        >
                          {castData
                            .filter((actor: any) => {
                              if (!actor.profile_path) return false;
                              if (!searchTerm) return true;
                              const name = (actor.name || "").toLowerCase();
                              // Rolle kann je nach API unterschiedlich sein
                              let role = "";
                              if (
                                Array.isArray(actor.roles) &&
                                actor.roles.length > 0 &&
                                typeof actor.roles[0]?.character === "string"
                              ) {
                                role = actor.roles[0].character.toLowerCase();
                              } else if (typeof actor.character === "string") {
                                role = actor.character.toLowerCase();
                              }
                              return (
                                name.includes(searchTerm.toLowerCase()) ||
                                role.includes(searchTerm.toLowerCase())
                              );
                            })
                            .slice(0, 40)
                            .map((actor: any) => (
                              <Box
                                key={`cast-${actor.id}-${actor.credit_id}`}
                                onClick={() => handlePersonClick(actor, false)}
                                sx={{
                                  background: "rgba(255,255,255,0.05)",
                                  borderRadius: 2,
                                  p: 1.5,
                                  textAlign: "center",
                                  backdropFilter: "blur(10px)",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                  transition: "all 0.3s ease",
                                  cursor: "pointer",
                                  "&:hover": {
                                    background: "rgba(255,255,255,0.1)",
                                    transform: "translateY(-5px)",
                                    borderColor: "var(--theme-primary)",
                                  },
                                }}
                              >
                                <Avatar
                                  src={
                                    actor.profile_path
                                      ? `https://image.tmdb.org/t/p/w200${actor.profile_path}`
                                      : undefined
                                  }
                                  alt={actor.name}
                                  sx={{
                                    width: 80,
                                    height: 80,
                                    mx: "auto",
                                    mb: 2,
                                    border: "2px solid var(--theme-primary)",
                                  }}
                                />
                                <Typography
                                  variant="subtitle1"
                                  sx={{
                                    fontWeight: "bold",
                                    color: "#ffffff",
                                    mb: 1,
                                  }}
                                >
                                  {actor.name}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "var(--theme-primary)",
                                    fontStyle: "italic",
                                  }}
                                >
                                  {Array.isArray(actor.roles) &&
                                  actor.roles.length > 0 &&
                                  typeof actor.roles[0]?.character === "string"
                                    ? actor.roles[0].character.replace(
                                        /\(voice\)/gi,
                                        "(Stimme)",
                                      )
                                    : typeof actor.character === "string"
                                      ? actor.character.replace(
                                          /\(voice\)/gi,
                                          "(Stimme)",
                                        )
                                      : ""}
                                </Typography>
                              </Box>
                            ))}
                        </Box>
                      </Box>
                    )}

                    {/* Crew Sektion - Bei allen Filmen/Serien */}
                    {crewData.filter((person: any) => person.profile_path)
                      .length > 0 && (
                      <Box>
                        <Typography
                          variant="h5"
                          sx={{
                            color: colors.status.warning,
                            mb: 2,
                            fontWeight: "bold",
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <GroupIcon />
                            Crew (
                            {
                              crewData.filter(
                                (person: any) => person.profile_path,
                              ).length
                            }
                            )
                          </Box>
                        </Typography>
                        <Box
                          display="grid"
                          gap={2}
                          gridTemplateColumns="repeat(auto-fill, minmax(180px, 1fr))"
                        >
                          {crewData
                            .filter((person: any) => {
                              if (!person.profile_path) return false;
                              if (!searchTerm) return true;
                              const name = (person.name || "").toLowerCase();
                              // Job kann je nach API unterschiedlich sein
                              let job = "";
                              if (
                                person.jobs &&
                                person.jobs[0] &&
                                person.jobs[0].job
                              ) {
                                job = person.jobs[0].job.toLowerCase();
                              } else if (person.job) {
                                job = person.job.toLowerCase();
                              }
                              return (
                                name.includes(searchTerm.toLowerCase()) ||
                                job.includes(searchTerm.toLowerCase())
                              );
                            })
                            .slice(0, 40)
                            .sort((a: any, b: any) => {
                              // Definiere Wichtigkeits-Ranking (niedrigere Zahl = wichtiger)
                              const getJobPriority = (job: string) => {
                                switch (job) {
                                  case "Director":
                                    return 1;
                                  case "Producer":
                                    return 2;
                                  case "Executive Producer":
                                    return 3;
                                  case "Co-Executive Producer":
                                    return 4;
                                  case "Writer":
                                    return 5;
                                  case "Screenplay":
                                    return 6;
                                  case "Story":
                                    return 7;
                                  case "Novel":
                                    return 8;
                                  case "Director of Photography":
                                    return 9;
                                  case "Editor":
                                    return 10;
                                  case "Original Music Composer":
                                    return 11;
                                  case "Music":
                                    return 12;
                                  case "Production Designer":
                                    return 13;
                                  case "Production Design":
                                    return 14;
                                  case "Production Manager":
                                    return 15;
                                  case "Casting":
                                    return 16;
                                  case "Camera Operator":
                                    return 17;
                                  case "Additional Music":
                                    return 18;
                                  case "Assistant Editor":
                                    return 19;
                                  case "Costume Design":
                                    return 20;
                                  case "Makeup Artist":
                                    return 21;
                                  case "Sound":
                                    return 22;
                                  case "Visual Effects Supervisor":
                                    return 23;
                                  case "Stunt Coordinator":
                                    return 24;
                                  case "Stunt Double":
                                    return 25;
                                  case "Stand In":
                                    return 26;
                                  case "Post Production Consulting":
                                    return 27;
                                  default:
                                    return 99; // Unbekannte Jobs am Ende
                                }
                              };

                              const jobA =
                                a.jobs && a.jobs[0] && a.jobs[0].job
                                  ? a.jobs[0].job
                                  : a.job || "";
                              const jobB =
                                b.jobs && b.jobs[0] && b.jobs[0].job
                                  ? b.jobs[0].job
                                  : b.job || "";
                              return (
                                getJobPriority(jobA) - getJobPriority(jobB)
                              );
                            })
                            .map((person: any, idx: number) => (
                              <Box
                                key={`crew-${person.id}-${
                                  person.credit_id || idx
                                }`}
                                onClick={() => handlePersonClick(person, true)}
                                sx={{
                                  background: "rgba(255,165,0,0.05)",
                                  borderRadius: 2,
                                  p: 1.5,
                                  textAlign: "center",
                                  backdropFilter: "blur(10px)",
                                  border: "1px solid rgba(255,165,0,0.2)",
                                  transition: "all 0.3s ease",
                                  cursor: "pointer",
                                  "&:hover": {
                                    background: `${colors.status.warning}10`,
                                    transform: "translateY(-5px)",
                                    borderColor: "#ffa500",
                                  },
                                }}
                              >
                                <Avatar
                                  src={
                                    person.profile_path
                                      ? `https://image.tmdb.org/t/p/w200${person.profile_path}`
                                      : undefined
                                  }
                                  alt={person.name}
                                  sx={{
                                    width: 80,
                                    height: 80,
                                    mx: "auto",
                                    mb: 2,
                                    border: "2px solid #ffa500",
                                  }}
                                />
                                <Typography
                                  variant="subtitle1"
                                  sx={{
                                    fontWeight: "bold",
                                    color: "#ffffff",
                                    mb: 1,
                                  }}
                                >
                                  {person.name}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: colors.status.warning,
                                    fontStyle: "italic",
                                  }}
                                >
                                  {translateJob(
                                    person.jobs &&
                                      person.jobs[0] &&
                                      person.jobs[0].job
                                      ? person.jobs[0].job
                                      : person.job || "",
                                  )}
                                </Typography>
                              </Box>
                            ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            )}
            {currentTab === 2 && (
              <Box px={2} py={3}>
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{ color: "var(--theme-primary)", mb: 3 }}
                >
                  Videos & Trailer
                </Typography>
                {videosLoading ? (
                  <Box textAlign="center" py={3}>
                    <CircularProgress
                      sx={{ color: "var(--theme-primary)", mb: 2 }}
                    />
                    <Typography variant="body1">Lade Videos...</Typography>
                  </Box>
                ) : videosData.length > 0 ? (
                  <Box
                    display="grid"
                    gap={2}
                    sx={{
                      gridTemplateColumns: {
                        xs: "1fr",
                        md: "repeat(auto-fit, minmax(320px, 1fr))",
                      },
                    }}
                  >
                    {videosData.slice(0, 8).map((video: any) => (
                      <Box
                        key={video.id}
                        sx={{
                          background:
                            video.type === "Trailer"
                              ? colors.button.secondary
                              : "rgba(255,255,255,0.05)",
                          borderRadius: 2,
                          overflow: "hidden",
                          backdropFilter: "blur(10px)",
                          border:
                            video.type === "Trailer"
                              ? `2px solid ${colors.border.primary}30`
                              : "1px solid rgba(255,255,255,0.1)",
                          transition: "all 0.3s ease",
                          gridColumn: "auto",
                          "&:hover": {
                            background:
                              video.type === "Trailer"
                                ? colors.button.secondaryHover
                                : "rgba(255,255,255,0.1)",
                            transform: "translateY(-5px)",
                            boxShadow:
                              video.type === "Trailer"
                                ? colors.shadow.hover
                                : "0 8px 25px rgba(0,0,0,0.2)",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            position: "relative",
                            paddingBottom: "56.25%",
                            height: 0,
                            overflow: "hidden",
                          }}
                        >
                          <Box
                            component="iframe"
                            src={`https://www.youtube.com/embed/${video.key}`}
                            title={video.name}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            sx={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              border: "none",
                            }}
                          />
                        </Box>
                        <Box p={1.5}>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: "bold", color: "#ffffff", mb: 1 }}
                            noWrap
                          >
                            {video.name}
                          </Typography>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Chip
                              label={video.type}
                              size={
                                video.type === "Trailer" ? "medium" : "small"
                              }
                              sx={{
                                background:
                                  video.type === "Trailer"
                                    ? `linear-gradient(135deg, ${colors.text.accent}, ${colors.text.accent}90)`
                                    : `${colors.text.accent}20`,
                                color:
                                  video.type === "Trailer" ? "#FFFFFF" : colors.text.accent,
                                fontWeight:
                                  video.type === "Trailer" ? "800" : "bold",
                                boxShadow:
                                  video.type === "Trailer"
                                    ? colors.shadow.buttonHover
                                    : "none",
                                textTransform: "uppercase",
                                letterSpacing:
                                  video.type === "Trailer" ? "0.5px" : "normal",
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{ color: "#9e9e9e" }}
                            >
                              {video.size}p
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography
                    variant="body1"
                    sx={{ textAlign: "center", color: "#9e9e9e" }}
                  >
                    Keine Videos verfügbar
                  </Typography>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions
            sx={{
              p: 2,
              gap: 1.5,
              background:
                "linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(45,45,48,0.95) 100%)",
              backdropFilter: "blur(10px)",
            }}
          >
            {!user ? (
              <Typography
                variant="body2"
                sx={{ color: "#9e9e9e", fontStyle: "italic" }}
              >
                Zum Hinzufügen bitte einloggen
              </Typography>
            ) : alreadyAdded ? (
              <Typography
                variant="body2"
                sx={{ color: "#4caf50", fontWeight: "bold" }}
              >
                <CheckCircle sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'middle' }} />
                Bereits in deiner Liste
              </Typography>
            ) : canAdd ? (
              <Button
                variant="contained"
                onClick={
                  onAdd || (() => {/* onAdd not implemented yet */})
                }
                disabled={adding || !onAdd}
                sx={{
                  backgroundColor: "var(--theme-primary)",
                  color: colors.text.secondary,
                  fontWeight: "bold",
                  "&:hover": {
                    backgroundColor: colors.primary,
                  },
                  "&:disabled": {
                    backgroundColor: "#666",
                    color: "#999",
                  },
                }}
              >
                {adding
                  ? "Wird hinzugefügt..."
                  : !onAdd
                    ? "Hinzufügen (noch nicht implementiert)"
                    : `${
                        type === "tv" ? "Serie" : "Film"
                      } zu meiner Liste hinzufügen`}
              </Button>
            ) : null}
          </DialogActions>
        </>
      ) : null}

      {/* Person Details Dialog */}
      <Dialog
        open={personDialogOpen}
        onClose={() => setPersonDialogOpen(false)}
        maxWidth="md"
        fullWidth
        disableRestoreFocus
        slotProps={{
          paper: {
            sx: {
              maxHeight: "80vh",
              background:
                "linear-gradient(145deg, #1a1a1a 0%, #2d2d30 50%, #1a1a1a 100%)",
              borderRadius: "20px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              overflow: "hidden",
              boxShadow:
                "0 16px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 215, 0, 0.3)",
              color: "white",
            },
          },
        }}
      >
        {personLoading ? (
          <DialogContent
            sx={{
              textAlign: "center",
              py: 8,
              background: "rgba(0,0,0,0.9)",
              backdropFilter: "blur(10px)",
              minHeight: "400px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress
              size={60}
              sx={{
                color: "var(--theme-primary)",
                mb: 3,
                "& .MuiCircularProgress-circle": {
                  strokeWidth: 3,
                },
              }}
            />
            <Typography
              variant="h5"
              sx={{
                color: "var(--theme-primary)",
                fontWeight: "bold",
                textShadow: colors.shadow.focus,
              }}
            >
              Lade Person-Details...
            </Typography>
          </DialogContent>
        ) : selectedPerson ? (
          <>
            <DialogTitle
              sx={{
                textAlign: "center",
                position: "relative",
                background:
                  "linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)",
                backdropFilter: "blur(15px)",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "1.25rem",
              }}
            >
              <Typography
                component="div"
                variant="h4"
                sx={{ fontWeight: "bold", color: colors.status.warning }}
              >
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                  <TheaterComedy sx={{ fontSize: '1.5rem' }} />
                  {selectedPerson.name}
                </Box>
              </Typography>
              <IconButton
                onClick={() => setPersonDialogOpen(false)}
                sx={{
                  position: "absolute",
                  right: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(255,255,255,0.7)",
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "12px",
                  "&:hover": {
                    background: "rgba(255,255,255,0.1)",
                    color: "#ffffff",
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent
              sx={{
                px: 2,
                pt: "24px !important",
                background:
                  "linear-gradient(180deg, rgba(26,26,26,0.95) 0%, rgba(45,45,48,0.95) 50%, rgba(26,26,26,0.95) 100%)",
                backdropFilter: "blur(10px)",
                color: "#ffffff",
              }}
            >
              <Box
                display="flex"
                gap={3}
                flexDirection={{ xs: "column", md: "row" }}
              >
                {selectedPerson.profile_path && (
                  <Box sx={{ flexShrink: 0 }}>
                    <Box
                      component="img"
                      src={
                        selectedPerson.profile_path?.startsWith("http")
                          ? selectedPerson.profile_path
                          : `https://image.tmdb.org/t/p/w300${selectedPerson.profile_path}`
                      }
                      alt={selectedPerson.name}
                      sx={{
                        width: { xs: "200px", md: "250px" },
                        height: "auto",
                        borderRadius: 2,
                        boxShadow:
                          `0 10px 30px rgba(0,0,0,0.5), ${colors.shadow.light}`,
                        mx: { xs: "auto", md: 0 },
                        display: "block",
                        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                        transformOrigin: "center",
                        "&:hover": {
                          transform: "scale(1.1)",
                          boxShadow:
                            `0 15px 40px rgba(0,0,0,0.6), ${colors.shadow.hover}`,
                        },
                      }}
                    />
                  </Box>
                )}
                <Box flex={1}>
                  {selectedPerson.biography && (
                    <Box>
                      <Typography
                        variant="h4"
                        gutterBottom
                        sx={{ color: "var(--theme-primary)", mb: 3 }}
                      >
                        Biographie
                      </Typography>
                      <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                        {selectedPerson.biography}
                      </Typography>
                    </Box>
                  )}
                  <Box display="flex" flexDirection="column" gap={2} mb={3}>
                    {selectedPerson.birthday && (
                      <Box>
                        <Typography variant="body2" sx={{ color: "#9e9e9e" }}>
                          Geboren
                        </Typography>
                        <Typography variant="body1">
                          {new Date(selectedPerson.birthday).toLocaleDateString(
                            "de-DE",
                          )}
                          {selectedPerson.place_of_birth &&
                            ` in ${selectedPerson.place_of_birth}`}
                        </Typography>
                      </Box>
                    )}
                    {selectedPerson.deathday && (
                      <Box>
                        <Typography variant="body2" sx={{ color: "#9e9e9e" }}>
                          Verstorben
                        </Typography>
                        <Typography variant="body1">
                          {new Date(selectedPerson.deathday).toLocaleDateString(
                            "de-DE",
                          )}
                        </Typography>
                      </Box>
                    )}
                    {selectedPerson.known_for_department && (
                      <Box>
                        <Typography variant="body2" sx={{ color: "#9e9e9e" }}>
                          Bekannt für
                        </Typography>
                        <Typography variant="body1">
                          {selectedPerson.known_for_department === "Acting"
                            ? "Schauspielerei"
                            : selectedPerson.known_for_department ===
                                "Directing"
                              ? "Regie"
                              : selectedPerson.known_for_department ===
                                  "Writing"
                                ? "Drehbuch"
                                : selectedPerson.known_for_department ===
                                    "Production"
                                  ? "Produktion"
                                  : selectedPerson.known_for_department ===
                                      "Sound"
                                    ? "Ton"
                                    : selectedPerson.known_for_department ===
                                        "Camera"
                                      ? "Kamera"
                                      : selectedPerson.known_for_department ===
                                          "Editing"
                                        ? "Schnitt"
                                        : selectedPerson.known_for_department ===
                                            "Art"
                                          ? "Kunst"
                                          : selectedPerson.known_for_department ===
                                              "Costume & Make-Up"
                                            ? "Kostüm & Make-Up"
                                            : selectedPerson.known_for_department ===
                                                "Visual Effects"
                                              ? "Visuelle Effekte"
                                              : selectedPerson.known_for_department}
                        </Typography>
                      </Box>
                    )}
                    {selectedPerson.popularity && (
                      <Box>
                        <Typography variant="body2" sx={{ color: "#9e9e9e" }}>
                          TMDB Popularität
                        </Typography>
                        <Typography variant="body1">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Star sx={{ fontSize: '1rem', color: '#fbbf24' }} />
                            {selectedPerson.popularity.toFixed(1)}
                          </Box>
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Filmographie Sektion */}
              <Box px={3} py={3} pt={2}>
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{ color: "var(--theme-primary)", mb: 1.5 }}
                >
                  Bekannte Filme & Serien
                </Typography>
                {creditsLoading ? (
                  <Box textAlign="center" py={1.5}>
                    <CircularProgress
                      size={24}
                      sx={{ color: "var(--theme-primary)", mb: 1 }}
                    />
                    <Typography variant="body2">
                      Lade Filmographie...
                    </Typography>
                  </Box>
                ) : personCredits.cast.length > 0 ||
                  personCredits.crew.length > 0 ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                      maxHeight: "350px",
                      overflowY: "auto",
                      pr: 1,
                      "&::-webkit-scrollbar": {
                        width: "8px",
                      },
                      "&::-webkit-scrollbar-track": {
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: "4px",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        background: "var(--theme-primary)",
                        borderRadius: "4px",
                        "&:hover": {
                          background: colors.primary,
                        },
                      },
                    }}
                  >
                    {/* Crew Credits - zeige zuerst wenn auf Crew geklickt */}
                    {Object.keys(personCredits)[0] === "crew" &&
                      personCredits.crew.map((credit: any) => (
                        <Box
                          key={`crew-first-${credit.id}-${credit.credit_id}`}
                          sx={{
                            display: "flex",
                            gap: 2,
                            background:
                              "linear-gradient(135deg, rgba(255,165,0,0.08) 0%, rgba(255,165,0,0.02) 100%)",
                            borderRadius: 2,
                            p: 1.5,
                            backdropFilter: "blur(10px)",
                            border: "1px solid rgba(255,165,0,0.2)",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            cursor: "pointer",
                            "&:hover": {
                              background:
                                "linear-gradient(135deg, rgba(255,165,0,0.15) 0%, rgba(255,165,0,0.05) 100%)",
                              borderColor: "rgba(255,165,0,0.4)",
                              transform: "translateX(8px)",
                              boxShadow: "0 8px 32px rgba(255,165,0,0.2)",
                            },
                          }}
                        >
                          <Box
                            sx={{
                              position: "relative",
                              flexShrink: 0,
                              width: 60,
                              height: 90,
                              borderRadius: 1.5,
                              overflow: "hidden",
                              background:
                                "linear-gradient(145deg, #2a2a2a, #1a1a1a)",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                            }}
                          >
                            {credit.poster_path ? (
                              <Box
                                component="img"
                                src={credit.poster_path?.startsWith('http') ? credit.poster_path : `https://image.tmdb.org/t/p/w200${credit.poster_path}`}
                                alt={credit.title || credit.name}
                                sx={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  transition: "transform 0.3s ease",
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: "100%",
                                  height: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  background:
                                    "linear-gradient(145deg, ${colors.background.surface}, #1a1a1a)",
                                  color: "#666",
                                  fontSize: "1.5rem",
                                }}
                              >
                                {credit.media_type === "movie" ? <MovieIcon /> : <TvIcon />}
                              </Box>
                            )}
                            <Box
                              sx={{
                                position: "absolute",
                                top: 4,
                                right: 4,
                                background:
                                  credit.media_type === "movie"
                                    ? "linear-gradient(135deg, #ff6b6b, #ff5252)"
                                    : `linear-gradient(135deg, ${colors.primary}, ${colors.text.accent})`,
                                borderRadius: "12px",
                                px: 0.8,
                                py: 0.3,
                                fontSize: "0.65rem",
                                fontWeight: "bold",
                                color:
                                  credit.media_type === "movie"
                                    ? "#fff"
                                    : "#000",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                              }}
                            >
                              {credit.media_type === "movie" ? "Film" : "Serie"}
                            </Box>
                          </Box>

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 700,
                                color: "#ffffff",
                                mb: 0.5,
                                lineHeight: 1.2,
                                fontSize: "0.95rem",
                                display: "-webkit-box",
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {credit.title || credit.name}
                            </Typography>

                            <Typography
                              variant="body2"
                              sx={{
                                color: "#ffa500",
                                fontStyle: "italic",
                                mb: 0.8,
                                fontSize: "0.8rem",
                                display: "-webkit-box",
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              als {translateJob(credit.job)}
                            </Typography>

                            <Box
                              sx={{
                                display: "flex",
                                alignItems: { xs: "flex-start", sm: "center" },
                                justifyContent: "space-between",
                                flexDirection: { xs: "column", sm: "row" },
                                gap: { xs: 1, sm: 0 },
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1.5,
                                  flexWrap: "wrap",
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "#9e9e9e",
                                    fontWeight: 500,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  <CalendarToday sx={{ fontSize: '0.875rem', mr: 0.5 }} />
                                  {credit.release_date
                                    ? new Date(
                                        credit.release_date,
                                      ).getFullYear()
                                    : credit.first_air_date
                                      ? new Date(
                                          credit.first_air_date,
                                        ).getFullYear()
                                      : "Unbekannt"}
                                </Typography>

                                {credit.vote_average &&
                                typeof credit.vote_average === "number" &&
                                credit.vote_average > 1 &&
                                credit.vote_count &&
                                credit.vote_count > 0 ? (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: colors.status.warning,
                                      fontWeight: 600,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.3,
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <Star sx={{ fontSize: '0.9rem', color: '#fbbf24' }} />
                                      {credit.vote_average.toFixed(1)}
                                    </Box>
                                  </Typography>
                                ) : null}
                              </Box>

                              {/* Add Button für Crew Credits */}
                              {user && (
                                <Box sx={{ flexShrink: 0 }}>
                                  {isTitleInList(credit) ? (
                                    <Tooltip title="Bereits in deiner Liste">
                                      <Chip
                                        icon={
                                          <CheckIcon
                                            sx={{ fontSize: "16px !important" }}
                                          />
                                        }
                                        label="In Liste"
                                        size="small"
                                        sx={{
                                          backgroundColor:
                                            "rgba(76, 175, 80, 0.2)",
                                          color: "#4caf50",
                                          border: "1px solid #4caf50",
                                          fontSize: "0.7rem",
                                          height: "24px",
                                        }}
                                      />
                                    </Tooltip>
                                  ) : (
                                    <Tooltip
                                      title={`${
                                        credit.media_type === "movie"
                                          ? "Film"
                                          : "Serie"
                                      } zu meiner Liste hinzufügen`}
                                    >
                                      <Chip
                                        icon={
                                          addingTitles.has(credit.id) ? (
                                            <CircularProgress
                                              size={14}
                                              sx={{ color: "#ffa500" }}
                                            />
                                          ) : (
                                            <AddIcon
                                              sx={{
                                                fontSize: "16px !important",
                                              }}
                                            />
                                          )
                                        }
                                        label={
                                          addingTitles.has(credit.id)
                                            ? "Hinzufügen..."
                                            : "Hinzufügen"
                                        }
                                        size="small"
                                        clickable
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAddTitle(credit);
                                        }}
                                        disabled={addingTitles.has(credit.id)}
                                        sx={{
                                          backgroundColor:
                                            "rgba(255,165,0,0.2)",
                                          color: colors.status.warning,
                                          border: "1px solid #ffa500",
                                          fontSize: "0.7rem",
                                          height: "24px",
                                          cursor: "pointer",
                                          transition: "all 0.2s ease",
                                          "&:hover": {
                                            backgroundColor:
                                              "rgba(255,165,0,0.3)",
                                            transform: "scale(1.05)",
                                          },
                                          "&:disabled": {
                                            backgroundColor:
                                              "rgba(255,255,255,0.05)",
                                            color: "#666",
                                            borderColor:
                                              "rgba(255,255,255,0.1)",
                                            cursor: "not-allowed",
                                          },
                                        }}
                                      />
                                    </Tooltip>
                                  )}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    {/* Cast Credits als zweites - nur Credits mit Charaktername anzeigen */}
                    {personCredits.cast
                      .filter((credit: any) => credit.character)
                      .map((credit: any) => (
                        <Box
                          key={`cast-second-${credit.id}-${credit.credit_id}`}
                          sx={{
                            display: "flex",
                            gap: 2,
                            background:
                              "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
                            borderRadius: 2,
                            p: 1.5,
                            backdropFilter: "blur(10px)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            cursor: "pointer",
                            "&:hover": {
                              background:
                                colors.status.info.gradient,
                              borderColor: `${colors.border.primary}30`,
                              transform: "translateX(8px)",
                              boxShadow: colors.shadow.card,
                            },
                          }}
                        >
                          <Box
                            sx={{
                              position: "relative",
                              flexShrink: 0,
                              width: 60,
                              height: 90,
                              borderRadius: 1.5,
                              overflow: "hidden",
                              background:
                                "linear-gradient(145deg, #2a2a2a, #1a1a1a)",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                            }}
                          >
                            {credit.poster_path ? (
                              <Box
                                component="img"
                                src={credit.poster_path?.startsWith('http') ? credit.poster_path : `https://image.tmdb.org/t/p/w200${credit.poster_path}`}
                                alt={credit.title || credit.name}
                                sx={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  transition: "transform 0.3s ease",
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: "100%",
                                  height: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  background:
                                    "linear-gradient(145deg, ${colors.background.surface}, #1a1a1a)",
                                  color: "#666",
                                  fontSize: "1.5rem",
                                }}
                              >
                                {credit.media_type === "movie" ? <MovieIcon /> : <TvIcon />}
                              </Box>
                            )}
                            <Box
                              sx={{
                                position: "absolute",
                                top: 4,
                                right: 4,
                                background:
                                  credit.media_type === "movie"
                                    ? "linear-gradient(135deg, #ff6b6b, #ff5252)"
                                    : `linear-gradient(135deg, ${colors.primary}, ${colors.text.accent})`,
                                borderRadius: "12px",
                                px: 0.8,
                                py: 0.3,
                                fontSize: "0.65rem",
                                fontWeight: "bold",
                                color:
                                  credit.media_type === "movie"
                                    ? "#fff"
                                    : "#000",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                              }}
                            >
                              {credit.media_type === "movie" ? "Film" : "Serie"}
                            </Box>
                          </Box>

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 700,
                                color: "#ffffff",
                                mb: 0.5,
                                lineHeight: 1.2,
                                fontSize: "0.95rem",
                                display: "-webkit-box",
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {credit.title || credit.name}
                            </Typography>

                            <Typography
                              variant="body2"
                              sx={{
                                color: "var(--theme-primary)",
                                fontStyle: "italic",
                                mb: 0.8,
                                fontSize: "0.8rem",
                                display: "-webkit-box",
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              als{" "}
                              {credit.character?.replace(
                                /\(voice\)/gi,
                                "(Stimme)",
                              )}
                            </Typography>

                            <Box
                              sx={{
                                display: "flex",
                                alignItems: { xs: "flex-start", sm: "center" },
                                justifyContent: "space-between",
                                flexDirection: { xs: "column", sm: "row" },
                                gap: { xs: 1, sm: 0 },
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1.5,
                                  flexWrap: "wrap",
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "#9e9e9e",
                                    fontWeight: 500,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  <CalendarToday sx={{ fontSize: '0.875rem', mr: 0.5 }} />
                                  {credit.release_date
                                    ? new Date(
                                        credit.release_date,
                                      ).getFullYear()
                                    : credit.first_air_date
                                      ? new Date(
                                          credit.first_air_date,
                                        ).getFullYear()
                                      : "Unbekannt"}
                                </Typography>

                                {credit.vote_average &&
                                typeof credit.vote_average === "number" &&
                                credit.vote_average > 1 &&
                                credit.vote_count &&
                                credit.vote_count > 0 ? (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: colors.status.warning,
                                      fontWeight: 600,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.3,
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <Star sx={{ fontSize: '0.9rem', color: '#fbbf24' }} />
                                      {credit.vote_average.toFixed(1)}
                                    </Box>
                                  </Typography>
                                ) : null}
                              </Box>

                              {user && (
                                <Box sx={{ flexShrink: 0 }}>
                                  {isTitleInList(credit) ? (
                                    <Tooltip title="Bereits in deiner Liste">
                                      <Chip
                                        icon={
                                          <CheckIcon
                                            sx={{ fontSize: "16px !important" }}
                                          />
                                        }
                                        label="In Liste"
                                        size="small"
                                        sx={{
                                          backgroundColor:
                                            "rgba(76, 175, 80, 0.2)",
                                          color: "#4caf50",
                                          border: "1px solid #4caf50",
                                          fontSize: "0.7rem",
                                          height: "24px",
                                        }}
                                      />
                                    </Tooltip>
                                  ) : (
                                    <Tooltip
                                      title={`${
                                        credit.media_type === "movie"
                                          ? "Film"
                                          : "Serie"
                                      } zu meiner Liste hinzufügen`}
                                    >
                                      <Chip
                                        icon={
                                          addingTitles.has(credit.id) ? (
                                            <CircularProgress
                                              size={14}
                                              sx={{
                                                color: "var(--theme-primary)",
                                              }}
                                            />
                                          ) : (
                                            <AddIcon
                                              sx={{
                                                fontSize: "16px !important",
                                              }}
                                            />
                                          )
                                        }
                                        label={
                                          addingTitles.has(credit.id)
                                            ? "Hinzufügen..."
                                            : "Hinzufügen"
                                        }
                                        size="small"
                                        clickable
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAddTitle(credit);
                                        }}
                                        disabled={addingTitles.has(credit.id)}
                                        sx={{
                                          backgroundColor:
                                            `${colors.primary}20`,
                                          color: "var(--theme-primary)",
                                          border: `1px solid var(--theme-primary)`,
                                          fontSize: "0.7rem",
                                          height: "24px",
                                          cursor: "pointer",
                                          transition: "all 0.2s ease",
                                          "&:hover": {
                                            backgroundColor:
                                              `${colors.primary}30`,
                                            transform: "scale(1.05)",
                                          },
                                          "&:disabled": {
                                            backgroundColor:
                                              "rgba(255,255,255,0.05)",
                                            color: "#666",
                                            borderColor:
                                              "rgba(255,255,255,0.1)",
                                            cursor: "not-allowed",
                                          },
                                        }}
                                      />
                                    </Tooltip>
                                  )}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      ))}
                  </Box>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{ textAlign: "center", color: "#9e9e9e" }}
                  >
                    Keine Filmographie verfügbar
                  </Typography>
                )}
              </Box>
            </DialogContent>
          </>
        ) : null}
      </Dialog>
    </Dialog>
    
    {/* Snackbar für Feedback - außerhalb des Dialogs */}
    <Snackbar
      open={snackbar.open}
      autoHideDuration={6000}
      onClose={() => setSnackbar({ ...snackbar, open: false })}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ 
        zIndex: 9999,
        mt: 8
      }}
    >
      <Alert 
        onClose={() => setSnackbar({ ...snackbar, open: false })} 
        severity={snackbar.severity}
        variant="filled"
        sx={{ 
          width: '100%',
          backgroundColor: snackbar.severity === 'success' ? 'rgba(46, 125, 50, 0.95)' : undefined,
          color: snackbar.severity === 'success' ? '#ffffff' : undefined,
          fontSize: '1rem',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
    </>
  );
};

export default React.memo(TmdbDialog);
