// TODO: Make cron jobs to send reflection prompts

module.exports = function(res,convo,token,user) {
  convo.ask("Hi, when would you like to receive a reminder to reflect?", (res,convo) => {
    var reminider_options = {
      token: token,
      text: "muse reminder to reflect"
    };
    var days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"]
    var days_abbr = ["sun","mon","tues","wed","thurs","fri"]
    var months = ["january","february","march","april","may","june","july","august","september","october","november","december"];
    var months_abbr = ["jan","feb","mar","apr","may","jun","jul","aug","sept","oct","nov","dec"]

    var message = res.text.toLowerCase();
    var today = new Date();
    var d = today.getDate();

    if (r.includes("every")) {
      var year = today.getFullYear();
      var next = new Date();
      while (next.getFullYear() == year) {
        // TODO
      }

    }
    if (r.includes("in")) { // curr time + x
      if ()
    }
    if (r.includes("at")) { // adjust hour and minute

    }
    if (r.includes("on")) {

    }
  });
}
