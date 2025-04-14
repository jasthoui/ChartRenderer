renderPieChart({
    data: [
      { label: "ITQ", value: 3 },
      { label: "Data Scientist", value: 6 },
      { label: "Software Development", value: 7 },
      { label: "Data Analyst", value: 2 },
      { label: "Prompt Engineer", value: 1 }
    ],
    containerId: "#chartCard",
    title: "Open iT Internship Roles (2025)",
    colorPalette: ["#2caffe", "#544fc5", "#00e272", "#fe6a35", "#d568fb"],
    innerRadiusRatio: 0.75,
    showCenterTotal: true,
    isSemiCircle: false
  });
  