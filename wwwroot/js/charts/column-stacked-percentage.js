renderColumnChart({
    data: [
        { year: "2021", Apples: 30, Oranges: 20, Bananas: 10 },
        { year: "2022", Apples: 50, Oranges: 25, Bananas: 25 },
        { year: "2023", Apples: 20, Oranges: 40, Bananas: 40 },
    ],
    containerId: "#chartCard", // Make sure this div exists in your HTML
    xField: "year",
    yField: "", // not used in percentage mode
    series: ["Apples", "Oranges", "Bananas"],
    stacked: true,
    percentage: true, // ← ENABLE PERCENTAGE MODE
    colors: {
      Apples: "#ff4d4f",
      Oranges: "#ffa940",
      Bananas: "#ffec3d"
    },
    title: "Fruit Sales Share by Year",
    xLabel: "",
    yLabel: "Percentage"
  });
  