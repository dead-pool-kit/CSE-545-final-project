// var year =2000

country = 'USA';

fetch('/mds/corr')
.then(function (response) {
    return response.json();
}).then(function (data) {
  createMdsCorr(data)
});

function createMdsCorr(data){


  var axisOrder = []
  var selClass = []
  var prev = -1
  var map = {} 
  
  var keys = []
  var totalFields = 5
  
  var keys = data.map(d => d.fields);
  var fieldIndexDict = {};
  for(var i=0; i<keys.length; i++){
    if(i>=52)
    fieldIndexDict[keys[i]] = 'c'+String.fromCharCode(65+i-52);
    else if(i>=26)
      fieldIndexDict[keys[i]] = 'b'+String.fromCharCode(65+i-26);
    else
      fieldIndexDict[keys[i]] = 'a'+String.fromCharCode(65+i);
  }
  
  
  margin = {top: 60, right: 60, bottom: 60, left:80},
  width = 550 - margin.left - margin.right,
  height = 365 - margin.top - margin.bottom;
  
  var zoom = d3version6.zoom()
  .scaleExtent([1, 5])
  .on('zoom', function(event) {
      d3.select('#mdsplot').select('g')
       .attr('transform', event.transform);
  });

  var mdsCorr = d3version6.select('#mdsplot')
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .call(zoom)
    .append("g")
    .attr("transform",
    "translate(" + margin.left + "," + margin.top + ")");


    
  var tooltipMds = d3version6.select("#mdsplot")
    .append("div")
    // .style("opacity", 0)
    .attr("class", "tooltipMds")
    .style("background-color", "white")
    .style("width", "100px")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")

    markerBoxWidth = 20
    markerBoxHeight = 20
    refX = 10
    refY = 10
    markerWidth = 10
    markerHeight = 10
  
  
    // console.log('mds-corr-dataaaaa:'+ keys)
    d3.select('#mdsplotCorrTitle').append("text")
    .text('MDS plot of features with dissimilarity as Correlation Distance')
  
    var xvalues = data.map(d => parseFloat(d.x));
    var yvalues = data.map(d => parseFloat(d.y));
  
    x = d3.scaleLinear()
    .domain([d3.min(xvalues),d3.max(xvalues)]).range([0, width-100])
    
  
    xaxis = mdsCorr.append("g")
    .attr("class", "mds-euc-xaxis")
    .attr("transform", "translate(0," + height + ")")
  
    xaxis.transition().duration(1000).call(d3.axisBottom(x)).selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end")
  
    mdsCorr
    .append("text")
    .attr("class", "mds-euc-x-label")
    // .attr("transform", "rotate(-45)")
    .attr("text-anchor", "end")
    // .attr("stroke", "black")
    .attr("font-size", "15px")
    .attr("x", width/2)
    .attr("y",  height + 50)
    .text("Dimesion 1");
  
    y = d3.scaleLinear().range([height, 0]);
    y.domain([d3.min(yvalues), d3.max(yvalues)]); 
  
    yaxis = mdsCorr.append("g")
    .attr("class", "mds-euc-yaxis")
    .attr("transform", "translate(0,0)")
  
    yaxis.transition().duration(1000).call(d3.axisLeft(y)) 
    
    mdsCorr.append("text")
    .attr("transform", "rotate(-90)")
    .attr("class", "mds-euc-y-label")
    .attr("x",  height/2 - 120)
    .attr("y", -margin.left+20)
    // .attr("dy", "-5.1em")
    .attr("text-anchor", "end")
    .attr("font-size", "15px")
    .text("Dimesion 2");
  
  
    for(i=0; i<keys.length; i++){
      for(j=i+1; j<keys.length; j++){
  
        var merged= getClass(keys[i], keys[j])
  
        mdsCorr.append("svg:defs").append("svg:marker")
        .attr("id", "triangle")
        .attr('viewBox', [0, 0, 6, 6])
        .attr("refX", 9)
        .attr("refY", 4)
        .attr("markerWidth",6)
        .attr("markerHeight", 6)
        .attr("orient", "auto-start-reverse")
        .append("svg:path")
        .attr("d", "M23,7 M16,6 L6,6 L2,2")
        .style("fill", "pink");
  
        // mdsCorr.append('defs')
        // .append('marker')
        // .attr('id', 'triangle')
        // .attr('viewBox', [0, 0, markerBoxWidth, markerBoxHeight])
        // .attr('refX', refX)
        // .attr('refY', refY)
        // .attr('markerWidth', markerBoxWidth)
        // .attr('markerHeight', markerBoxHeight)
        // .attr('orient', 'auto-start-reverse')
        // .append('path')
        // .attr('d', d3.line()(arrowPoints))
        // .attr('fill', 'pink');
  
        mdsCorr.append("line")
        .attr('class', merged)
        .attr('viewBox', [0, 0, width, 200])
        .attr('x1', x(data[i].x))
        .attr('y1', y(data[i].y))
        .attr('x2', x(data[j].x))
        .attr('y2', y(data[j].y))
        .style('stroke', '#909090')
        .style("stroke-width", "5px")
        // .attr("marker-end", "url(#triangle)")
        .style("visibility", "hidden")
      }
    }
  
    var color = d3.scaleOrdinal()
    .domain([1, 7])
    .range(["#458588", "#cc241d","#b16286", "#98971A", "#d79921", "#689d6a", "#a89984"])

  
    // Add dots
    var pp= mdsCorr.append('g')
    .selectAll("circles")
    .data(data)
  
    var jitterWidth = 40

    var dtss= pp.enter()
    .append("circle")
    .attr("class", "cpoint")
  
    // .merge(pp) // get the already existing elements as well
    // .transition() // and apply changes to all of them
    // .duration(1000)
      .attr("x", 10)
      .attr("y", -5)
      .attr("cx", function (d) { return x(d.x) } )
      .attr("cy", function (d) { return y(d.y); } )
      .attr("r", 9)
      .attr("opacity", 0.8)
      .style("fill", function(d) { return color(d.x); })
      .on("mouseover", function(e, d) {
        d3.select(this)
        .style("fill", "red")
        .attr("r", 13)
        .style('stroke', '#222');

        d3.selectAll(`[class*=`+fieldIndexDict[d.fields]+`]`)
        .style('stroke', 'black')
        .style("stroke-width", "2px")
        .style("opacity", "0.2")
        .style("visibility", "visible")

        for(var k=0; k<selClass.length; k++){
          d3.select("."+selClass[k])
          .style('stroke', '#909090')
          .style("stroke-width", "5px")
          .style("opacity", "1")
          .style("visibility", "visible")
        }


        tooltipMds
        .html(d.fields)
        .style('visibility', 'visible')
    })
    .on('mousemove', e => tooltipMds.style('top', `${e.pageY}px`)
                                        .style('left', `${e.pageX + 10}px`))
    .on("mouseout", function(e, d){

        // tooltip2.style("opacity", 0)
        d3.select(this)
        .style("fill", function(d) { return color(d.x); })
        .attr("r", 9)
        .style('stroke', 'none')

        d3.selectAll(`[class*=`+fieldIndexDict[d.fields]+`]`)
        .style("visibility", "hidden")

        for(var k=0; k<selClass.length; k++){
          d3.select("."+selClass[k])
          .style('stroke', '#909090')
          .style("stroke-width", "5px")
          .style("opacity", "1")
          .style("visibility", "visible")
        }

        return tooltipMds
        .transition()
        .duration('200')
        .style('visibility', 'hidden');
    })
    .on("click", function(e, d) {

      var sel = d3.select(this)

      sel.style("fill", "green").attr('r', 13)
      
      defaultFeature = d.fields;
      // console.log('wmdsFTRSel: '+ defaultFeature)
      setStats();
      UpdateRestCharts(2000, 2019);
      
      if(prev != -1){
        console.log('mapfieldsssss:  '+ d.fields)
        var merged= getClass(d.fields, axisOrder[prev])
        var ind1
        var ind2
  
        if(map[d.fields] == true)
          return
  
        for(i=0; i<keys.length; i++){
          if(d.fields === keys[i])
            ind2 = fieldIndexDict[keys[i]]
  
          if(axisOrder[prev] === keys[i])
            ind1 = fieldIndexDict[keys[i]]
        }
  
        if(ind1<ind2){
          d3.select('.'+ merged)
          .style("visibility", "visible")
          .style("marker-end", "url(#triangle)")
          console.log("ffffffff: "+ merged) 
        }
        else{
          d3.select('.'+merged)
          .style("visibility", "visible")
          .style("marker-start", "url(#triangle)")
        }
      }
      prev++;
      axisOrder.push(d.fields);
      selClass.push(merged)
      map[d.fields]= true
  
      if(prev == totalFields-1){
        // axisOrder.unshift('Year')
        fetch('/pcp',  {
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({'yearSt': year, 'yearEnd': year, 'axis': axisOrder})
        })
          .then(function (response) {
          console.table('rspppp!!!!' + response)
          return response.json();
        }).then(function (data) {
          createPCPPlot2(data, axisOrder)
          console.log('orderrrr: '+axisOrder)
          map= {}
          axis_order = axisOrder
          axisOrder = []
          selClass = []
          prev = -1
  
          for(i=0; i<keys.length; i++){
            for(j=i+1; j<keys.length; j++){
        
              var merged= getClass(keys[i], keys[j])
        
              mdsCorr.append("svg:defs").append("svg:marker")
              .attr("id", "triangle")
              .attr("refX", 2)
              .attr("refY", 6)
              .attr("markerWidth",12)
              .attr("markerHeight", 12)
              .attr("orient", "auto")
              .append("svg:path")
              .attr("d", "M2,2 L2,11 L10,6 L2,2")
              .style("fill", "pink");
        
              mdsCorr.selectAll("."+ merged)
              .style("visibility", "hidden")
            }
          }
  
          mdsCorr.selectAll(".cpoint").attr("r", 9)
          .style("fill", function(d) { return color(d.x); })
  
        });
      }
    })
  
  
    dtss.transition()
    .duration(1000)
    .delay(function(d,i){ return i * (1000 / 4); })
    .style('opacity', 1);
  

  
    pp.enter()
      .append("text")
      .merge(pp) // get the already existing elements as well
      .transition() // and apply changes to all of them
      .duration(1000)
      .text(function(d){ return  d.fields.slice(0,  d.fields.indexOf(' '))})
      .attr("x", function(d) { return x(d.x); })
      .attr("y", function(d) { return y(d.y); })
      // .attr("stroke", "black")
      // .attr("opacity", "0.5")
      .attr("font-size", "10px")
      // .style("font-weight", "50")
  
      pp.exit()
      .remove()

    function UpdateRestCharts(ySt, yEnd){
      
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
            update_world_map(worldMap, topo)
          });
      });

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
        update_bar_chart(data)
      });

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
    }

  
    function getClass(f1, f2){
      var merged;
      if(fieldIndexDict[f1]>fieldIndexDict[f2])
        merged = fieldIndexDict[f2]+"-"+fieldIndexDict[f1];
      else
        merged = fieldIndexDict[f1] +"-"+ fieldIndexDict[f2];
  
      return merged
    }
  
}