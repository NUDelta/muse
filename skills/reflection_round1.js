module.exports = function(controller,slackInteractions) {
  controller.hears(["start reflection(.*)", "I want to reflect(.*)", "reflection round 1", "reflection 1", "reflection round one", "begin reflection", "I want to reflect!"], // Make regex to match all similar strings
    ["direct_mention", "mention", "direct_message", "ambient"],
    (bot,message) => {
      var checkPrevReflections = async function(message) {
        let res = await controller.storage.users.get(message.user, (err, user_data) => {
          if (err) {
            throw new Error("Request for reflection history could not be made.");
          }
          return user_data;
        });
        if (!Array.isArray(res)) {
          res = [res];
        }
        return res;
      }

      function strategyCategories(convo) {

      }

      bot.createConversation(message,(err,convo) => {
        var strategy_category, learning_strategy, story, strategy_recommendation, rec_followed;
        slackInteractions.action('strategy_categories', (payload,respond) => {
          var reply = payload.actions[0].name;
          strategy_category = reply;
          var options = {
            token: process.env.botToken,
            as_user: payload.user.name,
            channel: payload.channel.id,
            // text: reply
            text: "You have chosen `" + reply + "`. If that is correct, reply `" + reply + "` to this message if you do not receive the next question automatically."
          }
          bot.api.chat.postMessage(options, (err,res) => {
            if (err) console.error(err);
          });
          console.log("should enter switch case");
          switch(reply) {
            case "sprint planning and execution":
              convo.gotoThread('sprints');
              break;
            case "documenting process/progress":
              convo.gotoThread('docs');
              break;
            case "communication":
              convo.gotoThread("communication");
              break;
            case "help seeking and giving":
              convo.gotoThread("help");
              break;
            case "grit and growth":
              convo.gotoThread("growth");
              break;
          }
        });

        slackInteractions.action('learning_strategies', (payload,respond) => {
          var reply = payload.actions[0].name;
          learning_strategy = reply;
          if (typeof strategy_recommendation !== "undefined") {
            if (learning_strategy === strategy_recommendation) {
              rec_followed = true;
            }
            else {
              rec_followed = false;
            }
          }
          var options = {
            token: process.env.botToken,
            as_user: payload.user.name,
            channel: payload.channel.id,
            // text: reply
            text: "You have chosen `" + reply + "`. If that is correct, reply `" + reply + "` to this message if you do not receive the next question automatically."
          }
          bot.api.chat.postMessage(options, (err,res) => {
            if (err) console.error(err);
          });
          if (typeof rec_followed !== "undefined") {
            if (rec_followed === false) {
              rec_ignored_reason(strategy_recommendation);
            }
          }
          else {
            convo.gotoThread('q3');
          }
        });

        slackInteractions.action('stories', (payload,respond) => {
          var reply = payload.actions[0].selected_options[0].value;
          story = reply;
          var options = {
            token: process.env.botToken,
            as_user: payload.user.name,
            channel: payload.channel.id,
            // text: reply
            text: "You have chosen `" + reply + "`. If that is correct, reply `" + reply + "` to this message if you do not receive the next question automatically."
          }
          bot.api.chat.postMessage(options, (err,res) => {
            if (err) console.error(err);
          });
          convo.gotoThread('story_reason');
        });

        if (!err) {
          convo.activate();
          var startTime = new Date();
          convo.setTimeout(10800000); // convo expires after 3 hours

          var followUp = () => {
            if (convo.status != 'completed') {
              currTime = new Date();
              if (currTime.getTime() >= (startTime.getTime()+30*60000)) { // Ask every 30 min
                bot.reply(message,"Are you still there? Please answer the previous reflection question!");
                convo.silentRepeat();
                startTime = currTime;
              }
            }
          }
          setInterval(followUp,30*60000); // Not 30 min for some reason

          convo.ask("Are you currently working on your DTR project?",
          (res,convo) => {
            if (res.text.toLowerCase().includes("no")) {
              convo.say("Okay, let's reschedule your reflection.");
              convo.gotoThread("reschedule");
            }
            else {
              convo.next();
            }
          }, {'key': 'in_action'});

          convo.ask("What blocker are you currently struggling with? What did you go over during SIG to overcome this blocker?",
          (res,convo) => {
            convo.next();
          }, {'key': 'blocker'});

          convo.ask({
              attachments:[
                  {
                      title: 'Choose the item that corresponds best to the sprint story you are currently working on.',
                      callback_id: 'stories',
                      attachment_type: 'default',
                      actions: [
                        {
                            "name": "stories",
                            "text": "Pick a story...",
                            "type": "select",
                            "options": [
                                {
                                    "text": "design arguments",
                                    "value": "design arguments"
                                },
                                {
                                    "text": "practical canvas",
                                    "value": "practical canvas"
                                },
                                {
                                    "text": "research canvas",
                                    "value": "research canvas"
                                },
                                {
                                    "text": "interface arguments/models",
                                    "value": "interface arguments/models"
                                },
                                {
                                    "text": "system arguments/models",
                                    "value": "system arguments/models"
                                },
                                {
                                    "text": "practical contributions",
                                    "value": "practical contributions"
                                },
                                {
                                    "text": "conceptual contributions",
                                    "value": "conceptual contributions"
                                },
                                {
                                    "text": "approach tree",
                                    "value": "approach tree"
                                },
                                {
                                    "text": "study design",
                                    "value": "study design"
                                },
                                {
                                    "text": "paper writing",
                                    "value": "paper writing"
                                },
                                {
                                    "text": "URG writing",
                                    "value": "URG writing"
                                },
                                {
                                    "text": "presenting findings (poster, talk)",
                                    "value": "presenting findings (poster, talk)"
                                },
                                {
                                    "text": "user testing/takeaways from user testing",
                                    "value": "user testing/takeaways from user testing"
                                },
                                {
                                    "text": "needfinding",
                                    "value": "needfinding"
                                },
                                {
                                    "text": "user journey maps",
                                    "value": "user journey maps"
                                },
                                {
                                    "text": "building tech",
                                    "value": "building tech"
                                },
                                {
                                    "text": "reading/looking for literature",
                                    "value": "reading/looking for literature"
                                },
                                {
                                    "text": "storyboarding",
                                    "value": "storyboarding"
                                },
                                {
                                    "text": "prototyping",
                                    "value": "prototyping"
                                },
                                {
                                    "text": "other",
                                    "value": "other"
                                }
                            ]
                        }
                      ]
                  }
              ]
          }, (res,convo) => {
            convo.gotoThread('story_reason');
          }, {'key': 'story'});

          convo.addQuestion("How will the story that you are currently working on help you overcome this blocker? How do you intend to make progress on this story during this current work session?",
          (res,convo) => {
            try {
              console.log("checking previous reflections");
              checkPrevReflections(message).then((pastReflections) => {
                if (pastReflections.length > 0) { // Check if reflection history exists
                  var round1_docs = pastReflections.filter((o) => {return o.round == 1;});
                  if (round1_docs.length > 0) {
                    var stories = round1_docs.filter((o) => {
                      if (o.story === story) {
                      }
                      return o.story === story;
                    });
                    var story_strategies = {};
                    for (var i = 0; i < stories.length; i++) {
                      var key = stories[i].strategy;
                      if (key in story_strategies) {
                        story_strategies[key] += 1;
                      }
                      else {
                        story_strategies[key] = 1;
                      }
                    }
                    if (Object.keys(story_strategies).length > 0) {
                      var most_common = Object.keys(story_strategies).reduce((a,b) => story_strategies[a] > story_strategies[b] ? a : b);
                      if (typeof most_common !== "undefined") {
                        strategy_recommendation = most_common;
                        bot.reply(message, "In the past, working on `" + most_common + "` has helped you with the story you selected above. Maybe try this strategy again?");
                      }
                    }
                  }
                }
                convo.gotoThread('strategy_categories');
              });
            }
            catch(err) {
              console.error(err);
              convo.gotoThread('strategy_categories');
            }
          }, {'key': 'story_reason'},'story_reason');

          function rec_ignored_reason(strategy_recommendation) {
            convo.addQuestion("Earlier I recommended that `"+strategy_recommendation+"` may help you. Why did you choose a different strategy? Your response to this question can help me make better recommendations in the future.",
            (res,convo) => {
              convo.gotoThread('q3');
            }, {'key': 'rec_ignored_reason'},'rec_ignored');
            convo.gotoThread('rec_ignored');
          }

          convo.addQuestion({
            attachments: [
              {
                title: "Select the learning strategy category that will help you overcome your blocker for this sprint. Recall what you went over with your mentors during SIG to choose.",
                callback_id: "strategy_categories",
                attachment_type: 'default',
                actions: [
                  {
                    "name": "sprint planning and execution",
                    "text": "sprint planning and execution",
                    "value": "sprint planning and execution",
                    "type": "button",
                  },
                  {
                    "name": "documenting process/progress",
                    "text": "documenting process/progress",
                    "value": "documenting process/progress",
                    "type": "button",
                  },
                  {
                    "name": "communication",
                    "text": "communication",
                    "value": "communication",
                    "type": "button",
                  },
                  {
                    "name": "help seeking and giving",
                    "text": "help seeking and giving",
                    "value": "help seeking and giving",
                    "type": "button",
                  },
                  {
                    "name": "grit and growth",
                    "text": "grit and growth",
                    "value": "grit and growth",
                    "type": "button",
                  }
                ]
              }
            ]
          }, [
            {
              pattern: "sprint planning and execution",
              callback: function(reply, convo) {
                convo.gotoThread('sprints');
              }
            },
            {
              pattern: "documenting process/progress",
              callback: function(reply, convo) {
                convo.gotoThread('docs');
              }
            },
            {
              pattern: "communication",
              callback: function(reply, convo) {
                convo.gotoThread('communication');
              }
            },
            {
              pattern: "help seeking and giving",
              callback: function(reply, convo) {
                convo.gotoThread('help');
              }
            },
            {
              pattern: "grit and growth",
              callback: function(reply, convo) {
                convo.gotoThread('growth');
              }
            }
          ], {'key': 'strategy_category'},'strategy_categories');

          convo.addQuestion({
            attachments:[
              {
                title: 'Out of the strategies below, which would you like to work towards improving?\n \
1. I will think carefully about the goals for the next sprint and will write down stories and tasks that best promote progress-making on my project.\n\
2. I will prioritize working on high-valued stories over lower-valued stories to ensure that I achieve significant deliverables by the end of each sprint.\n\
3. I will update my sprint plan throughout a sprint to record progress/hours and will make edits to my plan as necessary, and not just last minute before a SIG meeting.\n\
4. I will respect the points/time constraints inherent \
in each sprint and will not "overcrank" to attempt to get things done and instead will log my progress and just backlog incomplete stories and tasks.',
                callback_id: 'learning_strategies',
                attachment_type: 'default',
                actions: [
                  {
                    "name": "goal setting",
                    "text": "1",
                    "value": "goal setting",
                    "type": "button",
                  },
                  {
                    "name": "prioritization",
                    "text": "2",
                    "value": "prioritization",
                    "type": "button",
                  },
                  {
                    "name": "updating sprint plan",
                    "text": "3",
                    "value": "updating sprint plan",
                    "type": "button",
                  },
                  {
                    "name": "respecting time constraints",
                    "text": '4',
                    "value": "respecting time constraints",
                    "type": "button",
                  }
                ]
              }
            ]},function(response,convo) {
              if (typeof rec_followed !== "undefined") {
                if (rec_followed === false) {
                  rec_ignored_reason(strategy_recommendation);
                }
              }
              else {
                convo.gotoThread('q3');
              }
          },{'key': 'strategy'},'sprints');

          convo.addQuestion({
            attachments: [
              {
                title: "Choose a category you would like to focus on for this week. Which strategy out of the category below would you like to work towards improving?\n\
1. I will actively update my canvases to reflect my work and understanding about my research.\n\
2. I will update our design log so that it is readable and that it has quick links to key parts of our work this quarter.",
                callback_id: "learning_strategies",
                attachment_type: 'default',
                actions: [
                  {
                    "name": "updating canvases",
                    "text": "1",
                    "value": "updating canvases",
                    "type": "button",
                  },
                  {
                    "name": "updating design log",
                    "text": "2",
                    "value": "updating design log",
                    "type": "button",
                  }
                ]
              }
            ]
          },function(response,convo) {
            if (typeof rec_followed !== "undefined") {
              if (rec_followed === false) {
                rec_ignored_reason(strategy_recommendation);
              }
            }
            else {
              convo.gotoThread('q3');
            }
          },{'key': 'strategy'},'docs');

          convo.addQuestion({
            attachments: [
              {
                title: "Choose a category you would like to focus on for this week. Which strategy out of the category below would you like to work towards improving?\n\
1. I will openly report my progress to promote understanding of my progress and blockers.\n\
2. I will make myself available to my teammates outside of class time, and will actively contribute to collaborating on our project.",
                callback_id: "learning_strategies",
                attachment_type: 'default',
                actions: [
                  {
                    "name": "reporting progress",
                    "text": "1",
                    "value": "reporting progress",
                    "type": "button",
                  },
                  {
                    "name": "availability",
                    "text": "2",
                    "value": "availability",
                    "type": "button",
                  }
                ]
              }
            ]
          },function(response,convo) {
            if (typeof rec_followed !== "undefined") {
              if (rec_followed === false) {
                rec_ignored_reason(strategy_recommendation);
              }
            }
            else {
              convo.gotoThread('q3');
            }
          },{'key': 'strategy'},'communication');

          convo.addQuestion({
            attachments: [
              {
                title: "Choose a category you would like to focus on for this week. Which strategy out of the category below would you like to work towards improving?\n\
1. When I encounter blockers, I will actively seek out help from other students in DTR over chat or in-person, before I invest too much of my sprint in a blocker.\n\
2. When I encounter blockers, I will actively seek out help from my mentors in DTR over chat or in-person, before I invest too much of my sprint in a blocker.\n\
3. I will attempt to make efficient use of the time of people who help me (e.g. by doing what I can to prepare, or putting in some effort to resolve the problem).\n\
4. I will make time to help others in DTR (who are not on my project) outside of class time.",
                callback_id: "learning_strategies",
                attachment_type: 'default',
                actions: [
                  {
                    "name": "seek help from other students",
                    "text": "1",
                    "value": "seek help from other students",
                    "type": "button",
                  },
                  {
                    "name": "seek help from mentors",
                    "text": "2",
                    "value": "seek help from mentors",
                    "type": "button",
                  },
                  {
                    "name": "make efficient use of others' time",
                    "text": "3",
                    "value": "make efficient use of others' time",
                    "type": "button",
                  },
                  {
                    "name": "helping others",
                    "text": "4",
                    "value": "helping others",
                    "type": "button",
                  }
                ]
              }
            ]
          },function(response,convo) {
            if (typeof rec_followed !== "undefined") {
              if (rec_followed === false) {
                rec_ignored_reason(strategy_recommendation);
              }
            }
            else {
              convo.gotoThread('q3');
            }
          },{'key': 'strategy'},'help');

          convo.addQuestion({
            attachments: [
            {
              title: "Choose a category you would like to focus on for this week. Which strategy out of the category below would you like to work towards improving?\n\
    1. I will consistently work to identify where to go next and how to get there.\n\
    2. I will have a strong will to achieve goals identified by me and my mentors.\n\
    3. I will avoid distractions and will focus on the most important tasks at hand.\n\
    4. I will embrace challenges and will view failures and setbacks as learning opportunities.\n\
    5. I will embrace the opportunity to learn and do things that may be out of my comfort zone.",
              callback_id: "learning_strategies",
              attachment_type: 'default',
              actions: [
                  {
                    "name": "identifying where to go next",
                    "text": "1",
                    "value": "identifying where to go next",
                    "type": "button",
                  },
                  {
                    "name": "will to achieve goals",
                    "text": "2",
                    "value": "will to achieve goals",
                    "type": "button",
                  },
                  {
                    "name": "avoiding distractions",
                    "text": "3",
                    "value": "avoiding distractions",
                    "type": "button",
                  },
                  {
                    "name": "embracing challenges",
                    "text": "4",
                    "value": "embracing challenges",
                    "type": "button",
                  },
                  {
                    "name": "stepping out of my comfort zone",
                    "text": "5",
                    "value": "stepping out of my comfort zone",
                    "type": "button",
                  }
              ]
            }
          ]
          },function(response,convo) {
            if (typeof rec_followed !== "undefined") {
              if (rec_followed === false) {
                rec_ignored_reason(strategy_recommendation);
              }
            }
            else {
              convo.gotoThread('q3');
            }
          },{'key': 'strategy'},'growth');

        convo.addQuestion('How will working on this strategy help you accomplish your goals?',function(response,convo) {
          convo.gotoThread('q4');
        },{'key': 'strategy_reason'},'q3');

        convo.addQuestion('Are you satisfied with your current progress, or do you feel \
the need to adjust your direction? Explain why, and if you need to make changes, detail what those changes would be.',
          (res,convo) => {
            convo.gotoThread('askTime');
            convo.say("Thanks for reflecting with me! I've recorded your responses!")
          }, {'key': 'recap'}, 'q4');

        convo.addQuestion("When can I ping you again to complete the second round of reflection questions?",
          (res,convo) => {
            var verifyTime = (res,convo,message) => {
              const yes = ['yes', 'ya', 'sure', 'maybe', 'i think', 'why not', 'yeah', 'yup', 'ok', 'yes!', 'yes.']
              const no = ['no', 'nah', 'nope', 'hell naw', 'no way', 'no!', 'no']
              convo.ask(`Ok, so here's when I'll ping you to reflect: ${res.text} - is that ok?`,(res2,convo) => {
                if (yes.includes(res2.text.toLowerCase())) {
                  console.log("user replied yes");
                  convo.say("Great, I'll send you a reminder then! You have successfully completed your reflection!");

                  bot.api.reminders.add({
                    token: process.env.oAuthToken,
                    text: "Start reflection round 2 with <@muse>! Message `reflection round 2` to get started.",
                    time: res.text,
                    user: message.user
                  }, (err,res) => {
                    if (err) {
                      convo.say("Sorry, I couldn't schedule the reminder. Try setting the time again. You can say, `in 5 min` or `tomorrow at 3pm`.");
                      convo.next();
                      convo.ask("When can I ping you again to complete the second round of reflection questions?",
                      (res3,convo) => {
                        convo.next();
                        verifyTime(res3,convo,message);
                      });
                    }
                  });
                  convo.next();
                }
                else if (no.includes(res2.text.toLowerCase())) {
                  console.log("user replied no");
                  convo.next();
                  convo.ask("When can I ping you again to complete the second round of reflection questions?",
                  (res3,convo) => {
                    convo.next();
                    verifyTime(res3,convo,message);
                  });
                }
                else {
                  convo.say("Sorry, I didn't understand that.");
                  convo.next();
                  convo.ask("When can I ping you again to complete the second round of reflection questions?",
                  (res3,convo) => {
                    convo.next();
                    verifyTime(res3,convo,message);
                  });
                }
              }, {});
            }

            verifyTime(res,convo,message);
            convo.next();
          }, {'key': 'next_time'}, 'askTime');

        convo.addQuestion("When should we reschedule your reflection?",
          (res,convo) => {
            var verifyTime = (res,convo,message) => {
              const yes = ['yes', 'ya', 'sure', 'maybe', 'i think', 'why not', 'yeah', 'yup', 'ok']
              const no = ['no', 'nah', 'nope', 'hell naw', 'no way']
              convo.ask(`Ok, so here's when I'll ping you to reflect: ${res.text} - is that ok?`,(res2,convo) => {
                if (yes.includes(res2.text.toLowerCase())) {
                  console.log("user replied yes");
                  convo.say("Great, I'll send you a reminder then!");

                  bot.api.reminders.add({
                    token: process.env.oAuthToken,
                    text: "Start reflection round 1 with <@muse>! Message `reflection round 1` to get started.",
                    time: res.text,
                    user: message.user
                  }, (err,res) => {
                    if (err) {
                      convo.say("Sorry, I couldn't schedule the reminder. Try setting the time again. You can say, `in 5 min` or `tomorrow at 3pm`.");
                      convo.next();
                      convo.ask("When can I ping you again to complete the second round of reflection questions?",
                      (res3,convo) => {
                        convo.next();
                        verifyTime(res3,convo,message);
                      });
                    }
                  });
                  convo.next();
                }
                else if (no.includes(res2.text.toLowerCase())) {
                  console.log("user replied no");
                  convo.next();
                  convo.ask("When can I ping you to reflect?",
                  (res3,convo) => {
                    convo.next();
                    verifyTime(res3,convo,message);
                  });
                }
                else {
                  convo.say("Sorry, I didn't understand that.");
                  convo.next();
                  convo.ask("When can I ping you to reflect?",
                  (res3,convo) => {
                    convo.next();
                    verifyTime(res3,convo,message);
                  });
                }
              }, {});
            }

            verifyTime(res,convo,message);
            convo.next();
          }, {'key': 'next_time'}, 'reschedule');

        convo.on('end',(convo) => {
          if (convo.status == 'completed') {
            // TODO: Set timeout for unfinished reflections
            var res = convo.extractResponses(); // Get the values for each reflection response
            console.log(story);
            console.log(strategy_category);
            console.log(learning_strategy);
            if (typeof story !== "undefined") {
              res.story = story;
            }
            if (typeof strategy_category !== "undefined") {
              res.strategy_category = strategy_category;
            }
            if (typeof learning_strategy !== "undefined") {
              res.strategy = learning_strategy;
            }
            if (typeof rec_followed !== "undefined") {
              res.rec_followed = rec_followed;
            }

            if (!res.in_action.toLowerCase().includes("no")) {
              res.time = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
              res.round = 1;
              res.id = message.user; // ID is Slack user ID

              async function getUserName(obj,controller) {
                let response = await bot.api.users.info({
                  token: process.env.oAuthToken,
                  user: message.user
                }, (err,res) => {
                  if (err) console.error(err);
                  if (!err) {
                    obj.userRealName = res.user.real_name;
                    obj.userName = res.user.name;
                    console.log(obj);
                    controller.storage.users.save(obj);
                  }
                });
              }
              try {
                getUserName(res,controller);
              }
              catch (err) {
                console.error(err);
                console.log(res);
                controller.storage.users.save(res);
              }
            }
          }
        });
      }
      else {
        console.error(err);
      }
    });
  });
};
