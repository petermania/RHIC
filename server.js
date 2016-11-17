var express = require('express')
var app = express()
var http=require('http')
var MongoClient = require('mongodb').MongoClient
var assert = require('assert')
var bodyParser = require('body-parser');
var request=require('request')

var xml2js = require('xml2js')

var fs = require("fs")

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'pug')

var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');

// Connection URL
//var url = 'mongodb://localhost:27017/RHIC';
var url = 'mongodb://rhicDB:rhic4eva@ec2-54-173-181-162.compute-1.amazonaws.com:27017/RHIC';

var active = []
var inactive = []
var used = []
var current

var setCurrentVote = function() {
  MongoClient.connect(url, function(err, db) {
    console.log("Connected successfully to db server");
    assert.equal(null, err)
    var col=db.collection('votes')
    col.find({status:'active'}).toArray(function(err,actRes){
      if(actRes[0]){
        current=actRes[0].vote_id
        console.log("current: "+current)
      }
      else{
        console.log("no active vote")
        current=0
      }
    })
    db.close()
  })
}

setCurrentVote()

app.get('/', function (req, res) {
  console.log('init')
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    console.log("Connected successfully to db server");
    loadVotes(db, function() {
      console.log('callback')
      db.close()
      res.render('index',{active : active, inactive : inactive, used : used, title : 'Test'})
    })
  })
})

app.get('/test', function (req, res){
    res.render('index',{active : active, inactive : inactive, used : used, title : 'Test'})
})

app.get('/add-vote', function (req, res) {
  console.log(req.query.vote_text)
  console.log(req.query.order)
  // Use connect method to connect to the server
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    console.log("Connected successfully to db server");
    insertVote(db, req, function() {
      console.log('reload')
      db.close();
      res.redirect('/')
    });
  });
});

app.get('/trigger-vote', function (req, res) {
  if(req.query.trigger=='save'){
    // Use connect method to connect to the server
    MongoClient.connect(url, function(err, db) {
      assert.equal(null, err)
      console.log("Connected successfully to db server")
      saveVote(db, req, function() {
        console.log('reload')
        db.close()
        res.redirect('/')
      });
    });
  }
  else if(req.query.trigger=='launch'){
    console.log('launched')
    MongoClient.connect(url, function(err, db) {
      assert.equal(null, err)
      console.log("Connected successfully to db server")
      launchVote(db,req,function(){
        console.log('launching new vote')
        db.close()
        res.redirect('/')
      })
    });
  }
});

app.get('/inbound', function (req, res) {
      xml2js.parseString(req.query.xml, { explicitArray : false, ignoreAttrs : true, trim : true }, function (err, result) {
        var results = JSON.stringify(result)
        console.log(results)
        var json = JSON.parse(results)
        console.log(json.TRUMPIA.INBOUND_ID)
        console.log(json.TRUMPIA.PHONENUMBER)
        console.log(json.TRUMPIA.CONTENTS)
    });
})

app.listen(8080, function () {
    console.log('Listening on port 8080')
})

var insertVote = function(db, req, callback) {
  var col = db.collection('votes')
  col.insertOne({'vote_text' : req.query.vote_text, 'order' : parseInt(req.query.order), 'status' : 'inactive', 'vote_id' : Date.now(), 'launch_time' : '', 'end_time':'','yes_text':req.query.yes_text,'no_text':req.query.no_text}, function(err, r) {
    assert.equal(null, err);
    assert.equal(1, r.insertedCount);
    callback()
  });
}

var saveVote = function(db, req, callback) {
  console.log('updating')
  var col = db.collection('votes')
  console.log(req.query.vote_id)
  col.updateOne({vote_id:parseInt(req.query.vote_id)},
    {$set: {vote_text:req.query.vote_text, order:parseInt(req.query.order), yes_text:req.query.yes_text, no_text:req.query.no_text}},
    {upsert:false},
    function(err, r) {
      assert.equal(null, err);
      console.log(r.matchedCount)
      // assert.equal(1, r.matchedCount);
      // assert.equal(1, r.upsertedCount);
      callback()
  });
}

var loadVotes = function(db, callback) {
  var act=db.collection('votes')
  act.find({status:'active'}).toArray(function(err,actRes){
    if(actRes) active=actRes
    act.find({status:'inactive'}).sort( { order: 1 } ).toArray(function(err,inactRes){
      if(inactRes) {
        inactive=inactRes
      }
      act.find({status:'used'}).toArray(function(err, usedRes){
        if (usedRes) used=usedRes
        console.log('loaded')
        assert.equal(null, err)
        callback()
      })
    })
  })
}

var launchVote = function(db, req, callback) {
  console.log('launching')
  var col = db.collection('votes')
  col.updateMany({status:'active'},
    {$set: {status:'used','end_time':Date.now()}},
    {upsert:false},
    function(err, r) {
      assert.equal(null, err);
      current=parseInt(req.query.vote_id)
      col.updateOne({vote_id:parseInt(req.query.vote_id)},
        {$set: {status:'active','launch_time':Date.now()}},
        {upsert:false},
        function(err, r) {
          assert.equal(null, err)
          sendVoteSMS(req.query.vote_text,function(){
            callback()
          })
      })
  })
}

var sendVoteSMS = function(text, callback){
  request("http://api.trumpia.com/http/v2/sendtolist?apikey=367ab873208291dc5b2eb7f907e491d6&list_names=RHIC%20Testing%20List&email_mode=FALSE&sms_mode=TRUE&description=sentvote&sms_message="+encodeURIComponent(text), function (error, response, body) {
    console.log("sending text")
    if (!error) {
      console.log(body) // Show the HTML for the Google homepage.
    }
    callback()
  })
}
