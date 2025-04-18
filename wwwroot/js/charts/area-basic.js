renderAreaChart({
    data: (function() {
      const startYear = 1940;
      const endYear = 2024;
      const numYears = endYear - startYear + 1;
      const usaSeries = [
        null, null, null, null, null, 2, 9, 13, 50, 170, 299, 438, 841,
        1169, 1703, 2422, 3692, 5543, 7345, 12298, 18638, 22229, 25540,
        28133, 29463, 31139, 31175, 31255, 29561, 27552, 26008, 25830,
        26516, 27835, 28537, 27519, 25914, 25542, 24418, 24138, 24104,
        23208, 22886, 23305, 23459, 23368, 23317, 23575, 23205, 22217,
        21392, 19008, 13708, 11511, 10979, 10904, 11011, 10903, 10732,
        10685, 10577, 10526, 10457, 10027, 8570, 8360, 7853, 5709, 5273,
        5113, 5066, 4897, 4881, 4804, 4717, 4571, 4018, 3822, 3785, 3805,
        3750, 3708, 3708, 3708, 3708
      ];
      const ussrSeries = [
        null, null, null, null, null, null, null, null, null,
        1, 5, 25, 50, 120, 150, 200, 426, 660, 863, 1048, 1627, 2492,
        3346, 4259, 5242, 6144, 7091, 8400, 9490, 10671, 11736, 13279,
        14600, 15878, 17286, 19235, 22165, 24281, 26169, 28258, 30665,
        32146, 33486, 35130, 36825, 38582, 40159, 38107, 36538, 35078,
        32980, 29154, 26734, 24403, 21339, 18179, 15942, 15442, 14368,
        13188, 12188, 11152, 10114, 9076, 8038, 7000, 6643, 6286, 5929,
        5527, 5215, 4858, 4750, 4650, 4600, 4500, 4490, 4300, 4350, 4330,
        4310, 4495, 4477, 4489, 4380
      ];
      const years = Array.from({ length: numYears }, (_, i) => startYear + i);
      return years.map((year, index) => ({
        year: year,
        USA: usaSeries[index],
        USSR: ussrSeries[index]
      }));
    })(),
    containerId: "#chartCard",
    title: "US and USSR Nuclear Stockpiles",
    xField: "year",
    yLabel: "Warheads",
    xLabel: "",
    yUnit: " warheads",
    series: ["USA", "USSR"],
    colors: {
      USA: "#2caffe",
      USSR: "#544fc5"
    },
    showLabels: false,
    stacked: false,
    inverted: false
});
  