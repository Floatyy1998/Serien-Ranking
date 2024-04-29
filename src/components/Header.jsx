import React, { useState } from "react";

import SsidChartIcon from "@mui/icons-material/SsidChart";

import StatisticsDialog from "./StatisticsDialog";

const Header = (props) => {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const toggleNav = () => {
    document.getElementById("mySidenav").classList.toggle("sidenav-offen");
    if (
      document.getElementById("mySidenav").classList.contains("sidenav-offen")
    ) {
      document.getElementById("Title").focus();
    }
  };
  return (
    <div
      id="oben"
      style={{
        position: "fixed",
        top: "0",
        height: "60px",
        width: "100%",
        zIndex: "99",
      }}
    >
      {open && <StatisticsDialog open={open}  close={handleClose} />}

      <div className="row">
        <input type="checkbox" onClick={toggleNav} id="hamburg"></input>
        <label
          hmtlfor="hamburg"
          onClick={toggleNav}
          id="hamburger"
          className="hamburg"
        >
          <span className="line"></span>
          <span className="line"></span>
          <span className="line"></span>
        </label>
      </div>
      <div id="Header">
        <p id="Header1" onClick={scrollTop}>
          RANKING
        </p>
      </div>
      <div
        style={{
          background: "#111",
          height: "60px",
          float: "left",
          width: "45px",
        }}
      >
        <SsidChartIcon
        id="statistik"
          style={{
            color: "#00fed7",
            position: "absolute",
            top: "10px",
            cursor: "pointer",
            width: "40px",
            height: "40px",
          }}
          titleAccess="Statistiken"
          onClick={(_) => setOpen(true)}
        />
      </div>
    </div>
  );
};
export default Header;
