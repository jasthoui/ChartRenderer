import { ChartHelpers } from '/js/chartHelpers.js';

export const ChartRenderers = {
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
          ChartHelpers.showTooltip(
            event,
            `<strong>${label}</strong>: ${value} interns`
          );
        })
        .on("mouseout", function() {
          pieGroup.selectAll("path").transition().duration(200).style("opacity", 1);
          ChartHelpers.removeTooltip();
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
          ChartHelpers.showTooltip(
            event,
            `<strong>${d.data.label}</strong>: ${d.data.value} interns`
          );
        })
        .on("mouseout", function() {
          sliceGroups.selectAll("path").transition().duration(200).style("opacity", 1);
          ChartHelpers.removeTooltip();
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
          ChartHelpers.showTooltip(
            event,
            `<strong>${d.data.label}</strong>: ${d.data.value} interns`
          );
        })
        .on("mouseout", function() {
          pieGroup.selectAll("path").transition().duration(200).style("opacity", 1);
          ChartHelpers.removeTooltip();
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
