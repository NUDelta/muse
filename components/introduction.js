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
          convo.say("If you'd like to see a list of commands, say `list commands`.");
          convo.stop();
        });
      }
    });
  },

  command_list: function(controller) {
    controller.hears("list",
    ["direct_mention", "mention", "direct_message", "ambient"],
    (bot,message) => {
      bot.reply(message, "Here are a few commands I know \n \
      `reflection round 1`: Start the first round of your reflection \n \
      `reflection round 2`: Start the second round of your reflection \n \
      `list commands`: List the commands I know");
    });
  }
}
