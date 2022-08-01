import { newElement, displayMessage } from "./index.js";
const { TextChannel, Message } = require("discord.js");

/**
 * Fetch the messages
 * @param {TextChannel} channel Specified channel
 * @param {{limit: number, before?: number}} options Options
 * @returns {Promise<Message[]>} The messages
 */
const fetchMessages = async (channel, options) => {
	if (options.before === 0) {
		delete options.before;
	}

	return await channel.messages.fetch(options);
};

/**
 * Generate messages in a channel
 * @param {TextChannel} channel The channel to generate in
 * @returns {Message[]}
 */
export const generateMessages = async (channel) => {
	fetchMessages(channel, { limit: 100, before: global.Before }).then(
		async (messages) => {
			messages = Array.from(messages.values());

			if (messages.length > 0) {
				if (global.Before != 0) global.loadedMore++;
				global.Before = parseInt(messages[messages.length - 1].id);
				global.After = messages[0].id;

				document
					.querySelector("#channel-open .channel-openinner")
					.setAttribute("id", `openid-${channel.id}`);

				messages.forEach((msg) => {
					displayMessage(msg, false);
				});

				document.getElementById(`openid-${channel.id}`).append(
					newElement("span", {
						style: "display:block; height:1px;",
						id: "scroll-el",
					})
				);

				if (global.After != 0 && global.loadedMore === 0) {
					global.freezeClick = true;
					await new Promise((r) => setTimeout(r, 75));
					document
						.getElementById("scroll-el")
						.scrollIntoView({ behaviour: "smooth", block: "end" });
					global.freezeClick = false;
				}
				return messages;
			}
		}
	);
};
