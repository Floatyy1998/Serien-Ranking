import React from "react";

const Select = (props) => {
    const setGenre = (event) => {
       
        
        props.setGenre(event.target.value);
      };
  return (
    <select
      style={{
        display: "block",
        marginTop: "80px",
        border: "1px solid #111",
        marginRight: "auto",
        marginLeft: "auto",
        fontSize: "40%",
      }}
      size="1"
      id="mySelect"
      onChange={setGenre.bind(this)}
    >
      <option value="All">Allgemein</option>
      <option value="Action & Adventure">Action & Adventure</option>
      <option value="Animation">Animation</option>
      <option value="Comedy">Comedy</option>
      <option value="Crime">Crime</option>
      <option value="Drama">Drama</option>
      <option value="Documentary">Documentary</option>
      <option value="Fantasy">Fantasy</option>
      <option value="Horror">Horror</option>
      <option value="Mystery">Mystery</option>
      <option value="Sci-Fi & Fantasy">Sci-Fi & Fantasy</option>
      <option value="Sport">Sport</option>
      <option value="Thriller">Thriller</option>
      <option value="War & Politics">War & Politics</option>
      <option value="Western">Western</option>
      <option value="A-Z">A-Z</option>
      <option value="Zuletzt Hinzugefügt">Zuletzt Hinzugefügt</option>
    </select>
  );
};
export default Select;
