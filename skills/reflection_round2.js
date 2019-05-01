module.exports = function(controller) {
  controller.hears(["finish reflection", "reflection round 2", "reflection 2"],
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

      try {
        checkPrevReflections(message).then((user_data) => {
          bot.createConversation(message,(err,convo) => {
            if (err) {
              console.error(err);
              return;
            }
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

            var round1_docs = user_data.filter((o) => { return o.round == 1; });
            if (round1_docs.length > 0) {
              let most_recent = round1_docs[round1_docs.length-1];
              let res = most_recent.strategy;
              convo.say("In your previous reflection session, you mentioned that " + res + " could help you.");
              convo.next();
              convo.ask("How have you made progress towards applying that learning strategy, and how has that strategy helped you move closer to your goals?",
              (res,convo) => {
                convo.next();
              }, {'key': 'strategy_application'});
            }
            else {
              console.log("no previous reflection history");
            }
            remainingConvo(convo);
          });
        });
      }
      catch(err) {
        console.error(err);
      }

      var remainingConvo = function(convo) {
        // Question 2
        convo.ask("How do you feel about your progress during this work \
session? Did you feel the need to make any changes to your process? Why or why not?",
        (res,convo) => {
          convo.next();
        }, {'key': 'progress'});

        // Question 3
        convo.ask("What have you been doing well, and what could be improved?",
        (res,convo) => {
          convo.next();
        }, {'key': 'improvement'});

        // Question 4
        convo.ask("Describe your main takeaways from this work session.",
        (res,convo) => {
          convo.next();
        }, {'key': 'takeaways'})

        convo.say("Thanks for reflecting with me! I've recorded your responses!");
        convo.next();

        var askTime = (convo,message) => {
          convo.ask("When can I ping you to reflect again?",
            (res,convo) => {
              verifyTime(res,convo,message);
              convo.next();
            }, {'key': 'next_time'});
        }

        askTime(convo,message);

        var verifyTime = (res,convo,message) => {
          const yes = ['yes', 'ya', 'sure', 'maybe', 'i think', 'why not', 'yeah', 'yup', 'ok']
          const no = ['no', 'nah', 'nope', 'hell naw', 'no way']
          convo.ask(`Ok, so here's when I'll ping you to reflect: ${res.text} - is that ok?`,(res2,convo) => {
            if (yes.includes(res2.text.toLowerCase())) {
              console.log("user replied yes");
              convo.say("Great, I'll send you a reminder then! You have successfully completed your reflection!");

              bot.api.reminders.add({
                token: process.env.oAuthToken,
                text: "Start reflection round 1 with <@muse>! Message `reflection round 1` to get started.",
                time: res.text,
                user: message.user
              }, (err,res) => {
                if (err) {
                  convo.say("Sorry, I couldn't schedule the reminder. Try setting the time again. You can say, `in 5 min` or `tomorrow at 3pm`.");
                  askTime(convo,message);
                }
              });
              convo.next();
            }
            else if (no.includes(res.text.toLowerCase())) {
              askTime(convo,message);
              convo.next();
            }
            else {
              convo.say("Sorry, I didn't understand that.");
              askTime(convo,message);
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
    });
};
