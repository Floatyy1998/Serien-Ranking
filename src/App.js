import React, { Component, useEffect, useState } from "react";
import "./App.css";
import SeriesRow from "./SeriesRow.js";
import Firebase from "firebase/compat/app";
import "firebase/compat/database";
import "firebase/compat/auth";
import "firebase/compat/analytics";
import config from "./config.js";
import API from "./API.js";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import InputAdornment from "@mui/material/InputAdornment";
import Input from "@mui/material/Input";

//provider mapping 337:Disney Plus; 8:Netflix; 9:Amazon Prime Video;  283:Crunchyroll;
//https://api.themoviedb.org/3/tv/246/watch/providers?api_key=d812a3cdd27ca10d95979a2d45d100cd request um provider zu bekommen

var genre = "All";
var filter = "";

var serien = [];

const App = () => {
  Date.prototype.addHours = function (h) {
    this.setHours(this.getHours() + h);
    return this;
  };
  Firebase.initializeApp(config);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  const get_serien = async () => {
    const snapshot = await Firebase.database().ref("/serien").once("value");
    serien = snapshot.val();
    laden();
  };

  const scrollDown = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };
  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const laden = async () => {
    //const keySnap = await Firebase.database().ref("key").once("value");

    const promises = serien.map(async (serie, index) => {
      const response2 = await fetch(
        `https://api.themoviedb.org/3/tv/${serie.id}?api_key=${API.TMDB}`
      );
      const data3 = await response2.json();

      const provider = await fetch(
        `https://api.themoviedb.org/3/tv/${serie.id}/season/1/watch/providers?api_key=${API.TMDB}&language=en-US`
      );

      const providerData = await provider.json();
      var anbieter = [];
      try {
        for (let i = 0; i < providerData.results.DE.flatrate.length; i++) {
          switch (providerData.results.DE.flatrate[i].provider_id) {
            case 337:
              anbieter.push({
                id: providerData.results.DE.flatrate[i].provider_id,
                logo: `https://image.tmdb.org/t/p/original${providerData.results.DE.flatrate[i].logo_path}`,
                name: providerData.results.DE.flatrate[i].provider_name,
              });
              break;
            case 8:
              anbieter.push({
                id: providerData.results.DE.flatrate[i].provider_id,
                logo: `https://image.tmdb.org/t/p/original${providerData.results.DE.flatrate[i].logo_path}`,
                name: providerData.results.DE.flatrate[i].provider_name,
              });
              break;
            case 9:
              anbieter.push({
                id: providerData.results.DE.flatrate[i].provider_id,
                logo: `https://image.tmdb.org/t/p/original${providerData.results.DE.flatrate[i].logo_path}`,
                name: providerData.results.DE.flatrate[i].provider_name,
              });
              break;
            case 283:
              anbieter.push({
                id: providerData.results.DE.flatrate[i].provider_id,
                logo: `https://image.tmdb.org/t/p/original${providerData.results.DE.flatrate[i].logo_path}`,
                name: providerData.results.DE.flatrate[i].provider_name,
              });
              break;
            case 30:
              anbieter.push({
                id: providerData.results.DE.flatrate[i].provider_id,
                logo: `https://image.tmdb.org/t/p/original${providerData.results.DE.flatrate[i].logo_path}`,
                name: providerData.results.DE.flatrate[i].provider_name,
              });
              break;
            case 304:
              anbieter.push({
                id: providerData.results.DE.flatrate[i].provider_id,
                logo: `https://image.tmdb.org/t/p/original${providerData.results.DE.flatrate[i].logo_path}`,
                name: providerData.results.DE.flatrate[i].provider_name,
              });
              break;
            case 350:
              anbieter.push({
                id: providerData.results.DE.flatrate[i].provider_id,
                logo: `https://image.tmdb.org/t/p/original${providerData.results.DE.flatrate[i].logo_path}`,
                name: providerData.results.DE.flatrate[i].provider_name,
              });
              break;
            case 421:
              anbieter.push({
                id: providerData.results.DE.flatrate[i].provider_id,
                logo: `https://image.tmdb.org/t/p/original${providerData.results.DE.flatrate[i].logo_path}`,
                name: providerData.results.DE.flatrate[i].provider_name,
              });
              break;
            case 531:
              anbieter.push({
                id: providerData.results.DE.flatrate[i].provider_id,
                logo: `https://image.tmdb.org/t/p/original${providerData.results.DE.flatrate[i].logo_path}`,
                name: providerData.results.DE.flatrate[i].provider_name,
              });
              break;
            case 178:
              anbieter.push({
                id: providerData.results.DE.flatrate[i].provider_id,
                logo: `https://image.tmdb.org/t/p/original${providerData.results.DE.flatrate[i].logo_path}`,
                name: providerData.results.DE.flatrate[i].provider_name,
              });
              break;
            case 298:
              anbieter.push({
                id: providerData.results.DE.flatrate[i].provider_id,
                logo: `https://image.tmdb.org/t/p/original${providerData.results.DE.flatrate[i].logo_path}`,
                name: providerData.results.DE.flatrate[i].provider_name,
              });
              break;
            case 354:
              anbieter.push({
                id: 283,
                logo: "https://image.tmdb.org/t/p/original/8Gt1iClBlzTeQs8WQm8UrCoIxnQ.jpg",
                name: "Crunchyroll",
              });
              break;
          }
        }

        await Firebase.database()
          .ref(`serien/${index}/provider`)
          .set({ provider: anbieter });
      } catch (error) {
        await Firebase.database()
          .ref(`serien/${index}/provider`)
          .set({ provider: "" });
      }

      /* try{ const tvMazeResponse = await fetch(`https://api.tvmaze.com/singlesearch/shows?q=${serie.title}`);
      const tvMazeData = await tvMazeResponse.json();
      console.log(tvMazeData);
      await sleep(20000);
       await Firebase.database().ref(`serien/${index}/tvMaze`).set({ tvMazeID: tvMazeData.id });
      }
       catch(error){
         await Firebase.database().ref(`serien/${index}/tvMaze`).set({ tvMazeID: "" });
       } */
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
          // console.log(tvMazeNextEpisodeData.airstamp);
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

      /*   if (data3.next_episode_to_air) {
          // console.log(serie.title + " " +data3.next_episode_to_air.air_date + " " + new Date(data3.next_episode_to_air.air_date));
          await Firebase.database().ref(`serien/${index}/nextEpisode`).set({ nextEpisode: data3.next_episode_to_air.air_date });
        }
        else {
          await Firebase.database().ref(`serien/${index}/nextEpisode`).set({ nextEpisode: "" });
        } */

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
    // window.location.reload();
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
        const snapshot = await Firebase.database().ref("/serien").once("value");
        const serien = snapshot.val();
        laden(serien);
      }
    } catch (error) {
      console.error(error);
    }

    Firebase.database().ref("timestamp/createdAt").on("value", async (snap) => {
      if (Math.round((Date.now() - snap?.val()) / 1000) > 6912000) {
        try {
          const snapshot = await Firebase.database().ref("/serien").once("value");
          const serien = snapshot.val();
          get_serien(serien);
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

  useEffect(() => {
    fetchData();
  }, []);

  const checklogin = () => {
    const currentUser = Firebase.auth()?.currentUser;
    if (currentUser) {
      Firebase.auth()
        .signOut()
        .then(
          function () {
            localStorage.removeItem("konrad.dinges@googlemail.com");
            document.getElementById("login").innerHTML = "Login";
          },
          function (error) {
            console.error("Sign Out Error", error);
          }
        );
    }
  };

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

  const openNav = () => {
    document.getElementById("oben").style.transition = "0.5s";
    document.getElementById("legende1").style.transition = "0.5s";
    document.getElementById("legende2").style.transition = "0.5s";
    if (!Firebase.auth().currentUser) {
      if (!localStorage.getItem("konrad.dinges@googlemail.com")) {
        Firebase.auth()
          .signOut()
          .then(
            function () {
              localStorage.removeItem("konrad.dinges@googlemail.com");
              document.getElementById("login").innerHTML = "Login";
            },
            function (error) {
              console.error("Sign Out Error", error);
            }
          );
      } else {
        Firebase.auth()
          .signInWithEmailAndPassword(
            "konrad.dinges@googlemail.com",
            localStorage.getItem("konrad.dinges@googlemail.com")
          )
          .then((userCredential) => {
            document.getElementById("login").innerHTML = "Logout";
          })
          .catch((error) => {
            var errorMessage = error.message;
            alert(errorMessage);
          });
      }
    } else {
      document.getElementById("login").innerHTML = "Logout";
    }

    if (document.getElementById("mySidenav").style.width === "250px") {
      document.getElementById("oben").style.width = "100%";
      document.getElementById("Header1").style.visibility = "visible";
      document.getElementById("mySidenav").style.width = "0";
      document.getElementById("main").style.marginLeft = "0";
      document.getElementById("legende1").style.left = "10% ";
      document.getElementById("legende2").style.left = "calc(10% + 100px)";
    } else {
      if (window.innerWidth <= 860) {
        document.getElementById("Header1").style.visibility = "hidden";
      }
      document.getElementById("mySidenav").style.width = "250px";
      document.getElementById("main").style.marginLeft = "250px";
      document.getElementById("oben").style.width = "calc(100% - 250px)";
      document.getElementById("legende1").style.left = "calc(10% + 225px)";
      document.getElementById("legende2").style.left = "calc(10% + 325px)";
    }
  };

  const closeNav = () => {
    document.getElementById("mySidenav").style.width = "0";
    document.getElementById("main").style.marginLeft = "0";
    document.getElementById("hamburger").style.display = "visible";
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
          <SeriesRow serie={serie} key={date} i={i} genre={genre} filter={filter} />
        );
        seriesRows.push(seriesRow);
        i++;
      });
      setRows(seriesRows);
      setLoading(false);
    });
  };

  const categoryHandler = (event) => {
    genre = event.target.value;
    checkGenre();
  };

  const filterSerie = (event) => {
    filter = event.target.value.toLowerCase();
    checkGenre();
  };

  const getSerienCount = async () => {
    const snapshot = await Firebase.database().ref("/serien").once("value");
    const serien = snapshot.val();
    var length;
    if (serien) {
      Object.entries(serien).forEach(([key, value], index) => {
        length = key;
      });
    }

    return length;
  };

  const fetchSeriesData = async (title) => {
    const response = await fetch(
      `https://api.themoviedb.org/3/search/tv?api_key=${API.TMDB}&query=${title}&page=1`
    );
    const data = await response.json();
    const id = data.results[0].id;
    const detailsResponse = await fetch(
      `https://api.themoviedb.org/3/tv/${id}?api_key=${API.TMDB}&language=en-US`
    );
    const detailsData = await detailsResponse.json();
    const genres = detailsData.genres.map((genre) => genre.name);
    return { id, genres };
  };

  const getRatings = (event) => {
    const ratingInputs = Array.from(event.target).slice(2, 16);

    const ratings = {};
    ratingInputs.forEach((input) => {
      const value =
        input.value === "" || input.value === null
          ? 0
          : parseFloat(input.value);
      const key = input.name;
      ratings[key] = value;
    });
    return ratings;
  };
  //7.343 7.22 7.11

  const addNewSeries = async (event) => {
    event.preventDefault();

    const length = await getSerienCount();
    const nmr = parseInt(length) + 1;
    const title = event.target[1].value;
    const ratings = getRatings(event);
    const { id, genres } = await fetchSeriesData(title);
    const postData = {
      title,
      nmr,
      rating: ratings,
      genre: { genres: ["All", ...genres] },
      id,
    };

    const currentUser = Firebase.auth().currentUser;
    if (
      currentUser == null ||
      currentUser.uid !== "83fRTz3YqgMkjz646AJ1GO6I8Kg1"
    ) {
      alert("Bitte Einloggen!");
      return;
    }

    await Firebase.database()
      .ref("serien/" + nmr)
      .set(postData);

    try {
      const tvMazeResponse = await fetch(
        `https://api.tvmaze.com/singlesearch/shows?q=${title}`
      );
      const tvMazeData = await tvMazeResponse.json();

      // await sleep(20000);
      await Firebase.database()
        .ref(`serien/${nmr}/tvMaze`)
        .set({ tvMazeID: tvMazeData.id });
    } catch (error) {
      await Firebase.database()
        .ref(`serien/${nmr}/tvMaze`)
        .set({ tvMazeID: "" });
    }

    for (let j = 0; j < 16; j++) {
      event.target[j].value = "";
    }
    get_serien();
  };

  const hinzufuegen = async (event) => {
    
    try {
      await addNewSeries(event);
    } catch (error) {
      console.error(error);
      alert("Fehler beim Hinzufügen der Serie!");
    }
  };
  const login = () => {
    if (document.getElementById("login").innerHTML === "Login") {
      var email = prompt("email eingeben", "");
      if (email === null || email === "") {
        alert("email muss eingegeben werden");
      } else {
        var passwort = prompt("passwort eingeben", "");
        if (passwort === null || passwort === "") {
          alert("passwort muss eingegeben werden");
        } else {
          Firebase.auth()
            .signInWithEmailAndPassword(email, passwort)
            .then((userCredential) => {
              // Signed in
              document.getElementById("login").innerHTML = "Logout";
              localStorage.setItem("konrad.dinges@googlemail.com", passwort);
              // ...
            })
            .catch((error) => {
              var errorMessage = error.message;
              alert(errorMessage);
            });
        }
      }
    } else {
      checklogin();
      document.getElementById("login").innerHTML = "Login";
    }
  };

  const toggleHinzufuegen = () => {
    document.getElementById("hinzufuegen").style.display = "block";
  };

  if (loading) {
    return (
      <div>
        <div id="mySidenav" className="sidenav">
          <h3 className="button">Login</h3>
          <h3 className="button">Serie hinzufügen</h3>
          <form
            className="hinzufuegen"
            onSubmit={hinzufuegen.bind(this)}
            autoComplete="off"
          >
            <label hmtlfor="Title">Title: </label>
            <input type="text" id="Title" name="Title"></input>
            <br></br>
            <br></br>

            <h3>Rating</h3>
            <br></br>
            <br></br>
            <label hmtlfor="Action & Adventure">Action & Adventure: </label>
            <input
              type="text"
              id="Action & Adventure"
              name="Action & Adventure"
            ></input>
            <br></br>
            <br></br>
            <label hmtlfor="All">All: </label>
            <input type="text" id="All" name="All"></input>
            <br></br>
            <br></br>
            <label hmtlfor="Animation">Animation: </label>
            <input type="text" id="Animation" name="Animation"></input>
            <br></br>
            <br></br>
            <label hmtlfor="Comedy">Comedy: </label>
            <input type="text" id="Comedy" name="Comedy"></input>
            <br></br>
            <br></br>
            <label hmtlfor="Crime">Crime: </label>
            <input type="text" id="Crime" name="Crime"></input>
            <br></br>
            <br></br>
            <label hmtlfor="Documentary">Documentary: </label>
            <input type="text" id="Documentary" name="Documentary"></input>
            <br></br>
            <br></br>
            <label hmtlfor="Drama">Drama: </label>
            <input type="text" id="Drama" name="Drama"></input>
            <br></br>
            <br></br>
            <label hmtlfor="Horror">Horror: </label>
            <input type="text" id="Horror" name="Horror"></input>
            <br></br>
            <br></br>
            <label hmtlfor="Mystery">Mystery: </label>
            <input type="text" id="Mystery" name="Mystery"></input>
            <br></br>
            <br></br>
            <label hmtlfor="Sci-Fi & Fantasy">Sci-Fi & Fantasy: </label>
            <input
              type="text"
              id="Sci-Fi & Fantasy"
              name="Sci-Fi & Fantasy"
            ></input>
            <br></br>
            <br></br>
            <label hmtlfor="Sport">Sport: </label>
            <input type="text" id="Sport" name="Sport"></input>
            <br></br>
            <br></br>
            <label hmtlfor="Thriller">Thriller: </label>
            <input type="text" id="Thriller" name="Thriller"></input>
            <br></br>
            <br></br>
            <label hmtlfor="War & Politics">War & Politics: </label>
            <input
              type="text"
              id="War & Politics"
              name="War & Politics"
            ></input>
            <br></br>
            <br></br>
            <label hmtlfor="Western">Western: </label>
            <input type="text" id="Western" name="Western"></input>
            <br></br>
            <br></br>
            <input type="submit" value="Serie hinzufügen"></input>
          </form>
        </div>
        <div id="main" key="0">
          <div
            id="oben"
            style={{
              position: "fixed",
              top: "0",
              height: "60px",
              width: "100%",
              zIndex: "99",
            }}
          >
            <div className="row"></div>
            <div id="Header">
              <p id="Header1" onClick={scrollTop}>
                RANKING
              </p>
            </div>
            <div
              style={{
                background: "#111",
                height: "60px",
                float: "left",
                width: "10%",
              }}
            ></div>
          </div>
          <div id="Ueberschrift">
            {" "}
            <select
              style={{
                display: "block",
                marginTop: "80px",
                border: "1px solid #111",
                marginRight: "auto",
                marginLeft: "auto",
                fontSize: "40%",
              }}
              size="1"
              id="mySelect"
              onChange={categoryHandler.bind(this)}
            >
              <option value="All">Allgemein</option>
              <option value="Action & Adventure">Action & Adventure</option>
              <option value="Animation">Animation</option>
              <option value="Comedy">Comedy</option>
              <option value="Crime">Crime</option>
              <option value="Drama">Drama</option>
              <option value="Documentary">Documentary</option>
              <option value="Fantasy">Fantasy</option>
              <option value="Horror">Horror</option>
              <option value="Mystery">Mystery</option>
              <option value="Sci-Fi & Fantasy">Sci-Fi & Fantasy</option>
              <option value="Sport">Sport</option>
              <option value="Thriller">Thriller</option>
              <option value="War & Politics">War & Politics</option>
              <option value="Western">Western</option>
              <option value="A-Z">A-Z</option>
              <option value="Zuletzt Hinzugefügt">Zuletzt Hinzugefügt</option>
            </select>
            <FormControl style={{ width: "80%" }} variant="standard">
              <InputLabel
                style={{ color: "white", backgroundColor: "black" }}
                htmlFor="site-search"
              >
                Serie suchen
              </InputLabel>
              <Input
                type="search"
                id="site-search"
                name="q"
                label="Serie suchen"
                onChange={filterSerie.bind(this)}
                autoComplete="off"
                startAdornment={
                  <InputAdornment position="start">
                    <SearchOutlinedIcon style={{ color: "#fff" }} />
                  </InputAdornment>
                }
              />
            </FormControl>
            <div style={{ display: "flex", width: "100%", height: "32px" }}>
              <div
                className="legende"
                id="legende1"
                style={{
                  height: "15px",
                  position: "absolute",
                  right: "0px",
                  marginBottom: "2px",
                  top: "197px",
                  left: "10%",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: "15px",
                    background: "rgb(177, 3, 252)",
                    float: "left",
                  }}
                ></div>
                <div
                  style={{
                    height: "100%",
                    width: "70%",
                    float: "left",
                    fontSize: "15px",
                    textAlign: "left",
                    paddingLeft: "2%",
                    color: "rgb(170, 170, 170)",
                  }}
                >
                  {" "}
                  beendet
                </div>
              </div>
              <div
                className="legende"
                id="legende2"
                style={{
                  height: "15px",
                  position: "absolute",
                  right: "0px",
                  top: "197px",
                  left: "calc(10% + 100px)",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: "15px",
                    background: "rgb(66, 209, 15)",
                    float: "left",
                  }}
                ></div>
                <div
                  style={{
                    height: "100%",
                    width: "70%",
                    float: "left",
                    fontSize: "15px",
                    textAlign: "left",
                    paddingLeft: "2%",
                    color: "rgb(170, 170, 170)",
                  }}
                >
                  {" "}
                  laufend
                </div>
              </div>
              <Tooltip
                style={{
                  height: "20px",
                  width: "20px",
                  position: "absolute",

                  top: "197px",
                  right: "10%",
                }}
                title={
                  <React.Fragment>
                    <Typography style={{ textDecoration: "underline" }}>
                      <b>LEGENDE</b>
                    </Typography>
                    <br></br>
                    <span style={{ color: "#b103fc" }}>
                      {" "}
                      <b>beendet:</b> Es kommen keine weiteren Folgen.
                    </span>
                    <br></br>
                    <br></br>
                    <span style={{ color: "#42d10f" }}>
                      {" "}
                      <b>laufend:</b> Es kommen weitere Folgen.
                    </span>
                    <br></br>
                    <br></br>
                    <br></br>
                    <span>
                      Klicke auf ein Poster, um auf die IMDB-Seite zu gelangen.
                    </span>
                    <br></br>
                    <br></br>
                    <span>
                      Klicke auf den Titel, um zu erfahren, wo du die Serie
                      schauen kannst.
                    </span>
                    <br></br>
                    <br></br>
                    <span style={{ color: "#00fed7" }}>
                      Daten bereitgestellt von TMDB und JustWatch
                    </span>
                    <br></br>
                    <br></br>
                  </React.Fragment>
                }
                componentsProps={{
                  tooltip: {
                    sx: {
                      color: "#aaaaaa",
                      backgroundColor: "black",
                      fontSize: "0.9rem",
                    },
                  },
                }}
              >
                <InfoOutlinedIcon></InfoOutlinedIcon>
              </Tooltip>
            </div>
          </div>
          <p className="scrollen">
            <i
              title="Scrolle zum Ende"
              onClick={scrollDown}
              className="arrow down"
            ></i>
          </p>
          <div className="container">
            <div className="loader">
              <div className="inner one"></div>
              <div className="inner two"></div>
              <div className="inner three"></div>
            </div>
          </div>
          <p className="scrollen">
            <i
              title="Scrolle zum Anfang"
              onClick={scrollTop}
              className="arrow up"
            ></i>
          </p>
        </div>
      </div>
    );
  } else {
    return (
      <div>
        <div id="mySidenav" className="sidenav">
          <h3 className="button" id="login" onClick={(_) => login()}>
            Login
          </h3>
          <h3 className="button" onClick={(_) => toggleHinzufuegen()}>
            Serie hinzufügen
          </h3>
          <form
            className="hinzufuegen"
            id="hinzufuegen"
            onSubmit={hinzufuegen.bind(this)}
            autoComplete="off"
          >
            <h3>Serie hinzufügen</h3>
            <label style={{ display: "none" }} hmtlfor="Key">
              Key:{" "}
            </label>
            <input
              type="text"
              id="Key."
              name="Key"
              style={{ display: "none" }}
            ></input>
            <br></br>
            <br></br>
            <label hmtlfor="Title">Title: </label>
            <input type="text" id="Title" name="Title"></input>
            <br></br>
            <br></br>
            <h3>Rating</h3>
            <br></br>
            <br></br>
            <label hmtlfor="Action & Adventure">Action & Adventure: </label>
            <input
              type="text"
              id="Action & Adventure"
              name="Action & Adventure"
            ></input>
            <br></br>
            <br></br>
            <label hmtlfor="All">All: </label>
            <input type="text" id="All" name="All"></input>
            <br></br>
            <br></br>
            <label hmtlfor="Animation">Animation: </label>
            <input type="text" id="Animation" name="Animation"></input>
            <br></br>
            <br></br>
            <label hmtlfor="Comedy">Comedy: </label>
            <input type="text" id="Comedy" name="Comedy"></input>
            <br></br>
            <br></br>
            <label hmtlfor="Crime">Crime: </label>
            <input type="text" id="Crime" name="Crime"></input>
            <br></br>
            <br></br>
            <label hmtlfor="Documentary">Documentary: </label>
            <input type="text" id="Documentary" name="Documentary"></input>
            <br></br>
            <br></br>
            <label hmtlfor="Drama">Drama: </label>
            <input type="text" id="Drama" name="Drama"></input>
            <br></br>
            <br></br>
            <label hmtlfor="Horror">Horror: </label>
            <input type="text" id="Horror" name="Horror"></input>
            <br></br>
            <br></br>
            <label hmtlfor="Mystery">Mystery: </label>
            <input type="text" id="Mystery" name="Mystery"></input>
            <br></br>
            <br></br>
            <label hmtlfor="Sci-Fi & Fantasy">Sci-Fi & Fantasy: </label>
            <input
              type="text"
              id="Sci-Fi & Fantasy"
              name="Sci-Fi & Fantasy"
            ></input>
            <br></br>
            <br></br>
            <label hmtlfor="Sport">Sport: </label>
            <input type="text" id="Sport" name="Sport"></input>
            <br></br>
            <br></br>
            <label hmtlfor="Thriller">Thriller: </label>
            <input type="text" id="Thriller" name="Thriller"></input>
            <br></br>
            <br></br>
            <label hmtlfor="War & Politics">War & Politics: </label>
            <input
              type="text"
              id="War & Politics"
              name="War & Politics"
            ></input>
            <br></br>
            <br></br>
            <label hmtlfor="Western">Western: </label>
            <input type="text" id="Western" name="Western"></input>
            <br></br>
            <br></br>
            <input type="submit" value="Serie hinzufügen"></input>
          </form>
        </div>
        <div id="main" key="0">
          <div
            id="oben"
            style={{
              position: "fixed",
              top: "0",
              height: "60px",
              width: "100%",
              zIndex: "99",
            }}
          >
            <div className="row">
              <input type="checkbox" onClick={openNav} id="hamburg"></input>
              <label
                hmtlfor="hamburg"
                onClick={openNav}
                id="hamburger"
                className="hamburg"
              >
                <span className="line"></span>
                <span className="line"></span>
                <span className="line"></span>
              </label>
            </div>
            <div id="Header">
              <p id="Header1" onClick={scrollTop}>
                RANKING
              </p>
            </div>
            <div
              style={{
                background: "#111",
                height: "60px",
                float: "left",
                width: "10%",
              }}
            ></div>
          </div>
          <div id="Ueberschrift">
            <select
              style={{
                display: "block",
                marginTop: "80px",
                border: "1px solid #111",
                marginRight: "auto",
                marginLeft: "auto",
                fontSize: "40%",
              }}
              size="1"
              id="mySelect"
              onChange={categoryHandler.bind(this)}
            >
              <option value="All">Allgemein</option>
              <option value="Action & Adventure">Action & Adventure</option>
              <option value="Animation">Animation</option>
              <option value="Comedy">Comedy</option>
              <option value="Crime">Crime</option>
              <option value="Drama">Drama</option>
              <option value="Documentary">Documentary</option>
              <option value="Fantasy">Fantasy</option>
              <option value="Horror">Horror</option>
              <option value="Mystery">Mystery</option>
              <option value="Sci-Fi & Fantasy">Sci-Fi & Fantasy</option>
              <option value="Sport">Sport</option>
              <option value="Thriller">Thriller</option>
              <option value="War & Politics">War & Politics</option>
              <option value="Western">Western</option>
              <option value="A-Z">A-Z</option>
              <option value="Zuletzt Hinzugefügt">Zuletzt Hinzugefügt</option>
            </select>
            <FormControl style={{ width: "80%" }} variant="standard">
              <InputLabel
                style={{ color: "white", backgroundColor: "black" }}
                htmlFor="site-search"
              >
                Serie suchen
              </InputLabel>
              <Input
                type="search"
                id="site-search"
                name="q"
                label="Serie suchen"
                onChange={filterSerie.bind(this)}
                autoComplete="off"
                startAdornment={
                  <InputAdornment position="start">
                    <SearchOutlinedIcon style={{ color: "#fff" }} />
                  </InputAdornment>
                }
              />
            </FormControl>
            <div style={{ display: "flex", width: "100%", height: "32px" }}>
              <div
                className="legende"
                id="legende1"
                style={{
                  height: "15px",
                  position: "absolute",
                  right: "0px",
                  marginBottom: "2px",
                  top: "197px",
                  left: "10% ",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: "15px",
                    background: "rgb(177, 3, 252)",
                    float: "left",
                  }}
                ></div>
                <div
                  style={{
                    height: "100%",
                    width: "70%",
                    float: "left",
                    fontSize: "15px",
                    textAlign: "left",
                    paddingLeft: "2%",
                    color: "rgb(170, 170, 170)",
                  }}
                >
                  {" "}
                  beendet
                </div>
              </div>
              <div
                className="legende"
                id="legende2"
                style={{
                  height: "15px",
                  position: "absolute",
                  right: "0px",
                  top: "197px",
                  left: "calc(10% + 100px)",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: "15px",
                    background: "rgb(66, 209, 15)",
                    float: "left",
                  }}
                ></div>
                <div
                  style={{
                    height: "100%",
                    width: "70%",
                    float: "left",
                    fontSize: "15px",
                    textAlign: "left",
                    paddingLeft: "2%",
                    color: "rgb(170, 170, 170)",
                  }}
                >
                  {" "}
                  laufend
                </div>
              </div>
              <Tooltip
                style={{
                  height: "20px",
                  width: "20px",
                  position: "absolute",
                  top: "197px",
                  right: "10%",
                }}
                title={
                  <React.Fragment>
                    <Typography style={{ textDecoration: "underline" }}>
                      <b>LEGENDE</b>
                    </Typography>
                    <br></br>
                    <span style={{ color: "#b103fc" }}>
                      {" "}
                      <b>beendet:</b> Es kommen keine weiteren Folgen.
                    </span>
                    <br></br>
                    <br></br>
                    <span style={{ color: "#42d10f" }}>
                      {" "}
                      <b>laufend:</b> Es kommen weitere Folgen.
                    </span>
                    <br></br>
                    <br></br>
                    <br></br>
                    <span>
                      Klicke auf ein Poster, um auf die IMDB-Seite zu gelangen.
                    </span>
                    <br></br>
                    <br></br>
                    <span>
                      Klicke auf den Titel, um zu erfahren, wo du die Serie
                      schauen kannst.
                    </span>
                    <br></br>
                    <br></br>
                    <span style={{ color: "#00fed7" }}>
                      Daten bereitgestellt von TMDB und JustWatch
                    </span>
                    <br></br>
                    <br></br>
                  </React.Fragment>
                }
                componentsProps={{
                  tooltip: {
                    sx: {
                      color: "#aaaaaa",
                      backgroundColor: "black",
                      fontSize: "0.9rem",
                    },
                  },
                }}
              >
                <InfoOutlinedIcon></InfoOutlinedIcon>
              </Tooltip>
            </div>
          </div>
          <p className="scrollen">
            <i
              title="Scrolle zum Ende"
              onClick={scrollDown}
              className="arrow down"
            ></i>
          </p>

          <div className="container">
            <ul className="list" id="serien">
              {rows}
            </ul>
          </div>
          <p className="scrollen">
            <i
              title="Scrolle zum Anfang"
              onClick={scrollTop}
              className="arrow up"
            ></i>
          </p>
        </div>
      </div>
    );
  }
};

export default App;
