import React from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

const Legende = () => {
  return (
    <>
      <div className="legende legende1" id="legende1">
        <div
          style={{
            height: "100%",
            width: "15px",
            background: "rgb(177, 3, 252)",
            float: "left",
          }}
        ></div>
        <div
          style={{
            height: "100%",
            width: "70%",
            float: "left",
            fontSize: "15px",
            textAlign: "left",
            paddingLeft: "2%",
            color: "rgb(170, 170, 170)",
          }}
        >
          beendet
        </div>
      </div>
      <div className="legende legende2" id="legende2">
        <div
          style={{
            height: "100%",
            width: "15px",
            background: "rgb(66, 209, 15)",
            float: "left",
          }}
        ></div>
        <div
          style={{
            height: "100%",
            width: "70%",
            float: "left",
            fontSize: "15px",
            textAlign: "left",
            paddingLeft: "2%",
            color: "rgb(170, 170, 170)",
          }}
        >
          laufend
        </div>
      </div>
      <Tooltip
        style={{
          height: "20px",
          width: "20px",
          position: "absolute",
        }}
        title={
          <React.Fragment>
            <Typography style={{ textDecoration: "underline" }}>
              <b>LEGENDE</b>
            </Typography>
            <br></br>
            <span style={{ color: "#b103fc" }}>
              <b>beendet:</b> Es kommen keine weiteren Folgen.
            </span>
            <br></br>
            <br></br>
            <span style={{ color: "#42d10f" }}>
              <b>laufend:</b> Es kommen weitere Folgen.
            </span>
            <br></br>
            <br></br>
            <br></br>
            <span>
              Klicke auf ein Poster, um auf die IMDB-Seite zu gelangen.
            </span>
            <br></br>
            <br></br>
            <span>
              Hover über ein Rating, um die Begründung zu sehen.
            </span>
            <br></br>
            <br></br>
            <span>
              Klicke auf den Titel, um zu erfahren, wo du die Serie schauen
              kannst.
            </span>
            <br></br>
            <br></br>
            <span style={{ color: "#00fed7" }}>
              Daten bereitgestellt von TMDB und JustWatch
            </span>
            <br></br>
            <br></br>
          </React.Fragment>
        }
        componentsProps={{
          tooltip: {
            sx: {
              color: "#aaaaaa",
              backgroundColor: "black",
              fontSize: "0.9rem",
            },
          },
        }}
      >
        <InfoOutlinedIcon className="tooltip" id="tooltip"></InfoOutlinedIcon>
      </Tooltip>
    </>
  );
};
export default Legende;
