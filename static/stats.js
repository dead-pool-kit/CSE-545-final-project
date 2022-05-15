axis_order = [
  "Exports of goods and services (% of GDP)",                                                         
  "Trade (% of GDP)",                                                                                
  "Mineral rents (% of GDP)",                                                                        
  "GDP (current US$)",                                                                                
  "GNI (current US$)"                                                                            
  ]

country = "USA"


// this is the stat printer for the dashboard
function setStats() {
  document.getElementById("statc").innerHTML = ccMapping.get(country)
  document.getElementById("stata").innerHTML = defaultFeature;
  document.getElementById("statt").innerHTML = year;
}

function inc_year() {
  if (year < 2019) {
    year++;
    
    updateRestAll(year)
    setStats();
  }
}

function dec_year() {
  if (year > 2000) {
    year--;
    updateRestAll(year)
    setStats();
  }
}


function updateRestAll(yr) {
  fetch('/worldmap', {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({'attr': defaultFeature, 'yearSt': yr, 'yearEnd': yr})
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

  fetch('/pcp', {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({'yearSt': yr, 'yearEnd': yr, 'axis': axis_order})
  })
    .then(function (response) {
        console.table('rspppp!!!!' + response)
        return response.json();
    }).then(function (data) {
      createPCPPlot2(data, axis_order)
    });

    fetch('/barchart', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({'attr': defaultFeature, 'worst': false, 'yearSt': yr, 'yearEnd': yr})
    })
    .then(function (response) {
        return response.json();
    }).then(function (data) {
      d3.select('input[name="topWrst"]').node().checked = false
      update_bar_chart(data)
    });
}



function updateWmapBar(yr) {
  fetch('/worldmap', {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({'attr': defaultFeature, 'yearSt': yr, 'yearEnd': yr})
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
      body: JSON.stringify({'attr': defaultFeature, 'worst': false, 'yearSt': yr, 'yearEnd': yr})
    })
    .then(function (response) {
        return response.json();
    }).then(function (data) {
      d3.select('input[name="topWrst"]').node().checked = false
      update_bar_chart(data)
    });
}

// Time player code 
async function delayedGreeting(year) {
    fetch('/worldmap', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(defaultFeature)
    })
    .then(function (response) {
        return response.json();
    }).then(function (worldMap) {
      fetch('/coordinates')
        .then(function (response2) {
            return response2.json();
        }).then(function (topo) {
          createWorldMap(worldMap, topo, year)
        });
    });
  
  }

function animate_map(){
  for (var i = 2000; i < 2019; i++) {
    // console.log('year: '+ i)
    updateRestAll(i)
    // setTimeout(() => updateRestAll(i), 300);
  }
  updateRestAll(2000);
  setStats();
}

setStats()