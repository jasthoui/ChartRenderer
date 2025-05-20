export const ChartHelpers = {
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
  },

  moveTooltip(event) {
    d3.select("body").select(".tooltip")
      .style("left",  (event.pageX + 10) + "px")
      .style("top",   (event.pageY - 28) + "px");
  }
};