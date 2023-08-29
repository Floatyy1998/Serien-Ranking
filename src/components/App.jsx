import React, { useEffect, useState } from "react";
import "../Styles/App.css";
import SeriesRow from "./SeriesRow";
import Firebase from "firebase/compat/app";
import "firebase/compat/database";
import "firebase/compat/auth";
import "firebase/compat/analytics";

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
import Bottleneck from "bottleneck";

const mail = process.env.REACT_APP_MAIL;
const API = process.env.REACT_APP_API_TMDB;

//provider mapping 337:Disney Plus; 8:Netflix; 9:Amazon Prime Video;  283:Crunchyroll; ros.desiree.97@gmail.com florian3456@aol.com
//https://api.themoviedb.org/3/tv/246/watch/providers?api_key=d812a3cdd27ca10d95979a2d45d100cd request um provider zu bekommen

const App = () => {
  Date.prototype.addHours = function (h) {
    this.setHours(this.getHours() + h);
    return this;
  };

  const limiter = new Bottleneck({
    minTime: 100, //minimum time between requests
    maxConcurrent: 45, //maximum concurrent requests
  });

  function scheduleRequest(endpoint) {
    return limiter.schedule(() => {
      return fetch(endpoint);
    });
  }
  const config = {
    apiKey: process.env.REACT_APP_APIKEY,
    authDomain: process.env.REACT_APP_AUTHDOMAIN,
    databaseURL: process.env.REACT_APP_DATABASEURL,
    projectId: process.env.REACT_APP_PROJECTID,
    storageBucket: process.env.REACT_APP_STORAGEBUCKET,
    messagingSenderId: process.env.REACT_APP_MESSAGINGSENDERID,
    appId: process.env.REACT_APP_APPID,
    measurementId: process.env.REACT_APP_MEASUREMENTID,
  };

  Firebase.initializeApp(config);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [genre, setGenre] = useState("All");
  const [filter, setFilter] = useState("");
  const [serien, setSerien] = useState([]);
  const [openErrorSnack, setOpenErrorSnack] = React.useState(false);
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
    const interval = setInterval(() => {
      fetchData();
    }, 600000);
    return () => clearInterval(interval);
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
    console.log("loadNewDates");
    const snapshot = await Firebase.database().ref("/serien").once("value");
    const serien = snapshot.val();
    const promises = serien.map(async (serie, index) => {
      if (serie.tvMaze.tvMazeID !== "") {
        await Firebase.database()
          .ref(`serien/${index}/nextEpisode`)
          .set({ nextEpisode: "" });
        let endpoint = `https://api.tvmaze.com/shows/${serie.tvMaze.tvMazeID}`;

        try {
          var tvMazeData = await scheduleRequest(endpoint);
          tvMazeData = await tvMazeData.json();

          if (tvMazeData._links.nextepisode) {
            endpoint = `${tvMazeData._links.nextepisode.href}`;

            var tvMazeNextEpisodeData = await scheduleRequest(endpoint);
            tvMazeNextEpisodeData = await tvMazeNextEpisodeData.json();

            await Firebase.database()
              .ref(`serien/${index}/nextEpisode`)
              .set({ nextEpisode: tvMazeNextEpisodeData.airstamp });
          }
        } catch (error) {
          console.log(error);
        }
      }
      return null;
    });

    await Promise.all(promises);
    console.log("loadNewDates finished");
  };

  const laden = async () => {
    setOpenStartSnack(true);
    let count = 0;
    const snapshot = await Firebase.database().ref("/serien").once("value");
    const serien = snapshot.val();
    const promises = serien.map((serie, index) =>
      task(serie, index).then((result) => {
        setProgress((count++ / serien.length) * 100);
        return Promise.resolve(result);
      })
    );

    const results = await Promise.all(promises);
    try {
      const values = await results;

      console.log(
        Math.round(
          (values.filter((x) => x % 2 === 0).length / serien.length) * 100
        )
      ); // [resolvedValue1, resolvedValue2]
    } catch (error) {
      console.log(error); // rejectReason of any first rejected promise
    }

    setOpenStartSnack(false);
    setOpenEndSnack(true);
    setProgress(0);
  };

  const task = async (serie, index) => {
    const snapshot = await Firebase.database().ref("/serien").once("value");
    const serien = snapshot.val();
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${serie.id}?api_key=${API}&language=de-DE`
    );
    const data = await response.json();
    const response2 = await fetch(
      `https://api.themoviedb.org/3/tv/${serie.id}?api_key=${API}`
    );
    const data3 = await response2.json();

    try {
      if (serie.tvMaze.tvMazeID !== "") {
        let endpoint = `https://api.tvmaze.com/shows/${serie.tvMaze.tvMazeID}`;
        const tvMazeResponse = await scheduleRequest(endpoint);

        await Firebase.database()
          .ref(`serien/${index}/nextEpisode`)
          .set({ nextEpisode: "" });

        const tvMazeData = await tvMazeResponse.json();

        if (tvMazeData._links.nextepisode) {
          endpoint = `${tvMazeData._links.nextepisode.href}`;

          var tvMazeNextEpisodeData = await scheduleRequest(endpoint);
          tvMazeNextEpisodeData = await tvMazeNextEpisodeData.json();

          await Firebase.database()
            .ref(`serien/${index}/nextEpisode`)
            .set({ nextEpisode: tvMazeNextEpisodeData.airstamp });
        }
      }
    } catch (error) {
      console.log(error);
    }

    const title = data.name;
    await Firebase.database().ref(`serien/${index}/title`).set(title);
    var random = 0;
    try {
      const images = await fetch(
        `https://api.themoviedb.org/3/tv/${serie.id}/images?api_key=${API}`
      );
      const imagesData = await images.json();
      const imagesList = imagesData.posters
        .filter((image) => {
          if (
            image.vote_average > 5 &&
            (image.iso_639_1 === null ||
              image.iso_639_1 === "en" ||
              image.iso_639_1 === "de" ||
              image.iso_639_1 === "ja")
          ) {
            return true;
          } else {
            return false;
          }
        })
        .map((image) => {
          return `https://image.tmdb.org/t/p/original${image.file_path}`;
        });
      //imagesList.map(image=> {return `https://image.tmdb.org/t/p/original${image.file_path}`});

      //zufallszahl zwischen 0 und 100
      random = Math.floor(Math.random() * (imagesList.length - 1));

      const posterUrl = imagesList[random];
      await Firebase.database()
        .ref(`serien/${index}/poster`)
        .set({ poster: posterUrl });
    } catch (error) {
      random = Math.floor(Math.random() * 100);
      const posterUrl =
        random % 2 === 0
          ? `https://image.tmdb.org/t/p/original${data.poster_path}`
          : `https://image.tmdb.org/t/p/original${data3.poster_path}`;
      await Firebase.database()
        .ref(`serien/${index}/poster`)
        .set({ poster: posterUrl });
    }

    await Firebase.database()
      .ref(`serien/${index}/production`)
      .set({ production: data3.in_production });

    const provider = await fetch(
      `https://api.themoviedb.org/3/tv/${serie.id}/season/1/watch/providers?api_key=${API}&language=en-US`
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
      `https://api.themoviedb.org/3/tv/${serie.id}/external_ids?api_key=${API}&language=en-US`
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
      `https://api.themoviedb.org/3/tv/${serie.id}/recommendations?api_key=${API}&language=de-DE`
    );
    const recData = await rec.json();
    const rec2 = await fetch(
      `https://api.themoviedb.org/3/tv/${serie.id}/recommendations?api_key=${API}&language=de-DE&page=2`
    );
    const recData2 = await rec2.json();
    let recResult = recData.results;
    let recResult2 = recData2.results;

    let recResults = [];
    for (let index = 0; index < recResult.length; index++) {
      if (
        recResult[index].poster_path === null ||
        recResult[index].poster_path === undefined ||
        recResult[index].poster_path === ""
      ) {
        continue;
      }
      recResults.push(recResult[index]);
    }
    for (let i = 0; i < recResult2.length; i++) {
      if (
        recResult2[i].poster_path === null ||
        recResult2[i].poster_path === undefined ||
        recResult2[i].poster_path === ""
      ) {
        continue;
      }
      recResults.push(recResult2[i]);
    }

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
      try {
        const provider = await fetch(
          `https://api.themoviedb.org/3/tv/${recs[i].id}/season/1/watch/providers?api_key=${API}&language=en-US`
        );

        const providerData = await provider.json();
        const anbieter = getProviders(providerData);

        recs[i].provider = anbieter;
        const response2 = await fetch(
          `https://api.themoviedb.org/3/tv/${recs[i].id}?api_key=${API}`
        );
        const data3 = await response2.json();
        recs[i].production = data3.in_production;

        const response3 = await fetch(
          `https://api.themoviedb.org/3/tv/${recs[i].id}/external_ids?api_key=${API}&language=en-US`
        );
        const data4 = await response3.json();
        recs[i].imdb_id = data4.imdb_id;

        recs[
          i
        ].wo = `https://www.werstreamt.es/filme-serien/?q=${data4.imdb_id}&action_results=suchen`;
      } catch (error) {}
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

    return random;
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
        setLoadNewDate(true);
      }
    } catch (error) {
      console.error(error);
    }

    Firebase.database()
      .ref("timestamp/createdAt")
      .on("value", async (snap) => {
        if (Math.round(Date.now() - snap?.val()) > 604800000) {
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
    setLoading(true);
    let ref = Firebase.database().ref("/serien");
    ref.on("value", (snapshot) => {
      const series = snapshot.val();

      if (series !== null) {
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
            a.title.toLowerCase() > b.title.toLowerCase()
              ? 1
              : b.title.toLowerCase() > a.title.toLowerCase()
              ? -1
              : 0
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
              toggleSerienStartSnack={(wert) => setOpenSerienSnack(wert)}
              toggleSerienEndSnack={(wert) => setOpenSerienEndSnack(wert)}
              setProgress={(wert) => setProgress(wert)}
            />
          );
          seriesRows.push(seriesRow);
          i++;
        });
        setRows(seriesRows);
        setLoading(false);
      }

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
        <Snackbar
          open={openErrorSnack}
          autoHideDuration={3000}
          onClose={(_) => setOpenErrorSnack(false)}
        >
          <Alert severity="error" sx={{ width: "100%" }}>
            Serie nicht gefunden! Bitte überprüfe ob du den Titel richtig
            geschrieben hast!
          </Alert>
        </Snackbar>
        <Snackbar open={openStartSnack}>
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
            toggleErrorSnack={(wert) => setOpenErrorSnack(wert)}
            setProgress={(wert) => setProgress(wert)}
            getProviders={getProviders}
            user={user}
          />
          <div id="main" key="0">
            <Header
              user={user}
              setLoadSeries={(wert) => {
                setLoadSeries(wert);
              }}
            />
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
                {rows.length > 0 ? (
                  rows
                ) : (
                  <h1 style={{ color: "white" }}>Keine Serien vorhanden!</h1>
                )}
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
