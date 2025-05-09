renderAreaChart({
    data: [
      { year: 2000, Solar: 0.5, Wind: 2.0 },
      { year: 2001, Solar: 0.8, Wind: 2.2 },
      { year: 2002, Solar: 1.2, Wind: 2.5 },
      { year: 2003, Solar: 1.7, Wind: 2.9 },
      { year: 2004, Solar: 2.5, Wind: 3.2 },
      { year: 2005, Solar: 3.4, Wind: 3.9 },
      { year: 2006, Solar: 4.8, Wind: 4.5 },
      { year: 2007, Solar: 6.0, Wind: 5.3 },
      { year: 2008, Solar: 7.5, Wind: 6.0 },
      { year: 2009, Solar: 9.0, Wind: 6.8 },
      { year: 2010, Solar: 10.5, Wind: 7.6 },
      { year: 2011, Solar: 12.0, Wind: 8.5 },
      { year: 2012, Solar: 13.5, Wind: 9.4 },
      { year: 2013, Solar: 15.0, Wind: 10.2 },
      { year: 2014, Solar: 16.5, Wind: 11.0 },
      { year: 2015, Solar: 18.0, Wind: 12.0 },
      { year: 2016, Solar: 19.5, Wind: 13.0 },
      { year: 2017, Solar: 21.0, Wind: 14.0 },
      { year: 2018, Solar: 22.5, Wind: 15.0 },
      { year: 2019, Solar: 24.0, Wind: 16.0 },
      { year: 2020, Solar: 25.5, Wind: 17.0 }
    ],
    containerId: "#chartCard",
    title: "Solar and Wind Energy Production (Inverted Axes)",
    xField: "year",
    yLabel: "",
    xLabel: "Energy Production (GW)",
    yUnit: "GW",
    series: ["Solar", "Wind"],
    colors: {
      Solar: "#f39c12",
      Wind: "#3498db"
    },
    showLabels: false,
    stacked: false,
    inverted: true
  });
  