// =========================================================
// WOLF MAP
// =========================================================

const svg = d3.select("#wolf-map");

const width = 900;
const height = 650;


// Load the two historic-range features
Promise.all([
  d3.json("assets/maps/historic-range-1.geojson"),
  d3.json("assets/maps/historic-range-2.geojson")
])
.then(([range1, range2]) => {

  console.log("Range 1:", range1);
  console.log("Range 2:", range2);

  // Combine both files into one FeatureCollection
  const historicRange = {
    type: "FeatureCollection",
    features: [
      ...range1.features,
      ...range2.features
    ]
  };

  console.log("Feature count:", historicRange.features.length);
  console.log("Bounds:", d3.geoBounds(historicRange));


  // Geographic projection
  const projection = d3
    .geoAlbers()
    .fitExtent(
      [[30, 30], [width - 30, height - 30]],
      historicRange
    );


  // Convert geographic coordinates to SVG paths
  const path = d3.geoPath()
    .projection(projection);


  // Draw the historic wolf range
  svg
    .selectAll(".historic-range")
    .data(historicRange.features)
    .join("path")
    .attr("class", "historic-range")
    .attr("d", path)
    .attr("fill", "red")
    .attr("fill-opacity", 0.7)
    .attr("stroke", "black")
    .attr("stroke-width", 2);

})
.catch(error => {
  console.error("MAP ERROR:", error);
});


// =========================================================
// SCROLL-DRIVEN INTERACTIONS
// =========================================================

const scroller = scrollama();

const steps = document.querySelectorAll(".step");


function handleStepEnter(response) {

  // Remove highlight from all steps
  steps.forEach(step => {
    step.classList.remove("is-active");
  });

  // Highlight current step
  response.element.classList.add("is-active");

  console.log("Current step:", response.index);
}


// Initialize Scrollama
scroller
  .setup({
    step: "#range-scrolly .step",
    offset: 0.55,
    debug: false
  })
  .onStepEnter(handleStepEnter);


// Recalculate positions when browser size changes
window.addEventListener("resize", () => {
  scroller.resize();
});