import React, { useState } from 'react';
import Firebase from 'firebase/compat/app';

import Button from '@mui/material/Button';

import LoginDialog from './LoginDialog';

const mail = process.env.REACT_APP_MAIL;
const UserId = process.env.REACT_APP_USERID;
const User = process.env.REACT_APP_USER;

function SideNav(props) {
  const [open, setOpen] = useState(false);

  const handlelogin = () => {
    if (document.getElementById('login').innerHTML === 'LOGIN') {
      setOpen(true);
    } else {
      checklogin();
      document.getElementById('login').innerHTML = 'LOGIN';
    }
  };

  const checklogin = () => {
    const currentUser = Firebase.auth()?.currentUser;
    if (currentUser) {
      Firebase.auth()
        .signOut()
        .then(
          function () {
            localStorage.removeItem(mail);
            document.getElementById('login').innerHTML = 'LOGIN';
          },
          function (error) {
            console.error('Sign Out Error', error);
          }
        );
    }
  };

  const handleFocus = (event) => {
    event.target.style.border = '1px solid #00fed7';
  };
  const handleBlur = (event) => {
    event.target.style.border = '1px solid rgb(204, 204, 204)';
  };

  const hinzufuegen = async (event) => {
    event.preventDefault();
    const currentUser = Firebase.auth().currentUser;
    if (currentUser == null || currentUser.uid !== UserId) {
      alert('Bitte Einloggen!');
      return;
    }
    const title = event.target[0].value;
    event.target[0].value = '';
    props.toggleSerienStartSnack(true);

    try {
      const res = await fetch('https://serienapi.konrad-dinges.de/add', {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
          'Content-Type': 'application/json',
          // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify({
          user: User,
          title: title,
        }), // body data type must match "Content-Type" header
      });

      if (res.status === 200) {
        props.toggleSerienStartSnack(false);
        props.toggleSerienEndSnack(true);
        return;
      }
      props.toggleSerienStartSnack(false);
      props.toggleErrorSnack(true);
      alert(JSON.stringify((await res.json()).error));

      // await addNewSeries(event);
    } catch (error) {
      console.error(error);
      props.toggleSerienStartSnack(false);
      props.toggleErrorSnack(true);
    }
  };

  return (
    <>
      <LoginDialog open={open} close={(_) => setOpen(false)}></LoginDialog>
      <div
        style={{ zIndex: '99', paddingLeft: '10%', paddingRight: '10%' }}
        id="mySidenav"
        className="sidenav"
      >
        <h3
          style={{ marginTop: '80px', height: '41px' }}
          className="button"
          id="login"
          onClick={(_) => handlelogin()}
        >
          LOGIN
        </h3>
        <form
          className="hinzufuegen"
          id="hinzufuegen"
          onSubmit={hinzufuegen.bind(this)}
          autoComplete="off"
          style={{ padding: '0', marginTop: '20px', textAlign: 'center' }}
        >
          <h3 style={{ margin: '0', marginBottom: '9px', fontSize: '1.5rem' }}>
            Serie hinzufügen
          </h3>

          <label style={{ fontSize: '1.2rem' }} hmtlfor="Title">
            Title:{' '}
          </label>
          <input
            onFocus={handleFocus.bind(this)}
            onBlur={handleBlur.bind(this)}
            style={{ textAlign: 'center' }}
            type="text"
            id="Title"
            name="Title"
          ></input>
          <Button
            style={{
              borderRadius: '10px',
              fontWeight: 'bold',
              fontFamily: '"Belanosima", sans-serif',
              height: '41px',
              width: '100%',
              backgroundColor: '#333',
              color: '#ccc',
              fontSize: '1rem',
              marginBottom: '60px',
            }}
            type="submit"
            value="SERIE HINZUFÜGEN"
          >
            SERIE HINZUFÜGEN
          </Button>
        </form>
      </div>
    </>
  );
}

export default SideNav;
