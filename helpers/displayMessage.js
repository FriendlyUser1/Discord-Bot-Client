import { newElement, parseMessage } from "./index.js";
const { Message } = require("discord.js");

/**
 * Creates a message div in the document
 * @param {Message} message
 * @param {Boolean} append
 */
export const displayMessage = (message, append) => {
	let today = new Date(),
		msgca = message.createdAt,
		msgdate = msgca.getDate(),
		msgmonth = msgca.getMonth(),
		date =
			msgdate == today.getDate() &&
			msgmonth == today.getMonth() &&
			msgca.getFullYear() == today.getFullYear();
	if (date) {
		date = `Today at ${msgca.toLocaleTimeString().slice(0, -3)}`;
	} else if (
		msgdate == today.getDate() - 1 &&
		(msgmonth == today.getMonth() ||
			msgca.toString().slice(0, 15) ==
				new Date(today.getFullYear(), today.getMonth(), 0)
					.toString()
					.slice(0, 15))
	)
		date = `Yesterday at ${msgca.toLocaleTimeString().slice(0, -3)}`;
	else date = msgca.toLocaleDateString();

	let innerImg = newElement("img", {
			src: message.author.displayAvatarURL(),
			className: "channel-icon",
		}),
		nameSpan = newElement("span", {
			id: `userid-${message.author.id}`,
			className: "username",
			textContent: message.author.tag,
		}),
		dateSpan = newElement("span", {
			className: "date",
			textContent: date,
		}),
		headerSpan = newElement("div", { className: "channel-header" }, [
			nameSpan,
			dateSpan,
		]),
		messageSpan = newElement("span", {
			className: "channel-content",
		}),
		innerSpan = newElement("div", { className: "channel-text" }, [
			headerSpan,
			messageSpan,
		]),
		outerDiv = newElement(
			"div",
			{
				id: `messageid-${message.id}`,
				className: "channel-message",
			},
			[innerImg, innerSpan]
		);

	if (append) {
		document
			.getElementById(`openid-${message.channel.id}`)
			.insertBefore(outerDiv, document.getElementById("scroll-el"));
	} else
		document.getElementById(`openid-${message.channel.id}`).prepend(outerDiv);

	messageSpan.prepend(parseMessage(message, false));
};
