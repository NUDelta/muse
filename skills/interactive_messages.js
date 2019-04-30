module.exports = function(controller) {

    // create special handlers for certain actions in buttons
    // if the button action is 'say', act as if user said that thing
    // controller.middleware.receive.use(function(bot, message, next) {
    //   if (message.type == 'interactive_message_callback') {
    //     if (message.actions[0].name.match(/^say$/)) {
    //         var reply = message.original_message;
    //
    //         for (var a = 0; a < reply.attachments.length; a++) {
    //             reply.attachments[a].actions = null;
    //         }
    //
    //         var person = '<@' + message.user + '>';
    //         if (message.channel[0] == 'D') {
    //             person = 'You';
    //         }
    //
    //         reply.attachments.push(
    //             {
    //                 text: person + ' said, ' + message.actions[0].value,
    //             }
    //         );
    //
    //         bot.replyInteractive(message, reply);
    //
    //      }
    //   }
    //
    //   next();
    //
    // });

//     controller.hears('interactive', 'direct_message', function(bot, message) {
//
//         bot.reply(message, {
//             attachments:[
//                 {
//                     title: 'Do you want to interact with my buttons?',
//                     callback_id: '123',
//                     attachment_type: 'default',
//                     actions: [
//                         {
//                             "name":"yes",
//                             "text": "Yes",
//                             "value": "yes",
//                             "type": "button",
//                         },
//                         {
//                             "name":"no",
//                             "text": "No",
//                             "value": "no",
//                             "type": "button",
//                         }
//                     ]
//                 }
//             ]
//         });
//     });
//
//     controller.on('interactive_message_callback', function(bot, message) {
//
//     // check message.actions and message.callback_id to see what action to take...
//
//     bot.replyInteractive(message, {
//         text: '...',
//         attachments: [
//             {
//                 title: 'My buttons',
//                 callback_id: '123',
//                 attachment_type: 'default',
//                 actions: [
//                     {
//                         "name":"yes",
//                         "text": "Yes!",
//                         "value": "yes",
//                         "type": "button",
//                     },
//                     {
//                        "text": "No!",
//                         "name": "no",
//                         "value": "delete",
//                         "style": "danger",
//                         "type": "button",
//                         "confirm": {
//                           "title": "Are you sure?",
//                           "text": "This will do something!",
//                           "ok_text": "Yes",
//                           "dismiss_text": "No"
//                         }
//                     }
//                 ]
//             }
//         ]
//     });
//
// });
  controller.hears('interactive_convo', 'direct_message', function(bot, message) {
    bot.startConversation(message, function(err, convo) {

        convo.ask({
            attachments:[
                {
                    title: 'Do you want to proceed?',
                    callback_id: 'interactive_convo',
                    attachment_type: 'default',
                    actions: [
                      {
                          "name": "games_list",
                          "text": "Pick a game...",
                          "type": "select",
                          "options": [
                              {
                                  "text": "Hearts",
                                  "value": "hearts"
                              },
                              {
                                  "text": "Bridge",
                                  "value": "bridge"
                              },
                              {
                                  "text": "Checkers",
                                  "value": "checkers"
                              },
                              {
                                  "text": "Chess",
                                  "value": "chess"
                              },
                              {
                                  "text": "Poker",
                                  "value": "poker"
                              },
                              {
                                  "text": "Falken's Maze",
                                  "value": "maze"
                              },
                              {
                                  "text": "Global Thermonuclear War",
                                  "value": "war"
                              }
                          ]
                      }
                    ]
                }
            ]
        });
    });
  });

  controller.hears('dialogue', 'direct_message', function(bot, message) {
    var dialog = bot.createDialog(
         'Title of dialog',
         'callback_id',
         'Submit'
       ).addText('Text','text','some text')
        .addSelect('Select','select',null,[{label:'Foo',value:'foo'},{label:'Bar',value:'bar'}],{placeholder: 'Select One'})
        .addTextarea('Textarea','textarea','some longer text',{placeholder: 'Put words here'})
        .addUrl('Website','url','http://botkit.ai');

    bot.replyWithDialog(message, dialog.asObject());
  });

}
