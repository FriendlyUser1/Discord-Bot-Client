# Discord Bot Client

Discord's client is great, but doesn't allow you to control a bot account.

## About

### What this will let you do

With this application, you will be able to fully control your bot as a user, like sending and viewing messages from guilds your bot is in or sending DMs.

### Disclaimer

This application is very unfinished, and is not close to being complete - currently more of a proof of concept. I will keep working on this with more improvements and features to try to let this application run as close to the native Discord client as I can get.

### Recent features

- Infinite scrolling!

### Immediate To-Do List

- Option to disable notifications
- Ability to view all attachments
- Ability to edit/delete messages

### Known issues

- With mentions, timestamps and emojis the other text is not correctly placed around it

## Installation

You will need to install [Node.JS] and make a [bot] will all [intents] in the developer dashboard selected for the program to run

1. Download zip [here] and extract it into a folder
2. Create a text file called `token.txt` in the folder and type your bot's token in it
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
[intents]: https://i.imgur.com/y7RNoCP.png
