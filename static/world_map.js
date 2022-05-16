// some useful globar vars
defaultFeature  = 'GDP (current US$)'

yearSt = 2000
yearEnd = 2019

fetch('/worldmap', {
  method: "POST",
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({'attr': defaultFeature, 'yearSt': yearSt, 'yearEnd': yearEnd})
})
.then(function (response) {
    return response.json();
}).then(function (worldMap) {
  fetch('/coordinates')
    .then(function (response2) {
        return response2.json();
    }).then(function (topo) {
      createWorldMap(worldMap, topo)
    });
});

// drop down
function createWorldMap(dataWrld, topo) {

  // console.log('wmapftr:  '+ defaultFeature)
  // d3.select("#world_map").selectAll("*").remove()
  // d3.select("#world_map_legend").selectAll("*").remove()

  
  // set the dimensions and margins of the graph
  console.log(dataWrld)

  var margin = {top: 60, right: 30, bottom: 30, left: 60},
      width = 990 - margin.left - margin.right,
      height = 350 - margin.top - margin.bottom;

  // The svg
  svgw = d3.select("#world_map").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .call(d3.zoom().scaleExtent([1, 5]).on("zoom", function () {
    svgw.attr("transform", d3.event.transform)
 }))
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Map and projection
  var path = d3.geoPath();
  var projection = d3.geoMercator()
    .scale(110)
    .center([-25, 30])
    .translate([width / 2 - margin.left, height / 2]);

  // Data and color scale
  wm_data = d3.map();
  
  for(var i = 0; i < dataWrld.length; i++) {
    var obj = dataWrld[i];
      wm_data.set(obj["Country Code"], parseFloat(obj[defaultFeature]))
  }

  var ftrValues = Object.values(wm_data)

  var colorScale = d3.scaleLinear()
  .domain([d3.min(ftrValues), d3.max(ftrValues)])
  // .range(["rgb(250, 197, 173)","rgb(85, 28, 1)"])
  .range(["#b4dce4", "#076678"])
  // .range(["#FFFAFA", "#B0E0E6", "#87CEFA","#00BFFF","#1E90FF","#4682B4","#0000FF","#000080"])
    // .range(d3.schemeBlues[7]);
  // dataWrld.map(function(d) { if (d.Year == year) data.set(d["Country Code"], d["Electric power consumption (kWh per capita)"]); })
  console.log(wm_data)
  // Load external data and boot
  var legend_x = width - margin.left + 20
  var legend_y = height - 70
  
  svgw.append("g")
  leg_div_svg = d3.select("#world_map_legend")
    .append("svg")
    .attr("height", 70)
    .attr("width", 1000)
    .append("g")
    .attr("class", "legend")
    .attr("transform", "translate(10, 15)");


  const n = 8 //tweak this to add more items per line
  
  ftrValues = [...new Set(ftrValues)];
  ftrValues.sort(function(a, b) {
    return a - b;
  });

  const resultSpliced = [[], [], [], [], [], [], [], []] //we create it, then we'll fill it

  const wordsPerLine = Math.ceil(ftrValues.length / n)
  
  for (let line = 0; line < n; line++) {
    for (let i = 0; i < wordsPerLine; i++) {
      const value = ftrValues[i + line * wordsPerLine]
      if (!value) continue //avoid adding "undefined" values
      resultSpliced[line].push(value)
    }
  }

  console.log("spliced")
  console.log(resultSpliced)

  var labels = ["("+ Math.min.apply(null, resultSpliced[0]).toFixed(1) + ","+ Math.max.apply(null, resultSpliced[0]).toFixed(1) +")",
  "("+ Math.min.apply(null, resultSpliced[1]).toFixed(1) + ","+ Math.max.apply(null, resultSpliced[1]).toFixed(1)+")",
  "("+ Math.min.apply(null, resultSpliced[2]).toFixed(1) + ","+ Math.max.apply(null, resultSpliced[2]).toFixed(1)+")",
  "("+ Math.min.apply(null, resultSpliced[3]).toFixed(1) + ","+ Math.max.apply(null, resultSpliced[3]).toFixed(1) +")",
  "("+ Math.min.apply(null, resultSpliced[4]).toFixed(1) + ","+ Math.max.apply(null, resultSpliced[4]).toFixed(1) +")",
  "("+ Math.min.apply(null, resultSpliced[5]).toFixed(1) + ","+ Math.max.apply(null, resultSpliced[5]).toFixed(1) +")",
  "("+ Math.min.apply(null, resultSpliced[6]).toFixed(1) + ","+ Math.max.apply(null, resultSpliced[6]).toFixed(1) +")",
  "("+ Math.min.apply(null, resultSpliced[7]).toFixed(1) + ","+ Math.max.apply(null, resultSpliced[7]).toFixed(1) +")"
]
  
  var legend = d3.legendColor()
    .labels(labels)
    .orient('horizontal')
    .shapeWidth(120)
    .cells(8)
    .title(defaultFeature)
    .scale(colorScale)

  leg_div_svg
    .call(legend);


    // // add a legend
    // var w = 50,
    //     h = 300;

    // var lowColor = 'rgb(250, 197, 173)'
    // var highColor = 'rgb(85, 28, 1)'

    // var key = d3.select("#world_map_legend")
    //     .append("svg")
    //     .attr('margin-top', '0px')
    //     .attr("width", w)
    //     .attr("height", h)

    // var legend = key.append("defs")
    //     .append("svg:linearGradient")
    //     .attr("id", "gradient")
    //     .attr("x1", "100%")
    //     .attr("y1", "0%")
    //     .attr("x2", "100%")
    //     .attr("y2", "100%")
    //     .attr("spreadMethod", "pad");

    // legend.append("stop")
    //     .attr("offset", "0%")
    //     .attr("stop-color", highColor)
    //     .attr("stop-opacity", 1);

    // legend.append("stop")
    //     .attr("offset", "100%")
    //     .attr("stop-color", lowColor)
    //     .attr("stop-opacity", 1);

    // key.append("rect")
    //     .attr("width", w - 40)
    //     .attr("height", h)
    //     .style("fill", "url(#gradient)")
    //     .attr("transform", "translate(0,10)");

    // maxVal = d3.max(data.features, function(d) { return +d[attr] })
    // minVal = d3.min(data.features, function(d) { return +d[attr] })
    // var y = d3.scaleLinear()
    //     .range([h, 0])
    //     .domain([minVal, maxVal]);

    // var yAxis = d3.axisRight(y).tickFormat(function(d) {
    //     if (d >= 100000)
    //         return (d / 1000000).toFixed(2) + 'M';
    //     else return d;
    // });

    // key.append("g")
    //     .attr("class", "y-axis")
    //     .attr("transform", "translate(11,10)")
    //     .call(yAxis)

    // d3.selectAll(".y-axis text")
    //     .style("fill", "rgb(155, 155, 155)");





  // create a tooltip
  var Tooltip = d3.select("#world_map")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    // .style("width", "100px")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")
  
  let mouseOver = function(d) {
    Tooltip.style("opacity", 1)
     .html(d.properties.name + ": " + wm_data.get(d.id) )
     .transition()
     .duration('200')
     .style("left", (d3.event.pageX ) + "px")
     .style("top", (d3.event.pageY - 55) + "px")

     d3.select(this)
      .transition()
      .duration(200)
      .style("stroke", "black")
  }
  var mouseMove = function(d) {
    // Tooltip
    //   .html(d.properties.name + ": " + data.get(d.id) )
    //   .style("left", (d3.mouse(this)[0]) + 800 + "px")
    //   .style("top", (d3.mouse(this)[1] + 1200) + "px")
      // .style("position", "relative")
  }
  let mouseLeave = function(d) {
    Tooltip
    .transition()
    .duration('2000')
    .style("opacity", 0);

    d3.select(this)
    .transition()
    .duration(200)
    .style("stroke", "transparent")
  }
  let onClick = function(d) {
    country = d.id;
    fetch('/timeser', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({'attr':defaultFeature, 'country':country, 'reset': false})
    })
    .then(function (response) {
        return response.json();
    }).then(function (data) {
      createTimeSeries(data)
    });


    fetch('/similarity', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
    
      body: JSON.stringify({'year': year, 'country': country})
    })
      .then(function (response) {
          return response.json();
      }).then(function (data) {
        findSimilarity(data, axis_order)
      });

    setStats();
  }

  // Draw the map
  svgw.append("g")
    .selectAll("path")
    .data(topo.features)
    .enter()
    .append("path")
    
      // draw each country
      .attr("d", d3.geoPath()
        .projection(projection)
      )
      // set the color of each country
      .attr("fill", function (d) {
        d.total = wm_data.get(d.id) || 0;
        return colorScale(d.total);
      })
      .style("stroke", "transparent")
      .attr("class", function(d){ return "Country" } )
      .style("opacity", .8)
      
      .on("mouseover", mouseOver)
      .on("mouseleave", mouseLeave)
      .on("mousemove", mouseMove)
      .on("click", onClick)
      
      //update_world_map(dataWrld, topo)

      // svg.transition()
      // .duration(750)
      // .call(zoom.transform, d3.zoomIdentity); // updated for d3 v4
}

function update_world_map(dataWrld, topo) {

  // dim variables
  var margin = {top: 60, right: 30, bottom: 30, left: 60},
      width = 990 - margin.left - margin.right,
      height = 350 - margin.top - margin.bottom;

  var projection = d3.geoMercator()
  .scale(110)
  .center([-25, 30])
  .translate([width / 2 - margin.left, height / 2]);
  
  // Data and color scale
  wm_data = d3.map();
    
    for(var i = 0; i < dataWrld.length; i++) {
      var obj = dataWrld[i];
        wm_data.set(obj["Country Code"], obj[defaultFeature])
    }

    var ftrValues = Object.values(wm_data)
  
    var colorScale = d3.scaleLinear()
    .domain([d3.min(ftrValues), d3.max(ftrValues)])
    .range(["#b4dce4", "#076678"])
    // .range(["rgb(250, 197, 173)","rgb(85, 28, 1)"])

    // Load external data and boot
    // var legend_x = width - margin.left + 20
    // var legend_y = height - 70
    
    // svgw.append("g")
    leg_div_svg = d3.select(".legend")  
  
    const n = 8 //tweak this to add more items per line
    
    ftrValues = [...new Set(ftrValues)];
    ftrValues.sort(function(a, b) {
      return a - b;
    });
  
    const resultSpliced = [[], [], [], [], [], [], [], []] //we create it, then we'll fill it
  
    const wordsPerLine = Math.ceil(ftrValues.length / n)
    
    for (let line = 0; line < n; line++) {
      for (let i = 0; i < wordsPerLine; i++) {
        const value = ftrValues[i + line * wordsPerLine]
        if (!value) continue //avoid adding "undefined" values
        resultSpliced[line].push(value)
      }
    }
  
    console.log("spliced")
    console.log(resultSpliced)
  
    var labels = ["("+ Math.min.apply(null, resultSpliced[0]).toFixed(1) + ","+ Math.max.apply(null, resultSpliced[0]).toFixed(1) +")",
    "("+ Math.min.apply(null, resultSpliced[1]).toFixed(1) + ","+ Math.max.apply(null, resultSpliced[1]).toFixed(1)+")",
    "("+ Math.min.apply(null, resultSpliced[2]).toFixed(1) + ","+ Math.max.apply(null, resultSpliced[2]).toFixed(1)+")",
    "("+ Math.min.apply(null, resultSpliced[3]).toFixed(1) + ","+ Math.max.apply(null, resultSpliced[3]).toFixed(1) +")",
    "("+ Math.min.apply(null, resultSpliced[4]).toFixed(1) + ","+ Math.max.apply(null, resultSpliced[4]).toFixed(1) +")",
    "("+ Math.min.apply(null, resultSpliced[5]).toFixed(1) + ","+ Math.max.apply(null, resultSpliced[5]).toFixed(1) +")",
    "("+ Math.min.apply(null, resultSpliced[6]).toFixed(1) + ","+ Math.max.apply(null, resultSpliced[6]).toFixed(1) +")",
    "("+ Math.min.apply(null, resultSpliced[7]).toFixed(1) + ","+ Math.max.apply(null, resultSpliced[7]).toFixed(1) +")"
  ]
    
    var legend = d3.legendColor()
      .labels(labels)
      .orient('horizontal')
      .shapeWidth(120)
      .cells(8)
      .title(defaultFeature)
      .scale(colorScale)
  
    leg_div_svg
      .call(legend);
  
    // Draw the map

      d3.selectAll(".Country")
      .data(topo.features)
      .transition()
        .duration(1000)
        // set the color of each country
        .attr("fill", function (d) {
          d.total = wm_data.get(d.id) || 0;
          return colorScale(d.total);
        })
        .style("stroke", "transparent")
        .style("opacity", .8)
}