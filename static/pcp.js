axis_order = [
  "Exports of goods and services (% of GDP)",                                                         
  "Trade (% of GDP)",                                                                                
  "Mineral rents (% of GDP)",                                                                        
  "GDP (current US$)",                                                                                
  "GNI (current US$)"                                                                            
]

yearSt = 2000
yearEnd = 2019
year = 2000

fetch('/pcp', {
  method: "POST",
  headers: {
    'Content-Type': 'application/json'
  },

  body: JSON.stringify({'yearSt': year, 'yearEnd': year, 'axis': axis_order})
})
  .then(function (response) {
      return response.json();
  }).then(function (data) {
    createPCPPlot2(data, axis_order)
  });

function createPCPPlot2(cars, axis_order){

  console.table('rspppp!!!!')

  // console.log(cars)
   deleteElements();
      // set the dimensions and margins of the graph
   margin = {top: 90, right: 60, bottom: 60, left: 40},
   width = 950 - margin.left - margin.right,
   height = 350 - margin.top - margin.bottom;

    var pcpPlot = d3version3.select('#pcpplot')
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    // .style("width","100%")
    // .style("height", "100%")
    .attr("transform",
    "translate(" + margin.left + "," + (margin.top-50) + ")");

    var x = d3version3.scale.ordinal().rangePoints([0, width+60], 1),
    y = {},
    dragging = {};

    var line = d3version3.svg.line(),
    axis = d3version3.svg.axis().orient("left"),
    background,
    foreground;

    // var pcpTtl= "";

    
    // axis_order.forEach(el => pcpTtl+= " -> "+el)
    // console.log('pcp-dataaaaa:'+ cars)
    // d3.select('#pcpPlotTitle')
    // .append("text")
    // .attr("font-size", "8px")
    // .attr("dy", "0em")
    // .text("Current Order:      ")
    // .append("text")
    // .attr("dy", "10em")
    // .text(pcpTtl.substring(3))

    // console.log('fielddssnsknskfns-dataaaaa:'+ axis_order)

    // Extract the list of dimensions and create a scale for each.
    x.domain(dimensions = axis_order.filter(function(d) {
      return d != "class" && (y[d] = d3version3.scale.linear()
          .domain(d3version3.extent(cars, function(p) { return +p[d]; }))
          .range([height + margin.top + margin.bottom-50, 0]));
    }));

    // var color = d3.scaleOrdinal(d3.schemeCategory10);

    var color = d3.scaleOrdinal()
                .domain([1, 6])
                .range(["#458588", "#cc241d","#b16286", "#98971A", "#d79921", "#689d6a", "#a89984"])
    // Add grey background lines for context.
    background = pcpPlot.append("g")
        .attr("class", "background")
      .selectAll("path")
        .data(cars)
      .enter().append("path")
        .attr("d", path);
  
    // Add blue foreground lines for focus.
    foreground = pcpPlot.append("g")
        .attr("class", "foreground")
      .selectAll("path")
        .data(cars)
      .enter().append("path")
        .attr("d", path)
        .style("stroke", function(d) { return color(d.class); })
        .style("opacity", 1);

    // Add a group element for each dimension.
    var g = pcpPlot.selectAll(".dimension")
        .data(dimensions)
      .enter().append("g")
        .attr("class", "dimension")
        .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
        .call(d3version3.behavior.drag()
          .origin(function(d) { return {x: x(d)}; })
          .on("dragstart", function(d) {
            dragging[d] = x(d);
            background.attr("visibility", "hidden");
          })
          .on("drag", function(d) {
            dragging[d] = Math.min(width, Math.max(0, d3version3.event.x));
            foreground.attr("d", path);
            dimensions.sort(function(a, b) { return position(a) - position(b); });
            x.domain(dimensions);
            g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
          })
          .on("dragend", function(d) {
            delete dragging[d];
            transition(d3version3.select(this)).attr("transform", "translate(" + x(d) + ")");
            transition(foreground).attr("d", path);
            background
                .attr("d", path)
              .transition()
                .delay(500)
                .duration(0)
                .attr("visibility", null);
          }));
  
    // Add an axis and title.
    g.append("g")
        .attr("class", "axis")
        .each(function(d) { d3version3.select(this).call(axis.scale(y[d])); })
      .append("text")
      .attr("transform", "rotate(-10)")
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .attr("y", -9)
        .text(function(d) { return d; });
  
    // Add and store a brush for each axis.
    g.append("g")
        .attr("class", "brush")
        .each(function(d) {
          d3version3.select(this).call(y[d].brush = d3version3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush));
        })
      .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);
    
    function position(d) {
      var v = dragging[d];
      return v == null ? x(d) : v;
    }
    
    function transition(g) {
      return g.transition().duration(500);
    }
    
    // Returns the path for a given data point.
    function path(d) {
      return line(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
    }
    
    function brushstart() {
      d3version3.event.sourceEvent.stopPropagation();
    }
    
    // Handles a brush event, toggling the display of foreground lines.
    function brush() {
      var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
          extents = actives.map(function(p) { return y[p].brush.extent(); });
      foreground.style("display", function(d) {
        return actives.every(function(p, i) {
          return extents[i][0] <= d[p] && d[p] <= extents[i][1];
        }) ? null : "none";
      });
    }
  }

  function deleteElements(){
    d3.select('#pcpplot').select("svg").remove()

    // d3.select('.background').remove()
    // d3.select('.foreground').remove()
    // d3.select('.axis').remove()
    // d3.select('.brush').remove()
    // d3.select('#pcpPlotTitle').selectAll("text").remove()
  }