import { ChartHelpers } from '/js/chartHelpers.js';

export const ChartRenderers = {
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
        const dims = ChartHelpers.getDimensions(margins, width - 50, height);
        const svg = ChartHelpers.createSVG(containerId, margins, width, height);
        
        const safeClassName = name => name.replace(/\s+/g, '-');

        const seriesState = series.map(key => ({ key, active: true }));
        const xExtent = d3.extent(data, d => d[xField]);
        const activeKeysInit = seriesState.filter(s => s.active).map(s => s.key);
        let xScale, yScale;
        
        if (!inverted) {
            const maxY = !stacked
                ? d3.max(data, d => d3.max(activeKeysInit, key => d[key] || 0))
                : d3.max(d3.stack().keys(activeKeysInit)(data).pop(), d => d[1]);
            xScale = d3.scaleLinear().domain(xExtent).nice().range([0, dims.width]);
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
        .call(!inverted
            ? d3.axisLeft(yScale).ticks(8).tickSize(-dims.width).tickFormat("")
            : d3.axisBottom(xScale).ticks(8).tickSize(dims.height).tickFormat(""))
        .call(g => g.select(".domain").remove());

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
                .on("mousemove", function(event) {
                    ChartHelpers.removeTooltip();
                    const [mouseX, mouseY] = d3.pointer(event, this);
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
                        if (dPoint[key] != null) {
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

                        ChartHelpers.showTooltip(
                        event,
                        `<strong>${dPoint[xField]}</strong><br/>` +
                        `<span style="color:${colors[chosenSeries]||"black"}">&#9679;</span> ${chosenSeries}: ` +
                        `<strong>${d3.format(",")(dPoint[chosenSeries])} ${yUnit}</strong>`
                        );

                        series.forEach(key => {
                            const sel = svg.selectAll(`.area.${safeClassName(key)}`);
                            if (key === chosenSeries) {
                                sel.transition()
                                .style("opacity", 1)
                                .attr("stroke-width", 4)
                                .attr("fill-opacity", 0.8);
                            } else {
                                sel.transition().style("opacity", 0.1);
                            }
                        });
                    } else {
                        hoverCircle.style("opacity", 0);
                    }
                    })
                    .on("mouseout", function(event) {
                        ChartHelpers.removeTooltip();
                        hoverCircle.style("opacity", 0);
                        series.forEach(key => {
                            svg.selectAll(`.area.${safeClassName(key)}`)
                            .transition()
                            .style("opacity", 1)
                            .attr("stroke-width", 2)
                            .attr("fill-opacity", 0.6);
                        });
                    });
            } else {
                svg.append("rect")
                .attr("class", "overlay")
                .attr("width", dims.width)
                .attr("height", dims.height)
                .style("fill", "none")
                .style("pointer-events", "all")
                .on("mousemove", function(event) {
                    ChartHelpers.removeTooltip();
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
                    ChartHelpers.showTooltip(
                    event,
                    `<strong>${dPoint[xField]}</strong>` +
                    activeKeys.map(key =>
                        `<br/><span style="color:${colors[key]||"black"}">&#9679;</span> ${key}: ` +
                        `<strong>${d3.format(",")(dPoint[key])} ${yUnit}</strong>`
                    )
                    );

                    const circleSize = 6;
                    svg.selectAll(".circle-group circle")
                    .attr("r", d => d.data[xField] === dPoint[xField] ? circleSize : 4);
                })
                .on("mouseout", function(event) {
                    ChartHelpers.removeTooltip();
                    svg.selectAll(".circle-group circle")
                    .attr("r", 4);
                });
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
                .on("mousemove", function(event) {
                    ChartHelpers.removeTooltip();
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

                    let chosenSeries = null;
                    let minDistance = Infinity;
                    const activeKeys = seriesState.filter(s => s.active).map(s => s.key);
                    activeKeys.forEach(key => {
                        if (dPoint[key] != null) {
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

                        ChartHelpers.showTooltip(
                        event,
                        `<strong>${dPoint[xField]}</strong><br/>` +
                        `<span style="color:${colors[chosenSeries]||"black"}">&#9679;</span> ${chosenSeries}: ` +
                        `<strong>${d3.format(",")(dPoint[chosenSeries])} ${yUnit}</strong>`
                        );

                        series.forEach(key => {
                            const safeKey = safeClassName(key);
                            svg.selectAll(`.area.${safeKey}`)
                            .transition()
                            .style("opacity", key === chosenSeries ? 1 : 0.1)
                            .attr("stroke-width", key === chosenSeries ? 4 : null)
                            .attr("fill-opacity", key === chosenSeries ? 0.8 : null);
                        
                            svg.selectAll(`.circle-${safeClassName(key)}`)
                            .transition()
                            .style("opacity", key === chosenSeries ? 1 : 0.1);
                        });
                    } else {
                        hoverCircle.style("opacity", 0);
                    }
                })
                .on("mouseout", function(event) {
                    ChartHelpers.removeTooltip();
                    svg.select(".hover-circle").style("opacity", 0);
                    series.forEach(key => {
                        const safeKey = safeClassName(key);
                        svg.selectAll(`.area.${safeKey}`)
                        .transition()
                        .style("opacity", 1)
                        .attr("stroke-width", 2)
                        .attr("fill-opacity", 0.6);
                        
                        svg.selectAll(`.circle-${safeKey}`)
                        .transition()
                        .style("opacity", 1);
                    });
                });
            } else {
                svg.append("rect")
                .attr("class", "overlay")
                .attr("width", dims.width)
                .attr("height", dims.height)
                .style("fill", "none")
                .style("pointer-events", "all")
                .on("mousemove", function(event) {
                    ChartHelpers.removeTooltip();
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

                    const activeKeys = seriesState
                    .filter(s => s.active)
                    .map(s => s.key);

                    ChartHelpers.showTooltip(
                    event,
                    `<strong>${dPoint[xField]}</strong>` +
                    activeKeys.map( key =>
                        `<br/><span style="color:${colors[key] || "black"}">&#9679;</span> ${key}: ` +
                        `<strong>${d3.format(",")(dPoint[key])} ${yUnit}</strong>`
                    )
                    );

                    const circleSize = 6;
                    svg.selectAll(".circle-group circle")
                    .attr("r", d => d.data[xField] === dPoint[xField] ? circleSize : 4);
                })
                .on("mouseout", function(event) {
                ChartHelpers.removeTooltip();
                svg.selectAll(".circle-group circle")
                    .attr("r", 4);
                });
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

        if (title) {
            svg.append("text")
                .attr("x", dims.width / 2)
                .attr("y", -20)
                .attr("text-anchor", "middle")
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
    }
};
