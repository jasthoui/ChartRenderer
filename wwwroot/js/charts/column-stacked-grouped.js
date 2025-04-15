renderColumnChart({
  data: [
    { medal: "Gold",      Norway: 200, Germany: 240, "United States": 280, Canada: 150 },
    { medal: "Silver",    Norway: 180, Germany: 220, "United States": 250, Canada: 140 },
    { medal: "Bronze",    Norway: 160, Germany: 200, "United States": 230, Canada: 120 },
  ],
  containerId: "#chartCard",
  title: "Olympic Games all-time medal table, grouped by continent",
  xField: "medal",
  
  // Two groups, each with two series stacked.
  // The array order => bottom to top.
  groups: [
    { groupName: "Partners A", series: ["Germany", "Norway"] },
    { groupName: "Partners B", series: ["Canada", "United States"] }
  ],
  
  // Colors by series
  colors: {
    Germany: "#c0504d",       // purple (bottom of left bar)
    Norway: "#4f81bd",        // blue   (top of left bar)
    Canada: "#8064a2",        // orange (bottom of right bar)
    "United States": "#9bbb59" // green (top of right bar)
  },
  
  xLabel: "",
  yLabel: "Count medals",
  
  // IMPORTANT: This ensures the series for each group are stacked vertically.
  stacked: true,
  
  showLabels: false
});
