yearEnd = 2019
year = 2000

fetch('/hypothesis', {
  method: "POST",
  headers: {
    'Content-Type': 'application/json'
  },

  body: JSON.stringify({'yearSt': year, 'yearEnd': year, 'axis': axis_order})
})
  .then(function (response) {
      return response.json();
  }).then(function (data) {
    findHypothesis(data, axis_order)
  });


function findHypothesis(dataHypo){
    console.log("dataHypo")

    Tooltiptable = d3.select('.pValTable')
    // .style("background-color", "white")
    // .style("border", "solid")
    // .style("border-width", "2px")
    // .style("border-radius", "5px")
    .style("padding", "10px")
    .append("table")
    // .attr("class", "tableTooltip")
    .attr("width", 40)
    .attr("height", 40)

    var thead = Tooltiptable.append('thead')
    var	tbody = Tooltiptable.append('tbody')

    
    thead.append('tr')
    .selectAll('th')
    .data(['Features','Values']).enter()
    .append('th')
        .text(function (column) { return column; })
        .style("text-anchor", "start")
// .style("font-size", "35px")



// thead.selectAll('.tr').attr("text-anchor", "end")
// .attr("stroke", "lightpink")
// .attr("font-size", "35px")

// tbody.append('tr')
// .selectAll('td')
// .data(dataHypo).enter()
// .append('td')
// .text(function (column) { return column; })
// .append('td')
// .text(function (column) { return column; })
// .style("text-anchor", "start")

var modifiedData= []
for (const [key, value] of Object.entries(dataHypo)) {
    tmp = [key, value];
    modifiedData.push(tmp)
  }

var rows = tbody.selectAll('tr')
		  .data(modifiedData)
		  .enter()
		  .append('tr');

	// create a cell in each row for each column
    var cells = rows.selectAll('td')
    .data(function (row,i) {return row; })
    .enter()
    .append('td')
      .text(function (d) { return d; });

    console.log(dataHypo)
}


fetch('/similarity', {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
  
    body: JSON.stringify({'yearSt': year, 'yearEnd': year, 'axis': axis_order})
  })
    .then(function (response) {
        return response.json();
    }).then(function (data) {
      findSimilarity(data, axis_order)
    });


function findSimilarity(dataSimiar){
        console.log("dataSimiar")
        console.log(dataSimiar)

        var keys = Object.keys(dataSimiar[0])

        Tooltiptable = d3.select('.simlarityTable')
        // .style("background-color", "white")
        // .style("border", "solid")
        // .style("border-width", "2px")
        // .style("border-radius", "5px")
        .style("padding", "10px")
        .append("table")
        // .attr("class", "tableTooltip")
        .attr("width", 40)
        .attr("height", 40)
    
        var thead = Tooltiptable.append('thead')
        var	tbody = Tooltiptable.append('tbody')
        
        thead.append('tr')
        .selectAll('th')
        .data(keys).enter()
        .append('th')
            .text(function (column) { return column; })
            .style("text-anchor", "start")
    // .style("font-size", "35px")

    
    // var modifiedData= []
    // for (const [key, value] of Object.entries(dataSimiar)) {
    //     tmp = [key, value];
    //     modifiedData.push(tmp)
    //   }
    
    var rows = tbody.selectAll('tr')
              .data(dataSimiar)
              .enter()
              .append('tr');
    
        // // create a cell in each row for each column
        // var cells = rows.selectAll('td')
        // .data(function (row,i) {return row; })
        // .enter()
        // .append('td')
        //   .text(function (d) { return d; });


          var cells = rows.selectAll('td')
		  .data(function (row) {
		    return keys.map(function (column) {
		      return {column: column, value: row[column]};
		    });
		  })
		  .enter()
		  .append('td')
		    .text(function (d) { return d.value; });
    
        console.log(dataSimiar)
}