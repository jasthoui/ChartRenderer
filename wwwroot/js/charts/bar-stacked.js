window.renderBarChart({
    data: [
        {
            month: "January",
            "Conventional vehicles": 12213,
            "Null-emission vehicles": 2106,
            "Motorcycles": 74
          },
          {
            month: "February",
            "Conventional vehicles": 12721,
            "Null-emission vehicles": 2398,
            "Motorcycles": 27
          },
          {
            month: "March",
            "Conventional vehicles": 15242,
            "Null-emission vehicles": 3046,
            "Motorcycles": 52
          },
          {
            month: "April",
            "Conventional vehicles": 16518,
            "Null-emission vehicles": 3195,
            "Motorcycles": 93
          },
          {
            month: "May",
            "Conventional vehicles": 25037,
            "Null-emission vehicles": 4916,
            "Motorcycles": 1272
          }
    ],
    containerId: "#chartCard",
    yField: "month",
    series: ["Conventional vehicles", "Null-emission vehicles", "Motorcycles"],
    colors: {
        "Conventional vehicles": "#74DD82",
        "Null-emission vehicles": "#4433AA",
        "Motorcycles": "#55B6FF"
    },
    title: "Ferry passengers by vehicle type 2024",
    xLabel: "",
    yLabel: "",
    xUnit: "",
    showLabels: true,
    stacked: true
});
