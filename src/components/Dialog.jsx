import React, { useState } from "react";
import Firebase from "firebase/compat/app";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Stack,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

const CustomDialog = (props) => {
  const handle_change = async (event) => {
    const snapshot = await Firebase.database()
      .ref(`/serien/${props.nmr}`)
      .once("value");
    var serien = snapshot.val();

    const ratingInputs = Array.from(
      event.target.parentElement.parentElement.children[1].children[0]
    );

    const ratings = {};
    ratingInputs.forEach((input) => {
      const value =
        input.value === "" || input.value === null
          ? 0
          : parseFloat(input.value);
      const key = input.name;
      ratings[key] = value;
    });
    serien.rating = ratings;

    //console.log(serien);
    await Firebase.database().ref(`serien/${props.nmr}/`).update(serien);
    props.close();
  };
  const handleDelete = async () => {
    await Firebase.database().ref(`serien/${props.nmr}/`).remove();
    props.close();
  };

  const getGenres = () => {
    /* <Grid key={index} style={{ margin: "auto" }} item xs={6}>
        <Card style={{ backgroundColor: "black" }}>
          <CardContent
            sx={{ height: 60 }}
            style={{ display: "flex", justifyContent: "center" }}
          >
            <Typography
              style={{ fontFamily: '"Belanosima", sans-serif' }}
              color={"rgb(0, 254, 215)"}
              align="center"
            >
              {genre}
            </Typography>
          </CardContent>
        </Card>
      </Grid> */
    return props.serie.genre.genres.map((genre, index) => (
      <Chip
      key={index}
        label={genre}
        color="primary"
        className="genreChip"
        
      />
    ));
  };

  return (
    <Dialog
      fullWidth={true}
      maxWidth="md"
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
          width:"90%"
            
          }}
        >
          {" "}
          {props.title} bearbeiten/löschen
        </p>
        <p
        className="dialogTitle"
          style={{
            textAlign: "center",
            paddingTop: "2%",
            paddingBottom: "1%",
          
            color: "#cccccc",
          }}
        >
          Genres
        </p>
        <Stack
          direction="row"
          useFlexGap
          flexWrap="wrap"
          spacing={3}
          style={{ width: "fit-content", margin: "auto" }}
        >
          {getGenres()}
        </Stack>

        {/* <Grid
          container
          spacing={1}
          direction="row"
          alignItems="center"
          justify="center"
        >
          {getGenres()}
        </Grid> */}
        <p className="dialogTitle"
          style={{
             
            textAlign: "center",
            marginTop: "3%",
            
            color: "#cccccc",
          }}
        >
          Rating
        </p>
      </DialogTitle>

      <DialogContent
        id="alert-dialog-description"
        style={{ backgroundColor: "#111" }}
      >
        <form
          style={{
            paddingTop: "0",
            paddingBottom: "0",
            display: "flex",
            flexDirection: "column",
            color: "#cccccc",
          }}
          autoComplete="off"
          className="dialogForm"
        >
          <label hmtlfor="Action & Adventure">Action & Adventure: </label>
          <input
            className="dialoRating"
            type="text"
            id="Action & Adventure"
            defaultValue={props.serie.rating["Action & Adventure"]}
            name="Action & Adventure"
          ></input>
          <br></br>
          <br></br>
          <label hmtlfor="All">All: </label>
          <input
            type="text"
            id="All"
            defaultValue={props.serie.rating["All"]}
            name="All"
          ></input>
          <br></br>
          <br></br>
          <label hmtlfor="Animation">Animation: </label>
          <input
            type="text"
            id="Animation"
            defaultValue={props.serie.rating["Animation"]}
            name="Animation"
          ></input>
          <br></br>
          <br></br>
          <label hmtlfor="Comedy">Comedy: </label>
          <input
            type="text"
            id="Comedy"
            defaultValue={props.serie.rating["Comedy"]}
            name="Comedy"
          ></input>
          <br></br>
          <br></br>
          <label hmtlfor="Crime">Crime: </label>
          <input
            type="text"
            id="Crime"
            defaultValue={props.serie.rating["Crime"]}
            name="Crime"
          ></input>
          <br></br>
          <br></br>
          <label hmtlfor="Documentary">Documentary: </label>
          <input
            type="text"
            id="Documentary"
            defaultValue={props.serie.rating["Documentary"]}
            name="Documentary"
          ></input>
          <br></br>
          <br></br>
          <label hmtlfor="Drama">Drama: </label>
          <input
            type="text"
            id="Drama"
            defaultValue={props.serie.rating["Drama"]}
            name="Drama"
          ></input>
          <br></br>
          <br></br>
          <label hmtlfor="Horror">Horror: </label>
          <input
            type="text"
            id="Horror"
            defaultValue={props.serie.rating["Horror"]}
            name="Horror"
          ></input>
          <br></br>
          <br></br>
          <label hmtlfor="Mystery">Mystery: </label>
          <input
            type="text"
            id="Mystery"
            defaultValue={props.serie.rating["Mystery"]}
            name="Mystery"
          ></input>
          <br></br>
          <br></br>
          <label hmtlfor="Sci-Fi & Fantasy">Sci-Fi & Fantasy: </label>
          <input
            type="text"
            id="Sci-Fi & Fantasy"
            defaultValue={props.serie.rating["Sci-Fi & Fantasy"]}
            name="Sci-Fi & Fantasy"
          ></input>
          <br></br>
          <br></br>
          <label hmtlfor="Sport">Sport: </label>
          <input
            type="text"
            id="Sport"
            defaultValue={props.serie.rating["Sport"]}
            name="Sport"
          ></input>
          <br></br>
          <br></br>
          <label hmtlfor="Thriller">Thriller: </label>
          <input
            type="text"
            id="Thriller"
            defaultValue={props.serie.rating["Thriller"]}
            name="Thriller"
          ></input>
          <br></br>
          <br></br>
          <label hmtlfor="War & Politics">War & Politics: </label>
          <input
            type="text"
            id="War & Politics"
            defaultValue={props.serie.rating["War & Politics"]}
            name="War & Politics"
          ></input>
          <br></br>
          <br></br>
          <label hmtlfor="Western">Western: </label>
          <input
            type="text"
            id="Western"
            defaultValue={props.serie.rating["Western"]}
            name="Western"
          ></input>
        </form>
      </DialogContent>
      <DialogActions
        style={{
          color: "#00fed7",
          backgroundColor: "#111",
          justifyContent: "space-around",
          padding: "3%",
        }}
        id="dialog-footer"
      >
        <Button
          style={{
            fontFamily: '"Belanosima", sans-serif',
            color: "#00fed7",
            backgroundColor: "#333",
          }}
          onClick={handleDelete}
        >
          Serie löschen
        </Button>
        <Button
          style={{
            color: "#00fed7",
            fontFamily: '"Belanosima", sans-serif',
            backgroundColor: "#333",
          }}
          onClick={(event) => {
            handle_change(event);
          }}
        >
          Rating ändern
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomDialog;
