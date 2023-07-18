import React from "react";
import Firebase from "firebase/compat/app";
import API from "../configs/API";
import Button from "@mui/material/Button";

function SideNav(props) {
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
    const title = event.target[0].value;
    const ratings = {
      "Action & Adventure": 0,
      All: 0,
      Animation: 0,
      Comedy: 0,
      Crime: 0,
      Documentary: 0,
      Drama: 0,
      Horror: 0,
      Mystery: 0,
      "Sci-Fi & Fantasy": 0,
      Sport: 0,
      Thriller: 0,
      "War & Politics": 0,
      Western: 0,
    }; // getRatings(event);
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

    /* for (let j = 0; j < 16; j++) {
      event.target[j].value = "";
    } */
    event.target[0].value = "";
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
            document.getElementById("login").innerHTML = "LOGIN";
          },
          function (error) {
            console.error("Sign Out Error", error);
          }
        );
    }
  };
  const login = () => {
    if (document.getElementById("login").innerHTML === "LOGIN") {
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
              document.getElementById("login").innerHTML = "LOGOUT";
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
      document.getElementById("login").innerHTML = "LOGIN";
    }
  };
  return (
    <div
      style={{ zIndex: "99", paddingLeft: "10%", paddingRight: "10%" }}
      id="mySidenav"
      className="sidenav"
    >
      <h3
        style={{ marginTop: "80px", height: "41px" }}
        className="button"
        id="login"
        onClick={(_) => login()}
      >
        LOGIN
      </h3>

      <form
        className="hinzufuegen"
        id="hinzufuegen"
        onSubmit={hinzufuegen.bind(this)}
        autoComplete="off"
        style={{ padding: "0", marginTop: "3%", textAlign: "center" }}
      >
        <h3 style={{ margin: "0", marginBottom: "1%", fontSize: "1.5rem" }}>
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
            marginBottom:"60px"
          }}
          type="submit"
          value="SERIE HINZUFÜGEN"
        >
          SERIE HINZUFÜGEN
        </Button>
      </form>
    </div>
  );
}

export default SideNav;
