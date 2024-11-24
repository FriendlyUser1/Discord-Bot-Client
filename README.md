# Discord Bot Client

Discord's client is great, but doesn't allow you to control a bot account.

## Archived

This is old, probably doesn't work, plus writing it in vanilla js was a mistake.
I may rewrite this in the future, or you can fork it.

## About

### What this will let you do

With this application, you will be able to fully control your bot as a user, like sending and viewing messages from guilds your bot is in and sending DMs.

### Disclaimer

- This application is still pretty unfinished but I am actively working to add as many features as possible.
- I cannot get your bot's token from you putting it into this program. Look at the source if you don't believe me. 

### Recent features

- Infinite scrolling
- Images, gifs and emojis

### Immediate To-Do List

- Handle more events (channel delete etc)
- Ability to view all types of attachments
- Ability to edit/delete messages

### Known issues

- With mentions, timestamps and emojis the other text is not correctly placed around it (always at end) (fixing soon)
- Warnings in console for gifs (cannot fix)

## Installation

You will need to install [Node.JS] and have a [bot] (with all [intents] in the developer dashboard selected) for the program to run

1. Download zip [here] and extract it into a folder
2. Create a text file called `token.txt` in the folder and paste your bot's token in it (you get the token when creating your bot)
3. Run `start.bat` to compile and run the program

## Usage

**To open a new DM**
Get the recipient's [User ID] and enter it in the text box at the top left of the DM menu, then click "add" or press "enter"

**To Send a message**
Type your message in the text box at the bottom, then press "enter"

[bot]: https://discordjs.guide/preparations/setting-up-a-bot-application.html#your-bot-s-token
[here]: https://github.com/FriendlyUser1/discord-bot-client/archive/refs/heads/main.zip
[node.js]: https://nodejs.org/en/
[user id]: https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-
[intents]: https://i.imgur.com/eR9FMqp.png
