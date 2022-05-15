defaultFeature  = 'GDP (current US$)'

country = 'USA';

fetch('/timeser2', {
  method: "POST",
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({'attr':defaultFeature, 'country':country, 'reset': true})
})
.then(function (response) {
    return response.json();
}).then(function (data) {
  createTimeSeries(data)
});

function createTimeSeries(data) {

  d3.select("#time_series").selectAll("*").remove()
  
  // set the dimensions and margins of the graph
  var margin = {top: 60, right: 230, bottom: 50, left: 80},
  width = 740 - margin.left - margin.right,
  height = 400 - margin.top - margin.bottom;
  // append the svg object to the body of the page
  svgtime = d3.select("#time_series")
              .append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Parse the Data
    //////////
    // GENERAL //
    //////////
    // List of groups = header of the csv files

    var keys = Object.keys(data[0]).slice(1)
    var fieldMin = Number.POSITIVE_INFINITY
    var fieldMax = Number.NEGATIVE_INFINITY


    for(var field of keys){
      fieldMin = Math.min(fieldMin, d3.min(data, function(d) { return +d[field]; }))
      fieldMax = Math.max(fieldMax, d3.max(data, function(d) { return +d[field]; }))
    }

    // color palette
    var color = d3.scaleOrdinal()
      .domain(keys)
      .range(["#cc241d", "#98971A", "#d79921", "#458588", "#b16286", "#689d6a"])
      // .range(d3.schemeSet2);

    //stack the data?
    var stackedData = d3.stack()
      .keys(keys)
      (data)

    //////////
    // AXIS //
    //////////
    // Add X axis
    var x = d3.scaleLinear()
      .domain(d3.extent(data, function(d) { return +d['Year']; }))
      .range([ 0, width ]);

    var xAxis = svgtime.append("g")
      .attr("transform", "translate(0," + height + ")")
      .attr("class", "ts_xAxis")
      .call(d3.axisBottom(x).ticks(6))

    // Add X axis label:
    svgtime.append("text")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height+40 )
        .attr("font-size", "15px")
        .text("Time (year)");

    // Add Y axis label:
    svgtime.append("text")
        .attr("text-anchor", "end")
        .attr("x", 0)
        .attr("y", -20)
        .attr("class", "ts_ylabel")
        .attr("font-size", "15px")
        .text(defaultFeature)
        .attr("text-anchor", "start")

    // Add Y axis
    var y = d3.scaleLinear()
      .domain([fieldMin*(0.5), fieldMax*keys.length])
      .range([ height, 0 ]);
    
    svgtime.append("g")
      .attr("class", "ts_yAxis")
      .call(d3.axisLeft(y).ticks(8))



    //////////
    // BRUSHING AND CHART //
    //////////

    // Add a clipPath: everything out of this area won't be drawn.
    var clip = svgtime.append("defs").append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("width", width )
        .attr("height", height )
        .attr("x", 0)
        .attr("y", 0);

    // Add brushing
    var brush = d3.brushX()                 // Add the brush feature using the d3.brush function
        .extent( [ [0,0], [width,height] ] ) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
        .on("end", updateChart) // Each time the brush selection changes, trigger the 'updateChart' function

    // Create the scatter variable: where both the circles and the brush take place
    var areaChart = svgtime.append('g').attr("class", "area_chart")
      .attr("clip-path", "url(#clip)")

    // Area generator
    var area = d3.area()
      .x(function(d) { return x(d.data['Year']); })
      .y0(function(d) { return y(d[0]); })
      .y1(function(d) { return y(d[1]); })

      

    // Show the areas
    areaChart
      .selectAll("mylayers")
      .data(stackedData)
      .enter()
      .append("path")
        .attr("class", function(d) { return "myArea " + d.key })
        // .attr("class", function(d) { return "myArea" })
        .style("fill", function(d) { return color(d.key); })
        .attr("d", area)

    // Add the brushing
    areaChart
      .append("g")
        .attr("class", "brush")
        .call(brush);

    var idleTimeout
    function idled() { idleTimeout = null; }

    // A function that update the chart for given boundaries
    function updateChart() {

      extent = d3.event.selection
      // console.log("11111111"+extent)
      // If no selection, back to initial coordinate. Otherwise, update X axis domain
      if(!extent) {
        timeSerBrushCtr++;
        if (!idleTimeout)
          return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
        x.domain(d3.extent(data, function(d) { return d['Year']; }))

        if(timeSerBrushCtr > 2) {
          timeSerBrushCtr= 0;

          updateOtherCharts(2000, 2019)
        }

      } else { 
        console.log(parseInt(x.invert(extent[0])) +" : " + parseInt(x.invert(extent[1])))
        timeSerBrushCtr = 0;
        x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
        updateOtherCharts(parseInt(x.invert(extent[0])), parseInt(x.invert(extent[1])))
        
        areaChart.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done

      }

      // Update axis and area position
      xAxis.transition().duration(1000).call(d3.axisBottom(x).ticks(6))
      areaChart
        .selectAll("path")
        .transition().duration(1000)
        .attr("d", area)
    }


      //////////
      // HIGHLIGHT GROUP //
      //////////

      // What to do when one group is hovered
      var highlight = function(d){
        // reduce opacity of all groups
        d3.selectAll(".myArea").style("opacity", .1)
        // expect the one that is hovered
        d3.select("."+d).style("opacity", 1)
      }

      // And when it is not hovered anymore
      var noHighlight = function(d) {
        d3.selectAll(".myArea").style("opacity", 1)
      }

      //////////
      // LEGEND //
      //////////

      // Add one dot in the legend for each name.
      var size = 20
      svgtime.selectAll("myrect")
        .data(keys)
        .enter()
        .append("rect")
          .attr("x", 550)
          .attr("y", function(d,i){ return 10 + i*(size+5)}) // 100 is where the first dot appears. 25 is the distance between dots
          .attr("width", size)
          .attr("height", size)
          .style("fill", function(d){ return color(d)})
          .on("mouseover", highlight)
          .on("mouseleave", noHighlight)

      // Add one dot in the legend for each name.
      svgtime.selectAll("mylabels")
        .data(keys)
        .enter()
        .append("text")
          .attr("x", 450 + size*1.2)
          .attr("y", function(d,i){ return 10 + i*(size+5) + (size/2)}) // 100 is where the first dot appears. 25 is the distance between dots
          .style("fill", function(d){ return color(d)})
          .text(function(d){ return ccMapping.get(d)})
          .attr("text-anchor", "left")
          .style("alignment-baseline", "middle")
          .on("mouseover", highlight)
          .on("mouseleave", noHighlight)



        function updateOtherCharts(ySt, yEnd){
            console.log(ySt +" st:end " +yEnd)
    
            fetch('/worldmap2', {
              method: "POST",
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({'attr': defaultFeature, 'yearSt': ySt, 'yearEnd': yEnd})
            })
            .then(function (response) {
                return response.json();
            }).then(function (worldMap) {
              fetch('/coordinates')
                .then(function (response2) {
                    return response2.json();
                }).then(function (topo) {
                  update_world_map(worldMap, topo)
                });
            });
    
            fetch('/barchart', {
              method: "POST",
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({'attr': defaultFeature, 'worst': d3.select('input[name="topWrst"]').node().checked, 
                  'yearSt': ySt, 'yearEnd':yEnd})
            })
            .then(function (response) {
                return response.json();
            }).then(function (data) {
              update_bar_chart(data)
            });


            fetch('/pcp', {
              method: "POST",
              headers: {
                'Content-Type': 'application/json'
              },
            
              body: JSON.stringify({'yearSt': ySt, 'yearEnd': yEnd, 'axis': axis_order})
            })
              .then(function (response) {
                  return response.json();
              }).then(function (data) {
                createPCPPlot2(data, axis_order)
              });
    
          }

}

// function update_time_series(data) {
  
//   // set the dimensions and margins of the graph
//   var margin = {top: 60, right: 230, bottom: 50, left: 80},
//   width = 660 - margin.left - margin.right,
//   height = 400 - margin.top - margin.bottom;

//   var keys = Object.keys(data[0]).slice(1)
//     var fieldMin = Number.POSITIVE_INFINITY
//     var fieldMax = Number.NEGATIVE_INFINITY
    
//     for(var field of keys){
//       fieldMin = Math.min(fieldMin, d3.min(data, function(d) { return +d[field]; }))
//       fieldMax = Math.max(fieldMax, d3.max(data, function(d) { return +d[field]; }))
//     }

//     // color palette
//     var color = d3.scaleOrdinal()
//       .domain(keys)
//       .range(d3.schemeSet2);

//     //stack the data?
//     var stackedData = d3.stack()
//       .keys(keys)
//       (data)

//     // Add X axis
//     var x = d3.scaleLinear()
//     .domain(d3.extent(data, function(d) { return +d['Year']; }))
//     .range([ 0, width ]);

//     d3.select(".ts_xAxis")
//     .call(d3.axisBottom(x).ticks(6))

//   // Add Y axis label:
//       d3.select(".ts_ylabel")
//       .text(defaultFeature)

//   // Add Y axis
//   var y = d3.scaleLinear()
//     .domain([fieldMin*(0.5), fieldMax*keys.length])
//     .range([ height, 0 ]);
  
//     d3.select(".ts_yAxis")
//     .call(d3.axisLeft(y).ticks(8))


//     //////////
//     // BRUSHING AND CHART //
//     //////////

//     // Add a clipPath: everything out of this area won't be drawn.
//     var clip = svgtime.append("defs").append("svg:clipPath")
//         .attr("id", "clip")
//         .append("svg:rect")
//         .attr("width", width )
//         .attr("height", height )
//         .attr("x", 0)
//         .attr("y", 0);

//     //Add brushing
//     // var brush = d3.brushX()                 // Add the brush feature using the d3.brush function
//     //     .extent( [ [0,0], [width,height] ] ) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
//     //     .on("end", updateChart) // Each time the brush selection changes, trigger the 'updateChart' function

//     // Create the scatter variable: where both the circles and the brush take place
//     var areaChart = svgtime.append('g')
//       .attr("clip-path", "url(#clip)")

//     // Area generator
//     var area = d3.area()
//       .x(function(d)  { return x(d.data['Year']); })
//       .y0(function(d) { return y(d[0]); })
//       .y1(function(d) { return y(d[1]); })

      

//       // areaChart
//       // .selectAll(".myArea")
//       // .data(stackedData).transition().duration(1000)
//       // // .enter()
//       // // .append("path")
//       //   // .attr("class", function(d) { return "myArea " + d.key })
//       //   // .attr("class", function(d) { return "myArea" })
//       //   .style("fill", function(d) { return color(d.key); })
//       //   .attr("d", area)

//     // Show the areas
//     d3.selectAll(".myArea")
//       .data(stackedData)
//       .transition().duration(1000)
//         .style("fill", function(d) { return color(d.key); })
//         .attr("d", area)

//     // // Add the brushing
//   //  d3.select(".brush")
//   //       .call(brush);

//   //   var idleTimeout
//   //   function idled() { idleTimeout = null; }

//   //   // A function that update the chart for given boundaries
//   //   function updateChart() {

//   //     extent = d3.event.selection
//       // console.log("11111111"+extent)
//       // If no selection, back to initial coordinate. Otherwise, update X axis domain
//       // if(!extent){
//       //   timeSerBrushCtr++;
//       //   if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
//       //   x.domain(d3.extent(data, function(d) { return d['Year']; }))

//       //   if(timeSerBrushCtr > 2){
//       //     timeSerBrushCtr= 0;

//       //     updateOtherCharts(2000, 2019)
//       //   }

//       // }else{
//       //   console.log(parseInt(x.invert(extent[0])) +" : " + parseInt(x.invert(extent[1])))
//       //   timeSerBrushCtr = 0;
//       //   x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
//       //   updateOtherCharts(parseInt(x.invert(extent[0])), parseInt(x.invert(extent[1])))
        
//       //   areaChart.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done

//       // }

//       // // Update axis and area position
//       // d3.select("ts_xAxis").transition().duration(1000).call(d3.axisBottom(x).ticks(6))
      
//       // areaChart
//       //   .selectAll("path")
//       //   .transition().duration(1000)
//       //   .attr("d", area)
//       // }

//       // function updateOtherCharts(ySt, yEnd){
//       //   console.log(ySt +" st:end " +yEnd)

//       //   fetch('/worldmap2', {
//       //     method: "POST",
//       //     headers: {
//       //       'Content-Type': 'application/json'
//       //     },
//       //     body: JSON.stringify({'attr': defaultFeature, 'yearSt': ySt, 'yearEnd': yEnd})
//       //   })
//       //   .then(function (response) {
//       //       return response.json();
//       //   }).then(function (worldMap) {
//       //     fetch('/coordinates')
//       //       .then(function (response2) {
//       //           return response2.json();
//       //       }).then(function (topo) {
//       //         update_world_map(worldMap, topo)
//       //       });
//       //   });

//       //   fetch('/barchart', {
//       //     method: "POST",
//       //     headers: {
//       //       'Content-Type': 'application/json'
//       //     },
//       //     body: JSON.stringify({'attr': defaultFeature, 'worst': d3.select('input[name="topWrst"]').node().checked, 
//       //         'yearSt': ySt, 'yearEnd':yEnd})
//       //   })
//       //   .then(function (response) {
//       //       return response.json();
//       //   }).then(function (data) {
//       //     update_bar_chart(data)
//       //   });

//       // }
//       //////////
//       // HIGHLIGHT GROUP //
//       //////////

//       // // What to do when one group is hovered
//       // var highlight = function(d){
//       //   // reduce opacity of all groups
//       //   d3.selectAll(".myArea").style("opacity", .1)
//       //   // expect the one that is hovered
//       //   d3.select("."+d).style("opacity", 1)
//       // }

//       // // And when it is not hovered anymore
//       // var noHighlight = function(d){
//       //   d3.selectAll(".myArea").style("opacity", 1)
//       // }



//       //////////
//       // LEGEND //
//       //////////

//       // Add one dot in the legend for each name.
//       // var size = 20
//       // svgtime.selectAll("myrect")
//       //   .data(keys)
//       //   .enter()
//       //   .append("rect")
//       //     .attr("x", 500)
//       //     .attr("y", function(d,i){ return 10 + i*(size+5)}) // 100 is where the first dot appears. 25 is the distance between dots
//       //     .attr("width", size)
//       //     .attr("height", size)
//       //     .style("fill", function(d){ return color(d)})
//       //     .on("mouseover", highlight)
//       //     .on("mouseleave", noHighlight)

//       // // Add one dot in the legend for each name.
//       // svgtime.selectAll("mylabels")
//       //   .data(keys)
//       //   .enter()
//       //   .append("text")
//       //     .attr("x", 400 + size*1.2)
//       //     .attr("y", function(d,i){ return 10 + i*(size+5) + (size/2)}) // 100 is where the first dot appears. 25 is the distance between dots
//       //     .style("fill", function(d){ return color(d)})
//       //     .text(function(d){ return ccMapping.get(d)})
//       //     .attr("text-anchor", "left")
//       //     .style("alignment-baseline", "middle")
//       //     .on("mouseover", highlight)
//       //     .on("mouseleave", noHighlight)


// }
          

