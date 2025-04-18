renderAreaChart({
    data: [
      { year: 2015, solar: 30, wind: 45, hydro: 80, nuclear: 70, coal: 200, gas: 150 },
      { year: 2016, solar: 40, wind: 50, hydro: 82, nuclear: 72, coal: 190, gas: 155 },
      { year: 2017, solar: 55, wind: 60, hydro: 85, nuclear: 74, coal: 180, gas: 160 },
      { year: 2018, solar: 70, wind: 80, hydro: 87, nuclear: 76, coal: 170, gas: 165 },
      { year: 2019, solar: 90, wind: 100, hydro: 88, nuclear: 78, coal: 160, gas: 170 },
      { year: 2020, solar: 120, wind: 130, hydro: 90, nuclear: 80, coal: 150, gas: 175 },
      { year: 2021, solar: 150, wind: 160, hydro: 92, nuclear: 82, coal: 140, gas: 180 },
      { year: 2022, solar: 180, wind: 180, hydro: 95, nuclear: 84, coal: 130, gas: 185 },
      { year: 2023, solar: 210, wind: 200, hydro: 97, nuclear: 86, coal: 120, gas: 190 },
      { year: 2024, solar: 250, wind: 220, hydro: 100, nuclear: 88, coal: 110, gas: 195 }
    ],
    containerId: "#chartCard",
    title: "Energy Production by Source (2015-2024)",
    xField: "year",
    yLabel: "Energy Production (in TWh)",
    xLabel: "",
    yUnit: "TWh",
    series: ["solar", "wind", "hydro", "nuclear", "coal", "gas"],
    colors: {
      solar: "#f39c12",
      wind: "#3498db",
      hydro: "#1abc9c",
      nuclear: "#9b59b6",
      coal: "#2c3e50",
      gas: "#e74c3c"
    },
    showLabels: false,
    stacked: true,
    inverted: false
  });
  