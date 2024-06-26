import React from "react";
import { useState } from "react";
import CustomDialog from "./Dialog";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import MuiAlert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

import { Zoom } from "@mui/material";
import RecsDialog from "./RecsDialog";
import EpisodeDialog from "./EpisodeDialog";

const mail = process.env.REACT_APP_MAIL;
const SeriesRow = (props) => {
  const [open, setOpen] = useState(false);
  const [openRecs, setOpenRecs] = useState(false);
  const [openEpisodes, setOpenEpisodes] = useState(false);
  const [, setOpenSerienSnack] = React.useState(false);
  const [openSerienEndSnack, setOpenSerienEndSnack] = React.useState(false);
  const [openErrorSnack, setOpenErrorSnack] = React.useState(false);
  const [, setProgress] = React.useState(0);

  const handleCloseSerienSnack = (event, reason) => {
    setOpenSerienEndSnack(false);
    if (reason === "clickaway") {
      return;
    }
  };

  const Alert = React.forwardRef(function Alert(props, ref) {
    return (
      <MuiAlert
        style={{ borderRadius: "30px" }}
        elevation={6}
        ref={ref}
        variant="filled"
        {...props}
      />
    );
  });

  const handleCloseRecs = () => {
    setOpenRecs(false);
  };
  const handleCloseEpisodes = () => {
    setOpenEpisodes(false);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const addZeroes = (num) => {
    const dec = num.toString().split(".")[1];
    const len = dec?.length > 2 ? dec.length : 2;
    return Number(num).toFixed(len);
  };

  const round = (value, step = 1.0) => {
    const inv = 1.0 / step;
    return Math.round(value * inv) / inv;
  };

  const getProvider = (serie) => {
    try {
      const provider = serie["provider"]["provider"];
      const providerList = [];
      Object.entries(provider).forEach(([key, value]) => {
        if (value) {
          providerList.push(value);
        }
      });

      var providerListShort = providerList.filter(
        (value, index, self) =>
          index ===
          self.findIndex((t) => t.logo === value.logo && t.name === value.name)
      );
      if (providerList.length > 3) {
        providerListShort = providerList.slice(0, 3);
      }

      return providerListShort.map((provider, index) => (
        <img
          title={provider.name + " (Provided by JustWatch)"}
          key={Date.now() + index}
          src={provider.logo}
          alt={"Bild nicht verfügbar"}
          style={{
            width: "auto",
            height: "100%",
            marginLeft: "5%",
            float: "left",
            borderRadius: "10px",
            boxShadow:
              "0 4px 8px 0 rgba(0, 0, 0, 0.5), 0 6px 20px 0 rgba(0, 0, 0, 0.5)",
          }}
        />
      ));
    } catch (error) {
      return;
    }
  };

  const getRating = (a) => {
    let punktea = 0;

    try {
      switch (props.genre) {
        case "A-Z":
        case "All":
        case "Animation":
        case "Family":
        case "Documentary":
        case "Neue Episoden":
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
    } catch (error) {
      return addZeroes(round(punktea, 0.01));
    }
  };

  const redirect = (link) => {
    window.open(link);
  };

  var nextEpisode = "";
  var nextEpisodeCount = "";
  var nextEpisodeTitle = "";
  var inProgress = false;
  var poster = "";
  var wo = "";
  var imdb = "";
  try {
    nextEpisode = props.serie.nextEpisode["nextEpisode"];
    nextEpisodeCount = `Staffel ${props.serie.nextEpisode["season"]} Ep. ${props.serie.nextEpisode["episode"]}`;
    nextEpisodeTitle = props.serie.nextEpisode["title"];
    inProgress = props.serie.production["production"];
    poster = `url(${props.serie.poster["poster"]})`;
    wo = props.serie.wo["wo"];
    imdb = props.serie.imdb.imdb_id;
  } catch (error) {}

  const today = new Date();
  const formattedToday = today.toLocaleDateString(navigator.language, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const formattedTomorrow = tomorrow.toLocaleDateString(navigator.language, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = new Date(nextEpisode).toLocaleTimeString(navigator.language, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const nextEp = new Date(nextEpisode);
  var formattedNextEp = nextEp.toLocaleDateString(navigator.language, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  if (formattedNextEp === formattedToday) {
    formattedNextEp = "Heute";
  }
  if (formattedNextEp === formattedTomorrow) {
    formattedNextEp = "Morgen";
  }
  formattedNextEp = `${formattedNextEp} um ${time} Uhr`;

  const hasNextEpisode =
    nextEpisode !== undefined && nextEpisode !== "" && nextEpisode !== null;
  return (
    <>
      <Snackbar
        open={openErrorSnack}
        autoHideDuration={3000}
        onClose={(_) => setOpenErrorSnack(false)}
      >
        <Alert severity="error" sx={{ width: "100%" }}>
          Serie nicht gefunden!\nBitte überprüfe die Eingabe!
        </Alert>
      </Snackbar>
      <Snackbar
        open={openSerienEndSnack}
        autoHideDuration={3000}
        onClose={handleCloseSerienSnack}
      >
        <Alert
          onClose={handleCloseSerienSnack}
          severity="success"
          sx={{ width: "100%" }}
        >
          Serie erfolgreich hinzugefügt!
        </Alert>
      </Snackbar>
      <RecsDialog
        open={openRecs}
        close={handleCloseRecs}
        serie={props.serie}
        toggleSerienStartSnack={(wert) => setOpenSerienSnack(wert)}
        toggleSerienEndSnack={(wert) => setOpenSerienEndSnack(wert)}
        toggleErrorSnack={(wert) => setOpenErrorSnack(wert)}
        setProgress={(wert) => setProgress(wert)}
      />
      <EpisodeDialog
        open={openEpisodes}
        close={handleCloseEpisodes}
        serie={props.serie}
      />

      <CustomDialog
        open={open}
        close={handleClose}
        serie={props.serie}
        nmr={props.serie.nmr}
        title={props.serie.title}
      />
      <li key={Date.now()}>
        <div
          className="polaroid"
          style={{
            boxShadow: inProgress
              ? "rgba(66, 210, 15, 0.5) 12px 11px 20px 0px, -5px -5px 20px 0px rgba(255, 255, 255, 0.2)"
              : "rgba(177, 3, 255, 0.5) 12px 11px 20px 0px, -5px -5px 20px 0px rgba(255, 255, 255, 0.2)",
          }}
        >
          <div
            className="pposter"
            style={{
              backgroundImage: poster,
              borderTopLeftRadius: "30px",
              borderTopRightRadius: "30px",
            }}
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                redirect(`https://www.imdb.com/title/${imdb}/`);
              }
            }}
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
              <Tooltip
                TransitionComponent={Zoom}
                title={
                  <React.Fragment>
                    <Typography
                      style={{
                        textDecoration: "underline",
                        textAlign: "center",
                      }}
                    >
                      <b>Beschreibung</b>
                    </Typography>

                    <Typography
                      style={{
                        textAlign: "center",
                        whiteSpace: "pre-line",
                      }}
                    >
                      {props.serie.beschreibung === ""
                        ? "Keine Beschreibung verfügbar"
                        : props.serie.beschreibung}
                    </Typography>
                  </React.Fragment>
                }
                arrow
                placement="bottom-end"
                componentsProps={{
                  tooltip: {
                    sx: {
                      borderRadius: "20px",

                      color: "#ccc",
                      backgroundColor: "#111",
                      fontSize: "0.9rem",
                    },
                  },
                }}
              >
                <p
                  id="rating"
                  className="rating"
                  style={{
                    verticalAlign: "text-bottom",
                    float: "right",
                    paddingRight: "5%",
                    height: "auto",
                  }}
                  onClick={() => {
                    setOpenRecs(true);
                  }}
                >
                  {getRating(props.serie)} / 10
                </p>
              </Tooltip>
            </div>
            {hasNextEpisode && (
              <div
                className="nextEpisode"
                onClick={async (event) => {
                  setOpenEpisodes(true);
                }}
              >
                <div className="top">
                  <p className="title">{nextEpisodeCount}</p>
                  <p className="title">{formattedNextEp}</p>
                </div>

                <div className="marginTop">
                  <div className="bottom">
                    <p className="title">Titel:</p>
                    <span className="info" title={nextEpisodeTitle}>
                      {" "}
                      {nextEpisodeTitle}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div
            className="draußen"
            style={{ borderRadius: "30px", width: "100%" }}
          >
            <p className="padding">
              <span
                target="_blank"
                onClick={(_) => {
                  if (localStorage.getItem(mail)) {
                    setOpen(true);
                  } else {
                    redirect(wo);
                  }
                }}
                title={props.serie.title}
                style={{
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
              </span>
            </p>
          </div>
        </div>
      </li>
    </>
  );
};

export default SeriesRow;
