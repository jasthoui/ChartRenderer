renderColumnChart({
    data: [
        { medal: "Gold", Norway: 200, Germany: 240, "United States": 280, Canada: 150 },
        { medal: "Silver", Norway: 180, Germany: 220, "United States": 250, Canada: 140 },
        { medal: "Bronze", Norway: 160, Germany: 200, "United States": 230, Canada: 120 }, 
    ],
    containerId: "#chartCard",
    title: "Olympic Games all-time medal table, grouped by continent",
    xField: "medal",
    groups: [
        { groupName: "Partners A", series: ["Norway", "Germany"] },
        { groupName: "Partners B", series: ["United States", "Canada"] }
      ],
    colors: {
        Norway: "#4f81bd",
        Germany: "#c0504d",
        "United States": "#9bbb59",
        Canada: "#8064a2"
    },
    xLabel: "",
    yLabel: "Count medals",
    stacked: false,       // <-- set to true for stacked columns
    showLabels: false
  });
  