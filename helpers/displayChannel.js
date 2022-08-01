const Discord = require("discord.js");
import { client } from "../index.js";
import { newElement } from "./index.js";
/**
 * Displays a channel in the channel list
 * @param {Discord.Channel} channel
 */
export const displayChannel = (channel) => {
	if (channel) {
		let perms;
		if (channel.type !== "dm")
			perms = channel.permissionsFor(client.user).toArray();
		else perms = [];
		if (
			channel.type === "dm" ||
			(perms.includes("VIEW_CHANNEL") && perms.includes("READ_MESSAGE_HISTORY"))
		) {
			if (!document.querySelector(`#channelid-${channel.id}`)) {
				let titleSpan = newElement("div", {
						className: "channel-title",
						textContent: `${channel.type === "dm" ? "@ " : "# "}${
							channel.type === "dm"
								? channel.recipient.username
								: channel.name.length >= 20
								? channel.name.substring(0, 20) + "..."
								: channel.name
						}`,
					}),
					innerSpan = newElement("span", { className: "channel-text" }, [
						titleSpan,
					]),
					outerDiv = newElement(
						"div",
						{
							className: `channel-item ${
								channel.type === "dm" ? "channel-dm" : "channel-guild"
							}${
								global.notifChannels.includes(channel.id)
									? " channel-newmessage"
									: ""
							}`,
							id: `channelid-${channel.id}`,
						},
						[innerSpan]
					);

				if (channel.type === "dm") {
					let innerImg = newElement("img", {
						src: channel.recipient.avatarURL(),
						className: "channel-icon",
					});
					outerDiv.prepend(innerImg);
				}

				document
					.querySelector("#channel-list .channel-existing")
					.prepend(outerDiv);
			}
		}
	}
};
