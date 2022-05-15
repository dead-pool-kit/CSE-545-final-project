
fetch('/ridge')
      .then(function (response) {
          return response.json();
      }).then(function (data) {
        creatRidgePlot(data)
      });


//read data
 function creatRidgePlot(data) {

  // set the dimensions and margins of the graph
   margin = {top: 60, right: 30, bottom: 20, left:110},
  width = 400 - margin.left - margin.right,
  height = 300 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  // console.log("--------ridgemap", data)

  var svgr = d3.select("#ridgeline")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");

  // Get the different categories and count them
  var categories = Object.keys(data[0])
  var n = categories.length

  // Add X axis
  var x = d3.scaleLinear()
    .domain([-10, 140])
    .range([ 0, width ]);
  svgr.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  // Create a Y scale for densities
  var y = d3.scaleLinear()
    .domain([0, 0.4])
    .range([ height, 0]);

  // Create the Y axis for names
  var yName = d3.scaleBand()
    .domain(categories)
    .range([0, height])
    .paddingInner(1)
  svgr.append("g")
    .call(d3.axisLeft(yName));

  // Compute kernel density estimation for each column:
  var kde = kernelDensityEstimator(kernelEpanechnikov(7), x.ticks(80)) // increase this 40 for more accurate density.
  var allDensity = []
  for (i = 0; i < n; i++) {
      key = categories[i]
      density = kde( data.map(function(d){  return d[key]; }) )
      allDensity.push({key: key, density: density})
  }

  // Add X axis label:
          
  svgr.append("text")
  .attr("text-anchor", "end")
  .attr("class", "xlabel")
  .attr("x", width/2 + margin.left)
  .attr("y", height + margin.top )
  .text("Values");

  // Y axis label:
  
  svgr.append("text")
  .attr("text-anchor", "end")
  .attr("class", "ylabel")
  .attr("transform", "rotate(-90)")
  .attr("y", -margin.left + 30)
  .attr("x", - width/2 + 0 )
  .text("Countries")

  // Add areas
  svgr.selectAll("areas")
    .data(allDensity)
    .enter()
    .append("path")
      .attr("transform", function(d){return("translate(0," + (yName(d.key)-height) +")" )})
      .datum(function(d){return(d.density)})
      .attr("fill", "#69b3a2")
      .attr("stroke", "#000")
      .attr("stroke-width", 1.25)
      .attr("d",  d3.line()
          .curve(d3.curveBasis)
          .x(function(d) { return x(d[0]); })
          .y(function(d) { return y(d[1]); })
      )

}

// This is what I need to compute kernel density estimation
function kernelDensityEstimator(kernel, X) {
  return function(V) {
    return X.map(function(x) {
      return [x, d3.mean(V, function(v) { return kernel(x - v); })];
    });
  };
}
function kernelEpanechnikov(k) {
  return function(v) {
    return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
  };
}