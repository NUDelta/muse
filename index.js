var http = require('http');
var express = require('express');
var request = require('request');
var app = express();
const PORT=3001;
var s = require('./secrets');

// function handleRequest(request, response){
//   response.end('Ngrok is working! -  Path Hit: ' + request.url);
// }
//
// var server = http.createServer(handleRequest);
//
// server.listen(process.env.PORT || PORT, function(){
//   console.log("Server listening on: http://localhost:%s", PORT);
// });

app.listen(process.env.PORT || PORT, ()=> {
  console.log("Example app listening on port " + PORT);
})

app.get('/', function(req, res) {
    res.send('Ngrok is working! Path Hit: ' + req.url);
});

app.get('/oauth', function(req, res) {
    // When a user authorizes an app, a code query parameter is passed on the oAuth endpoint. If that code is not there, we respond with an error message
    if (!req.query.code) {
        res.status(500);
        res.send({"Error": "Looks like we're not getting code."});
        console.log("Looks like we're not getting code.");
    } else {
        // If it's there...

        // We'll do a GET call to Slack's `oauth.access` endpoint, passing our app's client ID, client secret, and the code we just got as query parameters.
        request({
            url: 'https://slack.com/api/oauth.access', //URL to hit
            qs: {code: req.query.code, client_id: s.clientID, client_secret: s.clientSecret}, //Query string data
            method: 'GET', //Specify the method

        }, function (error, response, body) {
            if (error) {
                console.log(error);
            } else {
                res.json(body);

            }
        })
    }
});

app.post('/command', function(req, res) {
    res.send('Your ngrok tunnel is up and running!');
});
