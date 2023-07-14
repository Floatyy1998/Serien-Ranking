import React, { useState } from "react";
import Firebase from 'firebase/compat/app';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Button,
} from "@mui/material";

const CustomDialog = props => {
 

  const handle_change = async (event) => {
    const snapshot = await Firebase.database().ref(`/serien/${props.nmr}`).once("value");
    var serien = snapshot.val();
  
    const ratingInputs = Array.from(event.target.parentElement.parentElement.children[1].children[0]);
  
    const ratings = {};
    ratingInputs.forEach((input) => {
      const value = input.value === "" || input.value === null ? 0 : parseFloat(input.value);
      const key = input.name;
      ratings[key] = value;
    });
    serien.rating = ratings;

    //console.log(serien);
    await Firebase.database().ref(`serien/${props.nmr}/`).update(serien);
    props.close();
  }
  const handleDelete = async () => {
    await Firebase.database().ref(`serien/${props.nmr}/`).remove();
    props.close();
  }


  return (

    <Dialog

      fullWidth={false}
      maxWidth="lg"
      open={props.open}
      onClose={props.close}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle style={{ backgroundColor: "#111", color: "#00fed7" }} id="alert-dialog-title">
        {props.title} bearbeiten/löschen
      </DialogTitle>

      <DialogContent id="alert-dialog-description"
        style={{ backgroundColor: "#111" }}>
        <form

          style={{ display: "flex", flexDirection: "column", color: "#cccccc" }}
          autoComplete="off"
        >

          <h3>Rating</h3>
          <br></br>
          <br></br>
          <label hmtlfor="Action & Adventure">Action & Adventure: </label>
          <input type="text" id="Action & Adventure" defaultValue={props.serie.rating["Action & Adventure"]}  name="Action & Adventure"></input>
          <br></br>
          <br></br>
          <label hmtlfor="All">All: </label>
          <input type="text" id="All" defaultValue={props.serie.rating["All"]} name="All"></input>
          <br></br>
          <br></br>
          <label hmtlfor="Animation">Animation: </label>
          <input type="text" id="Animation" defaultValue={props.serie.rating["Animation"]} name="Animation"></input>
          <br></br>
          <br></br>
          <label hmtlfor="Comedy">Comedy: </label>
          <input type="text" id="Comedy" defaultValue={props.serie.rating["Comedy"]} name="Comedy"></input>
          <br></br>
          <br></br>
          <label hmtlfor="Crime">Crime: </label>
          <input type="text" id="Crime" defaultValue={props.serie.rating["Crime"]} name="Crime"></input>
          <br></br>
          <br></br>
          <label hmtlfor="Documentary">Documentary: </label>
          <input type="text" id="Documentary" defaultValue={props.serie.rating["Documentary"]} name="Documentary"></input>
          <br></br>
          <br></br>
          <label hmtlfor="Drama">Drama: </label>
          <input type="text" id="Drama" defaultValue={props.serie.rating["Drama"]} name="Drama"></input>
          <br></br>
          <br></br>
          <label hmtlfor="Horror">Horror: </label>
          <input type="text" id="Horror" defaultValue={props.serie.rating["Horror"]} name="Horror"></input>
          <br></br>
          <br></br>
          <label hmtlfor="Mystery">Mystery: </label>
          <input type="text" id="Mystery" defaultValue={props.serie.rating["Mystery"]} name="Mystery"></input>
          <br></br>
          <br></br>
          <label hmtlfor="Sci-Fi & Fantasy">Sci-Fi & Fantasy: </label>
          <input type="text" id="Sci-Fi & Fantasy" defaultValue={props.serie.rating["Sci-Fi & Fantasy"]} name="Sci-Fi & Fantasy"></input>
          <br></br>
          <br></br>
          <label hmtlfor="Sport">Sport: </label>
          <input type="text" id="Sport" defaultValue={props.serie.rating["Sport"]} name="Sport"></input>
          <br></br>
          <br></br>
          <label hmtlfor="Thriller">Thriller: </label>
          <input type="text" id="Thriller" defaultValue={props.serie.rating["Thriller"]} name="Thriller"></input>
          <br></br>
          <br></br>
          <label hmtlfor="War & Politics">War & Politics: </label>
          <input type="text" id="War & Politics" defaultValue={props.serie.rating["War & Politics"]} name="War & Politics"></input>
          <br></br>
          <br></br>
          <label hmtlfor="Western">Western: </label>
          <input type="text" id="Western" defaultValue={props.serie.rating["Western"]} name="Western"></input>


        </form>
      </DialogContent>
      <DialogActions style={{color:"#00fed7", backgroundColor: "#111" }} id="dialog-footer">
        <Button
        style={{color:"#00fed7", backgroundColor: "#111" }}
          onClick={

            handleDelete

          }
        >
          Serie löschen
        </Button>
        <Button style={{color:"#00fed7", backgroundColor: "#111" }} onClick={(event) => { handle_change(event) }}>
          Rating ändern
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomDialog;