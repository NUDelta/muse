module.exports = function(controller) {
  controller.hears(["schedule reflection", "schedule reminder"], ["direct_mention", "mention", "direct_message", "ambient"],
  (bot,message) => {
    bot.startConversation(message,(err,convo) => {
      convo.ask("When can I ping you to reflect?",
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
                  text: "Testing reminder functionality",
                  time: res.text,
                  user: message.user
                }, (err,res) => {
                  if (err) {
                    console.error(err);
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
        }, {});
    });
  });
}
