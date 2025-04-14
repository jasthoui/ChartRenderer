window.renderBarChart({
  data: [
      { region: "Africa", "Year 1990": 632, "Year 2000": 814, "Year 2021": 1393 },
      { region: "America", "Year 1990": 727, "Year 2000": 841, "Year 2021": 1031 },
      { region: "Asia",    "Year 1990": 3202, "Year 2000": 3714, "Year 2021": 4695 },
      { region: "Europe",  "Year 1990": 721,  "Year 2000": 726,  "Year 2021": 745  }
  ],
  containerId: "#chartCard",
  title: "Population by Region",
  yField: "region",
  series: ["Year 1990", "Year 2000", "Year 2021"],
  colors: {
    "Year 1990": "#2b908f",
    "Year 2000": "#90ee7e",
    "Year 2021": "#f45b5b"
  },
  xLabel: "Population",
  yLabel: "",
  xUnit: "millions", 
  showLabels: true,
  stacked: false
});