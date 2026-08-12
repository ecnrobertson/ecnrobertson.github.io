// =========================================================
// WOLF MAP
// =========================================================

const svg = d3.select("#wolf-map");

const width = 900;
const height = 650;


// Load the two historic-range features
Promise.all([
  d3.json("assets/maps/historic-range_obj1.geojson"),
  d3.json("assets/maps/historic-range_obj2.geojson")
]).then(([range1, range2]) => {

  // Combine both downloaded files into one FeatureCollection
  const historicRange = {
    type: "FeatureCollection",
    features: [
      ...range1.features,
      ...range2.features
    ]
  };


  // Geographic projection
  const projection = d3
    .geoAlbers()
    .fitExtent(
      [[30, 30], [width - 30, height - 30]],
      historicRange
    );


  // Converts geographic coordinates into SVG paths
  const path = d3.geoPath()
    .projection(projection);


  // Draw the wolf range
  svg
    .selectAll(".historic-range")
    .data(historicRange.features)
    .join("path")
    .attr("class", "historic-range")
    .attr("d", path);

});

// =========================================================
// GRAY WOLF CASE STUDY
// Scroll-driven interactions
// =========================================================


// Create the Scrollama instance
const scroller = scrollama();


// Select our page elements
const steps = document.querySelectorAll(".step");
const mapStates = document.querySelectorAll(".map-state");


// ---------------------------------------------------------
// Change the graphic when a step becomes active
// ---------------------------------------------------------

function handleStepEnter(response) {

  // Which step are we currently on?
  const currentStep = response.index;


  // Remove active state from all text steps
  steps.forEach(step => {
    step.classList.remove("is-active");
  });


  // Highlight the active text step
  response.element.classList.add("is-active");


  // Hide all graphic states
  mapStates.forEach(state => {
    state.classList.remove("active");
  });


  // Show the graphic state corresponding to this step
  const activeState = document.querySelector(
    `.map-state[data-state="${currentStep}"]`
  );

  if (activeState) {
    activeState.classList.add("active");
  }

}


// ---------------------------------------------------------
// Initialize Scrollama
// ---------------------------------------------------------

scroller
  .setup({
    step: "#range-scrolly .step",

    // Trigger when the step reaches approximately
    // the middle of the screen
    offset: 0.55,

    debug: false
  })
  .onStepEnter(handleStepEnter);


// ---------------------------------------------------------
// Recalculate positions if browser size changes
// ---------------------------------------------------------

window.addEventListener("resize", () => {
  scroller.resize();
});