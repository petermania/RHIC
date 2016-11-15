var express = require('express')
var app = express()
var http=require('http')

var inbounds=0



var xml2js = require('xml2js')



app.set('view engine', 'pug')

app.get('/', function (req, res) {
  res.render(
      'index',
      { title: 'INBOUND SMS', message: 'Inbound Number '+inbounds+' Received!'})
})

app.get('/inbound', function (req, res) {
    console.log('inbound text received')
    inbounds++
    console.log(req.query.xml)
    xml2js.parseString(req.query.xml, { explicitArray : false, ignoreAttrs : true }, function (err, result) {
        var jsonResults=JSON.stringify(result)
        console.log(jsonResults)
        console.log(jsonResults["TRUMPIA"])
    });
    res.render(
        'index',
        { title: 'INBOUND SMS', message: 'Inbound Number '+inbounds+' Received!'})
})

app.listen(8080, function () {
    console.log('Example app listening on port 8080!')
})
