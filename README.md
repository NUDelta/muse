# muse
A Slackbot to promote self-regulated learning and metacognitive reflection. Powered by [Botkit](https://botkit.ai/) and the [Slack API](https://api.slack.com/). To get started, run `npm install` and `npm start` to get the bot running. If you're running the app locally, use ngrok or localtunnel for the buttons to work. You must set up a webhook for button payloads through Slack.

## Slackbot interface
<img src="https://github.com/NUDelta/muse/blob/master/gifs/muse.gif" width="400">

## Reflection Dashboard
<img src="https://github.com/NUDelta/muse/blob/master/gifs/dashboard.gif" width="400">
If you are a member of the DTR Slack, you can view your reflection dashboard at https://muse-delta.herokuapp.com.

## Setup
If you're running locally, uncomment lines 1 and 4-7 in `bot.js`. Also uncomment lines 13-16 in `components/express_webserver.js`. Make sure your `.env` file contains the following variables:
```
botToken
oAuthToken
PORT
clientId
clientSecret
clientSigningSecret
MONGO_URI
botId
botName
```
You must obtain authorization tokens through [Slack](https://api.slack.com/). To enable interactive components, you must set up a webhook through Slack [(instructions can be found here)](https://www.npmjs.com/package/@slack/interactive-messages).

If you are having issues setting up your app through Slack, this is a great [tutorial](https://medium.com/greenroom/the-slack-bot-tutorial-i-wish-existed-d53133f03b13) to follow.

## Deploying to Heroku
When deploying to Heroku, comment out all instances of the following code:
```
var env = require('node-env-file');
env(__dirname + '/.env');
if (!process.env.clientId || !process.env.clientSecret || !process.env.PORT) {
   usage_tip();
}
```
Uncomment the above lines for local development.
