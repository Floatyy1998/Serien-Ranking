import React from "react";
import { Dialog } from "@mui/material";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import "../Styles/Episodes.css";

const EpisodeDialog = (props) => {
  function pad(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
  }
  const getDateString = (date) => {
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
    const time = new Date(date).toLocaleTimeString(navigator.language, {
      hour: "2-digit",
      minute: "2-digit",
    });

    const nextEp = new Date(date);
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
    formattedNextEp = `${formattedNextEp} | ${time} Uhr`;
    return formattedNextEp;
  };

  const getEpisodes = () => {
    if (props.serie.nextEpisode.nextEpisodes !== "" && props.open) {
      return props.serie.nextEpisode.nextEpisodes.map((episode, index) => (
        <li
          key={Date.now() * Math.random() * 9999 * Math.random() * 99999}
          className="episodes"
        >
          <img
            className="episodeBild"
            src={`${props.serie.poster["poster"]}`}
            alt="Nix da"
          ></img>
          <div className="episodeBox">
            <div className="chip">
          
                <Chip
                size="small"
                title={props.serie.title}
                  label={props.serie.title}
                  variant="outlined"
                  style={{
                    color: "white",
                    marginRight: "10px",
                    maxWidth: "50%",
                  }}
                />
            
              <div style={{ textAlign: "left" }}>
                {getDateString(episode.airstamp)}
              </div>
            </div>
            <div>{`S${pad(episode.season, 2)} | E${pad(
              episode.number,
              2
            )}`}</div>
            <div>{episode.name}</div>
          </div>
        </li>
      ));
    }
  };

  return (
    <Dialog
      fullWidth={true}
      maxWidth="xl"
      open={props.open}
      onClose={props.close}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle
        style={{
          textAlign: "center",
          backgroundColor: "#111",
          color: "#00fed7",
          paddingBottom: "0",
        }}
        id="alert-dialog-title"
      >
        <CloseRoundedIcon
          onClick={(_) => props.close()}
          className="closeDialog"
          style={{
            position: "absolute",
            top: "1vh",
            right: "1vh",
            borderRadius: "10px",
            width: "2rem",
            height: "auto",
            backgroundColor: "#333",
          }}
        />
        <p
          id="dialog-title"
          style={{
            margin: "auto",
            textAlign: "center",
            color: "rgb(0, 254, 215)",
            width: "90%",
          }}
        >
          {" "}
          Die nächsten Episoden von {props.serie.title}
        </p>
      </DialogTitle>
      <DialogContent style={{ padding: 0 }}>
        <ul id="serienRecs">{getEpisodes()}</ul>
      </DialogContent>
    </Dialog>
  );
};
export default EpisodeDialog;
