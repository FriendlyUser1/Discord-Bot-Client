import { newElement } from "./index.js";
const { Guild } = require("discord.js");
/**
 * Creates a guild in the guild list
 * @param {Guild} guild
 */
export const displayServer = (guild) => {
	if (!document.querySelector(`#serverid-${guild.id}`)) {
		let icon,
			servericon = [];
		if (guild.icon) {
			icon = guild.iconURL();
		} else {
			servericon.push(
				newElement("span", {
					className: "server-imgtext",
					textContent: guild.nameAcronym,
					title: guild.name,
				})
			);
			icon =
				"https://github.com/FriendlyUser1/apis/blob/364c4bd2f4458af085752af557c1ea5837b95baa/dbcguild.png?raw=true";
		}

		let innerImg = newElement("img", {
			src: icon,
			title: guild.name,
			className: "server-icon",
		});
		servericon.push(innerImg);
		document
			.querySelector(".server-existing")
			.append(
				newElement(
					"div",
					{ id: `serverid-${guild.id}`, className: "server-item" },
					servericon
				)
			);
	}
};
