module.exports = {
  reflect1: function(err,convo) {
    if (!err) {
      convo.activate();

      // Question 1
      convo.ask('What did go over during SIG? Are you currently applying \
  what you went over to your project? What strategies did you talk about?',
        (res,convo) => {
          convo.next();
        }, {'key': 'r1_answer1'});

      // Question 2
      convo.ask('What are you currently doing well, and what could you do better?',
        (res,convo) => {
          convo.next();
        }, {'key': 'r1_answer2'});

      // Question 3
      convo.ask('Are you satisfied with your current progress, or do you \
feel the need to adjust your direction? Explain why, and if you need to make changes, \
detail what those changes would be.',
        (res,convo) => {
          convo.say("Thanks for reflecting with me! I've recorded your responses!")
          askTime(res,convo);
          convo.next();
        }, {'key': 'r1_answer3'});

      // Set up reminder
      var askTime = (res,convo) => {
        convo.ask("When can I ping you again to complete the second round of reflection questions?",
          (res,convo) => {
            verifyTime(res,convo);
            convo.next();
          }, {'key': 'next_time'});
      }

      var verifyTime = (res,convo) => {
        console.log("printing res in verifyTime",res);
        convo.ask(`Ok, so here's when I'll ping you to reflect: ${res.text}. Is that ok?`,(res,convo) => {
          if (res.text.toLowerCase().includes("yes")) {
            console.log("user replied yes");
            convo.say("Great, I'll ping you then! You have successfully completed your reflection!")
            convo.next();
          }
          else if (res.text.toLowerCase().includes("no")){
            console.log("user replied no");
            askTime(res,convo);
            convo.next();
          }
          else {
            convo.say("Sorry, I didn't understand that.");
            askTime(res,convo);
          }
        }, {});
      }

      convo.on('end',(convo) => {
        if (convo.status == 'completed') {
          // TODO: Set timeout for unfinished reflections
          var res = convo.extractResponses(); // Get the values for each reflection response
          console.log(res); // TODO: Store data in Mongo
        }
      });
    }
    else {
      console.error(err);
    }
  },
  reflect2: function(err,convo) {
    if (!err) {
      convo.activate();

      // Question 1
      convo.ask("How do you feel about your progress during this work \
session? Did you feel the need to make any changes to your process? Why or why not?",
      (res,convo) => {
        convo.next();
      }, {'key': 'r2_answer1'});

      // Question 2
      convo.ask("Describe what you thought was effective or ineffective \
about your process. Highlight which of the following metacognitive strategies you \
applied in the learning strategies checklist.",
      (res,convo) => {
        convo.next();
      }, {'key': 'r2_answer2'});

      // Question 3
      convo.ask("Describe how applying one of the strategies from the learning strategies \
checklist helped you.",
      (res,convo) => {
        convo.next();
      }, {'key': 'r2_answer3'});

      convo.on('end',(convo) => {
        if (convo.status == 'completed') {
          // TODO: Set timeout for unfinished reflections
          var res = convo.extractResponses(); // Get the values for each reflection response
          console.log(res); // TODO: Store data in Mongo
        }
      });
    }
    else {
      console.error(err);
    }
  }
}