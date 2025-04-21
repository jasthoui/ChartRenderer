/**
 * ChartHelpers: Contains shared methods for dimension calculations,
 * SVG container creation, and tooltip handling.
 */
const ChartHelpers = {
  defaultMargins: { top: 60, right: 120, bottom: 115, left: 75 },

  getDimensions(margins, width = 1400, height = 900) {
    const { top, right, bottom, left } = margins;
    return {
      width: width - left - right,
      height: height - top - bottom,
      totalWidth: width,
      totalHeight: height
    };
  },

  createSVG(containerId, margins, width = 1400, height = 900) {
    d3.select(containerId).select("svg").remove();
    const dims = this.getDimensions(margins, width, height);
    return d3.select(containerId)
      .append("div")
      .style("display", "flex")
      .style("justify-content", "center")
      .append("svg")
      .attr("width", dims.totalWidth)
      .attr("height", dims.totalHeight)
      .append("g")
      .attr("transform", `translate(${margins.left},${margins.top})`);
  },

  createTooltip() {
    return d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("z-index", 1000)
      .style("background", "#f9f9f9")
      .style("padding", "5px")
      .style("border", "1px solid #d3d3d3")
      .style("border-radius", "5px")
      .style("pointer-events", "none")
      .style("opacity", 0.9);
  },

  removeTooltip() {
    d3.select("body").select(".tooltip").remove();
  },

  showTooltip(event, html) {
    this.removeTooltip();
    this.createTooltip()
      .html(html)
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 28) + "px");
  }
};

/**
 * ChartRenderers: A modular collection of chart‐rendering functions.
 * Each renderer accepts an options object and uses ChartHelpers for common tasks.
 */
const ChartRenderers = {
  renderLineChart({
    containerId,
    data,
    title = "",
    xField,
    yLabel = "",
    xLabel = "",
    yUnit = "",
    series = [],
    colors = {},
    showLabels = false,
    margins = ChartHelpers.defaultMargins,
    width = 1400,
    height = 900
  }) {
    const dims = ChartHelpers.getDimensions(margins, width, height);
    const svg = ChartHelpers.createSVG(containerId, margins, width, height);
  
    // Create scales
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
  
    // Axes
    // x-axis remains unchanged
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0,${dims.height})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");
  
    // Create y-axis and remove the domain line immediately
    svg.append("g")
      .attr("class", "y axis")
      .call(d3.axisLeft(yScale).ticks(6))
      .selectAll(".domain")
      .remove();
  
    // Create initial grid lines (grid code unchanged)
    svg.append("g")
      .attr("class", "grid")
      .style("opacity", 0.1)
      .call(d3.axisLeft(yScale).ticks(6).tickSize(-dims.width).tickFormat(""))
      .call(g => g.select(".domain").remove());
  
    const seriesState = series.map(key => ({ key, active: true }));
    const lineFns = {};
  
    // Create lines, circles, labels, and interaction handlers...
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
  
    // Title and axis labels (unchanged)
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
  
    // Legend handling with y-axis update:
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
        // Toggle active state of the clicked series
        d.active = !d.active;
        d3.select(this).select("text")
          .transition()
          .style("text-decoration", d.active ? "none" : "line-through");
        d3.select(this).select("circle")
          .transition()
          .style("fill-opacity", d.active ? 1 : 0.3);

        const anyActive = seriesState.some(s => s.active);

        if (anyActive) {
          // Calculate new maximum for y-scale based on active series only
          const newMaxY = d3.max(data, row =>
            d3.max(seriesState.filter(s => s.active).map(s => row[s.key]))
          ) || 10;

          // Update the y-scale domain
          yScale.domain([0, newMaxY + 5]).nice();

          // Re-add or update the y-axis:
          if (svg.select(".y.axis").empty()) {
            svg.append("g")
              .attr("class", "y axis")
              .call(d3.axisLeft(yScale).ticks(6))
              .selectAll(".domain")
              .remove();
          } else {
            svg.select(".y.axis")
              .transition()
              .duration(750)
              .on("start", function() {
                d3.select(this).selectAll(".domain").remove();
              })
              .call(d3.axisLeft(yScale).ticks(6))
              .on("end", function() {
                d3.select(this).selectAll(".domain").remove();
              });
          }

          // Re-add or update the grid:
          if (svg.select(".grid").empty()) {
            svg.append("g")
              .attr("class", "grid")
              .style("opacity", 0.1)
              .call(d3.axisLeft(yScale).ticks(6).tickSize(-dims.width).tickFormat(""))
              .call(g => g.select(".domain").remove());
          } else {
            svg.select(".grid").transition()
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

          // Update series elements (lines, circles, labels)
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
          // No series is active

          // Remove the y-axis and grid with a transition:
          svg.select(".y.axis")
            .style("opacity", 0)
            .remove();

          svg.select(".grid")
            .style("opacity", 0)
            .remove();

          // Hide the series elements
          svg.selectAll(".line")
            .style("opacity", 0)
            .attr("display", "none");
          svg.selectAll("circle:not(.legend-circle)")
            .style("opacity", 0)
            .attr("display", "none");
          svg.selectAll(".data-label")
            .style("opacity", 0)
            .attr("display", "none");
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

  },

    renderAreaChart({
    containerId,
    data,
    title = "",
    xField,
    yLabel = "",
    xLabel = "",
    yUnit = "",
    series = [],
    colors = {},
    showLabels = false,
    stacked = false,
    inverted = false,
    margins = { top: 60, right: 40, bottom: 115, left: 90 },
    width = 1400,
    height = 900
  }) {
    const safeClassName = name => name.replace(/\s+/g, '-');
    const dims = ChartHelpers.getDimensions(margins, width - 50, height);
    const svg = ChartHelpers.createSVG(containerId, margins, width, height);
    const seriesState = series.map(key => ({ key, active: true }));
    const activeKeysInit = seriesState.filter(s => s.active).map(s => s.key);
    const xExtent = d3.extent(data, d => d[xField]);

    let xScale, yScale;
    if (!inverted) {
      xScale = d3.scaleLinear().domain(xExtent).nice().range([0, dims.width]);
      const maxY = !stacked
        ? d3.max(data, d => d3.max(activeKeysInit, key => d[key] || 0))
        : d3.max(d3.stack().keys(activeKeysInit)(data).pop(), d => d[1]);
      yScale = d3.scaleLinear().domain([0, maxY + 5]).nice().range([dims.height, 0]);
    } else {
      const maxY = !stacked
        ? d3.max(data, d => d3.max(activeKeysInit, key => d[key] || 0))
        : d3.max(d3.stack().keys(activeKeysInit)(data).pop(), d => d[1]);
      xScale = d3.scaleLinear().domain([0, maxY + 5]).range([0, dims.width]);
      yScale = d3.scaleLinear().domain([xExtent[1], xExtent[0]]).range([dims.height, 0]);
    }

    const xAxis = !inverted
      ? d3.axisBottom(xScale).ticks(8).tickFormat(d3.format("d"))
      : d3.axisBottom(xScale).ticks(8).tickFormat(d3.format("d"));

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", !inverted ? `translate(0,${dims.height})` : `translate(0,${dims.height})`)
      .call(xAxis)
      .call(g => g.select(".domain").remove());

    const yAxis = !inverted
      ? d3.axisLeft(yScale).ticks(8).tickFormat(d3.format("d"))
      : d3.axisLeft(yScale).ticks(8).tickFormat(d3.format("d"));

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .call(g => g.select(".domain").remove());

    svg.append("g")
      .attr("class", "grid")
      .style("opacity", 0.1)
      .call(
        !inverted
          ? d3.axisLeft(yScale).ticks(8).tickSize(-dims.width).tickFormat("")
          : d3.axisBottom(xScale).ticks(8).tickSize(dims.height).tickFormat("")
      )
      .call(g => g.select(".domain").remove());

    function showTooltip(event, html) { ChartHelpers.showTooltip(event, html); }
    function removeTooltip() { ChartHelpers.removeTooltip(); }

    function drawAreas() {
      svg.selectAll(".area-group").remove();
      svg.selectAll(".circle-group").remove();
      const areaGroup = svg.append("g").attr("class", "area-group");
      const activeKeys = seriesState.filter(s => s.active).map(s => s.key);

      if (!inverted) {
        if (!stacked) {
          activeKeys.forEach(key => {
            const safeKey = safeClassName(key);
            const areaGen = d3.area()
              .defined(d => d[key] != null)
              .x(d => xScale(d[xField]))
              .y0(yScale(0))
              .y1(d => yScale(d[key]))
              .curve(d3.curveMonotoneX);
            areaGroup.append("path")
              .datum(data)
              .attr("class", `area ${safeKey}`)
              .attr("fill", colors[key] || "black")
              .attr("fill-opacity", 0.6)
              .attr("stroke", colors[key] || "black")
              .attr("stroke-width", 2)
              .attr("d", areaGen);
          });
        } else {
          const stackGen = d3.stack().keys(activeKeys);
          const stackedData = stackGen(data);
          areaGroup.selectAll(".area-layer")
            .data(stackedData)
            .enter()
            .append("path")
            .attr("class", d => `area ${safeClassName(d.key)}`)
            .attr("fill", d => colors[d.key] || "black")
            .attr("fill-opacity", 0.6)
            .attr("stroke", d => colors[d.key] || "black")
            .attr("stroke-width", 2)
            .attr("d", d3.area()
              .x(d => xScale(d.data[xField]))
              .y0(d => yScale(d[0]))
              .y1(d => yScale(d[1]))
              .curve(d3.curveMonotoneX));
          const circleGroup = svg.append("g").attr("class", "circle-group");
          stackedData.forEach(layer => {
            const safeKey = safeClassName(layer.key);
            circleGroup.selectAll(`.circle-${safeKey}`)
              .data(layer)
              .enter()
              .append("circle")
              .attr("class", `circle-${safeKey}`)
              .attr("cx", d => xScale(d.data[xField]))
              .attr("cy", d => yScale(d[1]))
              .attr("r", 4)
              .attr("fill", colors[layer.key] || "black")
              .attr("stroke", "#fff")
              .attr("stroke-width", 1);
          });
        }
      } else {
        if (!stacked) {
          activeKeys.forEach(key => {
            const safeKey = safeClassName(key);
            const areaGen = d3.area()
              .defined(d => d[key] != null)
              .y(d => yScale(d[xField]))
              .x0(xScale(0))
              .x1(d => xScale(d[key]))
              .curve(d3.curveMonotoneX);
            areaGroup.append("path")
              .datum(data)
              .attr("class", `area ${safeKey}`)
              .attr("fill", colors[key] || "black")
              .attr("fill-opacity", 0.6)
              .attr("stroke", colors[key] || "black")
              .attr("stroke-width", 2)
              .attr("d", areaGen);
          });
          const circleGroup = svg.append("g").attr("class", "circle-group");
          activeKeys.forEach(key => {
            const safeKey = safeClassName(key);
            circleGroup.selectAll(`.circle-${safeKey}`)
              .data(data)
              .enter()
              .append("circle")
              .attr("class", `circle-${safeKey}`)
              .attr("cx", d => xScale(d[key]))
              .attr("cy", d => yScale(d[xField]))
              .attr("r", 4)
              .attr("fill", colors[key] || "black")
              .attr("stroke", "#fff")
              .attr("stroke-width", 1);
          });
        } else {
          const stackGen = d3.stack().keys(activeKeys);
          const stackedData = stackGen(data);
          areaGroup.selectAll(".area-layer")
            .data(stackedData)
            .enter()
            .append("path")
            .attr("class", d => `area ${safeClassName(d.key)}`)
            .attr("fill", d => colors[d.key] || "black")
            .attr("fill-opacity", 0.6)
            .attr("stroke", d => colors[d.key] || "black")
            .attr("stroke-width", 2)
            .attr("d", d3.area()
              .y(d => yScale(d[xField]))
              .x0(d => xScale(d[0]))
              .x1(d => xScale(d[1]))
              .curve(d3.curveMonotoneX));
          const circleGroup = svg.append("g").attr("class", "circle-group");
          stackedData.forEach(layer => {
            const safeKey = safeClassName(layer.key);
            circleGroup.selectAll(`.circle-${safeKey}`)
              .data(layer)
              .enter()
              .append("circle")
              .attr("class", `circle-${safeKey}`)
              .attr("cx", d => xScale(d[1]))
              .attr("cy", d => yScale(d.data[xField]))
              .attr("r", 4)
              .attr("fill", colors[layer.key] || "black")
              .attr("stroke", "#fff")
              .attr("stroke-width", 1);
          });
        }
      }
    }

    drawAreas();

    if (!inverted) {
      if (!stacked) {
        const hoverCircle = svg.append("circle")
          .attr("class", "hover-circle")
          .attr("r", 6)
          .style("pointer-events", "none")
          .style("opacity", 0);
        svg.append("rect")
          .attr("class", "overlay")
          .attr("width", dims.width)
          .attr("height", dims.height)
          .style("fill", "none")
          .style("pointer-events", "all")
          .on("mousemove", mousemove)
          .on("mouseout", mouseout);
        function mousemove(event) {
          removeTooltip();
          const [mouseX, mouseY] = d3.pointer(event);
          const xValue = xScale.invert(mouseX);
          const bisect = d3.bisector(d => d[xField]).left;
          let idx = bisect(data, xValue);
          let d0 = data[idx - 1];
          let d1 = data[idx];
          if (!d0 && d1) d0 = d1;
          if (!d1 && d0) d1 = d0;
          let dPoint = d0;
          if (d1 && Math.abs(xValue - d0[xField]) > Math.abs(d1[xField] - xValue)) {
            dPoint = d1;
          }
          if (!dPoint) return;
          let chosenSeries = null;
          let minDistance = Infinity;
          const activeKeys = seriesState.filter(s => s.active).map(s => s.key);
          activeKeys.forEach(key => {
            if (dPoint && dPoint[key] != null) {
              const yCoord = yScale(dPoint[key]);
              const distance = Math.abs(mouseY - yCoord);
              if (distance < minDistance) {
                minDistance = distance;
                chosenSeries = key;
              }
            }
          });
          if (chosenSeries) {
            hoverCircle
              .attr("cx", xScale(dPoint[xField]))
              .attr("cy", yScale(dPoint[chosenSeries]))
              .attr("fill", colors[chosenSeries] || "black")
              .style("opacity", 1);
            const tooltipHtml = `<strong>${dPoint[xField]}</strong><br/>
                <span style="color:${colors[chosenSeries] || "black"}">&#9679;</span> ${chosenSeries}: <strong>${d3.format(",")(dPoint[chosenSeries])} ${yUnit}</strong>`;
            showTooltip(event, tooltipHtml);
            series.forEach(key => {
              const safeKey = safeClassName(key);
              const areaSel = svg.selectAll(`.area.${safeKey}`);
              if (key !== chosenSeries) {
                areaSel.transition().style("opacity", 0.1);
              } else {
                areaSel.transition().style("opacity", 1)
                  .attr("stroke-width", 4)
                  .attr("fill-opacity", 0.8);
              }
            });
          } else {
            hoverCircle.style("opacity", 0);
          }
        }
        function mouseout() {
          removeTooltip();
          hoverCircle.style("opacity", 0);
          series.forEach(key => {
            const safeKey = safeClassName(key);
            svg.selectAll(`.area.${safeKey}`)
              .transition()
              .style("opacity", 1)
              .attr("stroke-width", 2)
              .attr("fill-opacity", 0.6);
          });
        }
      } else {
        svg.append("rect")
          .attr("class", "overlay")
          .attr("width", dims.width)
          .attr("height", dims.height)
          .style("fill", "none")
          .style("pointer-events", "all")
          .on("mousemove", mousemoveStacked)
          .on("mouseout", mouseoutStacked);
          function mousemoveStacked(event) {
            removeTooltip();
            const [mouseX] = d3.pointer(event, this);
            const xValue = xScale.invert(mouseX);
            const bisect = d3.bisector(d => d[xField]).left;
            let idx = bisect(data, xValue);
            let d0 = data[idx - 1];
            let d1 = data[idx];
            if (!d0 && d1) d0 = d1;
            if (!d1 && d0) d1 = d0;
            let dPoint = d0;
            if (d1 && Math.abs(xValue - d0[xField]) > Math.abs(d1[xField] - xValue)) {
              dPoint = d1;
            }
            if (!dPoint) return;
            const activeKeys = seriesState.filter(s => s.active).map(s => s.key);
          
            let tooltipHtml = `<strong>${dPoint[xField]}</strong>`;
            activeKeys.forEach(key => {
              tooltipHtml += `<br/>
                <span style="color:${colors[key] || "black"}">&#9679;</span> ${key}: 
                <strong>${d3.format(",")(dPoint[key])} ${yUnit}</strong>`;
            });            
            showTooltip(event, tooltipHtml);
          
            const circleSize = 6;
            svg.selectAll(".circle-group circle").attr("r", d =>
              d.data[xField] === dPoint[xField] ? circleSize : 4
            );
          }
          
        function mouseoutStacked() {
          removeTooltip();
          svg.selectAll(".circle-group circle").attr("r", 4);
        }
      }
    } else {
      if (!stacked) {
        const hoverCircle = svg.append("circle")
          .attr("class", "hover-circle")
          .attr("r", 6)
          .style("pointer-events", "none")
          .style("opacity", 0);
        svg.append("rect")
          .attr("class", "overlay")
          .attr("width", dims.width)
          .attr("height", dims.height)
          .style("fill", "none")
          .style("pointer-events", "all")
          .on("mousemove", mousemoveInverted)
          .on("mouseout", mouseoutInverted);
        function mousemoveInverted(event) {
          removeTooltip();
          const [mouseX, mouseY] = d3.pointer(event);
          const yValue = yScale.invert(mouseY);
          const bisect = d3.bisector(d => d[xField]).left;
          let idx = bisect(data, yValue);
          let d0 = data[idx - 1];
          let d1 = data[idx];
          if (!d0 && d1) d0 = d1;
          if (!d1 && d0) d1 = d0;
          let dPoint = d0;
          if (d1 && Math.abs(yValue - d0[xField]) > Math.abs(d1[xField] - yValue)) {
            dPoint = d1;
          }
          if (!dPoint) return;
          let chosenSeries = null;
          let minDistance = Infinity;
          const activeKeys = seriesState.filter(s => s.active).map(s => s.key);
          activeKeys.forEach(key => {
            if (dPoint && dPoint[key] != null) {
              const xCoord = xScale(dPoint[key]);
              const distance = Math.abs(mouseX - xCoord);
              if (distance < minDistance) {
                minDistance = distance;
                chosenSeries = key;
              }
            }
          });
          if (chosenSeries) {
            hoverCircle
              .attr("cx", xScale(dPoint[chosenSeries]))
              .attr("cy", yScale(dPoint[xField]))
              .attr("fill", colors[chosenSeries] || "black")
              .style("opacity", 1);
            const tooltipHtml = `<strong>${dPoint[xField]}</strong><br/>
                <span style="color:${colors[chosenSeries] || "black"}">&#9679;</span> ${chosenSeries}: <strong>${d3.format(",")(dPoint[chosenSeries])} ${yUnit}</strong>`;
            showTooltip(event, tooltipHtml);
            series.forEach(key => {
              const safeKey = safeClassName(key);
              const areaSel = svg.selectAll(`.area.${safeKey}`);
              const circleSel = svg.selectAll(`.circle-${safeKey}`);
              if (key !== chosenSeries) {
                areaSel.transition().style("opacity", 0.1);
                circleSel.transition().style("opacity", 0.1);
              } else {
                areaSel.transition().style("opacity", 1)
                  .attr("stroke-width", 4)
                  .attr("fill-opacity", 0.8);
                circleSel.transition().style("opacity", 1);
              }
            });
          } else {
            hoverCircle.style("opacity", 0);
          }
        }
        function mouseoutInverted() {
          removeTooltip();
          svg.select(".hover-circle").style("opacity", 0);
          series.forEach(key => {
            const safeKey = safeClassName(key);
            svg.selectAll(`.area.${safeKey}`)
              .transition()
              .style("opacity", 1)
              .attr("stroke-width", 2)
              .attr("fill-opacity", 0.6);
            svg.selectAll(`.circle-${safeKey}`).transition().style("opacity", 1);
          });
        }
      } else {
        svg.append("rect")
          .attr("class", "overlay")
          .attr("width", dims.width)
          .attr("height", dims.height)
          .style("fill", "none")
          .style("pointer-events", "all")
          .on("mousemove", mousemoveStackedInverted)
          .on("mouseout", mouseoutStackedInverted);
        function mousemoveStackedInverted(event) {
          removeTooltip();
          const [mouseX, mouseY] = d3.pointer(event, this);
          const yValue = yScale.invert(mouseY);
          const bisect = d3.bisector(d => d[xField]).left;
          let idx = bisect(data, yValue);
          let d0 = data[idx - 1];
          let d1 = data[idx];
          if (!d0 && d1) d0 = d1;
          if (!d1 && d0) d1 = d0;
          let dPoint = d0;
          if (d1 && Math.abs(yValue - d0[xField]) > Math.abs(d1[xField] - yValue)) {
            dPoint = d1;
          }
          if (!dPoint) return;
          const activeKeys = seriesState.filter(s => s.active).map(s => s.key);
          let tooltipHtml = `<strong>${dPoint[xField]}</strong>`;
          activeKeys.forEach(key => {
            tooltipHtml += `<br/>
                <span style="color:${colors[key] || "black"}">&#9679;</span> ${key}: 
                <strong>${d3.format(",")(dPoint[key])} ${yUnit}</strong>`;
          });          
          showTooltip(event, tooltipHtml);
          const circleSize = 6;
          svg.selectAll(".circle-group circle").attr("r", d =>
            d.data[xField] === dPoint[xField] ? circleSize : 4
          );
        }
        function mouseoutStackedInverted() {
          removeTooltip();
          svg.selectAll(".circle-group circle").attr("r", 4);
        }
      }
    }

    if (showLabels && !stacked) {
      series.forEach(key => {
        const safeKey = safeClassName(key);
        svg.selectAll(`.label-${safeKey}`)
          .data(data)
          .enter()
          .append("text")
          .attr("class", `data-label label-${safeKey}`)
          .attr("x", d => !inverted ? xScale(d[xField]) : xScale(d[key]))
          .attr("y", d => !inverted ? yScale(d[key]) - 10 : yScale(d[xField]) - 10)
          .attr("text-anchor", "middle")
          .style("font-size", "12px")
          .style("fill", colors[key] || "black")
          .text(d => `${d[key]}`);
      });
    }

    if (title) {
      svg.append("text")
        .attr("x", dims.width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "22px")
        .style("font-weight", "bold")
        .text(title);
    }
    
    if (xLabel && xLabel !== "") {
      svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "middle")
        .attr("x", dims.width / 2)
        .attr("y", dims.height + margins.bottom - 40)
        .style("font-size", "14px")
        .text(xLabel);
    }

    svg.append("text")
      .attr("class", "y label")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -dims.height / 2)
      .attr("y", -margins.left + 30)
      .style("font-size", "14px")
      .text(yLabel);

    const legendGroup = svg.append("g").attr("class", "legend-group");
    const legendItems = legendGroup.selectAll(".legend-item")
      .data(seriesState)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        seriesState.forEach(s => {
          if (s.key !== d.key && s.active) {
            const safeKey = safeClassName(s.key);
            svg.selectAll(`.area.${safeKey}`).transition().style("opacity", 0.1);
            if ((inverted && !stacked) || stacked) {
              svg.selectAll(`.circle-${safeKey}`).transition().style("opacity", 0.1);
            } else {
              svg.selectAll(`.label-${safeKey}`).transition().style("opacity", 0.1);
            }
          }
        });
      })
      .on("mouseout", function () {
        seriesState.forEach(s => {
          if (s.active) {
            const safeKey = safeClassName(s.key);
            svg.selectAll(`.area.${safeKey}`).transition().style("opacity", 1);
            if ((inverted && !stacked) || stacked) {
              svg.selectAll(`.circle-${safeKey}`).transition().style("opacity", 1);
            } else {
              svg.selectAll(`.label-${safeKey}`).transition().style("opacity", 1);
            }
          }
        });
      })
      .on("click", function (event, d) {
        // Toggle active state on click.
        d.active = !d.active;
        d3.select(this).select("text")
          .transition()
          .style("text-decoration", d.active ? "none" : "line-through");
        d3.select(this).select("circle")
          .transition()
          .style("fill-opacity", d.active ? 1 : 0.3);
        const activeKeys = seriesState.filter(s => s.active).map(s => s.key);
      
        // If there are active series, update scales and axis. Otherwise, remove axis and grid.
        if (activeKeys.length > 0) {
          const maxY = !stacked
            ? d3.max(data, d => d3.max(activeKeys, key => d[key] || 0))
            : d3.max(d3.stack().keys(activeKeys)(data).pop(), d => d[1]);
          if (!inverted) {
            yScale.domain([0, maxY + 5]).nice();
            if (svg.select(".y.axis").empty()) {
              svg.append("g")
                .attr("class", "y axis")
                .call(d3.axisLeft(yScale).ticks(8).tickFormat(d3.format("d")))
                .selectAll(".domain").remove();
            } else {
              svg.select(".y.axis")
                .transition()
                .duration(750)
                .on("start", function () { d3.select(this).selectAll(".domain").remove(); })
                .call(d3.axisLeft(yScale).ticks(8).tickFormat(d3.format("d")))
                .on("end", function () { d3.select(this).selectAll(".domain").remove(); });
            }
            if (svg.select(".grid").empty()) {
              svg.append("g")
                .attr("class", "grid")
                .style("opacity", 0.1)
                .call(d3.axisLeft(yScale).ticks(8).tickSize(-dims.width).tickFormat(""))
                .selectAll(".domain").remove();
            } else {
              svg.select(".grid")
                .transition()
                .duration(750)
                .on("start", function () { d3.select(this).selectAll(".domain").remove(); })
                .call(d3.axisLeft(yScale).ticks(8).tickSize(-dims.width).tickFormat(""))
                .on("end", function () { d3.select(this).selectAll(".domain").remove(); });
            }
          } else {
            xScale.domain([0, maxY + 4]).nice();
            if (svg.select(".x.axis").empty()){
              svg.append("g")
                .attr("class", "x axis")
                .attr("transform", `translate(0, ${dims.height})`)
                .call(d3.axisBottom(xScale).ticks(8).tickFormat(d3.format("d")))
                .selectAll(".domain").remove();
            } else {
              svg.select(".x.axis")
                .transition()
                .duration(750)
                .on("start", function () { d3.select(this).selectAll(".domain").remove(); })
                .call(d3.axisBottom(xScale).ticks(8).tickFormat(d3.format("d")))
                .on("end", function () { d3.select(this).selectAll(".domain").remove(); });
            }
            if (svg.select(".grid").empty()){
              svg.append("g")
                .attr("class", "grid")
                .style("opacity", 0.1)
                .call(d3.axisBottom(xScale).ticks(8).tickSize(dims.height).tickFormat(""))
                .selectAll(".domain").remove();
            } else {
              svg.select(".grid")
                .transition()
                .duration(750)
                .on("start", function () { d3.select(this).selectAll(".domain").remove(); })
                .call(d3.axisBottom(xScale).ticks(8).tickSize(dims.height).tickFormat(""))
                .on("end", function () { d3.select(this).selectAll(".domain").remove(); });
            }
          }
        } else {
          // When no series are active, remove the appropriate axis and grid.
          if (!inverted) {
            svg.select(".y.axis")
              .style("opacity", 0)
              .remove();
            svg.select(".grid")
              .style("opacity", 0)
              .remove();
          } else {
            svg.select(".x.axis")
              .style("opacity", 0)
              .remove();
            svg.select(".grid")
              .style("opacity", 0)
              .remove();
          }
        }
        
        drawAreas();
        
        if (showLabels && !stacked) {
          series.forEach(key => {
            const safeKey = safeClassName(key);
            const isActive = seriesState.find(s => s.key === key).active;
            svg.selectAll(`.label-${safeKey}`)
              .transition()
              .style("opacity", isActive ? 1 : 0)
              .attr("display", isActive ? null : "none");
          });
        }
      });
      
      
      legendItems.append("circle")
        .attr("class", "legend-circle")
        .attr("r", 6)
        .attr("cx", 0)
        .attr("cy", 0)
        .style("fill", d => colors[d.key] || "black");
      legendItems.append("text")
        .attr("x", 10)
        .attr("y", 4)
        .style("font-size", "14px")
        .text(d => d.key);
      let xOffset = 0;
      legendItems.attr("transform", function () {
        const itemWidth = this.getBBox().width + 20;
        const transform = `translate(${xOffset}, 0)`;
        xOffset += itemWidth;
        return transform;
      });
      const legendBBox = legendGroup.node().getBBox();
      if (inverted) {
        legendGroup.insert("rect", ":first-child")
          .attr("x", legendBBox.x - 10)
          .attr("y", legendBBox.y - 10)
          .attr("width", legendBBox.width + 20)
          .attr("height", legendBBox.height + 20)
          .attr("fill", "#fff")
          .attr("stroke", "#d3d3d3")
          .attr("rx", 5)
          .attr("ry", 5);
        legendGroup.attr("transform", `translate(${dims.width - 170}, 20)`);
      } else {
        legendGroup.attr("transform", `translate(${(dims.width - legendBBox.width) / 2}, ${dims.height + 70})`);
      }
    },
 

  
  // ADD LABELS INSIDE THE STACKED COLUMN AND STACKED PERCENTAGE COLUMN CHART
  renderColumnChart({
    data,
    containerId,
    title = "",
    xField,
    yField,
    groups = null,
    series = [],
    colors = {},
    xLabel = "",
    yLabel = "",
    yUnit = "",
    showLabels = false,
    stacked = false,
    percentage = false,
    margins = ChartHelpers.defaultMargins,
    width = 1400,
    height = 900
  }) {
    // Remove any existing SVG
    d3.select(containerId).select("svg").remove();
  
    // Create SVG container and dimensions.
    const dims = ChartHelpers.getDimensions(margins, width + 50, height);
    const svg = ChartHelpers.createSVG(containerId, margins, width, height);
  
    // --- RANGE CHART BRANCH (unchanged) ---
    const isRangeChart = data.length && data[0].hasOwnProperty("min") && data[0].hasOwnProperty("max");
    if (isRangeChart) {
      const xMin = d3.min(data, d => d.min);
      const xMax = d3.max(data, d => d.max);
      const xScale = d3.scaleLinear().domain([xMin, xMax]).nice().range([0, dims.width]);
      const yScale = d3.scaleBand().domain(data.map(d => d[xField])).range([0, dims.height]).padding(0.2);
  
      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0, ${dims.height})`)
        .call(d3.axisBottom(xScale))
        .call(g => g.select(".domain").remove());
  
      const yAxisRange = svg.append("g").attr("class", "y axis");
      yAxisRange.call(d3.axisLeft(yScale).ticks(8));
      yAxisRange.selectAll(".domain").remove();
  
      svg.append("g")
        .attr("class", "grid")
        .style("opacity", 0.1)
        .attr("transform", `translate(0, ${dims.height})`)
        .call(d3.axisBottom(xScale).tickSize(-dims.height).tickFormat(""))
        .call(g => g.select(".domain").remove());
  
      const columnsGroup = svg.append("g").attr("class", "columns-group");
      const formatValue = d3.format(",");
      data.forEach(d => {
        const barY = yScale(d[xField]);
        const barX = xScale(d.min);
        const barWidth = xScale(d.max) - xScale(d.min);
        const barHeight = yScale.bandwidth();
  
        columnsGroup.append("rect")
          .attr("class", "range-bar")
          .attr("x", barX)
          .attr("y", barY)
          .attr("width", barWidth)
          .attr("height", barHeight)
          .attr("fill", colors.range || "black")
          .attr("rx", barHeight / 2)
          .attr("ry", barHeight / 2)
          .on("mouseover", function(event) {
            d3.select(this).attr("opacity", 0.7);
            const tooltipHtml = `
                ${d[xField]}<br/>
                <span style="color:${colors.range || "black"}">&#9679;</span>
                ${yField}: <strong>${formatValue(d.min)}${yUnit ? " " + yUnit : ""}</strong> - <strong>${formatValue(d.max)}${yUnit ? " " + yUnit : ""}</strong>
              `;
            ChartHelpers.showTooltip(event, tooltipHtml);
          })
          .on("mousemove", function(event) {
            d3.select(".tooltip")
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
          })
          .on("mouseout", function() {
            d3.select(this).attr("opacity", 1);
            ChartHelpers.removeTooltip();
          });
  
        if (showLabels && barWidth > 15) {
          columnsGroup.append("text")
            .attr("class", "range-label-min")
            .attr("x", barX - 5)
            .attr("y", barY + barHeight / 2 + 4)
            .attr("text-anchor", "end")
            .style("fill", "#000")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .text(formatValue(d.min) + (yUnit ? " " + yUnit : ""));
          columnsGroup.append("text")
            .attr("class", "range-label-max")
            .attr("x", barX + barWidth + 5)
            .attr("y", barY + barHeight / 2 + 4)
            .attr("text-anchor", "start")
            .style("fill", "#000")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .text(formatValue(d.max) + (yUnit ? " " + yUnit : ""));
        }
      });
  
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
      if (yLabel) {
        svg.append("text")
          .attr("class", "x label")
          .attr("text-anchor", "middle")
          .attr("x", dims.width / 2)
          .attr("y", dims.height + margins.bottom - 40)
          .style("font-size", "14px")
          .text(yLabel);
      }
      if (xLabel) {
        svg.append("text")
          .attr("class", "y label")
          .attr("text-anchor", "middle")
          .attr("transform", "rotate(-90)")
          .attr("x", -dims.height / 2)
          .attr("y", -margins.left + 30)
          .style("font-size", "14px")
          .text(xLabel);
      }
      return;
    }
  
    // --- NON-RANGE CHART: Define scales and axes ---
    const xDomain = data.map(d => d[xField]);
    const xScale = d3.scaleBand()
      .domain(xDomain)
      .range([0, dims.width])
      .padding(0.1);
    const yScale = d3.scaleLinear().range([dims.height, 0]);

    const yAxis = svg.append("g").attr("class", "y axis");
    yAxis.call(d3.axisLeft(yScale).ticks(8));
    yAxis.selectAll(".domain").remove();

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0, ${dims.height})`)
      .call(d3.axisBottom(xScale))
      .call(g => g.select(".domain").remove());

    const columnsGroup = svg.append("g").attr("class", "columns-group");
  
    // --- Set up toggling state ---
    // If groups are provided, build toggle state for each unique series.
    let toggleState;
    if (groups) {
      const seriesSet = new Set();
      groups.forEach(g => {
        g.series.forEach(s => seriesSet.add(s));
      });
      toggleState = Array.from(seriesSet).map(s => ({ key: s, active: true }));
    } else {
      toggleState = series.map(key => ({ key, active: true }));
    }

    if (stacked && percentage) {
      data.forEach(d => {
        let total = 0;
        if (groups) {
          groups.forEach(group => {
            group.series.forEach(series => {
              const isActive = toggleState.find(ts => ts.key === series)?.active;
              if (isActive) total += d[series] || 0;
            });
          });
        } else {
          toggleState.forEach(({ key, active }) => {
            if (active) total += d[key] || 0;
          });
        }

        if (total > 0) {
          if (groups) {
            groups.forEach(group => {
              group.series.forEach(series => {
                if (toggleState.find(ts => ts.key === series)?.active) {
                  d[`_${series}_percent`] = ((d[series] || 0) / total) * 100;
                }
              });
            });
          } else {
            toggleState.forEach(({ key, active }) => {
              if (active) {
                d[`_${key}_percent`] = ((d[key] || 0) / total) * 100;
              }
            });
          }
        }
      });
    }
  
    // --- Compute maximum value for yScale based on active series ---
    let maxVal;

if (groups) {
  if (stacked) {
    maxVal = d3.max(data, d => {
      return d3.max(groups.map(group => {
        const activeSeries = group.series.filter(s =>
          toggleState.find(ts => ts.key === s).active
        );
        return activeSeries.reduce((sum, s) => sum + (d[s] || 0), 0);
      }));
    });
  } else {
    maxVal = d3.max(data, d => {
      return d3.max(groups.flatMap(group =>
        group.series.filter(s =>
          toggleState.find(ts => ts.key === s).active
        ).map(s => d[s] || 0)
      ));
    });
  }
} else {
  if (stacked) {
    const activeKeys = toggleState.filter(s => s.active).map(s => s.key);
    maxVal = d3.max(data, d => activeKeys.reduce((sum, key) => sum + (d[key] || 0), 0));
  } else {
    const activeKeys = toggleState.filter(s => s.active).map(s => s.key);
    maxVal = d3.max(data, d => d3.max(activeKeys, key => d[key] || 0));
  }
}

// ✅ Apply Y-axis domain and ticks AFTER maxVal is computed
if (stacked && percentage) {
  yScale.domain([0, 100]);
  yAxis.call(d3.axisLeft(yScale).tickValues([0, 25, 50, 75, 100]));
} else {
  yScale.domain([0, maxVal + 5]).nice();
  yAxis.call(d3.axisLeft(yScale).ticks(8));
}

    // --- Updated y-axis transition using the first snippet’s approach ---
    yAxis.select(".domain").remove();

    svg.selectAll(".grid").remove();
svg.append("g")
  .attr("class", "grid")
  .style("opacity", 0.1)
  .call(
    (stacked && percentage
      ? d3.axisLeft(yScale).tickValues([0, 25, 50, 75, 100])
      : d3.axisLeft(yScale).ticks(8)
    )
    .tickSize(-dims.width)
    .tickFormat("")
  )
  .call(g => g.selectAll(".domain").remove());





    let isInitialDraw = true;
  
    // --- Function to draw columns ---
    function drawColumns() {
      columnsGroup.selectAll(".column-group").remove();

      const formatValue = d3.format(",");
  
      if (groups) {
        const groupNames = groups.map(g => g.groupName);
        const outerScale = d3.scaleBand()
          .domain(groupNames)
          .range([0, xScale.bandwidth()])
          .padding(0.1);
  
        const categoryGroups = columnsGroup
          .selectAll(".column-group")
          .data(data)
          .enter()
          .append("g")
          .attr("class", "column-group")
          .attr("transform", d => `translate(${xScale(d[xField])}, 0)`);
  
        categoryGroups.each(function(d) {
          const catGroup = d3.select(this);
          groups.forEach(group => {
            const activeSeries = group.series.filter(s =>
              toggleState.find(ts => ts.key === s).active
            );
            if (activeSeries.length === 0) return;
  
            const groupX = outerScale(group.groupName);
  
            if (stacked) {
              let cumulative = 0;
              activeSeries.forEach(s => {
                const value      = d[s] || 0;
                const rectY      = yScale(cumulative + value);
                const rectHeight = yScale(cumulative) - yScale(cumulative + value);
            
                const rect = catGroup.append("rect")
                  .attr("class", `column rect-${group.groupName.replace(/\s+/g, "-")}-${s.replace(/\s+/g, "-")}`)
                  .attr("data-series", s)                
                  .attr("x",     groupX)
                  .attr("width", outerScale.bandwidth())
                  .attr("fill",  colors[s] || "black")
                  .attr("y",      isInitialDraw ? rectY : yScale(cumulative))
                  .attr("height", isInitialDraw ? rectHeight : 0)
                  .on("mouseover", function(event) {
                    const currentKey = d3.select(this).attr("data-series");
                  
                    // Fade out all bars
                    d3.selectAll(".column")
                      .transition()
                      .duration(200)
                      .style("opacity", 0.2);
                  
                    // Highlight the current series
                    d3.selectAll(`.column[data-series='${currentKey}']`)
                      .transition()
                      .duration(200)
                      .style("opacity", 1);
                  
                    // Total for this group
                    const total = activeSeries.reduce((sum, key) => sum + (d[key] || 0), 0);
                    const value = d[currentKey] || 0;

                    // Tooltip HTML
                    const valueDisplay = percentage
  ? `${value.toFixed(1)}%`
  : `${formatValue(value)}${yUnit ? " " + yUnit : ""}`;

const tooltipHtml = `
  <div style="font-weight: bold; margin-bottom: 4px;">${d[xField]}</div>
  <div>${currentKey}: ${valueDisplay}</div>
  ${!percentage ? `<div style="margin-top: 4px;">Total: ${formatValue(total)}${yUnit ? " " + yUnit : ""}</div>` : ""}
`;

                      
                    ChartHelpers.showTooltip(event, tooltipHtml);
                  })                  
                  .on("mousemove", function(event) {
                    d3.select(".tooltip")
                      .style("left", (event.pageX + 10) + "px")
                      .style("top",  (event.pageY - 28) + "px");
                  })
                  .on("mouseout", function() {
                    d3.selectAll(".column")
                      .transition()
                      .duration(200)
                      .style("opacity", 1);
                    ChartHelpers.removeTooltip();
                  });                  
            
                if (!isInitialDraw) {
                  rect.transition()
                    .duration(500)
                    .attr("y",      rectY)
                    .attr("height", rectHeight);
                }
            
                cumulative += value;
              });
            } else {
              const innerScale = d3.scaleBand()
                .domain(activeSeries)
                .range([0, outerScale.bandwidth()])
                .padding(0.1);
              activeSeries.forEach(s => {
                const value = percentage ? d[`_${s}_percent`] || 0 : d[s] || 0;
                const rect = catGroup.append("rect")
                  .attr("class", `column rect-${group.groupName.replace(/\s+/g, "-")}-${s.replace(/\s+/g, "-")}`)
                  .attr("data-series", s)                
                  .attr("x", groupX + innerScale(s))
                  .attr("width", innerScale.bandwidth())
                  .attr("fill", colors[s] || "black")
                  // For grouped (non-stacked) columns, set final y and height on initial draw.
                  .attr("y", isInitialDraw ? yScale(value) : yScale(0))
                  .attr("height", isInitialDraw ? (yScale(0) - yScale(value)) : 0)
                  .on("mouseover", function(event) {
                    const currentKey = d3.select(this).attr("data-series");
                  
                    // Fade out all bars
                    d3.selectAll(".column")
                      .transition()
                      .duration(200)
                      .style("opacity", 0.2);
                  
                    // Highlight the current series
                    d3.selectAll(`.column[data-series='${currentKey}']`)
                      .transition()
                      .duration(200)
                      .style("opacity", 1);
                  
                    const tooltipHtml = `<span style="color:${colors[s] || "black"}">&#9679;</span> <strong>${s}</strong><br/>Value: ${formatValue(value)} ${yUnit}`;
                    ChartHelpers.showTooltip(event, tooltipHtml);
                  })                  
                  .on("mousemove", function(event) {
                    d3.select(".tooltip")
                      .style("left", (event.pageX + 10) + "px")
                      .style("top", (event.pageY - 28) + "px");
                  })
                  .on("mouseout", function() {
                    d3.selectAll(".column")
                      .transition()
                      .duration(200)
                      .style("opacity", 1);
                    ChartHelpers.removeTooltip();
                  });
  
                if (!isInitialDraw) {
                  rect.transition()
                    .duration(500)
                    .attr("y", yScale(value))
                    .attr("height", yScale(0) - yScale(value));
                }
              });
            }
          });
        });
      } else {
        const activeKeys = toggleState.filter(s => s.active).map(s => s.key);
        const categoryGroups = columnsGroup.selectAll(".column-group")
          .data(data)
          .enter()
          .append("g")
          .attr("class", "column-group")
          .attr("transform", d => `translate(${xScale(d[xField])}, 0)`);
  
        if (stacked) {
          categoryGroups.each(function(d) {
            let cumulative = 0;
            const groupSel = d3.select(this);
            activeKeys.forEach(key => {
              const value = d[key] || 0;
              const rectY = yScale(cumulative + value);
              const rectHeight = yScale(cumulative) - yScale(cumulative + value);
              const rect = groupSel.append("rect")
                .attr("class", `column rect-${key.replace(/\s+/g, "-")}`)
                .attr("data-series", key)              
                .attr("x", 0)
                .attr("width", xScale.bandwidth())
                .attr("fill", colors[key] || "black")
                .attr("y", isInitialDraw ? rectY : yScale(cumulative))
                .attr("height", isInitialDraw ? rectHeight : 0)
                .on("mouseover", function(event) {
                  const bar = d3.select(this);
                  const currentKey = bar.attr("data-series");
                
                  // Fade all bars
                  d3.selectAll(".column")
                    .transition()
                    .duration(200)
                    .style("opacity", 0.2);
                
                  // Highlight all bars for this xField category
                  d3.selectAll(`.column-group`)
                    .filter(group => group[xField] === d[xField])
                    .selectAll(".column")
                    .transition()
                    .duration(200)
                    .style("opacity", 1);
                
                  // Build tooltip HTML for ALL active series
                  const activeKeys = toggleState.filter(s => s.active).map(s => s.key);
                  const lines = activeKeys.map(key => {
                    const value = d[key] || 0;
                    const percent = d[`_${key}_percent`] || 0;
                    return `
                      <div>
                        <span style="color:${colors[key] || "black"}"><strong>${key}:</strong></span>
                        <strong>${formatValue(value)}</strong> (${percent.toFixed(0)}%)
                      </div>`;
                  });
                  
                
                  const tooltipHtml = `
                    <div style="font-weight:bold; margin-bottom: 4px;">${d[xField]}</div>
                    ${lines.join("")}
                  `;
                
                  ChartHelpers.showTooltip(event, tooltipHtml);
                })
                
                .on("mousemove", function(event) {
                  d3.select(".tooltip")
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function() {
                  // Reset all bar opacities
                  d3.selectAll(".column")
                    .transition()
                    .duration(200)
                    .style("opacity", 1);
                  ChartHelpers.removeTooltip();
                });                
  
              if (!isInitialDraw) {
                rect.transition()
                  .duration(500)
                  .attr("y", rectY)
                  .attr("height", rectHeight);
              }
              cumulative += value;
            });
          });
        } else {
          const innerScale = d3.scaleBand()
            .domain(activeKeys)
            .range([0, xScale.bandwidth()])
            .padding(0.2);
          categoryGroups.each(function(d) {
            const groupSel = d3.select(this);
            activeKeys.forEach(key => {
              const value = d[key] || 0;
              const rect = groupSel.append("rect")
                .attr("class", `column rect-${key.replace(/\s+/g, "-")}`)
                .attr("data-series", key)              
                .attr("x", innerScale(key))
                .attr("width", innerScale.bandwidth())
                .attr("fill", colors[key] || "black")
                .attr("y", isInitialDraw ? yScale(value) : yScale(0))
                .attr("height", isInitialDraw ? (yScale(0) - yScale(value)) : 0)
                .on("mouseover", function(event) {
                  const currentKey = d3.select(this).attr("data-series");
                  // Fade out all bars
                  d3.selectAll(".column")
                    .transition()
                    .duration(200)
                    .style("opacity", 0.2);
                  // Highlight the current series
                  d3.selectAll(`.column[data-series='${currentKey}']`)
                    .transition()
                    .duration(200)
                    .style("opacity", 1);
                
                  const tooltipHtml = `<strong>${d[xField]}</strong><br/>
                    <span style="color:${colors[key] || "black"}">&#9679;</span>
                    ${key}: <strong>${formatValue(value)} ${yUnit}</strong>
                  `;
                  ChartHelpers.showTooltip(event, tooltipHtml);
                })
                
                .on("mousemove", function(event) {
                  d3.select(".tooltip")
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function() {
                  // Reset all bar opacities
                  d3.selectAll(".column")
                    .transition()
                    .duration(200)
                    .style("opacity", 1);
                  ChartHelpers.removeTooltip();
                });
                
  
              if (!isInitialDraw) {
                rect.transition()
                  .duration(500)
                  .attr("y", yScale(value))
                  .attr("height", yScale(0) - yScale(value));
              }
            });
          });
        }
      }
    }
  
    // Initial draw of the columns (without transitions).
    drawColumns();
    // Now set the flag to false so that subsequent updates (e.g. toggling via legend) animate.
    isInitialDraw = false;
  
    // --- Create Legend for toggling individual series ---
    const legendGroup = svg.append("g").attr("class", "legend-group");
    const legendData = toggleState;
    const legendItems = legendGroup.selectAll(".legend-item")
      .data(legendData)
      .enter()
      .append("g")
       .attr("data-series", d => d.key)
      .attr("class", "legend-item")
      .style("cursor", "pointer")
      .on("mouseover", function(event) {
        const seriesKey = d3.select(this).attr("data-series");
      
        // Fade all bars and legend items
        d3.selectAll(".column").transition().duration(200).style("opacity", 0.2);
        d3.selectAll(".legend-item").transition().duration(200).style("opacity", 0.2);
      
        // Highlight matching series bars and legend
        d3.selectAll(`.column[data-series='${seriesKey}']`).transition().duration(200).style("opacity", 1);
        d3.selectAll(`.legend-item[data-series='${seriesKey}']`).transition().duration(200).style("opacity", 1);  
      })
      .on("mouseout", function() {
        d3.selectAll(".column").transition().duration(200).style("opacity", 1);
        d3.selectAll(".legend-item").transition().duration(200).style("opacity", 1);
        ChartHelpers.removeTooltip();
      })      
      .on("click", function(event, d) {
        // 1) Toggle this series’ active flag
        d.active = !d.active;
        // update legend text decoration
        d3.select(this).select("text")
          .transition()
          .style("text-decoration", d.active ? "none" : "line-through");
        // update legend dot opacity
        d3.select(this).select("circle")
          .transition()
          .style("fill-opacity", d.active ? 1 : 0.3);
    
        // 2) Count how many series are still active
        let activeCount;
        if (groups) {
          activeCount = groups.reduce((count, group) => {
            return count
              + group.series.filter(seriesKey =>
                  toggleState.find(ts => ts.key === seriesKey).active
                ).length;
          }, 0);
        } else {
          activeCount = toggleState.filter(ts => ts.active).length;
        }
    
        if (activeCount > 0) {
          // 3) Recompute maxVal based on active series
          if (groups) {
            if (stacked) {
              maxVal = d3.max(data, row => {
                return d3.max(groups.map(group => {
                  const activeSeries = group.series.filter(seriesKey =>
                    toggleState.find(ts => ts.key === seriesKey).active
                  );
                  return activeSeries.reduce((sum, key) => sum + (row[key] || 0), 0);
                }));
              });
            } else {
              maxVal = d3.max(data, row => {
                return d3.max(groups.flatMap(group =>
                  group.series
                    .filter(seriesKey =>
                      toggleState.find(ts => ts.key === seriesKey).active
                    )
                    .map(key => row[key] || 0)
                ));
              });
            }
          } else {
            const activeKeys = toggleState.filter(ts => ts.active).map(ts => ts.key);
            if (stacked) {
              maxVal = d3.max(data, row =>
                activeKeys.reduce((sum, key) => sum + (row[key] || 0), 0)
              );
            } else {
              maxVal = d3.max(data, row =>
                d3.max(activeKeys, key => row[key] || 0)
              );
            }
          }
    
          // 4) Update the y‐scale domain
          if (!(stacked && percentage)) {
            yScale.domain([0, maxVal + 5]).nice();
            yAxis.transition().duration(500).call(d3.axisLeft(yScale).ticks(8));
          } else {
            yAxis.transition()
              .duration(500)
              .call(d3.axisLeft(yScale).tickValues([0, 25, 50, 75, 100]));
          }          

    
          // 5) Bring the axis group back to full opacity
          yAxis.style("opacity", 1);
    
          // 6) Transition and redraw the y‐axis ticks & labels
          yAxis.transition()
  .duration(500)
  .call(stacked && percentage
    ? d3.axisLeft(yScale).tickValues([0, 25, 50, 75, 100])
    : d3.axisLeft(yScale).ticks(8)
  );

          // option: remove the domain line if you prefer
          yAxis.select(".domain").remove();
    
          // 7) Rebuild the grid lines
          svg.selectAll(".grid").remove();
          svg.append("g")
  .attr("class", "grid")
  .style("opacity", 0.1)
  .call(
    (stacked && percentage
      ? d3.axisLeft(yScale).tickValues([0, 25, 50, 75, 100])
      : d3.axisLeft(yScale).ticks(8)
    )
    .tickSize(-dims.width)
    .tickFormat("")
  )
            .call(g => g.selectAll(".domain").remove());
    
        } else {
          // No series active: fade the axis & grid out
          yAxis.transition()
            .duration(500)
            .style("opacity", 0);
          svg.selectAll(".grid")
            .transition()
            .duration(500)
            .style("opacity", 0);
        }
    
        // 8) Finally, redraw the bars/columns to reflect the new active set
        drawColumns();
      });
      
        
    legendItems.append("circle")
      .attr("r", 7)
      .attr("cx", 0)
      .attr("cy", 0)
      .style("fill", d => colors[d.key] || "black");
    legendItems.append("text")
      .attr("x", 12)
      .attr("y", 4)
      .style("font-size", "14px")
      .text(d => d.key);
  
    // Position legend items horizontally.
    let xOffset = 0;
    legendItems.attr("transform", function() {
      const itemWidth = this.getBBox().width + 20;
      const transform = `translate(${xOffset}, 0)`;
      xOffset += itemWidth;
      return transform;
    });
  
    // --- LEGEND PLACEMENT ---
    // If the chart is in grouped AND stacked mode, position the legend in the center bottom.
    // Otherwise, use the original positions.
    const legendBBox = legendGroup.node().getBBox();
    if (groups && stacked || percentage && stacked) {
      legendGroup.attr("transform", `translate(${(dims.width - legendBBox.width)/2}, ${dims.height + 70})`);
    } else if (stacked) {
      legendGroup.insert("rect", ":first-child")
        .attr("x", legendBBox.x - 10)
        .attr("y", legendBBox.y - 10)
        .attr("width", legendBBox.width + 20)
        .attr("height", legendBBox.height + 20)
        .attr("fill", "#fff")
        .attr("stroke", "#d3d3d3")
        .attr("rx", 5)
        .attr("ry", 5);
      legendGroup.attr("transform", `translate(55, 55)`);
    } else {
      legendGroup.attr("transform", `translate(${(dims.width - legendBBox.width)/2}, ${dims.height + 70})`);
    }
  
    // --- Common Title and Axis Labels ---
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
    if (xLabel) {
      svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "middle")
        .attr("x", dims.width / 2)
        .attr("y", dims.height + margins.bottom - 40)
        .style("font-size", "14px")
        .text(xLabel);
    }
    if (yLabel) {
      svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -dims.height / 2)
        .attr("y", -margins.left + 30)
        .style("font-size", "14px")
        .text(yLabel);
    }
  },





  renderBarChart({
    containerId,
    data,
    title = "",
    yField,
    series = [],
    colors = {},
    xLabel = "",
    yLabel = "",
    xUnit = "",
    showLabels = false,
    stacked = false,
    margins = ChartHelpers.defaultMargins,
    width = 1400,
    height = 900
  }) {
    d3.select(containerId).select("svg").remove();
    const dims = ChartHelpers.getDimensions(margins, width + 40, height);
    const svg = ChartHelpers.createSVG(containerId, margins, width, height);
    const seriesState = series.map(key => ({ key, active: true }));
    const formatValue = d3.format(",");
    const yDomain = data.map(d => d[yField]);
    const yScale = d3.scaleBand()
      .domain(yDomain)
      .range([0, dims.height])
      .padding(0.1);
    const xScale = d3.scaleLinear().range([0, dims.width]);
  
    // Add Y-axis
    const yAxis = svg.append("g")
      .attr("class", "y axis")
      .call(d3.axisLeft(yScale).tickSizeOuter(0));
  
    svg.append("line")
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", 0)
      .attr("y2", dims.height)
      .attr("stroke", "#000")
      .attr("stroke-width", 1);
  
    // X-axis container
    const xAxis = svg.append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0, ${dims.height})`);
  
    const gridGroup = svg.append("g").attr("class", "grid-group");
  
    // Set xScale domain and grid lines
    if (stacked) {
      xScale.domain([
        0,
        d3.max(data, d => series.reduce((sum, key) => sum + (d[key] || 0), 0)) + 10
      ]);
      const xTicks = xScale.ticks(10);
      svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0, ${dims.height})`)
        .style("opacity", 0.1)
        .call(d3.axisBottom(xScale)
          .tickValues(xTicks)
          .tickSize(-dims.height)
          .tickFormat(""));
    } else {
      const gridOffset = 10;
      yScale.domain().forEach((cat, i, arr) => {
        if (i === 0) {
          gridGroup.append("line")
            .attr("x1", 0).attr("x2", dims.width)
            .attr("y1", yScale(cat) - gridOffset)
            .attr("y2", yScale(cat) - gridOffset)
            .attr("stroke", "#e0e0e0")
            .attr("stroke-width", 1)
            .style("opacity", 0.7);
        }
        if (i < arr.length - 1) {
          gridGroup.append("line")
            .attr("x1", 0).attr("x2", dims.width)
            .attr("y1", yScale(cat) + yScale.bandwidth() + gridOffset)
            .attr("y2", yScale(cat) + yScale.bandwidth() + gridOffset)
            .attr("stroke", "#e0e0e0")
            .attr("stroke-width", 1)
            .style("opacity", 0.7);
        }
      });
    }
  
    const barsGroup = svg.append("g").attr("class", "bars-group");
  
    // Helper to generate a safe CSS class name
    function safeClass(key) {
      return key.replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    }
  
    // Helper to generate a pill-shaped path (optionally rounded)
    function pillPath(widthVal, heightVal, isRounded = true) {
      if (!isRounded) return `M0,0 H${widthVal} V${heightVal} H0 Z`;
      const r = Math.min(heightVal / 2, widthVal);
      if (widthVal <= 0) return "";
      return `
        M0,0
        H${widthVal - r}
        A${r},${r} 0 0 1 ${widthVal},${r}
        V${heightVal - r}
        A${r},${r} 0 0 1 ${widthVal - r},${heightVal}
        H0
        Z
      `;
    }
  
    function drawBars() {
      barsGroup.selectAll(".category-group").remove();
      svg.selectAll(".bar-label").remove();
  
      const activeSeries = seriesState.filter(s => s.active).map(s => s.key);
      const activeData = data.map(d => {
        const entry = { ...d };
        Object.keys(entry).forEach(key => {
          if (!activeSeries.includes(key) && key !== yField) {
            delete entry[key];
          }
        });
        return entry;
      });
  
      let maxVal;
      if (activeSeries.length === 0) {
        maxVal = 10;
        xScale.domain([0, maxVal]);
      } else {
        maxVal = stacked
          ? d3.max(activeData, d => activeSeries.reduce((sum, key) => sum + (d[key] || 0), 0))
          : d3.max(activeData, d => d3.max(activeSeries, key => d[key] || 0));
          xScale.domain([0, maxVal + 5]).nice();
      }
  
      const xTicks = xScale.ticks(10);
      xAxis.transition().duration(500).call(d3.axisBottom(xScale).tickValues(xTicks));
  
      svg.selectAll(".grid").remove();
      if (stacked) {
        svg.append("g")
          .attr("class", "grid")
          .attr("transform", `translate(0, ${dims.height})`)
          .style("opacity", 0.1)
          .call(d3.axisBottom(xScale)
            .tickValues(xTicks)
            .tickSize(-dims.height)
            .tickFormat(""));
      }
  
      const categoryGroups = barsGroup.selectAll(".category-group")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "category-group")
        .attr("transform", d => `translate(0, ${yScale(d[yField])})`);
  
      if (stacked) {
        categoryGroups.each(function (d) {
          let xOffset = 0;
          activeSeries.forEach((key, i) => {
            const value = d[key] || 0;
            const className = safeClass(key);
            const barGroup = d3.select(this);
            barGroup.append("path")
              .datum({ ...d, seriesKey: key })
              .attr("class", `bar bar-${className}`)
              .attr("transform", `translate(${xOffset}, 0)`)
              .attr("d", pillPath(xScale(value), yScale.bandwidth(), false))
              .attr("fill", colors[key] || "black")
              .style("fill-opacity", 1)
              .on("mouseover", function (event, d) {
                const seriesKey = d.seriesKey;
                const category = d[yField];
                const value = d[seriesKey] || 0;
                const color = colors[seriesKey] || "black";
                barsGroup.selectAll(`.bar`).transition().style("opacity", bar => {
                  return bar.seriesKey === seriesKey ? 1 : 0.3;
                });
                const tooltipHtml = `
                  ${category}<br/>
                  <span style="color:${color}">&#9679;</span> ${seriesKey}: <strong>${formatValue(value)}</strong>${xUnit}
                `;
                ChartHelpers.showTooltip(event, tooltipHtml);
              })
              .on("mousemove", function (event) {
                d3.select(".tooltip")
                  .style("left", (event.pageX + 10) + "px")
                  .style("top", (event.pageY - 28) + "px");
              })
              .on("mouseout", function () {
                barsGroup.selectAll(`.bar`).transition().style("opacity", 1);
                ChartHelpers.removeTooltip();
              });
  
            if (showLabels && value > 0) {
              barGroup.append("text")
                .attr("class", `bar-label label-${className}`)
                .attr("x", xOffset + xScale(value) / 2)
                .attr("y", yScale.bandwidth() / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", "middle")
                .style("fill", "#fff")
                .style("font-size", "12px")
                .style("font-weight", "bold")
                .text(formatValue(value));
            }
  
            xOffset += xScale(value);
          });
        });
      } else {
        const subScale = d3.scaleBand()
          .domain(activeSeries)
          .range([0, yScale.bandwidth()])
          .paddingInner(0.2);
  
        activeSeries.forEach(key => {
          const className = safeClass(key);
          categoryGroups
            .append("path")
            .datum(d => ({ ...d, seriesKey: key }))
            .attr("class", `bar bar-${className}`)
            .attr("transform", `translate(0, ${subScale(key)})`)
            .attr("d", d => pillPath(xScale(d[key] || 0), subScale.bandwidth()))
            .attr("fill", colors[key] || "black")
            .style("fill-opacity", 1)
            .on("mouseover", function (event, d) {
              const seriesKey = d.seriesKey;
              const category = d[yField];
              const value = d[seriesKey] || 0;
              const color = colors[seriesKey] || "black";
              barsGroup.selectAll(`.bar`).transition().style("opacity", bar => {
                return bar.seriesKey === seriesKey ? 1 : 0.3;
              });
              const tooltipHtml = `
                ${category}<br/>
                <span style="color:${color}">&#9679;</span> ${seriesKey}: <strong>${formatValue(value)}</strong>${xUnit}
              `;
              ChartHelpers.showTooltip(event, tooltipHtml);
            })
            .on("mousemove", function (event) {
              d3.select(".tooltip")
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function () {
              barsGroup.selectAll(`.bar`).transition().style("opacity", 1);
              ChartHelpers.removeTooltip();
            })
            .transition()
            .duration(500)
            .attr("d", d => pillPath(xScale(d[key] || 0), subScale.bandwidth()));
  
          if (showLabels) {
            categoryGroups
              .append("text")
              .datum(d => ({ ...d, seriesKey: key }))
              .attr("class", `bar-label label-${className}`)
              .attr("x", d => xScale(d[key] || 0) + 5)
              .attr("y", subScale(key) + subScale.bandwidth() / 2)
              .attr("dy", "0.35em")
              .style("font-size", "12px")
              .style("font-weight", "bold")
              .text(d => formatValue(d[key] || 0));
          }
        });
      }
    }
  
    drawBars();
  
    // Add chart title
    if (title) {
      svg.append("text")
        .attr("x", dims.width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "22px")
        .style("font-weight", "bold")
        .text(title);
    }
    // Add x-axis label
    if (xLabel) {
      svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "middle")
        .attr("x", dims.width / 2)
        .attr("y", dims.height + margins.bottom - 40)
        .style("font-size", "14px")
        .text(xLabel + (xUnit ? ` (${xUnit})` : ""));
    }
    // Add y-axis label
    if (yLabel) {
      svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -dims.height / 2)
        .attr("y", -margins.left + 20)
        .style("font-size", "14px")
        .text(yLabel);
    }
    // Create legend group and legend items
const legendGroup = svg.append("g").attr("class", "legend-group");
const legendItems = legendGroup.selectAll(".legend-item")
  .data(seriesState)
  .enter()
  .append("g")
  .attr("class", "legend-item")
  .style("cursor", "pointer")
  .on("mouseover", function (event, d) {
    seriesState.forEach(s => {
      if (s.key !== d.key && s.active) {
        barsGroup.selectAll(`.bar-${safeClass(s.key)}`).transition().style("opacity", 0.3);
      }
    });
  })
  .on("mouseout", function () {
    seriesState.forEach(s => {
      if (s.active) {
        barsGroup.selectAll(`.bar-${safeClass(s.key)}`).transition().style("opacity", 1);
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
      .style("fill-opacity", d.active ? 1 : 0.7);
    drawBars();
  });

// Add a circle and label for each legend item
legendItems.append("circle")
  .attr("r", 6)
  .attr("cx", 0)
  .attr("cy", 0)
  .style("fill", d => colors[d.key] || "black");

legendItems.append("text")
  .attr("x", 12)  // some horizontal spacing from the circle
  .attr("y", 4)
  .style("font-size", "14px")
  .text(d => d.key);

// Legend layout
if (!stacked) {
  // Non-stacked: one item per line with a background rect
  const lineHeight = 24; // vertical gap between rows

  legendItems.attr("transform", function(d, i) {
    return `translate(0, ${i * lineHeight})`;
  });

  // Insert background rect behind legend items
  const bbox = legendGroup.node().getBBox();
  legendGroup.insert("rect", ":first-child")
    .attr("x", bbox.x - 10)
    .attr("y", bbox.y - 10)
    .attr("width", bbox.width + 20)
    .attr("height", bbox.height + 20)
    .attr("fill", "#fff")
    .attr("stroke", "#d3d3d3")
    .attr("rx", 5)
    .attr("ry", 5);

  // Position the legend group near top-right (example)
  legendGroup.attr("transform", `translate(${dims.width - bbox.width - 20}, 20)`);
} else {
  // Place legend items horizontally (like your screenshot)
  let xOffset = 0;
  legendItems.attr("transform", function(d, i) {
    const thisWidth = this.getBBox().width;
    const transform = `translate(${xOffset}, 0)`;
    xOffset += thisWidth + 20; // Adjust spacing as needed
    return transform;
  });

  // Get the bounding box of the legend group after positioning items
  const legendBbox = legendGroup.node().getBBox();
  // Compute the horizontal offset to center the legend
  const centerX = (dims.width - legendBbox.width) / 2;
  // Position the legend group below the chart (e.g., 30 pixels below)
  legendGroup.attr("transform", `translate(${centerX}, ${dims.height + 70})`);
}
  },

  renderPieChart({
    data,
    containerId,
    title = "",
    colorPalette = d3.schemeCategory10,
    innerRadiusRatio = 0,
    showCenterTotal = false,
    isSemiCircle = false,
    margins = { top: 40, right: 70, bottom: 100, left: 70 },
    width = 1400,
    height = 900
  }) {
    const dims = ChartHelpers.getDimensions(margins, width, height);
    d3.select(containerId).select("svg").remove();

    const svg = d3.select(containerId)
      .append("svg")
      .attr("width", dims.totalWidth)
      .attr("height", dims.totalHeight)
      .append("g")
      .attr("transform", `translate(${margins.left}, ${margins.top})`);

    // For non-semi circle mode, title appears at the top
    if (!isSemiCircle && title) {
      svg.append("text")
        .attr("x", dims.width / 2)
        .attr("y", 0)
        .attr("text-anchor", "middle")
        .style("font-size", "22px")
        .style("font-weight", "bold")
        .text(title);
    }

    let radius = Math.min(dims.width, dims.height) / 2 - 20;
    let verticalShift = isSemiCircle ? -radius / 2 : (innerRadiusRatio > 0 ? 75 : 0);
    let extraTopSpace = isSemiCircle ? 350 : (innerRadiusRatio === 0 ? 75 : 0);

    const pie = d3.pie().value(d => d.value);
    if (isSemiCircle) {
      data = [...data].sort((a, b) => b.value - a.value);
      pie.startAngle(-Math.PI / 2).endAngle(Math.PI / 2).sort(null);
    } else {
      pie.sort(null);
    }

    const pieGroup = svg.append("g")
      .attr("transform", `translate(${dims.width / 2}, ${dims.height / 2 + verticalShift + extraTopSpace})`);

      if (isSemiCircle && title) {
        // Create the text element in the pieGroup.
        const textElement = pieGroup.append("text")
          .attr("class", "center-title")
          .attr("text-anchor", "middle")
          .style("font-size", "22px")
          .style("font-weight", "bold");
        
        // Split the title by "_" characters and add tspans for each line.
        const titleLines = title.split("_");
        titleLines.forEach((line, i) => {
          textElement.append("tspan")
            .attr("x", 0)
            .attr("dy", i === 0 ? "0" : "1.2em") // Adjust line spacing if needed.
            .text(line);
        });
        
        // Delay execution to ensure the text is rendered.
        setTimeout(() => {
          // Get the bounding box of the rendered text.
          const bbox = textElement.node().getBBox();
          
          // If your semicircle's bottom is at y = 0 in the pieGroup, then you need to shift the text
          // upward so that its bottom (bbox.y + bbox.height) aligns with 0.
          // If your desired bottom is different (say, y = radius), adjust accordingly.
          const shiftY = - (bbox.y + bbox.height);
          
          textElement.attr("transform", `translate(0, ${shiftY})`);
        }, 0);
      }
      
      

    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.label))
      .range(colorPalette);

    const arc = d3.arc()
      .innerRadius(radius * innerRadiusRatio)
      .outerRadius(radius);

    const tooltip = ChartHelpers.createTooltip();
    const arcs = pie(data);

    function updateOutsideLabels(arcs) {
      const boundaryArc = d3.arc().innerRadius(radius).outerRadius(radius);
      const labelArcRadius = radius * 1.15;
      const labelArc = d3.arc()
        .innerRadius(labelArcRadius)
        .outerRadius(labelArcRadius);

      pieGroup.selectAll(".slice-line").remove();
      pieGroup.selectAll(".slice-role").remove();

      const labelPositions = isSemiCircle ? { left: [], right: [] } : null;
      const usedY = isSemiCircle ? { left: [], right: [] } : null;

      arcs.forEach(d => {
        const midAngle = (d.startAngle + d.endAngle) / 2;
        const basePos = labelArc.centroid(d);
        const total = d3.sum(arcs, d => d.data.value);
        const percentage = ((d.data.value / total) * 100).toFixed(1);
        let x, y, anchor, side;

        if (isSemiCircle) {
          side = midAngle < 0 ? 'left' : 'right';
          x = basePos[0] + (side === 'right' ? 25 : -25);
          y = basePos[1];

          while (usedY[side].some(yy => Math.abs(yy - y) < 20)) {
            y += 20;
          }
          usedY[side].push(y);
          labelPositions[side].push({ x, y, label: d.data.label, arc: d });
        } else {
          x = basePos[0] + (midAngle < Math.PI ? 25 : -25);
          y = basePos[1];
          anchor = midAngle < Math.PI ? "start" : "end";

          const pBoundary = boundaryArc.centroid(d);
          pieGroup.append("polyline")
            .attr("class", "slice-line")
            .attr("points", [
              [pBoundary[0], pBoundary[1]],
              [basePos[0], basePos[1]],
              [x, y]
            ])
            .style("stroke", color(d.data.label))
            .style("stroke-width", "2px")
            .style("fill", "none");

          pieGroup.append("text")
            .attr("class", "slice-role")
            .attr("transform", `translate(${x}, ${y})`)
            .attr("text-anchor", anchor)
            .attr("alignment-baseline", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "#000")
            .text(`${d.data.label}: ${percentage}%`)
            .datum(d);
        }
      });

      if (isSemiCircle) {
        ["left", "right"].forEach(side => {
          labelPositions[side].forEach(pos => {
            const d = pos.arc;
            const total = d3.sum(arcs, d => d.data.value);
            const percentage = ((d.data.value / total) * 100).toFixed(1);

            const pBoundary = boundaryArc.centroid(d);
            pieGroup.append("polyline")
              .attr("class", "slice-line")
              .attr("points", [
                [pBoundary[0], pBoundary[1]],
                [labelArc.centroid(d)[0], labelArc.centroid(d)[1]],
                [pos.x, pos.y]
              ])
              .style("stroke", color(d.data.label))
              .style("stroke-width", "2px")
              .style("fill", "none");

            pieGroup.append("text")
              .attr("class", "slice-role")
              .attr("transform", `translate(${pos.x}, ${pos.y})`)
              .attr("text-anchor", side === "right" ? "start" : "end")
              .attr("alignment-baseline", "middle")
              .style("font-size", "14px")
              .style("font-weight", "bold")
              .style("fill", "#000")
              .text(`${d.data.label}: ${percentage}%`)
              .datum(d);
          });
        });
      }

      // Add interactivity to labels
      pieGroup.selectAll(".slice-role")
        .on("mouseover", function(event, d) {
          const label = d.data.label;
          pieGroup.selectAll("path")
            .transition().duration(200)
            .style("opacity", e => (e.data.label === label ? 1 : 0.3));
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip.html(`<strong>${label}</strong>: ${d.data.value} interns`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mousemove", function(event) {
          tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
          pieGroup.selectAll("path").transition().duration(200).style("opacity", 1);
          tooltip.transition().duration(500).style("opacity", 0);
        })
        .on("click", function(event, d) {
          const label = d.data.label;
          const matchedArc = arcs.find(a => a.data.label === label);
          if (!matchedArc) return;

          const allPaths = pieGroup.selectAll("path");
          const slicePath = allPaths.filter(p => p.data.label === label);

          const isExpanded = slicePath.classed("expanded");
          allPaths.classed("expanded", false)
            .transition().duration(300)
            .attr("transform", "translate(0,0)");

          if (!isExpanded) {
            const [cx, cy] = arc.centroid(matchedArc);
            const angle = Math.atan2(cy, cx);
            const distance = 15;
            const xOffset = Math.cos(angle) * distance;
            const yOffset = Math.sin(angle) * distance;

            slicePath.classed("expanded", true)
              .transition().duration(300)
              .attr("transform", `translate(${xOffset}, ${yOffset})`);
          }
        });
    }

    if (innerRadiusRatio > 0) {
      const sliceGroups = pieGroup.selectAll(".slice-group")
        .data(arcs)
        .enter()
        .append("g")
        .attr("class", "slice-group");

      sliceGroups.append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.label))
        .attr("stroke", "#fff")
        .style("stroke-width", "2px");

      sliceGroups.append("text")
        .attr("class", "slice-percentage")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("fill", "#fff");

      updateOutsideLabels(arcs);

      if (showCenterTotal && !isSemiCircle) {
        const totalValue = d3.sum(data, d => d.value);
        pieGroup.append("text")
          .attr("class", "center-text")
          .attr("text-anchor", "middle")
          .attr("alignment-baseline", "middle")
          .style("font-size", "35px")
          .attr("dy", "-0.5em")
          .text("Total");
        pieGroup.append("text")
          .attr("class", "center-text")
          .attr("text-anchor", "middle")
          .attr("alignment-baseline", "middle")
          .style("font-size", "24px")
          .style("font-weight", "bold")
          .attr("dy", "1em")
          .text(totalValue + " interns");
      }

      sliceGroups
        .on("mouseover", function(event, d) {
          sliceGroups.selectAll("path")
            .transition().duration(200)
            .style("opacity", e => (e.data.label === d.data.label ? 1 : 0.3));
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip.html(`<strong>${d.data.label}</strong>: ${d.data.value} interns`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mousemove", function(event) {
          tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
          sliceGroups.selectAll("path").transition().duration(200).style("opacity", 1);
          tooltip.transition().duration(500).style("opacity", 0);
        });

    } else {
      const paths = pieGroup.selectAll("path")
        .data(arcs, d => d.data.label)
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.label))
        .attr("stroke", "#fff")
        .style("stroke-width", "2px")
        .style("opacity", 1);

      updateOutsideLabels(arcs);

      paths
        .on("mouseover", function(event, d) {
          pieGroup.selectAll("path")
            .transition().duration(200)
            .style("opacity", e => (e.data.label === d.data.label ? 1 : 0.3));
          tooltip.transition().duration(200).style("opacity", 1);
          tooltip.html(`<strong>${d.data.label}</strong>: ${d.data.value} interns`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
          pieGroup.selectAll("path").transition().duration(200).style("opacity", 1);
          tooltip.transition().duration(500).style("opacity", 0);
        })
        .on("click", function(event, d) {
          const slicePath = d3.select(this);
          const isExpanded = slicePath.classed("expanded");
          pieGroup.selectAll("path.expanded")
            .classed("expanded", false)
            .transition().duration(300)
            .attr("transform", "translate(0,0)");

          if (!isExpanded) {
            const [cx, cy] = arc.centroid(d);
            const angle = Math.atan2(cy, cx);
            const distance = 15;
            const xOffset = Math.cos(angle) * distance;
            const yOffset = Math.sin(angle) * distance;
            slicePath.classed("expanded", true)
              .transition().duration(300)
              .attr("transform", `translate(${xOffset}, ${yOffset})`);
          }
        });
    }
  }

};


window.renderLineChart = ChartRenderers.renderLineChart;
window.renderAreaChart = ChartRenderers.renderAreaChart;
window.renderColumnChart = ChartRenderers.renderColumnChart;
window.renderBarChart = ChartRenderers.renderBarChart;
window.renderPieChart = ChartRenderers.renderPieChart;
// renderScatterChart
// renderBubble Chart
