renderBubbleChart({
  containerId: "#chartCard",
  data: [
    { country: "United States", code: "US", fat: 65.5, sugar: 126.4, group: "North America", obesity: 35.3 },
    { country: "New Zealand", code: "NZ", fat: 64, sugar: 80, group: "Oceania", obesity: 30.8 },
    { country: "Portugal", code: "PT", fat: 63, sugar: 50, group: "Europe", obesity: 28.5 },
    { country: "Hungary", code: "HU", fat: 66, sugar: 50, group: "Europe", obesity: 32.4 },
    { country: "United Kingdom", code: "UK", fat: 70, sugar: 95, group: "Europe", obesity: 27.8 },
    { country: "France", code: "FR", fat: 74, sugar: 75, group: "Europe", obesity: 23.9 },
    { country: "Italy", code: "IT", fat: 69, sugar: 50, group: "Europe", obesity: 19.9 },
    { country: "Norway", code: "NO", fat: 73, sugar: 90, group: "Europe", obesity: 24.8 },
    { country: "Spain", code: "ES", fat: 78, sugar: 75, group: "Europe", obesity: 25.0 },
    { country: "Netherlands", code: "NL", fat: 80, sugar: 105, group: "Europe", obesity: 20.4 },
    { country: "Finland", code: "FI", fat: 80, sugar: 95, group: "Europe", obesity: 22.1 },
    { country: "Russia", code: "RU", fat: 68, sugar: 25, group: "Europe", obesity: 26.4 },
    { country: "Germany", code: "DE", fat: 85, sugar: 105, group: "Europe", obesity: 23.6 },
    { country: "Belgium", code: "BE", fat: 95, sugar: 95, group: "Europe", obesity: 22.1 }
  ],  
  xField: "fat",
  yField: "sugar",
  zField: "obesity",
  countryField: "country",
  labelField: "code",
  colorField: "group",
  title: "Sugar and fat intake per country",
  xLabel: "Daily Fat Intake",
  xUnit: "g",
  yLabel: "Daily Sugar Intake",
  yUnit: "g",
  zUnit: "%",  // Added z unit for obesity values
  colors: {
      "North America": "#9db4e0",  // Soft blue
      "Europe": "#a8e6cf",         // Light green
      "Oceania": "#ffd3b6",        // Light orange
      "Asia": "#ffaaa5",           // Light pink (if you have Asian countries too)
      "Other": "#d5c1e8"           // Soft purple
    },
  referenceLines: [
    { axis: "x", value: 65, label: "Safe fat intake 65g/day" },
    { axis: "y", value: 50, label: "Safe sugar intake 50g/day" }
  ]
});