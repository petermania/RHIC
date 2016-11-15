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
    console.log('Example app listening on port 8080!')
})
