var express = require('express')
var app = express()
var http=require('http')



var parseString = require('xml2js').parseString;
var xml = "<root>Hello xml2js!</root>"
parseString(xml, function (err, result) {
    console.dir(result)
});


app.set('view engine', 'pug')

app.get('/', function (req, res) {
    res.render(
        'index',
        { title: 'Hey Hey Hey!', message: 'Yo Yo'})
})

app.get('/inbound', function (req, res) {

  var options ={
    host: 'api.trumpia.com',
    path: '/rest/v1/PEDG2016/keyword/1094198',
    method: 'GET',
    headers: {
      'Content-Type': "application/json",
      'X-Apikey' : "367ab873208291dc5b2eb7f907e491d6"
    }
  }

  http.get(options, (res1) => {
    const statusCode = res1.statusCode;
    const contentType = res1.headers['content-type'];

    let error;
    if (statusCode !== 200) {
      error = new Error(`Request Failed.\n` +
                        `Status Code: ${statusCode}`);
    } else if (!/^application\/json/.test(contentType)) {
      error = new Error(`Invalid content-type.\n` +
                        `Expected application/json but received ${contentType}`);
    }
    if (error) {
      console.log(error.message);
      // consume response data to free up memory
      res1.resume();
      return;
    }

    res1.setEncoding('utf8');
    let rawData = '';
    res1.on('data', (chunk) => rawData += chunk);
    res1.on('end', () => {
      try {
        let parsedData = JSON.parse(rawData);
        console.log(parsedData);
      } catch (e) {
        console.log(e.message);
      }
    });
  }).on('error', (e) => {
    console.log(`Got error: ${e.message}`);
  });

    res.render(
        'index',
        { title: 'INBOUND SMS', message: 'This is the inbound xml page'})
})

app.listen(8080, function () {
    console.log('Example app listening on port 3000!')
})
