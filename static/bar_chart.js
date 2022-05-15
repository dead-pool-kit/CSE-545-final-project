
defaultFeature  = 'GDP (current US$)'
yearSt = 2000
yearEnd = 2019


fetch('/barchart', {
  method: "POST",
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({'attr': defaultFeature, 'worst': false, 'yearSt': yearSt, 'yearEnd': yearEnd})
})
.then(function (response) {
    return response.json();
}).then(function (data) {
  d3.select('input[name="topWrst"]').node().checked = false
  plot_bar_chart(data)
});

function plot_bar_chart(data) {

  // set the dimensions and margins of the graph
  var margin = {top: 60, right: 30, bottom: 60, left: 90},
              width = 460 - margin.left - margin.right,
              height = 380 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  svgb = d3.select("#bar_chart")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("class", "svgb")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

  var tooltipBarr = d3.select("#bar_chart").append("div").attr("class", "toolTipBarr");

  var colorScale = d3.scaleLinear()
          .domain([d3.min(data, function(d) { return +d[defaultFeature] }),
           d3.max(data, function(d) { return +d[defaultFeature] }) ])
          .range(["#fee6ce","#d65d0e"])

  // Add X axis
  var x = d3.scaleLinear()
    .domain([0, d3.max(data, function(d) { return +d[defaultFeature] }) ])
    .range([ 0, width]);
  
  svgb.append("g")
    .attr("transform", "translate(0," + height + ")")
    .attr("class", "bc_xaxis")
    .call(d3.axisBottom(x))
    .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end");

  // Y axis
  var y = d3.scaleBand()
    .range([ 0, height ])
    .domain(data.map(function(d) { return d['Country Code']; }))
    .padding(.1);
  
    svgb.append("g")
    .attr("class", "bc_yaxis")
    .call(d3.axisLeft(y))
  
 // Add X axis label:
  svgb.append("text")
  .attr("text-anchor", "end")
  .attr("class", "xlabel")
  .attr("font-size", "15px")
  .attr("x", width/2 + margin.left + 113)
  .attr("y", height + margin.top - 5 )
  .text(defaultFeature);

  // Y axis label:
  svgb.append("text")
  .attr("text-anchor", "end")
  .attr("class", "ylabel")
  .attr("font-size", "15px")
  .attr("transform", "rotate(-90)")
  .attr("y", -margin.left + 30)
  .attr("x", - width/2 + 60 )
  .text("Countries")
  
  //Bars
  var u = svgb.selectAll("myRect")
    .data(data)
    
   u.enter()
    .append("rect")
    .attr("x", x(0) + 2 )
    .attr("y", function(d) { return y(d['Country Code']) })
    .attr("width", function(d) { return x(d[defaultFeature]); })
    .attr("height", y.bandwidth() )
    .attr("fill", function(d) {
      return colorScale(+d[defaultFeature]);
    })
    .on("mousemove", function(d){
      tooltipBarr
      .html(ccMapping.get(d['Country Code']) + " : "  + (+d[defaultFeature]))
      // .transition()
      // .duration('200')
        .style("left", d3.event.pageX - 50 + "px")
        .style("top", d3.event.pageY - 70 + "px")
        .style("display", "inline-block")
  })
  .on("mouseout", function(d){ tooltipBarr
    // .transition()
    // .duration('10')
    .style("display", "none");});
  
  update_bar_chart(data)
}

function update_bar_chart(data) {
  
  // set the dimensions and margins of the graph
  var margin = {top: 60, right: 30, bottom: 60, left: 90},
  width = 460 - margin.left - margin.right,
  height = 373 - margin.top - margin.bottom;

  var colorScale = d3.scaleLinear()
          .domain([d3.min(data, function(d) { return +d[defaultFeature] }),
           d3.max(data, function(d) { return +d[defaultFeature] }) ])
           .range(["#fee6ce","#d65d0e"])

  // Add X scale
  var x = d3.scaleLinear()
  .domain([0, d3.max(data, function(d) { return +d[defaultFeature] }) ])
  .range([ 0, width]);
  
  // Add X axis
  d3.select(".bc_xaxis")
  .transition()
  .duration(1000)
  .call(d3.axisBottom(x))
  .selectAll("text")
  .attr("transform", "translate(-10,0)rotate(-45)")
  .style("text-anchor", "end")


// Y axis
var y = d3.scaleBand()
  .range([ 0, height ])
  .domain(data.map(function(d) { return d['Country Code']; }))
  .padding(.1);

    d3.select(".bc_yaxis")
    .transition()
    .duration(1000)
      .call(d3.axisLeft(y))


d3.select(".xlabel")
// .attr("x", width/2 + margin.left)
// .attr("y", height + margin.top -15)
.transition()
.duration(1000)
.text(defaultFeature);

//Bars
var u = svgb.selectAll("rect")
  .data(data)
  
  u.enter()
  .append("rect")
  .merge(u)
  .transition()
  .duration(1000)
  .attr("x", x(0) + 2 )
  .attr("y", function(d) { return y(d['Country Code']) })
  .attr("width", function(d) { return x(d[defaultFeature]); })
  .attr("height", y.bandwidth() )
  .attr("fill", function(d) {
    return colorScale(+d[defaultFeature]);
  })

}