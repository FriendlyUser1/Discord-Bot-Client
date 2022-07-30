import { newElement } from "./newElement.js";
const Discord = require("discord.js"),
	relatime = (elapsed) => {
		let units = [
				["year", 31536000000],
				["month", 2628000000],
				["day", 86400000],
				["hour", 3600000],
				["minute", 60000],
				["second", 1000],
			],
			rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
		for (const [unit, amount] of units) {
			if (Math.abs(elapsed) > amount || unit === "second") {
				return rtf.format(Math.round(elapsed / amount), unit);
			}
		}
	},
	mentionRegex = /\\?<(@|@!|@&|#)(\d{17,19})>/gi,
	timestampRegex = /\<t:([\-]?[0-9]+):?([tTdDfFR]?)\>/g,
	gifRegex =
		/https\:\/\/(tenor\.com\/view\/[^\s:]+gif.[0-9]{8}|imgur.com\/[^\s]+)/gi;

/**
 *
 * @param {Discord.Message} message The message to parse
 * @param {Discord.Client} client The current client
 * @param {Boolean} notif If being used for a notification
 * @returns {string} The new message content
 */
export const parseMessage = (message, client, notif) => {
	let content = message.content,
		messageDiv = document.querySelector(
			`#messageid-${message.id} .channel-text .channel-content`
		);

	// timestamp
	content = content.replace(timestampRegex, (match, unix, option) => {
		let timestamp = "",
			unixdate = new Date(parseInt(unix) * 1000),
			shortTime = unixdate.toLocaleTimeString(undefined, {
				timeStyle: "short",
			}),
			tim = ['<span class="timestamp">', "</span>"];

		switch (option) {
			case "":
			case "f":
				timestamp = `${tim[0]}${unixdate
					.toLocaleDateString(undefined, {
						timeStyle: "short",
						dateStyle: "long",
					})
					.replace("at ", "")}${tim[1]}`;
				break;
			case "t":
				timestamp = `${tim[0]}${shortTime}${tim[1]}`;
				break;
			case "T":
				timestamp = `${tim[0]}${unixdate.toLocaleTimeString()}${tim[1]}`;
				break;
			case "d":
				timestamp = `${tim[0]}${unixdate.toLocaleDateString()}${tim[1]}`;
				break;
			case "D":
				timestamp = `${tim[0]}${unixdate.toLocaleDateString(undefined, {
					dateStyle: "long",
				})}${tim[1]}`;
				break;
			case "F":
				timestamp = `${tim[0]}${unixdate
					.toLocaleString(undefined, {
						dateStyle: "full",
						timeStyle: "short",
					})
					.replace("at ", "")}${tim[1]}`;
				break;
			case "R":
				timestamp = `${tim[0]}${relatime(unixdate.getTime() - new Date())}${
					tim[1]
				}`;
				break;
		}
		return timestamp;
	});

	// mentions
	content = content.replace(mentionRegex, (match, type, id) => {
		if (message.content.charAt(0) === "\\")
			return message.content.slice(1, message.content.length);

		let thismention = "";
		switch (type) {
			case "@":
			case "@!":
				let user = client.users.cache.get(id);
				if (user) thismention = `@${user.username}`;
				else thismention = `@deleted-user`;
				break;

			case "@&":
				let role = message.guild.roles.cache.get(id);
				if (message.guild && role) thismention = `@${role.name}`;
				else thismention = `@deleted-role`;
				break;

			case "#":
				let channel = client.channels.cache.get(id);
				if (channel) thismention = `#${channel.name}`;
				else thismention = `#deleted-channel`;
				break;
		}
		messageDiv.appendChild(
			newElement("span", { className: "mention" }, [thismention])
		);
		return "";
	});

	if (notif) return content == "" ? "Sent an attachment" : content;

	// attachments
	let isGif = gifRegex.test(content);
	if (message.attachments.size > 0 || isGif) {
		if (isGif) {
			content.match(gifRegex).forEach((gifurl, i) => {
				let gif = newElement("img", {
					src: `${gifurl}.gif`,
					className: `gif-${i + 1}`,
				});
				if (content.replace(gifRegex, "") !== "" || i !== 0)
					messageDiv.appendChild(newElement("div", { style: "height:5px;" }));
				messageDiv.appendChild(gif);
			});
			content = content.replace(gifRegex, "");
		}

		if (message.attachments.size > 0) {
			let attached = Array.from(message.attachments);
			attached.forEach((attachment) => {
				let container = document.querySelector(
					`#messageid-${message.id} .channel-content`
				);
			});
		}
	}

	return content;
};
