import React from "react";
import Firebase from "firebase";

var pruefen = "";

var key = "test";
class SeriesRow extends React.Component {

  constructor(props) {
    super(props);
    this.state = { loading: true };

    Promise.all([
      Firebase.database().ref("serien").once("value"),
      Firebase.database().ref("key").once("value"),
    ]).then(([serienSnapshot, keySnapshot]) => {
      const ids = {};
      serienSnapshot.forEach((child) => {
        ids[child.val().title] = child.val().id;
      });
      const pruefen = keySnapshot.val();
      const key = this.props.serie.i;
      this.setState({ loading: false, ids, pruefen, key });
    });
  }

  addZeroes(num) {
    const dec = num.toString().split(".")[1];
    const len = dec?.length > 2 ? dec.length : 2;
    return Number(num).toFixed(len);
  }

  round(value, step = 1.0) {
    const inv = 1.0 / step;
    return Math.round(value * inv) / inv;
  }

  getRating(a) {
    let punktea = 0;

    switch (this.props.genre) {
      case "A-Z":
      case "All":
      case "Animation":
      case "Documentary":
      case "Sport":
      case "Zuletzt Hinzugefügt":
        Object.entries(a["rating"]).forEach(([key, value]) => {
          if (a["genre"]["genres"].includes(key)) {
            punktea += value * 3;
          } else {
            punktea += value;
          }
        });
        punktea /= Object.keys(a["genre"]["genres"]).length;
        punktea /= 3;
        break;
      default:
        punktea += a["rating"][this.props.genre];
        break;
    }

    return this.addZeroes(this.round(punktea, 0.01));
  }

  redirect = (link) => {
    window.open(link);
  };

  alerte = async (e, x) => {
    e.preventDefault();
    const test = Firebase.database()
      .ref("/serien/")
      .orderByChild("title")
      .equalTo(x);

    if (!e.target.checked) {
      const eingabeKey = prompt("Bitte Key eingeben:");
      if (eingabeKey === pruefen) {
        try {
          const snapshot = await test.once("value");
          const key = Object.keys(snapshot.val())[0];
          const test2 = Firebase.database().ref(`/serien/${key}/watching`);
          await test2.set(false);
          alert("Perfekt");
        } catch (error) {
          console.error(error);
        }
      } else {
        alert("falscher Key");
      }
    } else {
      const eingabeKey = prompt("Bitte Key eingeben:");
      if (eingabeKey === pruefen) {
        try {
          const snapshot = await test.once("value");
          const key = Object.keys(snapshot.val())[0];
          const test2 = Firebase.database().ref(`/serien/${key}/watching`);
          await test2.set(true);
          alert("Perfekt");
        } catch (error) {
          console.error(error);
        }
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
    var nextEpisode;

    try {
      x = this.props.serie.production["production"];
      nextEpisode = this.props.serie.nextEpisode["nextEpisode"];

      if (beschreibung === undefined || beschreibung === "" || beschreibung === null) {
        beschreibung = "Keine Beschreibung vorhanden";
      }

      poster = `url(${this.props.serie.poster["poster"]})`;
      imdb =
        "https://www.imdb.com/title/" + this.props.serie.imdb["imdb_id"] + "/";
      wo = this.props.serie.wo["wo"];
    } catch (error) { console.log(this.props.serie); }

    const today = new Date(nextEpisode);
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1; // Months start at 0!
    let dd = today.getDate();

    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;

    const formattedToday = dd + '.' + mm + '.' + yyyy;

    if (!this.state.loading) {
      if (x) {
        if (nextEpisode === undefined || nextEpisode === "" || nextEpisode === null) {
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
                  <p className="nextEpisode">Nächste Episode am:<br></br>{formattedToday}</p>
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
        }


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
