var debug = require('debug')('botkit:channel_join');

module.exports = function(controller) {

    controller.on('bot_channel_join', function(bot, message) {

        bot.reply(message,"Hi! I'm Muse, a friendly reflection bot! Let me know you want to reflect by saying `start reflection`, `I want to reflect`, `reflection round 1`.");

    });

}
