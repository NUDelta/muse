module.exports = {
  intro: function(bot,user) {
    // Introduce muse to user
    bot.api.im.open({
      user: user
    }, (err,res,user) => {
      if (err) {
        console.error(err);
      }
      else {
        bot.startConversation({
          user: user,
          channel: res.channel.id,
          text: `Starting conversation with user: ${user}`
        }, (err,convo) => {
          // Intro
          convo.say("Nice to meet you! :wave: I'm Muse, your friendly reflection bot! I'm here to help you work out your DTR blockers :dtr:");
          convo.say("If you'd like to see a list of commands, say `list` in this channel.");
          convo.stop();
        });
      }
    });
  },

  command_list: function(bot,message) {
    bot.reply(message, "blah blah");
  }
}
