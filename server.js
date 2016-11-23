var express = require('express')
var app = express()
var http=require('http')
var MongoClient = require('mongodb').MongoClient
var assert = require('assert')
var bodyParser = require('body-parser')
var request=require('request')
var json2csv = require('json2csv')
var io = require('socket.io').listen(http)
var path = require ('path')

var xml2js = require('xml2js')
var fs = require("fs")

var currentMessage

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(__dirname + '/public'))
app.set('view engine', 'pug')


// Connection URL
var url = 'mongodb://rhicDB:rhic4eva@ec2-54-173-181-162.compute-1.amazonaws.com:27017/RHIC'

var active = []
var inactive = []
var used = []
var pending = []
var questions = []
var approved = []
var disapproved = []
var current

var setCurrentPoll = function() {
  MongoClient.connect(url, function(err, db) {
    console.log("Connected successfully to db server to set current poll")
    assert.equal(null, err)
    var col=db.collection('polls')
    col.find({status:'active'}).toArray(function(err,actRes){
      if(actRes[0]){
        current=actRes[0].poll_id
        console.log("current: "+current)
      }
      else{
        console.log("no active poll")
        current=0
      }
    })
    db.close()
  })
}

setCurrentPoll()

app.get('/', function (req, res) {
  console.log("Attempting Initial Connect to db")
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err)
    console.log("Connected successfully to db server to load page")
    loadPolls(db, function() {
      console.log('finished loading data')
      db.close()
      console.log('db closed')
      res.render('index',{active : active, inactive : inactive, used : used, pending : pending, title : 'PEDG SMS System'})
    })
  })
})

app.get('/questions', function(req,res){
    console.log("loading questions page")
    console.log("Attempting Connect to db")
    MongoClient.connect(url, function(err, db) {
      assert.equal(null, err)
      console.log("Connected successfully to db server to load questions page")
      loadQuestions(db, function() {
        console.log('finished loading data')
        db.close()
        console.log('db closed')
        res.render('questions',{questions : questions, approved:approved, disapproved:disapproved, title : 'PEDG SMS System – Questions'})
      })
    })
})

app.get('/viewer',function(req,res){
  console.log("loading viewer page")
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err)
    console.log("Connected successfully to db server to load questions page")
    loadVotes(db, function(vote1, text1, vote2, text2, vote3, text3, vote4, text4, num) {
      console.log('finished loading data')
      console.log('one: '+vote1+' two: '+vote2+' three: '+vote3+' four: '+vote4)
      db.close()
      console.log('db closed')
      res.render('viewer',{vote1 : vote1, text1:text1, vote2:vote2, text2:text2, vote3:vote3, text3:text3, vote4:vote4, text4:text4, response_no:num, title : 'RHIC Viewer'})
    })
  })
})

app.get('/add-poll', function (req, res) {
  console.log("text: "+req.query.poll_text)
  // Use connect method to connect to the server
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err)
    console.log("Connected successfully to db server")
    insertPoll(db, req, function() {
      console.log('reload')
      db.close()
      res.redirect('/')
    })
  })
})

app.get('/save-question', function (req, res) {
  if(req.query.question_action=='save'){
    console.log('saving question')
    // Use connect method to connect to the server
    MongoClient.connect(url, function(err, db) {
      assert.equal(null, err)
      console.log("Connected successfully to db server")
      saveQuestion(db, req, function() {
        db.close()
        res.redirect('/questions')
      })
    })
  }
  else{
    MongoClient.connect(url, function(err, db) {
      assert.equal(null, err)
      console.log("Connected successfully to db server")
      setQuestionStatus(db, req, function() {
        db.close()
        res.redirect('/questions')
      })
    })
  }
})

app.get('/trigger-poll', function (req, res) {
  if(req.query.trigger=='save'){
    // Use connect method to connect to the server
    MongoClient.connect(url, function(err, db) {
      assert.equal(null, err)
      console.log("Connected successfully to db server")
      savePoll(db, req, function() {
        console.log('reload')
        db.close()
        res.redirect('/')
      })
    })
  }
  else if(req.query.trigger=='launch'){
    console.log('launched')
    MongoClient.connect(url, function(err, db) {
      assert.equal(null, err)
      console.log("Connected successfully to db server")
      launchPoll(db,req,function(){
        console.log('launching new poll')
        db.close()
        res.redirect('/')
      })
    })
  }
})

app.get('/inbound', function (req, res) {
      xml2js.parseString(req.query.xml, { explicitArray : false, ignoreAttrs : true, trim : true }, function (err, result) {
        console.log("inbound message:")
        var results = JSON.stringify(result)
        console.log(results)
        var json = JSON.parse(results)
        MongoClient.connect(url, function(err, db) {
          assert.equal(null, err)
          console.log("Connected successfully to db server to process SMS")
          processInboundSMS(db, json, function(){
            console.log("SMS processed and counted")
            db.close()
            res.redirect('/')
          })
        })//mongoconnect
    })//parseString
})

app.get('/export-csv',function(req,res){
  var fields=['order','question']
  var csv = json2csv({ data: approved, fields: fields })
  var time=Date.now()
  fs.writeFile(__dirname+'/exports/'+time+'_export.csv', csv, function(err) {
    if (err) throw err
      console.log('CSV file saved')
    var file = __dirname + '/exports/'+time+'_export.csv'
    res.download(file)
  })
})

app.get('/org',function (req,res){
  var options = {
    uri: 'http://api.trumpia.com/rest/v1/PEDG2016/list',
    method: 'GET',
    headers:{
      'Content-Type':'application/json',
      'X-Apikey':'367ab873208291dc5b2eb7f907e491d6'
    }
  }

  request(options,function (err, httpResponse, body2) {
    if (err) {
      return console.error('SMS message send failed:', err)
    }
    console.log(body2)
  })

})

app.get('/check',function(req,res){

  var options = {
    uri: 'http://api.trumpia.com/rest/v1/PEDG2016/message/'+currentMessage,
    method: 'GET',
    headers:{
      'Content-Type':'application/json',
      'X-Apikey':'367ab873208291dc5b2eb7f907e491d6'
    }
  }

  request(options,function (err, httpResponse, body2) {
    if (err) {
      return console.error('message send failed:', err)
    }
  })
})

app.listen(8080, function () {
    console.log('Listening on port 8080')
})

var insertPoll = function(db, req, callback) {
  console.log('inserting')
  var col = db.collection('polls')

  checkKeywords(req)

  col.insertOne({'poll_text' : req.query.poll_text, 'order' : parseInt(req.query.order), 'status' : 'inactive', 'poll_id' : Date.now(), 'launch_time' : '', 'end_time':'','response_no':req.query.response_no,'text1':req.query.text1,'text2':req.query.text2,'text3':req.query.text3,'text4':req.query.text4}, function(err, r) {
    assert.equal(null, err)
    assert.equal(1, r.insertedCount)
    callback()
  })
}

var savePoll = function(db, req, callback) {
  console.log('updating poll '+req.query.poll_id)
  var col = db.collection('polls')
  checkKeywords(req)
  col.updateOne({poll_id:parseInt(req.query.poll_id)},
    {$set: {poll_text:req.query.poll_text, order:parseInt(req.query.order), 'text1':req.query.text1,'text2':req.query.text2,'text3':req.query.text3,'text4':req.query.text4}},
    {upsert:false},
    function(err, r) {
      assert.equal(null, err)
      callback()
  })
}

var loadPolls = function(db, callback) {
  active=[]
  pending=[]
  used=[]
  inactive=[]

    var col=db.collection('polls')
    col.find({status:'active'}).toArray(function(err,actRes){
      if(actRes) active=actRes
      console.log("Finding pending results")
      col.find({status:'pending'}).toArray(function(err,pendRes){
        if(pendRes.length>0) {
          pending=pendRes
          console.log(pending.length+" pending results")
          for(var i=0, len=pending.length;i<len;i++){
            element=pending[i]
            var options = {
              uri: 'http://api.trumpia.com/rest/v1/PEDG2016/message/'+pending[i].message_id,
              method: 'GET',
              headers:{
                'Content-Type':'application/json',
                'X-Apikey':'367ab873208291dc5b2eb7f907e491d6'
              }
            }

            request(options,function (err, httpResponse, body2) {
              if (err) {
                return console.error('message send failed:', err)
              }
              if(JSON.parse(body2).status=='sent'){
                col.updateMany({message_id: element.message_id},
                  {$set: {status:'active'}},
                  {upsert:false},
                  function(err, r) {
                    if(err){
                      console.log("error: "+err)
                    }
                    else{
                      console.log("write: "+r)
                    }
                    console.log(element.message_id+" updated to ACTIVE")
                    if(i==len){
                      console.log("updated final pending item")
                      col.find({status:'inactive'}).sort( { order: 1 } ).toArray(function(err,inactRes){
                        if(inactRes) {
                          inactive=inactRes
                        }
                        col.find({status:'used'}).toArray(function(err, usedRes){
                          if (usedRes) used=usedRes
                          console.log('loaded all polls')
                          assert.equal(null, err)
                          callback()
                        })
                      })
                    }
                })
              }
              else{
                console.log("Pending results not updated")
                col.find({status:'inactive'}).sort( { order: 1 } ).toArray(function(err,inactRes){
                  if(inactRes) {
                    inactive=inactRes
                  }
                  col.find({status:'used'}).toArray(function(err, usedRes){
                    if (usedRes) used=usedRes
                    console.log('loaded all polls')
                    assert.equal(null, err)
                    callback()
                  })
                })
              }

            })
          }

        }
        else{
          console.log("No pending results found")
          col.find({status:'inactive'}).sort( { order: 1 } ).toArray(function(err,inactRes){
            if(inactRes) {
              inactive=inactRes
            }
            col.find({status:'used'}).toArray(function(err, usedRes){
              if (usedRes) used=usedRes
              console.log('loaded all polls')
              assert.equal(null, err)
              callback()
            })
          })
        }
      })
    })

}

var launchPoll = function(db, req, callback) {
  console.log('launching poll')
    var col = db.collection('polls')
    col.updateMany({status:'active'},
      {$set: {status:'used','end_time':Date.now()}},
      {upsert:false},
      function(err, r) {
        removeKeywords(db,function(){
        assert.equal(null, err)
        current=parseInt(req.query.poll_id)
        col.updateOne({poll_id:parseInt(req.query.poll_id)},
          {$set: {status:'pending','launch_time':Date.now()}},
          {upsert:false},
          function(err, r) {
            assert.equal(null, err)
            console.log("about to send")
            console.log(req.query.response_no)
            sendPollSMS(req, function(message_id){
              col.updateOne({poll_id:parseInt(req.query.poll_id)},
                {$set: {message_id:message_id}},
                {upsert:false},
                function(err, r) {
                  callback()
                })
            })
        })
    })
  })
}

var sendPollSMS = function(req, callback){
  console.log("prepping text")

  if(req.query.response_no=='2') var sms=' '+req.query.poll_text+' Reply with '+req.query.text1.toUpperCase()+' or '+req.query.text2.toUpperCase()+' to vote.'
  else if(req.query.response_no=='3') var sms=' '+req.query.poll_text+' Reply with '+req.query.text1.toUpperCase()+', '+req.query.text2.toUpperCase()+', or '+req.query.text3.toUpperCase()+' to vote.'
  else if(req.query.response_no=='4') var sms=' '+req.query.poll_text+' Reply with '+req.query.text1.toUpperCase()+', '+req.query.text2.toUpperCase()+', '+req.query.text3.toUpperCase()+', or '+req.query.text4.toUpperCase()+' to vote.'

  var body ={
    org_name_id:135715,
    description:'send SMS'+req.poll_id,
    sms:{
      message:sms
    },
    recipients:{
      type:'list',
      value:1836875
    }
  }

  var options = {
    uri: 'http://api.trumpia.com/rest/v1/PEDG2016/message',
    method: 'PUT',
    headers:{
      'Content-Type':'application/json',
      'X-Apikey':'367ab873208291dc5b2eb7f907e491d6'
    },
    body: JSON.stringify(body)
  }

  request(options,function (err, httpResponse, body2) {
    if (err) {
      return console.error('message send failed:', err)
    }
    console.log('Upload successful!  Server responded with:', body2)
    currentMessage=JSON.parse(body2).message_id
    callback(currentMessage)
    })
}

var processInboundSMS = function (db,json,callback){
  var col=db.collection('polls')
  col.find({status:'active'}).toArray(function(err,actRes){
    if(json.TRUMPIA.KEYWORD=='RHIC') {
      console.log("found: "+json.TRUMPIA.KEYWORD)
      var votes=db.collection('questions')
      votes.insertOne({'question' : json.TRUMPIA.CONTENTS,'phonenumber':json.TRUMPIA.PHONENUMBER,'status':'new','question_id':Date.now(),'order':1}, function(err, r) {
        assert.equal(null, err)
        assert.equal(1, r.insertedCount)
        callback()
      })//col.insertOne
    }//else
    else if(actRes.length>0){
      element=actRes[0]
      else if(json.TRUMPIA.CONTENTS.toLowerCase().includes(element.text1.toLowerCase())||json.TRUMPIA.KEYWORD.toLowerCase().includes(element.text1.toLowerCase())){
        console.log("vote option one received")
        var votes=db.collection('votes')
        votes.find({'phonenumber':json.TRUMPIA.PHONENUMBER,'poll_id':element.poll_id}).toArray(function(err,res){
          if(res.length==0){
            votes.insertOne({'poll_id' : element.poll_id, 'vote' : 1, 'phonenumber':json.TRUMPIA.PHONENUMBER}, function(err, r) {
              assert.equal(null, err)
              assert.equal(1, r.insertedCount)
              callback()
            })//votes.insert
          }//if not present
          else{
            console.log("duplicate vote, not counted")
            callback()
          }
        })//votes.find
      }//if includes
      else if(json.TRUMPIA.CONTENTS.toLowerCase().includes(element.text2.toLowerCase())||json.TRUMPIA.KEYWORD.toLowerCase().includes(element.text2.toLowerCase())){
        console.log("vote option two received")
        var votes=db.collection('votes')
        votes.find({'phonenumber':json.TRUMPIA.PHONENUMBER,'poll_id':element.poll_id}).toArray(function(err,res){
          if(res.length==0){
            votes.insertOne({'poll_id' : element.poll_id, 'vote' : 2, 'phonenumber':json.TRUMPIA.PHONENUMBER}, function(err, r) {
              assert.equal(null, err)
              assert.equal(1, r.insertedCount)
              callback()
            })//votes.insert
          }//if not present
          else{
            console.log("duplicate vote, not counted")
            callback()
          }
        })//votes.find
      }//elseif includes N2
      else if(element.text3.toLowerCase()!=''&&json.TRUMPIA.CONTENTS.toLowerCase().includes(element.text3.toLowerCase())||json.TRUMPIA.KEYWORD.toLowerCase().includes(element.text3.toLowerCase())){
        console.log("vote option three received")
        var votes=db.collection('votes')
        votes.find({'phonenumber':json.TRUMPIA.PHONENUMBER,'poll_id':element.poll_id}).toArray(function(err,res){
          if(res.length==0){
            votes.insertOne({'poll_id' : element.poll_id, 'vote' : 3, 'phonenumber':json.TRUMPIA.PHONENUMBER}, function(err, r) {
              assert.equal(null, err)
              assert.equal(1, r.insertedCount)
              callback()
            })//votes.insert
          }//if not present
          else{
            console.log("duplicate vote, not counted")
            callback()
          }
        })//votes.find
      }//elseif includes N3
      else if(element.text4.toLowerCase()!=''&&json.TRUMPIA.CONTENTS.toLowerCase().includes(element.text4.toLowerCase())||json.TRUMPIA.KEYWORD.toLowerCase().includes(element.text1.toLowerCase())){
        console.log("vote option four received")
        var votes=db.collection('votes')
        votes.find({'phonenumber':json.TRUMPIA.PHONENUMBER,'poll_id':element.poll_id}).toArray(function(err,res){
          if(res.length==0){
            votes.insertOne({'poll_id' : element.poll_id, 'vote' : 4, 'phonenumber':json.TRUMPIA.PHONENUMBER}, function(err, r) {
              assert.equal(null, err)
              assert.equal(1, r.insertedCount)
              callback()
            })//votes.insert
          }//if not present
          else{
            console.log("duplicate vote, not counted")
            callback()
          }
        })//votes.find
      }//elseif includes 4
      else {
        console.log("question")
        var votes=db.collection('questions')
        votes.insertOne({'question' : json.TRUMPIA.CONTENTS,'phonenumber':json.TRUMPIA.PHONENUMBER,'status':'new','question_id':Date.now(),'order':1}, function(err, r) {
          assert.equal(null, err)
          assert.equal(1, r.insertedCount)
          callback()
        })//col.insertOne
      }//else
    }//if(actRes)
  })//find active
}

var loadQuestions = function(db, callback){
  questions=[]
  approved=[]
  disapproved=[]
  var col=db.collection('questions')
  col.find({status:'new'}).sort( { order: 1 }).toArray(function(err,res){
    questions=res
    col.find({status:'approve'}).sort( { order: 1 }).toArray(function(err,resApp){
      approved=resApp
      col.find({status:'disapprove'}).sort( { order: 1 }).toArray(function(err,resDis){
        disapproved=resDis
        callback()
      })
    })
  })
}

var saveQuestion = function(db, req, callback){
  var col=db.collection('questions')
  col.updateOne({question_id:parseInt(req.query.question_id)},
    {$set: {question:req.query.question, order:parseInt(req.query.order)}},
    {upsert:false},
    function(err, r) {
      assert.equal(null, err)
      console.log("matched: "+r.matchedCount)
      // assert.equal(1, r.matchedCount)
      // assert.equal(1, r.upsertedCount)
      callback()
  })
}

var setQuestionStatus = function(db, req, callback){
  var col=db.collection('questions')
  if(req.query.question_action=='disapprove'){
    col.updateOne({question_id:parseInt(req.query.question_id)},
      {$set: {status:'disapprove', order:parseInt(req.query.order)}},
      {upsert:false},
      function(err, r) {
        assert.equal(null, err)
        callback()
    })
  }
  else if(req.query.question_action=='approve'){
    col.updateOne({question_id:parseInt(req.query.question_id)},
      {$set: {status:'approve', order:parseInt(req.query.order)}},
      {upsert:false},
      function(err, r) {
        assert.equal(null, err)
        callback()
    })
  }
}

var loadVotes = function(db, callback){
  var polls=db.collection('polls')
  polls.find({poll_id:current}).toArray(function(e,r){
    var num=r[0].response_no
    var text1=r[0].text1
    var text2=r[0].text2
    var text3=r[0].text3
    console.log("text 3: "+text3)
    if(text3=='') text3='0'
    var text4=r[0].text4
    if(text4=='') text4='0'
    console.log("number of responses: "+num)
    var col=db.collection('votes')
    var one, two, three, four
    col.find({poll_id:current,vote:1}).toArray(function(err,res){
      one=res.length
      col.find({poll_id:current,vote:2}).toArray(function(err2, res2){
        two=res2.length
        col.find({poll_id:current,vote:3}).toArray(function(err3, res3){
          three=res3.length
          col.find({poll_id:current,vote:4}).toArray(function(err4, res4){
            four=res4.length
            callback(one,text1,two,text2,three,text3,four,text4,num)
          })
        })
      })
    })
  })
}

var checkKeywords = function(req){
  console.log("here it is:"+req)
  var responses
  var options = {
    uri: 'http://api.trumpia.com/rest/v1/PEDG2016/keyword',
    method: 'GET',
    headers:{
      'Content-Type':'application/json',
      'X-Apikey':'367ab873208291dc5b2eb7f907e491d6'
    }
  }

  request(options,function (err, httpResponse, body2) {
    if (err) {
      return console.error('Get Keywords', err)
    }
    var present1=false
    var present2=false
    var present3=false
    var present4=false
    for(var i=0;i<body2.length;i++){
      if(req.query.text1==body2[i].keyword){
        present1=true
      }
      if(req.query.text2==body2[i].keyword){
        present2=true
      }
      if(parseInt(req.query.response_no)>2){
        if(req.query.text3==body2[i].keyword){
          present3=true
        }
      }
      else present3=true
      if(parseInt(req.query.response_no)>3){
        if(req.query.text4==body2[i].keyword){
          present4=true
        }
      }
      else present4=true
    }

        var keyword_body ={
          keyword: '',
          lists:1855421,
          org_name_id:135715,
          allow_message:'true',
          auto_response :
             {
               "frequency" : "1",
               "message" : "Thank You for Voting!",
             }
        }

    var add = {
      uri: 'http://api.trumpia.com/rest/v1/PEDG2016/keyword',
      method: 'PUT',
      headers:{
        'Content-Type':'application/json',
        'X-Apikey':'367ab873208291dc5b2eb7f907e491d6'
      },
      body:''
    }

    if(present1==false){
      keyword_body.keyword=req.query.text1
      add.body=JSON.stringify(keyword_body)
      request(add,function (err, httpResponse){
        if (err) {
          return console.error('Keyword add failed:', err)
        }
        console.log(httpResponse.body)
      })
    }
    if(present2==false){
      keyword_body.keyword=req.query.text2
      add.body=JSON.stringify(keyword_body)
      request(add,function (err, httpResponse){
        if (err) {
          return console.error('Keyword add failed:', err)
        }
        console.log(httpResponse.body)
      })
    }
    if(present3==false){
      keyword_body.keyword=req.query.text3
      add.body=JSON.stringify(keyword_body)
      request(add,function (err, httpResponse){
        if (err) {
          return console.error('Keyword add failed:', err)
        }
        console.log(httpResponse.body)
      })
    }

    if(present4==false){
      keyword_body.keyword=req.query.text4
      add.body=JSON.stringify(keyword_body)
      request(add,function (err, httpResponse){
        if (err) {
          return console.error('SMS message send failed:', err)
        }
        console.log(httpResponse.body)
      })
    }
  })
}

var removeKeywords = function(db, callback){
  var keycheck=db.collection('polls')
  keycheck.find({status:'active',status:'pending',status:'inactive'}).toArray(function(err,res){
    var options = {
      uri: 'http://api.trumpia.com/rest/v1/PEDG2016/keyword',
      method: 'GET',
      headers:{
        'Content-Type':'application/json',
        'X-Apikey':'367ab873208291dc5b2eb7f907e491d6'
      }
    }

    request(options,function (err, httpResponse, body2) {
      body2=JSON.parse(body2)
      if (err) {
        return console.error('Get Keywords', err)
      }
      for(var i=0;i<body2.keyword.length;i++){
        var keyword_used=false
        var delete_options = {
          uri: 'http://api.trumpia.com/rest/v1/PEDG2016/keyword',
          method: 'DELETE',
          headers:{
            'Content-Type':'application/json',
            'X-Apikey':'367ab873208291dc5b2eb7f907e491d6'
          }
        }
        for(var j=0;j<res.length;j++){
          console.log(body2.keyword[i].keyword)
          if(body2.keyword[i].keyword=='RHIC'||res[j].text1==body2.keyword[i].keyword||res[j].text2==body2.keyword[i].keyword||res[j].text3==body2.keyword[i].keyword||res[j].text4==body2.keyword[i].keyword){
            console.log('found result')
            keyword_used=true
          }
        }
        if(keyword_used==false){
          delete_options.uri+='/'+parseInt(body2.keyword[i].keyword_id)
          console.log(delete_options.uri)
          request(delete_options,function(err,httpResponse){
            if (err) {
              return console.error('delete Keywords', err)
            }
            console.log(httpResponse.body)
          })
        }
      }
      callback()
    })
  })
}
