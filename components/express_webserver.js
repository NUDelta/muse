var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var cookieMiddleware = require('universal-cookie-express');
var querystring = require('querystring');
var debug = require('debug')('botkit:webserver');
var http = require('http');
var hbs = require('express-hbs');
const { createMessageAdapter } = require('@slack/interactive-messages');
// var env = require('node-env-file'); // Needed for local build, comment out for Heroku

module.exports = function(controller) {
    // var env = require('node-env-file'); // comment out for Heroku
    // path = require('path');
    // let reqPath = path.join(__dirname, '../.env');
    // env(reqPath);
    const slackInteractions = createMessageAdapter(process.env.clientSigningSecret);
    var webserver = express();
    webserver.use(function(req, res, next) {
        req.rawBody = '';

        req.on('data', function(chunk) {
            req.rawBody += chunk;
        });

        next();
    });
    webserver.use('/slack/actions', slackInteractions.expressMiddleware());
    webserver.use(cookieParser());
    webserver.use(bodyParser.json());
    webserver.use(bodyParser.urlencoded({ extended: true }));
    webserver.use(cookieMiddleware());

    // set up handlebars ready for tabs
    webserver.engine('hbs', hbs.express4({partialsDir: __dirname + '/../views/partials'}));
    webserver.set('view engine', 'hbs');
    webserver.set('views', __dirname + '/../views/');

    webserver.use(express.static('public'));
    var server = http.createServer(webserver);

    webserver.listen(process.env.PORT || 3000, null, function() {

        console.log('Express webserver configured and listening at http://localhost:' + process.env.PORT || 3000);

    });

    // import all the pre-defined routes that are present in /components/routes
    var normalizedPath = require("path").join(__dirname, "routes");
    require("fs").readdirSync(normalizedPath).forEach(function(file) {
      require("./routes/" + file)(webserver, controller);
    });

    controller.webserver = webserver;
    controller.httpserver = server;

    setInterval(function() {
      http.get("http://muse-delta.herokuapp.com/");
    }, 20*60000); // Ping every 20 min to keep from shutting down

    return [webserver, slackInteractions];

}
