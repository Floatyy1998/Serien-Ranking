import React, { useEffect, useState } from 'react';
import '../Styles/App.css';
import SeriesRow from './SeriesRow';
import Firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/auth';
import 'firebase/compat/analytics';

import SideNav from './SideNav';
import Header from './Header';
import Select from './Select';
import Search from './Search';
import Legende from './Legende';
import ScrollUp from './ScrollUp';
import ScrollDown from './ScrollDown';
import { Snackbar } from '@mui/material';
import MuiAlert from '@mui/material/Alert';

const mail = process.env.REACT_APP_MAIL;

//provider mapping 337:Disney Plus; 8:Netflix; 9:Amazon Prime Video;  283:Crunchyroll; ros.desiree.97@gmail.com florian3456@aol.com
//https://api.themoviedb.org/3/tv/246/watch/providers?api_key=d812a3cdd27ca10d95979a2d45d100cd request um provider zu bekommen

const App = () => {
  const config = {
    apiKey: process.env.REACT_APP_APIKEY,
    authDomain: process.env.REACT_APP_AUTHDOMAIN,
    databaseURL: process.env.REACT_APP_DATABASEURL,
    projectId: process.env.REACT_APP_PROJECTID,
    storageBucket: process.env.REACT_APP_STORAGEBUCKET,
    messagingSenderId: process.env.REACT_APP_MESSAGINGSENDERID,
    appId: process.env.REACT_APP_APPID,
    measurementId: process.env.REACT_APP_MEASUREMENTID,
  };

  Firebase.initializeApp(config);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [genre, setGenre] = useState('All');
  const [provider, setProvider] = useState('All');
  const [filter, setFilter] = useState('');
  const [openErrorSnack, setOpenErrorSnack] = React.useState(false);
  const [openSerienSnack, setOpenSerienSnack] = React.useState(false);
  const [openSerienEndSnack, setOpenSerienEndSnack] = React.useState(false);
  const [, setProgress] = React.useState(0);
  const [user, setUser] = useState(null);

  const Alert = React.forwardRef(function Alert(props, ref) {
    return (
      <MuiAlert
        style={{ borderRadius: '30px' }}
        elevation={6}
        ref={ref}
        variant="filled"
        {...props}
      />
    );
  });

  const handleCloseSerienSnack = (event, reason) => {
    setOpenSerienEndSnack(false);
    if (reason === 'clickaway') {
      return;
    }
  };

  useEffect(() => {
    if (!Firebase.auth().currentUser) {
      if (!localStorage.getItem(mail)) {
        Firebase.auth()
          .signOut()
          .then(
            function () {
              localStorage.removeItem(mail);
              setUser(null);
              document.getElementById('login').innerHTML = 'LOGIN';
            },
            function (error) {
              console.error('Sign Out Error', error);
            }
          );
      } else {
        Firebase.auth()
          .signInWithEmailAndPassword(mail, localStorage.getItem(mail))
          .then((userCredential) => {
            setUser(mail);
            document.getElementById('login').innerHTML = 'LOGOUT';
          })
          .catch((error) => {
            var errorMessage = error.message;
            alert(errorMessage);
          });
      }
    } else {
      setUser(mail);
      document.getElementById('login').innerHTML = 'LOGOUT';
    }
  }, [user]);

  useEffect(() => {
    checkGenre();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genre, filter, provider]);

  const getProviders = (providerData) => {
    const providers = {
      337: {
        name: 'Disney Plus',
        logo: `https://image.tmdb.org/t/p/original/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg`,
      },
      8: {
        name: 'Netflix',
        logo: `https://image.tmdb.org/t/p/original/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg`,
      },
      9: {
        name: 'Amazon Prime Video',
        logo: `https://image.tmdb.org/t/p/original/emthp39XA2YScoYL1p0sdbAH2WA.jpg`,
      },
      283: {
        name: 'Crunchyroll',
        logo: `https://image.tmdb.org/t/p/original/8Gt1iClBlzTeQs8WQm8UrCoIxnQ.jpg`,
      },
      30: {
        name: 'WOW',
        logo: `https://image.tmdb.org/t/p/original/1WESsDFMs3cJc2TeT3nnzwIffGv.jpg`,
      },
      350: {
        name: 'Apple TV Plus',
        logo: `https://image.tmdb.org/t/p/original/6uhKBfmtzFqOcLousHwZuzcrScK.jpg`,
      },
      421: {
        name: 'Joyn Plus',
        logo: `https://image.tmdb.org/t/p/original/2joD3S2goOB6lmepX35A8dmaqgM.jpg`,
      },
      531: {
        name: 'Paramount Plus',
        logo: `https://image.tmdb.org/t/p/original/xbhHHa1YgtpwhC8lb1NQ3ACVcLd.jpg`,
      },
      178: {
        name: 'MagentaTV',
        logo: `https://image.tmdb.org/t/p/original/uULoezj2skPc6amfwru72UPjYXV.jpg`,
      },
      298: {
        name: 'RTL+',
        logo: `https://image.tmdb.org/t/p/original/3hI22hp7YDZXyrmXVqDGnVivNTI.jpg`,
      },
      354: {
        name: 'Crunchyroll',
        logo: `https://image.tmdb.org/t/p/original/8Gt1iClBlzTeQs8WQm8UrCoIxnQ.jpg`,
      },
      613: {
        name: 'Freevee',
        logo: `https://image.tmdb.org/t/p/original/uBE4RMH15mrkuz6vXzuJc7ZLXp1.jpg`,
      },
    };
    const flatrateProviders = [
      ...(providerData.results.DE?.flatrate || []),
      ...(providerData.results.DE?.ads || []),
    ];

    const anbieter = flatrateProviders
      .filter((provider) => providers[provider.provider_id])
      .map((provider) => ({
        id: provider.provider_id,
        logo: providers[provider.provider_id].logo,
        name: providers[provider.provider_id].name,
      }));

    return anbieter;
  };

  const isbigger = (a, b) => {
    let punktea = 0;
    let punkteb = 0;

    if (
      genre === 'All' ||
      genre === 'Neue Episoden' ||
      genre === 'Animation' ||
      genre === 'Documentary' ||
      genre === 'Sport'
    ) {
      punktea = Object.entries(a['rating']).reduce((acc, [key, value]) => {
        const multiplier = a['genre']['genres'].includes(key) ? 3 : 1;
        return acc + value * multiplier;
      }, 0);
      punkteb = Object.entries(b['rating']).reduce((acc, [key, value]) => {
        const multiplier = b['genre']['genres'].includes(key) ? 3 : 1;
        return acc + value * multiplier;
      }, 0);
      punktea /= Object.keys(a['genre']['genres']).length;
      punkteb /= Object.keys(b['genre']['genres']).length;
    } else {
      punktea += a['rating'][genre];
      punkteb += b['rating'][genre];
      punktea /= 2;
      punkteb /= 2;
    }

    return punktea > punkteb;
  };

  const checkGenre = () => {
    setLoading(true);
    let ref = Firebase.database().ref('/serien');
    ref.on('value', (snapshot) => {
      const series = snapshot.val();
      let filteredSeries = [];

      if (series !== null) {
        if (provider !== 'All') {
          filteredSeries = series.filter((serie) => {
            try {
              if (genre === 'Neue Episoden') {
                return (
                  serie.nextEpisode.nextEpisode !== '' &&
                  serie.title.toLowerCase().includes(filter.toLowerCase()) &&
                  serie.provider.provider.some((providers) => {
                    return providers.name === provider;
                  })
                );
              } else if (genre === 'A-Z' || genre === 'Zuletzt Hinzugefügt') {
                return (
                  serie.title.toLowerCase().includes(filter.toLowerCase()) &&
                  serie.provider.provider.some((providers) => {
                    return providers.name === provider;
                  })
                );
              } else {
                return (
                  serie.genre.genres.includes(genre) &&
                  serie.title.toLowerCase().includes(filter.toLowerCase()) &&
                  serie.provider.provider.some((providers) => {
                    return providers.name === provider;
                  })
                );
              }
            } catch (error) {}
            return null;
          });
        } else {
          filteredSeries = series.filter((serie) => {
            try {
              if (genre === 'Neue Episoden') {
                return (
                  serie.nextEpisode.nextEpisode !== '' &&
                  serie.title.toLowerCase().includes(filter.toLowerCase())
                );
              } else if (genre === 'A-Z' || genre === 'Zuletzt Hinzugefügt') {
                return serie.title.toLowerCase().includes(filter.toLowerCase());
              } else {
                return (
                  serie.genre.genres.includes(genre) &&
                  serie.title.toLowerCase().includes(filter.toLowerCase())
                );
              }
            } catch (error) {}
            return null;
          });
        }

        if (genre === 'A-Z') {
          filteredSeries.sort((a, b) =>
            a.title.toLowerCase() > b.title.toLowerCase()
              ? 1
              : b.title.toLowerCase() > a.title.toLowerCase()
              ? -1
              : 0
          );
        } else if (genre === 'Neue Episoden') {
          filteredSeries.sort((a, b) =>
            a.nextEpisode.nextEpisode > b.nextEpisode.nextEpisode
              ? 1
              : b.nextEpisode.nextEpisode > a.nextEpisode.nextEpisode
              ? -1
              : 0
          );
        } else if (genre === 'Zuletzt Hinzugefügt') {
          filteredSeries.reverse();
        } else {
          filteredSeries.sort((a, b) =>
            a.title > b.title ? 1 : b.title > a.title ? -1 : 0
          );
          filteredSeries.sort((a, b) =>
            isbigger(a, b) ? -1 : !isbigger(a, b) ? 1 : 0
          );
        }

        var i = 1;
        var seriesRows = [];
        filteredSeries.forEach((serie) => {
          let date = Math.floor(Math.random() * 9999999999999999999);
          const seriesRow = (
            <SeriesRow
              serie={serie}
              key={date}
              i={i}
              genre={genre}
              filter={filter}
              toggleSerienStartSnack={(wert) => setOpenSerienSnack(wert)}
              toggleSerienEndSnack={(wert) => setOpenSerienEndSnack(wert)}
              setProgress={(wert) => setProgress(wert)}
            />
          );
          seriesRows.push(seriesRow);
          i++;
        });

        setRows(seriesRows);
        setLoading(false);
      }

      setLoading(false);
    });
  };

  const removeNav = () => {
    document.getElementById('mySidenav').classList.remove('sidenav-offen');
  };

  if (loading) {
    return (
      <>
        <div>
          <SideNav getProviders={getProviders} />
          <div id="main" key="0">
            <Header />
            <div id="Ueberschrift">
              <Search
                search={(e) => {
                  setFilter(e);
                }}
              />
              <Select
                setGenre={(e) => {
                  setGenre(e);
                }}
                setProvider={(e) => {
                  setProvider(e);
                }}
              />
              <Legende />
            </div>
            <ScrollDown />
            <div
              className="container"
              onClick={(_) => {
                removeNav();
              }}
            >
              <div className="loader">
                <div className="inner one"></div>
                <div className="inner two"></div>
                <div className="inner three"></div>
              </div>
            </div>
            <ScrollUp />
          </div>
        </div>
      </>
    );
  } else {
    return (
      <>
        <Snackbar
          open={openErrorSnack}
          autoHideDuration={3000}
          onClose={(_) => setOpenErrorSnack(false)}
        >
          <Alert severity="error" sx={{ width: '100%' }}>
            Serie nicht gefunden! Bitte überprüfe ob du den Titel richtig
            geschrieben hast!
          </Alert>
        </Snackbar>
        <Snackbar open={openSerienSnack} autoHideDuration={2000}>
          <Alert severity="warning" sx={{ width: '100%' }}>
            Serie wird hinzugefügt!
          </Alert>
        </Snackbar>
        <Snackbar
          open={openSerienEndSnack}
          autoHideDuration={3000}
          onClose={handleCloseSerienSnack}
        >
          <Alert
            onClose={handleCloseSerienSnack}
            severity="success"
            sx={{ width: '100%' }}
          >
            Serie erfolgreich hinzugefügt!
          </Alert>
        </Snackbar>
        <div>
          <SideNav
            toggleSerienStartSnack={(wert) => setOpenSerienSnack(wert)}
            toggleSerienEndSnack={(wert) => setOpenSerienEndSnack(wert)}
            toggleErrorSnack={(wert) => setOpenErrorSnack(wert)}
            setProgress={(wert) => setProgress(wert)}
            getProviders={getProviders}
            user={user}
          />
          <div id="main" key="0">
            <Header user={user} />
            <div id="Ueberschrift">
              <Search
                search={(e) => {
                  setFilter(e);
                }}
              />
              <Select
                setGenre={(e) => {
                  setGenre(e);
                }}
                setProvider={(e) => {
                  setProvider(e);
                }}
              />
              <Legende />
            </div>
            <ScrollDown />
            <div
              className="container"
              onClick={(_) => {
                removeNav();
              }}
            >
              <ul className="list" id="serien">
                {rows.length > 0 ? (
                  rows
                ) : (
                  <h1 style={{ color: 'white' }}>Keine Serien vorhanden!</h1>
                )}
              </ul>
            </div>
            <ScrollUp />
          </div>
        </div>
      </>
    );
  }
};

export default App;
