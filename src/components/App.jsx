import React, { useEffect, useState } from "react";
import "../Styles/App.css";
import SeriesRow from "./SeriesRow";
import Firebase from "firebase/compat/app";
import "firebase/compat/database";
import "firebase/compat/auth";
import "firebase/compat/analytics";
import config from "../configs/config";
import API from "../configs/API";

import SideNav from "./SideNav";
import Header from "./Header";
import Select from "./Select";
import Search from "./Search";
import Legende from "./Legende";
import ScrollUp from "./ScrollUp";
import ScrollDown from "./ScrollDown";

//provider mapping 337:Disney Plus; 8:Netflix; 9:Amazon Prime Video;  283:Crunchyroll;
//https://api.themoviedb.org/3/tv/246/watch/providers?api_key=d812a3cdd27ca10d95979a2d45d100cd request um provider zu bekommen

const App = () => {
  Date.prototype.addHours = function (h) {
    this.setHours(this.getHours() + h);
    return this;
  };
  Firebase.initializeApp(config);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [genre, setGenre] = useState("All");
  const [filter, setFilter] = useState("");
  const [serien, setSerien] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    checkGenre();
  }, [genre, filter]);

  useEffect(() => {
    laden();
  }, [serien]);

  const get_serien = async () => {
    const snapshot = await Firebase.database().ref("/serien").once("value");
    setSerien(snapshot.val());
  };

  const getProviders = (providerData) => {
    const providers = {
      337: {
        name: "Disney Plus",
        logo: `https://image.tmdb.org/t/p/original/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg`,
      },
      8: {
        name: "Netflix",
        logo: `https://image.tmdb.org/t/p/original/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg`,
      },
      9: {
        name: "Amazon Prime Video",
        logo: `https://image.tmdb.org/t/p/original/emthp39XA2YScoYL1p0sdbAH2WA.jpg`,
      },
      283: {
        name: "Crunchyroll",
        logo: `https://image.tmdb.org/t/p/original/8Gt1iClBlzTeQs8WQm8UrCoIxnQ.jpg`,
      },
      30: {
        name: "WOW",
        logo: `https://image.tmdb.org/t/p/original/1WESsDFMs3cJc2TeT3nnzwIffGv.jpg`,
      },
      350: {
        name: "Apple TV Plus",
        logo: `https://image.tmdb.org/t/p/original/6uhKBfmtzFqOcLousHwZuzcrScK.jpg`,
      },
      421: {
        name: "Joyn Plus",
        logo: `https://image.tmdb.org/t/p/original/2joD3S2goOB6lmepX35A8dmaqgM.jpg`,
      },
      531: {
        name: "Paramount Plus",
        logo: `https://image.tmdb.org/t/p/original/xbhHHa1YgtpwhC8lb1NQ3ACVcLd.jpg`,
      },
      178: {
        name: "MagentaTV",
        logo: `https://image.tmdb.org/t/p/original/uULoezj2skPc6amfwru72UPjYXV.jpg`,
      },
      298: {
        name: "RTL+",
        logo: `https://image.tmdb.org/t/p/original/3hI22hp7YDZXyrmXVqDGnVivNTI.jpg`,
      },
      354: {
        name: "Crunchyroll",
        logo: `https://image.tmdb.org/t/p/original/8Gt1iClBlzTeQs8WQm8UrCoIxnQ.jpg`,
      },
    };

    const flatrateProviders = providerData.results.DE?.flatrate || [];

    const anbieter = flatrateProviders
      .filter((provider) => providers[provider.provider_id])
      .map((provider) => ({
        id: provider.provider_id,
        logo: providers[provider.provider_id].logo,
        name: providers[provider.provider_id].name,
      }));

    return anbieter;
  };

  const laden = async () => {
    const promises = serien.map(async (serie, index) => {
      const response2 = await fetch(
        `https://api.themoviedb.org/3/tv/${serie.id}?api_key=${API.TMDB}`
      );
      const data3 = await response2.json();

      const provider = await fetch(
        `https://api.themoviedb.org/3/tv/${serie.id}/season/1/watch/providers?api_key=${API.TMDB}&language=en-US`
      );

      const providerData = await provider.json();

      const anbieter = getProviders(providerData);

      try {
        await Firebase.database()
          .ref(`serien/${index}/provider`)
          .set({ provider: anbieter });
      } catch (error) {
        await Firebase.database()
          .ref(`serien/${index}/provider`)
          .set({ provider: "" });
      }

      await Firebase.database()
        .ref(`serien/${index}/nextEpisode`)
        .set({ nextEpisode: "" });

      if (serie.tvMaze.tvMazeID !== "") {
        const tvMazeResponse = await fetch(
          `https://api.tvmaze.com/shows/${serie.tvMaze.tvMazeID}`
        );
        const tvMazeData = await tvMazeResponse.json();

        if (tvMazeData._links.nextepisode) {
          const tvMazeNextEpisodeResponse = await fetch(
            `${tvMazeData._links.nextepisode.href}`
          );
          const tvMazeNextEpisodeData = await tvMazeNextEpisodeResponse.json();
          await Firebase.database()
            .ref(`serien/${index}/nextEpisode`)
            .set({ nextEpisode: tvMazeNextEpisodeData.airstamp });
        }
      }

      const genres = ["All", ...data3.genres.map((genre) => genre.name)];
      await Firebase.database().ref(`serien/${index}/genre`).set({ genres });

      const posterUrl = `https://image.tmdb.org/t/p/original/${data3.poster_path}`;
      await Firebase.database()
        .ref(`serien/${index}/poster`)
        .set({ poster: posterUrl });

      await Firebase.database()
        .ref(`serien/${index}/production`)
        .set({ production: data3.in_production });

      const response3 = await fetch(
        `https://api.themoviedb.org/3/tv/${serie.id}/external_ids?api_key=${API.TMDB}&language=en-US`
      );
      const data4 = await response3.json();
      await Firebase.database()
        .ref(`serien/${index}/imdb`)
        .set({ imdb_id: data4.imdb_id });

      const woUrl =
        index === 2
          ? "https://www.werstreamt.es/serie/details/232578/avatar-der-herr-der-elemente/"
          : index === 35
          ? "https://www.werstreamt.es/serie/details/235057/vikings/"
          : `https://www.werstreamt.es/filme-serien/?q=${data4.imdb_id}&action_results=suchen`;
      await Firebase.database().ref(`serien/${index}/wo`).set({ wo: woUrl });

      return null;
    });

    await Promise.all(promises);
  };

  async function fetchData() {
    try {
      const snapshot = await Firebase.database().ref("/serien").once("value");
      const serienArray = snapshot.val();
      let dates = [];
      for (let i = 0; i < serienArray.length; i++) {
        if (serienArray[i].nextEpisode.nextEpisode !== "") {
          dates.push(new Date(serienArray[i].nextEpisode.nextEpisode));
        }
      }
      const date = dates.sort(function (a, b) {
        return a - b;
      })[0];
      const nextEp = new Date(date);
      const deleteDate = new Date(
        `${nextEp.getFullYear()}-${nextEp.getMonth() + 1}-${nextEp.getDate()}`
      ).addHours(24);
      console.log(new Date());
      console.log(deleteDate);

      if (new Date() >= deleteDate) {
        console.log("load");
        get_serien();
      }
    } catch (error) {
      console.error(error);
    }

    Firebase.database()
      .ref("timestamp/createdAt")
      .on("value", async (snap) => {
        if (Math.round((Date.now() - snap?.val()) / 1000) > 6912000) {
          try {
            get_serien();
            Firebase.database().ref("timestamp").set({
              createdAt: Firebase.database.ServerValue.TIMESTAMP,
            });
          } catch (error) {
            console.error(error);
          }
        }
      });

    checkGenre();
  }



  const isbigger = (a, b) => {
    let punktea = 0;
    let punkteb = 0;

    if (
      genre === "All" ||
      genre === "Animation" ||
      genre === "Documentary" ||
      genre === "Sport"
    ) {
      punktea = Object.entries(a["rating"]).reduce((acc, [key, value]) => {
        const multiplier = a["genre"]["genres"].includes(key) ? 3 : 1;
        return acc + value * multiplier;
      }, 0);
      punkteb = Object.entries(b["rating"]).reduce((acc, [key, value]) => {
        const multiplier = b["genre"]["genres"].includes(key) ? 3 : 1;
        return acc + value * multiplier;
      }, 0);
      punktea /= Object.keys(a["genre"]["genres"]).length;
      punkteb /= Object.keys(b["genre"]["genres"]).length;
    } else {
      punktea += a["rating"][genre];
      punkteb += b["rating"][genre];
      punktea /= 2;
      punkteb /= 2;
    }

    return punktea > punkteb;
  };

  const checkGenre = () => {
    let ref = Firebase.database().ref("/serien");
    ref.on("value", (snapshot) => {
      const series = snapshot.val();

      let filteredSeries = series.filter((serie) => {
        if (genre === "A-Z" || genre === "Zuletzt Hinzugefügt") {
          return serie.title.toLowerCase().includes(filter.toLowerCase());
        } else {
          return (
            serie.genre.genres.includes(genre) &&
            serie.title.toLowerCase().includes(filter.toLowerCase())
          );
        }
      });

      if (genre === "A-Z") {
        filteredSeries.sort((a, b) =>
          a.title > b.title ? 1 : b.title > a.title ? -1 : 0
        );
      } else if (genre === "Zuletzt Hinzugefügt") {
        filteredSeries.reverse();
      } else {
        filteredSeries.sort((a, b) =>
          a.title > b.title ? 1 : b.title > a.title ? -1 : 0
        );
        filteredSeries.sort((a, b) =>
          isbigger(a, b) ? -1 : !isbigger(a, b) ? 1 : 0
        );
      }

      var i = 1;
      var seriesRows = [];

      filteredSeries.forEach((serie) => {
        let date = Math.floor(Math.random() * 9999999999999999999);
        const seriesRow = (
          <SeriesRow
            serie={serie}
            key={date}
            i={i}
            genre={genre}
            filter={filter}
          />
        );
        seriesRows.push(seriesRow);
        i++;
      });
      setRows(seriesRows);
      setLoading(false);
    });
  };

  //7.343 7.22 7.11

  if (loading) {
    return (
      <div>
        <SideNav get_serien={get_serien} />
        <div id="main" key="0">
          <Header />
          <div id="Ueberschrift">
            <Select
              setGenre={(e) => {
                setGenre(e);
              }}
            />
            <Search
              search={(e) => {
                setFilter(e);
              }}
            />
            <Legende />
          </div>
          <ScrollDown />
          <div className="container">
            <div className="loader">
              <div className="inner one"></div>
              <div className="inner two"></div>
              <div className="inner three"></div>
            </div>
          </div>
          <ScrollUp />
        </div>
      </div>
    );
  } else {
    return (
      <div>
        <SideNav get_serien={get_serien} />
        <div id="main" key="0">
          <Header />
          <div id="Ueberschrift">
            <Select
              setGenre={(e) => {
                setGenre(e);
              }}
            />
            <Search
              search={(e) => {
                setFilter(e);
              }}
            />
            <Legende />
          </div>
          <ScrollDown />

          <div className="container">
            <ul className="list" id="serien">
              {rows}
            </ul>
          </div>
          <ScrollUp />
        </div>
      </div>
    );
  }
};

export default App;