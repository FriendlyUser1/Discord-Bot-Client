import {
	addUserFromInput,
	clearChannel,
	displayChannel,
	displayServer,
	generateMessages,
	readChannel,
} from "./helpers/index.js";
import { messageCreate } from "./events/message.js";
const { ipcRenderer } = require("electron"),
	Discord = require("discord.js"),
	_ = require("lodash");

export const client = new Discord.Client();

Object.assign(global, {
	Before: 0,
	After: 0,
	loadedMore: 0,
	freezeClick: false,
	openDMs: [],
	notifChannels: [],
	Channel: {},
	Guild: {},
});

addEventListener("load", () => {
	let windowActive = document.hidden;
	addEventListener("focus", () => (windowActive = true));
	addEventListener("blur", () => (windowActive = false));

	ipcRenderer.on("token", (event, arg) => {
		client.on("ready", start);
		client.login(arg);
	});
	ipcRenderer.send("ready");

	const start = () => {
		console.log("ready");

		let serverList = client.guilds.cache;

		serverList.forEach((s) => {
			displayServer(s);
		});

		document
			.querySelector("#server-list .server-existing")
			.addEventListener("click", (e) => {
				let id = null;
				e.composedPath().forEach((path) => {
					if (path.id && path.id.includes("serverid")) {
						global.Channel = {};
						document
							.querySelectorAll(".server-existing [selected]")
							.forEach((s) => s.removeAttribute("selected"));
						document
							.querySelector(`#${path.id} .server-icon`)
							.setAttribute("selected", "");
						if (path.id === "serverid-dm") {
							clearChannel();

							global.Guild = {};

							let chans = document.querySelector(
								"#channel-list .channel-existing"
							);

							while (chans.firstChild) {
								chans.removeChild(chans.lastChild);
							}

							global.openDMs.forEach((channel) => {
								if (!document.querySelector(`.channelid-${channel.id}`))
									displayChannel(channel);
							});

							if (!document.querySelector("#channel-list .channel-add")) {
								let ndmdiv = document.createElement("div");
								ndmdiv.classList.add("channel-add");
								ndmdiv.setAttribute("placeholder", "ID of User");
								let ndminp = document.createElement("input");
								let ndmbut = document.createElement("button");
								ndmbut.textContent = "Add";
								ndmdiv.append(ndminp);
								ndmdiv.append(ndmbut);
								document.querySelector("#channel-list").prepend(ndmdiv);
							}

							document
								.querySelector("#channel-list .channel-add button")
								.addEventListener("click", () => addUserFromInput());

							document
								.querySelector("#channel-list .channel-add input")
								.addEventListener("keypress", (e) => {
									if (e.code === "Enter") addUserFromInput();
								});
						} else {
							id = path.id.replace("serverid-", "");
							document
								.querySelectorAll(".server-existing [selected]")
								.forEach((s) => s.removeAttribute("selected"));
							document
								.querySelector(`#${path.id} .server-icon`)
								.setAttribute("selected", "");
							let addDm = document.querySelector("#channel-list .channel-add");
							if (addDm) addDm.remove();
						}
					}
				});

				if (id && id != global.Guild.id) {
					clearChannel();

					global.Guild = client.guilds.cache.get(id);

					client.channels.cache
						.filter(
							(c) => ["text", "news"].includes(c.type) && c.guild.id === id
						)
						.forEach((c) => {
							displayChannel(c);
						});
				}
			});

		document
			.querySelector("#channel-list .channel-existing")
			.addEventListener("click", (e) => {
				if (freezeClick) {
					return;
				}

				if (
					e.target.hasAttribute("class") &&
					Array.from(e.target.classList).includes("channel-item")
				) {
					if (Array.from(e.target.classList).includes("channel-newmessage"))
						e.target.classList.remove("channel-newmessage");

					global.notifChannels.splice(
						global.notifChannels.indexOf(
							e.target.id.replace("channelid-", ""),
							1
						)
					);
				}

				let id = null;
				e.composedPath().forEach((path) => {
					if (
						path.id &&
						path.id.includes("channelid") &&
						!path.attributes.getNamedItem("selected")
					) {
						id = path.id.replace("channelid-", "");
					}
				});

				if (id && id != global.Channel.id) {
					if (global.notifChannels.includes(id)) {
						global.notifChannels.splice(global.notifChannels.indexOf(id), 1);

						let classes = document.getElementById(`channelid-${id}`).classList;

						if (Array.from(classes).includes("channel-newmessage"))
							classes.remove("channel-newmessage");

						let guild = client.channels.cache.get(id).guild;
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

					global.Channel = client.channels.cache.get(id) || {};
					global.Before = 0;
					global.After = 0;
					global.loadedMore = 0;
					document.querySelector("#channel-open .channel-openinner").innerHTML =
						"";
					readChannel(id).catch(console.error);
				}
			});

		client.on("message", messageCreate);

		// Send and display message
		document
			.querySelector("#channel-open .channel-textboxcontain input.textbox")
			.addEventListener("keydown", (e) => {
				if (
					document
						.querySelector("#channel-open .channel-openinner")
						.hasAttribute("id") &&
					e.key === "Enter"
				) {
					global.Channel = client.channels.cache.get(
						document
							.querySelector(".channel-openinner")
							.id.replace("openid-", "")
					);
					if (global.Channel) {
						global.Channel.send(e.target.value);

						e.target.value = "";
					}
				}
			});
	};

	// Infinite scroll
	let inner = document.querySelector(".channel-openinner");
	if (inner) {
		inner.addEventListener(
			"scroll",
			_.throttle((e) => {
				if (inner.clientHeight < inner.scrollHeight && inner.scrollTop < 5000) {
					global.Channel = client.channels.cache.get(
						document
							.querySelector(".channel-openinner")
							.id.replace("openid-", "")
					);
					if (global.Channel) generateMessages(global.Channel);
				}
			}, 3000)
		);
	}
});
