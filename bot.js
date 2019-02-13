var env = require('node-env-file'); // Needed for local build, comment out for Heroku
env(__dirname + '/.env');

if (!process.env.clientId || !process.env.clientSecret || !process.env.PORT) {
  usage_tip();
}

var Botkit = require('botkit');
var debug = require('debug')('botkit:main');

var bot_options = {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    clientSigningSecret: process.env.clientSigningSecret,
    // debug: true,
    scopes: ['bot']
};

// Use a mongo database if specified, otherwise store in a JSON file local to the app.
// Mongo is automatically configured when deploying to Heroku
if (process.env.MONGO_URI) {
    var mongoStorage = require('botkit-storage-mongo')({mongoUri: process.env.MONGO_URI});
    bot_options.storage = mongoStorage;
} else {
    bot_options.json_file_store = __dirname + '/.data/db/'; // store user data in a simple JSON format
}

// Create the Botkit controller, which controls all instances of the bot.
var controller = Botkit.slackbot(bot_options);

// Spawn bot user
var bot = controller.spawn({
  token: process.env.botToken
});

function start_rtm() {
  try {
    bot.startRTM();
  }
  catch(err) {
    console.error(err);
    return setTimeout(start_rtm, 60000); // Try again in 1 minute
  }
}

start_rtm();

controller.startTicking();

controller.on('rtm_close', (bot,err) => {
  start_rtm();
});

// Get information about all users
// Should update storage
// var options = {token: process.env.botToken};
// // let users;
// // console.log("calling on bot users");
// bot.api.users.list(options, (err,res) => {
//   if (!err) {
//     // console.log(res);
//     // console.log("updating users");
//     users = res; // TODO: make a promise so this updates
//     // console.log(users);
//   }
//   else {
//     console.log(err);
//   }
// });
//
// setTimeout(function afterTwoSeconds() {
//   console.log(users)
// }, 2000)

// Set up an Express-powered webserver to expose oauth and webhook endpoints
var webserver = require(__dirname + '/components/express_webserver.js')(controller);

if (!process.env.clientId || !process.env.clientSecret) {

  // Load in some helpers that make running Botkit on Glitch.com better
  require(__dirname + '/components/plugin_glitch.js')(controller);

  webserver.get('/', function(req, res){
    res.render('installation', {
      domain: req.get('host'),
      protocol: req.protocol,
      glitch_domain:  process.env.PROJECT_DOMAIN,
      layout: 'layouts/default'
    });
  })

  var where_its_at = 'http://' + (process.env.PROJECT_DOMAIN ? process.env.PROJECT_DOMAIN+ '.glitch.me/' : 'localhost:' + process.env.PORT || 3000);
  console.log('WARNING: This application is not fully configured to work with Slack. Please see instructions at ' + where_its_at);
}else {

  webserver.get('/', function(req, res){
    res.render('index', {
      domain: req.get('host'),
      protocol: req.protocol,
      glitch_domain:  process.env.PROJECT_DOMAIN,
      layout: 'layouts/default'
    });
  })
  // Set up a simple storage backend for keeping a record of customers
  // who sign up for the app via the oauth
  require(__dirname + '/components/user_registration.js')(controller);

  // Send an onboarding message when a new team joins
  require(__dirname + '/components/onboarding.js')(controller);

  // Load in some helpers that make running Botkit on Glitch.com better
  require(__dirname + '/components/plugin_glitch.js')(controller);

  var normalizedPath = require("path").join(__dirname, "skills");
  require("fs").readdirSync(normalizedPath).forEach(function(file) {
    require("./skills/" + file)(controller);
  });
}

var r = require(__dirname + '/components/reflection_convo.js');

controller.hears(["start reflection", "I want to reflect", "reflect", "reflection round 1", "reflection 1"],
  ["direct_mention", "mention", "direct_message", "ambient"],
  (bot,message) => {
    bot.createConversation(message,(err,convo) => {
      r.reflect1(err,convo,bot,message);
    });
  });

controller.hears(["finish reflection", "reflection round 2", "reflection 2"],
  ["direct_mention", "mention", "direct_message", "ambient"],
  (bot,message) => {
    bot.createConversation(message,(err,convo) => {
      r.reflect2(err,convo);
    });
  });

controller.hears(
  ['hello', 'hi', 'greetings'], [
    'direct_mention', 'mention', 'direct_message', 'ambient'],
    function (bot, message) {
    bot.reply(message, "Hello! I'm Muse, your friendly reflection bot! If you'd like to reflect with me, you can say `start reflection`, `I want to reflect`, or `reflect`.");
  }
);

function usage_tip() {
    console.log('~~~~~~~~~~');
    console.log('Botkit Starter Kit');
    console.log('Execute your bot application like this:');
    console.log('clientId=<MY SLACK CLIENT ID> clientSecret=<MY CLIENT SECRET> PORT=3000 node bot.js');
    console.log('Get Slack app credentials here: https://api.slack.com/apps')
    console.log('~~~~~~~~~~');
}
