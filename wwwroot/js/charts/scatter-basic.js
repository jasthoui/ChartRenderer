(() => {
  const sports = ["Basketball", "Volleyball", "Triathlon"];
  const NUM_POINTS = 50;

  const getRandomData = (sport) => {
    let heightRange, weightRange;

    switch (sport) {
      case "Basketball":
        heightRange = [1.85, 2.15];
        weightRange = [85, 125];
        break;
      case "Volleyball":
        heightRange = [1.80, 2.00];
        weightRange = [75, 90];
        break;
      case "Triathlon":
        heightRange = [1.60, 1.76];
        weightRange = [50, 66];
        break;
    }

    return new Array(NUM_POINTS).fill(0).map(() => ({
      height: +(Math.random() * (heightRange[1] - heightRange[0]) + heightRange[0]).toFixed(2),
      weight: +(Math.random() * (weightRange[1] - weightRange[0]) + weightRange[0]).toFixed(1),
      sport: sport
    }));
  };

  const allAthletes = sports.flatMap(sport => getRandomData(sport));

  renderScatterChart({
    containerId: "#chartCard",
    data: allAthletes,
    xField: "height",
    yField: "weight",
    categoryField: "sport",
    title: "Olympics athletes by height and weight (Randomized)",
    xLabel: "Height (m)",
    xUnit: "m",
    yLabel: "Weight (kg)",
    yUnit: "kg",
    colors: {
      Basketball: "#4F8EF7",
      Volleyball: "#F28C6A",
      Triathlon: "#8CD17D"
    },
    shapeMap: {
      Basketball: d3.symbolCircle,
      Volleyball: d3.symbolSquare,
      Triathlon: d3.symbolTriangle
    }
  });
})();
