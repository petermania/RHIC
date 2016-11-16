var express = require('express')
var app = express()
var http=require('http')

var inbounds=0

var xml2js = require('xml2js')

var fs = require("fs")

app.set('view engine', 'pug')

app.get('/', function (req, res) {


  console.log("\n *START* \n")
  var content = fs.readFileSync("data.json")
  console.log("Output Content : \n"+ content)
  console.log("\n *EXIT* \n")

  var results=JSON.parse(content)
  var arr = []

  for(var x in results){
    arr.push(results[x])
  }

  arr.sort(function (a, b) {
    if (a.order > b.order) {
      return 1;
    }
    if (a.order < b.order) {
      return -1;
    }
    // a must be equal to b
    return 0;
  });

  console.dir(arr)
  res.render('index',{results : arr, title : 'Test'})
})

app.get('/inbound', function (req, res) {

    xml2js.parseString(req.query.xml, { explicitArray : false, ignoreAttrs : true, trim : true }, function (err, result) {
        var results = JSON.stringify(result)
        console.log(results)
        var json = JSON.parse(results)
        console.log(json.TRUMPIA.INBOUND_ID)
        console.log(json.TRUMPIA.PHONENUMBER)
        console.log(json.TRUMPIA.CONTENTS)
    });

    res.render(
        'index',
        { title: 'INBOUND SMS', message: 'Inbound Number '+inbounds+' Received!'})
})

app.listen(8080, function () {
    console.log('Listening on port 8080!')
})
