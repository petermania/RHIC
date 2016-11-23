window.chartOptions = {
  segmentShowStroke: false,
  percentageInnerCutout: 50,
  animation: false,
  responsive:false,
  hover:'none',
  showTooltips:false,
  padding:50,
  title:{
    display:true,
    fontFamily:"TradeGothic",
    text:"Will the Feds Raise the Interest Rate in 2016?",
    fontSize:60
  },
  legend:{
    display: true,
    labels:{
      fontSize:30,
      fontFamily:"TradeGothic",
      boxWidth:70,
      padding:20
    }
  }
}

var chartUpdate = function(value) {
  Chart.defaults.global.tooltips.enabled = false;
  console.log("updating")
  var input=[]
  var colors=[]
  var labels=[]
  input.push(vote1)
  colors.push("#BDE724")
  labels.push(text1)
  input.push(vote2)
  colors.push("#005985")
  labels.push(text2)
  if(response_no>2){
    input.push(vote3)
    colors.push("#BDE724")
    labels.push(text3)
  }
  if(response_no>3){
    input.push(vote4)
    colors.push("#005985")
    labels.push(text4)
  }

  var data = {
    datasets: [{
        data: input,
        backgroundColor:colors,
        label: 'Total Votes' // for legend
    }],
    labels: labels
  }
  console.log("Updating Chart: ", value)

  // Replace the chart canvas element
  $('#chart').replaceWith('<canvas id="chart" width="1080" height="1080"></canvas>')
  // Draw the chart
  var ctx = $('#chart').get(0).getContext("2d")
  console.log(ctx.width)
  var myPieChart = new Chart(ctx,{
      type: 'doughnut',
      data: data,
      options: chartOptions
  })


  // Schedule next chart update tick
  // setTimeout (function() { chartUpdate(value - 1); }, 5000)
}
$(document).ready(function() {
  chartUpdate(99)
})
