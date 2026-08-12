// =========================================================
// GRAY WOLF CASE STUDY
// MAP + SCROLL INTERACTIONS
// =========================================================


// =========================================================
// FIX POLYGON WINDING FOR D3
// =========================================================

function signedRingArea(ring) {
  let area = 0;

  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];

    area += (x1 * y2) - (x2 * y1);
  }

  return area / 2;
}


function orientRing(ring, shouldBeClockwise) {
  const isClockwise = signedRingArea(ring) < 0;

  if (isClockwise !== shouldBeClockwise) {
    return [...ring].reverse();
  }

  return ring;
}


function normalizeForD3(featureCollection) {

  featureCollection.features.forEach(feature => {

    if (!feature.geometry) return;


    if (feature.geometry.type === "Polygon") {

      feature.geometry.coordinates =
        feature.geometry.coordinates.map((ring, index) =>
          orientRing(ring, index === 0)
        );

    }


    if (feature.geometry.type === "MultiPolygon") {

      feature.geometry.coordinates =
        feature.geometry.coordinates.map(polygon =>
          polygon.map((ring, index) =>
            orientRing(ring, index === 0)
          )
        );

    }

  });

  return featureCollection;
}


// =========================================================
// MAP SETUP
// =========================================================

const svg = d3.select("#wolf-map");

const width = 900;
const height = 650;

svg.selectAll("*").remove();


// =========================================================
// LOAD DATA
// =========================================================

Promise.all([

  d3.json(
    "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json"
  ),

  d3.json(
    "assets/maps/admin1-states-provinces.geojson"
  ),

  d3.json(
    "assets/maps/historic-range-1.geojson"
  ),

  d3.json(
    "assets/maps/historic-range-2.geojson"
  )

])
.then(([world, admin1, range1, range2]) => {


  // =======================================================
  // BASEMAP DATA
  // =======================================================

  const allCountries = topojson.feature(
    world,
    world.objects.countries
  );


  const northAmericaIDs = new Set([
    "124", // Canada
    "304", // Greenland
    "484", // Mexico
    "840"  // United States
  ]);


  const northAmerica = {
    type: "FeatureCollection",

    features: allCountries.features.filter(country =>
      northAmericaIDs.has(String(country.id))
    )
  };


  // =======================================================
  // HISTORIC WOLF RANGE
  // =======================================================

  const historicRange = {
    type: "FeatureCollection",

    features: [
      ...range1.features,
      ...range2.features
    ]
  };


  normalizeForD3(historicRange);
  normalizeForD3(admin1);


  // =======================================================
  // PROJECTION
  // =======================================================

  const projection = d3
    .geoAlbers()
    .parallels([29.5, 45.5])
    .rotate([96, 0])
    .center([0, 38])
    .fitExtent(
      [[30, 30], [width - 30, height - 30]],
      northAmerica
    );


  const path = d3
    .geoPath()
    .projection(projection);


  // =======================================================
  // SVG DEFINITIONS
  // =======================================================

  const defs = svg.append("defs");


  // =======================================================
  // NORTH AMERICA CLIP PATH
  // -------------------------------------------------------
  // Anything using this clip path can only appear over land
  // in Canada, USA, Mexico, or Greenland.
  // =======================================================

  const northAmericaClip = defs
    .append("clipPath")
    .attr("id", "north-america-clip");


  northAmericaClip
    .selectAll("path")
    .data(northAmerica.features)
    .join("path")
    .attr("d", path);


  // =======================================================
  // WOLF RANGE MASK
  // -------------------------------------------------------
  // White = visible
  // Dark = mostly invisible
  //
  // We'll animate these stops during Step 1.
  // =======================================================

  const wolfMaskGradient = defs
    .append("linearGradient")
    .attr("id", "wolf-range-fade-gradient")
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", 0)
    .attr("y2", 0);


  wolfMaskGradient
    .append("stop")
    .attr("class", "wolf-stop-1")
    .attr("offset", "0%")
    .attr("stop-color", "white");


  wolfMaskGradient
    .append("stop")
    .attr("class", "wolf-stop-2")
    .attr("offset", "100%")
    .attr("stop-color", "white");


  wolfMaskGradient
    .append("stop")
    .attr("class", "wolf-stop-3")
    .attr("offset", "100%")
    .attr("stop-color", "white");


  wolfMaskGradient
    .append("stop")
    .attr("class", "wolf-stop-4")
    .attr("offset", "100%")
    .attr("stop-color", "white");


  defs
    .append("mask")
    .attr("id", "wolf-range-mask")
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "url(#wolf-range-fade-gradient)");


  // =======================================================
  // COLONIZATION GRADIENT
  // -------------------------------------------------------
  // Stronger in the east, gradually lighter toward the west.
  // This is clipped to the North American landmass.
  // =======================================================

  const colonizationGradient = defs
    .append("linearGradient")
    .attr("id", "colonization-gradient")
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", width)
    .attr("x2", 0)
    .attr("y1", 0)
    .attr("y2", 0);


  colonizationGradient
    .append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#8b7554")
    .attr("stop-opacity", 0.42);


  colonizationGradient
    .append("stop")
    .attr("offset", "45%")
    .attr("stop-color", "#9b8767")
    .attr("stop-opacity", 0.28);


  colonizationGradient
    .append("stop")
    .attr("offset", "72%")
    .attr("stop-color", "#a99a80")
    .attr("stop-opacity", 0.12);


  colonizationGradient
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#a99a80")
    .attr("stop-opacity", 0);


  // =======================================================
  // LAYER 1 — COUNTRY BASEMAP
  // =======================================================

  svg
    .append("g")
    .attr("class", "basemap-layer")
    .selectAll("path")
    .data(northAmerica.features)
    .join("path")
    .attr("d", path)
    .attr("fill", "#e7e5dc")
    .attr("stroke", "#676a64")
    .attr("stroke-width", 1);


  // =======================================================
  // LAYER 2 — STATE / PROVINCE BOUNDARIES
  // =======================================================

  svg
    .append("g")
    .attr("class", "admin-boundary-layer")
    .selectAll("path")
    .data(admin1.features)
    .join("path")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "#8f918b")
    .attr("stroke-width", 0.45)
    .attr("stroke-opacity", 0.5)
    .attr("vector-effect", "non-scaling-stroke");


  // =======================================================
  // LAYER 3 — HISTORIC WOLF RANGE
  // =======================================================

  const wolfRangeLayer = svg
    .append("g")
    .attr("class", "historic-range-layer")
    .attr("mask", "url(#wolf-range-mask)");


  wolfRangeLayer
    .selectAll("path")
    .data(historicRange.features)
    .join("path")
    .attr("d", path)
    .attr("fill", "#66705b")
    .attr("fill-opacity", 0.72)
    .attr("stroke", "#40483a")
    .attr("stroke-width", 0.8);


  // =======================================================
  // LAYER 4 — COLONIZATION SHADING
  // -------------------------------------------------------
  // The rectangle still spans the SVG internally, but the
  // clipPath means ONLY North American land is shaded.
  // =======================================================

  const colonizationLayer = svg
    .append("g")
    .attr("class", "colonization-layer")
    .attr("opacity", 0);


  colonizationLayer
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "url(#colonization-gradient)")
    .attr("clip-path", "url(#north-america-clip)");


  // =======================================================
  // WESTWARD ARROW
  // =======================================================

  const arrowY = height * 0.55;

  const arrowStartX = width * 0.82;
  const arrowEndX = width * 0.50;


  colonizationLayer
    .append("line")
    .attr("x1", arrowStartX)
    .attr("x2", arrowEndX)
    .attr("y1", arrowY)
    .attr("y2", arrowY)
    .attr("stroke", "#332b20")
    .attr("stroke-width", 3)
    .attr("stroke-opacity", 0.95);


  colonizationLayer
    .append("path")
    .attr(
      "d",
      `
      M ${arrowEndX} ${arrowY}
      L ${arrowEndX + 18} ${arrowY - 11}
      L ${arrowEndX + 18} ${arrowY + 11}
      Z
      `
    )
    .attr("fill", "#332b20")
    .attr("fill-opacity", 0.95);


  colonizationLayer
    .append("text")
    .attr("x", width * 0.58)
    .attr("y", arrowY - 50)
    .attr("text-anchor", "middle")
    .attr("fill", "#2f281f")
    .attr("font-size", 17)
    .attr("font-weight", 600);

// =======================================================
// LAYER 5 — 1960s REMNANT
// =======================================================

const remnantLayer = svg
  .append("g")
  .attr("class", "remnant-layer")
  .attr("opacity", 0);


// Approximate northeastern Minnesota location
const minnesotaPoint = projection([
  -92.5,
  47.7
]);


if (minnesotaPoint) {

  // Soft approximate stronghold area
  remnantLayer
    .append("ellipse")
    .attr("cx", minnesotaPoint[0])
    .attr("cy", minnesotaPoint[1])
    .attr("rx", 30)
    .attr("ry", 25)
    .attr("fill", "#526146")
    .attr("fill-opacity", 0.72)
    .attr("stroke", "#34402d")
    .attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "4 3");


  // Minnesota label
  remnantLayer
    .append("text")
    .attr("x", minnesotaPoint[0] + 50)
    .attr("y", minnesotaPoint[1] + 4)
    .attr("fill", "#2e3829")
    .attr("font-size", 14)
    .attr("font-weight", 600)
    .text("Northeastern Minnesota");

}

// Isle Royale population
const isleRoyalePoint = projection([
  -89.0,
  48.0
]);

if (isleRoyalePoint) {

  remnantLayer
    .append("circle")
    .attr("cx", isleRoyalePoint[0])
    .attr("cy", isleRoyalePoint[1])
    .attr("r", 5)
    .attr("fill", "#526146")
    .attr("stroke", "#2e3829")
    .attr("stroke-width", 1.5);


  remnantLayer
    .append("text")
    .attr("x", isleRoyalePoint[0] + 10)
    .attr("y", isleRoyalePoint[1] - 8)
    .attr("fill", "#2e3829")
    .attr("font-size", 12)
    .attr("font-weight", 600)
    .text("Isle Royale");
    
  remnantLayer
  .append("text")
  .attr("x", width - 25)
  .attr("y", height - 20)
  .attr("text-anchor", "end")
  .attr("fill", "#555")
  .attr("font-size", 11)
  .attr("font-style", "italic")
  .text("Approximate range");

}

  // =======================================================
  // SCROLL STATES
  // =======================================================


  // -------------------------------------------------------
  // STEP 0
  // Full historical range
  // -------------------------------------------------------

  function showHistoricRange() {

    colonizationLayer
      .interrupt()
      .transition()
      .duration(700)
      .attr("opacity", 0);

wolfRangeLayer
  .interrupt()
  .transition()
  .duration(700)
  .attr("opacity", 1);

remnantLayer
  .interrupt()
  .transition()
  .duration(500)
  .attr("opacity", 0);
  
    // Reset entire mask to white.
    wolfMaskGradient
      .select(".wolf-stop-1")
      .interrupt()
      .transition()
      .duration(800)
      .attr("offset", "0%")
      .attr("stop-color", "white");


    wolfMaskGradient
      .select(".wolf-stop-2")
      .interrupt()
      .transition()
      .duration(800)
      .attr("offset", "100%")
      .attr("stop-color", "white");


    wolfMaskGradient
      .select(".wolf-stop-3")
      .interrupt()
      .transition()
      .duration(800)
      .attr("offset", "100%")
      .attr("stop-color", "white");


    wolfMaskGradient
      .select(".wolf-stop-4")
      .interrupt()
      .transition()
      .duration(800)
      .attr("offset", "100%")
      .attr("stop-color", "white");

  }


  // -------------------------------------------------------
  // STEP 1
  // WESTWARD COLONIZATION + STRONG RANGE CONTRACTION
  // -------------------------------------------------------

  function showColonization() {

    colonizationLayer
      .interrupt()
      .transition()
      .duration(900)
      .attr("opacity", 1);
      
wolfRangeLayer
  .interrupt()
  .transition()
  .duration(700)
  .attr("opacity", 1);

remnantLayer
  .interrupt()
  .transition()
  .duration(500)
  .attr("opacity", 0);

    // Far western portion remains visible.
    wolfMaskGradient
      .select(".wolf-stop-1")
      .interrupt()
      .transition()
      .duration(1400)
      .attr("offset", "0%")
      .attr("stop-color", "white");


    // Full visibility now extends only through roughly
    // the western third of the map.
    wolfMaskGradient
      .select(".wolf-stop-2")
      .interrupt()
      .transition()
      .duration(1400)
      .attr("offset", "32%")
      .attr("stop-color", "white");


    // Strong transition occurs across the central U.S.
    wolfMaskGradient
      .select(".wolf-stop-3")
      .interrupt()
      .transition()
      .duration(1400)
      .attr("offset", "58%")
      .attr("stop-color", "#555");


    // Eastern range becomes nearly invisible.
    wolfMaskGradient
      .select(".wolf-stop-4")
      .interrupt()
      .transition()
      .duration(1400)
      .attr("offset", "100%")
      .attr("stop-color", "#050505");

  }


 // =======================================================
// SCROLLAMA
// =======================================================

const scroller = scrollama();

const steps = document.querySelectorAll(".step");

const mapDate =
  document.querySelector("#map-label .map-date");

const mapTitle =
  document.querySelector("#map-label h2");

const archivalImages =
  document.querySelector("#archival-images");


// =======================================================
// MAP LABELS
// =======================================================

const mapLabels = [
  {
    date: "Before European colonization",
    title: "Historical wolf range"
  },
  {
    date: "1600s–1800s",
    title: "Settlement expands westward"
  },
  {
    date: "1800s–early 1900s",
    title: "Wolf eradication intensifies"
  },
  {
    date: "By the 1960s",
    title: "A last stronghold"
  }
];


// =======================================================
// STEP 2 — ERADICATION
// =======================================================

function showEradication() {

  // Keep colonization shading, but reduce it
  colonizationLayer
    .interrupt()
    .transition()
    .duration(700)
    .attr("opacity", 0.45);


  // Show archival hunting / trapping photographs
  archivalImages.classList.add("is-visible");

wolfRangeLayer
  .interrupt()
  .transition()
  .duration(700)
  .attr("opacity", 1);

remnantLayer
  .interrupt()
  .transition()
  .duration(500)
  .attr("opacity", 0);
  
  // Push range loss farther west
  wolfMaskGradient
    .select(".wolf-stop-2")
    .interrupt()
    .transition()
    .duration(1200)
    .attr("offset", "22%")
    .attr("stop-color", "white");


  wolfMaskGradient
    .select(".wolf-stop-3")
    .interrupt()
    .transition()
    .duration(1200)
    .attr("offset", "48%")
    .attr("stop-color", "#333");


  wolfMaskGradient
    .select(".wolf-stop-4")
    .interrupt()
    .transition()
    .duration(1200)
    .attr("offset", "100%")
    .attr("stop-color", "black");
}

// =======================================================
// STEP 3 — LAST STRONGHOLD
// =======================================================

function showLastStronghold() {

  // Remove archival hunting photographs
  archivalImages.classList.remove("is-visible");


  // Remove colonization overlay
  colonizationLayer
    .interrupt()
    .transition()
    .duration(700)
    .attr("opacity", 0);


  // Turn the old historic range into a faint ghost
  wolfRangeLayer
    .interrupt()
    .transition()
    .duration(1000)
    .attr("opacity", 0.12);


  // Reveal approximate Minnesota stronghold
  remnantLayer
    .interrupt()
    .transition()
    .delay(300)
    .duration(900)
    .attr("opacity", 1);

}

// =======================================================
// HANDLE SCROLL STEP
// =======================================================

function handleStepEnter(response) {

  // Highlight active text card
  steps.forEach(step => {
    step.classList.remove("is-active");
  });

  response.element.classList.add("is-active");


  // -------------------------------------------------------
  // CHANGE MAP LABEL
  // -------------------------------------------------------

  const label = mapLabels[response.index];

  if (label) {
    mapDate.textContent = label.date;
    mapTitle.textContent = label.title;
  }


  // -------------------------------------------------------
  // STEP 0 — FULL HISTORIC RANGE
  // -------------------------------------------------------

  if (response.index === 0) {

    showHistoricRange();

    archivalImages.classList.remove("is-visible");

  }


  // -------------------------------------------------------
  // STEP 1 — COLONIZATION
  // -------------------------------------------------------

  if (response.index === 1) {

    showColonization();

    archivalImages.classList.remove("is-visible");

  }


  // -------------------------------------------------------
  // STEP 2 — HUNTING / ERADICATION
  // -------------------------------------------------------

  if (response.index === 2) {

    showEradication();

  }
  
  // -------------------------------------------------------
  // STEP 3 — LAST STRONGHOLD
  // -------------------------------------------------------

  if (response.index === 3) {

    showLastStronghold();

  }

}


// =======================================================
// INITIALIZE SCROLLAMA
// =======================================================

scroller
  .setup({
    step: "#range-scrolly .step",
    offset: 0.55,
    debug: false
  })
  .onStepEnter(handleStepEnter);


// =======================================================
// RESIZE
// =======================================================


  window.addEventListener("resize", () => {
    scroller.resize();
  });


})
.catch(error => {

  console.error(
    "MAP DATA LOAD/DRAW ERROR:",
    error
  );

});