renderColumnChart({
    containerId: "#chartCard",
    data: [
      { month: "Jan", min: -9.5, max: 0.2 },
      { month: "Feb", min: -8.2, max: 3.1 },
      { month: "Mar", min: -13.1, max: 9.2 },
      { month: "Apr", min: -5.2, max: 11.5 },
      { month: "May", min: -1, max: 15.3 },
      { month: "Jun", min: 3.2, max: 19.8 },
      { month: "Jul", min: 10.9, max: 28.4 },
      { month: "Aug", min: 9.5, max: 27 },
      { month: "Sep", min: 6.2, max: 23 },
      { month: "Oct", min: -1.3, max: 19 },
      { month: "Nov", min: -5.2, max: 2.4 },
      { month: "Dec", min: -10.5, max: 0.2 }
    ],
    xField: "month",
    series: ["min", "max"],
    title: "Temperature Variation by Month",
    xLabel: "Month",
    yLabel: "Temperature (°C)",
    yUnit: "°C",
    colors: { min: "lightblue", max: "steelblue" },
    showLabels: true,
  });
  