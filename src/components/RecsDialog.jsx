import React, { useEffect } from "react";
import { Dialog } from "@mui/material";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Zoom } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import "../Styles/App.css";

const RecsDialog = (props) => {
  const getProvider = (providers) => {
   
    try {
      const provider = providers;
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

  const redirect = (link) => {
    window.open(link);
  };

  const getRecs = () => {
    
    try {
       
      const recs = props.serie.recommendation.recommendations;

      if (recs !== "" && recs !== undefined && recs !== null) {
        return recs.map((rec, index) => (
          <li key={Date.now() * Math.random() * 9999 * Math.random() * 99999}>
            <div
              className="polaroid"
              style={{
                boxShadow: rec.production
                ? "rgba(66, 210, 15, 0.5) 12px 11px 20px 0px, -5px -5px 20px 0px rgba(255, 255, 255, 0.2)"
                : "rgba(177, 3, 255, 0.5) 12px 11px 20px 0px, -5px -5px 20px 0px rgba(255, 255, 255, 0.2)",
              }}
            >
              <div
                className="pposter"
                style={{
                  backgroundImage: `url(https://image.tmdb.org/t/p/original${rec.poster_path})`,
                  borderTopLeftRadius: "30px",
                  borderTopRightRadius: "30px",
                }}
                onClick={(event) => {
                    if (event.target === event.currentTarget) {
                      redirect(`https://www.imdb.com/title/${rec.imdb_id}/`);
                    }
                  }}
              >
                <div
                  style={{
                    paddingTop: "5%",
                    background: "none",
                    width: "95%",
                    textAlign: "right",
                    height: "14%",
                  }}
                >
                    {getProvider(rec.provider)}
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
                          {rec.overview}
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
                    <InfoOutlinedIcon
                      style={{
                        color: "rgb(0, 254, 215)",
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        borderRadius: "50%",
                      }}
                      className="tooltip"
                      id="tooltipRecs"
                    ></InfoOutlinedIcon>
                  </Tooltip>
                </div>
              </div>

              <div
                className="draußen"
                style={{ borderRadius: "30px", width: "100%" }}
              >
                <p className="padding"
                 onClick={(_) => {
                   
                      redirect(rec.wo);
                    
                  }}>
                  <span
                    style={{
                      width: "100%",
                      height: "40%",
                      display: "grid",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  ></span>
                  <a
                    target="_blank"
                    style={{
                      width: "100%",
                      height: "60%",
                      display: "grid",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    {rec.name}
                  </a>
                </p>
              </div>
            </div>
          </li>
        ));
      } else {
        return (
          <p style={{ fontSize: "1.5rem", color: "#ccc" }}>
            Keine Empfehlungen vorhanden.
          </p>
        );
      }
    } catch (error) {
      return <p style={{ color: "#ccc" }}>Keine Empfehlungen vorhanden.</p>;
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
          Ähnliche Serien wie {props.serie.title}
        </p>
      </DialogTitle>
      <DialogContent>
        <ul className="list" id="serienRecs">
          {getRecs()}
        </ul>
      </DialogContent>
    </Dialog>
  );
};
export default RecsDialog;
