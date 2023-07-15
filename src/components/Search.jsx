import React from "react";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import InputAdornment from "@mui/material/InputAdornment";
import Input from "@mui/material/Input";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";

const Search = (props) => {
  const search = (event) => {
    props.search(event.target.value);
  };
  return (
    <FormControl style={{ width: "80%" }} variant="standard">
      <InputLabel
        style={{ color: "white", backgroundColor: "black" }}
        htmlFor="site-search"
      >
        Serie suchen
      </InputLabel>
      <Input
        type="search"
        id="site-search"
        name="q"
        label="Serie suchen"
        onChange={search.bind(this)}
        autoComplete="off"
        startAdornment={
          <InputAdornment position="start">
            <SearchOutlinedIcon style={{ color: "#fff" }} />
          </InputAdornment>
        }
      />
    </FormControl>
  );
};
export default Search;
