renderColumnChart({
    data: [
      { country: "USA", Corn: 385, Wheat: 47 },
      { country: "China", Corn: 275, Wheat: 137 },
      { country: "Brazil", Corn: 125, Wheat: 10 },
      { country: "EU", Corn: 60, Wheat: 138 },
      { country: "Argentina", Corn: 52, Wheat: 20 },
      { country: "India", Corn: 32, Wheat: 112 }
    ],
    containerId: "#chartCard",
    xField: "country",
    series: ["Corn", "Wheat"],
    title: "Corn vs wheat estimated production for 2023",
    xLabel: "",
    yLabel: "1000 metric tons (MT)",
    yUnit: "k",
    colors: {
      Corn: "#4dabf7",
      Wheat: "#5f3dc4"
    },
    showLabels: false,
    stacked: false
  });
  