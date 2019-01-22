var reflect = (err,convo) => {
  // To be called within bot.createConversation
  convo.addMessage({
    text: "Thanks for answering! Here's the next question: ",
    action: 'q2',
  },'q1_response');

  convo.addMessage({
    text: "Thanks for answering! Here's the next question: ",
    action: 'q3'
  }, 'q2_response');

  convo.addMessage({})

  convo.addQuestion('What did go over during SIG? Are you currently applying \
what you went over to your project? What strategies did you talk about?', [
      {
        default: true,
        callback: (res, convo) => {
          convo.gotoThread('q1_response');
        }
      }
  ],{},'default');

  convo.addQuestion('What are you currently doing well, and what could you do better?', [
    {
      default: true,
      callback: (res,convo) => {
        convo.gotoThread('q2_response');
      }
    }
  ], {}, 'q2');

  convo.addQuestion('Are you satisfied with your current progress, or do you \
feel the need to adjust your direction? Explain why, and if you need to make changes, \
detail what those changes would be.', [
    {
      default: true,
      callback: (res,convo) => {
        convo.gotoThread('q3_response');
      }
    }
  ], {}, 'q3');

  convo.activate();
}
