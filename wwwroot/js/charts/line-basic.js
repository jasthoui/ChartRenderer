renderLineChart({
    data: [
        { race: "Bahrain GP", date: new Date(2024, 3, 2), Leclerc: 12, Sainz: 15 },
        { race: "Saudi GP", date: new Date(2024, 3, 2), Leclerc: 16, Sainz: 0 },
        { race: "Australia GP", date: new Date(2024, 3, 24), Leclerc: 19, Sainz: 25 },
        { race: "Japan GP", date: new Date(2024, 4, 7), Leclerc: 12, Sainz: 15 },
        { race: "China GP", date: new Date(2024, 4, 21), Leclerc: 17, Sainz: 14 },
        { race: "Miami GP", date: new Date(2024, 5, 5), Leclerc: 22, Sainz: 14 },
        { race: "Emilia-Romagna GP", date: new Date(2024, 5, 19), Leclerc: 15, Sainz: 10 },
        { race: "Monaco GP", date: new Date(2024, 5, 26), Leclerc: 25, Sainz: 15 },
        { race: "Canada GP", date: new Date(2024, 6, 9), Leclerc: 0, Sainz: 0 },
        { race: "Spain GP", date: new Date(2024, 6, 23), Leclerc: 10, Sainz: 8 },
        { race: "Austria GP", date: new Date(2024, 6, 30), Leclerc: 2, Sainz: 19 },
        { race: "Great Britain GP", date: new Date(2024, 7, 7), Leclerc: 0, Sainz: 11 },
        { race: "Hungary GP", date: new Date(2024, 7, 21), Leclerc: 12, Sainz: 8 },
        { race: "Belgium GP", date: new Date(2024, 7, 28), Leclerc: 15, Sainz: 8 },
        { race: "Netherlands GP", date: new Date(2024, 8, 25), Leclerc: 15, Sainz: 10 },
        { race: "Italy GP", date: new Date(2024, 9, 1), Leclerc: 25, Sainz: 12 },
        { race: "Azerbaijan GP", date: new Date(2024, 9, 15), Leclerc: 18, Sainz: 0 },
        { race: "Singapore GP", date: new Date(2024, 9, 22), Leclerc: 10, Sainz: 6 },
        { race: "United States GP", date: new Date(2024, 10, 20), Leclerc: 30, Sainz: 25 },
        { race: "Mexico GP", date: new Date(2024, 10, 27), Leclerc: 16, Sainz: 25 },
        { race: "Brazil GP", date: new Date(2024, 11, 3), Leclerc: 16, Sainz: 4 },
        { race: "Las Vegas GP", date: new Date(2024, 11, 23), Leclerc: 12, Sainz: 15 },
        { race: "Qatar GP", date: new Date(2024, 12, 1), Leclerc: 22, Sainz: 13 },
        { race: "Abu Dhabi GP", date: new Date(2024, 12, 8), Leclerc: 15, Sainz: 18 }
    ],
    containerId: "#chartCard",
    title: "F1 Points Accumulation: Leclerc vs. Sainz",
    xField: "race",
    xLabel: "Race",
    yLabel: "Points",
    yUnit: " pts",
    series: ["Leclerc", "Sainz"],
    colors: {
        Leclerc: "#fa4b42",
        Sainz: "#2caffe",
    },
    showLabels: false
});