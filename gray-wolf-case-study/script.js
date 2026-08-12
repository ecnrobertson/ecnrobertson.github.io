// =========================================================
// GRAY WOLF CASE STUDY
// MAP + SCROLL INTERACTIONS
// =========================================================


// =========================================================
// FIX POLYGON WINDING FOR D3
// ---------------------------------------------------------
// D3's spherical geographic renderer expects:
//
// Exterior rings = clockwise
// Interior holes = counterclockwise
//
// ArcGIS GeoJSON often arrives in the opposite orientation.
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

  // Standard shoelace convention:
  // positive area  = counterclockwise
  // negative area  = clockwise

  const isClockwise = signedRingArea(ring) < 0;

  if (isClockwise !== shouldBeClockwise) {
    return [...ring].reverse();
  }

  return ring;
}


function normalizeForD3(featureCollection) {

  featureCollection.features.forEach(feature => {

    if (!feature.geometry) return;


    // -----------------------------------------------------
    // POLYGON
    // -----------------------------------------------------

    if (feature.geometry.type === "Polygon") {

      feature.geometry.coordinates =
        feature.geometry.coordinates.map((ring, index) => {

          // First ring = exterior = clockwise
          // Remaining rings = holes = counterclockwise

          const shouldBeClockwise = index === 0;

          return orientRing(
            ring,
            shouldBeClockwise
          );

        });

    }


    // -----------------------------------------------------
    // MULTIPOLYGON
    // -----------------------------------------------------

    if (feature.geometry.type === "MultiPolygon") {

      feature.geometry.coordinates =
        feature.geometry.coordinates.map(polygon =>

          polygon.map((ring, index) => {

            const shouldBeClockwise = index === 0;

            return orientRing(
              ring,
              shouldBeClockwise
            );

          })

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


// =========================================================
// LOAD DATA
// =========================================================

Promise.all([

  // North America basemap source
  d3.json(
    "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json"
  ),

  // Historic wolf-range polygons
  d3.json(
    "assets/maps/historic-range-1.geojson"
  ),

  d3.json(
    "assets/maps/historic-range-2.geojson"
  )

])
.then(([world, range1, range2]) => {


  // =======================================================
  // BASEMAP
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


  console.log(
    "North American countries:",
    JSON.stringify(
      northAmerica.features.map(d => d.id)
    )
  );


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


  console.log(
    "Wolf geometry types:",
    JSON.stringify(
      historicRange.features.map(
        d => d.geometry.type
      )
    )
  );


  // =======================================================
  // FIX ARC GIS → D3 POLYGON ORIENTATION
  // =======================================================

  normalizeForD3(historicRange);


  console.log(
    "Wolf bounds AFTER D3 normalization:",
    JSON.stringify(
      d3.geoBounds(historicRange)
    )
  );


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


  console.log(
    "Projected wolf bounds:",
    JSON.stringify(
      path.bounds(historicRange)
    )
  );


  // =======================================================
  // DRAW BASEMAP
  // =======================================================

  svg
    .append("g")
    .attr("class", "basemap-layer")
    .selectAll("path")
    .data(northAmerica.features)
    .join("path")
    .attr("d", path)
    .attr("class", "country");


  // =======================================================
  // DRAW HISTORIC WOLF RANGE
  // -------------------------------------------------------
  // Still magenta temporarily so we can't miss it.
  // =======================================================

  svg
    .append("g")
    .attr("class", "historic-range-layer")
    .selectAll("path")
    .data(historicRange.features)
    .join("path")
    .attr("d", path)
    .attr("fill", "#66705b")
    .attr("fill-opacity", 0.68)
    .attr("stroke", "#40483a")
    .attr("stroke-width", 2);


})
.catch(error => {

  console.error(
    "MAP ERROR:",
    error
  );

});


// =========================================================
// SCROLL-DRIVEN INTERACTIONS
// =========================================================

const scroller = scrollama();

const steps = document.querySelectorAll(".step");


function handleStepEnter(response) {

  steps.forEach(step => {
    step.classList.remove("is-active");
  });


  response.element.classList.add("is-active");


  console.log(
    "Current step:",
    response.index
  );

}


// =========================================================
// INITIALIZE SCROLLAMA
// =========================================================

scroller
  .setup({

    step: "#range-scrolly .step",

    offset: 0.55,

    debug: false

  })
  .onStepEnter(handleStepEnter);


// =========================================================
// HANDLE RESIZE
// =========================================================

window.addEventListener("resize", () => {

  scroller.resize();

});