import React, { Component } from "react";
import "./App.css";
import SeriesRow from "./SeriesRow.js";
import Firebase from "firebase";
import config from "./config.js";
//var parsedJSON = require("./Serien.json");
var genre = "All";
var filter = "";
var pruefen = "";
class App extends Component {
  constructor(props) {
    super(props);
    Firebase.initializeApp(config);
    this.state = { loading: true, watching: false };
  }

  scrollDown() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }
  scrollTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  componentDidMount() {
    Firebase.database()
      .ref("key")
      .on("value", (snap) => {
        pruefen = snap.val();
      });
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
            document.getElementById("login").innerHTML = "Login"
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
    document.getElementById("oben").style.transition = "0.5s";

    if (document.getElementById("mySidenav").style.width === "250px") {
      document.getElementById("oben").style.width = "100%";
      document.getElementById("Header1").style.visibility = "visible";
      document.getElementById("mySidenav").style.width = "0";
      document.getElementById("main").style.marginLeft = "0";
    } else {
      if (window.innerWidth <= 860) {
        document.getElementById("Header1").style.visibility = "hidden";
      }

      document.getElementById("mySidenav").style.width = "250px";
      document.getElementById("main").style.marginLeft = "250px";
      document.getElementById("oben").style.width = "calc(100% - 250px)";
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
        this.checklogin()
       
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

  watchlist(event) {
    event.preventDefault();
    
    if(Firebase.auth().currentUser==null) {
      alert("Bitte Einloggen!");
    }
    else if(Firebase.auth().currentUser.uid!="83fRTz3YqgMkjz646AJ1GO6I8Kg1"){
      alert("Bitte Einloggen!");
    } else {
      let test = Firebase.database()
        .ref("/serien/")
        .orderByChild("title")
        .equalTo(event.target[0].value);

      test
        .once("value")
        .then(function (snapshot) {
          return Object.keys(snapshot.val())[0];
        })
        .then(function (zahl) {
          let test2 = Firebase.database().ref("/serien/" + zahl + "/watching");
          if (event.target[1].value === "true") {
            test2.set(true);
            alert(event.target[0].value + " auf true gesetzt");
            window.location.reload();
          } else {
            test2.set(false);
            alert(event.target[0].value + " auf false gesetzt");
            window.location.reload();
          }
        });
    }
  }

  hinzufuegen(event) {
    event.preventDefault();

    

    var ratings = {
      Action:
        event.target[9].value === "" || event.target[9].value === null
          ? 0
          : parseFloat(event.target[9].value),
      Adventure:
        event.target[10].value === "" || event.target[10].value === null
          ? 0
          : parseFloat(event.target[10].value),
      All:
        event.target[11].value === "" || event.target[11].value === null
          ? 0
          : parseFloat(event.target[11].value),
      Animation:
        event.target[12].value === "" || event.target[12].value === null
          ? 0
          : parseFloat(event.target[12].value),
      Comedy:
        event.target[13].value === "" || event.target[13].value === null
          ? 0
          : parseFloat(event.target[13].value),
      Crime:
        event.target[14].value === "" || event.target[14].value === null
          ? 0
          : parseFloat(event.target[14].value),
      Documentary:
        event.target[15].value === "" || event.target[15].value === null
          ? 0
          : parseFloat(event.target[15].value),
      Drama:
        event.target[16].value === "" || event.target[16].value === null
          ? 0
          : parseFloat(event.target[16].value),
      Fantasy:
        event.target[17].value === "" || event.target[17].value === null
          ? 0
          : parseFloat(event.target[17].value),
      Horror:
        event.target[18].value === "" || event.target[18].value === null
          ? 0
          : parseFloat(event.target[18].value),
      Mystery:
        event.target[19].value === "" || event.target[19].value === null
          ? 0
          : parseFloat(event.target[19].value),
      SciFi:
        event.target[20].value === "" || event.target[20].value === null
          ? 0
          : parseFloat(event.target[20].value),
      Sport:
        event.target[21].value === "" || event.target[21].value === null
          ? 0
          : parseFloat(event.target[21].value),
      Thriller:
        event.target[22].value === "" || event.target[22].value === null
          ? 0
          : parseFloat(event.target[22].value),
    };
    var genres = [];
    for (let index = 3; index < 9; index++) {
      if (event.target[index].value !== "") {
        genres.push(event.target[index].value);
      }

      var nmr = event.target[1].value;
    }
    var postData = {
      title: event.target[2].value,
      genre: genres,
      rating: ratings,
    };
    

    if(Firebase.auth().currentUser==null) {
      alert("Bitte Einloggen!");
    } else if (nmr === "") {
      alert("Nummer eingeben!!!");
    }else if(Firebase.auth().currentUser.uid!="83fRTz3YqgMkjz646AJ1GO6I8Kg1"){
      alert("Bitte Einloggen!");
    }
     else {
      Firebase.database()
        .ref("serien/" + nmr)
        .set(postData)
        .then((_) => {
          for (let j = 0; j < 23; j++) {
            event.target[j].value = "";
          }
          alert("Serie hinzugefügt!");
        });
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
              var errorCode = error.code;
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
  toggleWatchlist = () => {
    document.getElementById("hinzufuegen").style.display = "none";
    document.getElementById("watchlist").style.display = "block";
  };
  toggleHinzufuegen = () => {
    document.getElementById("watchlist").style.display = "none";
    document.getElementById("hinzufuegen").style.display = "block";
  };
  toggleWatching = (e) => {
    if (!e.target.checked) {
      this.setState((prevState) => ({
        loading: prevState.loading,
        watching: false,
      }));
    } else {
      this.setState((prevState) => ({
        loading: prevState.loading,
        watching: true,
      }));
    }
  };

  render() {
    if (this.state.loading) {
      return (
        <div>
          <div id="mySidenav" class="sidenav">
            <h3 className="button">Login</h3>
            <h3 className="button">Serie hinzufügen</h3>
            <h3 className="button">WL hinzufügen/entfrnen</h3>
            <form
              className="hinzufuegen"
              onSubmit={this.hinzufuegen}
              autoComplete="off"
            >
             
              <label for="Nr.">Nummer: </label>
              <input type="text" id="Nr." name="Nr."></input>
              <br></br>
              <br></br>
              <label for="Title">Title: </label>
              <input type="text" id="Title" name="Title"></input>
              <br></br>
              <br></br>
              <h3>Genre</h3>
              <label for="Genre1">Genre1: </label>
              <input type="text" id="Genre1" name="Genre1"></input>
              <br></br>
              <br></br>
              <label for="Genre2">Genre2: </label>
              <input type="text" id="Genre2" name="Genre2"></input>
              <br></br>
              <br></br>
              <label for="Genre3">Genre3: </label>
              <input type="text" id="Genre3" name="Genre3"></input>
              <br></br>
              <br></br>
              <label for="Genre4">Genre4: </label>
              <input type="text" id="Genre4" name="Genre4"></input>
              <br></br>
              <br></br>
              <label for="Genre5">Genre5: </label>
              <input type="text" id="Genre5" name="Genre5"></input>
              <br></br>
              <br></br>
              <label for="Genre6">Genre6: </label>
              <input type="text" id="Genre6" name="Genre6"></input>
              <br></br>
              <br></br>
              <h3>Rating</h3>
              <label for="Action">Action: </label>
              <input type="text" id="Action" name="Action"></input>
              <br></br>
              <br></br>
              <label for="Adventure">Adventure: </label>
              <input type="text" id="Adventure" name="Adventure"></input>
              <br></br>
              <br></br>
              <label for="All">All: </label>
              <input type="text" id="All" name="All"></input>
              <br></br>
              <br></br>
              <label for="Animation">Animation: </label>
              <input type="text" id="Animation" name="Animation"></input>
              <br></br>
              <br></br>
              <label for="Comedy">Comedy: </label>
              <input type="text" id="Comedy" name="Comedy"></input>
              <br></br>
              <br></br>
              <label for="Crime">Crime: </label>
              <input type="text" id="Crime" name="Crime"></input>
              <br></br>
              <br></br>
              <label for="Documentary">Documentary: </label>
              <input type="text" id="Documentary" name="Documentary"></input>
              <br></br>
              <br></br>
              <label for="Drama">Drama: </label>
              <input type="text" id="Drama" name="Drama"></input>
              <br></br>
              <br></br>
              <label for="Fantasy">Fantasy: </label>
              <input type="text" id="Fantasy" name="Fantasy"></input>
              <br></br>
              <br></br>
              <label for="Horror">Horror: </label>
              <input type="text" id="Horror" name="Horror"></input>
              <br></br>
              <br></br>
              <label for="Mystery">Mystery: </label>
              <input type="text" id="Mystery" name="Mystery"></input>
              <br></br>
              <br></br>
              <label for="SciFi">SciFi: </label>
              <input type="text" id="SciFi" name="SciFi"></input>
              <br></br>
              <br></br>
              <label for="Sport">Sport: </label>
              <input type="text" id="Sport" name="Sport"></input>
              <br></br>
              <br></br>
              <label for="Thriller">Thriller: </label>
              <input type="text" id="Thriller" name="Thriller"></input>
              <br></br>
              <br></br>

              <input type="submit" value="Serie hinzufügen"></input>
            </form>
          </div>

          <div id="main" key="0">
            <div id="Ueberschrift">
              {" "}
              <div
                id="oben"
                style={{
                  position: "fixed",
                  top: "0",
                  width: "100%",
                  zIndex: "99",
                }}
              >
                <div class="row">
                  <input
                    type="checkbox"
                    onClick={this.openNav}
                    id="hamburg"
                  ></input>
                  <label for="hamburg" id="hamburger" class="hamburg">
                    <span class="line"></span>
                    <span class="line"></span>
                    <span class="line"></span>
                  </label>
                </div>
                <div id="Header">
                  <p id="Header1" onClick={this.scrollTop}>
                    Ranking
                  </p>
                </div>
                <div
                  style={{
                    background: "#ccaf0e",
                    height: "100px",
                    float: "left",
                    width: "10%",
                  }}
                ></div>
              </div>
              <select
                style={{
                  display: "block",
                  marginTop: "110px",
                  border: "1px solid white",
                  marginRight: "auto",
                  marginLeft: "auto",
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
                <option value="SciFi">SciFi</option>
                <option value="Sport">Sport</option>
                <option value="Thriller">Thriller</option>
                <option value="A-Z">A-Z</option>
              </select>
              <input
                style={{
                  width: "80%",
                  background: "#444",
                  padding: "1%",
                  fontSize: "50%",
                  margin: "2%",
                }}
                type="search"
                id="site-search"
                name="q"
                placeholder="Serie suchen"
                onChange={this.filterSerie.bind(this)}
                autoComplete="off"
              ></input>
              <input
                onClick={(e) => this.toggleWatching(e)}
                type="checkbox"
                id="switch"
              />
              <label className="testen" for="switch">
                Watchlist
              </label>
            </div>
            <p className="scrollen">
              <i
                title="Scrolle zum Ende"
                onClick={this.scrollDown}
                className="arrow down"
              ></i>
            </p>

            <div className="container">
              <div class="loader">Loading...</div>
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
          <div id="mySidenav" class="sidenav">
            <h3 className="button" id="login" onClick={(_) => this.login()}>
              Login
            </h3>
            <h3 className="button" onClick={(_) => this.toggleHinzufuegen()}>
              Serie hinzufügen
            </h3>
            <h3 className="button" onClick={(_) => this.toggleWatchlist()}>
              Watchlist
            </h3>
            <form
              className="watchlist"
              id="watchlist"
              onSubmit={this.watchlist}
              autoComplete="off"
            >
              <h3>Watchlist</h3> 
              <label for="Title">Title: </label>
              <input type="text" id="Title" name="Title"></input>
              <br></br>
              <br></br>
              <label for="hinzufügen?">hinzufügen?: </label>
              <input type="text" id="hinzufügen?" name="hinzufügen?"></input>
              <br></br>
              <br></br>
              <input type="submit" value="hinzufügen/entfernen"></input>
            </form>
            <form
              className="hinzufuegen"
              id="hinzufuegen"
              onSubmit={this.hinzufuegen}
              autoComplete="off"
            >
              <h3>Serie hinzufügen</h3>
              <label style={{display:"none"}} for="Key">Key: </label>
              <input type="text" id="Key." name="Key" style={{display:"none"}}></input>
              <label for="Nr.">Nummer: </label>
              <input type="text" id="Nr." name="Nr."></input>
              <br></br>
              <br></br>
              <label for="Title">Title: </label>
              <input type="text" id="Title" name="Title"></input>
              <br></br>
              <br></br>
              <h3>Genre</h3>
              <label for="Genre1">Genre1: </label>
              <input type="text" id="Genre1" name="Genre1"></input>
              <br></br>
              <br></br>
              <label for="Genre2">Genre2: </label>
              <input type="text" id="Genre2" name="Genre2"></input>
              <br></br>
              <br></br>
              <label for="Genre3">Genre3: </label>
              <input type="text" id="Genre3" name="Genre3"></input>
              <br></br>
              <br></br>
              <label for="Genre4">Genre4: </label>
              <input type="text" id="Genre4" name="Genre4"></input>
              <br></br>
              <br></br>
              <label for="Genre5">Genre5: </label>
              <input type="text" id="Genre5" name="Genre5"></input>
              <br></br>
              <br></br>
              <label for="Genre6">Genre6: </label>
              <input type="text" id="Genre6" name="Genre6"></input>
              <br></br>
              <br></br>
              <h3>Rating</h3>
              <label for="Action">Action: </label>
              <input type="text" id="Action" name="Action"></input>
              <br></br>
              <br></br>
              <label for="Adventure">Adventure: </label>
              <input type="text" id="Adventure" name="Adventure"></input>
              <br></br>
              <br></br>
              <label for="All">All: </label>
              <input type="text" id="All" name="All"></input>
              <br></br>
              <br></br>
              <label for="Animation">Animation: </label>
              <input type="text" id="Animation" name="Animation"></input>
              <br></br>
              <br></br>
              <label for="Comedy">Comedy: </label>
              <input type="text" id="Comedy" name="Comedy"></input>
              <br></br>
              <br></br>
              <label for="Crime">Crime: </label>
              <input type="text" id="Crime" name="Crime"></input>
              <br></br>
              <br></br>
              <label for="Documentary">Documentary: </label>
              <input type="text" id="Documentary" name="Documentary"></input>
              <br></br>
              <br></br>
              <label for="Drama">Drama: </label>
              <input type="text" id="Drama" name="Drama"></input>
              <br></br>
              <br></br>
              <label for="Fantasy">Fantasy: </label>
              <input type="text" id="Fantasy" name="Fantasy"></input>
              <br></br>
              <br></br>
              <label for="Horror">Horror: </label>
              <input type="text" id="Horror" name="Horror"></input>
              <br></br>
              <br></br>
              <label for="Mystery">Mystery: </label>
              <input type="text" id="Mystery" name="Mystery"></input>
              <br></br>
              <br></br>
              <label for="SciFi">SciFi: </label>
              <input type="text" id="SciFi" name="SciFi"></input>
              <br></br>
              <br></br>
              <label for="Sport">Sport: </label>
              <input type="text" id="Sport" name="Sport"></input>
              <br></br>
              <br></br>
              <label for="Thriller">Thriller: </label>
              <input type="text" id="Thriller" name="Thriller"></input>
              <br></br>
              <br></br>

              <input type="submit" value="Serie hinzufügen"></input>
            </form>
          </div>

          <div id="main" key="0">
            <div id="Ueberschrift">
              {" "}
              <div
                id="oben"
                style={{
                  position: "fixed",
                  top: "0",
                  width: "100%",
                  zIndex: "99",
                }}
              >
                <div class="row">
                  <input
                    type="checkbox"
                    onClick={this.openNav}
                    id="hamburg"
                  ></input>
                  <label for="hamburg" id="hamburger" class="hamburg">
                    <span class="line"></span>
                    <span class="line"></span>
                    <span class="line"></span>
                  </label>
                </div>
                <div id="Header">
                  <p id="Header1" onClick={this.scrollTop}>
                    Ranking
                  </p>
                  
                </div>
                <div
                  style={{
                    background: "#ccaf0e",
                    height: "100px",
                    float: "left",
                    width: "10%",
                  }}
                ></div>
              </div>
              <select
                style={{
                  display: "block",
                  marginTop: "110px",
                  border: "1px solid white",
                  marginRight: "auto",
                  marginLeft: "auto",
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
                <option value="SciFi">SciFi</option>
                <option value="Sport">Sport</option>
                <option value="Thriller">Thriller</option>
                <option value="A-Z">A-Z</option>
              </select>
              <input
                style={{
                  width: "80%",
                  background: "#444",
                  padding: "1%",
                  fontSize: "50%",
                  margin: "2%",
                }}
                type="search"
                id="site-search"
                name="q"
                placeholder="Serie suchen"
                onChange={this.filterSerie.bind(this)}
                autoComplete="off"
              ></input>
              <input
                onClick={(e) => this.toggleWatching(e)}
                type="checkbox"
                id="switch"
              />
              <label className="testen" for="switch">
                Watchlist
              </label>
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
