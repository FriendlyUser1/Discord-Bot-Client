import { newElement } from "./index.js";
import { client } from "../index.js";
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
	timestampRegex = /\<t:([\-]?[0-9]+):?([tTdDfFR]?)\>/g,
	mentionRegex = /\\?<(@|@!|@&|#)(\d{17,19})>/gi,
	emojiRegex = /\\?<(a?):[^\s:]+:([0-9]{19})>/g,
	gifRegex =
		/https\:\/\/(tenor\.com\/view\/[^\s]+?gif.[0-9]{8}|imgur.com\/[^\s]{7}|media.discordapp.net\/attachments\/[0-9]{18}\/[0-9]{18}\/[^\s]+?.gif)/gi;

/**
 *
 * @param {Discord.Message} message The message to parse
 * @param {Boolean} notif If being used for a notification
 * @returns {string} The new message content
 */
export const parseMessage = (message, notif) => {
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
			});

		switch (option) {
			case "":
			case "f":
				timestamp = new Intl.DateTimeFormat(undefined, {
					timeStyle: "short",
					dateStyle: "long",
				})
					.format(unixdate)
					.replace("at ", "");
				break;
			case "t":
				timestamp = shortTime;
				break;
			case "T":
				timestamp = unixdate.toLocaleTimeString();
				break;
			case "d":
				timestamp = unixdate.toLocaleDateString();
				break;
			case "D":
				timestamp = unixdate.toLocaleDateString(undefined, {
					dateStyle: "long",
				});
				break;
			case "F":
				timestamp = unixdate
					.toLocaleString(undefined, {
						dateStyle: "full",
						timeStyle: "short",
					})
					.replace("at ", "");
				break;
			case "R":
				timestamp = relatime(unixdate.getTime() - new Date());
				break;
		}
		messageDiv.appendChild(
			newElement("span", { className: "timestamp" }, [timestamp])
		);
		return notif ? timestamp : "";
	});

	// mentions
	content = content.replace(mentionRegex, (match, type, mentionID) => {
		if (match.charAt(0) === "\\") return match.slice(1, message.content.length);

		let thismention = "";
		switch (type) {
			case "@":
			case "@!":
				let user = client.users.cache.get(mentionID);
				if (user) thismention = `@${user.username}`;
				else thismention = `@deleted-user`;
				break;

			case "@&":
				let role = message.guild.roles.cache.get(mentionID);
				if (message.guild && role) thismention = `@${role.name}`;
				else thismention = `@deleted-role`;
				break;

			case "#":
				let channel = client.channels.cache.get(mentionID);
				if (channel) thismention = `#${channel.name}`;
				else thismention = `#deleted-channel`;
				break;
		}

		if (notif) return thismention;
		messageDiv.appendChild(
			newElement("span", { className: `mention mention-${mentionID}` }, [
				thismention,
			])
		);
		return "";
	});

	// emoji
	content = content.replace(emojiRegex, (match, ani, emojiID) => {
		if (match.charAt(0) === "\\") return match.slice(1, message.content.length);

		if (content.replace(emojiRegex, "").trim() !== "")
			messageDiv.appendChild(newElement("div", { style: "height:5px;" }));

		messageDiv.appendChild(
			newElement("img", {
				src: `https://cdn.discordapp.com/emojis/${emojiID}.${
					ani !== "" ? "gif" : "png"
				}?v=1`,
				className: `emoji emoji-${emojiID}`,
			})
		);
		return "";
	});

	// notifs
	if (notif) return content == "" ? "Sent an attachment" : content;

	// gifs
	if (gifRegex.test(content)) {
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

	// attachments
	// if (message.attachments.size > 0) {
	// 	if (message.attachments.size > 0) {
	// 		let attached = Array.from(message.attachments);
	// 		attached.forEach((attachment) => {
	// 		});
	// 	}
	// }

	return content;
};
