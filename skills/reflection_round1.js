module.exports = function(controller) {
  controller.hears(["start reflection", "I want to reflect", "reflection round 1", "reflection 1"],
    ["direct_mention", "mention", "direct_message", "ambient"],
    (bot,message) => {
      bot.createConversation(message,(err,convo) => {
        if (!err) {
          convo.activate();
          var startTime = new Date();
          convo.setTimeout(10800000); // convo expires after 3 hours

          // Question 1
          convo.ask('What did go over during SIG? Are you currently applying \
what you went over to your project? What strategies did you talk about?',
            (res,convo) => {
              convo.next();
            }, {'key': 'r1_answer1'});

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

          // Question 2
          convo.ask('What are you currently doing well, and what could you do better?',
            (res,convo) => {
              convo.next();
            }, {'key': 'r1_answer2'});

          // Question 3
          convo.ask('Are you satisfied with your current progress, or do you \
feel the need to adjust your direction? Explain why, and if you need to make changes, \
detail what those changes would be.',
            (res,convo) => {
              convo.say("Thanks for reflecting with me! I've recorded your responses!")
              askTime(res,convo,message);
              convo.next();
            }, {'key': 'r1_answer3'});

          var askTime = (res,convo,message) => {
            convo.ask("When can I ping you again to complete the second round of reflection questions?",
              (res,convo) => {
                verifyTime(res,convo,message);
                convo.next();
              }, {'key': 'next_time'});
          }

          var verifyTime = (res,convo,message) => {
            const yes = ['yes', 'ya', 'sure', 'maybe', 'i think', 'why not', 'yeah', 'yup', 'ok']
            const no = ['no', 'nah', 'nope', 'hell naw', 'no way']
            convo.ask(`Ok, so here's when I'll ping you to reflect: ${res.text}. Is that ok?`,(res2,convo) => {
              if (yes.includes(res2.text.toLowerCase())) {
                console.log("user replied yes");
                convo.say("Great, I'll send you a reminder then! You have successfully completed your reflection!");

                var env = require('node-env-file'); // comment out for Heroku
                path = require('path');
                let reqPath = path.join(__dirname, '../.env');
                env(reqPath);

                bot.api.reminders.add({
                  token: process.env.oAuthToken,
                  text: "Start reflection round 2 with <@muse>!",
                  time: res.text,
                  user: message.user
                }, (err,res) => {
                  if (err) {
                    convo.say("Sorry, I couldn't schedule the reminder. Try setting the time again. You can say, `in 5 min` or `tomorrow at 3pm`.");
                    askTime(res,convo,message);
                  }
                });
                convo.next();
              }
              else if (no.includes(res.text.toLowerCase())) {
                askTime(res,convo,message);
                convo.next();
              }
              else {
                convo.say("Sorry, I didn't understand that.");
                askTime(res,convo,message);
              }
            }, {});
          }

          convo.on('end',(convo) => {
            if (convo.status == 'completed') {
              // TODO: Set timeout for unfinished reflections
              var res = convo.extractResponses(); // Get the values for each reflection response
              res.time = new Date();
              res.round = 1;
              res.id = message.user; // ID is Slack user ID

              var env = require('node-env-file'); // comment out for Heroku
              path = require('path');
              let reqPath = path.join(__dirname, '../.env');
              env(reqPath);

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
          });
        }
        else {
          console.error(err);
        }
    });
  });
};
