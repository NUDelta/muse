module.exports = function(controller) {
  controller.hears(["dashboard check"], ["direct_mention", "mention", "direct_message", "ambient"],
  (bot,message) => {
    bot.reply(message, "You can check your reflection progress at https://muse-delta.herokuapp.com.");
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
              convo.silentRepeat();
              startTime = currTime;
            }
          }
        }
        setInterval(followUp,30*60000); // Not 30 min for some reason

        convo.ask("After taking a quick look at the data, what strategies are you applying well, and what could you improve on?",
        (res,convo) => {
          convo.next();
        }, {'key': 'chart_check'});

        convo.ask("Review your two last reflections. What stands out to you? Do you see any patterns in the strategies you apply?",
        (res,convo) => {
          convo.next();
        }, {'key': 'response_check'});

        convo.ask("Are there specific strategies that you think are helpful for specific stories? If there are or are not, explain why.",
        (res,convo) => {
          convo.say("Thanks for completing your reflection with me!");
          convo.next();
        }, {'key': 'strategy_check'});

      }

      async function getUserData(userId,res) {
        return res = await controller.storage.users.get(userId, (err, user_data) => {
          return [user_data,res];
        });
      }

      convo.on('end',(convo) => {
        if (convo.status == 'completed') {
          // TODO: Set timeout for unfinished reflections
          var res = convo.extractResponses(); // Get the values for each reflection response
          res.time = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
          res.round = 3;
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
                console.log("saving reflection");
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
    });
  });
};
