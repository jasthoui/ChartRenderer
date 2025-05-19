import { ChartHelpers } from '/js/chartHelpers.js';

export const ChartRenderers = {
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
        const dims = ChartHelpers.getDimensions(margins, width + 40, height);
        const svg = ChartHelpers.createSVG(containerId, margins, width, height);

        const formatValue = d3.format(",");

        const seriesState = series.map(key => ({ key, active: true }));
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
    
        const safeClassName = name => name.replace(/\s+/g, '-');
    
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
                        const cls = safeClassName(key);
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
                        
                            d3.selectAll(`.bar-${safeClassName(currentKey)}`).transition().duration(200).style("opacity", 1);
                        
                            ChartHelpers.showTooltip(
                                event,
                                `<strong>${d[yField]}</strong><br/>` +
                                `<span style="color:${colors[currentKey] || "black"}">&#9679;</span>` +
                                `${currentKey}: <strong>${formatValue(val)}${xUnit ? " " + xUnit : ""}</strong>`
                            );
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
                    const cls = safeClassName(key);
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
                        
                        d3.selectAll(`.bar-${safeClassName(currentKey)}`).transition().duration(200).style("opacity", 1);
                        
                        ChartHelpers.showTooltip(
                        event, 
                        `<strong>${d[yField]}</strong><br/>` +
                        `<span style="color:${colors[currentKey] || "black"}">&#9679;</span>` +
                        `${currentKey}: <strong>${formatValue(val)}${xUnit ? " " + xUnit : ""}</strong>`
                        );
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
            .text(`${xLabel}${xUnit ? ` (${xUnit})` : ''}`);
        }

        if (yLabel) {
            svg.append("text")
            .attr("class", "y label")
            .attr("transform", "rotate(-90)")
            .attr("x", -dims.height / 2)
            .attr("y", -margins.left + 20)
            .style("font-size", "14px")
            .text(yLabel);
        }
    } 
};
