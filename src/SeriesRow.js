import React, { useEffect } from "react";
import Firebase from "firebase";
import { useState } from "react";
import CustomDialog from "./Dialog.js";



var pruefen = "";

var key = "test";
const SeriesRow = (props) => {

  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => { setLoading(false) }, [loading]);



  const handleClose = () => {


    setOpen(false);



  };

  const addZeroes = (num) => {
    const dec = num.toString().split(".")[1];
    const len = dec?.length > 2 ? dec.length : 2;
    return Number(num).toFixed(len);
  }

  const round = (value, step = 1.0) => {
    const inv = 1.0 / step;
    return Math.round(value * inv) / inv;
  }

  const getProvider = (serie) => {
    try {
      const provider = serie["provider"]["provider"];
      const providerList = [];

      Object.entries(provider).forEach(([key, value]) => {
        if (value) {
          providerList.push(value);
        }
      });
      var providerSet = [...new Set(providerList)];
      var providerListShort = providerSet;
      if (providerList.length > 3) {
        providerListShort = providerList.slice(0, 3);
      }




      return providerListShort.map((provider) => (
        <img
          key={provider}
          src={provider}
          alt={provider}
          style={{
            width: "auto",
            height: "100%",
            marginLeft: "3%",
            float: "left",
            boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.5), 0 6px 20px 0 rgba(0, 0, 0, 0.5)",
          }}
        />
      ));
    }
    catch (error) {
      return;
    }
  }

  const getRating = (a) => {
    let punktea = 0;

    switch (props.genre) {
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
        punktea += a["rating"][props.genre];
        break;
    }

    return addZeroes(round(punktea, 0.01));
  }

  const redirect = (link) => {
    window.open(link);
  };

  const alerte = async (e, x) => {
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

  var nextEpisode = "";
  var inProgress = false;
  var poster = "";
  var wo = "";
  var imdb = "";
  try {
    nextEpisode = props.serie.nextEpisode["nextEpisode"];
    inProgress = props.serie.production["production"];
    poster = `url(${props.serie.poster["poster"]})`
    wo = props.serie.wo["wo"];
    imdb = props.serie.imdb.imdb_id



  }
  catch (error) {

  }


  const today = new Date();
  const formattedToday = today.toLocaleDateString(navigator.language, { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = new Date(nextEpisode).toLocaleTimeString(navigator.language, { hour: '2-digit', minute: '2-digit' });

  const nextEp = new Date(nextEpisode);
  var formattedNextEp = nextEp.toLocaleDateString(navigator.language, { day: '2-digit', month: '2-digit', year: 'numeric' });
  if (formattedNextEp === formattedToday) {
    formattedNextEp = "Heute";
  }


  if (loading) {
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

  const hasNextEpisode = nextEpisode !== undefined && nextEpisode !== "" && nextEpisode !== null;


  return (
    <>
      <CustomDialog open={open} close={handleClose} serie={props.serie} nmr={props.serie.nmr} title={props.serie.title} />
      <li key={key}>
        <div className="polaroid">
          <div
            className="pposter"
            style={{
              backgroundImage: poster,
            }}
            onClick={(_) => redirect(`https://www.imdb.com/title/${imdb}/`)}
          >
            <div
              style={{
                paddingTop: "5%",
                background: "none",
                width: "100%",
                height: "14%",
              }}
            >
              {getProvider(props.serie)}
              <p
                className="rating"
                style={{
                  verticalAlign: "text-bottom",
                  float: "right",
                  paddingRight: "5%",
                  height: "auto",
                }}
              >
                {getRating(props.serie)} / 10
              </p>
            </div>
            {hasNextEpisode && (
              <p className="nextEpisode">
                Nächste Episode:
                <br></br>
                {formattedNextEp}
                <br></br>
                {time}
              </p>
            )}
          </div>
          <div className="draußen" style={{ width: "100%" }}>
            <p className="padding">
              <p
                style={{
                  width: "100%",
                  height: "40%",
                  display: "grid",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              ></p>
              <a
                onClick={(_) => {
                  console.log(localStorage.getItem("konrad.dinges@googlemail.com"));
                  if (localStorage.getItem("konrad.dinges@googlemail.com")) {
                    setOpen(true)
                  }
                  else{
                    redirect(wo)
                  }
                }
                }
                target="_blank"
                style={{
                  width: "100%",
                  height: "60%",
                  display: "grid",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                {(() => {
                  if (props.filter !== "" || props.genre === "A-Z") {
                    return;
                  } else {
                    return props.i + ". ";
                  }
                })()}
                {props.serie.title}
              </a>{" "}
            </p>
            <p
              className="progress"
              style={{
                backgroundColor: inProgress ? "#42d10f" : "#b103fc",
              }}
            ></p>
          </div>
        </div>
      </li>
    </>
  );
};

export default SeriesRow;
