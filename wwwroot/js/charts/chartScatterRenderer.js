import { ChartHelpers } from '/js/chartHelpers.js';

export const ChartRenderers = {
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
  }
};
