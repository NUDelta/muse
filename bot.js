// var env = require('node-env-file'); // Needed for local build, comment out for Heroku
var monk = require('monk');

// env(__dirname + '/.env');
// if (!process.env.clientId || !process.env.clientSecret || !process.env.PORT) {
//   usage_tip();
// }

var Botkit = require('botkit');
var debug = require('debug')('botkit:main');

var bot_options = {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    clientSigningSecret: process.env.clientSigningSecret,
    debug: true,
    scopes: ['bot']
};

// Use a mongo database if specified, otherwise store in a JSON file local to the app.
// Mongo is automatically configured when deploying to Heroku
function getStorage(db, zone) {
    var table = db.get(zone);

    return {
      get: function(id, cb) {
        return table.find({id: id}, cb);
      },
      getOne: function(id, cb) {
        return table.find({id: id}, cb);
      },
      save: function(data, cb) {
        return table.insert(data, cb);
      },
      delete: function(id, cb) {
        return table.delete(id, cb);
      },
      all: function(cb) {
        return table.all(objectsToList(cb));
      }
    }
}

if (process.env.MONGO_URI) {
    var db = monk(process.env.MONGO_URI);
    db.catch((err) => {
      throw new Error(err);
    });
    var storage = {};
    var tables = ["users", "sprints", "tasks", "teams", "channels"]
    tables.forEach((zone) => {
      storage[zone] = getStorage(db, zone);
    })
    bot_options.storage = storage;
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

var options = {token: process.env.botToken};
bot.api.team.info(options, (err,res) => {
  if (err) {
    console.error(err);
  }
  else {
    controller.storage.teams.save(res.team);
  }
});

bot.identity = {
  id: process.env.botId,
  name: process.env.botName
}

// Set up an Express-powered webserver to expose oauth and webhook endpoints
var server = require(__dirname + '/components/express_webserver.js')(controller);
var webserver = server[0];
// Enable interactive buttons
var slackInteractions = server[1];
slackInteractions.action('interactive_convo', (payload,respond) => {
  // `payload` is an object that describes the interaction
  console.log(`The user ${payload.user.name} in team ${payload.team.domain} pressed a button`);

  //actions: [ { name: 'no', type: 'button', value: 'no' } ]
  //payload.actions[0].name
  console.log(payload);
  const reply = payload.original_message;
  delete reply.attachments[0].actions;
  return reply;
});

async function getUserData(userId,res) {
  return res = await controller.storage.users.get(userId, (err, user_data) => {
    return [user_data,res];
  });
}

function getStrategies(data) {
  const strategies = ['sprint planning and execution','documenting process/progress','communication','help seeking and giving','grit and growth'];
  const planning_strategies = ['goal setting', 'prioritization', 'updating sprint plan', 'respecting time constraints'];
  const doc_strategies = ['updating canvases', 'updating design log'];
  const comm_strategies = ['reporting progress', 'availability'];
  const help_strategies = ['seek help from other students', 'seek help from mentors', "make efficient use of others' time", 'helping others'];
  const growth_strategies = ['identifying where to go next', 'will to achieve goals', 'avoiding distractions', 'embracing challenges', 'stepping out of my comfort zone'];
  const category_matrix = [planning_strategies, doc_strategies, comm_strategies, help_strategies, growth_strategies];

  var round1 = data.filter(obj => obj.round == 1);
  var counts = {}; // counts for strategy categories
  var strategy_counts = {}; // nested dictionary of strategy categories and specific strategies
  for (var i=0; i<strategies.length; i++) {
    counts[strategies[i]] = 0;
    strategy_counts[strategies[i]] = {};
    var curr_strat = category_matrix[i];
    for (var j=0; j<curr_strat.length; j++) {
      let curr = curr_strat[j];
      strategy_counts[strategies[i]][curr] = 0;
    }
  }

  var categories = [];
  var specific_strategies = [];
  var responses = round1.map(obj => {
    Object.keys(obj).forEach((key,index) => {
      if (key === 'strategy_category') {
        let res = obj[key];
        res = res.toLowerCase();
        counts[res] += 1; // TODO: Specify sprint of timestamp
        categories.push({response: res, time: obj.time, story: obj.story.toLowerCase()});
        strategy_counts[res][obj.strategy.toLowerCase()] += 1;
      }
      if (key === 'strategy') {
        let res = obj[key];
        res = res.toLowerCase();
        specific_strategies.push({response: res, time: obj.time, story: obj.story.toLowerCase()});
      }
    });
  });
  return [counts, categories, specific_strategies, strategy_counts];
}

function renderHome(data,res) {
  data = data.sort((a,b) => {
    a = new Date(a.time);
    b = new Date(b.time);
    return a>b ? -1 : a<b ? 1 : 0;
  })
  var user = data[0].userRealName.split(' ')[0];
  var strategies = getStrategies(data);

  return res.render('home', {
    data: data,
    user: user,
    strategy_category_counts: JSON.stringify(strategies[0]),
    strategy_counts: JSON.stringify(strategies[3]),
    layout: 'layouts/default'
  });
}

webserver.get('/', function(req, res){
  var user_id = req.universalCookies.get('user_id');
  if (typeof user_id == 'undefined') {
    res.render('index', { // TODO: Write to Mongo
      domain: req.get('host'),
      protocol: req.protocol,
      glitch_domain:  process.env.PROJECT_DOMAIN,
      layout: 'layouts/default'
    });
  }
  else {
    res.cookie = user_id; // Set local cookie as well
    try {
      var data = getUserData(user_id).then((data) => {
        if (typeof data === 'undefined') {
          return res.redirect('/login_error.html');
        }
        if (data.length === 0) {
          return res.redirect('no_data.html');
        }
        // if there are no reflections re-route to a no reflections static page
        renderHome(data,res); // Get a list of reflections
      }).catch((err) => {
        console.error(err);
        return res.redirect('/login_error.html');
      });
    }
    catch (err) {
      console.error(err);
      return res.redirect('/login_error.html');
    }
  }

});

webserver.get('/home', function(req,res) {
  var user_id = req.universalCookies.get('user_id');
  try {
    var data = getUserData(user_id).then((data) => {
      if (typeof data === 'undefined') {
        return res.redirect('/login_error.html');
      }
      if (data.length === 0) {
        return res.redirect('no_data.html');
      }
      // if there are no reflections re-route to a no reflections static page
      renderHome(data,res); // Get a list of reflections
    }).catch((err) => {
      console.error(err);
      return res.redirect('/login_error.html');
    });
  }
  catch (err) {
    console.error(err);
    return res.redirect('/login_error.html');
  }
});

  // Set up a simple storage backend for keeping a record of customers
  // who sign up for the app via the oauth
  require(__dirname + '/components/user_registration.js')(controller);

  // Send an onboarding message when a new team joins
  require(__dirname + '/components/onboarding.js')(controller);

  // Load in some helpers that make running Botkit on Glitch.com better
  require(__dirname + '/components/plugin_glitch.js')(controller);

  var normalizedPath = require("path").join(__dirname, "skills");
  require("fs").readdirSync(normalizedPath).forEach(function(file) {
    if (!file.includes("reflection_round")) {
      console.log(file);
      require("./skills/" + file)(controller);
    }
    else {
      require("./skills/" + file)(controller, slackInteractions);
    }
  });

controller.hears(
  ['hello', 'hi', 'greetings', 'reflection commands', 'list commands'], [
    'direct_mention', 'mention', 'direct_message', 'ambient'],
    function (bot, message) {
    bot.reply(message, "Hello! I'm Muse, your friendly reflection bot! If you'd like to reflect with me, you can use the following commands:");
    var begin = function() {bot.reply(message, "*beginning of work session*:    `start reflection`, `reflection round 1`");}
    var end = function() {bot.reply(message, "*end of work session*:               `finish reflection`, `reflection round 2`");}
    var check = function() {bot.reply(message, "*look at dashboard*:                  `dashboard check` to reflect while looking at https://muse-delta.herokuapp.com");}
    var commands = function() {bot.reply(message, "*review commands*:                  `list commands`");}
    var strategy_guide = function() {bot.reply(message, "*view strategy guide*:               `strategy guide`");}
    var remind = function() {bot.reply(message, "*reflection reminder*:                `schedule reminder`")};
    setTimeout(begin, 100);
    setTimeout(end, 200);
    setTimeout(check, 300);
    setTimeout(commands, 400);
    setTimeout(strategy_guide, 500);
    setTimeout(remind, 600);
  }
);

controller.hears(['strategy guide'], ['direct_mention', 'mention', 'direct_message', 'ambient'],
    function (bot, message) {
      bot.reply(message, "You can view the strategy guide here https://docs.google.com/document/d/17667YjZhLv_MNkiJRBfLXM5LH95dfzbtZN-VSPykJyc/edit?usp=sharing");
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
