import React from "react";

function Header() {
  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const toggleNav = () => {
    document.getElementById("oben").style.transition = "0.5s";
    document.getElementById("legende1").style.transition = "0.5s";
    document.getElementById("legende2").style.transition = "0.5s";

    if (document.getElementById("mySidenav").style.width === "250px") {
      document.getElementById("oben").style.width = "100%";
      document.getElementById("Header1").style.visibility = "visible";
      document.getElementById("mySidenav").style.width = "0";
      document.getElementById("main").style.marginLeft = "0";
      document.getElementById("legende1").style.left = "10% ";
      document.getElementById("legende2").style.left = "calc(10% + 100px)";
    } else {
      if (window.innerWidth <= 860) {
        document.getElementById("Header1").style.visibility = "hidden";
      }
      document.getElementById("mySidenav").style.width = "250px";
      document.getElementById("main").style.marginLeft = "250px";
      document.getElementById("oben").style.width = "calc(100% - 250px)";
      document.getElementById("legende1").style.left = "calc(10% + 225px)";
      document.getElementById("legende2").style.left = "calc(10% + 325px)";
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
