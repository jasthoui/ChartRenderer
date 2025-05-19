import { ChartHelpers } from '/js/chartHelpers.js';

export const ChartRenderers = {
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

    if (title) {
      svg.append("text")
        .attr("x", dims.width / 2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .style("font-size", "22px")
        .style("font-weight", "bold")
        .text(title);
    }
  } 
};
