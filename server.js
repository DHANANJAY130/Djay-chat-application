var express = require('express');
var app = express();
var server = require('http').Server(app);
var client = require('socket.io')(server).sockets;
var path = require('path');
var ip = require('ip');
var mongo = require('mongodb').MongoClient;
var mongoose=require('mongoose');

// Connect to Mongo

mongoose.connect('mongodb+srv://djay124:djay124@cluster0-kjwwv.mongodb.net/chatdb?retryWrites=true&w=majority', function(err, db) {
    // mongo.connect('mongodb://localhost:27017/chatdb2',function(err,db){
    if (err) {
    throw err;
  }
  console.log('Mongo Connected.');

  //Connect to socket
  client.on('connection', function(socket) {
      console.log('a new user is connected');
      let chat = db.collection('chats');
      
      // Create functon to send status
      SendStatus=function(s){
          socket.emit('status',s)
        }
        //get chats from mongo collection
        chat.find().limit(100).sort({ _id:1}).toArray(function(err,res){
            if(err){
                throw err;
            }

            //emit the messages
            socket.emit('output',res);
        })
        //handle the input events
        socket.on('input',function(data){
            let name=data.name;
            let message=data.message;
            //check for name and messages
            if(name == '' ||  message == ''){
                //Send error status
                SendStatus('Please enter a name and message.');
            }else{
                //insert messages
                chat.insertOne({name:name,message:message},function(){
                
                    client.emit('output',[data]);
                    console.log('messageP: ',[data]);
                    
                    //send status objects
                    SendStatus({
                        message:'message sent',
                        clear:true
                    })
                });
            }
        });
        //handle clear chat
        socket.on('clear',function(){

            chat.deleteMany({},function(){
                socket.emit('cleared')
            })
        })

// ////////////////////////////////////
      socket.on('disconnect', function() {
          console.log('a user is disconnected');
        });
    });
});

app.get('/',function(req,res){
    res.sendFile(__dirname+'/index.html')

})

server.listen((process.env.PORT || 5000),function(){
    console.log('the server is listening at http://' + ip.address() + ':' + (process.env.PORT || 5000));
})