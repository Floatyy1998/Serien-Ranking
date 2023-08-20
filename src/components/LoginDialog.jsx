import React, { useEffect } from "react";
import Firebase from "firebase/compat/app";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Snackbar,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";


const mail = process.env.REACT_APP_MAIL;



const LoginDialog = (props) => {

  const [errorMessage, setErrorMessage] = React.useState("");
  const [openErrorSnack, setOpenErrorSnack] = React.useState(false);

  const [openLoginSnack, setOpenLoginSnack] = React.useState(false);
  const [user, setUser] = React.useState(null);

  const Alert = React.forwardRef(function Alert(props, ref) {
    return (
      <MuiAlert
        style={{ borderRadius: "30px" }}
        elevation={6}
        ref={ref}
        variant="filled"
        {...props}
      />
    );
  });



  useEffect(() => {
    if (!Firebase.auth().currentUser) {
      if (!localStorage.getItem(mail)) {
        Firebase.auth()
          .signOut()
          .then(
            function () {
              localStorage.removeItem(mail);
              setUser(null);
              document.getElementById("login").innerHTML = "LOGIN";
            },
            function (error) {
              console.error("Sign Out Error", error);
            }
          );
      } else {
        Firebase.auth()
          .signInWithEmailAndPassword(mail, localStorage.getItem(mail))
          .then((userCredential) => {
            setUser(mail);
            document.getElementById("login").innerHTML = "LOGOUT";
          })
          .catch((error) => {
            var errorMessage = error.message;
            alert(errorMessage);
          });
      }
    } else {
      setUser(mail);
      document.getElementById("login").innerHTML = "LOGOUT";
    }
  }, [user]);


  const login = () => {
    var email = document.getElementById("Email").value;
    var passwort = document.getElementById("Passwort").value;
    if (email === null || email === "") {
      document.getElementById("Email").focus();
      setErrorMessage("Email muss eingegeben werden!");
      setOpenErrorSnack(true);
      
    } else {
      if (passwort === null || passwort === "") {
        document.getElementById("Passwort").focus();
        setErrorMessage("Passwort muss eingegeben werden!");
        setOpenErrorSnack(true);
       
      } else {
        Firebase.auth()
          .signInWithEmailAndPassword(email, passwort)
          .then((userCredential) => {
            document.getElementById("login").innerHTML = "LOGOUT";
            localStorage.setItem(mail, passwort);
            document.getElementById("Email").value = "";
            document.getElementById("Passwort").value = "";
            props.close();
            setOpenLoginSnack(true);
          })
          .catch((error) => {
           setErrorMessage(error.message);
           setOpenErrorSnack(true);
          });
      }
    }
  };

  const handleFocus = (event) => {
    event.target.style.border = "1px solid #00fed7";
  };
  const handleBlur = (event) => {
    event.target.style.border = "1px solid rgb(204, 204, 204)";
  };

  return (
    <>
     <Snackbar
          open={openLoginSnack}
          autoHideDuration={3000}
          onClose={(_) => setOpenLoginSnack(false)}
        >
          <Alert severity="success" sx={{ width: "100%" }}>
            Login erfolgreich!
          </Alert>
        </Snackbar>
    <Snackbar
          open={openErrorSnack}
          autoHideDuration={3000}
          onClose={(_) => setOpenErrorSnack(false)}
        >
          <Alert severity="error" sx={{ width: "100%" }}>
            {errorMessage}
          </Alert>
        </Snackbar>
   
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
          Login
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
          <label hmtlfor="Email">Email </label>
          <input
            onFocus={handleFocus.bind(this)}
            onBlur={handleBlur.bind(this)}
            className="dialoRating"
            type="text"
            id="Email"
            name="Email"
          ></input>
          <br></br>
          <br></br>
          <label hmtlfor="Passwort">Passwort</label>
          <input
            onFocus={handleFocus.bind(this)}
            onBlur={handleBlur.bind(this)}
            type="text"
            id="Passwort"
            name="Passwort"
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
            color: "#00fed7",
            borderRadius: "10px",
            fontFamily: '"Belanosima", sans-serif',
            backgroundColor: "#333",
            height: "41px",
          }}
          onClick={(event) => {
            login();
            event.preventDefault();
          }}
        >
          Login
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};
export default LoginDialog;
