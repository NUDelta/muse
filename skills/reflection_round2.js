module.exports = function(controller) {
  controller.hears(["finish reflection", "reflection round 2", "reflection 2"],
    ["direct_mention", "mention", "direct_message", "ambient"],
    (bot,message) => {
      bot.createConversation(message,(err,convo) => {
        if (!err) {
          convo.activate();
          var startTime = new Date();
          convo.setTimeout(10800000); // convo expires after 3 hours

          var followUp = () => {
            if (convo.status != 'completed') {
              currTime = new Date();
              if (currTime.getTime() >= (startTime.getTime()+30*60000)) { // Ask every 30 min
                bot.reply(message,"Are you still there? Please answer the previous reflection question!");
                convo.silentRepeat(); // check what this does
                startTime = currTime;
              }
            }
          }
          setInterval(followUp,30*60000);

          // Question 1
          convo.ask("How do you feel about your progress during this work \
session? Did you feel the need to make any changes to your process? Why or why not?",
          (res,convo) => {
            convo.next();
          }, {'key': 'r2_answer1'});

          // Question 2
          controller.storage.users.get(message.user, (err, user_data) => {
            if (!Array.isArray(user_data)) {
              user_data = [user_data];
            }
            var round1_docs = user_data.filter((o) => { return o.round == 1; });
            if (round1_docs.length > 0) {
              var get_most_recent_doc = function(array, t) {
                let res = array.map((o) => {
                  let d = new Date(o.time);
                  if (d.getTime() == t) {
                    return o;
                  }
                });
                if (res.length > 0) {
                  return res[0];
                }
              }

            let most_recent_time = Math.max.apply(Math, round1_docs.map((o) => { return new Date(o.time); }));
            let most_recent = get_most_recent_doc(round1_docs, most_recent_time);
            let res = most_recent.r1_answer1;
            convo.say("In your previous reflection session, you mentioned that you could improve at: " + res);
            convo.next();
            convo.ask("How have you made progress towards improving that learning strategy?",
            (res,convo) => {
              convo.next();
            }, {'key': 'r2_answer2'});

            // let filtered_array = round1_docs.filter((o) => { return o != most_recent; });
            // if (filtered_array.length > 0) {
            //   var previous_time = Math.max.apply(Math, filtered_array.map((o) => { return new Date(o.time); }));
            //   var prev_most_recent = get_most_recent_doc(filtered_array, previous_time);
            //   var res2 = prev_most_recent.r1_answer2;
            //   convo.say("In your previous reflection session, you mentioned the pros and cons of your usual strategies: " + res1);
            //   convo.next();
            //   convo.ask("How does this compare to what you mentioned earlier in round 1: " + res2 + "\n Can you see any improvements in the way you work?",
            //   (res,convo) => {
            //     convo.next();
            //   }, {'key': 'r2_answer2a'});
            // }
            }
          });

          // Question 3
          convo.ask("What have you been doing well, and what could be improved?",
          (res,convo) => {
            convo.next();
          }, {'key': 'r2_answer3'});

          // Question 4
          convo.ask("Open up the muse app at https://muse-delta.herokuapp.com/ and take a look at your reflection history. How have you grown since then in terms of the ways in which you work?",
          (res,convo) => {
            convo.next();
          }, {'key': 'r2_answer4'});

          // Not sure if I'll include this yet
          // controller.storage.users.get(message.user, (err, user_data) => {
          //   if (!Array.isArray(user_data)) {
          //     user_data = [user_data];
          //   }
          //   var round2_docs = user_data.filter((o) => { return o.round == 2; });
          //   if (round2_docs.length > 0) {
          //     var get_most_recent_doc = function(array, t) {
          //       let res = array.map((o) => {
          //         let d = new Date(o.time);
          //         if (d.getTime() == t) {
          //           return o;
          //         }
          //       });
          //       if (res.length > 0) {
          //         return res[0];
          //       }
          //     }
          //     let most_recent_time = Math.max.apply(Math, round2_docs.map((o) => { return new Date(o.time); }));
          //     let most_recent = get_most_recent_doc(round2_docs, most_recent_time);
          //     let res = most_recent.r2_answer3;
          //     convo.say("Last week, you described the pros and cons of your process: " + res);
          //     convo.next();
          //     convo.ask("How have you grown since them in terms of the ways in which you work?",
          //     (res,convo) => {
          //       convo.next();
          //     }, {'key': 'r2_answer4'});
          //   }
          //
          // });

          convo.say("Thanks for reflecting with me! I've recorded your responses!");
          askTime(res,convo,message);
          convo.next();

          var askTime = (res,convo,message) => {
            convo.ask("When can I ping you to reflect again?",
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
              res.round = 2;
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
                res = getUserName(res,controller);
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
