(() => {
  const runs = ["Run 1", "Run 2", "Run 3", "Run 4", "Run 5"];

  const getTestData = (label) => {
    const off = 0.2 + 0.2 * Math.random();
    return new Array(200).fill(1).map(() => ({
      runCategory: label, // Use label directly as category
      yVal: off + (Math.random() - 0.5) * (Math.random() - 0.5),
      runLabel: label
    }));
  };

  const allData = runs.flatMap(label => getTestData(label));

  renderScatterChart({
    containerId: "#chartCard",
    data: allData,
    xField: "runCategory",       // Now matches the corrected field name
    yField: "yVal",
    categoryField: "runLabel",
    title: "Scatter chart with jitter",
    xLabel: "Run",
    yLabel: "Measurements",
    xUnit: "",
    yUnit: "",
    colors: {
      "Run 1": "rgba(124, 181, 236, 0.5)",
      "Run 2": "rgba(67, 67, 72, 0.5)",
      "Run 3": "rgba(144, 237, 125, 0.5)",
      "Run 4": "rgba(247, 163, 92, 0.5)",
      "Run 5": "rgba(128, 133, 233, 0.5)",
    },
    shapeMap: {
      "Run 1": d3.symbolCircle,
      "Run 2": d3.symbolSquare,
      "Run 3": d3.symbolDiamond,
      "Run 4": d3.symbolTriangle,
      "Run 5": d3.symbolCross,
    },
    enableJitter: true,
    jitterAmount: 5,
    forceCategoricalX: true
  });
})();
