var reflect1 = (err,convo) => {
  // To be called within bot.createConversation
  if (!err) {
    convo.activate();
  }
  else {
    console.error(err);
    convo.ask('What did go over during SIG? Are you currently applying \
what you went over to your project? What strategies did you talk about?',
      (res,convo) => {
        convo.say("Thanks for answering that! I've recorded your response. Here's the next question: ");
        convo.next();
      }, {'key': 'answer1'});
    convo.ask('What are you currently doing well, and what could you do better?',
      (res,convo) => {
        convo.say("Thanks for answering that! I've recorded your response. The next question is the last question for now: ")
        convo.next();
      }, {'key': 'answer2'});
    convo.ask('Are you satisfied with your current progress, or do you \
  feel the need to adjust your direction? Explain why, and if you need to make changes, \
  detail what those changes would be.',
      (res,convo) => {
        convo.say("Thanks for finishing this reflection!");
        convo.next();
      }, {'key': 'answer3'});
    convo.on('end',(convo) => {
      if (convo.status == 'completed') {
        // Need to pass in bot and controller to pass to storage and finish convo
        // TODO: Set timeout for unfinished reflections
      }
    });
  }

}
