import React from "react";
import Firebase from "firebase/compat/app";
import API from "../configs/API";

function SideNav(props) {
  const toggleHinzufuegen = () => {
    document.getElementById("hinzufuegen").style.display = "block";
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
    props.get_serien();
  };

  const hinzufuegen = async (event) => {
    try {
      await addNewSeries(event);
    } catch (error) {
      console.error(error);
      alert("Fehler beim Hinzufügen der Serie!");
    }
  };
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
  return (
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
        <input type="text" id="War & Politics" name="War & Politics"></input>
        <br></br>
        <br></br>
        <label hmtlfor="Western">Western: </label>
        <input type="text" id="Western" name="Western"></input>
        <br></br>
        <br></br>
        <input type="submit" value="Serie hinzufügen"></input>
      </form>
    </div>
  );
}

export default SideNav;
