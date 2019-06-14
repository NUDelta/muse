# muse
A Slackbot to promote self-regulated learning and metacognitive reflection. Powered by [Botkit](https://botkit.ai/) and the [Slack API](https://api.slack.com/). To get started, run `npm install` and `npm start` to get the bot running.

## Slackbot interface

## Reflection Dashboard

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
