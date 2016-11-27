var server_location='http://localhost:8080'
// var server_location='http://54.173.181.162:8080/'

window.chartOptions = {
  segmentShowStroke: false,
  percentageInnerCutout: 50,
  animation: false,
  responsive:false,
  hover:'none',
  showTooltips:false,
  padding:50,
  title:{
    display:false,
    fontFamily:"TradeGothic",
    text:name.toUpperCase(),
    fontSize:60
  },
  legend:{
    display: false,
    labels:{
      fontSize:30,
      fontFamily:"TradeGothic",
      boxWidth:70,
      padding:20
    }
  }
}


var socket = io.connect(server_location);

socket.on('connect', function(data) {
    console.log('connecting')
    socket.emit('join', 'Hello World from client');
});

socket.on('messages', function(data) {
    console.log(data);
});

socket.on('reload',function(data){
  console.log('reload received!')
  location.reload()
})

socket.on('update',function(data){
  console.log('updating')
  console.log(data)
  vote1=data.vote1
  vote2=data.vote2
  vote3=data.vote3
  vote4=data.vote4
  text1=data.text1
  text2=data.text2
  text3=data.text3
  text4=data.text4
  response_no=data.response_no
  chartUpdate()
})

var chartUpdate = function() {
  Chart.defaults.global.tooltips.enabled = false;
  var input=[]
  var colors=[]
  var labels=[]


  console.log("Updating Chart")

  var sky = new Image()
  sky.src = 'sky.png'
  var grass = new Image()
  grass.src = 'grass.png'
  var wood = new Image()
  wood.src = 'wood.png'
  // Replace the chart canvas element
  $('#chart').replaceWith('<canvas id="chart" width="650" height="650"></canvas>')
  // Draw the chart
  var ctx = $('#chart').get(0).getContext("2d")
  sky.onload = function() {
    console.log('sky')
    grass.onload = function() {
      console.log('grass')
      wood.onload = function() {
        console.log('wood')
        var woodPattern = ctx.createPattern(wood,'repeat');
        var grassPattern = ctx.createPattern(grass,'repeat');
        var skyPattern = ctx.createPattern(sky,'repeat');
        if(response_no>3){
          input.push(vote4)
          colors.push(grassPattern)
          labels.push(text4.toUpperCase())
        }
        if(response_no>2){
          input.push(vote3)
          colors.push(woodPattern)
          labels.push(text3.toUpperCase())
        }
        input.push(vote2)
        colors.push(skyPattern)
        labels.push(text2.toUpperCase())

        input.push(vote1)
        colors.push(grassPattern)
        labels.push(text1.toUpperCase())

        console.log(colors)
        var info = {
          datasets: [{
              data: input,
              backgroundColor:colors,
              label: 'Total Votes' // for legend
          }],
          labels: labels
        }



        var myPieChart = new Chart(ctx,{
          type: 'doughnut',
          data: info,
          options: chartOptions
        })//new Chart
      }//wood onload
    }//grass onload
  }//sky onload
}//function

$(document).ready(function() {
  chartUpdate()
})
