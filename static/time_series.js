fetch('/timeser/' + country + '/' + defaultFeature)
.then(function (response) {
    return response.json();
}).then(function (data) {
    console.log(data)
  plotTimeSer(data)
});


function plotTimeSer(data) {
//Read the data
// d3.csv("https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/3_TwoNumOrdered_comma.csv",

//   // When reading the csv, I must format variables:
//   function(d){
//     return { date : d3.timeParse("%Y")(d.date), value : d.value }
//   },

//   // Now I can use this dataset:
//   function(data) {
d3.select("#time_series")
    .select("svg")
    .remove()

  var cols = Object.keys(data[0]);
  var attr = cols[0];
// set the dimensions and margins of the graph
var margin = {top: 30, right: 100, bottom: 50, left: 100},
width = 760 - margin.left - margin.right,
height = 400 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svgt = d3.select("#time_series")
.append("svg")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");

    // data.Year = d3.timeParse("%y")(data['Year']);
    // console.log(data);
    // Add X axis --> it is a date format
    var x = d3.scaleLinear()
      .domain(d3.extent(data, function(d) { return d['Year']  ; }))
      .range([ 0, width ]);
    svgt.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))

    const max = d3.max(data, function(d) { return +d['GDP (current US$)']; })

    // Add Y axis
    var y = d3.scaleLinear()
      .domain([0, d3.max(data, function(d) { return +d[defaultFeature]; })])
      .range([ height, 0 ]);
    svgt.append("g")
      .call(d3.axisLeft(y));

      // Add X axis label:
      svgt.append("text")
      .attr("text-anchor", "end")
      .attr("class", "xlabel")
      .attr("x", width/2 + margin.left - 50)
      .attr("y", height + margin.top + 10)
      .text("Year");

      // Y axis label:

      svgt.append("text")
      .attr("text-anchor", "end")
      .attr("class", "ylabel")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 30)
      .attr("x", - width/2 + 220)
      .text(attr)

    // // Set the gradient
    // svgt.append("linearGradient")
    //   .attr("id", "line-gradient")
    //   .attr("gradientUnits", "userSpaceOnUse")
    //   .attr("x1", 0)
    //   .attr("y1", y(0))
    //   .attr("x2", 0)
    //   .attr("y2", y(max))
    //   .selectAll("stop")
    //     .data([
    //       {offset: "0%", color: "blue"},
    //       {offset: "100%", color: "red"}
    //     ])
    //   .enter().append("stop")
    //     .attr("offset", function(d) { return d.offset; })
    //     .attr("stop-color", function(d) { return d.color; });
    // Add the line
    svgt.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "steelblue" )
      .attr("stroke-width", 2)
      .attr("d", d3.line()
        .x(function(d) { return x(d.Year) })
        .y(function(d) { return y(d[defaultFeature]) })
        )

}
