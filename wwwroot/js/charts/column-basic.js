renderColumnChart({
    data: [
      { country: "USA", Corn: 387749, Wheat: 45321 },
      { country: "China", Corn: 280000, Wheat: 140000 },
      { country: "Brazil", Corn: 129000, Wheat: 10000 },
      { country: "EU", Corn: 64300, Wheat: 140500 },
      { country: "Argentina", Corn: 54000, Wheat: 19500 },
      { country: "India", Corn: 34300, Wheat: 113500 }
    ],
    containerId: "#chartCard",
    xField: "country",
    series: ["Corn", "Wheat"],
    title: "Corn vs wheat estimated production for 2023",
    xLabel: "",
    yLabel: "1000 metric tons (MT)",
    yUnit: "(1000 MT)",
    colors: {
      Corn: "#4dabf7",
      Wheat: "#5f3dc4"
    },
    showLabels: false,
    stacked: false
  });
  