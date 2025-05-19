import { ChartHelpers } from '/js/chartHelpers.js';

export const ChartRenderers = {
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
            ChartHelpers.showTooltip(
              event,
              `${d[xField]}<br/>
              <span style="color:${colors.range || "black"}">&#9679;</span>
              ${yField}: <strong>${formatValue(d.min)}${yUnit ? " " + yUnit : ""}</strong> - <strong>${formatValue(d.max)}${yUnit ? " " + yUnit : ""}</strong>`
            );
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

                    ChartHelpers.showTooltip(event,
                      `<div style="font-weight: bold; margin-bottom: 4px;">${d[xField]}</div>
                      <div>${currentKey}: ${valueDisplay}</div>
                      ${!percentage ? `<div style="margin-top: 4px;">Total: ${formatValue(total)}${yUnit ? " " + yUnit : ""}</div>` : ""}`
                    );
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
                  
                    ChartHelpers.showTooltip(event, `<span style="color:${colors[s] || "black"}">&#9679;</span> <strong>${s}</strong><br/>Value: ${formatValue(value)} ${yUnit}`);
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
            
                    ChartHelpers.showTooltip(
                      event,
                      `<strong>${d[xField]}</strong><br/>
                      <span style="color:${colors[key] || "black"}">&#9679;</span>
                      ${key}: <strong>${formatValue(value)} ${yUnit}</strong>`
                    );
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
  }
};
