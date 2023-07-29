import React from "react";

function Header() {
  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const toggleNav = () => {
    
    document.getElementById("mySidenav").classList.toggle("sidenav-offen");
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
          width: "10%",
        }}
      ></div>
    </div>
  );
}
export default Header;
