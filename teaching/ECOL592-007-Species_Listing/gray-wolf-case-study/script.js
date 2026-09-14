// =========================================================
// GRAY WOLF CASE STUDY
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
// ORIGINAL RANGE MAP SETUP
// =========================================================

const svg = d3.select("#wolf-map");

const width = 900;
const height = 650;

svg.selectAll("*").remove();


// =========================================================
// LOAD SHARED MAP DATA
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
  ),

  d3.json(
    "assets/maps/current-range.geojson"
  ),

])

.then(([world, admin1, range1, range2, presentRange]) => {


  // =======================================================
  // SHARED BASEMAP DATA
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
  normalizeForD3(presentRange);
  normalizeForD3(admin1);


  // =======================================================
  // ORIGINAL MAP PROJECTION
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
  // ORIGINAL MAP SVG DEFINITIONS
  // =======================================================

  const defs = svg.append("defs");


  // =======================================================
  // NORTH AMERICA CLIP PATH
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
  // ORIGINAL MAP — COUNTRY BASEMAP
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
  // ORIGINAL MAP — STATE / PROVINCE BOUNDARIES
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
  // ORIGINAL MAP — HISTORIC RANGE
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
  // ORIGINAL MAP — COLONIZATION SHADING
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


  // =======================================================
  // ORIGINAL MAP — 1960s REMNANT
  // =======================================================

  const remnantLayer = svg
    .append("g")
    .attr("class", "remnant-layer")
    .attr("opacity", 0);


  // -------------------------------------------------------
  // Northeastern Minnesota
  // -------------------------------------------------------

  const minnesotaPoint = projection([
    -92.5,
    47.7
  ]);


  if (minnesotaPoint) {

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


    remnantLayer
      .append("text")
      .attr("x", minnesotaPoint[0] + 50)
      .attr("y", minnesotaPoint[1] + 4)
      .attr("fill", "#2e3829")
      .attr("font-size", 14)
      .attr("font-weight", 600)
      .text("Northeastern Minnesota");

  }


  // -------------------------------------------------------
  // Isle Royale
  // -------------------------------------------------------

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

  }


  // Approximate range note

  remnantLayer
    .append("text")
    .attr("x", width - 25)
    .attr("y", height - 20)
    .attr("text-anchor", "end")
    .attr("fill", "#555")
    .attr("font-size", 11)
    .attr("font-style", "italic")
    .text("Approximate range");


  // =======================================================
  // ORIGINAL MAP SCENE STATES
  // =======================================================


  // -------------------------------------------------------
  // STEP 0 — HISTORICAL RANGE
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
  // STEP 1 — COLONIZATION
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


    wolfMaskGradient
      .select(".wolf-stop-1")
      .interrupt()
      .transition()
      .duration(1400)
      .attr("offset", "0%")
      .attr("stop-color", "white");


    wolfMaskGradient
      .select(".wolf-stop-2")
      .interrupt()
      .transition()
      .duration(1400)
      .attr("offset", "32%")
      .attr("stop-color", "white");


    wolfMaskGradient
      .select(".wolf-stop-3")
      .interrupt()
      .transition()
      .duration(1400)
      .attr("offset", "58%")
      .attr("stop-color", "#555");


    wolfMaskGradient
      .select(".wolf-stop-4")
      .interrupt()
      .transition()
      .duration(1400)
      .attr("offset", "100%")
      .attr("stop-color", "#050505");

  }


  // -------------------------------------------------------
  // STEP 2 — HUNTING / ERADICATION
  // -------------------------------------------------------

  const archivalImages =
    document.querySelector("#archival-images");


  function showEradication() {

    colonizationLayer
      .interrupt()
      .transition()
      .duration(700)
      .attr("opacity", 0.45);


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


  // -------------------------------------------------------
  // STEP 3 — 1960s LAST STRONGHOLD
  // -------------------------------------------------------

  function showLastStronghold() {

    archivalImages.classList.remove("is-visible");


    colonizationLayer
      .interrupt()
      .transition()
      .duration(700)
      .attr("opacity", 0);


    wolfRangeLayer
      .interrupt()
      .transition()
      .duration(1000)
      .attr("opacity", 0.12);


    remnantLayer
      .interrupt()
      .transition()
      .delay(300)
      .duration(900)
      .attr("opacity", 1);

  }


  // =======================================================
  // ORIGINAL MAP SCROLLAMA
  // =======================================================

  const scroller = scrollama();

  const steps =
    document.querySelectorAll("#range-scrolly .step");

  const mapDate =
    document.querySelector("#map-label .map-date");

  const mapTitle =
    document.querySelector("#map-label h2");


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


  function handleStepEnter(response) {

    steps.forEach(step => {
      step.classList.remove("is-active");
    });


    response.element.classList.add("is-active");


    const label = mapLabels[response.index];


    if (label) {
      mapDate.textContent = label.date;
      mapTitle.textContent = label.title;
    }


    if (response.index === 0) {

      archivalImages.classList.remove("is-visible");

      showHistoricRange();

    }


    if (response.index === 1) {

      archivalImages.classList.remove("is-visible");

      showColonization();

    }


    if (response.index === 2) {

      showEradication();

    }


    if (response.index === 3) {

      showLastStronghold();

    }

  }


  scroller
    .setup({
      step: "#range-scrolly .step",
      offset: 0.55,
      debug: false
    })
    .onStepEnter(handleStepEnter);


  // =======================================================
  // LISTING TRANSITION
  // =======================================================

  const listingScroller = scrollama();

  const listingSection =
    document.querySelector("#listing-transition");

  const listingSteps =
    document.querySelectorAll(
      "#listing-transition .listing-step"
    );


  function showSeparateListings() {

    listingSection.classList.remove("is-merged");

  }


  function showMergedListing() {

    listingSection.classList.add("is-merged");

  }


  function handleListingStepEnter(response) {

    listingSteps.forEach(step => {
      step.classList.remove("is-active");
    });


    response.element.classList.add("is-active");


    if (response.index === 0) {

      showSeparateListings();

    }


    if (response.index === 1) {

      showMergedListing();

    }

  }


  listingScroller
    .setup({
      step: "#listing-transition .listing-step",
      offset: 0.6,
      debug: false
    })
    .onStepEnter(handleListingStepEnter);


 // =======================================================
  // RECOVERY MAP
  // =======================================================

  const recoverySvg =
    d3.select("#recovery-map");


  const recoveryWidth = 900;
  const recoveryHeight = 650;


  recoverySvg.selectAll("*").remove();


  // =======================================================
  // RECOVERY MAP — WESTERN STATE SELECTION
  // =======================================================

  const recoveryStateNames = new Set([

    "Washington",
    "Oregon",
    "California",
    "Nevada",

    "Idaho",
    "Montana",
    "Wyoming",

    "Utah",
    "Colorado",

    "North Dakota",
    "South Dakota",
    "Nebraska"

  ]);


  const recoveryAdminFeatures =
    admin1.features.filter(feature => {

      const name =
        feature.properties?.name ||
        feature.properties?.name_en ||
        "";

      return recoveryStateNames.has(name);

    });


  const recoveryFocus = {
    type: "FeatureCollection",

    features: recoveryAdminFeatures
  };


  // =======================================================
  // RECOVERY MAP PROJECTION
  // =======================================================

  const recoveryProjection = d3
    .geoAlbers()
    .parallels([29.5, 45.5])
    .rotate([110, 0])
    .center([0, 44])
    .fitExtent(
      [
        [30, 30],
        [
          recoveryWidth - 30,
          recoveryHeight - 30
        ]
      ],
      recoveryFocus
    );


  const recoveryPath =
    d3.geoPath()
      .projection(recoveryProjection);
      
// =======================================================
// FULL NORTH AMERICA PROJECTION
// Used for the final present-day distribution scene
// =======================================================

const recoveryNAProjection = d3
  .geoAlbers()
  .parallels([29.5, 45.5])
  .rotate([96, 0])
  .center([0, 38])
  .fitExtent(
    [
      [30, 30],
      [
        recoveryWidth - 30,
        recoveryHeight - 30
      ]
    ],
    northAmerica
  );


const recoveryNAPath =
  d3.geoPath()
    .projection(recoveryNAProjection);

  // =======================================================
  // RECOVERY BASEMAP
  // =======================================================

  const recoveryWesternLayer = recoverySvg
  .append("g")
  .attr("class", "recovery-admin-layer");
  
  recoveryWesternLayer
  .selectAll("path")
  .data(recoveryAdminFeatures)
  .join("path")
  .attr("class", "recovery-admin")
  .attr("d", recoveryPath)
  .attr(
    "vector-effect",
    "non-scaling-stroke"
  );

// =======================================================
// FULL NORTH AMERICA BASEMAP
// Hidden until final recovery step
// =======================================================
// Keep only state/province features whose geographic
// centroid falls within the North American map region.

const recoveryNAAdminFeatures =
  admin1.features.filter(feature => {

    const centroid = d3.geoCentroid(feature);

    const lon = centroid[0];
    const lat = centroid[1];

    return (
      lon >= -170 &&
      lon <= -50 &&
      lat >= 10 &&
      lat <= 85
    );

  });
  
const recoveryNALayer = recoverySvg
  .append("g")
  .attr("class", "recovery-na-layer")
  .attr("opacity", 0);


// Countries

recoveryNALayer
  .selectAll(".recovery-na-country")
  .data(northAmerica.features)
  .join("path")
  .attr("class", "recovery-na-country")
  .attr("d", recoveryNAPath)
  .attr("fill", "#e7e5dc")
  .attr("stroke", "#676a64")
  .attr("stroke-width", 1);


// States / provinces

recoveryNALayer
  .append("g")
  .selectAll(".recovery-na-admin")
  .data(recoveryNAAdminFeatures)
  .join("path")
  .attr("class", "recovery-na-admin")
  .attr("d", recoveryNAPath)
  .attr("fill", "none")
  .attr("stroke", "#8f918b")
  .attr("stroke-width", 0.45)
  .attr("stroke-opacity", 0.5)
  .attr(
    "vector-effect",
    "non-scaling-stroke"
  );
  
  // =======================================================
// PRESENT-DAY RANGE
// Uses FULL North America projection
// =======================================================

const presentRangeLayer = recoverySvg
  .append("g")
  .attr("class", "present-range-layer")
  .attr("opacity", 0);


presentRangeLayer
  .selectAll("path")
  .data(presentRange.features)
  .join("path")
  .attr("class", "present-range")
  .attr("d", recoveryNAPath)
  .attr("fill", "#66705b")
  .attr("fill-opacity", 0.65)
  .attr("stroke", "#40483a")
  .attr("stroke-width", 0.8);


  // =======================================================
  // REINTRODUCTION LOCATIONS
  // =======================================================

  const recoverySites = [

    {
      name: "Central Idaho",
      year: "Reintroduced 1995",
      coords: [-114.5, 45.3]
    },

    {
      name: "Yellowstone",
      year: "Reintroduced 1995",
      coords: [-110.6, 44.6]
    }

  ];


  const recoverySiteLayer = recoverySvg
    .append("g")
    .attr("class", "recovery-site-layer");


  recoverySites.forEach(site => {

    const point =
      recoveryProjection(site.coords);


    if (!point) return;


    const group = recoverySiteLayer
      .append("g")
      .attr("class", "recovery-site")
      .attr(
        "transform",
        `translate(${point[0]},${point[1]})`
      );


    group
      .append("circle")
      .attr("r", 8);


    group
      .append("text")
      .attr("x", 14)
      .attr("y", -3)
      .text(site.name);


    group
      .append("text")
      .attr("class", "site-year")
      .attr("x", 14)
      .attr("y", 13)
      .text(site.year);

  });


  // =======================================================
  // SCHEMATIC RECOVERY EXPANSION
  // =======================================================

  const expansionLocations = [

    [-115.5, 46.5],
    [-113.6, 47.0],
    [-111.2, 46.3],
    [-109.7, 45.8],

    [-116.2, 44.1],
    [-112.8, 44.0],
    [-109.8, 43.5],
    [-107.8, 44.8]

  ];


  const recoveryExpansionLayer = recoverySvg
    .append("g")
    .attr("class", "recovery-expansion-layer");


  expansionLocations.forEach(
    (coords, index) => {

      const point =
        recoveryProjection(coords);


      if (!point) return;


      recoveryExpansionLayer
        .append("circle")
        .attr(
          "class",
          `recovery-wolf wolf-${index + 1}`
        )
        .attr("cx", point[0])
        .attr("cy", point[1])
        .attr("r", 6);

    }
  );


  // =======================================================
  // RECOVERY SCENE STATES
  // =======================================================

  const recoverySection =
    document.querySelector("#recovery-transition");

  const recoveryTitle =
    document.querySelector("#recovery-title");


  // -------------------------------------------------------
  // RECOVERY STEP 0
  // -------------------------------------------------------

  function showRecoveryPlanning() {

  recoverySection.classList.remove(
    "show-reintroductions",
    "show-expansion"
  );


  recoveryWesternLayer
  .interrupt()
  .transition()
  .duration(600)
  .attr("opacity", 1);


recoveryNALayer
  .interrupt()
  .transition()
  .duration(500)
  .attr("opacity", 0);


presentRangeLayer
  .interrupt()
  .transition()
  .duration(500)
  .attr("opacity", 0);


  recoverySiteLayer
    .interrupt()
    .transition()
    .duration(400)
    .attr("opacity", 1);


  recoveryExpansionLayer
    .interrupt()
    .transition()
    .duration(400)
    .attr("opacity", 1);


  recoveryTitle.textContent =
    "Recovery begins";

}


  // -------------------------------------------------------
  // RECOVERY STEP 1
  // -------------------------------------------------------

  function showRecoveryReintroductions() {

  recoverySection.classList.add(
    "show-reintroductions"
  );

  recoverySection.classList.remove(
    "show-expansion"
  );


  // Restore western recovery map
  recoveryWesternLayer
    .interrupt()
    .transition()
    .duration(600)
    .attr("opacity", 1);


  // Hide full North America map
  recoveryNALayer
    .interrupt()
    .transition()
    .duration(500)
    .attr("opacity", 0);


  // Show reintroduction locations
  recoverySiteLayer
    .interrupt()
    .transition()
    .duration(400)
    .attr("opacity", 1);


  // Keep expansion layer available,
  // but CSS keeps its points hidden until Step 2
  recoveryExpansionLayer
    .interrupt()
    .transition()
    .duration(400)
    .attr("opacity", 1);


  recoveryTitle.textContent =
    "Wolves return to the Northern Rockies";

}


  // -------------------------------------------------------
  // RECOVERY STEP 2
  // -------------------------------------------------------

  function showRecoveryExpansion() {

    recoverySection.classList.add(
      "show-reintroductions",
      "show-expansion"
    );
    
recoveryWesternLayer
  .interrupt()
  .transition()
  .duration(600)
  .attr("opacity", 1);


recoveryNALayer
  .interrupt()
  .transition()
  .duration(500)
  .attr("opacity", 0);


presentRangeLayer
  .interrupt()
  .transition()
  .duration(500)
  .attr("opacity", 0);

    recoverySiteLayer
      .interrupt()
      .transition()
      .duration(400)
      .attr("opacity", 1);


    recoveryExpansionLayer
      .interrupt()
      .transition()
      .duration(400)
      .attr("opacity", 1);


    presentRangeLayer
      .interrupt()
      .transition()
      .duration(400)
      .attr("opacity", 0);


    recoveryTitle.textContent =
      "Wolf populations expand";

  }


  // -------------------------------------------------------
  // RECOVERY STEP 3 — CURRENT DISTRIBUTION
  // -------------------------------------------------------

  function showPresentDistribution() {

  recoverySection.classList.remove(
    "show-reintroductions",
    "show-expansion"
  );


  // Fade away reintroduction markers
  recoverySiteLayer
    .interrupt()
    .transition()
    .duration(450)
    .attr("opacity", 0);


  // Fade away schematic expansion dots
  recoveryExpansionLayer
    .interrupt()
    .transition()
    .duration(450)
    .attr("opacity", 0);


  // Fade out western-state map
  recoveryWesternLayer
    .interrupt()
    .transition()
    .duration(700)
    .attr("opacity", 0);


  // Fade in full North America map
  recoveryNALayer
    .interrupt()
    .transition()
    .delay(250)
    .duration(900)
    .attr("opacity", 1);


  // Fade in actual present-day wolf distribution
  presentRangeLayer
    .interrupt()
    .transition()
    .delay(450)
    .duration(1000)
    .attr("opacity", 1);


  recoveryTitle.textContent =
    "Recovery changes the question";

}


  // =======================================================
  // RECOVERY SCROLLAMA
  // =======================================================

  const recoveryScroller =
    scrollama();


  const recoverySteps =
    document.querySelectorAll(
      "#recovery-transition .recovery-step"
    );


  function handleRecoveryStepEnter(response) {

    recoverySteps.forEach(step => {
      step.classList.remove("is-active");
    });


    response.element.classList.add("is-active");


    if (response.index === 0) {
      showRecoveryPlanning();
    }


    if (response.index === 1) {
      showRecoveryReintroductions();
    }


    if (response.index === 2) {
      showRecoveryExpansion();
    }


    if (response.index === 3) {
      showPresentDistribution();
    }

  }


  recoveryScroller
    .setup({
      step: "#recovery-transition .recovery-step",
      offset: 0.55,
      debug: false
    })
    .onStepEnter(handleRecoveryStepEnter);

// =========================================================
// DELISTING TIMELINE
// =========================================================

const delistingSection = document.querySelector("#delisting-timeline");

if (delistingSection) {

  const delistingScroller = scrollama();

  const delistingSteps =
    document.querySelectorAll("#delisting-timeline .delisting-step");

  const delistingTitle =
    document.querySelector("#delisting-title");

  const delistingRevealItems =
    document.querySelectorAll(
      "#delisting-timeline [data-show-step]"
    );

  const delistingTitles = [
    "Recovery creates a new problem",
    "Delisting begins",
    "Listing → delisting → relisting",
    "Law and politics reshape the map",
    "Where should federal protection end?"
  ];

  function updateDelistingVisual(stepIndex) {

    // Update title
    delistingTitle.textContent =
      delistingTitles[stepIndex] || delistingTitles[0];

    // Highlight active step
    delistingSteps.forEach(step => {
      step.classList.remove("is-active");
    });

    const activeStep =
      document.querySelector(
        `#delisting-timeline .delisting-step[data-delisting-step="${stepIndex}"]`
      );

    if (activeStep) {
      activeStep.classList.add("is-active");
    }

    // Reveal timeline cards / question chips / stat / final question
    delistingRevealItems.forEach(item => {
      const showStep = Number(item.dataset.showStep);

      if (stepIndex >= showStep) {
        item.classList.add("visible");
      } else {
        item.classList.remove("visible");
      }
    });

    console.log("Delisting step:", stepIndex);
  }

  function handleDelistingStepEnter(response) {
    const stepIndex = response.index;
    updateDelistingVisual(stepIndex);
  }

  delistingScroller
    .setup({
      step: "#delisting-timeline .delisting-step",
      offset: 0.55,
      debug: false
    })
    .onStepEnter(handleDelistingStepEnter);

  // Initialize first state
  updateDelistingVisual(0);

  window.addEventListener("resize", () => {
    delistingScroller.resize();
  });

}
// =========================================================
// STAKEHOLDER CASE FILES
// =========================================================

const stakeholderModal =
  document.querySelector("#stakeholder-modal");

const stakeholderModalContent =
  document.querySelector("#stakeholder-modal-content");

const stakeholderModalClose =
  document.querySelector("#stakeholder-modal-close");


const stakeholderFiles = {

  state: {
  kicker: "State agency case file",
  title: "State Wildlife Agencies",

  sharedPacket:
    "assets/files/western_gray_wolf_shared_stakeholder_packet.pdf",

  role:
    "You represent a coalition of western state wildlife agencies. These agencies are responsible for conserving wolves, monitoring populations, managing conflicts, and balancing wolves with other wildlife-management objectives. However, wolves are not in the same biological or legal position in every state. Some states already manage large, established populations, while others are overseeing the early stages of recolonization. Your coalition must determine whether it can support one federal delisting decision across these different circumstances.",

  sourceIntro:
    "Review the following state documents. They reflect different wolf populations, management responsibilities, and positions on federal delisting. They do not necessarily lead to the same conclusion.",

  primarySources: [
    {
      title: "Idaho Wolf Population Management Plan, 2008–2012",
      organization: "Idaho Department of Fish and Game",
      year: "2008",
      pages: "Read PDF pages 5–7 and 23–25",
      url:
        "https://idfg.idaho.gov/sites/default/files/old-web/docs/wolves/plan08.pdf",
      description:
        "A state plan describing agency responsibilities, population objectives, management thresholds, and available responses after federal delisting.",
      required: true
    },
    {
      title: "Letter Regarding the Proposed Gray Wolf Delisting",
      organization: "California Fish and Game Commission",
      year: "2019",
      pages: "Read the entire letter",
      url:
        "https://faculty.nelson.wisc.edu/treves/archive_BAS/LTR_FGC_Gray%20Wolf%20Delisting_USFWS_071519_Final.pdf",
      description:
        "A formal state response to the 2019 proposal to remove federal protections for gray wolves across the lower 48 states.",
      required: true
    },
    {
      title: "Wolf Conservation and Management Plan",
      organization: "Washington Department of Fish and Wildlife",
      year: "2011",
      pages: "Optional: read the Executive Summary",
      url:
        "https://wdfw.wa.gov/publications/00001",
      description:
        "A state recovery plan addressing population distribution, state and federal authority, livestock conflict, ungulate management, public attitudes, and long-term monitoring.",
      required: false
    }
  ],

  considerations: [
    "What responsibilities and costs would transfer to state agencies if federal protections were removed?",
    "Are the population thresholds and management safeguards described by Idaho sufficient to maintain a viable and connected wolf population?",
    "Why might an approach that is appropriate for an established population be inappropriate for a newly recolonizing population?",
    "Should differences in population size, distribution, state law, and management capacity affect a nationwide federal determination?",
    "What role should hunting, lethal control, and other population-management tools have after delisting?"
  ],

  pressures: [
    "State agencies may gain management flexibility after delisting, but they would also assume additional monitoring, enforcement, conflict-response, and funding responsibilities.",
    "State wildlife professionals must operate within laws and policies established by governors, legislatures, and wildlife commissions while also responding to scientific information and public input.",
    "A decline in abundance, distribution, or connectivity could trigger additional protections or a future federal status review.",
    "A position that emphasizes state authority must also explain how states will maintain viable populations across jurisdictional boundaries."
  ],

  task: [
    "Review the shared FWS packet and the state documents.",
    "Decide whether your coalition supports, opposes, or conditionally supports the proposed federal delisting.",
    "Use at least two specific passages, figures, tables, or management provisions from the state documents in your argument.",
    "Explain whether one federal determination is appropriate for states with populations at different stages of recovery.",
    "Identify the population safeguards, monitoring commitments, and coordination mechanisms that would be necessary after delisting.",
    "Identify the strongest argument against your coalition’s position and explain how you would respond to it."
  ]
},


 conservation: {
  kicker: "Conservation organization case file",
  title: "Conservation Organization",

  sharedPacket:
    "assets/files/western_gray_wolf_shared_stakeholder_packet.pdf",

  role:
    "You represent a coalition of conservation organizations commenting on the proposed removal of federal protections for gray wolves. Your organization supports durable wolf recovery and is concerned that FWS may be drawing conclusions that are broader or more certain than the underlying science supports. Your responsibility is to identify consequential uncertainties, distinguish scientific criticism from advocacy, and make the strongest defensible recommendation from the administrative record.",

  sourceIntro:
  "Review the following sources alongside the shared FWS packet. The independent peer review evaluates the scientific logic and information underlying the proposed rule. The coalition comment shows how conservation organizations used scientific, legal, and institutional arguments to advocate for an outcome. An optional primary research paper provides a closer look at ancestry, admixture, and recolonization in Pacific Northwest wolves.",

  primarySources: [
    {
      title:
        "Independent Peer Review of the 2019 Proposed Delisting Rule",
      author:
        "Daniel R. MacNulty",
      organization:
        "U.S. Fish and Wildlife Service",
      date:
        "May 2019",
      pages:
        "Adobe PDF pages 230–238",
      url:
        "https://www.fws.gov/sites/default/files/documents/final-gray-wolf-peer-review-summary-report-2019-05-31.pdf",
      prompt:
        "Focus on MacNulty’s analysis of the combined gray wolf entity, western and eastern population structure, the meaning of current range, and human-caused mortality."
    },
    {
      title:
        "Public Comment on the Proposed Gray Wolf Delisting Rule",
      author:
        "Western Environmental Law Center et al.",
      organization:
        "Submitted on behalf of eleven western conservation organizations",
      date:
        "July 15, 2019",
      pages:
        "Pages 1–3 and 9–10",
      url:
        "https://rewilding.org/wp-content/uploads/2019/07/2019.07.15_WELC_FWSHQES20180097-copy.pdf",
      prompt:
        "Identify how the coalition translates information about abundance, range, population structure, and recovery into scientific, legal, and advocacy arguments."
    },
    {
  title:
    "Natural Re-colonization and Admixture of Wolves in the U.S. Pacific Northwest",
  author:
    "Hendricks et al.",
  organization:
    "Heredity 122: 133–149",
  date:
    "2019",
  pages:
    "Optional: Abstract, Figure 1, Results figures, and Discussion",
  url:
    "https://www.nature.com/articles/s41437-018-0094-x",
  optional:
    true,
  prompt:
    "Consider what the ancestry and admixture of Pacific Northwest wolves reveal about connectivity, genetic diversity, and whether these recolonizing wolves are biologically interchangeable with wolves in the Northern Rocky Mountains."
}
  ],

  considerations: [
    "Which part of FWS’s recovery conclusion is most vulnerable to scientific challenge?",
    "What does the range map in the shared packet establish, and what remains uncertain about how FWS defined current range?",
    "Does FWS adequately distinguish population abundance from geographic, genetic, and functional recovery?",
    "How could mortality in core populations affect dispersal, connectivity, and recolonization elsewhere?",
    "Which uncertainties identified by MacNulty could materially change the delisting decision?",
    "Which claims in the coalition comment are supported by scientific information, and which depend primarily on legal interpretation, organizational values, or advocacy?",
    "What does the ancestry of recolonizing Pacific Northwest wolves suggest about connectivity, genetic representation, and the value of peripheral populations?"
  ],

  pressures: [
    "Members and supporters may expect the organization to favor continued federal protection and broader restoration of wolves.",
    "The organization must make arguments that can withstand scientific scrutiny and possible judicial review, not simply arguments that advance its preferred outcome.",
    "Strong rhetorical claims may attract public attention but can weaken the organization’s credibility if they overstate what the underlying sources establish.",
    "Litigation is available when the organization believes FWS has ignored important information, used unsupported assumptions, or failed to evaluate relevant threats."
  ],

  task: [
    "Decide whether your organization supports, opposes, or seeks modification of the proposed delisting.",
    "Identify two findings in the record that most strongly support your position.",
    "Identify one FWS conclusion that depends on a disputed or insufficiently supported assumption.",
    "Explain why that uncertainty is biologically or legally consequential rather than simply an unavoidable limitation of wildlife research.",
    "Acknowledge the strongest fact supporting delisting and explain why it does or does not change your recommendation.",
    "Identify one argument favorable to wolf protection that FWS could not legitimately treat as determinative under the ESA."
  ]
},


  local: {
  kicker: "Rural community case file",
  title: "Rural Livelihoods & Hunting Coalition",

  sharedPacket:
    "assets/files/western_gray_wolf_shared_stakeholder_packet.pdf",

  role:
    "You represent a coalition of livestock producers, hunters, outfitters, private landowners, and rural residents who live and work in areas occupied by wolves. Coalition members do not necessarily agree on every issue, but they share an interest in maintaining viable wildlife populations while ensuring that managers can respond effectively to livestock depredation, effects on game populations, and other localized conflicts. Your responsibility is to distinguish documented impacts from perceived concerns and determine which arguments are relevant to the federal delisting decision.",

  sourceIntro:
    "Review the following sources alongside the shared FWS packet. The research article examines where wolf–livestock conflicts occur and whether targeted removal or public harvest reduces future conflicts. The two public comments show how livestock and hunting organizations used biological, legal, economic, and governance arguments to support delisting.",

  primarySources: [
    {
      title:
        "Wolf–Livestock Conflict and the Effects of Wolf Management",
      author:
        "DeCesare et al.",
      organization:
        "The Journal of Wildlife Management 82: 711–722",
      date:
        "2018",
      pages:
        "Abstract, Figures 1–3, and discussion on pages 719–721",
      url:
        "https://fwp.mt.gov/binaries/content/assets/fwp/conservation/wildlife-reports/wolf/2018_decesare_etal_wolflivestockconflict_jwm.pdf",
      prompt:
        "Examine where confirmed depredations occurred, whether conflicts were broadly distributed or geographically concentrated, and how effectively targeted removal and public harvest reduced subsequent conflicts."
    },
    {
      title:
        "Public Comment on the Proposed Gray Wolf Delisting Rule",
      author:
        "Public Lands Council, National Cattlemen’s Beef Association, American Sheep Industry Association et al.",
      organization:
        "Submitted by national and state livestock associations",
      date:
        "July 15, 2019",
      pages:
        "All seven pages",
      url:
        "https://www.sheepusa.org/wp-content/uploads/2019/08/Comments_WolfDelisting_2018_07_15.pdf",
      prompt:
        "Identify which claims concern wolf biological status, which concern state management authority, and which reflect the practical interests of livestock producers."
    },
    {
      title:
        "Comment on the 2019 Proposed Gray Wolf Delisting Rule",
      author:
        "Rocky Mountain Elk Foundation",
      organization:
        "Submitted to the U.S. Fish and Wildlife Service",
      date:
        "May 10, 2019",
      pages:
        "All four pages",
      url:
        "https://downloads.regulations.gov/FWS-HQ-ES-2018-0097-60622/attachment_1.pdf",
      prompt:
        "Consider whether the organization supports delisting primarily with information about wolf recovery, concerns about ungulates and hunting, a preference for state management, or some combination of these arguments."
    }
  ],

  considerations: [
    "Which local costs and conflicts are documented in the sources, and which are asserted without supporting information?",
    "Are wolf–livestock conflicts broadly distributed or concentrated among particular producers and locations?",
    "Do compensation payments fully address the effects of a depredation, including unverified losses, added labor, prevention costs, and disruption to livestock operations?",
    "Does the research support general public harvest, targeted removal of conflict wolves, or a combination of management approaches?",
    "What information would be needed to evaluate claims that wolves are affecting elk, deer, hunting opportunities, or outfitting businesses?",
    "Which arguments demonstrate something about wolf recovery status, and which instead support greater local or state management flexibility?",
    "If wolves remain biologically recovered, what management authority should states and local communities have after delisting?"
  ],

  pressures: [
    "The costs of living with wolves are unevenly distributed, with some producers and communities experiencing repeated conflicts while others experience few or none.",
    "Coalition members may expect the group to support delisting even when their preferred management actions are not directly relevant to the ESA listing criteria.",
    "Livestock producers may view compensation as incomplete when losses cannot be verified or when programs exclude added labor, prevention costs, reduced weight gain, or other indirect effects.",
    "Hunters and outfitters may be concerned about locally important elk or deer herds, although wolves may be only one of several factors affecting ungulate populations.",
    "Broad public support for wolves can create frustration when rural communities believe that people living outside wolf range influence policy without sharing its costs.",
    "The coalition must propose management actions that address documented conflicts without undermining the long-term viability of wolf populations."
  ],

  task: [
    "Decide whether the coalition supports, opposes, or seeks modification of the proposed delisting.",
    "Identify two documented findings that most strongly support your recommendation.",
    "Identify the most important economic, social, or management concern for people living with wolves.",
    "Describe one specific management authority or tool the coalition wants and explain how it would address a documented problem.",
    "Explain which parts of your argument bear directly on wolf status under the ESA and which instead concern management after delisting.",
    "Acknowledge the strongest concern raised by conservation organizations and describe a safeguard that could address it.",
    "Identify one genuine local concern that FWS could not legitimately use as the determining basis for delisting."
  ]
}

};


function openStakeholderFile(stakeholder) {

  const file = stakeholderFiles[stakeholder];

  if (!file) return;


  const considerationsHTML =
    file.considerations
      .map(item => `<li>${item}</li>`)
      .join("");


  const pressuresHTML =
    file.pressures && file.pressures.length
      ? `
        <div class="case-file-section">

          <h3>External pressures</h3>

          <ul>
            ${file.pressures
              .map(item => `<li>${item}</li>`)
              .join("")}
          </ul>

        </div>
      `
      : "";


  const taskHTML =
    file.task
      .map(item => `<li>${item}</li>`)
      .join("");


  stakeholderModalContent.innerHTML = `

    <p class="case-file-kicker">
      ${file.kicker}
    </p>

    <h2>
      ${file.title}
    </h2>


    <a
      class="shared-packet-link"
      href="${file.sharedPacket}"
      target="_blank"
      rel="noopener"
    >
      DOWNLOAD SHARED EVIDENCE PACKET →
    </a>


    <div class="case-file-section">

      <h3>Your role</h3>

      <p>
        ${file.role}
      </p>

    </div>


    <div class="case-file-section">

      <h3>Key considerations</h3>

      <ul>
        ${considerationsHTML}
      </ul>

    </div>


    ${pressuresHTML}


    <div class="case-file-section">

      <h3>Your task</h3>

      <ul>
        ${taskHTML}
      </ul>

    </div>

  `;


  stakeholderModal.classList.add("is-open");

  stakeholderModal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.style.overflow = "hidden";

}


function closeStakeholderFile() {

  stakeholderModal.classList.remove("is-open");

  stakeholderModal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.style.overflow = "";

}


document
  .querySelectorAll(".stakeholder-card")
  .forEach(card => {

    card.addEventListener("click", () => {

      openStakeholderFile(
        card.dataset.stakeholder
      );

    });

  });


stakeholderModalClose.addEventListener(
  "click",
  closeStakeholderFile
);


stakeholderModal
  .querySelector(".stakeholder-modal-backdrop")
  .addEventListener(
    "click",
    closeStakeholderFile
  );


document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape" &&
      stakeholderModal.classList.contains("is-open")
    ) {
      closeStakeholderFile();
    }

  }
);

  // =======================================================
  // ONE RESIZE LISTENER
  // =======================================================

  window.addEventListener(
    "resize",
    () => {

      scroller.resize();
      listingScroller.resize();
      recoveryScroller.resize();

    }
  );


})

.catch(error => {

  console.error(
    "MAP DATA LOAD/DRAW ERROR:",
    error
  );

});