import React from "react";
import Firebase from "firebase";

var pruefen = "";
var ids = {};
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
    } else {
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
    var netflix;
    var prime;
    var disneyplus;
    var poster;
    var wo;
    var imdb;

    try {
      x = this.props.serie.production["production"];
      netflix = this.props.serie.netflix["netflix"];
      prime = this.props.serie.prime["prime"];
      disneyplus = this.props.serie.disneyplus["disneyplus"];
      poster = `url(${this.props.serie.poster["poster"]})`;
      imdb =
        "https://www.imdb.com/title/" + this.props.serie.imdb["imdb_id"] + "/";
      wo = this.props.serie.wo["wo"];
    } catch (error) { console.log(this.props.serie); }

    let testprime;
    let testnetflix;
    let testdisneyplus;
    if (netflix && !prime && !disneyplus) {
      testnetflix = (
        <span
          className="netflix iconify"
          style={{
            float: "left",
            width: "57px",
            height: "100%",
            color: "#292929",
            display: "flex",
          }}
        >
          {" "}
          <img
            style={{
              float: "left",
              width: "35.72px",
              height: "100%",
              color: "#00A8E1",
              margin: "auto",
            }}
            className="netflix iconify"
            src="netflix.svg"
          />
        </span>
      );
      testprime = (
        <span
          className="netflix iconify"
          style={{
            float: "left",
            width: "57px",
            height: "100%",
            color: "#E50914",
            visibility: "hidden",
          }}
          data-icon="simple-icons:prime"
          data-inline="false"
        ></span>
      );
      testdisneyplus = (
        <span
          className="netflix iconify"
          style={{
            float: "left",
            width: "0",
            height: "100%",
            color: "#E50914",
            visibility: "hidden",
          }}
          data-icon="mdi-netflix"
          data-inline="false"
        ></span>
      );
    } else if (!netflix && prime && !disneyplus) {
      testnetflix = (
        <span
          className="netflix iconify"
          style={{
            float: "left",
            width: "0",
            height: "100%",
            color: "#E50914",
            visibility: "hidden",
          }}
          data-icon="mdi-netflix"
          data-inline="false"
        ></span>
      );
      testprime = (
        <span
          className="netflix iconify"
          style={{
            float: "left",
            width: "114px",
            height: "100%",
            color: "#292929",
          }}
        >
          {" "}
          <img
            style={{
              float: "left",
              width: "53.72px",
              height: "100%",
              color: "#00A8E1",
              paddingLeft: "18px",
            }}
            className="netflix iconify"
            src="prime-video.svg"
          />
        </span>
      );
      testdisneyplus = (<span
        className="netflix iconify"
        style={{
          float: "left",
          width: "0",
          height: "100%",
          color: "#E50914",
          visibility: "hidden",
        }}
        data-icon="mdi-netflix"
        data-inline="false"
      ></span>);
    } else if (netflix && prime && disneyplus) {
      testnetflix = (
        <span
          className="netflix iconify"
          style={{
            float: "left",
            width: "57px",
            height: "100%",
            color: "#292929",
            display: "flex",
          }}
        >
          {" "}
          <img
            style={{
              float: "left",
              width: "35.72px",
              height: "100%",
              color: "#00A8E1",
              margin: "auto",
            }}
            className="netflix iconify"
            src="netflix.svg"
          />
        </span>
      );

      testprime = (
        <span
          className="netflix iconify"
          style={{
            float: "left",
            width: "57px",
            height: "100%",
            color: "#292929",
          }}
        >
          {" "}
          <img
            style={{
              float: "left",
              width: "35.72px",
              height: "100%",
              color: "#00A8E1",
            }}
            className="netflix iconify"
            src="prime-video.svg"
          />
        </span>
      );
      testdisneyplus = (
        <span
          className="netflix iconify"
          style={{
            float: "left",
            width: "57px",
            height: "100%",
            color: "#292929",
          }}
        >
          {" "}
          <img
            style={{
              float: "left",
              width: "35.72px",
              height: "100%",
              color: "#00A8E1",
            }}
            className="netflix iconify"
            src="disney-plus.svg"
          />
        </span>
      );
    }
    else if (netflix && prime && !disneyplus) {
      testnetflix = (
        <span
          className="netflix iconify"
          style={{
            float: "left",
            width: "57px",
            height: "100%",
            color: "#292929",
            display: "flex",
          }}
        >
          {" "}
          <img
            style={{
              float: "left",
              width: "35.72px",
              height: "100%",
              color: "#00A8E1",
              margin: "auto",
            }}
            className="netflix iconify"
            src="netflix.svg"
          />
        </span>
      );
      testprime = (
        <span
          className="netflix iconify"
          style={{
            float: "left",
            width: "57px",
            height: "100%",
            color: "#292929",
          }}
        >
          {" "}
          <img
            style={{
              float: "left",
              width: "35.72px",
              height: "100%",
              color: "#00A8E1",
            }}
            className="netflix iconify"
            src="prime-video.svg"
          />
        </span>
      );
      testdisneyplus = (<span
        className="netflix iconify"
        style={{
          float: "left",
          width: "0",
          height: "100%",
          color: "#E50914",
          visibility: "hidden",
        }}
        data-icon="mdi-netflix"
        data-inline="false"
      ></span>);
    }
    else if (netflix && !prime && disneyplus) {
      testnetflix = (
        <span
          className="netflix iconify"
          style={{
            float: "left",
            width: "0p",
            height: "100%",
            color: "#292929",
            display: "flex",
          }}
        >
          {" "}
          <img
            style={{
              float: "left",
              width: "35.72px",
              height: "100%",
              color: "#00A8E1",
              margin: "auto",
            }}
            className="netflix iconify"
            src="netflix.svg"
          />
        </span>
      );

      testprime = (
        <span
          className="netflix iconify"
          style={{
            float: "left",
            width: "25px",
            height: "100%",
            color: "#E50914",
            visibility: "hidden",
          }}
          data-icon="simple-icons:prime"
          data-inline="false"
        ></span>
      );
      testdisneyplus = (
        <span
          className="netflix iconify"
          style={{
            float: "left",
            width: "57px",
            height: "100%",
            color: "#292929",
          }}
        >
          {" "}
          <img
            style={{
              float: "left",
              width: "35.72px",
              height: "100%",
              color: "#00A8E1",
            }}
            className="netflix iconify"
            src="disney-plus.svg"
          />
        </span>
      );
    }
    else if (!netflix && prime && disneyplus) {
      testnetflix = (
        <span
          className="netflix iconify"
          style={{
            float: "left",
            width: "0",
            height: "100%",
            color: "#E50914",
            visibility: "hidden",
          }}
          data-icon="mdi-netflix"
          data-inline="false"
        ></span>
      );
      testprime = (
        <span
          className="netflix iconify"
          style={{
            float: "left",
            width: "72px",
            height: "100%",
            color: "#292929",
          }}
        >
          {" "}
          <img
            style={{
              float: "left",
              width: "53.72px",
              height: "100%",
              color: "#00A8E1",
              paddingLeft: "18px",
            }}
            className="netflix iconify"
            src="prime-video.svg"
          />
        </span>
      );
      testdisneyplus = (
        <span
          className="netflix iconify"
          style={{
            float: "left",
            width: "57px",
            height: "100%",
            color: "#292929",
          }}
        >
          {" "}
          <img
            style={{
              float: "left",
              width: "35.72px",
              height: "100%",
              color: "#00A8E1",
            }}
            className="netflix iconify"
            src="disney-plus.svg"
          />
        </span>
      );
    }
    else if (!netflix && !prime && disneyplus) {
      testnetflix = (
        <span
          className="netflix iconify"
          style={{
            float: "left",
            width: "0",
            height: "100%",
            color: "#E50914",
            visibility: "hidden",
          }}
          data-icon="mdi-netflix"
          data-inline="false"
        ></span>
      );
      testprime = (
        <span
          className="netflix iconify"
          style={{
            float: "left",
            width: "0px",
            height: "100%",
            color: "#E50914",
            visibility: "hidden",
          }}
          data-icon="simple-icons:prime"
          data-inline="false"
        ></span>
      );
      testdisneyplus = (
        <span
          className="netflix iconify"
          style={{
            paddingLeft: "20px",
            float: "left",
            width: "114px",
            height: "100%",
            color: "#292929",
          }}
        >
          {" "}
          <img
            style={{
              float: "left",
              width: "35.72px",
              height: "100%",
              color: "#00A8E1",
            }}
            className="netflix iconify"
            src="disney-plus.svg"
          />
        </span>
      );
    }


    else {
      testnetflix = (
        <span
          className="netflix iconify"
          style={{
            float: "left",
            width: "57px",
            height: "100%",
            color: "#E50914",
            visibility: "hidden",
          }}
          data-icon="mdi-netflix"
          data-inline="false"
        ></span>
      );

      testprime = (
        <span
          className="netflix iconify"
          style={{
            float: "left",
            width: "57px",
            height: "100%",
            color: "#E50914",
            visibility: "hidden",
          }}
          data-icon="simple-icons:prime"
          data-inline="false"
        ></span>
      );

      testdisneyplus = (<span
        className="netflix iconify"
        style={{
          float: "left",
          width: "0",
          height: "100%",
          color: "#E50914",
          visibility: "hidden",
        }}
        data-icon="mdi-netflix"
        data-inline="false"
      ></span>);
    }



    if (!this.state.loading) {
      if (x) {
        return (
          <li>
            <div className="polaroid">
              <p
                className="pposter"
                style={{
                  backgroundImage: poster,
                }}
                onClick={(_) => this.redirect(imdb)}
              >
                <p
                  style={{
                    paddingTop: "2%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "none",
                    width: "100%",
                    height: "12%",
                  }}
                >
                  {testnetflix}
                  {testprime}
                  {testdisneyplus}
                  <p
                    className="rating"
                    style={{
                      verticalAlign: "text-bottom",
                      float: "left",
                      width: "115px",
                      height: "auto",
                    }}
                  >
                    {this.getRating(this.props.serie)} / 10
                  </p>
                </p>
              </p>

              <p className="draußen" style={{ width: "100%" }}>
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
                style={{
                  backgroundImage: poster,
                }}
                onClick={(_) => this.redirect(imdb)}
              >
                {" "}
                <p
                  style={{
                    paddingTop: "2%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "none",
                    width: "100%",
                    height: "12%",
                  }}
                >
                  {testnetflix}
                  {testprime}
                  {testdisneyplus}
                  <p
                    className="rating"
                    style={{
                      verticalAlign: "text-bottom",
                      float: "left",
                      width: "115px",
                      height: "auto",
                    }}
                  >
                    {this.getRating(this.props.serie)} / 10
                  </p>
                </p>
              </p>

              <p className="draußen" style={{ width: "100%" }}>
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
