import React, { useEffect, useState } from "react";
import Firebase from "firebase/compat/app";

import Button from "@mui/material/Button";

import LoginDialog from "./LoginDialog";
import Bottleneck from "bottleneck";

const API = process.env.REACT_APP_API_TMDB;
const mail = process.env.REACT_APP_MAIL;
const UserId = process.env.REACT_APP_USERID;

function SideNav(props) {
  const [open, setOpen] = useState(false);

  const handlelogin = () => {
    if (document.getElementById("login").innerHTML === "LOGIN") {
      setOpen(true);
    } else {
      checklogin();
      document.getElementById("login").innerHTML = "LOGIN";
    }
  };

  const limiter = new Bottleneck({
    minTime: 100, //minimum time between requests
    maxConcurrent: 75, //maximum concurrent requests
  });

  function scheduleRequest(endpoint) {
    return limiter.schedule(() => {
      return fetch(endpoint);
    });
  }

  const checklogin = () => {
    const currentUser = Firebase.auth()?.currentUser;
    if (currentUser) {
      Firebase.auth()
        .signOut()
        .then(
          function () {
            localStorage.removeItem(mail);
            document.getElementById("login").innerHTML = "LOGIN";
          },
          function (error) {
            console.error("Sign Out Error", error);
          }
        );
    }
  };

  const handleFocus = (event) => {
    event.target.style.border = "1px solid #00fed7";
  };
  const handleBlur = (event) => {
    event.target.style.border = "1px solid rgb(204, 204, 204)";
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
    const snapshot = await Firebase.database().ref("/serien").once("value");
    props.setProgress(10);
    const serien = snapshot.val();
    var recommendations = "";
    var nextEpisode = "";
    var remake = false;
    var nextEpisodeTitle = "";
    var season = "";
    var episode = "";
    if (title.slice(-3) === "neu") {
      title = title.slice(0, -4);
      remake = true;
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/search/tv?api_key=${API}&query=${title}&page=1&language=de-DE`
    );
    const data = await response.json();
    if (
      serien.filter((serie) => serie.id === data.results[0].id).length > 0 &&
      !remake
    ) {
      console.log("Serie bereits vorhanden");
      alert(
        'Serie bereits vorhanden.\nWenn Sie versuchen ein Remake hinzuzufügen, fügen Sie bitte ein "neu" hinzu\n\nBeispiel: One Piece neu'
      );
      return;
    } else if (
      remake &&
      serien.filter((serie) => serie.id === data.results[1].id).length > 0
    ) {
     
      alert(
        "Remake bereits vorhanden...\nJetzt kann ich dir nicht mehr helfen"
      );
      return;
    }
    var id;
    var anzeigeTitel;

    if (remake) {
      id = data.results[1].id;
      anzeigeTitel = data.results[1].name;
    } else {
      id = data.results[0].id;
      anzeigeTitel = data.results[0].name;
    }
    props.setProgress(15);
    const detailsResponse = await fetch(
      `https://api.themoviedb.org/3/tv/${id}?api_key=${API}&language=en-US`
    );
    const detailsData = await detailsResponse.json();
    const genres = detailsData.genres.map((genre) => genre.name);
    const titleEN = detailsData.name;
    const titleOrginal=detailsData.original_name;
  
    var theMazeId = "";

    props.setProgress(20);
    try {
      var tvMazeResponse;
      var tvMazeData;
      if (!remake) {
        tvMazeResponse = await fetch(
          `https://api.tvmaze.com/singlesearch/shows?q=${titleEN}`
        );
        props.setProgress(25);
        tvMazeData = await tvMazeResponse.json();
        theMazeId = tvMazeData.id;
      } else {
        tvMazeResponse = await fetch(
          `https://api.tvmaze.com/search/shows?q=${titleEN}`
        );
        props.setProgress(25);
        tvMazeData = await tvMazeResponse.json();
        theMazeId = tvMazeData[1].show.id;
      }
    } catch (error) {
      if (!remake) {
        tvMazeResponse = await fetch(
          `https://api.tvmaze.com/singlesearch/shows?q=${titleOrginal}`
        );
        props.setProgress(25);
        tvMazeData = await tvMazeResponse.json();
        theMazeId = tvMazeData.id;
      } else {
        tvMazeResponse = await fetch(
          `https://api.tvmaze.com/search/shows?q=${titleOrginal}`
        );
        props.setProgress(25);
        tvMazeData = await tvMazeResponse.json();
        theMazeId = tvMazeData[1].show.id;
      }
    }

    if (theMazeId !== "") {
      var endpoint = `https://api.tvmaze.com/shows/${theMazeId}`;

      props.setProgress(30);
      try {
        var tvMazeData2 = await scheduleRequest(endpoint);
        tvMazeData = await tvMazeData2.json();
        

        if (tvMazeData._links.nextepisode) {
      
          endpoint = `${tvMazeData._links.nextepisode.href}`;
     

          var tvMazeNextEpisodeData = await scheduleRequest(endpoint);
          tvMazeNextEpisodeData = await tvMazeNextEpisodeData.json();
        
          nextEpisode = tvMazeNextEpisodeData.airdate;
          season = tvMazeNextEpisodeData.season;
          episode = tvMazeNextEpisodeData.number;
         

          const response = await fetch(
            `https://api.themoviedb.org/3/tv/${id}?api_key=${API}&language=de-DE`
          );
          const data = await response.json();

          if (!data.next_episode_to_air) {
            nextEpisodeTitle = tvMazeNextEpisodeData.name;
          } else {
            if (!String(data.next_episode_to_air.name).includes("Episode")) {
              nextEpisodeTitle = data.next_episode_to_air.name;
            } else {
              if (
                tvMazeNextEpisodeData.name === "TBA" ||
                tvMazeNextEpisodeData.name === "TBD"
              ) {
                nextEpisodeTitle = data.next_episode_to_air.name;
              } else {
                nextEpisodeTitle = tvMazeNextEpisodeData.name;
              }
            }
          }
        }
      } catch (error) {}
    }
    props.setProgress(40);

    const response2 = await fetch(
      `https://api.themoviedb.org/3/tv/${id}?api_key=${API}`
    );
    const data3 = await response2.json();
    const response1 = await fetch(
      `https://api.themoviedb.org/3/tv/${id}?api_key=${API}&language=de-DE`
    );
    const data1 = await response1.json();
  

    props.setProgress(43);

    var random = Math.floor(Math.random() * 100);
    var posterUrl =
      random % 2 === 0
        ? `https://image.tmdb.org/t/p/original${detailsData.poster_path}`
        : `https://image.tmdb.org/t/p/original${data1.poster_path}`;

    try {
      const images = await fetch(
        `https://api.themoviedb.org/3/tv/${id}/images?api_key=${API}`
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

      posterUrl = imagesList[random];
      if (posterUrl === undefined) {
        posterUrl = `https://image.tmdb.org/t/p/original${data1.poster_path}`;
      }
    } catch (error) {}
    const production = data3.in_production;
    props.setProgress(45);

    const provider = await fetch(
      `https://api.themoviedb.org/3/tv/${id}/season/1/watch/providers?api_key=${API}&language=en-US`
    );
    const providerData = await provider.json();
    const anbieter = props.getProviders(providerData);

    props.setProgress(50);

    const response3 = await fetch(
      `https://api.themoviedb.org/3/tv/${id}/external_ids?api_key=${API}&language=en-US`
    );
    const data4 = await response3.json();
    const imdb_id = data4.imdb_id;
    const wo = `https://www.werstreamt.es/filme-serien/?q=${data4.imdb_id}&action_results=suchen`;

    props.setProgress(55);
    const rec = await fetch(
      `https://api.themoviedb.org/3/tv/${id}/recommendations?api_key=${API}&language=de-DE`
    );
    const recData = await rec.json();
    props.setProgress(60);
    const rec2 = await fetch(
      `https://api.themoviedb.org/3/tv/${id}/recommendations?api_key=${API}&language=de-DE&page=2`
    );
    props.setProgress(65);
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
      try {
      const provider = await fetch(
        `https://api.themoviedb.org/3/tv/${recs[i].id}/season/1/watch/providers?api_key=${API}&language=en-US`
      );
      props.setProgress(70 + (i / recs.length) * 30);

      const providerData = await provider.json();
      const anbieter = props.getProviders(providerData);

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
     
        
      } catch (error) {
      
      }
    }
    try {
      if (recData.total_results !== 0) {
        recommendations = recs;
      }
    } catch (error) {}

    return {
      id,
      genres,
      theMazeId,
      nextEpisode,
      imdb_id,
      posterUrl,
      production,
      anbieter,
      wo,
      recommendations,
      anzeigeTitel,
      nextEpisodeTitle,
      season,
      episode,
      beschreibung: data1.overview,
    };
  };

  const addNewSeries = async (event) => {
    props.toggleSerienStartSnack(true);
    event.preventDefault();
    const length = await getSerienCount();
    props.setProgress(5);
    const nmr = parseInt(length) + 1;
    const title = event.target[0].value;
    const begründung = "";
    const ratings = {
      "Action & Adventure": 0,
      All: 0,
      Animation: 0,
      Comedy: 0,
      Crime: 0,
      Documentary: 0,
      Drama: 0,
      Family: 0,

      Kids: 0,
      Mystery: 0,
      Reality: 0,
      "Sci-Fi & Fantasy": 0,

      "War & Politics": 0,
      Western: 0,
    }; // getRatings(event);
    const {
      id,
      genres,
      theMazeId,
      nextEpisode,
      imdb_id,
      posterUrl,
      production,
      anbieter,
      wo,
      recommendations,
      anzeigeTitel,
      nextEpisodeTitle,
      season,
      episode,
      beschreibung
    } = await fetchSeriesData(title);
    props.setProgress(100);

    const postData = {
      imdb: { imdb_id: imdb_id },
      nextEpisode: {
        nextEpisode: nextEpisode,
        season: season,
        episode: episode,
        title: nextEpisodeTitle,
      },
      poster: { poster: posterUrl },
      provider: { provider: anbieter },
      recommendation: { recommendations: recommendations },
      tvMaze: { tvMazeID: theMazeId },
      production: { production: production },
      wo: { wo: wo },

      title: anzeigeTitel,
      nmr,
      rating: ratings,
      genre: { genres: ["All", ...genres] },
      id,
      begründung,
      beschreibung
    };
    const currentUser = Firebase.auth().currentUser;
    if (currentUser == null || currentUser.uid !== UserId) {
      alert("Bitte Einloggen!");
      return;
    }

    await Firebase.database()
      .ref("serien/" + nmr)
      .set(postData);

    event.target[0].value = "";

    props.toggleSerienStartSnack(false);
    props.toggleSerienEndSnack(true);
    props.setProgress(0);
  };

  const hinzufuegen = async (event) => {
    try {
      await addNewSeries(event);
    } catch (error) {
      console.error(error);
      props.toggleSerienStartSnack(false);
      props.toggleErrorSnack(true);
    }
  };

  return (
    <>
      <LoginDialog open={open} close={(_) => setOpen(false)}></LoginDialog>
      <div
        style={{ zIndex: "99", paddingLeft: "10%", paddingRight: "10%" }}
        id="mySidenav"
        className="sidenav"
      >
        <h3
          style={{ marginTop: "80px", height: "41px" }}
          className="button"
          id="login"
          onClick={(_) => handlelogin()}
        >
          LOGIN
        </h3>
        <form
          className="hinzufuegen"
          id="hinzufuegen"
          onSubmit={hinzufuegen.bind(this)}
          autoComplete="off"
          style={{ padding: "0", marginTop: "20px", textAlign: "center" }}
        >
          <h3 style={{ margin: "0", marginBottom: "9px", fontSize: "1.5rem" }}>
            Serie hinzufügen
          </h3>

          <label style={{ fontSize: "1.2rem" }} hmtlfor="Title">
            Title:{" "}
          </label>
          <input
            onFocus={handleFocus.bind(this)}
            onBlur={handleBlur.bind(this)}
            style={{ textAlign: "center" }}
            type="text"
            id="Title"
            name="Title"
          ></input>
          <Button
            style={{
              borderRadius: "10px",
              fontWeight: "bold",
              fontFamily: '"Belanosima", sans-serif',
              height: "41px",
              width: "100%",
              backgroundColor: "#333",
              color: "#ccc",
              fontSize: "1rem",
              marginBottom: "60px",
            }}
            type="submit"
            value="SERIE HINZUFÜGEN"
          >
            SERIE HINZUFÜGEN
          </Button>
        </form>
      </div>
    </>
  );
}

export default SideNav;
