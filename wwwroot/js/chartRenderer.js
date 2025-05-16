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

const ChartRenderers = {
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
          svg.select(".y.axis")
            .style("opacity", 0)
            .remove();

          svg.select(".grid")
            .style("opacity", 0)
            .remove();

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
        d.active = !d.active;
        d3.select(this).select("text")
          .transition()
          .style("text-decoration", d.active ? "none" : "line-through");
        d3.select(this).select("circle")
          .transition()
          .style("fill-opacity", d.active ? 1 : 0.3);
        const activeKeys = seriesState.filter(s => s.active).map(s => s.key);
      
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
 
  renderColumnChart({
    data = [],
    containerId = "",
    title = "",
    xLabel = "",
    yLabel = "",
    yUnit = "",
    xField = "",
    yField = "",
    series = [],
    groups,
    colors = {},
    showLabels = false,
    stacked = false,
    percentage = false,
    margins = ChartHelpers.defaultMargins,
    width = 1400,
    height = 900
  }) {
    d3.select(containerId).select("svg").remove();
  
    const dims = ChartHelpers.getDimensions(margins, width + 50, height);
    const svg = ChartHelpers.createSVG(containerId, margins, width, height);
  
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
        let activeKeys = [];
    
        if (groups) {
          groups.forEach(group => {
            group.series.forEach(series => {
              if (toggleState.find(ts => ts.key === series)?.active) {
                activeKeys.push(series);
              }
            });
          });
        } else {
          activeKeys = toggleState.filter(ts => ts.active).map(ts => ts.key);
        }
    
        const total = activeKeys.reduce((sum, key) => sum + (d[key] || 0), 0);
    
        activeKeys.forEach(key => {
          const val = d[key] || 0;
          d[`_${key}_percent`] = total > 0 ? (val / total) * 100 : 0;
        });
    
        toggleState
          .filter(ts => !activeKeys.includes(ts.key))
          .forEach(ts => {
            delete d[`_${ts.key}_percent`];
          });
      });
    }
  
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

if (stacked && percentage) {
  yScale.domain([0, 100]);
  yAxis.call(d3.axisLeft(yScale).tickValues([0, 25, 50, 75, 100]));
} else {
  yScale.domain([0, maxVal + 5]).nice();
  yAxis.call(d3.axisLeft(yScale).ticks(8));
}

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
                  .attr("data-category", d[xField])
                  .attr("x",     groupX)
                  .attr("width", outerScale.bandwidth())
                  .attr("fill",  colors[s] || "black")
                  .attr("y",      isInitialDraw ? rectY : yScale(cumulative))
                  .attr("height", isInitialDraw ? rectHeight : 0)
                  .on("mouseover", function(event) {
                    const currentKey = d3.select(this).attr("data-series");
                  
                    d3.selectAll(".column")
                      .transition()
                      .duration(200)
                      .style("opacity", 0.2);
                  
                    d3.selectAll(`.column[data-series='${currentKey}']`)
                      .transition()
                      .duration(200)
                      .style("opacity", 1);
                  
                    const total = activeSeries.reduce((sum, key) => sum + (d[key] || 0), 0);
                    const value = d[currentKey] || 0;

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
                  rect
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
                  .attr("y", isInitialDraw ? yScale(value) : yScale(0))
                  .attr("height", isInitialDraw ? (yScale(0) - yScale(value)) : 0)
                  .on("mouseover", function(event) {
                    const currentKey = d3.select(this).attr("data-series");
                  
                    d3.selectAll(".column")
                      .transition()
                      .duration(200)
                      .style("opacity", 0.2);
                  
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
                  rect
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
              const value = percentage ? d[`_${key}_percent`] || 0 : d[key] || 0;
              const rectY = yScale(cumulative + value);
              const rectHeight = yScale(cumulative) - yScale(cumulative + value);
              const rect = groupSel.append("rect")
                .attr("class", `column rect-${key.replace(/\s+/g, "-")}`)
                .attr("data-series", key)
                .attr("data-category", d[xField])
                .attr("x", 0)
                .attr("width", xScale.bandwidth())
                .attr("fill", colors[key] || "black")
                .attr("y", isInitialDraw ? rectY : yScale(cumulative))
                .attr("height", isInitialDraw ? rectHeight : 0)
                .on("mouseover", function(event) {
                  const bar = d3.select(this);
                  const currentKey = bar.attr("data-series");
                  const currentCategory = bar.attr("data-category");
                  const value = d[currentKey] || 0;
                  const color = colors[currentKey] || "black";
                  const total = activeKeys.reduce((sum, key) => sum + (d[key] || 0), 0);
                
                  d3.selectAll(".column")
                    .transition()
                    .duration(200)
                    .style("opacity", 0.2);
                
                  if (percentage) {
                    d3.selectAll(`.column[data-category='${currentCategory}']`)
                      .transition()
                      .duration(200)
                      .style("opacity", 1);
                  } else {
                    d3.selectAll(`.column[data-series='${currentKey}']`)
                      .transition()
                      .duration(200)
                      .style("opacity", 1);
                  }
                
                  let tooltipHtml = "";
                
                  if (percentage) {
                    const rows = activeKeys.map(key => {
                      const val = d[key] || 0;
                      const pct = d[`_${key}_percent`] || 0;
                      const c = colors[key] || "black";
                      return `
                        <div style="margin: 2px 0;">
                          <span style="color:${c}; font-weight: bold;">${key}:</span>
                          <strong>${formatValue(val)}</strong> (${pct.toFixed(0)}%)
                        </div>`;
                    });
                
                    tooltipHtml = `
                      <div style="font-weight: bold; margin-bottom: 6px;">${d[xField]}</div>
                      ${rows.join("")}
                    `;
                  } else {
                    tooltipHtml = `
                      <div style="font-weight: bold; margin-bottom: 4px;">${d[xField]}</div>
                      <div>${currentKey}: ${formatValue(value)}${yUnit ? " " + yUnit : ""}</div>
                      <div style="margin-top: 4px;">Total: ${formatValue(total)}${yUnit ? " " + yUnit : ""}</div>
                    `;
                  }
                
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
                rect
                  .attr("y", rectY)
                  .attr("height", rectHeight);
              }

              if (percentage && rectHeight > 12) {
                const percent = d[`_${key}_percent`] || 0;
                groupSel.append("text")
                  .attr("x", xScale.bandwidth() / 2)
                  .attr("y", rectY + rectHeight / 2 + 4)
                  .attr("text-anchor", "middle")
                  .attr("class", "bar-label")
                  .style("font-size", "12px")
                  .style("font-weight", "bold")
                  .style("fill", "#000")
                  .text(`${percent.toFixed(0)}%`);
              }
              
              
               else if (!percentage && rectHeight > 12 && value > 0) {
                groupSel.append("text")
                  .attr("x", xScale.bandwidth() / 2)
                  .attr("y", rectY + rectHeight / 2 + 4)
                  .attr("text-anchor", "middle")
                  .attr("class", "bar-label")
                  .style("font-size", "12px")
                  .style("font-weight", "bold")
                  .style("fill", "#000")
                  .text(formatValue(value));
              }
        
              cumulative += value;
            });
        
            if (!percentage && cumulative > 0) {
              groupSel.append("text")
                .attr("x", xScale.bandwidth() / 2)
                .attr("y", yScale(cumulative) - 8)
                .attr("text-anchor", "middle")
                .attr("class", "column-total-label")
                .style("font-size", "14px")
                .style("font-weight", "bold")
                .style("fill", "#000")
                .text(formatValue(cumulative));
            }
          });
        } else {
          const innerScale = d3.scaleBand()
            .domain(activeKeys)
            .range([0, xScale.bandwidth()])
            .padding(0.2);
            categoryGroups.each(function(d) {
              const groupSel = d3.select(this);
            
              groupSel.insert("rect", ":first-child")
                .attr("class", "hover-highlight")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", xScale.bandwidth())
                .attr("height", dims.height - 1)
                .attr("fill", "#0022ff")
                .attr("opacity", 0)
                .style("pointer-events", "none");

            
              activeKeys.forEach(key => {
                const value = d[key] || 0;
            
                const rect = groupSel.append("rect")
                  .attr("class", `column rect-${key.replace(/\s+/g, "-")}`)
                  .attr("data-series", key)
                  .attr("data-category", d[xField])
                  .attr("x", innerScale(key))
                  .attr("width", innerScale.bandwidth())
                  .attr("fill", colors[key] || "black")
                  .attr("y", isInitialDraw ? yScale(value) : yScale(0))
                  .attr("height", isInitialDraw ? (yScale(0) - yScale(value)) : 0)
                  .on("mouseover", function(event) {
                    const bar = d3.select(this);
                    const currentKey = bar.attr("data-series");
                    const currentCategory = bar.attr("data-category");
            
                    d3.selectAll(".column")
                      .transition().duration(200)
                      .style("opacity", 0.2);
            
                    d3.selectAll(`.column[data-series='${currentKey}']`)
                      .transition().duration(200)
                      .style("opacity", 1);
            
                    d3.select(this.parentNode).select(".hover-highlight")
                      .raise()
                      .transition().duration(200)
                      .style("opacity", 0.2);
            
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
                    d3.selectAll(".column")
                      .transition().duration(200)
                      .style("opacity", 1);
            
                    d3.selectAll(".hover-highlight")
                      .transition().duration(200)
                      .style("opacity", 0);
            
                    ChartHelpers.removeTooltip();
                  });
            
                if (!isInitialDraw) {
                  rect
                    .attr("y", yScale(value))
                    .attr("height", yScale(0) - yScale(value));
                }
              });
            });
            
        }
      }
    }
  
    drawColumns();
    isInitialDraw = false;
  
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
      
        d3.selectAll(".column").transition().duration(200).style("opacity", 0.2);
      
        d3.selectAll(`.column[data-series='${seriesKey}']`).transition().duration(200).style("opacity", 1);
      })
      .on("mouseout", function() {
        d3.selectAll(".column").transition().duration(200).style("opacity", 1);
        d3.selectAll(".legend-item").transition().duration(200).style("opacity", 1);
        ChartHelpers.removeTooltip();
      })      
      .on("click", function(event, d) {
        d.active = !d.active;

        d3.select(this).select("text")
          .transition()
          .style("text-decoration", d.active ? "none" : "line-through");

        d3.select(this).select("circle")
          .transition()
          .style("fill-opacity", d.active ? 1 : 0.3);
    
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
          if (stacked && percentage) {
            data.forEach(d => {
              let activeKeys = [];
          
              if (groups) {
                groups.forEach(group => {
                  group.series.forEach(series => {
                    if (toggleState.find(ts => ts.key === series)?.active) {
                      activeKeys.push(series);
                    }
                  });
                });
              } else {
                activeKeys = toggleState.filter(ts => ts.active).map(ts => ts.key);
              }
          
              const total = activeKeys.reduce((sum, key) => sum + (d[key] || 0), 0);
          
              activeKeys.forEach(key => {
                const val = d[key] || 0;
                d[`_${key}_percent`] = total > 0 ? (val / total) * 100 : 0;
              });
          
              toggleState
                .filter(ts => !activeKeys.includes(ts.key))
                .forEach(ts => {
                  delete d[`_${ts.key}_percent`];
                });
            });
          }
          
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
    
          if (!(stacked && percentage)) {
            yScale.domain([0, maxVal + 5]).nice();
            yAxis.transition().duration(750).call(d3.axisLeft(yScale).ticks(8));
          } else {
            yAxis.transition()
              .duration(750)
              .call(d3.axisLeft(yScale).tickValues([0, 25, 50, 75, 100]));
          }          

          yAxis.style("opacity", 1);
    
          yAxis.transition()
  .duration(750)
  .call(stacked && percentage
    ? d3.axisLeft(yScale).tickValues([0, 25, 50, 75, 100])
    : d3.axisLeft(yScale).ticks(8)
  );

          yAxis.select(".domain").remove();
    
let grid = svg.select(".grid");
if (grid.empty()) {
  grid = svg.append("g")
    .attr("class", "grid")
    .style("opacity", 0.1);
}

grid
  .transition()
  .duration(750)
  .style("opacity", 0.1)
  .call(
    (stacked && percentage
      ? d3.axisLeft(yScale).tickValues([0, 25, 50, 75, 100])
      : d3.axisLeft(yScale).ticks(8)
    )
    .tickSize(-dims.width)
    .tickFormat("")
  )
  .on("start", function () { d3.select(this).selectAll(".domain").remove(); })
  .on("end", function () { d3.select(this).selectAll(".domain").remove(); });

    
        } else {
          yAxis.transition()
            .duration(750)
            .style("opacity", 0);
          svg.selectAll(".grid")
            .transition()
            .duration(750)
            .style("opacity", 0);
        }
    
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
  
    let xOffset = 0;
    legendItems.attr("transform", function() {
      const itemWidth = this.getBBox().width + 20;
      const transform = `translate(${xOffset}, 0)`;
      xOffset += itemWidth;
      return transform;
    });
  
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
    data = [],
    containerId = "",
    title = "",
    xLabel = "",
    yLabel = "",
    xUnit = "",
    yField = "",
    series = [],
    colors = {},
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
    const initialMax = d3.max(data, d =>
      stacked
        ? series.reduce((sum, key) => sum + (d[key] || 0), 0)
        : d3.max(series, key => d[key] || 0)
    ) || 10;
    xScale.domain([0, initialMax + 5]).nice();
  
    let xAxisGroup = svg.append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0, ${dims.height})`)
      .call(d3.axisBottom(xScale).tickSizeOuter(0))
      .call(g => g.select(".domain").remove());
  
    svg.append("g")
      .attr("class", "y axis")
      .call(d3.axisLeft(yScale).tickSizeOuter(0))
      .call(g => g.select(".domain").remove());
  
    let gridAxisGroup = svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0, ${dims.height})`)
      .style("opacity", 0.1)
      .call(d3.axisBottom(xScale).tickSize(-dims.height).tickFormat(""))
      .call(g => g.select(".domain").remove());
  
    const barsGroup = svg.append("g").attr("class", "bars-group");
  
    function safeClass(key) {
      return key.replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    }
  
    function pillPath(widthVal, heightVal, isRounded = true) {
      if (!isRounded) return `M0,0 H${widthVal} V${heightVal} H0 Z`;
      const r = Math.min(heightVal / 2, widthVal);
      if (widthVal <= 0) return '';
      return `M0,0 H${widthVal - r} A${r},${r} 0 0 1 ${widthVal},${r}
              V${heightVal - r} A${r},${r} 0 0 1 ${widthVal - r},${heightVal} H0 Z`;
    }
  
    function drawBars() {
      barsGroup.selectAll(".category-group").remove();
      svg.selectAll(".bar-label").remove();
  
      const activeSeries = seriesState.filter(s => s.active).map(s => s.key);
  
      if (activeSeries.length === 0) {
        svg.select(".x.axis").remove();
        svg.select(".grid").remove();
        return;
      }
  
      const activeData = data.map(d => {
        const entry = { ...d };
        Object.keys(entry).forEach(k => {
          if (k !== yField && !activeSeries.includes(k)) delete entry[k];
        });
        return entry;
      });
  
      const maxVal = stacked
        ? d3.max(activeData, d => activeSeries.reduce((sum, key) => sum + (d[key] || 0), 0))
        : d3.max(activeData, d => d3.max(activeSeries, key => d[key] || 0));
  
      xScale.domain([0, maxVal + 5]).nice();
      const xTicks = xScale.ticks(10);
  
      if (svg.select(".x.axis").empty()) {
        xAxisGroup = svg.append("g")
          .attr("class", "x axis")
          .attr("transform", `translate(0, ${dims.height})`);
      }
      xAxisGroup.transition()
        .duration(750)
        .call(d3.axisBottom(xScale).tickValues(xTicks).tickSizeOuter(0))
        .on("start", () => xAxisGroup.select(".domain").remove())
        .on("end", () => xAxisGroup.select(".domain").remove());
  
      if (svg.select(".grid").empty()) {
        gridAxisGroup = svg.append("g")
          .attr("class", "grid")
          .attr("transform", `translate(0, ${dims.height})`)
          .style("opacity", 0.1);
      }
      gridAxisGroup.transition()
        .duration(750)
        .call(d3.axisBottom(xScale).tickValues(xTicks).tickSize(-dims.height).tickFormat(""))
        .on("start", () => gridAxisGroup.select(".domain").remove())
        .on("end", () => gridAxisGroup.select(".domain").remove());
  
      const categoryGroups = barsGroup.selectAll(".category-group")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "category-group")
        .attr("transform", d => `translate(0, ${yScale(d[yField])})`);
  
      if (stacked) {
        categoryGroups.each(function (d) {
          let offset = 0;
          activeSeries.forEach(key => {
            const val = d[key] || 0;
            const cls = safeClass(key);
            const g = d3.select(this);
            g.append("path")
              .datum({ ...d, seriesKey: key })
              .attr("class", `bar bar-${cls}`)
              .attr("transform", `translate(${offset},0)`)
              .attr("d", pillPath(xScale(val), yScale.bandwidth(), false))
              .attr("fill", colors[key] || "black")
              .on("mouseover", function(event, d) {
                const currentKey = d.seriesKey;
                const val = d[currentKey] || 0;
              
                d3.selectAll(".bar").transition().duration(200).style("opacity", 0.2);
              
                d3.selectAll(`.bar-${safeClass(currentKey)}`).transition().duration(200).style("opacity", 1);
              
                const tooltipHtml = `
                  <strong>${d[yField]}</strong><br/>
                  <span style="color:${colors[currentKey] || "black"}">&#9679;</span>
                  ${currentKey}: <strong>${formatValue(val)}${xUnit ? " " + xUnit : ""}</strong>
                `;
                ChartHelpers.showTooltip(event, tooltipHtml);
              })
              .on("mousemove", ChartHelpers.moveTooltip)
              .on("mouseout", function() {
                d3.selectAll(".bar").transition().duration(200).style("opacity", 1);
                ChartHelpers.removeTooltip();
              });              
            if (showLabels && val > 0) {
              g.append("text")
                .attr("class", `bar-label label-${cls}`)
                .attr("x", offset + xScale(val) / 2)
                .attr("y", yScale.bandwidth() / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", "middle")
                .style("fill", "#fff")
                .style("font-weight", "bold")
                .text(formatValue(val));
            }
            offset += xScale(val);
          });
        });
      } else {
        const subScale = d3.scaleBand()
          .domain(activeSeries)
          .range([0, yScale.bandwidth()])
          .paddingInner(0.2);
  
        activeSeries.forEach(key => {
          const cls = safeClass(key);
          categoryGroups.selectAll(`.bar-${cls}`)
            .data(d => [{ ...d, seriesKey: key }])
            .enter()
            .append("path")
            .attr("class", `bar bar-${cls}`)
            .attr("transform", d => `translate(0,${subScale(key)})`)
            .attr("d", d => pillPath(xScale(d[key] || 0), subScale.bandwidth()))
            .attr("fill", colors[key] || "black")
            .on("mouseover", function(event, d) {
              const currentKey = d.seriesKey;
              const val = d[currentKey] || 0;
            
              d3.selectAll(".bar").transition().duration(200).style("opacity", 0.2);
            
              d3.selectAll(`.bar-${safeClass(currentKey)}`).transition().duration(200).style("opacity", 1);
            
              const tooltipHtml = `
                <strong>${d[yField]}</strong><br/>
                <span style="color:${colors[currentKey] || "black"}">&#9679;</span>
                ${currentKey}: <strong>${formatValue(val)}${xUnit ? " " + xUnit : ""}</strong>
              `;
              ChartHelpers.showTooltip(event, tooltipHtml);
            })
            .on("mousemove", ChartHelpers.moveTooltip)
            .on("mouseout", function() {
              d3.selectAll(".bar").transition().duration(200).style("opacity", 1);
              ChartHelpers.removeTooltip();
            })            
            .transition()
            .duration(750)
            .attr("d", d => pillPath(xScale(d[key] || 0), subScale.bandwidth()));
  
          if (showLabels) {
            categoryGroups.append("text")
              .datum(d => ({ ...d, seriesKey: key }))
              .attr("class", `bar-label label-${cls}`)
              .attr("x", d => xScale(d[key] || 0) + 5)
              .attr("y", subScale(key) + subScale.bandwidth() / 2)
              .attr("dy", "0.35em")
              .style("font-weight", "bold")
              .text(d => formatValue(d[key] || 0));
          }
        });
      }
    }
  
    drawBars();
  
    if (title) svg.append("text")
      .attr("x", dims.width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "22px")
      .style("font-weight", "bold")
      .text(title);
  
    if (xLabel) svg.append("text")
      .attr("class", "x label")
      .attr("text-anchor", "middle")
      .attr("x", dims.width / 2)
      .attr("y", dims.height + margins.bottom - 40)
      .text(`${xLabel}${xUnit ? ` (${xUnit})` : ''}`);
  
    if (yLabel) svg.append("text")
      .attr("class", "y label")
      .attr("transform", "rotate(-90)")
      .attr("x", -dims.height / 2)
      .attr("y", -margins.left + 20)
      .style("font-size", "14px")
      .text(yLabel);  
  
    const legendGroup = svg.append("g").attr("class", "legend-group");
    const legendItems = legendGroup.selectAll(".legend-item")
      .data(seriesState)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .style("cursor", "pointer")
      .on("mouseover", function(event) {
        const seriesKey = d3.select(this).datum().key;
      
        d3.selectAll(".bar").transition().duration(200).style("opacity", 0.2);
      
        d3.selectAll(`.bar-${safeClass(seriesKey)}`).transition().duration(200).style("opacity", 1);
        d3.select(this).transition().duration(200).style("opacity", 1);
      })
      .on("mouseout", function() {
        d3.selectAll(".bar").transition().duration(200).style("opacity", 1);
        ChartHelpers.removeTooltip();
      })
      .on("click", function(event, d) {
        d.active = !d.active;
      
        d3.select(this).select("text")
          .transition().style("text-decoration", d.active ? "none" : "line-through");
      
        d3.select(this).select("circle")
          .transition().style("fill-opacity", d.active ? 1 : 0.7);
      
        drawBars();
      });
      
  
    legendItems.append("circle")
      .attr("r", 6)
      .attr("cx", 0)
      .attr("cy", 0)
      .style("fill", d => colors[d.key] || "black");
    legendItems.append("text")
      .attr("x", 12)
      .attr("y", 4)
      .style("font-size", "14px")
      .text(d => d.key);
  
    if (!stacked) {
      const lh = 24;
      legendItems.attr("transform", (d,i) => `translate(0, ${i * lh})`);
      const bb = legendGroup.node().getBBox();
      legendGroup.insert("rect", ":first-child")
        .attr("x", bb.x - 10)
        .attr("y", bb.y - 10)
        .attr("width", bb.width + 20)
        .attr("height", bb.height + 20)
        .attr("fill", "#fff")
        .attr("stroke", "#d3d3d3")
        .attr("rx", 5).attr("ry", 5);
      legendGroup.attr("transform", `translate(${dims.width - bb.width - 50}, 75)`);
    } else {
      let off = 0;
      legendItems.attr("transform", function(d,i) {
        const w = this.getBBox().width;
        const t = `translate(${off}, 0)`;
        off += w + 20;
        return t;
      });
      const lb = legendGroup.node().getBBox();
      const cx = (dims.width - lb.width)/2;
      legendGroup.attr("transform", `translate(${cx}, ${dims.height + 70})`);
    }
  },

  renderPieChart({
    data = [],
    containerId = "",
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
        const textElement = pieGroup.append("text")
          .attr("class", "center-title")
          .attr("text-anchor", "middle")
          .style("font-size", "22px")
          .style("font-weight", "bold");
        
        const titleLines = title.split("_");
        titleLines.forEach((line, i) => {
          textElement.append("tspan")
            .attr("x", 0)
            .attr("dy", i === 0 ? "0" : "1.2em")
            .text(line);
        });
        
        setTimeout(() => {
          const bbox = textElement.node().getBBox();
          
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

          const labelOffset = 5;
          const adjustedX = midAngle < Math.PI ? x + labelOffset : x - labelOffset;

          pieGroup.append("text")
            .attr("class", "slice-role")
            .attr("transform", `translate(${adjustedX}, ${y})`)

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

            const labelOffset = 5;
            const adjustedX = side === "right" ? pos.x + labelOffset : pos.x - labelOffset;

            pieGroup.append("text")
              .attr("class", "slice-role")
              .attr("transform", `translate(${adjustedX}, ${pos.y})`)

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
          tooltip.transition().duration(750).style("opacity", 0);
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
          tooltip.transition().duration(750).style("opacity", 0);
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
          tooltip.transition().duration(750).style("opacity", 0);
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
  },

  renderScatterChart({
    data = [],
    containerId = "",
    title = "",
    xLabel = "",
    yLabel = "",
    xUnit = "",
    yUnit = "",
    xField = "",
    yField = "",
    categoryField = "",
    colors = {},
    shapeMap = {},
    enableJitter = false,
    jitterAmount = 5,
    forceCategoricalX = false,
    margins = { top: 60, right: 90, bottom: 115, left: 90 },
    width = 1400,
    height = 900,
  }) {
    const dims = ChartHelpers.getDimensions(margins, width, height);
    const svg = ChartHelpers.createSVG(containerId, margins, width, height);
  
    const isCategoricalX = forceCategoricalX || typeof data[0][xField] === "string";

    if (isCategoricalX) {
      data.forEach(d => { d[xField] = String(d[xField]); });
    }
    
  
    let xScale;
    if (isCategoricalX) {
      const xCategories = [...new Set(data.map(d => d[xField]))];
      xScale = d3.scalePoint().domain(xCategories).range([0, dims.width]).padding(0.5);
    } else {
      const xExtent = d3.extent(data, d => d[xField]);
      xScale = d3.scaleLinear().domain(xExtent).range([0, dims.width]).nice();
    }
  
    const yExtent = d3.extent(data, d => d[yField]);
    const yScale = d3.scaleLinear().domain(yExtent).range([dims.height, 0]).nice();
  
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0, ${dims.height})`)
      .call(isCategoricalX ? d3.axisBottom(xScale) : d3.axisBottom(xScale).ticks(10))
      .call(g => g.select(".domain").remove());
  
    svg.append("g")
      .attr("class", "y axis")
      .call(d3.axisLeft(yScale))
      .call(g => g.select(".domain").remove());
  
    svg.append("g")
      .attr("class", "grid")
      .style("opacity", 0.1)
      .call(d3.axisLeft(yScale).tickSize(-dims.width).tickFormat(""))
      .call(g => g.select(".domain").remove());
  
    const tooltip = ChartHelpers.createTooltip();
    const shape = d3.symbol().size(64);
    const categories = Array.from(new Set(data.map(d => d[categoryField])));

const highlightDot = svg.append("path")
.attr("class", "highlight-dot")
.attr("fill", "none")
.style("pointer-events", "none")
.style("display", "none");

  
    svg.selectAll(".dot")
      .data(data)
      .enter()
      .append("path")
      .attr("class", "dot")
      .attr("transform", d => {
        const jitterX = enableJitter && isCategoricalX
          ? (Math.random() - 0.5) * xScale.step() * 0.5
          : enableJitter
            ? (Math.random() - 0.5) * jitterAmount
            : 0;
        const jitterY = enableJitter ? (Math.random() - 0.5) * jitterAmount : 0;
      
        d._jitterX = jitterX;
        d._jitterY = jitterY;
      
        const xPos = (isCategoricalX ? xScale(d[xField]) : xScale(d[xField])) + jitterX;
        const yPos = yScale(d[yField]) + jitterY;
        return `translate(${xPos}, ${yPos})`;
      })      
      .attr("d", d => shape.type(enableJitter ? d3.symbolCircle : (shapeMap[d[categoryField]] || d3.symbolCircle))())
      .attr("fill", d => colors[d[categoryField]] || "gray")
      .attr("opacity", 0.7)
      .on("mouseover", function(event, d) {
        const currentCategory = d[categoryField];
      
        svg.selectAll(".dot")
          .transition()
          .duration(200)
          .style("opacity", o => o[categoryField] === currentCategory ? 1 : 0.1);
      
        tooltip.html(
            enableJitter
              ? `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                   <span style="width: 12px; height: 12px; background: ${colors[d[categoryField]] || 'black'}; border-radius: 50%; display: inline-block;"></span>
                   <strong>${d[categoryField]}</strong>
                 </div>
                 <div>Measurement: ${(+d[yField]).toFixed(3)}</div>`
              : `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                   <span style="width: 12px; height: 12px; background: ${colors[d[categoryField]] || 'black'}; border-radius: 50%; display: inline-block;"></span>
                   <strong>${d[categoryField]}</strong>
                 </div>
                 ${xField}: <strong>${d[xField]} ${xUnit}</strong><br/>
                 ${yField}: <strong>${(+d[yField])} ${yUnit}</strong>`
          )
          .style("display", "block")
          .style("left", (event.pageX + 12) + "px")
          .style("top", (event.pageY - 28) + "px");
      
        const jitterX = d._jitterX || 0;
        const jitterY = d._jitterY || 0;
        const xPos = (isCategoricalX ? xScale(d[xField]) : xScale(d[xField])) + jitterX;
        const yPos = yScale(d[yField]) + jitterY;
      
        highlightDot
          .attr("transform", `translate(${xPos}, ${yPos})`)
          .attr("d", d3.symbol()
            .type(enableJitter ? d3.symbolCircle : (shapeMap[d[categoryField]] || d3.symbolCircle))
            .size(196)
          )
          .attr("fill", colors[d[categoryField]] || "gray")
          .style("display", "block")
          .style("opacity", 1);
      })
      
      .on("mousemove", event => {
        tooltip
          .style("left", (event.pageX + 12) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      
      .on("mouseout", function() {
        svg.selectAll(".dot")
          .transition()
          .duration(200)
          .style("opacity", 0.7);
      
        tooltip.style("display", "none");
        highlightDot.style("display", "none");
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
  
    svg.append("text")
      .attr("x", dims.width / 2)
      .attr("y", dims.height + margins.bottom - (enableJitter ? 40 : 60))
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text(xLabel);
  
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -dims.height / 2)
      .attr("y", -margins.left + 40)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text(yLabel);
  
    if (!enableJitter) {
    const categoryState = categories.map(key => ({ key, active: true }));
    const legendGroup = svg.append("g").attr("class", "legend-group");
  
    const legendItems = legendGroup.selectAll(".legend-item")
      .data(categoryState)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        svg.selectAll(".dot")
          .transition().duration(200)
          .style("opacity", o => o[categoryField] === d.key ? 1 : 0.1);
      })
      .on("mouseout", function() {
        svg.selectAll(".dot")
          .transition().duration(200)
          .style("opacity", d => categoryState.find(c => c.key === d[categoryField])?.active ? 0.7 : 0);
      })
      .on("click", function(event, d) {
        d.active = !d.active;
      
        d3.select(this)
          .select("text")
          .transition()
          .style("text-decoration", d.active ? "none" : "line-through");
      
        d3.select(this)
          .select("path")
          .transition()
          .style("fill-opacity", d.active ? 1 : 0.3);
      
        const activeCategories = categoryState.filter(c => c.active).map(c => c.key);
        const filteredData = data.filter(d => activeCategories.includes(d[categoryField]));
      
        if (filteredData.length === 0) {
          svg.select(".x.axis").transition().duration(750).style("opacity", 0);
          svg.select(".y.axis").transition().duration(750).style("opacity", 0);
          svg.selectAll(".grid").transition().duration(750).style("opacity", 0);
          svg.selectAll(".dot").transition().duration(500).style("opacity", 0).style("display", "none");
          return;
        }
      
        svg.select(".x.axis").style("opacity", 1);
        svg.select(".y.axis").style("opacity", 1);
        svg.selectAll(".grid").style("opacity", 0.1);
      
        if (!isCategoricalX) {
          const newX = d3.extent(filteredData, d => d[xField]);
          xScale.domain(newX).nice();
        }
      
        const newY = d3.extent(filteredData, d => d[yField]);
        yScale.domain(newY).nice();
      
        svg.select(".x.axis")
          .transition()
          .duration(750)
          .on("start", function() {
            d3.select(this).selectAll(".domain").remove();
          })
          .call(isCategoricalX ? d3.axisBottom(xScale) : d3.axisBottom(xScale).ticks(10))
          .on("end", function() {
            d3.select(this).selectAll(".domain").remove();
          });
      
        svg.select(".y.axis")
          .transition()
          .duration(750)
          .on("start", function() {
            d3.select(this).selectAll(".domain").remove();
          })
          .call(d3.axisLeft(yScale))
          .on("end", function() {
            d3.select(this).selectAll(".domain").remove();
          });
      
        let gridGroup = svg.select(".grid");
        if (gridGroup.empty()) {
          gridGroup = svg.append("g")
            .attr("class", "grid")
            .style("opacity", 0.1);
        }
      
        gridGroup.transition()
          .duration(750)
          .on("start", function() {
            d3.select(this).selectAll(".domain").remove();
          })
          .call(d3.axisLeft(yScale).tickSize(-dims.width).tickFormat(""))
          .on("end", function() {
            d3.select(this).selectAll(".domain").remove();
          });
      
        svg.selectAll(".dot")
          .transition()
          .duration(750)
          .attr("transform", d => {
            const jitterX = enableJitter
              ? isCategoricalX
                ? (Math.random() - 0.5) * xScale.step() * 0.6
                : (Math.random() - 0.5) * jitterAmount
              : 0;
      
            const jitterY = enableJitter ? (Math.random() - 0.5) * jitterAmount : 0;
      
            const xPos = (isCategoricalX ? xScale(d[xField]) : xScale(d[xField])) + jitterX;
            const yPos = yScale(d[yField]) + jitterY;
            return `translate(${xPos}, ${yPos})`;
          })
          .style("opacity", d => activeCategories.includes(d[categoryField]) ? 0.7 : 0)
          .style("display", d => activeCategories.includes(d[categoryField]) ? null : "none");
      });
      
      
  
    legendItems.append("path")
      .attr("transform", `translate(0, 6)`)
      .attr("d", d => shape.type(enableJitter ? d3.symbolCircle : (shapeMap[d.key] || d3.symbolCircle))())
      .attr("fill", d => colors[d.key] || "gray");
  
    legendItems.append("text")
      .attr("x", 20)
      .attr("y", 10)
      .style("font-size", "14px")
      .text(d => d.key);
  
    let xOffset = 0;
    legendItems.attr("transform", function() {
      const itemWidth = this.getBBox().width + 30;
      const transform = `translate(${xOffset}, 0)`;
      xOffset += itemWidth;
      return transform;
    });
  
    const legendBBox = legendGroup.node().getBBox();
const legendOffset = xLabel ? 35 : 50;

legendGroup.attr(
  "transform",
  `translate(${(dims.width - legendBBox.width) / 2}, ${dims.height + margins.bottom - legendOffset})`
);
    }
  },
  
  renderBubbleChart({
    data = [],
    containerId = "",
    title = "",
    xLabel = "",
    yLabel = "",
    xUnit = "",
    yUnit = "",
    zUnit = "",
    xField = "",
    yField = "",
    zField = "",
    colorField = "",
    countryField = "",
    labelField = "",
    colors = {},
    referenceLines,
    packed = false,
    splitPacked = false,
    margins = { top: 60, right: 90, bottom: 115, left: 90 },
    width = 1400,
    height = 900,
    
  }) {
    const dims = ChartHelpers.getDimensions(margins, width, height);
    const svg = ChartHelpers.createSVG(containerId, margins, width, height);
  
    const highlightDot = svg.append("circle")
      .attr("class", "highlight-dot")
      .attr("r", 0)
      .attr("fill", "none")
      .style("pointer-events", "none")
      .style("display", "none");
  
    const sizeExtent = d3.extent(data, d => d[zField]);
    const sizeScale = d3.scaleSqrt()
      .domain(sizeExtent)
      .range([10, 60]);
  
    const tooltip = ChartHelpers.createTooltip();

    if (title) {
      svg.append("text")
        .attr("x", dims.width / 2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .style("font-size", "22px")
        .style("font-weight", "bold")
        .text(title);
    }
    
    if (packed) {
      const simulation = d3.forceSimulation(data)
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("charge", d3.forceManyBody().strength(0))
        .force("collision", d3.forceCollide(d => sizeScale(d[zField]) + 2));
    
      simulation.stop();
      for (let i = 0; i < 300; ++i) simulation.tick();
    
      data.forEach((d, i) => {
        d.initialX = d.x;
        d.initialY = d.y;
        d.offsetX = Math.random() * 2 * Math.PI;
        d.offsetY = Math.random() * 2 * Math.PI;
      });
    
      const uniqueKeys = Array.from(new Set(data.map(d => d[colorField])));
      const seriesState = uniqueKeys.map(key => ({ key, active: true }));
    
      const node = svg.selectAll("g.bubble-node")
        .data(data)
        .enter().append("g")
        .attr("class", "bubble-node");
    
      let highlightedNode = null;
    
      node.append("circle")
        .attr("r", d => sizeScale(d[zField]))
        .attr("fill", d => colorField ? (colors[d[colorField]] || "#ccc") : "#ccc")
        .attr("fill-opacity", 0.5)
        .attr("stroke", d => colorField ? (colors[d[colorField]] || "#ccc") : "#ccc")
        .attr("stroke-width", 1)
        .on("mouseover", function (event, d) {
          highlightedNode = d;
          const currentCategory = d[colorField];
    
          ChartHelpers.showTooltip(
            event,
            `<span style="color:${colors[currentCategory]}">&#9679;</span> ${currentCategory}</br>
             <strong>${d[labelField]}</strong>: ${d[zField]}${yUnit} ${zUnit}`
          );
    
          highlightDot
            .attr("r", sizeScale(d[zField]) + 4)
            .attr("fill", colors[currentCategory] || "#000")
            .attr("fill-opacity", 0.3)
            .attr("stroke", "none")
            .style("display", "block");
    
          d3.select(this)
            .attr("stroke", colors[currentCategory] || "#000")
            .attr("stroke-width", 2);
    
          node.transition().style("opacity", nodeData =>
            nodeData[colorField] === currentCategory ? 1 : 0.1
          );
        })
        .on("mouseout", function (event, d) {
          highlightedNode = null;
    
          ChartHelpers.removeTooltip();
          highlightDot.style("display", "none");
    
          d3.select(this)
            .attr("stroke", colors[d[colorField]] || "#ccc")
            .attr("stroke-width", 1);
    
          node.transition().style("opacity", nodeData => {
            const state = seriesState.find(s => s.key === nodeData[colorField]);
            return state && state.active ? 1 : 0;
          });
        });
    
      const texts = node.append("text")
        .text(d => d[labelField])
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .style("font-weight", "bold")
        .style("font-size", "12px")
        .style("visibility", "hidden");
    
      texts.each(function (d) {
        const radius = sizeScale(d[zField]);
        const textWidth = this.getBBox().width;
    
        if (textWidth < radius * 2) {
          d3.select(this).style("visibility", "visible");
        } else {
          d3.select(this).remove();
        }
      });
    
      const floatingSim = d3.forceSimulation(data)
        .velocityDecay(0.2)
        .force("x", d3.forceX(d => d.initialX).strength(0.01))
        .force("y", d3.forceY(d => d.initialY).strength(0.01))
        .force("collision", d3.forceCollide(d => sizeScale(d[zField]) + 2).strength(0.9))
        .on("tick", () => {
          node.attr("transform", d =>
            `translate(${d.x + (dims.width / 2 - width / 2)}, ${d.y + (dims.height / 2 - height / 2)})`
          );

          if (highlightedNode) {
            highlightDot
              .attr("cx", highlightedNode.x + (dims.width / 2 - width / 2))
              .attr("cy", highlightedNode.y + (dims.height / 2 - height / 2));
          }
        });
    
        const amplitude = 10;
        const frequency = 0.0015;
        
        d3.timer((elapsed) => {
          const activeData = data.filter(d => {
            const state = seriesState.find(s => s.key === d[colorField]);
            return state && state.active;
          });
        
          activeData.forEach(d => {
            d.targetX = d.initialX + Math.sin(elapsed * frequency + d.offsetX) * amplitude;
            d.targetY = d.initialY + Math.cos(elapsed * frequency + d.offsetY) * amplitude;
          });
        
          floatingSim
            .nodes(activeData)
            .force("x", d3.forceX(d => d.targetX).strength(0.01))
            .force("y", d3.forceY(d => d.targetY).strength(0.01))
            .alpha(0.1) 
            .restart();
        });
        
    
      const legendGroup = svg.append("g").attr("class", "legend-group");
    
      const legendItems = legendGroup.selectAll(".legend-item")
        .data(seriesState)
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .style("cursor", "pointer")
        .on("click", function (event, d) {
          d.active = !d.active;
    
          d3.select(this).select("text")
            .transition()
            .style("text-decoration", d.active ? "none" : "line-through");
          d3.select(this).select("circle")
            .transition()
            .style("fill-opacity", d.active ? 1 : 0.3);
    
          const activeData = data.filter(nodeData => {
            const state = seriesState.find(s => s.key === nodeData[colorField]);
            return state && state.active;
          });
    
          node.style("display", nodeData => {
            const state = seriesState.find(s => s.key === nodeData[colorField]);
            return state && state.active ? null : "none";
          });
    
          const canvasCenterX = width / 2;
          const canvasCenterY = height / 2;
    
          activeData.forEach(d => {
            d.initialX = canvasCenterX;
            d.initialY = canvasCenterY;
          });
    
          floatingSim
            .nodes(activeData)
            .force("x", d3.forceX(d => d.initialX).strength(0.05))
            .force("y", d3.forceY(d => d.initialY).strength(0.05))
            .alpha(0.9)
            .restart();
        })
        .on("mouseover", function (event, hoveredLegend) {
          node.transition().style("opacity", nodeData =>
            nodeData[colorField] === hoveredLegend.key ? 1 : 0.1
          );
        })
        .on("mouseout", function () {
          node.transition().style("opacity", nodeData => {
            const state = seriesState.find(s => s.key === nodeData[colorField]);
            return state && state.active ? 1 : 0;
          });
        });
    
      legendItems.append("circle")
        .attr("r", 6)
        .attr("cx", 0)
        .attr("cy", 0)
        .style("fill", d => colors[d.key] || "#ccc");
    
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
      legendGroup.attr("transform", `translate(${(dims.width - legendBBox.width) / 2}, ${dims.height + 40})`);
    
      return;
    }

    else if (splitPacked) {
      const grouped = d3.groups(data, d => d[colorField]);
      const containerBubbles = [];
    
      const containerRadiusScale = d3.scaleSqrt()
        .domain([0, d3.max(grouped, ([, values]) => d3.sum(values, d => d[zField]))])
        .range([80, 120]);
    
      grouped.forEach(([groupKey, values]) => {
        const totalSize = d3.sum(values, d => d[zField]);
        containerBubbles.push({
          key: groupKey,
          children: values,
          totalSize
        });
      });
    
      const simulation = d3.forceSimulation(containerBubbles)
        .force("x", d3.forceX(dims.width / 2).strength(0.6))
        .force("y", d3.forceY(dims.height / 2).strength(0.6))
        .force("charge", d3.forceManyBody().strength(-50))
        .force("collision", d3.forceCollide(d => containerRadiusScale(d.totalSize) + 2))
        .stop();
    
      for (let i = 0; i < 300; ++i) simulation.tick();
    
      const centerX = dims.width / 2;
      const centerY = dims.height / 2;
    
      containerBubbles.forEach(d => {
        d.initialX = centerX;
        d.initialY = centerY;
        d.offsetX = Math.random() * 2 * Math.PI;
        d.offsetY = Math.random() * 2 * Math.PI;
      });
    
      let highlightedBubble = null;
      let highlightedGroup = null;
    
      const groupNode = svg.selectAll("g.container-bubble")
        .data(containerBubbles)
        .enter()
        .append("g")
        .attr("class", "container-bubble")
        .attr("transform", d => `translate(${d.x}, ${d.y})`);
    
      groupNode.append("circle")
        .attr("r", d => containerRadiusScale(d.totalSize))
        .attr("fill", d => colors[d.key] || "#eee")
        .attr("fill-opacity", 0.3)
        .attr("stroke", d => colors[d.key] || "#ccc")
        .attr("stroke-width", 2)
        .on("mouseover", function(event, d) {
          highlightedGroup = d;
    
          ChartHelpers.showTooltip(
            event,
            `<span style="color:${colors[d.key]}">&#9679;</span> ${d.key}`
          );
    
          highlightDot
            .attr("r", containerRadiusScale(d.totalSize) + 4)
            .attr("fill", colors[d.key] || "#000")
            .attr("fill-opacity", 0.3)
            .attr("stroke", "none")
            .style("display", "block")
            .attr("cx", d.x)
            .attr("cy", d.y);
    
          groupNode.transition().style("opacity", g =>
            g.key === d.key ? 1 : 0.1
          );
        })
        .on("mouseout", function(event, d) {
          highlightedGroup = null;
    
          ChartHelpers.removeTooltip();
          highlightDot.style("display", "none");
    
          groupNode.transition().style("opacity", g => {
            const state = seriesState.find(s => s.key === g.key);
            return state && state.active ? 1 : 0;
          });
        });
    
      groupNode.each(function (groupData) {
        const nodeGroup = d3.select(this);
        const sizeScale = d3.scaleSqrt()
          .domain(d3.extent(groupData.children, d => d[zField]))
          .range([10, 30]);
    
        const childSim = d3.forceSimulation(groupData.children)
          .force("x", d3.forceX(0).strength(0.1))
          .force("y", d3.forceY(0).strength(0.1))
          .force("collision", d3.forceCollide(d => sizeScale(d[zField]) + 2))
          .stop();
    
        for (let i = 0; i < 150; ++i) childSim.tick();
    
        const node = nodeGroup.selectAll(".inner-bubble")
          .data(groupData.children)
          .enter()
          .append("g")
          .attr("class", "inner-bubble")
          .attr("transform", d => `translate(${d.x}, ${d.y})`);
    
        node.append("circle")
          .attr("r", d => sizeScale(d[zField]))
          .attr("fill", colors[groupData.key])
          .attr("fill-opacity", 0.3)
          .attr("stroke", colors[groupData.key])
          .attr("stroke-width", 2)
          .on("mouseover", function(event, hoveredBubble) {
            highlightedBubble = hoveredBubble;
    
            d3.select(this)
              .attr("stroke-width", 3);
    
            ChartHelpers.showTooltip(
              event,
              `<span style="color:${colors[groupData.key]}">&#9679;</span> ${groupData.key}<br/>
               <strong>${hoveredBubble[labelField]}</strong>: ${hoveredBubble[zField]}${yUnit} ${zUnit}`
            );
    
            highlightDot
              .attr("r", sizeScale(hoveredBubble[zField]) + 4)
              .attr("fill", colors[groupData.key] || "#000")
              .attr("fill-opacity", 0.3)
              .attr("stroke", "none")
              .style("display", "block")
              .attr("cx", hoveredBubble.x + groupData.x)
              .attr("cy", hoveredBubble.y + groupData.y);
    
            groupNode.transition().style("opacity", g =>
              g.key === groupData.key ? 1 : 0.1
            );
          })
          .on("mouseout", function() {
            highlightedBubble = null;
            d3.select(this).attr("stroke-width", 2);
            ChartHelpers.removeTooltip();
            highlightDot.style("display", "none");
    
            groupNode.transition().style("opacity", g => {
              const state = seriesState.find(s => s.key === g.key);
              return state && state.active ? 1 : 0;
            });
          });
    
        node.append("text")
          .text(d => d[labelField])
          .attr("text-anchor", "middle")
          .attr("dy", ".35em")
          .style("font-size", "11px")
          .style("pointer-events", "none")
          .each(function (d) {
            const r = sizeScale(d[zField]);
            if (this.getBBox().width > r * 2) d3.select(this).remove();
          });
      });
    
      const seriesState = containerBubbles.map(group => ({
        key: group.key,
        active: true
      }));
    
      const floatingGroupSim = d3.forceSimulation(containerBubbles)
        .velocityDecay(0.2)
        .force("collision", d3.forceCollide(d => containerRadiusScale(d.totalSize) + 4).strength(0.9))
        .on("tick", () => {
          groupNode.attr("transform", d => `translate(${d.x}, ${d.y})`);
    
          if (highlightedBubble) {
            const parent = containerBubbles.find(g => g.children.includes(highlightedBubble));
            if (parent) {
              highlightDot
                .attr("cx", highlightedBubble.x + parent.x)
                .attr("cy", highlightedBubble.y + parent.y);
            }
          }
        });
    
      const amplitude = 10;
      const frequency = 0.0015;
    
      d3.timer((elapsed) => {
        const activeGroups = containerBubbles.filter(group => {
          const state = seriesState.find(s => s.key === group.key);
          return state && state.active;
        });
    
        activeGroups.forEach(group => {
          group.targetX = centerX + Math.sin(elapsed * frequency + group.offsetX) * amplitude;
          group.targetY = centerY + Math.cos(elapsed * frequency + group.offsetY) * amplitude;
        });
    
        floatingGroupSim
          .nodes(activeGroups)
          .force("x", d3.forceX(d => d.targetX).strength(0.05))
          .force("y", d3.forceY(d => d.targetY).strength(0.05))
          .alpha(0.2)
          .restart();
      });
    
      const legendGroup = svg.append("g").attr("class", "legend-group");
    
      const legendItems = legendGroup.selectAll(".legend-item")
        .data(seriesState)
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .style("cursor", "pointer")
        .on("click", function (event, d) {
          d.active = !d.active;
    
          d3.select(this).select("text")
            .transition()
            .style("text-decoration", d.active ? "none" : "line-through");
          d3.select(this).select("circle")
            .transition()
            .style("fill-opacity", d.active ? 1 : 0.3);
    
          groupNode.style("display", g => {
            const state = seriesState.find(s => s.key === g.key);
            return state && state.active ? null : "none";
          });
    
          const activeGroups = containerBubbles.filter(group => {
            const state = seriesState.find(s => s.key === group.key);
            return state && state.active;
          });
    
          activeGroups.forEach(group => {
            group.initialX = group.x;
            group.initialY = group.y;
            group.vx = 0;
            group.vy = 0;
          });
    
          floatingGroupSim
            .nodes(activeGroups)
            .force("x", d3.forceX(d => d.initialX).strength(0.03))
            .force("y", d3.forceY(d => d.initialY).strength(0.03))
            .alpha(0.5)
            .restart();
        })
        .on("mouseover", function (event, hoveredLegend) {
          groupNode.transition().style("opacity", g =>
            g.key === hoveredLegend.key ? 1 : 0.1
          );
        })
        .on("mouseout", function () {
          groupNode.transition().style("opacity", g => {
            const state = seriesState.find(s => s.key === g.key);
            return state && state.active ? 1 : 0;
          });
        });
    
      legendItems.append("circle")
        .attr("r", 6)
        .attr("cx", 0)
        .attr("cy", 0)
        .style("fill", d => colors[d.key] || "#ccc");
    
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
      legendGroup.attr("transform", `translate(${(dims.width - legendBBox.width) / 2}, ${dims.height + 40})`);
    }
    
    
    
    
     else {
    const xExtent = d3.extent(data, d => d[xField]);
    const yExtent = d3.extent(data, d => d[yField]);
    const xScale = d3.scaleLinear()
      .domain([Math.min(60, xExtent[0]), xExtent[1] + 5])
      .range([0, dims.width]);
    const yScale = d3.scaleLinear()
      .domain([0, yExtent[1] + 30])
      .range([dims.height, 0]);
  
    svg.append("g")
      .attr("transform", `translate(0, ${dims.height})`)
      .call(d3.axisBottom(xScale).ticks(6).tickFormat(d => d))
      .call(g => g.select(".domain").remove())
      .append("text")
        .attr("class", "axis-label")
        .attr("x", dims.width / 2)
        .attr("y", margins.bottom - 40)
        .attr("fill", "#000")
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text(xLabel + (xUnit ? ` (${xUnit})` : ""));
  
    svg.append("g")
      .call(d3.axisLeft(yScale).ticks(6).tickFormat(d => d))
      .call(g => g.select(".domain").remove());
  
    svg.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -dims.height / 2)
      .attr("y", -margins.left + 40)
      .attr("fill", "#000")
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text(yLabel + (yUnit ? ` (${yUnit})` : ""));
  
    svg.append("g")
      .attr("class", "grid")
      .style("opacity", 0.1)
      .call(d3.axisLeft(yScale).tickSize(-dims.width).tickFormat(""))
      .call(g => g.select(".domain").remove());
    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0, ${dims.height})`)
      .style("opacity", 0.1)
      .call(d3.axisBottom(xScale).tickSize(-dims.height).tickFormat(""))
      .call(g => g.select(".domain").remove());
  
    referenceLines.forEach(line => {
      const isX = line.axis === "x";
      const scale = isX ? xScale : yScale;
      const length = isX ? dims.height : dims.width;
      const [x1, x2, y1, y2] = isX
        ? [scale(line.value), scale(line.value), 0, dims.height]
        : [0, dims.width, scale(line.value), scale(line.value)];
      svg.append("line")
        .attr("x1", x1)
        .attr("x2", x2)
        .attr("y1", y1)
        .attr("y2", y2)
        .style("stroke", "black")
        .style("stroke-dasharray", "4,4");
      svg.append("text")
        .attr("x", isX ? scale(line.value) + 5 : dims.width - 5)
        .attr("y", isX ? 15 : scale(line.value) - 5)
        .attr("text-anchor", isX ? "start" : "end")
        .style("font-size", "14px")
        .style("font-style", "italic")
        .text(line.label);
    });
  
    const bubbles = svg.selectAll(".bubble")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "bubble")
      .attr("transform", d => `translate(${xScale(d[xField])}, ${yScale(d[yField])})`);
    bubbles.append("circle")
      .attr("r", d => sizeScale(d[zField]))
      .attr("fill", d => colorField ? (colors[d[colorField]] || "#ccc") : "#ccc")
      .attr("fill-opacity", 0.6)
      .attr("stroke", d => colorField ? (colors[d[colorField]] || "#ccc") : "#ccc")
      .attr("stroke-width", 1)
      .on("mouseover", function(event, d) {
        d3.select(this).attr("fill-opacity", 0.9);
        ChartHelpers.showTooltip(event,
          `<strong>${d[countryField]}</strong><br/>
           <strong>${xField}</strong>: ${d[xField]}${xUnit}<br/>
           <strong>${yField}</strong>: ${d[yField]}${yUnit}<br/>
           <strong>${zField}</strong>: ${d[zField]}${zUnit}<br/>`
        );
        highlightDot
          .attr("cx", xScale(d[xField]))
          .attr("cy", yScale(d[yField]))
          .attr("r", sizeScale(d[zField]) + 4)
          .attr("fill", colorField ? (colors[d[colorField]] || "#ccc") : "#ccc")
          .style("display", "block");
      })
      .on("mouseout", function() {
        d3.select(this).attr("fill-opacity", 0.6);
        ChartHelpers.removeTooltip();
        highlightDot.style("display", "none");
      });
    bubbles.append("text")
      .text(d => d[labelField])
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .style("font-weight", "bold")
      .style("font-size", "12px");
    }
  }
}

window.renderLineChart = ChartRenderers.renderLineChart;
window.renderAreaChart = ChartRenderers.renderAreaChart;
window.renderColumnChart = ChartRenderers.renderColumnChart;
window.renderBarChart = ChartRenderers.renderBarChart;
window.renderPieChart = ChartRenderers.renderPieChart;
window.renderScatterChart = ChartRenderers.renderScatterChart;
window.renderBubbleChart = ChartRenderers.renderBubbleChart;