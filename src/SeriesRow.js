import React from "react";
import Firebase from "firebase";

var pruefen = "";
var ids = {};
var key = "test";
class SeriesRow extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loading: false };

    Firebase.database()
      .ref("serien")
      .on("value", (snap) => {
        snap.forEach(function (child) {
          ids[child.val().title] = child.val().id;

        });
      });

    Firebase.database()
      .ref("key")
      .on("value", (snap) => {
        pruefen = snap.val();
      });
    key = this.props.serie.i;
  }

  addZeroes(num) {
    const dec = num.toString().split(".")[1];
    const len = dec && dec.length > 2 ? dec.length : 2;
    return Number(num).toFixed(len);
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
      this.props.genre === "Sport" ||
      this.props.genre === "Zuletzt Hinzugefügt"
    ) {
      Object.entries(a["rating"]).forEach(([key, value]) => {
        if (a["genre"]["genres"].includes(key)) {
          punktea += value * 3;
        } else {
          punktea += value;
        }
      });
      punktea /= Object.keys(a["genre"]["genres"]).length;
      punktea /= 3;
      this.round(punktea, 0, 1);
      return this.addZeroes(this.round(punktea, 0.01));
    } else {
      punktea += a["rating"][this.props.genre];
      this.round(punktea, 0, 1);
      return this.addZeroes(this.round(punktea, 0.01));
    }
  }

  redirect = (link) => {
    window.open(link);
  };

  alerte = (e, x) => {
    e.preventDefault();
    let test = Firebase.database()
      .ref("/serien/")
      .orderByChild("title")
      .equalTo(x);
    if (!e.target.checked) {
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
    } else {
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
    var poster;
    var wo;
    var imdb;
    var beschreibung;

    try {
      x = this.props.serie.production["production"];

      if (beschreibung === undefined || beschreibung === "" || beschreibung === null) {
        beschreibung = "Keine Beschreibung vorhanden";
      }

      poster = `url(${this.props.serie.poster["poster"]})`;
      imdb =
        "https://www.imdb.com/title/" + this.props.serie.imdb["imdb_id"] + "/";
      wo = this.props.serie.wo["wo"];
    } catch (error) { console.log(this.props.serie); }


    if (!this.state.loading) {
      if (x) {
        return (
          <li key={key}>
            <div className="polaroid">
              <div
                className="pposter"
                style={{
                  backgroundImage: poster,
                }}
                onClick={(_) => this.redirect(imdb)}
              >
                <div
                  style={{
                    display: "flex",
                    paddingTop: "5%",
                    justifyContent: "right",
                    background: "none",
                    width: "100%",
                    height: "12%",
                  }}
                >
                  <p
                    className="rating"
                    style={{
                      verticalAlign: "text-bottom",
                      float: "left",
                      paddingRight: "5%",
                      height: "auto",
                    }}
                  >
                    {this.getRating(this.props.serie)} / 10
                  </p>
                </div>
              </div>
              <div className="draußen" style={{ width: "100%" }}>
                <p className="padding">
                  <a
                    href={wo}
                    target="_blank"
                    style={{
                      width: "100%",
                      display: "grid",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
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
                </p>
                <p
                  className="progress"
                  style={{ backgroundColor: "#42d10f" }}
                ></p>
              </div>
            </div>
          </li>
        );
      } else {
        return (
          <li key={key}>
            <div className="polaroid">
              <div
                className="pposter"
                style={{
                  backgroundImage: poster,
                }}
                onClick={(_) => this.redirect(imdb)}
              >
                {" "}
                <div
                  style={{
                    display: "flex",
                    paddingTop: "5%",
                    justifyContent: "right",
                    background: "none",
                    width: "100%",
                    height: "12%",
                  }}
                >
                  <p
                    className="rating"
                    style={{
                      verticalAlign: "text-bottom",
                      float: "left",
                      paddingRight: "5%",
                      height: "auto",
                    }}
                  >
                    {this.getRating(this.props.serie)} / 10
                  </p>
                </div>
              </div>
              <div className="draußen" style={{ width: "100%" }}>
                <p className="padding">
                  <a
                    href={wo}
                    target="_blank"
                    style={{
                      width: "100%",
                      display: "grid",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    {" "}
                    {(() => {
                      if (
                        this.props.filter !== "" ||
                        this.props.genres === "A-Z"
                      ) {
                        return;
                      } else {
                        return this.props.i + ". ";
                      }
                    })()}
                    {this.props.serie.title}
                  </a>{" "}
                </p>
                <p
                  className="progress"
                  style={{ backgroundColor: "#b103fc" }}
                ></p>
              </div>
            </div>
          </li>
        );
      }
    } else {
      return (
        <li key={key}>
          <div className="polaroid">
            <div className="lds-ellipsis">
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
