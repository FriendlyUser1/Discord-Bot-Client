import { client } from "../index.js";
import { generateMessages } from "./index.js";
/**
 * Changes displayed channel
 * @param {string} id The channel ID
 * @returns {Promise<obj>} Object with messages and channel
 */
export const readChannel = (id) => {
	return new Promise((success, fail) => {
		let channel = client.channels.cache.get(id);
		if (channel) {
			let perms;
			if (channel.type !== "dm")
				perms = channel.permissionsFor(client.user).toArray();
			else perms = [];
			if (
				channel.type === "dm" ||
				(perms.includes("VIEW_CHANNEL") &&
					perms.includes("READ_MESSAGE_HISTORY"))
			) {
				document.querySelector(".channel-name").innerHTML = `${
					channel.type === "dm" ? "@" : "#"
				} ${channel.recipient ? channel.recipient.username : channel.name}`;
				document.querySelector(".channel-topic").innerHTML = `${
					channel.topic ? " | " + channel.topic : ""
				}`;
				document
					.querySelector(".channel-textboxcontain .textbox")
					.setAttribute(
						"placeholder",
						`Message ${
							channel.recipient
								? `@${channel.recipient.username}`
								: `#${channel.name}`
						}`
					);
				document
					.querySelectorAll(".channel-existing [selected]")
					.forEach((s) => s.removeAttribute("selected"));
				document
					.querySelector(
						`#channel-list .channel-existing #channelid-${channel.id}`
					)
					.setAttribute("selected", "");

				var messages = generateMessages(channel);
				success({ messages, channel });
			}
		}
	});
};
