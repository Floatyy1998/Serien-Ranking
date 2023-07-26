import React from "react";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import InputAdornment from "@mui/material/InputAdornment";
import OutlinedInput from "@mui/material/Input";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";

const Search = (props) => {
  const handleFocus = (event) => {
    event.target.parentElement.parentElement.style.border = "1px solid #00fed7";
    document.getElementById("searchIcon").style.color = "#00fed7";
  };

  const handleBlur = (event) => {
    event.target.parentElement.parentElement.style.border =
      "1px solid rgb(204, 204, 204)";
    document.getElementById("searchIcon").style.color = "#fff";
  };

  const search = (event) => {
    props.search(event.target.value);
  };

  return (
    <FormControl
      style={{
        width: "80%",
        border: "1px solid #ccc",
        borderRadius: "10px",
        backgroundColor: "#111",
        margin: "80px auto 20px",
      }}
    >
      <InputLabel style={{ color: "#ccc", top: "-7px" }} htmlFor="site-search">
        Serie suchen
      </InputLabel>
      <OutlinedInput
        type="search"
        id="site-search"
        name="q"
        label="Serie suchen"
        onChange={search.bind(this)}
        onFocus={handleFocus.bind(this)}
        onBlur={handleBlur.bind(this)}
        autoComplete="off"
        endAdornment={
          <InputAdornment position="start">
            <SearchOutlinedIcon id="searchIcon" style={{ color: "#fff" }} />
          </InputAdornment>
        }
      />
    </FormControl>
  );
};
export default Search;
