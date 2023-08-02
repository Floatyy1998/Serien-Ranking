import React, { useEffect, useState } from "react";
import "../Styles/App.css";
import SeriesRow from "./SeriesRow";
import Firebase from "firebase/compat/app";
import "firebase/compat/database";
import "firebase/compat/auth";
import "firebase/compat/analytics";
import config from "../configs/config";
import API from "../configs/API";
import mail from "../configs/mail";

import SideNav from "./SideNav";
import Header from "./Header";
import Select from "./Select";
import Search from "./Search";
import Legende from "./Legende";
import ScrollUp from "./ScrollUp";
import ScrollDown from "./ScrollDown";
import { Snackbar } from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import LinearProgressWithLabel from "./LinearProgressWithLabel";

//provider mapping 337:Disney Plus; 8:Netflix; 9:Amazon Prime Video;  283:Crunchyroll; ros.desiree.97@gmail.com florian3456@aol.com
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
  const [openStartSnack, setOpenStartSnack] = React.useState(false);
  const [openEndSnack, setOpenEndSnack] = React.useState(false);
  const [openSerienSnack, setOpenSerienSnack] = React.useState(false);
  const [openSerienEndSnack, setOpenSerienEndSnack] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [user, setUser] = useState(null);

  const [loadSeries, setLoadSeries] = useState(false);
  const [loadNewDate, setLoadNewDate] = useState(false);

  const Alert = React.forwardRef(function Alert(props, ref) {
    return (
      <MuiAlert
        style={{ borderRadius: "30px" }}
        elevation={6}
        ref={ref}
        variant="filled"
        {...props}
      />
    );
  });

  const handleCloseEndSnack = (event, reason) => {
    setOpenEndSnack(false);
    if (reason === "clickaway") {
      return;
    }
  };
  const handleCloseSerienSnack = (event, reason) => {
    setOpenSerienEndSnack(false);
    if (reason === "clickaway") {
      return;
    }
  };
  useEffect(() => {
    get_serien();
    fetchData();
  }, []);
  useEffect(() => {
    if (!Firebase.auth().currentUser) {
      if (!localStorage.getItem(mail)) {
        Firebase.auth()
          .signOut()
          .then(
            function () {
              localStorage.removeItem(mail);
              setUser(null);
              document.getElementById("login").innerHTML = "LOGIN";
            },
            function (error) {
              console.error("Sign Out Error", error);
            }
          );
      } else {
        Firebase.auth()
          .signInWithEmailAndPassword(mail, localStorage.getItem(mail))
          .then((userCredential) => {
            setUser(mail);
            document.getElementById("login").innerHTML = "LOGOUT";
          })
          .catch((error) => {
            var errorMessage = error.message;
            alert(errorMessage);
          });
      }
    } else {
      setUser(mail);
      document.getElementById("login").innerHTML = "LOGOUT";
    }
  }, [user]);

  useEffect(() => {
    checkGenre();
  }, [genre, filter]);

  useEffect(() => {
    if (loadSeries) {
      laden();
      setLoadSeries(false);
    }
  }, [loadSeries]);

  useEffect(() => {
    if (loadNewDate) {
      loadNewDates();
      setLoadNewDate(false);
    }
  }, [loadNewDate]);

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

  const loadNewDates = async () => {
    const promises = serien.map(async (serie, index) => {
      if (serie.tvMaze.tvMazeID !== "") {
        const tvMazeResponse = await fetch(
          `https://api.tvmaze.com/shows/${serie.tvMaze.tvMazeID}`
        );
        try {
          const tvMazeData = await tvMazeResponse.json();

          if (tvMazeData._links.nextepisode) {
            const tvMazeNextEpisodeResponse = await fetch(
              `${tvMazeData._links.nextepisode.href}`
            );
            const tvMazeNextEpisodeData =
              await tvMazeNextEpisodeResponse.json();
            await Firebase.database()
              .ref(`serien/${index}/nextEpisode`)
              .set({ nextEpisode: tvMazeNextEpisodeData.airstamp });
          }
        } catch (error) {}
      }
      return null;
    });

    await Promise.all(promises);
  };

  const laden = async () => {
    setOpenStartSnack(true);
    let count = 0;

    const promises = serien.map((serie, index) =>
      task(serie, index).then(() => {
        setProgress((count++ / serien.length) * 100);
      })
    );

    await Promise.all(promises);
    setOpenStartSnack(false);
    setOpenEndSnack(true);
    setProgress(0);
  };

  const task = async (serie, index) => {
    const response2 = await fetch(
      `https://api.themoviedb.org/3/tv/${serie.id}?api_key=${API.TMDB}`
    );
    const data3 = await response2.json();

    await Firebase.database()
      .ref(`serien/${index}/nextEpisode`)
      .set({ nextEpisode: "" });

    if (serie.tvMaze.tvMazeID !== "") {
      const tvMazeResponse = await fetch(
        `https://api.tvmaze.com/shows/${serie.tvMaze.tvMazeID}`
      );
      try {
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
      } catch (error) {}
    }

    const posterUrl = `https://image.tmdb.org/t/p/original/${data3.poster_path}`;
    await Firebase.database()
      .ref(`serien/${index}/poster`)
      .set({ poster: posterUrl });

    await Firebase.database()
      .ref(`serien/${index}/production`)
      .set({ production: data3.in_production });

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

    const genres = ["All", ...data3.genres.map((genre) => genre.name)];
    await Firebase.database().ref(`serien/${index}/genre`).set({ genres });

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

    const rec = await fetch(
      `https://api.themoviedb.org/3/tv/${serie.id}/recommendations?api_key=${API.TMDB}&language=de-DE`
    );
    const recData = await rec.json();
    const rec2 = await fetch(
      `https://api.themoviedb.org/3/tv/${serie.id}/recommendations?api_key=${API.TMDB}&language=de-DE&page=2`
    );
    const recData2 = await rec2.json();
    let recResults = recData.results;
    recResults = recResults.concat(recData2.results);
    recResults = recResults.filter(
      (value, index, self) => index === self.findIndex((t) => t.id === value.id)
    );

    let ids = [];
    for (let i = 0; i < serien.length; i++) {
      ids.push(serien[i].id);
    }
    var recs = recResults.filter(function (o1) {
      if (!ids.includes(o1.id)) {
        return true;
      }
    });

    for (let i = 0; i < recs.length; i++) {
      const provider = await fetch(
        `https://api.themoviedb.org/3/tv/${recs[i].id}/season/1/watch/providers?api_key=${API.TMDB}&language=en-US`
      );

      const providerData = await provider.json();
      const anbieter = getProviders(providerData);

      recs[i].provider = anbieter;
      const response2 = await fetch(
        `https://api.themoviedb.org/3/tv/${recs[i].id}?api_key=${API.TMDB}`
      );
      const data3 = await response2.json();
      recs[i].production = data3.in_production;

      const response3 = await fetch(
        `https://api.themoviedb.org/3/tv/${recs[i].id}/external_ids?api_key=${API.TMDB}&language=en-US`
      );
      const data4 = await response3.json();
      recs[i].imdb_id = data4.imdb_id;

      recs[
        i
      ].wo = `https://www.werstreamt.es/filme-serien/?q=${data4.imdb_id}&action_results=suchen`;
    }
    try {
      if (recData.total_results === 0) {
        await Firebase.database()
          .ref(`serien/${index}/recommendation`)
          .set({ recommendations: "" });
      } else {
        await Firebase.database()
          .ref(`serien/${index}/recommendation`)
          .set({ recommendations: recs });
      }
    } catch (error) {
      await Firebase.database()
        .ref(`serien/${index}/recommendation`)
        .set({ recommendations: "" });
    }

    return null;
  };

  async function fetchData() {
    try {
      const snapshot = await Firebase.database().ref("/serien").once("value");
      const serienArray = snapshot.val();
      let dates = [];

      for (let i = 0; i < serienArray.length; i++) {
        try {
          if (serienArray[i].nextEpisode.nextEpisode !== "") {
            dates.push(new Date(serienArray[i].nextEpisode.nextEpisode));
          }
        } catch (error) {
          console.error(error + " ");
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
        setLoadNewDate(true);
      }
    } catch (error) {
      console.error(error);
    }

    Firebase.database()
      .ref("timestamp/createdAt")
      .on("value", async (snap) => {
        if (Math.round((Date.now() - snap?.val()) / 1000) > 6912000) {
          try {
            setLoadSeries(true);
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
      genre === "Neue Episoden" ||
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
        try {
          if (genre === "Neue Episoden") {
            return (
              serie.nextEpisode.nextEpisode !== "" &&
              serie.title.toLowerCase().includes(filter.toLowerCase())
            );
          } else if (genre === "A-Z" || genre === "Zuletzt Hinzugefügt") {
            return serie.title.toLowerCase().includes(filter.toLowerCase());
          } else {
            return (
              serie.genre.genres.includes(genre) &&
              serie.title.toLowerCase().includes(filter.toLowerCase())
            );
          }
        } catch (error) {}
      });

      if (genre === "A-Z") {
        filteredSeries.sort((a, b) =>
          a.title > b.title ? 1 : b.title > a.title ? -1 : 0
        );
      } else if (genre === "Neue Episoden") {
        filteredSeries.sort((a, b) =>
          a.nextEpisode.nextEpisode > b.nextEpisode.nextEpisode
            ? 1
            : b.nextEpisode.nextEpisode > a.nextEpisode.nextEpisode
            ? -1
            : 0
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

  const removeNav = () => {
    document.getElementById("mySidenav").classList.remove("sidenav-offen");
  };

  if (loading) {
    return (
      <>
        <div>
          <SideNav getProviders={getProviders} />
          <div id="main" key="0">
            <Header />
            <div id="Ueberschrift">
              <Search
                search={(e) => {
                  setFilter(e);
                }}
              />
              <Select
                setGenre={(e) => {
                  setGenre(e);
                }}
              />
              <Legende />
            </div>
            <ScrollDown />
            <div
              className="container"
              onClick={(_) => {
                removeNav();
              }}
            >
              <div className="loader">
                <div className="inner one"></div>
                <div className="inner two"></div>
                <div className="inner three"></div>
              </div>
            </div>
            <ScrollUp />
          </div>
        </div>
      </>
    );
  } else {
    return (
      <>
        <Snackbar open={openStartSnack} autoHideDuration={2000}>
          <Alert severity="warning" sx={{ width: "100%" }}>
            Daten werden geladen!
            <LinearProgressWithLabel value={progress} />
          </Alert>
        </Snackbar>
        <Snackbar
          open={openEndSnack}
          autoHideDuration={3000}
          onClose={handleCloseEndSnack}
        >
          <Alert
            onClose={handleCloseEndSnack}
            severity="success"
            sx={{ width: "100%" }}
          >
            Daten erfolgreich geladen!
          </Alert>
        </Snackbar>

        <Snackbar open={openSerienSnack} autoHideDuration={2000}>
          <Alert severity="warning" sx={{ width: "100%" }}>
            Serie wird hinzugefügt!
            <LinearProgressWithLabel value={progress} />
          </Alert>
        </Snackbar>
        <Snackbar
          open={openSerienEndSnack}
          autoHideDuration={3000}
          onClose={handleCloseSerienSnack}
        >
          <Alert
            onClose={handleCloseSerienSnack}
            severity="success"
            sx={{ width: "100%" }}
          >
            Serie erfolgreich hinzugefügt!
          </Alert>
        </Snackbar>
        <div>
          <SideNav
            toggleSerienStartSnack={(wert) => setOpenSerienSnack(wert)}
            toggleSerienEndSnack={(wert) => setOpenSerienEndSnack(wert)}
            setProgress={(wert) => setProgress(wert)}
            getProviders={getProviders}
            user={user}
          />
          <div id="main" key="0">
            <Header />
            <div id="Ueberschrift">
              <Search
                search={(e) => {
                  setFilter(e);
                }}
              />
              <Select
                setGenre={(e) => {
                  setGenre(e);
                }}
              />
              <Legende />
            </div>
            <ScrollDown />
            <div
              className="container"
              onClick={(_) => {
                removeNav();
              }}
            >
              <ul className="list" id="serien">
                {rows}
              </ul>
            </div>
            <ScrollUp />
          </div>
        </div>
      </>
    );
  }
};

export default App;
