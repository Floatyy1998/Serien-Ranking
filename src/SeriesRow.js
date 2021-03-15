import React from "react";
import Firebase from "firebase";
var pruefen = "";
class SeriesRow extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loading: true };
    //this.inprogress();
  }
  componentDidMount() {
    Firebase.database()
      .ref("key")
      .on("value", (snap) => {
        pruefen = snap.val();
      });
    this.inprogress();
  }
  componentDidUpdate(prevProps) {
    if (this.props !== prevProps) {
      this.inprogress();
    }
  }

  async inprogress() {
    this.setState((prevState) => ({
      loading: true,
      production: prevState.production,
      path: prevState.path,
      imdb: prevState.imdb_id,
    }));
    await fetch(
      "https://api.themoviedb.org/3/search/tv?api_key=d812a3cdd27ca10d95979a2d45d100cd&query=" +
        this.props.serie.title +
        "&page=1"
    )
      .then(function (response) {
        return response.json();
      })
      .then((data) => {
        if (this.props.serie.title === "Fullmetal Alchemist: Brotherhood") {
          return 31911;
         }
        if (this.props.serie.title === "Crashing") {
          return 65251;
        }
        if (this.props.serie.title === "My Hero Academia") {
       return 65930;
        }
        return data["results"][0].id;
      })
      .then((newdata) => {
        fetch(
          "https://api.themoviedb.org/3/tv/" +
            newdata +
            "?api_key=d812a3cdd27ca10d95979a2d45d100cd&language=en-US"
        )
          .then(function (response2) {
            return response2.json();
          })
          .then((data3) => {
            this.setState((prevState) => ({
              loading: prevState.loading,
              production: data3.in_production,
              path: data3.poster_path,
            }));
          })

          .catch(function (error) {
            console.log("Error: " + error);
          });
      })

      .catch(function (error) {
        console.log("Error: " + error);
      });

    await fetch(
      "https://api.themoviedb.org/3/search/tv?api_key=d812a3cdd27ca10d95979a2d45d100cd&query=" +
        this.props.serie.title +
        "&page=1"
    )
      .then(function (response) {
        return response.json();
      })
      .then((da) => {
        if (this.props.serie.title === "Fullmetal Alchemist: Brotherhood") {
         return 31911;
        }
        if (this.props.serie.title === "Crashing") {
          return 65251;
        }
        if (this.props.serie.title === "My Hero Academia") {
          return 65930;
           }
        return da["results"][0].id;
      })
      .then((newdata2) => {
        fetch(
          "https://api.themoviedb.org/3/tv/" +
            newdata2 +
            "/external_ids?api_key=d812a3cdd27ca10d95979a2d45d100cd&language=en-US"
        )
          .then(function (response3) {
            return response3.json();
          })
          .then((data4) => {
            this.setState((prevState) => ({
              loading: false,
              production: prevState.production,
              path: prevState.path,
              imdb: data4.imdb_id,
            }));
          })

          .catch(function (error) {
            console.log("Error: " + error);
          });
      })

      .catch(function (error) {
        console.log("Error: " + error);
      });
  }

  round(value, step) {
    step || (step = 1.0);
    var inv = 1.0 / step;
    return Math.round(value * inv) / inv;
  }

  getRating(a) {
    let punktea = 0;
    if (
      this.props.genre === "A-Z" ||
      this.props.genre === "All" ||
      this.props.genre === "Animation" ||
      this.props.genre === "Documentary" ||
      this.props.genre === "Sport"
    ) {
      Object.entries(a["rating"]).forEach(([key, value]) => {
        if (a["genre"].includes(key)) {
          punktea += value * 3;
        } else {
          punktea += value;
        }
      });
      punktea /= Object.keys(a["genre"]).length;
      punktea /= 6;
      this.round(punktea, 0, 1);

      return this.round(punktea, 0.01);
    } else {
      punktea += a["rating"][this.props.genre];

      punktea /= 2;

      this.round(punktea, 0, 1);

      return this.round(punktea, 0.01);
    }
  }

  redirect = (link) => {
    window.open(link);
  };

  alerte = (e, x) => {
    e.preventDefault();
    console.log(x);
    let test = Firebase.database()
      .ref("/serien/")
      .orderByChild("title")
      .equalTo(x);
    if (!e.target.checked) {
      console.log("if");
      var eingabeKey = prompt("Bitte Key eingeben:");
      if (eingabeKey === pruefen) {
        test
          .once("value")
          .then(function (snapshot) {
            return Object.keys(snapshot.val())[0];
          })
          .then(function (key) {
            let test2 = Firebase.database().ref("/serien/" + key + "/watching");
            test2.set(false);
            alert("Perfekt");
          });
      } else {
        alert("falscher Key");
      }
    }
    else{
      console.log("else");
      eingabeKey = prompt("Bitte Key eingeben:");
      if (eingabeKey === pruefen) {
        test
          .once("value")
          .then(function (snapshot) {
            return Object.keys(snapshot.val())[0];
          })
          .then(function (key) {
            let test2 = Firebase.database().ref("/serien/" + key + "/watching");
            test2.set(true);
            alert("Perfekt");
          });
      } else {
        alert("falscher Key");
      }
    }
  };

  render() {
  
    var x = false;
    var poster = "";
    var imdb = "";
    var wo = "";
    try {
      x = this.state.production;
      poster = "https://image.tmdb.org/t/p/w780/" + this.state.path;
      imdb = "https://www.imdb.com/title/" + this.state.imdb + "/";
      wo =
        "https://www.werstreamt.es/filme-serien/?q=" +
        this.state.imdb +
        "&action_results=suchen";
    } catch (error) {}

    if (!this.state.loading) {
      if (x) {
        return (
          <li>
            <div className="polaroid">
              <p
                className="pposter"
                style={{ backgroundImage: `url(${poster})` }}
                onClick={(_) => this.redirect(imdb)}
              ></p>

              <p
                className="draußen"
                style={{ width: "100%", textAlign: "center" }}
              >
                <p className="padding">
                  <a style={{ width: "98%" }}>
                    {" "}
                    {(() => {
                      if (
                        this.props.filter !== "" ||
                        this.props.genre === "A-Z"
                      ) {
                        return;
                      } else {
                        return this.props.i + ". ";
                      }
                    })()}
                    {this.props.serie.title}
                  </a>{" "}
                  <a
                    style={{ width: "2%" }}
                    className="p"
                    target="_blank"
                    rel="noopener noreferrer"
                    href={wo}
                  >
                    <span style={{ width: "100%" }}>
                      <img
                        style={{ width: "auto" }}
                        className="hover"
                        src="pngegg.png"
                        alt=""
                      />
                    </span>{" "}
                  </a>{" "}
                </p>
                <p
                  className="rating"
                  style={{ width: "100%", textAlign: "center" }}
                >
                  Rating: {this.getRating(this.props.serie)} / 5
                </p>
                <p
                  className="progress"
                  style={{ backgroundColor: "#42d10f" }}
                ></p>
              </p>
            </div>
          </li>
        );
      } else {
        return (
          <li>
            <div className="polaroid">
              <p
                className="pposter"
                style={{ backgroundImage: `url(${poster})` }}
                onClick={(_) => this.redirect(imdb)}
              ></p>

              <p
                className="draußen"
                style={{ width: "100%", textAlign: "center" }}
              >
                <p className="padding">
                  <a style={{ width: "98%" }}>
                    {" "}
                    {(() => {
                      if (
                        this.props.filter !== "" ||
                        this.props.genre === "A-Z"
                      ) {
                        return;
                      } else {
                        return this.props.i + ". ";
                      }
                    })()}
                    {this.props.serie.title}
                  </a>{" "}
                  <a
                    style={{ width: "2%" }}
                    className="p"
                    target="_blank"
                    rel="noopener noreferrer"
                    href={wo}
                  >
                    <span style={{ width: "100%" }}>
                      <img
                        style={{ width: "auto" }}
                        className="hover"
                        src="pngegg.png"
                        alt=""
                      />
                    </span>{" "}
                  </a>{" "}
                  
                </p>
                <p
                  className="rating"
                  style={{ width: "100%", textAlign: "center" }}
                >
                  Rating: {this.getRating(this.props.serie)} / 5
                </p>
                <p
                  className="progress"
                  style={{ backgroundColor: "#b103fc" }}
                ></p>
              </p>
            </div>
          </li>
        );
      }
    } else {
      return (
        <li>
          <div className="polaroid">
            <div class="lds-ellipsis">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
        </li>
      );
    }
  }
}
export default SeriesRow;
