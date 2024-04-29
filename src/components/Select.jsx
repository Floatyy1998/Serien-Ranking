import React from "react";

const Select = (props) => {
  const setGenre = (event) => {
    props.setGenre(event.target.value);
  };
  const setProvider = (event) => {
  
    props.setProvider(event.target.value);
  };
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginTop: "10px",
      }}
      id="selectDiv"
    >
      <div style={{ display: "flex", flexDirection: "column", margin: "10px" }}>
        <div style={{ fontSize: "1.5rem" }}>GENRE:</div>
        <select
          style={{
            border: "1px solid #ccc",

            borderRadius: "10px",
            fontSize: "1.5rem",
            width: "250px",
            height: "41px",
            padding: "5px",
            appearance: "none",
          }}
          size="1"
          id="mySelect"
          onChange={setGenre.bind(this)}
        >
          <option value="All">Allgemein</option>
          <option value="A-Z">A-Z</option>
          <option value="Action & Adventure">Action & Adventure</option>
          <option value="Animation">Animation</option>
          <option value="Comedy">Comedy</option>
          <option value="Crime">Crime</option>
          <option value="Drama">Drama</option>
          <option value="Documentary">Documentary</option>
          <option value="Family">Family</option>
          <option value="Kids">Kids</option>
          <option value="Mystery">Mystery</option>
          <option value="Reality">Reality</option>
          <option value="Sci-Fi & Fantasy">Sci-Fi & Fantasy</option>
          <option value="War & Politics">War & Politics</option>
          <option value="Western">Western</option>
          <option value="Neue Episoden">Neue Episoden</option>
          <option value="Zuletzt Hinzugefügt">Zuletzt Hinzugefügt</option>
        </select>
      </div>
      <div style={{ display: "flex", flexDirection: "column", margin: "10px" }}>
        <div style={{ fontSize: "1.5rem" }}>ANBIETER:</div>
        <select
          style={{
            border: "1px solid #ccc",
            borderRadius: "10px",
            fontSize: "1.5rem",
            width: "250px",
            height: "41px",
            padding: "5px",
            appearance: "none",
          }}
          size="1"
          id="mySelect2"
          onChange={setProvider.bind(this)}
        >
          <option value="All">Alle</option>
          <option value="Amazon Prime Video">Prime Video</option>
          <option value="Apple TV Plus">AppleTV+</option>
          <option value="Crunchyroll">Crunchyroll</option>
          <option value="Disney Plus">Disney+</option>
          <option value="Freevee">Freevee</option>
          <option value="Joyn Plus">Joyn+</option>
          <option value="MagentaTV">MagentaTV</option>
          <option value="Netflix">Netflix</option>
          <option value="Paramount Plus">Paramount+</option>
          <option value="RTL+">RTL+</option>
          <option value="WOW">WOW</option>
        </select>
      </div>
    </div>
  );
};
export default Select;
