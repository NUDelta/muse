var env = require('node-env-file');
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
    scopes: ['bot'],
    studio_token: process.env.studio_token,
    studio_command_uri: process.env.studio_command_uri
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

bot.startRTM((err,bot,payload) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});

controller.startTicking();

// Get information about all users
// Should update storage
var options = {token: process.env.botToken};
let users;
console.log("calling on bot users");
bot.api.users.list(options, (err,res) => {
  if (!err) {
    // console.log(res);
    // console.log("updating users");
    users = res; // TODO: make a promise so this updates
    // console.log(users);
  }
  else {
    console.log(err);
  }
});

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

// Testing with myself
var user_options = options;
user_options.user = "U9SU7T32Q";


// Muse starts conversation with user
// bot.api.im.open(options, (err,res) => {
//   if (err) {
//     console.error(err);
//   }
//   else {
//     bot.startConversation({
//       user: "U9SU7T32Q",
//       channel: res.channel.id,
//     }, (res,convo) => {
//       convo.ask("Hi, when would you like to receive a reminder to reflect?", (res,convo) => {
//         console.log("printing text",res.text);
//         console.log("printing user", res.user);
//       });
//     });
//   }
// });

// controller.hears(["start reflection", "I want to reflect"],
//   ["direct_mention", "mention", "direct_message", "ambient"],
//   (bot,message) => {
//     console.log("printing channel",message.channel);
//     console.log("printing user id",message.user);
//     bot.startConversation({
//       user: message.user,
//       channel: message.channel
//     }, (res,convo) => {
//       convo.ask('What did go over during SIG? Are you currently applying \
// what you went over to your project? What strategies did you talk about?',
//       {
//         pattern: '(.*?)',
//         callback: (res,convo) => {convo.say('Thanks for sharing!');}
//       },
//       {});
//     });
// });
//
// var q2 = (res,convo) => {
//   convo.ask('What are you currently doing well, and what could you do better?', q3, {})
// };
//
// var q3 = (res,convo) => {
//   convo.say('Are you satisfied with your current progress, or do you \
// feel the need to adjust your direction? Explain why, and if you need to make changes, \
// detail what those changes would be.');
// };

controller.hears(["start reflection", "I want to reflect", "reflect"],
  ["direct_mention", "mention", "direct_message", "ambient"],
  (bot,message) => {
    bot.createConversation(message, function(err, convo) {

    // create a path for when a user says YES
    convo.addMessage({
            text: 'You said yes! How wonderful.',
    },'yes_thread');

    // create a path for when a user says NO
    convo.addMessage({
        text: 'You said no, that is too bad.',
    },'no_thread');

    // create a path where neither option was matched
    // this message has an action field, which directs botkit to go back to the `default` thread after sending this message.
    convo.addMessage({
        text: "Thanks for answering! Here's the next question: ",
        action: 'q2',
    },'q1_response');

    // Create a yes/no question in the default thread...
    convo.addQuestion('What did go over during SIG? Are you currently applying \
what you went over to your project? What strategies did you talk about?', [
        {
            pattern: 'yes',
            callback: function(response, convo) {
                convo.gotoThread('yes_thread');
            },
        },
        {
            pattern: 'no',
            callback: function(response, convo) {
                convo.gotoThread('no_thread');
            },
        },
        {
          default: true,
          callback: (res, convo) => {
            convo.gotoThread('q1_response');
          }
        }
    ],{},'default');

    convo.addQuestion('What are you currently doing well, and what could you do better?', [
      {
        default: true,
        callback: (res,convo) => {
          convo.gotoThread('bad_response');
        }
      }
    ], {}, 'q2');




    convo.activate();
});
  }
);

controller.hears(
  ['hello', 'hi', 'greetings'], [
    'direct_mention', 'mention', 'direct_message', 'ambient'],
    function (bot, message) {
    bot.reply(message, 'Hello!');
  }
);

controller.hears('help pls', 'direct_message', function(bot, message) {
    bot.reply(message, 'I can help you!');
    console.log(`Message from ${message.user}: ${message.text}`);

});

function usage_tip() {
    console.log('~~~~~~~~~~');
    console.log('Botkit Starter Kit');
    console.log('Execute your bot application like this:');
    console.log('clientId=<MY SLACK CLIENT ID> clientSecret=<MY CLIENT SECRET> PORT=3000 node bot.js');
    console.log('Get Slack app credentials here: https://api.slack.com/apps')
    console.log('~~~~~~~~~~');
}
