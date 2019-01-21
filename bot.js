/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.

# RUN THE BOT:

  Create a new app via the Slack Developer site:

    -> http://api.slack.com

  Run your bot from the command line:

    clientId=<MY SLACK TOKEN> clientSecret=<my client secret> PORT=<3000> node bot.js

# USE THE BOT:

    Navigate to the built-in login page:

    https://<myhost.com>/login

    This will authenticate you with Slack.

    If successful, your bot will come online and greet you.


# EXTEND THE BOT:

  Botkit has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
var env = require('node-env-file');
env(__dirname + '/.env');


if (!process.env.clientId || !process.env.clientSecret || !process.env.PORT) {
  usage_tip();
  // process.exit(1);
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
    console.log("updating users");
    users = res; // TODO: make a promise so this updates
    // console.log(users);
  }
  else {
    console.log(err);
  }
});

setTimeout(function afterTwoSeconds() {
  console.log(users)
}, 2000)

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

  // This captures and evaluates any message sent to the bot as a DM
  // or sent to the bot in the form "@bot message" and passes it to
  // Botkit CMS to evaluate for trigger words and patterns.
  // If a trigger is matched, the conversation will automatically fire!
  // You can tie into the execution of the script using the functions
  // controller.studio.before, controller.studio.after and controller.studio.validate
  // if (process.env.studio_token) {
  //     controller.on('direct_message,direct_mention,mention', function(bot, message) {
  //         controller.studio.runTrigger(bot, message.text, message.user, message.channel, message).then(function(convo) {
  //             if (!convo) {
  //                 // no trigger was matched
  //                 // If you want your bot to respond to every message,
  //                 // define a 'fallback' script in Botkit CMS
  //                 // and uncomment the line below.
  //                 // controller.studio.run(bot, 'fallback', message.user, message.channel);
  //             } else {
  //                 // set variables here that are needed for EVERY script
  //                 // use controller.studio.before('script') to set variables specific to a script
  //                 convo.setVar('current_time', new Date());
  //             }
  //         }).catch(function(err) {
  //             bot.reply(message, 'I experienced an error with a request to Botkit CMS: ' + err);
  //             debug('Botkit CMS: ', err);
  //         });
  //     });
  // } else {
  //     console.log('~~~~~~~~~~');
  //     console.log('NOTE: Botkit CMS functionality has not been enabled');
  //     console.log('Learn mode https://github.com/howdyai/botkit-cms');
  // }
}

controller.hears( // TODO: Get muse to reply in any channel
  ['hello', 'hi', 'greetings'], [
    'direct_mention', 'mention', 'direct_message'],
    function (bot, message) {
    bot.reply(message, 'Hello!');
  }
);

controller.hears('help pls', 'direct_message', function(bot, message) {
    bot.reply(message, 'I can help you!');
    console.log(`Message from ${message.user}: ${message.text}`);

});

// controller.hears('something', function(bot, message) {
//
//     var ids = message.callback_id.split(/\-/);
//     var user_id = ids[0];
//     var item_id = ids[1];
//
//     controller.storage.users.get(user_id, function(err, user) {
//
//         if (!user) {
//             user = {
//                 id: user_id,
//                 list: []
//             }
//         }
//
//         for (var x = 0; x < user.list.length; x++) {
//             if (user.list[x].id == item_id) {
//                 if (message.actions[0].value=='flag') {
//                     user.list[x].flagged = !user.list[x].flagged;
//                 }
//                 if (message.actions[0].value=='delete') {
//                     user.list.splice(x,1);
//                 }
//             }
//         }
//
//
//         var reply = {
//             text: 'Here is <@' + user_id + '>s list:',
//             attachments: [],
//         }
//
//         for (var x = 0; x < user.list.length; x++) {
//             reply.attachments.push({
//                 title: user.list[x].text + (user.list[x].flagged? ' *FLAGGED*' : ''),
//                 callback_id: user_id + '-' + user.list[x].id,
//                 attachment_type: 'default',
//                 actions: [
//                     {
//                         "name":"flag",
//                         "text": ":waving_black_flag: Flag",
//                         "value": "flag",
//                         "type": "button",
//                     },
//                     {
//                        "text": "Delete",
//                         "name": "delete",
//                         "value": "delete",
//                         "style": "danger",
//                         "type": "button",
//                         "confirm": {
//                           "title": "Are you sure?",
//                           "text": "This will do something!",
//                           "ok_text": "Yes",
//                           "dismiss_text": "No"
//                         }
//                     }
//                 ]
//             })
//         }
//
//         bot.replyInteractive(message, reply);
//         controller.storage.users.save(user);
//
//
//     });
//
// });
//
// controller.hears(['list','tasks'],'direct_mention,direct_message',function(bot,message) {
//
//     controller.storage.users.get(message.user, function(err, user) {
//
//         if (!user) {
//             user = {
//                 id: message.user,
//                 list: []
//             }
//         }
//
//         if (!user.list || !user.list.length) {
//             user.list = [
//                 {
//                     'id': 1,
//                     'text': 'Test Item 1'
//                 },
//                 {
//                     'id': 2,
//                     'text': 'Test Item 2'
//                 },
//                 {
//                     'id': 3,
//                     'text': 'Test Item 3'
//                 }
//             ]
//         }
//
//         var reply = {
//             text: 'Here is your list. Say `add <item>` to add items.',
//             attachments: [],
//         }
//
//         for (var x = 0; x < user.list.length; x++) {
//             reply.attachments.push({
//                 title: user.list[x].text + (user.list[x].flagged? ' *FLAGGED*' : ''),
//                 callback_id: message.user + '-' + user.list[x].id,
//                 attachment_type: 'default',
//                 actions: [
//                     {
//                         "name":"flag",
//                         "text": ":waving_black_flag: Flag",
//                         "value": "flag",
//                         "type": "button",
//                     },
//                     {
//                        "text": "Delete",
//                         "name": "delete",
//                         "value": "delete",
//                         "style": "danger",
//                         "type": "button",
//                         "confirm": {
//                           "title": "Are you sure?",
//                           "text": "This will do something!",
//                           "ok_text": "Yes",
//                           "dismiss_text": "No"
//                         }
//                     }
//                 ]
//             })
//         }
//
//         bot.reply(message, reply);
//
//         controller.storage.users.save(user);
//
//     });
//
// });

controller.hears('interactive', 'direct_message', function(bot, message) {

    bot.reply(message, {
        attachments:[
            {
                title: 'Do you want to interact with my buttons?',
                callback_id: user_id + '-' + user.list[x].id,
                attachment_type: 'default',
                actions: [
                    {
                        "name":"yes",
                        "text": "Yes",
                        "value": "yes",
                        "type": "button",
                    },
                    {
                        "name":"no",
                        "text": "No",
                        "value": "no",
                        "type": "button",
                    }
                ]
            }
        ]
    });
});

// controller.hears('list all users', (bot, message) => {
//   bot.api.users.list({}, (err, response) => {
//     if (err) {
//       console.error(err);
//     }
//     console.log(response);
//     bot.reply(message, response);
//   });
// });

// controller.hears('list all channels', (bot, message) => {
//   bot.api.channels.list({
//     token: process.env.TOKEN,
//     limit: 20
//   },function(err,response) {
//     if (err) {
//       console.error(err);
//     }
//     console.log(response);
//   })
// })


// controller.storage.teams.all(function(err,teams) {
//
//   console.log("entering teams function");
//
//   if (err) {
//     throw new Error(err);
//   }
//
//   // print each team
//   for (var t  in teams) {
//     console.log(t);
//   }
//
// });

// controller.hears(['add (.*)'],'direct_mention,direct_message',function(bot,message) {
//
//     controller.storage.users.get(message.user, function(err, user) {
//
//         if (!user) {
//             user = {
//                 id: message.user,
//                 list: []
//             }
//         }
//
//         user.list.push({
//             id: message.ts,
//             text: message.match[1],
//         });
//
//         bot.reply(message,'Added to list. Say `list` to view or manage list.');
//
//         controller.storage.users.save(user);
//
//     });
// });

function usage_tip() {
    console.log('~~~~~~~~~~');
    console.log('Botkit Starter Kit');
    console.log('Execute your bot application like this:');
    console.log('clientId=<MY SLACK CLIENT ID> clientSecret=<MY CLIENT SECRET> PORT=3000 node bot.js');
    console.log('Get Slack app credentials here: https://api.slack.com/apps')
    console.log('~~~~~~~~~~');
}
