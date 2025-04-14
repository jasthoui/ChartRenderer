renderColumnChart({
    data: [
        { team: "Arsenal", "FA Cup": 14, BPL: 3, CL: 0 },
        { team: "Chelsea", "FA Cup": 8, BPL: 5, CL: 2 },
        { team: "Liverpool", "FA Cup": 8, BPL: 1, CL: 6 },
        { team: "Manchester United", "FA Cup": 12, BPL: 13, CL: 3 }
    ],
    containerId: "#chartCard",
    xField: "team",
    series: ["FA Cup", "BPL", "CL"],
    title: "Major trophies for some English teams",
    xLabel: "Teams",
    yLabel: "Count trophies",
    yUnit: "trophies",
    colors: {
        "BPL": "#5CACF7",
        "FA Cup": "#3F3DBF",
        "CL": "#7ED98D"
      },
    showLabels: true,
    stacked: true
  });
  