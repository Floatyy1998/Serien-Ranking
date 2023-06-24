import React, { Component } from "react";
import "./App.css";
import SeriesRow from "./SeriesRow.js";
import Firebase from "firebase";
import config from "./config.js";
import API from "./API.js";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import SearchIcon from "@material-ui/icons/Search";
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { forEach } from "lodash";
import { log } from "async";

const cheerio = require("cheerio");

var genre = "All";
var filter = "";
var pruefen = "";
var serien = [];
class App extends Component {
  constructor(props) {
    super(props);

    //console.log(API.TMDB);

    console.log();
    if (!Firebase.apps.length) {
      Firebase.initializeApp(config);
    } else {
      Firebase.app(); // if already initialized, use that one
    }
    Firebase.analytics();

    this.state = { loading: true };
  }
  get_serien() {
    alert("Daten werden aktualisiert\nBitte etwas Geduld");
    let ref = Firebase.database().ref("/serien");
    ref.once("value", (snapshot) => {
      snapshot.forEach(function (child) {
        console.log("APP.JS 33");
        serien.push(child.val());
      });
      this.laden();
    });
  }






  scrollDown() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }
  scrollTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }



  async laden() {
    console.log("laden");
    Firebase.database()
      .ref("key")
      .on("value", (snap) => {
        pruefen = snap.val();
      });

    for (let index = 0; index < serien.length; index++) {
      fetch(
        "https://api.themoviedb.org/3/tv/" +
        serien[index].id +
        "?api_key=" +
        API.TMDB +
        "&language=en-US"
      )
        .then(function (response2) {
          return response2.json();
        })
        .then((data3) => {
          console.log("APP.JS 65");
          Firebase.database()
            .ref("serien/" + index + "/poster")
            .set({
              poster: "https://image.tmdb.org/t/p/w780/" + data3.poster_path,
            });
          console.log("APP.JS 71");
          Firebase.database()
            .ref("serien/" + index + "/production")
            .set({ production: data3.in_production });
        })
        .then((_) => {
          fetch(
            "https://api.themoviedb.org/3/tv/" +
            serien[index].id +
            "/external_ids?api_key=" +
            API.TMDB +
            "&language=en-US"
          )
            .then(function (response3) {
              return response3.json();
            })
            .then((data4) => {
              console.log("APP.JS 86");
              Firebase.database()
                .ref("serien/" + index + "/imdb")
                .set({ imdb_id: data4.imdb_id });

              if (index == 2) {
                console.log("APP.JS 92");
                Firebase.database()
                  .ref("serien/" + index + "/wo")
                  .set({
                    wo: "https://www.werstreamt.es/serie/details/232578/avatar-der-herr-der-elemente/",
                  });
              } else if (index == 35) {
                Firebase.database()
                  .ref("serien/" + index + "/wo")
                  .set({
                    wo: "https://www.werstreamt.es/serie/details/235057/vikings/",
                  });
              } else {
                Firebase.database()
                  .ref("serien/" + index + "/wo")
                  .set({
                    wo:
                      "https://www.werstreamt.es/filme-serien/?q=" +
                      data4.imdb_id +
                      "&action_results=suchen",
                  });
              }


            })

            .catch(function (error) {
              console.log("Error: " + error);
            });
        })

        .catch(function (error) {
          console.log("Error: " + error);
        });
    }
  }

  componentDidMount() {
    Firebase.database()
      .ref("timestamp/createdAt")
      .on("value", (snap) => {
        console.log(Math.round((Date.now() - snap.val()) / 1000));
        if (Math.round((Date.now() - snap.val()) / 1000) > 1209600) {
          this.get_serien();
          Firebase.database().ref("timestamp").set({
            createdAt: Firebase.database.ServerValue.TIMESTAMP,
          });
        }
      });

    /*    Firebase.database()
    .ref("timestamp")
    .set({
      createdAt: Firebase.database.ServerValue.TIMESTAMP
    }); */
    // this.get_serien();
    this.checkGenre();
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.watching !== prevState.watching) {
      this.checkGenre();
    }
  }

  checklogin() {
    if (Firebase.auth().currentUser) {
      Firebase.auth()
        .signOut()
        .then(
          function () {
            console.log("Signed Out");
            document.getElementById("login").innerHTML = "Login";
          },
          function (error) {
            console.error("Sign Out Error", error);
          }
        );
    }
  }

  isbigger(a, b) {
    let punktea = 0;
    let punkteb = 0;

    if (
      genre === "All" ||
      genre === "Animation" ||
      genre === "Documentary" ||
      genre === "Sport"
    ) {
      Object.entries(a["rating"]).forEach(([key, value]) => {
        if (a["genre"].includes(key)) {
          punktea += value * 3;
        } else {
          punktea += value;
        }
      });
      Object.entries(b["rating"]).forEach(([key, value]) => {
        if (b["genre"].includes(key)) {
          punkteb += value * 3;
        } else {
          punkteb += value;
        }
      });
      punktea /= Object.keys(a["genre"]).length;
      punkteb /= Object.keys(b["genre"]).length;
    } else {
      punktea += a["rating"][genre];
      punkteb += b["rating"][genre];

      punktea /= 2;

      punkteb /= 2;
    }

    if (punktea > punkteb) {
      return true;
    } else {
      return false;
    }
  }

  openNav() {
    console.log("hi");
    document.getElementById("oben").style.transition = "0.5s";
    document.getElementById("legende1").style.transition = "0.5s";
    document.getElementById("legende2").style.transition = "0.5s";

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
  }

  /* Set the width of the side navigation to 0 and the left margin of the page content to 0 */
  closeNav() {
    document.getElementById("mySidenav").style.width = "0";
    document.getElementById("main").style.marginLeft = "0";
    document.getElementById("hamburger").style.display = "visible";
  }

  checkGenre() {
    if (this.state.watching) {
      let ref = Firebase.database()
        .ref("/serien")
        .orderByChild("watching")
        .equalTo(true);
      const series = [];
      ref.on("value", (snapshot) => {
        snapshot.forEach(function (child) {
          console.log("APP.JS 427");
          series.push(child.val());
        });

        if (genre === "A-Z") {
          series.sort((a, b) =>
            a.title > b.title ? 1 : b.title > a.title ? -1 : 0
          );
        } else {
          series.sort((a, b) =>
            a.title > b.title ? 1 : b.title > a.title ? -1 : 0
          );
          series.sort((a, b) =>
            this.isbigger(a, b) ? -1 : !this.isbigger(a, b) ? 1 : 0
          );
        }
        if (filter !== "") {
          series.sort((a, b) =>
            a.title > b.title ? 1 : b.title > a.title ? -1 : 0
          );
        }

        var i = 1;
        var seriesRows = [];
        series.forEach((serie) => {
          if (genre === "A-Z") {
            if (serie.title.toLowerCase().includes(filter)) {
              if (filter === "") {
                const seriesRow = (
                  <SeriesRow serie={serie} i={i} genre={genre} filter="" />
                );
                seriesRows.push(seriesRow);
                i++;
              } else {
                const seriesRow = (
                  <SeriesRow
                    serie={serie}
                    i={i}
                    genre={genre}
                    filter={filter}
                  />
                );
                seriesRows.push(seriesRow);
                i++;
              }
            }
            this.setState({ rows: seriesRows });
          } else {
            if (
              serie.genre.includes(genre) &&
              serie.title.toLowerCase().includes(filter)
            ) {
              if (filter === "") {
                const seriesRow = (
                  <SeriesRow serie={serie} i={i} genre={genre} filter="" />
                );
                seriesRows.push(seriesRow);
                i++;
              } else {
                const seriesRow = (
                  <SeriesRow
                    serie={serie}
                    i={i}
                    genre={genre}
                    filter={filter}
                  />
                );
                seriesRows.push(seriesRow);
                i++;
              }
            }
            this.setState({ rows: seriesRows });
          }
        });
        this.setState({ loading: false });
      });
    } else {
      let ref = Firebase.database().ref("/serien");

      ref.on("value", (snapshot) => {
        const series = snapshot.val();

        if (genre === "A-Z") {
          series.sort((a, b) =>
            a.title > b.title ? 1 : b.title > a.title ? -1 : 0
          );
        } else {
          series.sort((a, b) =>
            a.title > b.title ? 1 : b.title > a.title ? -1 : 0
          );
          series.sort((a, b) =>
            this.isbigger(a, b) ? -1 : !this.isbigger(a, b) ? 1 : 0
          );
        }
        if (filter !== "") {
          series.sort((a, b) =>
            a.title.indexOf(filter) > b.title.indexOf(filter)
              ? 1
              : b.title.indexOf(filter) > a.title.indexOf(filter)
                ? -1
                : 0
          );
        }

        var i = 1;
        var seriesRows = [];
        series.forEach((serie) => {
          if (genre === "A-Z") {
            if (serie.title.toLowerCase().includes(filter)) {
              if (filter === "") {
                const seriesRow = (
                  <SeriesRow serie={serie} i={i} genre={genre} filter="" />
                );
                seriesRows.push(seriesRow);
                i++;
              } else {
                const seriesRow = (
                  <SeriesRow
                    serie={serie}
                    i={i}
                    genre={genre}
                    filter={filter}
                  />
                );
                seriesRows.push(seriesRow);
                i++;
              }
            }
            this.setState({ rows: seriesRows });
          } else {
            if (
              serie.genre.includes(genre) &&
              serie.title.toLowerCase().includes(filter)
            ) {
              if (filter === "") {
                const seriesRow = (
                  <SeriesRow serie={serie} i={i} genre={genre} filter="" />
                );
                seriesRows.push(seriesRow);
                i++;
              } else {
                const seriesRow = (
                  <SeriesRow
                    serie={serie}
                    i={i}
                    genre={genre}
                    filter={filter}
                  />
                );
                seriesRows.push(seriesRow);
                i++;
              }
            }
            this.setState({ rows: seriesRows });
          }
        });
        this.setState({ loading: false });
        this.checklogin();
      });
    }
  }

  categoryHandler(event) {
    genre = event.target.value;
    this.checkGenre();
  }

  filterSerie(event) {
    filter = event.target.value.toLowerCase();
    this.checkGenre();
  }



  hinzufuegen(event) {
    console.log(event);
    event.preventDefault();
    let self = this;

    var ratings = {
      "Action":
        event.target[2].value === "" || event.target[2].value === null
          ? 0
          : parseFloat(event.target[2].value),
      Adventure:
        event.target[3].value === "" || event.target[3].value === null
          ? 0
          : parseFloat(event.target[3].value),
      All:
        event.target[4].value === "" || event.target[4].value === null
          ? 0
          : parseFloat(event.target[4].value),
      Animation:
        event.target[5].value === "" || event.target[5].value === null
          ? 0
          : parseFloat(event.target[5].value),
      Comedy:
        event.target[6].value === "" || event.target[6].value === null
          ? 0
          : parseFloat(event.target[6].value),
      Crime:
        event.target[7].value === "" || event.target[7].value === null
          ? 0
          : parseFloat(event.target[7].value),
      Documentary:
        event.target[8].value === "" || event.target[8].value === null
          ? 0
          : parseFloat(event.target[8].value),
      Drama:
        event.target[9].value === "" || event.target[9].value === null
          ? 0
          : parseFloat(event.target[9].value),
      "Sci-Fi & Fantasy":
        event.target[10].value === "" || event.target[10].value === null
          ? 0
          : parseFloat(event.target[10].value),
      Horror:
        event.target[11].value === "" || event.target[11].value === null
          ? 0
          : parseFloat(event.target[11].value),
      Mystery:
        event.target[12].value === "" || event.target[12].value === null
          ? 0
          : parseFloat(event.target[12].value),

      Sport:
        event.target[13].value === "" || event.target[13].value === null
          ? 0
          : parseFloat(event.target[13].value),
      Thriller:
        event.target[14].value === "" || event.target[14].value === null
          ? 0
          : parseFloat(event.target[14].value),
    };


    var genres = ["All"];
    var nmr = document.getElementsByClassName("padding").length
    var postData = {
      title: event.target[1].value,
      rating: ratings,
    };
    self.setState({ loading: true });
    if (Firebase.auth().currentUser == null) {
      alert("Bitte Einloggen!");
    } else if (nmr === "") {
      alert("Nummer eingeben!!!");
    } else if (
      Firebase.auth().currentUser.uid != "83fRTz3YqgMkjz646AJ1GO6I8Kg1"
    ) {
      alert("Bitte Einloggen!");
    } else {
      fetch(
        "https://api.themoviedb.org/3/search/tv?api_key=" +
        API.TMDB +
        "&query=" +
        event.target[1].value +
        "&page=1"
      )
        .then(function (response) {
          return response.json();
        })
        .then((data) => {
          return data["results"][0].id;
        })
        .then((daten) => {
          postData["id"] = daten;
          return daten;
        })
        .then((daten) => {
          console.log("Hallo fdfd " + daten);
          fetch(
            "https://api.themoviedb.org/3/tv/" +
            daten +
            "?api_key=" +
            API.TMDB +
            "&language=en-US"
          ).then(function (response) {
            return response.json();
          }).then((data) => {
            console.log(data.genres);
            for (var i = 0; i < data.genres.length; i++) {
              console.log(data.genres[i].name);
              genres.push(data.genres[i].name)
            }
            postData["genre"] = genres;
          }).then((_) => {
            console.log("Hallo2");
            Firebase.database()
              .ref("serien/" + nmr)
              .set(postData)
              .then(() => {
                for (let j = 0; j < 16; j++) {
                  event.target[j].value = "";
                }

                self.get_serien();
                alert("Serie hinzugefügt!");
              });
          });
        })

    }
  }
  login = () => {
    if (document.getElementById("login").innerHTML == "Login") {
      var email = prompt("email eingeben", "");
      if (email == null || email == "") {
        alert("email muss eingegeben werden");
      } else {
        var passwort = prompt("passwort eingeben", "");
        if (passwort == null || passwort == "") {
          alert("passwort muss eingegeben werden");
        } else {
          Firebase.auth()
            .signInWithEmailAndPassword(email, passwort)
            .then((userCredential) => {
              // Signed in
              document.getElementById("login").innerHTML = "Logout";
              // ...
            })
            .catch((error) => {
              var errorMessage = error.message;
              alert(errorMessage);
            });
        }
      }
    } else {
      this.checklogin();
      document.getElementById("login").innerHTML = "Login";
    }
  };

  toggleHinzufuegen = () => {

    document.getElementById("hinzufuegen").style.display = "block";
  };


  render() {
    if (this.state.loading) {
      return (
        <div>
          <div id="mySidenav" className="sidenav" >
            <h3 className="button">Login</h3>
            <h3 className="button">Serie hinzufügen</h3>

            <form
              className="hinzufuegen"
              onSubmit={this.hinzufuegen.bind(this)}
              autoComplete="off"
            >

              <label hmtlfor="Title">Title: </label>
              <input type="text" id="Title" name="Title"></input>
              <br></br>
              <br></br>
              <h3>Genre</h3>
              <label hmtlfor="Genre1">Genre1: </label>
              <input type="text" id="Genre1" name="Genre1"></input>
              <br></br>
              <br></br>
              <label hmtlfor="Genre2">Genre2: </label>
              <input type="text" id="Genre2" name="Genre2"></input>
              <br></br>
              <br></br>
              <label hmtlfor="Genre3">Genre3: </label>
              <input type="text" id="Genre3" name="Genre3"></input>
              <br></br>
              <br></br>
              <label hmtlfor="Genre4">Genre4: </label>
              <input type="text" id="Genre4" name="Genre4"></input>
              <br></br>
              <br></br>
              <label hmtlfor="Genre5">Genre5: </label>
              <input type="text" id="Genre5" name="Genre5"></input>
              <br></br>
              <br></br>
              <label hmtlfor="Genre6">Genre6: </label>
              <input type="text" id="Genre6" name="Genre6"></input>
              <br></br>
              <br></br>
              <h3>Rating</h3>
              <label hmtlfor="Action">Action: </label>
              <input type="text" id="Action" name="Action"></input>
              <br></br>
              <br></br>
              <label hmtlfor="Adventure">Adventure: </label>
              <input type="text" id="Adventure" name="Adventure"></input>
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
              <label hmtlfor="Fantasy">Fantasy: </label>
              <input type="text" id="Fantasy" name="Fantasy"></input>
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
              <input type="text" id="Sci-Fi & Fantasy" name="Sci-Fi & Fantasy"></input>
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
                <input
                  type="checkbox"
                  onClick={this.openNav}
                  id="hamburg"
                ></input>
                <label hmtlfor="hamburg" id="hamburger" onClick={this.openNav} className="hamburg">
                  <span className="line"></span>
                  <span className="line"></span>
                  <span className="line"></span>
                </label>
              </div>
              <div id="Header">
                <p id="Header1" onClick={this.scrollTop}>
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
                onChange={this.categoryHandler.bind(this)}
              >
                <option value="All">Allgemein</option>
                <option value="Action">Action</option>
                <option value="Adventure">Adventure</option>
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
                <option value="A-Z">A-Z</option>
              </select>
              <TextField
                style={{ width: "80%", marginTop: "20px" }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon style={{ color: "#fff" }} />
                    </InputAdornment>
                  ),
                }}
                InputLabelProps={{
                  shrink: true,

                  style: { color: "#fff" },
                }}
                type="search"
                id="site-search"
                name="q"
                label="Serie suchen"
                onChange={this.filterSerie.bind(this)}
                autoComplete="off"
              ></TextField>
              <input
                onClick={(e) => this.toggleWatching(e)}
                type="checkbox"
                id="switch"
              />

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
                    right: "0px",
                    top: "197px",
                    right: "10%",
                  }}
                  title={
                    <React.Fragment>
                      <Typography style={{ textDecoration: "underline" }}><b>LEGENDE</b></Typography><br></br>
                      <span style={{ color: "#b103fc" }}> <b>beendet:</b> Es kommen keine weiteren Folgen.</span><br></br><br></br>
                      <span style={{ color: "#42d10f" }}> <b>laufend:</b> Es kommen weitere Folgen.</span><br></br><br></br><br></br>
                      <span>Klicke auf ein Poster, um auf die IMDB-Seite zu gelangen.</span><br></br><br></br>
                      <span>Klicke auf den Titel, um zu erfahren, wo du die Serie schauen kannst.</span><br></br><br></br>
                    </React.Fragment>
                  }
                  componentsProps={{
                    tooltip: {
                      sx: {
                        color: "#aaaaaa",
                        backgroundColor: "black",
                        fontSize: "0.9rem",
                      }
                    }
                  }}
                >
                  <InfoOutlinedIcon></InfoOutlinedIcon>
                </Tooltip>
              </div>
            </div>
            <p className="scrollen">
              <i
                title="Scrolle zum Ende"
                onClick={this.scrollDown}
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
                onClick={this.scrollTop}
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
            <h3 className="button" id="login" onClick={(_) => this.login()}>
              Login
            </h3>
            <h3 className="button" onClick={(_) => this.toggleHinzufuegen()}>
              Serie hinzufügen
            </h3>

            <form
              className="hinzufuegen"
              id="hinzufuegen"
              onSubmit={this.hinzufuegen.bind(this)}
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
              <label hmtlfor="Action">Action: </label>
              <input type="text" id="Action" name="Action"></input>
              <br></br>
              <br></br>
              <label hmtlfor="Adventure">Adventure: </label>
              <input type="text" id="Adventure" name="Adventure"></input>
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
              <label hmtlfor="Fantasy">Fantasy: </label>
              <input type="text" id="Fantasy" name="Fantasy"></input>
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
              <input type="text" id="Sci-Fi & Fantasy" name="Sci-Fi & Fantasy"></input>
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
                <input
                  type="checkbox"
                  onClick={this.openNav}
                  id="hamburg"
                ></input>
                <label hmtlfor="hamburg" onClick={this.openNav} id="hamburger" className="hamburg">
                  <span className="line"></span>
                  <span className="line"></span>
                  <span className="line"></span>
                </label>
              </div>
              <div id="Header">
                <p id="Header1" onClick={this.scrollTop}>
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
                onChange={this.categoryHandler.bind(this)}
              >
                <option value="All">Allgemein</option>
                <option value="Action">Action</option>
                <option value="Adventure">Adventure</option>
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
                <option value="A-Z">A-Z</option>
              </select>
              <TextField
                style={{ width: "80%", marginTop: "20px" }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon style={{ color: "#fff" }} />
                    </InputAdornment>
                  ),
                }}
                InputLabelProps={{
                  shrink: true,
                  style: { color: "#fff" },
                }}
                type="search"
                hinttext="gfgfgfgf"
                id="site-search"
                name="q"
                label="Serie suchen"
                onChange={this.filterSerie.bind(this)}
                autoComplete="off"
              ></TextField>
              <input
                onClick={(e) => this.toggleWatching(e)}
                type="checkbox"
                id="switch"
              />

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
                    right: "0px",
                    top: "197px",
                    right: "10%",
                  }}
                  title={
                    <React.Fragment>
                      <Typography style={{ textDecoration: "underline" }}><b>LEGENDE</b></Typography><br></br>
                      <span style={{ color: "#b103fc" }}> <b>beendet:</b> Es kommen keine weiteren Folgen.</span><br></br><br></br>
                      <span style={{ color: "#42d10f" }}> <b>laufend:</b> Es kommen weitere Folgen.</span><br></br><br></br><br></br>
                      <span>Klicke auf ein Poster, um auf die IMDB-Seite zu gelangen.</span><br></br><br></br>
                      <span>Klicke auf den Titel, um zu erfahren, wo du die Serie schauen kannst.</span><br></br><br></br>
                    </React.Fragment>
                  }
                  componentsProps={{
                    tooltip: {
                      sx: {
                        color: "#aaaaaa",
                        backgroundColor: "black",
                        fontSize: "0.9rem",
                      }
                    }
                  }}
                >
                  <InfoOutlinedIcon></InfoOutlinedIcon>
                </Tooltip>
              </div>
            </div>
            <p className="scrollen">
              <i
                title="Scrolle zum Ende"
                onClick={this.scrollDown}
                className="arrow down"
              ></i>
            </p>

            <div className="container">
              <ul className="list" id="serien">
                {this.state.rows}
              </ul>
            </div>
            <p className="scrollen">
              <i
                title="Scrolle zum Anfang"
                onClick={this.scrollTop}
                className="arrow up"
              ></i>
            </p>
          </div>
        </div>
      );
    }
  }
}

export default App;
