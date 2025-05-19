import { ChartHelpers } from '/js/chartHelpers.js';

export const ChartRenderers = {
  renderLineChart({
    data = [],
    containerId = "",
    title = "",
    xLabel = "",
    yLabel = "",
    yUnit = "",
    xField = "",
    series = [],
    colors = {},
    showLabels = false,
    margins = ChartHelpers.defaultMargins,
    width = 1400,
    height = 900
  }) {
    const dims = ChartHelpers.getDimensions(margins, width, height);
    const svg = ChartHelpers.createSVG(containerId, margins, width, height);

    const xDomain = data.map(d => d[xField]);
    const xScale = d3.scalePoint()
      .domain(xDomain)
      .range([0, dims.width])
      .padding(0.5);

    const maxY = d3.max(data, d => Math.max(...series.map(key => d[key])));
    const yScale = d3.scaleLinear()
      .domain([0, maxY + 5])
      .nice()
      .range([dims.height, 0]);

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0,${dims.height})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg.append("g")
      .attr("class", "y axis")
      .call(d3.axisLeft(yScale).ticks(6))
      .selectAll(".domain")
      .remove();

    svg.append("g")
      .attr("class", "grid")
      .style("opacity", 0.1)
      .call(d3.axisLeft(yScale).ticks(6).tickSize(-dims.width).tickFormat(""))
      .call(g => g.select(".domain").remove());

    const seriesState = series.map(key => ({ key, active: true }));
    
    const lineFns = {};

    series.forEach(key => {
      const line = d3.line()
        .x(d => xScale(d[xField]))
        .y(d => yScale(d[key]))
        .curve(d3.curveMonotoneX);
      lineFns[key] = line;

      svg.append("path")
        .datum(data)
        .attr("class", `line ${key}`)
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", colors[key] || "black")
        .attr("stroke-width", 2)
        .on("mouseover", function () {
          seriesState.forEach(s => {
            if (s.key !== key && s.active) {
              svg.selectAll(`.line.${s.key}`).transition().style("opacity", 0.1);
              svg.selectAll(`circle.${s.key}`).transition().style("opacity", 0.1);
              svg.selectAll(`.label-${s.key}`).transition().style("opacity", 0.1);
            }
          });
        })
        .on("mouseout", function () {
          seriesState.forEach(s => {
            if (s.active) {
              svg.selectAll(`.line.${s.key}`).transition().style("opacity", 1);
              svg.selectAll(`circle.${s.key}`).transition().style("opacity", 1);
              svg.selectAll(`.label-${s.key}`).transition().style("opacity", 1);
            }
          });
        });

      svg.selectAll(`circle.${key}`)
        .data(data)
        .enter().append("circle")
        .attr("class", key)
        .attr("cx", d => xScale(d[xField]))
        .attr("cy", d => yScale(d[key]))
        .attr("r", 4)
        .attr("fill", colors[key] || "black")
        .on("mouseover", function (event, d) {
          d3.select(this).attr("r", 6);
          seriesState.forEach(s => {
            if (s.key !== key && s.active) {
              svg.selectAll(`.line.${s.key}`).transition().style("opacity", 0.1);
              svg.selectAll(`.circle.${s.key}`).transition().style("opacity", 0.1);
              svg.selectAll(`.label-${s.key}`).transition().style("opacity", 0.1);
            }
          });

          ChartHelpers.showTooltip(
            event,
            `<strong>${d[xField]}</strong><br/>
            <span style="color:${colors[key] || "black"}">&#9679;</span> ${key}:<strong> ${d3.format(",")(d[key])} ${yUnit}</strong>`
          );
        })
        .on("mouseout", function () {
          d3.select(this).attr("r", 4);
          seriesState.forEach(s => {
            if (s.active) {
              svg.selectAll(`.line.${s.key}`).transition().style("opacity", 1);
              svg.selectAll(`.circle.${s.key}`).transition().style("opacity", 1);
              svg.selectAll(`.label-${s.key}`).transition().style("opacity", 1);
            }
          });
          
          ChartHelpers.removeTooltip();
        });

      if (showLabels) {
        svg.selectAll(`.label-${key}`)
          .data(data)
          .enter().append("text")
          .attr("class", `data-label label-${key}`)
          .attr("x", d => xScale(d[xField]))
          .attr("y", d => yScale(d[key]) - 10)
          .attr("text-anchor", "middle")
          .style("font-size", "12px")
          .style("fill", colors[key] || "black")
          .text(d => `${d[key]}`);
      }
    });

    const legendSpacing = 20;
    const legendStartY = dims.height / 2 - (series.length * legendSpacing) / 2;
    const legend = svg.selectAll(".legend")
      .data(seriesState)
      .enter().append("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => `translate(0,${legendStartY + i * legendSpacing})`)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        seriesState.forEach(s => {
          if (s.key !== d.key && s.active) {
            svg.selectAll(`.line.${s.key}`).transition().style("opacity", 0.1);
            svg.selectAll(`.circle.${s.key}`).transition().style("opacity", 0.1);
            svg.selectAll(`.label-${s.key}`).transition().style("opacity", 0.1);
          }
        });
      })
      .on("mouseout", function () {
        seriesState.forEach(s => {
          if (s.active) {
            svg.selectAll(`.line.${s.key}`).transition().style("opacity", 1);
            svg.selectAll(`.circle.${s.key}`).transition().style("opacity", 1);
            svg.selectAll(`.label-${s.key}`).transition().style("opacity", 1);
          }
        });
      })
      .on("click", function (event, d) {
        d.active = !d.active;
        d3.select(this).select("text")
          .transition()
          .style("text-decoration", d.active ? "none" : "line-through");
        d3.select(this).select("circle")
          .transition()
          .style("fill-opacity", d.active ? 1 : 0.3);

        const anyActive = seriesState.some(s => s.active);

        if (anyActive) {
          const newMaxY = d3.max(data, row =>
            d3.max(seriesState.filter(s => s.active).map(s => row[s.key]))
          ) || 10;

          yScale.domain([0, newMaxY + 5]).nice();

          const yAxis = svg.select(".y.axis");
          const grid = svg.select(".grid");

          if (yAxis.empty()) {
            svg.append("g")
              .attr("class", "y axis")
              .call(d3.axisLeft(yScale).ticks(6))
              .selectAll(".domain")
              .remove();
          } else {
            yAxis.transition()
              .duration(750)
              .on("start", function() {
                d3.select(this).selectAll(".domain").remove();
              })
              .call(d3.axisLeft(yScale).ticks(6))
              .on("end", function() {
                d3.select(this).selectAll(".domain").remove();
              });
          }

          if (grid.empty()) {
            svg.append("g")
              .attr("class", "grid")
              .style("opacity", 0.1)
              .call(d3.axisLeft(yScale).ticks(6).tickSize(-dims.width).tickFormat(""))
              .call(g => g.select(".domain").remove());
          } else {
            grid.transition()
              .duration(750)
              .on("start", function() {
                d3.select(this).selectAll(".domain").remove();
              })
              .call(d3.axisLeft(yScale)
                .ticks(6)
                .tickSize(-dims.width)
                .tickFormat(""))
              .on("end", function() {
                d3.select(this).selectAll(".domain").remove();
              });
          }

          seriesState.forEach(s => {
            const opacity = s.active ? 1 : 0;
            const display = s.active ? null : "none";
            svg.selectAll(`.line.${s.key}`)
              .transition()
              .duration(750)
              .style("opacity", opacity)
              .attr("display", display)
              .attr("d", lineFns[s.key]);
            svg.selectAll(`circle.${s.key}`)
              .transition()
              .duration(750)
              .style("opacity", opacity)
              .attr("display", display)
              .attr("cy", d => yScale(d[s.key]));
            if (showLabels) {
              svg.selectAll(`.label-${s.key}`)
                .transition()
                .duration(750)
                .style("opacity", opacity)
                .attr("display", display)
                .attr("y", d => yScale(d[s.key]) - 10);
            }
          });
        } else {
          svg.select(".y.axis").style("opacity", 0).remove();
          svg.select(".grid").style("opacity", 0).remove();
          svg.selectAll(".line").style("opacity", 0).attr("display", "none");
          svg.selectAll("circle:not(.legend-circle)").style("opacity", 0).attr("display", "none");
          svg.selectAll(".data-label").style("opacity", 0).attr("display", "none");
        }
      });

    legend.append("circle")
      .attr("class", "legend-circle")
      .attr("cx", dims.width + 26)
      .attr("cy", 6)
      .attr("r", 6)
      .style("fill", d => colors[d.key] || "black");

    legend.append("text")
      .attr("x", dims.width + 40)
      .attr("y", 6)
      .attr("dy", ".35em")
      .text(d => d.key);

    if (title) {
      svg.append("text")
        .attr("x", 0)
        .attr("y", -20)
        .attr("dy", -20)
        .attr("text-anchor", "start")
        .style("font-size", "22px")
        .style("font-weight", "bold")
        .text(title);
    }

    svg.append("text")
      .attr("class", "x label")
      .attr("text-anchor", "middle")
      .attr("x", dims.width / 2)
      .attr("y", dims.height + margins.bottom - 20)
      .style("font-size", "14px")
      .text(xLabel);

    svg.append("text")
      .attr("class", "y label")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -dims.height / 2)
      .attr("y", -margins.left + 30)
      .style("font-size", "14px")
      .text(yLabel);
  }
};
