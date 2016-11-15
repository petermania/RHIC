var express = require('express')
var app = express()
var http=require('http')

var inbounds=0



var parseString = require('xml2js').parseString;
var xml = "<root>Hello xml2js!</root>"
parseString(xml, function (err, result) {
    console.dir(result)
});


app.set('view engine', 'pug')

app.get('/', function (req, res) {
  res.render(
      'index',
      { title: 'INBOUND SMS', message: 'Inbound Number '+inbounds+' Received!'})
})

app.get('/inbound', function (req, res) {
    console.log('inbound text received')
    inbounds++
    console.log(req.query)
    res.render(
        'index',
        { title: 'INBOUND SMS', message: 'Inbound Number '+inbounds+' Received!'})
})

app.listen(8080, function () {
    console.log('Example app listening on port 8080!')
})
