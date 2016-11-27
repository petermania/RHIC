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

var chartUpdate = function() {
  Chart.defaults.global.tooltips.enabled = false;
  var input=[]
  var colors=[]
  var labels=[]
  if(response_no>3){
    input.push(vote4)
    colors.push("#005985")
    labels.push(text4.toUpperCase())
  }
  if(response_no>2){
    input.push(vote3)
    colors.push("#D2D2D2")
    labels.push(text3.toUpperCase())
  }
  input.push(vote2)
  colors.push("#005985")
  labels.push(text2.toUpperCase())

  input.push(vote1)
  colors.push("#BDE724")
  labels.push(text1.toUpperCase())




  var data = {
    datasets: [{
        data: input,
        backgroundColor:colors,
        label: 'Total Votes' // for legend
    }],
    labels: labels
  }
  console.log("Updating Chart")

  // Replace the chart canvas element
  $('#chart').replaceWith('<canvas id="chart" width="900" height="900"></canvas>')
  // Draw the chart
  var ctx = $('#chart').get(0).getContext("2d")
  var myPieChart = new Chart(ctx,{
      type: 'doughnut',
      data: data,
      options: chartOptions
  })


  // Schedule next chart update tick
  setTimeout (function() { chartUpdate(); }, 1000)
}
$(document).ready(function() {
  chartUpdate()
})
