import { client } from "../index.js";
import {
	clearChannel,
	displayChannel,
	displayMessage,
	displayServer,
	parseMessage,
	readChannel,
} from "../helpers/index.js";
const { ipcRenderer } = require("electron"),
	Discord = require("discord.js");

// TODO COMMENT
/**
 * Client's message event called for any messages in its monitored channels
 * @param {Discord.Message} message
 * @returns
 */
export const messageCreate = async (message) => {
	let channelID = message.channel.id;

	// If the server isn't already in the server list, display it
	if (!document.querySelector(`.server-existing #serverid-${message.guild.id}`))
		displayServer(message.guild);

	// If the message happened in the selected channel / server
	let activeChannel =
		document
			.querySelector("#channel-open .channel-openinner")
			.hasAttribute("id") &&
		channelID ===
			document
				.querySelector("#channel-open .channel-openinner")
				.getAttribute("id")
				.replace("openid-", "");

	let activeServer = document
		.querySelector(`.server-existing #serverid-${message.guild.id} img`)
		.hasAttribute("selected");

	//
	if (
		message.author.id !== client.user.id &&
		!global.notifChannels.includes(channelID) &&
		!activeChannel
	)
		global.notifChannels.push(channelID);

	if (!activeServer) {
		document
			.querySelector(`#serverid-${message.guild.id} img`)
			.setAttribute("servernotif", "");
	}

	if (activeChannel) {
		displayMessage(message, true);
		global.After = parseInt(message.id);
		await new Promise((r) => setTimeout(r, 500));
		document
			.getElementById("scroll-el")
			.scrollIntoView({ behaviour: "smooth", block: "end" });
	} else if (
		!document.getElementById(`channelid-${channelID}`) &&
		global.Guild === message.guild
	)
		displayChannel(message.channel);

	if (
		(!activeChannel || !document.hidden) &&
		message.author.id !== client.user.id
	) {
		if (!activeChannel && global.Guild === message.guild) {
			let classes = document.getElementById(
				`channelid-${message.channel.id}`
			).classList;

			if (!Array.from(classes).includes("channel-newmessage"))
				classes.add("channel-newmessage");
		}

		const notifOn = await ipcRenderer.invoke("getSetting", "notifOn");
		if (!notifOn) return;

		let notif;
		if (message.guild && !activeChannel) {
			let messageMember = message.guild.member(message.author);

			notif = new Notification(
				`${
					messageMember
						? messageMember.displayName
						: messageMember.username
						? messageMember.username
						: "Unknown user"
				} (#${message.channel.name}, ${message.guild.name})`,
				{
					body: parseMessage(message, true),
					icon: message.author.displayAvatarURL(),
				}
			);
		} else {
			notif = new Notification(message.author.tag, {
				body: message.content,
				icon: message.author.displayAvatarURL(),
			});
		}

		// If the notification is clicked, change selected channel to the one with the new message
		notif.onclick = () => {
			if (!activeChannel) {
				global.Channel = message.channel;
				if (!activeServer) {
					if (document.querySelector(`.server-item [selected]`))
						document
							.querySelector(`.server-item [selected]`)
							.removeAttribute("selected");
					document
						.querySelector(`#serverid-${message.guild.id} img`)
						.setAttribute("selected", "");
				}
				global.Guild = message.guild ?? {};
				global.Before = 0;
				global.After = 0;
				global.loadedMore = 0;
				document.querySelector("#channel-open .channel-openinner").innerHTML =
					"";
				clearChannel();

				// If the message is in a guild (not a DM)
				if (message.guild)
					client.channels.cache
						.filter(
							(c) =>
								["text", "news"].includes(c.type) &&
								c.guild.id === message.guild.id
						)
						.forEach((c) => {
							displayChannel(c);
						});
				else {
					// Display all open DMs (including the new channel if it isn't already open)
					if (
						message.channel.type === "dm" &&
						!global.openDMs.includes(message.channel)
					)
						global.openDMs.push(message.channel);

					global.openDMs.forEach((c) => {
						displayChannel(c);
					});
				}

				readChannel(global.Channel.id).catch(console.error);
				global.notifChannels = global.notifChannels.splice(
					global.notifChannels.indexOf(global.Channel.id),
					1
				);
				Array.from(
					document.getElementsByClassName("channel-newmessage")
				).forEach((e) => {
					if (global.notifChannels.includes(e.id.replace("channelid-", ""))) {
						e.classList.remove("channel-newmessage");
						global.notifChannels.splice(
							global.notifChannels.indexOf(e.id.replace("channelid-", "")),
							1
						);
					}
				});
				let guild = client.channels.cache.get(global.Channel.id).guild;
				if (
					Array.from(guild.channels.cache)
						.map((x) => {
							return x[0];
						})
						.filter((element) => global.notifChannels.includes(element))
						.length == 0
				)
					document
						.querySelector(`#serverid-${guild.id} img`)
						.removeAttribute("servernotif");
			}
		};
	}
};
