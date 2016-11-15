var express = require('express')
var app = express()
var http=require('http')

var inbounds=0



var parseString = require('xml2js').parseString;



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
    parseString(req.query.xml, function (err, result) {
        console.dir(result.trumpia)
        console.log(result.trumpia.phonenumber)
        console.log(result.trumpia.contents)
    });
    res.render(
        'index',
        { title: 'INBOUND SMS', message: 'Inbound Number '+inbounds+' Received!'})
})

app.listen(8080, function () {
    console.log('Example app listening on port 8080!')
})
