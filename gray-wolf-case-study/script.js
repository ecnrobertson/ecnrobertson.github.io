// =========================================================
// WOLF MAP
// =========================================================

const svg = d3.select("#wolf-map");

const width = 900;
const height = 650;


// Load basemap + historic wolf range
Promise.all([

  d3.json(
    "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json"
  ),

  d3.json(
    "assets/maps/historic-range-1.geojson"
  ),

  d3.json(
    "assets/maps/historic-range-2.geojson"
  )

])
.then(([world, range1, range2]) => {


  // -------------------------------------------------------
  // BASEMAP
  // -------------------------------------------------------

  const countries = topojson.feature(
    world,
    world.objects.countries
  );


  // -------------------------------------------------------
  // HISTORIC WOLF RANGE
  // -------------------------------------------------------

  const historicRange = {
    type: "FeatureCollection",
    features: [
      ...range1.features,
      ...range2.features
    ]
  };


  // -------------------------------------------------------
  // PROJECTION
  // -------------------------------------------------------

  const projection = d3
    .geoAlbers()
    .center([0, 45])
    .rotate([100, 0])
    .parallels([30, 60])
    .fitExtent(
      [[25, 25], [width - 25, height - 25]],
      historicRange
    );


  const path = d3.geoPath()
    .projection(projection);


  // -------------------------------------------------------
  // DRAW BASEMAP
  // -------------------------------------------------------

  svg
    .append("g")
    .attr("class", "basemap-layer")
    .selectAll("path")
    .data(countries.features)
    .join("path")
    .attr("d", path)
    .attr("class", "country");


  // -------------------------------------------------------
  // DRAW HISTORIC WOLF RANGE
  // -------------------------------------------------------

  svg
    .append("g")
    .attr("class", "historic-range-layer")
    .selectAll("path")
    .data(historicRange.features)
    .join("path")
    .attr("d", path)
    .attr("class", "historic-range");


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