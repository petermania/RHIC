window.chartOptions = {
  segmentShowStroke: false,
  percentageInnerCutout: 75,
  animation: false
};

var chartUpdate = function(value) {
  var data = {
    datasets: [{
        data: [
            yes,
            no
        ],
        backgroundColor: [
            "#FF6384",
            "#4BC0C0"
        ],
        label: 'Total Votes' // for legend
    }],
    labels: [
        "Yes",
        "No"
    ]
  }
  console.log("Updating Chart: ", value)

  // Replace the chart canvas element
  $('#chart').replaceWith('<canvas id="chart" width="300" height="300"></canvas>')

  // Draw the chart
  var ctx = $('#chart').get(0).getContext("2d")
  var myPieChart = new Chart(ctx,{
      type: 'pie',
      data: data
  })

  // Schedule next chart update tick
  setTimeout (function() { chartUpdate(value - 1); }, 10000);
}
$(document).ready(function() {
  setTimeout (function() { chartUpdate(99); }, 10000);
})
