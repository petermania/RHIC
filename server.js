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
    var text ='{"TRUMPIA":{"PUSH_ID":"51422124","INBOUND_ID":"48494729","SUBSCRIPTION_UID":"142136527","PHONENUMBER":"9179522360","KEYWORD":"RHIC","DATA_CAPTURE":"","CONTENTS":"","ATTACHMENT":""}}'

    xml2js.parseString(req.query.xml, { explicitArray : false, ignoreAttrs : true, trim : true }, function (err, result) {
        var results = JSON.stringify(result)
        console.log(results)
        var json = JSON.parse(results)
        console.log(json.TRUMPIA.PUSH_ID)

    });

    res.render(
        'index',
        { title: 'INBOUND SMS', message: 'Inbound Number '+inbounds+' Received!'})
})

app.listen(8080, function () {
    console.log('Example app listening on port 8080!')
})
