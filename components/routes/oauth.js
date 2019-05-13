var debug = require('debug')('botkit:oauth');
// var env = require('node-env-file'); // Needed for local build, comment out for Heroku
var request = require('request');

// env(path.join(__dirname, '../../', '.env'));
// if (!process.env.clientId || !process.env.clientSecret || !process.env.PORT) {
//   usage_tip();
// }

module.exports = function(webserver, controller) {
    var handler = {
        login: function(req, res) {
            var slackApi="https://slack.com/oauth/authorize?&client_id="+process.env.clientId+"&scope=users:read&team="+process.env.teamId;
            res.redirect(slackApi);
        },
        oauth: function(req, res) {
            var code = req.query.code;
            var state = req.query.state;

            // we need to use the Slack API, so spawn a generic bot with no token
            var slackapi = controller.spawn({});

            var opts = {
                client_id: process.env.clientId,
                client_secret: process.env.clientSecret,
                clientSigningSecret: process.env.clientSigningSecret,
                code: req.query.code
            };

            slackapi.api.oauth.access(opts, function(err, auth) {

                if (err) {
                    console.error(err);
                    debug('Error confirming oauth', err);
                    return res.redirect('/login_error.html');
                }
                // what scopes did we get approved for?
                var scopes = auth.scope.split(/\,/);

                // use the token we got from the oauth
                // to call auth.test to make sure the token is valid
                // but also so that we reliably have the team_id field!
                slackapi.api.auth.test({token: auth.access_token}, function(err, identity) {

                    if (err) {
                        debug('Error fetching user identity', err);
                        return res.redirect('/login_error.html');
                    }

                    // Now we've got all we need to connect to this user's team
                    // spin up a bot instance, and start being useful!
                    // We just need to make sure this information is stored somewhere
                    // and handled with care!

                    // In order to do this in the most flexible way, we fire
                    // a botkit event here with the payload so it can be handled
                    // by the developer without meddling with the actual oauth route.

                    auth.identity = identity;
                    controller.trigger('oauth:success', [auth]);

                    res.cookie('team_id', auth.team_id);
                    res.cookie('user_id', auth.user_id);

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
                      const help_strategies = ['seek help from other students', 'seek help from mentors', 'make efficient use of others\' time', 'helping others'];
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
                            counts[obj[key]] += 1; // TODO: Specify sprint of timestamp
                            categories.push({response: obj[key].toLowerCase(), time: obj.time, story: obj.story.toLowerCase()});
                            strategy_counts[obj[key]][obj.strategy] += 1;
                          }
                          if (key === 'strategy') {
                            specific_strategies.push({response: obj[key].toLowerCase(), time: obj.time, story: obj.story.toLowerCase()});
                          }
                        });
                      });
                      return [counts, categories, specific_strategies, strategy_counts];
                    }

                    function renderHome(data) {
                      data = data.sort((a,b) => {
                        a = new Date(a.time);
                        b = new Date(b.time);
                        return a>b ? -1 : a<b ? 1 : 0;
                      })
                      data = data.map(obj => {
                        // const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                        // var pm = false;
                        // var time = new Date(obj.time);
                        // var hours = time.getHours();
                        // var min = time.getMinutes();
                        // if (hours > 11) {
                        //   hours = hours - 12;
                        //   pm = true;
                        // }
                        // if (hours == 0) hours = 12;
                        // if (min < 10) min = '0' + min;
                        // var newTime = months[time.getMonth()] + ' ' + time.getDate() + ', ' + time.getFullYear() + ' ' + hours + ':' + min + (pm ? 'pm' : 'am');
                        // obj.time = newTime;
                        // return obj;
                        obj.time = new Date(obj.time).toLocaleString();
                        return obj;
                      });
                      var user = data[0].userRealName.split(' ')[0];
                      var strategies = getStrategies(data);

                      return res.render('home', {
                        data: data,
                        user: user,
                        strategy_category_counts: JSON.stringify(strategies[0]),
                        strategy_counts: JSON.stringify(strategies[3]),
                        layout: '../views/layouts/default'
                      });
                    }

                    try {
                      var data = getUserData(auth.user_id).then((data) => {
                        if (typeof data === 'undefined') {
                          return res.redirect('/login_error.html');
                        }
                        if (data.length === 0) {
                          return res.redirect('no_data.html');
                        }
                        // if there are no reflections re-route to a no reflections static page
                        renderHome(data); // Get a list of reflections
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
            });
        }
    }


    // Create a /login link
    // This link will send user's off to Slack to authorize the app
    // See: https://github.com/howdyai/botkit/blob/master/readme-slack.md#custom-auth-flows
    debug('Configured /login url');
    webserver.get('/login', handler.login);

    // Create a /oauth link
    // This is the link that receives the postback from Slack's oauth system
    // So in Slack's config, under oauth redirect urls,
    // your value should be https://<my custom domain or IP>/oauth
    debug('Configured /oauth url');
    webserver.get('/auth', handler.oauth);

    return handler;
}
