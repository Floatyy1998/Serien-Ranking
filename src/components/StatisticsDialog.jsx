import React, { useEffect } from "react";
import Firebase from "firebase/compat/app";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  BarElement,
  LinearScale,
} from "chart.js";
import { Bar, Doughnut, Pie } from "react-chartjs-2";
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  BarElement,
  LinearScale
);

const StatisticsDialog = (props) => {
  const [loading, setLoading] = React.useState(true);
  const [anbieterChartData, setAnbieterChartData] = React.useState({
    labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
    datasets: [
      {
        label: "Anzahl der Serien",
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: [
          "rgba(255, 99, 132, 0.2)",
          "rgba(54, 162, 235, 0.2)",
          "rgba(255, 206, 86, 0.2)",
          "rgba(75, 192, 192, 0.2)",
          "rgba(153, 102, 255, 0.2)",
          "rgba(255, 159, 64, 0.2)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  });
  const [anbieterChartData2, setAnbieterChartData2] = React.useState({
    labels: ["January", "February", "March", "April", "May", "June", "July"],
    datasets: [
      {
        label: "gfsfgsfd",
        data: [65, 59, 80, 81, 56, 55, 40],
        backgroundColor: [
          "rgba(255, 99, 132, 0.8)",
          "rgba(54, 162, 235, 0.8)",
          "rgba(255, 206, 86, 0.8)",
          "rgba(75, 192, 192, 0.8)",
          "rgba(153, 102, 255, 0.8)",
          "rgba(255, 159, 64, 0.8)",
          "rgb(255, 255, 255, 0.8)",
          "rgb(0, 155, 0, 0.8)",
          "rgb(153, 0, 76, 0.8)",
          "rgb(204, 0, 0, 0.8)",
          "rgb(128, 255, 0, 0.8)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
          "rgb(255, 255, 255, 0.2)",
          "rgb(0, 155, 0, 0.8)",
          "rgb(153, 0, 76, 0.8)",
          "rgb(204, 0, 0, 0.8)",
          "rgb(128, 255, 0, 0.8)",
          31,
        ],
        borderWidth: 1,
      },
    ],
  });

  const [genreChartData, setGenreChartData] = React.useState({
    labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
    datasets: [
      {
        label: "Anzahl der Serien",
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: [
          "rgba(255, 99, 132, 0.2)",
          "rgba(54, 162, 235, 0.2)",
          "rgba(255, 206, 86, 0.2)",
          "rgba(75, 192, 192, 0.2)",
          "rgba(153, 102, 255, 0.2)",
          "rgba(255, 159, 64, 0.2)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  });
  const [genreChartData2, setGenreChartData2] = React.useState({
    labels: ["January", "February", "March", "April", "May", "June", "July"],
    datasets: [
      {
        label: "gfsfgsfd",
        data: [65, 59, 80, 81, 56, 55, 40],
        backgroundColor: [
          "rgba(255, 99, 132, 0.8)",
          "rgba(54, 162, 235, 0.8)",
          "rgba(255, 206, 86, 0.8)",
          "rgba(75, 192, 192, 0.8)",
          "rgba(153, 102, 255, 0.8)",
          "rgba(255, 159, 64, 0.8)",
          "rgb(255, 255, 255, 0.8)",
          "rgb(0, 155, 0, 0.8)",
          "rgb(153, 0, 76, 0.8)",
          "rgb(204, 0, 0, 0.8)",
          "rgb(128, 255, 0, 0.8)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
          "rgb(255, 255, 255, 0.2)",
          "rgb(0, 155, 0, 0.8)",
          "rgb(153, 0, 76, 0.8)",
          "rgb(204, 0, 0, 0.8)",
          "rgb(128, 255, 0, 0.8)",
          31,
        ],
        borderWidth: 1,
      },
    ],
  });

  useEffect(() => {
    if (props.open) {
      getAnbieterChartData();
      getAnbieterChartData2();
      getGenreChartData();
      getGenreChartData2();
    }

    // setChartData(getData());
    //  setLoading(false);
  }, [props.open]);

  const getAnbieterChartData = async () => {
    const snapshot = await Firebase.database().ref("/serien").once("value");
    const serien = snapshot.val();
    let labels = new Set();
    serien.forEach((serie) => {
      try {
        serie.provider.provider.forEach((provider) => {
          labels.add(provider.name);
        });
      } catch (error) {}
    });
    let labelArray = Array.from(labels);

    let dataMap = new Map();

    labelArray.forEach((label) => {
      dataMap.set(label, 0);
    });

    serien.forEach((serie) => {
      try {
        serie.provider.provider.forEach((provider) => {
          dataMap.set(provider.name, dataMap.get(provider.name) + 1);
        });
      } catch (error) {}
    });
    let dataArray = Array.from(dataMap.values());

    let data = {
      labels: labelArray,
      datasets: [
        {
          label: "Anzahl der Serien",
          data: dataArray,
          backgroundColor: [
            "rgba(255, 99, 132, 0.8)",
            "rgba(54, 162, 235, 0.8)",
            "rgba(255, 206, 86, 0.8)",
            "rgba(75, 192, 192, 0.8)",
            "rgba(153, 102, 255, 0.8)",
            "rgba(255, 159, 64, 0.8)",
            "rgb(255, 255, 255, 0.8)",
            "rgb(0, 155, 0, 0.8)",
            "rgb(153, 0, 76, 0.8)",
            "rgb(204, 0, 0, 0.8)",
            "rgb(128, 255, 0, 0.8)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
            "rgb(255, 255, 255, 1)",
            "rgb(0, 155, 0, 1)",
            "rgb(153, 0, 76, 1)",
            "rgb(204, 0, 0, 1)",
            "rgb(128, 255, 0, 1)",
            31,
          ],
          borderWidth: 1,
        },
      ],
    };
    setAnbieterChartData(data);
  };

  const getAnbieterChartData2 = async () => {
    const snapshot = await Firebase.database().ref("/serien").once("value");
    const serien = snapshot.val();
    let labels = new Set();
    serien.forEach((serie) => {
      try {
        serie.provider.provider.forEach((provider) => {
          labels.add(provider.name);
        });
      } catch (error) {}
    });
    let labelArray = Array.from(labels);

    let dataMap = new Map();

    labelArray.forEach((label) => {
      dataMap.set(label, { count: 0, rating: 0 });
    });

    serien.forEach((serie) => {
      try {
        serie.provider.provider.forEach((provider) => {

          if (getRating(serie) !== "0.00") {
            dataMap.set(provider.name, {
              count: dataMap.get(provider.name).count + 1,
              rating:
                Number(dataMap.get(provider.name).rating) +
                Number(getRating(serie)),
            });
          }
   
          
        });
      } catch (error) {}
    });


    let dataArray = [];
    dataMap.forEach((value, key) => {

      dataArray.push(addZeroes(round(value.rating / value.count, 0.01)));
    });
    setAnbieterChartData2({
      labels: labelArray,
      datasets: [
        {
          label: "Rating pro Anbieter",
          data: dataArray,
          backgroundColor: [
            "rgba(255, 99, 132, 0.8)",
            "rgba(54, 162, 235, 0.8)",
            "rgba(255, 206, 86, 0.8)",
            "rgba(75, 192, 192, 0.8)",
            "rgba(153, 102, 255, 0.8)",
            "rgba(255, 159, 64, 0.8)",
            "rgb(255, 255, 255, 0.8)",
            "rgb(0, 155, 0, 0.8)",
            "rgb(153, 0, 76, 0.8)",
            "rgb(204, 0, 0, 0.8)",
            "rgb(128, 255, 0, 0.8)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
            "rgb(255, 255, 255, 1)",
            "rgb(0, 155, 0, 1)",
            "rgb(153, 0, 76, 1)",
            "rgb(204, 0, 0, 1)",
            "rgb(128, 255, 0, 1)",
            31,
          ],
          borderWidth: 1,
        },
      ],
    });
  };

  const getGenreChartData = async () => {
    const snapshot = await Firebase.database().ref("/serien").once("value");
    const serien = snapshot.val();
    let genre = new Set();
    serien.forEach((serie) => {
      try {
        serie.genre.genres.forEach((genres) => {
          genre.add(genres);
        });
      } catch (error) {}
    });
    genre.delete("All");
  

    let genreArray = Array.from(genre);

    let dataMap = new Map();

    genreArray.forEach((genre) => {
      dataMap.set(genre, 0);
    });

    serien.forEach((serie) => {
      try {
        serie.genre.genres.forEach((genre) => {
          if (genre !== "All") {
            dataMap.set(genre, dataMap.get(genre) + 1);
          }
        });
      } catch (error) {}
    });
    let dataArray = Array.from(dataMap.values());

    let data = {
      labels: genreArray,
      datasets: [
        {
          label: "Anzahl der Serien",
          data: dataArray,
          backgroundColor: [
            "rgba(255, 99, 132, 0.8)",
            "rgba(54, 162, 235, 0.8)",
            "rgba(255, 206, 86, 0.8)",
            "rgba(75, 192, 192, 0.8)",
            "rgba(153, 102, 255, 0.8)",
            "rgba(255, 159, 64, 0.8)",
            "rgb(255, 255, 255, 0.8)",
            "rgb(0, 155, 0, 0.8)",
            "rgb(153, 0, 76, 0.8)",
            "rgb(204, 0, 0, 0.8)",
            "rgb(128, 255, 0, 0.8)",
            "rgb(104, 12, 242, 0.8)",
            "rgb(255, 250, 0, 0.8)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
            "rgb(255, 255, 255, 1)",
            "rgb(0, 155, 0, 1)",
            "rgb(153, 0, 76, 1)",
            "rgb(204, 0, 0, 1)",
            "rgb(128, 255, 0, 1)",
            "rgb(104, 12, 242, 1)",
            "rgb(255, 250, 0, 1)",
            31,
          ],
          borderWidth: 1,
        },
      ],
    };
    setGenreChartData(data);
  };

  const getGenreChartData2 = async () => {
    const snapshot = await Firebase.database().ref("/serien").once("value");
    const serien = snapshot.val();
    let genre = new Set();
    serien.forEach((serie) => {
      try {
        serie.genre.genres.forEach((genres) => {
          genre.add(genres);
        });
      } catch (error) {}
    });
    genre.delete("All");
   

    let genreArray = Array.from(genre);

    let dataMap = new Map();

    genreArray.forEach((genre) => {
      dataMap.set(genre, { count: 0, rating: 0 });
    });

    serien.forEach((serie) => {
      try {
        serie.genre.genres.forEach((genre) => {
          if (genre !== "All" && getRating(serie) !=="0.00") {
            dataMap.set(genre, {
              count: dataMap.get(genre).count + 1,
              rating:
                Number(dataMap.get(genre).rating) + Number(getRating(serie)),
            });
          }
        });
      } catch (error) {}
    });
    let dataArray = [];
    dataMap.forEach((value, key) => {
      dataArray.push(addZeroes(round(value.rating / value.count, 0.01)));
    });
    setGenreChartData2({
      labels: genreArray,
      datasets: [
        {
          label: "Rating pro Genre",
          data: dataArray,
          backgroundColor: [
            "rgba(255, 99, 132, 0.8)",
            "rgba(54, 162, 235, 0.8)",
            "rgba(255, 206, 86, 0.8)",
            "rgba(75, 192, 192, 0.8)",
            "rgba(153, 102, 255, 0.8)",
            "rgba(255, 159, 64, 0.8)",
            "rgb(255, 255, 255, 0.8)",
            "rgb(0, 155, 0, 0.8)",
            "rgb(153, 0, 76, 0.8)",
            "rgb(204, 0, 0, 0.8)",
            "rgb(128, 255, 0, 0.8)",
            "rgb(104, 12, 242, 0.8)",
            "rgb(255, 250, 0, 0.8)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
            "rgb(255, 255, 255, 1)",
            "rgb(0, 155, 0, 1)",
            "rgb(153, 0, 76, 1)",
            "rgb(204, 0, 0, 1)",
            "rgb(128, 255, 0, 1)",
            "rgb(104, 12, 242, 1)",
            "rgb(255, 250, 0, 1)",
            31,
          ],
          borderWidth: 1,
        },
      ],
    });
  };

  const getRating = (a) => {
    let punktea = 0;
    Object.entries(a["rating"]).forEach(([key, value]) => {
      if (a["genre"]["genres"].includes(key)) {
        punktea += value * 3;
      } else {
        punktea += value;
      }
    });
    punktea /= Object.keys(a["genre"]["genres"]).length;
    punktea /= 3;
    return addZeroes(round(punktea, 0.01));
  };
  const addZeroes = (num) => {
    const dec = num.toString().split(".")[1];
    const len = dec?.length > 2 ? dec.length : 2;
    return Number(num).toFixed(len);
  };

  const round = (value, step = 1.0) => {
    const inv = 1.0 / step;
    return Math.round(value * inv) / inv;
  };

  return (
    <Dialog
      fullWidth={true}
      maxWidth="xll"
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
          Statistiken
        </p>
      </DialogTitle>
      <DialogContent
        id="alert-dialog-description"
        style={{ backgroundColor: "#111" }}
      >
        <div
          style={{
            color: "#fff",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-evenly",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              border: "1px solid #00fed7",
              borderRadius: "30px",
              padding: "50px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "48%",
            }}
          >
            <Doughnut
              data={anbieterChartData}
              options={{
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      color: "#fff",
                      font: {
                        size: 14,
                      },
                    },
                    maintainAspectRatio: true,
                  },
                  title: {
                    display: true,
                    text: "Anzahl der Serien pro Anbieter",
                    color: "#fff",
                    font: {
                      size: 20,
                    },
                  },
                },
                maintainAspectRatio: true,
              }}
            />
          </div>
          <div
            style={{
              border: "1px solid #00fed7",
              borderRadius: "30px",
              padding: "50px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "48%",
            }}
          >
            <Bar
              data={anbieterChartData2}
              options={{
                plugins: {
                  legend: {
                    display: false,
                  },
                  title: {
                    display: true,
                    text: "Durchschnittliche Bewertung pro Anbieter",
                    color: "#fff",
                    font: {
                      size: 20,
                    },
                  },
                },
                maintainAspectRatio: true,
                scales: {
                  y: {
                    ticks: {
                      color: "white",
                    },
                  },
                  x: {
                    ticks: {
                      color: "white",
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        <div
          style={{
            color: "#fff",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-evenly",
          }}
        >
          <div
            style={{
              border: "1px solid #00fed7",
              borderRadius: "30px",
              padding: "50px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "48%",
            }}
          >
            <Doughnut
              data={genreChartData}
              options={{
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      color: "#fff",
                      font: {
                        size: 14,
                      },
                    },
                    maintainAspectRatio: true,
                  },
                  title: {
                    display: true,
                    text: "Anzahl der Serien pro Genre",
                    color: "#fff",
                    font: {
                      size: 20,
                    },
                  },
                },
                maintainAspectRatio: true,
              }}
            />
          </div>
          <div
            style={{
              border: "1px solid #00fed7",
              borderRadius: "30px",
              padding: "50px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "48%",
            }}
          >
            <Bar
              data={genreChartData2}
              options={{
                plugins: {
                  legend: {
                    display: false,
                  },
                  title: {
                    display: true,
                    text: "Durchschnittliche Bewertung pro Genre",
                    color: "#fff",
                    font: {
                      size: 20,
                    },
                  },
                },
                maintainAspectRatio: true,
                scales: {
                  y: {
                    ticks: {
                      color: "white",
                    },
                  },
                  x: {
                    ticks: {
                      color: "white",
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default StatisticsDialog;
