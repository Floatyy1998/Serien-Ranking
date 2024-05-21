import React from "react";
import Firebase from "firebase/compat/app";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Chip,
  Stack,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

const CustomDialog = (props) => {
  const handleFocus = (event) => {
    event.target.style.border = "1px solid #00fed7";
  };
  const handleBlur = (event) => {
    event.target.style.border = "1px solid rgb(204, 204, 204)";
  };
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
    let serien = await Firebase.database().ref(`/serien`).once("value");
    serien = serien.val();
    serien = serien.filter(function (element) {
      return element !== undefined;
    });
    serien.forEach((serie, index) => {
      serie.nmr = index;
    });

    await Firebase.database().ref(`serien/`).set(serien);
  };

  const getGenres = () => {
    try {
    } catch (error) {}
    return props.serie.genre.genres.map((genre, index) => (
      <Chip
        style={{ cursor: "pointer" }}
        key={index}
        label={genre}
        color="primary"
        className="genreChip"
        onClick={() => {
          document.getElementById(genre).focus();
        }}
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
            borderRadius: "10px",
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
            width: "90%",
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
        <p
          className="dialogTitle"
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
            onFocus={handleFocus.bind(this)}
            onBlur={handleBlur.bind(this)}
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
            onFocus={handleFocus.bind(this)}
            onBlur={handleBlur.bind(this)}
            type="text"
            id="All"
            defaultValue={props.serie.rating["All"]}
            name="All"
          ></input>
          <br></br>
          <br></br>
          <label hmtlfor="Animation">Animation: </label>
          <input
            onFocus={handleFocus.bind(this)}
            onBlur={handleBlur.bind(this)}
            type="text"
            id="Animation"
            defaultValue={props.serie.rating["Animation"]}
            name="Animation"
          ></input>
          <br></br>
          <br></br>
          <label hmtlfor="Comedy">Comedy: </label>
          <input
            onFocus={handleFocus.bind(this)}
            onBlur={handleBlur.bind(this)}
            type="text"
            id="Comedy"
            defaultValue={props.serie.rating["Comedy"]}
            name="Comedy"
          ></input>
          <br></br>
          <br></br>
          <label hmtlfor="Crime">Crime: </label>
          <input
            onFocus={handleFocus.bind(this)}
            onBlur={handleBlur.bind(this)}
            type="text"
            id="Crime"
            defaultValue={props.serie.rating["Crime"]}
            name="Crime"
          ></input>
          <br></br>
          <br></br>
          <label hmtlfor="Documentary">Documentary: </label>
          <input
            onFocus={handleFocus.bind(this)}
            onBlur={handleBlur.bind(this)}
            type="text"
            id="Documentary"
            defaultValue={props.serie.rating["Documentary"]}
            name="Documentary"
          ></input>
          <br></br>
          <br></br>
          <label hmtlfor="Drama">Drama: </label>
          <input
            onFocus={handleFocus.bind(this)}
            onBlur={handleBlur.bind(this)}
            type="text"
            id="Drama"
            defaultValue={props.serie.rating["Drama"]}
            name="Drama"
          ></input>
          <br></br>
          <br></br>
          <label hmtlfor="Family">Family: </label>
          <input
            onFocus={handleFocus.bind(this)}
            onBlur={handleBlur.bind(this)}
            type="text"
            id="Family"
            defaultValue={props.serie.rating["Family"]}
            name="Family"
          ></input>
          <br></br>
          <br></br>
          <label hmtlfor="Kids">Kids: </label>
          <input
            onFocus={handleFocus.bind(this)}
            onBlur={handleBlur.bind(this)}
            type="text"
            id="Kids"
            defaultValue={props.serie.rating["Kids"]}
            name="Kids"
          ></input>
          <br></br>
          <br></br>

          <label hmtlfor="Mystery">Mystery: </label>
          <input
            onFocus={handleFocus.bind(this)}
            onBlur={handleBlur.bind(this)}
            type="text"
            id="Mystery"
            defaultValue={props.serie.rating["Mystery"]}
            name="Mystery"
          ></input>
          <br></br>
          <br></br>
          <label hmtlfor="Reality">Reality: </label>
          <input
            onFocus={handleFocus.bind(this)}
            onBlur={handleBlur.bind(this)}
            type="text"
            id="Reality"
            defaultValue={props.serie.rating["Reality"]}
            name="Reality"
          ></input>
          <br></br>
          <br></br>
          <label hmtlfor="Sci-Fi & Fantasy">Sci-Fi & Fantasy: </label>
          <input
            onFocus={handleFocus.bind(this)}
            onBlur={handleBlur.bind(this)}
            type="text"
            id="Sci-Fi & Fantasy"
            defaultValue={props.serie.rating["Sci-Fi & Fantasy"]}
            name="Sci-Fi & Fantasy"
          ></input>
          <br></br>
          <br></br>
          <label hmtlfor="Talk">Talk: </label>
          <input
            onFocus={handleFocus.bind(this)}
            onBlur={handleBlur.bind(this)}
            type="text"
            id="Talk"
            defaultValue={props.serie.rating["Talk"]}
            name="Talk"
          ></input>
          <br />
          <br />
          <label hmtlfor="War & Politics">War & Politics: </label>
          <input
            onFocus={handleFocus.bind(this)}
            onBlur={handleBlur.bind(this)}
            type="text"
            id="War & Politics"
            defaultValue={props.serie.rating["War & Politics"]}
            name="War & Politics"
          ></input>
          <br></br>
          <br></br>
          <label hmtlfor="Western">Western: </label>
          <input
            onFocus={handleFocus.bind(this)}
            onBlur={handleBlur.bind(this)}
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
            borderRadius: "10px",
            backgroundColor: "#333",
            height: "41px",
          }}
          onClick={handleDelete}
        >
          Serie löschen
        </Button>
        <Button
          style={{
            color: "#00fed7",
            borderRadius: "10px",
            fontFamily: '"Belanosima", sans-serif',
            backgroundColor: "#333",
            height: "41px",
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
