import React, { useEffect } from "react";
import { Dialog } from "@mui/material";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Zoom } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import mail from "../configs/mail";
import UserId from "../configs/UserId";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import Firebase from "firebase/compat/app";
import API from "../configs/API";
import "../Styles/App.css";
import { Add } from "@mui/icons-material";

const RecsDialog = (props) => {
  const getSerienCount = async () => {
    const snapshot = await Firebase.database().ref("/serien").once("value");
    const serien = snapshot.val();
    var length;
    if (serien) {
      Object.entries(serien).forEach(([key, value], index) => {
        length = key;
      });
    }

    return length;
  };

  const getProviders = (providerData) => {
    const providers = {
      337: {
        name: "Disney Plus",
        logo: `https://image.tmdb.org/t/p/original/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg`,
      },
      8: {
        name: "Netflix",
        logo: `https://image.tmdb.org/t/p/original/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg`,
      },
      9: {
        name: "Amazon Prime Video",
        logo: `https://image.tmdb.org/t/p/original/emthp39XA2YScoYL1p0sdbAH2WA.jpg`,
      },
      283: {
        name: "Crunchyroll",
        logo: `https://image.tmdb.org/t/p/original/8Gt1iClBlzTeQs8WQm8UrCoIxnQ.jpg`,
      },
      30: {
        name: "WOW",
        logo: `https://image.tmdb.org/t/p/original/1WESsDFMs3cJc2TeT3nnzwIffGv.jpg`,
      },
      350: {
        name: "Apple TV Plus",
        logo: `https://image.tmdb.org/t/p/original/6uhKBfmtzFqOcLousHwZuzcrScK.jpg`,
      },
      421: {
        name: "Joyn Plus",
        logo: `https://image.tmdb.org/t/p/original/2joD3S2goOB6lmepX35A8dmaqgM.jpg`,
      },
      531: {
        name: "Paramount Plus",
        logo: `https://image.tmdb.org/t/p/original/xbhHHa1YgtpwhC8lb1NQ3ACVcLd.jpg`,
      },
      178: {
        name: "MagentaTV",
        logo: `https://image.tmdb.org/t/p/original/uULoezj2skPc6amfwru72UPjYXV.jpg`,
      },
      298: {
        name: "RTL+",
        logo: `https://image.tmdb.org/t/p/original/3hI22hp7YDZXyrmXVqDGnVivNTI.jpg`,
      },
      354: {
        name: "Crunchyroll",
        logo: `https://image.tmdb.org/t/p/original/8Gt1iClBlzTeQs8WQm8UrCoIxnQ.jpg`,
      },
    };
    const flatrateProviders = providerData.results.DE?.flatrate || [];
    const anbieter = flatrateProviders
      .filter((provider) => providers[provider.provider_id])
      .map((provider) => ({
        id: provider.provider_id,
        logo: providers[provider.provider_id].logo,
        name: providers[provider.provider_id].name,
      }));

    return anbieter;
  };

  const fetchSeriesData = async (title) => {
    const snapshot = await Firebase.database().ref("/serien").once("value");
    props.setProgress(10);
    const serien = snapshot.val();

    var remake = false;
    var title = title;
    if (title.slice(-3) === "neu") {
      title = title.slice(0, -4);
      remake = true;
    }

    var recommendations = "";
    var nextEpisode = "";
    const response = await fetch(
      `https://api.themoviedb.org/3/search/tv?api_key=${API.TMDB}&query=${title}&page=1`
    );
    const data = await response.json();
    const id = data.results[0].id;

    if (
      serien.filter((serie) => serie.id === data.results[0].id).length > 0 &&
      !remake
    ) {
      console.log("Serie bereits vorhanden");
      alert(
        'Serie bereits vorhanden.\nWenn Sie versuchen ein Remake hinzuzufügen, fügen Sie bitte ein "neu" hinzu\n\nBeispiel: One Piece neu'
      );
      return;
    } else if (
      remake &&
      serien.filter((serie) => serie.id === data.results[1].id).length > 0
    ) {
      console.log(serien.filter((serie) => serie.id === data.results[1].id));
      alert(
        "Remake bereits vorhanden...\nJetzt kann ich dir nicht mehr helfen"
      );
      return;
    }

    props.setProgress(15);
    const detailsResponse = await fetch(
      `https://api.themoviedb.org/3/tv/${id}?api_key=${API.TMDB}&language=en-US`
    );
    const detailsData = await detailsResponse.json();
    const genres = detailsData.genres.map((genre) => genre.name);
    var theMazeId = "";

    props.setProgress(20);
    try {
      const tvMazeResponse = await fetch(
        `https://api.tvmaze.com/singlesearch/shows?q=${title}`
      );
      props.setProgress(25);
      const tvMazeData = await tvMazeResponse.json();
      theMazeId = tvMazeData.id;
    } catch (error) {}

    if (theMazeId !== "") {
      const tvMazeResponse = await fetch(
        `https://api.tvmaze.com/shows/${theMazeId}`
      );
      props.setProgress(30);
      try {
        const tvMazeData = await tvMazeResponse.json();
        props.setProgress(35);

        if (tvMazeData._links.nextepisode) {
          const tvMazeNextEpisodeResponse = await fetch(
            `${tvMazeData._links.nextepisode.href}`
          );
          const tvMazeNextEpisodeData = await tvMazeNextEpisodeResponse.json();
          nextEpisode = tvMazeNextEpisodeData.airstamp;
        }
      } catch (error) {}
    }
    props.setProgress(40);

    const response2 = await fetch(
      `https://api.themoviedb.org/3/tv/${id}?api_key=${API.TMDB}`
    );
    const data3 = await response2.json();
    props.setProgress(45);

    var random = Math.floor(Math.random() * 100);
    var posterUrl =
      random % 2 === 0
        ? `https://image.tmdb.org/t/p/original${detailsData.poster_path}`
        : `https://image.tmdb.org/t/p/original${data3.poster_path}`;

    try {
      const images = await fetch(
        `https://api.themoviedb.org/3/tv/${id}/images?api_key=${API.TMDB}`
      );
      const imagesData = await images.json();
      const imagesList = imagesData.posters
        .filter((image) => {
          if (
            image.vote_average > 5 &&
            (image.iso_639_1 === null ||
              image.iso_639_1 === "en" ||
              image.iso_639_1 === "de" ||
              image.iso_639_1 === "ja")
          ) {
            return true;
          } else {
            return false;
          }
        })
        .map((image) => {
          return `https://image.tmdb.org/t/p/original${image.file_path}`;
        });
      //imagesList.map(image=> {return `https://image.tmdb.org/t/p/original${image.file_path}`});

      //zufallszahl zwischen 0 und 100
      random = Math.floor(Math.random() * (imagesList.length - 1));

      posterUrl = imagesList[random];
    } catch (error) {}

    const production = data3.in_production;

    const provider = await fetch(
      `https://api.themoviedb.org/3/tv/${id}/season/1/watch/providers?api_key=${API.TMDB}&language=en-US`
    );
    const providerData = await provider.json();
    const anbieter = getProviders(providerData);

    props.setProgress(50);

    const response3 = await fetch(
      `https://api.themoviedb.org/3/tv/${id}/external_ids?api_key=${API.TMDB}&language=en-US`
    );
    const data4 = await response3.json();
    const imdb_id = data4.imdb_id;
    const wo = `https://www.werstreamt.es/filme-serien/?q=${data4.imdb_id}&action_results=suchen`;

    props.setProgress(55);
    const rec = await fetch(
      `https://api.themoviedb.org/3/tv/${id}/recommendations?api_key=${API.TMDB}&language=de-DE`
    );
    const recData = await rec.json();
    props.setProgress(60);
    const rec2 = await fetch(
      `https://api.themoviedb.org/3/tv/${id}/recommendations?api_key=${API.TMDB}&language=de-DE&page=2`
    );
    props.setProgress(65);
    const recData2 = await rec2.json();
    let recResults = recData.results;
    recResults = recResults.concat(recData2.results);
    recResults = recResults.filter(
      (value, index, self) => index === self.findIndex((t) => t.id === value.id)
    );

    let ids = [];
    for (let i = 0; i < serien.length; i++) {
      ids.push(serien[i].id);
    }
    var recs = recResults.filter(function (o1) {
      if (!ids.includes(o1.id)) {
        return true;
      }
    });

    for (let i = 0; i < recs.length; i++) {
      const provider = await fetch(
        `https://api.themoviedb.org/3/tv/${recs[i].id}/season/1/watch/providers?api_key=${API.TMDB}&language=en-US`
      );
      props.setProgress(70 + (i / recs.length) * 30);

      const providerData = await provider.json();
      const anbieter = getProviders(providerData);

      recs[i].provider = anbieter;
      const response2 = await fetch(
        `https://api.themoviedb.org/3/tv/${recs[i].id}?api_key=${API.TMDB}`
      );
      const data3 = await response2.json();
      recs[i].production = data3.in_production;

      const response3 = await fetch(
        `https://api.themoviedb.org/3/tv/${recs[i].id}/external_ids?api_key=${API.TMDB}&language=en-US`
      );
      const data4 = await response3.json();
      recs[i].imdb_id = data4.imdb_id;

      recs[
        i
      ].wo = `https://www.werstreamt.es/filme-serien/?q=${data4.imdb_id}&action_results=suchen`;
    }
    try {
      if (recData.total_results !== 0) {
        recommendations = recs;
      }
    } catch (error) {}

    return {
      id,
      genres,
      theMazeId,
      nextEpisode,
      imdb_id,
      posterUrl,
      production,
      anbieter,
      wo,
      recommendations,
    };
  };

  const addNewSeries = async (event) => {
    props.toggleSerienStartSnack(true);
    event.preventDefault();
    const length = await getSerienCount();
    //props.setProgress(5);
    const nmr = parseInt(length) + 1;
    var title = event.target.getAttribute("titel");
    if (title === null) {
      title = event.target.parentElement.getAttribute("titel");
    }

    const begründung = "";
    const ratings = {
      "Action & Adventure": 0,
      All: 0,
      Animation: 0,
      Comedy: 0,
      Crime: 0,
      Documentary: 0,
      Drama: 0,
      Family: 0,
      Horror: 0,
      Mystery: 0,
      Reality: 0,
      "Sci-Fi & Fantasy": 0,
      Sport: 0,
      Thriller: 0,
      "War & Politics": 0,
      Western: 0,
    }; // getRatings(event);
    const {
      id,
      genres,
      theMazeId,
      nextEpisode,
      imdb_id,
      posterUrl,
      production,
      anbieter,
      wo,
      recommendations,
    } = await fetchSeriesData(title);
    props.setProgress(100);

    const postData = {
      imdb: { imdb_id: imdb_id },
      nextEpisode: { nextEpisode: nextEpisode },
      poster: { poster: posterUrl },
      provider: { provider: anbieter },
      recommendation: { recommendations: recommendations },
      tvMaze: { tvMazeID: theMazeId },
      production: { production: production },
      wo: { wo: wo },

      title,
      nmr,
      rating: ratings,
      genre: { genres: ["All", ...genres] },
      id,
      begründung,
    };
    const currentUser = Firebase.auth().currentUser;
    if (currentUser == null || currentUser.uid !== UserId) {
      alert("Bitte Einloggen!");
      props.toggleSerienStartSnack(false);
      return;
    }

    await Firebase.database()
      .ref("serien/" + nmr)
      .set(postData);

    props.toggleSerienStartSnack(false);

    props.setProgress(0);
  };

  const hinzufuegen = async (event) => {
    try {
      await addNewSeries(event);
      props.toggleSerienEndSnack(true);
    } catch (error) {
      console.error(error);
      props.toggleSerienStartSnack(false);
      props.toggleErrorSnack(true);
    }
  };

  const getProvider = (providers) => {
    try {
      const provider = providers;
      const providerList = [];
      Object.entries(provider).forEach(([key, value]) => {
        if (value) {
          providerList.push(value);
        }
      });

      var providerListShort = providerList.filter(
        (value, index, self) =>
          index ===
          self.findIndex((t) => t.logo === value.logo && t.name === value.name)
      );
      if (providerList.length > 3) {
        providerListShort = providerList.slice(0, 3);
      }

      return providerListShort.map((provider, index) => (
        <img
          title={provider.name + " (Provided by JustWatch)"}
          key={Date.now() + index}
          src={provider.logo}
          alt={"Bild nicht verfügbar"}
          style={{
            width: "auto",
            height: "100%",
            marginLeft: "5%",
            float: "left",
            borderRadius: "10px",
            boxShadow:
              "0 4px 8px 0 rgba(0, 0, 0, 0.5), 0 6px 20px 0 rgba(0, 0, 0, 0.5)",
          }}
        />
      ));
    } catch (error) {
      return;
    }
  };

  const redirect = (link) => {
    window.open(link);
  };

  const getRecs = () => {
    try {
      const recs = props.serie.recommendation.recommendations;

      if (recs !== "" && recs !== undefined && recs !== null) {
        return recs.map((rec, index) => (
          <li key={Date.now() * Math.random() * 9999 * Math.random() * 99999}>
            <div
              className="polaroid"
              style={{
                boxShadow: rec.production
                  ? "rgba(66, 210, 15, 0.5) 12px 11px 20px 0px, -5px -5px 20px 0px rgba(255, 255, 255, 0.2)"
                  : "rgba(177, 3, 255, 0.5) 12px 11px 20px 0px, -5px -5px 20px 0px rgba(255, 255, 255, 0.2)",
              }}
            >
              <div
                className="pposter"
                style={{
                  backgroundImage: `url(https://image.tmdb.org/t/p/original${rec.poster_path})`,
                  borderTopLeftRadius: "30px",
                  borderTopRightRadius: "30px",
                }}
                onClick={(event) => {
                  if (event.target === event.currentTarget) {
                    redirect(`https://www.imdb.com/title/${rec.imdb_id}/`);
                  }
                }}
              >
                <div
                  style={{
                    paddingTop: "5%",
                    background: "none",
                    width: "95%",
                    textAlign: "right",
                    height: "14%",
                  }}
                >
                  {getProvider(rec.provider)}
                  <Tooltip
                    TransitionComponent={Zoom}
                    title={
                      <React.Fragment>
                        <Typography
                          style={{
                            textDecoration: "underline",
                            textAlign: "center",
                          }}
                        >
                          <b>Beschreibung</b>
                        </Typography>

                        <Typography
                          style={{
                            textAlign: "center",
                            whiteSpace: "pre-line",
                          }}
                        >
                          {rec.overview}
                        </Typography>
                      </React.Fragment>
                    }
                    arrow
                    placement="bottom-end"
                    componentsProps={{
                      tooltip: {
                        sx: {
                          borderRadius: "20px",

                          color: "#ccc",
                          backgroundColor: "#111",
                          fontSize: "0.9rem",
                        },
                      },
                    }}
                  >
                    <InfoOutlinedIcon
                      style={{
                        color: "rgb(0, 254, 215)",
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        borderRadius: "50%",
                      }}
                      className="tooltip"
                      id="tooltipRecs"
                    ></InfoOutlinedIcon>
                  </Tooltip>
                </div>
                <AddOutlinedIcon
                  titleAccess="Zur Liste hinzufügen"
                  titel={rec.name}
                  style={{
                    color: "rgb(0, 254, 215)",
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    borderRadius: "50%",
                    position: "relative",
                    top: "255px",

                    left: "+93px",
                  }}
                  className="tooltip"
                  id="tooltipRecs"
                  onClick={(event) => {
                    hinzufuegen(event);
                  }}
                ></AddOutlinedIcon>
              </div>

              <div
                className="draußen"
                style={{ borderRadius: "30px", width: "100%" }}
              >
                <p
                  className="padding"
                  onClick={(_) => {
                    redirect(rec.wo);
                  }}
                >
                  <span
                    style={{
                      width: "100%",
                      height: "40%",
                      display: "grid",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  ></span>
                  <a
                    target="_blank"
                    style={{
                      width: "100%",
                      height: "60%",
                      display: "grid",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    {rec.name}
                  </a>
                </p>
              </div>
            </div>
          </li>
        ));
      } else {
        return (
          <p style={{ fontSize: "1.5rem", color: "#ccc" }}>
            Keine Empfehlungen vorhanden.
          </p>
        );
      }
    } catch (error) {
      return <p style={{ color: "#ccc" }}>Keine Empfehlungen vorhanden.</p>;
    }
  };

  return (
    <Dialog
      fullWidth={true}
      maxWidth="xl"
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
          Ähnliche Serien wie {props.serie.title}
        </p>
      </DialogTitle>
      <DialogContent>
        <ul className="list" id="serienRecs">
          {getRecs()}
        </ul>
      </DialogContent>
    </Dialog>
  );
};
export default RecsDialog;
