import { parseMessage, newElement } from "./helpers/index.js";
const { ipcRenderer } = require("electron"),
	Discord = require("discord.js"),
	client = new Discord.Client(),
	_ = require("lodash");

let before = 0,
	after = 0,
	loadedMore = 0,
	Channel = {},
	Guild = {},
	notifChannels = [],
	openDMs = [],
	freezeClick = false;

addEventListener("load", () => {
	let windowActive = document.hidden;
	addEventListener("focus", () => (windowActive = true));
	addEventListener("blur", () => (windowActive = false));

	ipcRenderer.on("token", (event, arg) => {
		client.on("ready", start);
		client.login(arg);
	});
	ipcRenderer.send("ready");

	const trunc = (string) => {
		if (string.length < 20) return string;
		return string.substring(0, 20) + "...";
	};

	const newChannel = () => {
		before = 0;
		after = 0;
		loadedMore = 0;
		document.querySelector("#channel-open .channel-openinner").innerHTML = "";
	};

	const displayChannels = (id) => {
		let channelList = client.channels.cache.filter(
			(c) => ["text", "news"].includes(c.type) && c.guild.id === id
		);

		channelList.forEach((c) => {
			displayChannel(c);
		});
	};

	const handleChannelNotif = (channelInList, remove) => {
		let classes = channelInList.classList;

		if (remove && Array.from(classes).includes("channel-newmessage"))
			classes.remove("channel-newmessage");

		if (!remove && !Array.from(classes).includes("channel-newmessage"))
			classes.add("channel-newmessage");
	};

	const removeServerNotif = (id) => {
		let guild = client.channels.cache.get(id).guild;
		let channels = Array.from(guild.channels.cache).map((x) => {
			return x[0];
		});
		// console.log(channels.filter((element) => notifChannels.includes(element)));
		if (
			channels.filter((element) => notifChannels.includes(element)).length == 0
		)
			document
				.querySelector(`#serverid-${guild.id} img`)
				.removeAttribute("servernotif");
	};

	const clearChannel = () => {
		document.querySelector("#channel-list .channel-existing").innerHTML = "";
		document.querySelector(".channel-guildtopname .channel-name").innerHTML =
			"";
		document.querySelector(".channel-guildtopname .channel-topic").innerHTML =
			"";
		let oi = document.querySelector(".channel-openinner");
		oi.id = "";
		oi.innerHTML = "";

		let textbox = document.querySelector(".channel-textboxcontain .textbox");

		if (textbox.hasAttribute("placeholder"))
			textbox.removeAttribute("placeholder");
	};

	const fetchMessages = async (channel, options) => {
		if (options.before === 0) {
			delete options.before;
		}

		return await channel.messages.fetch(options);
	};

	const displayMessage = (message, append) => {
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

		messageSpan.prepend(parseMessage(message, client, false));
	};

	const displayServer = (guild) => {
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

	const displayChannel = (channel) => {
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
				if (!document.querySelector(`#channelid-${channel.id}`)) {
					let titleSpan = newElement("div", {
							className: "channel-title",
							textContent: `${channel.type === "dm" ? "@ " : "# "}${
								channel.type === "dm"
									? channel.recipient.username
									: trunc(channel.name)
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
									notifChannels.includes(channel.id)
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

	const displayMore = async (channel) => {
		fetchMessages(channel, { limit: 100, before: before }).then(
			async (messages) => {
				messages = Array.from(messages.values());

				if (messages.length > 0) {
					if (before != 0) loadedMore++;
					before = parseInt(messages[messages.length - 1].id);
					after = messages[0].id;

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

					if (after != 0 && loadedMore === 0) {
						freezeClick = true;
						await new Promise((r) => setTimeout(r, 75));
						document
							.getElementById("scroll-el")
							.scrollIntoView({ behaviour: "smooth", block: "end" });
						freezeClick = false;
					}
					return messages;
				}
			}
		);
	};

	const readChannel = (id) => {
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
					document.querySelector(".channel-name").innerHTML = `# ${
						channel.recipient ? channel.recipient.username : channel.name
					}`;
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

					var messages = displayMore(channel);
					success({ messages, channel });
				}
			}
		});
	};

	const createDM = (id) => {
		return new Promise(async (success, fail) => {
			let user = client.users.cache.get(String(id));
			if (user) user.createDM().then(success).catch(fail);
			else fail("User Not Found");
		});
	};

	const start = () => {
		// console.clear();
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
						Channel = {};
						document
							.querySelectorAll(".server-existing [selected]")
							.forEach((s) => s.removeAttribute("selected"));
						document
							.querySelector(`#${path.id} .server-icon`)
							.setAttribute("selected", "");
						if (path.id === "serverid-dm") {
							clearChannel();

							Guild = {};

							let chans = document.querySelector(
								"#channel-list .channel-existing"
							);

							while (chans.firstChild) {
								chans.removeChild(chans.lastChild);
							}

							openDMs.forEach((channel) => {
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

				if (id && id != Guild.id) {
					clearChannel();

					Guild = client.guilds.cache.get(id);

					displayChannels(id);
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
					handleChannelNotif(e.target, true);
					notifChannels.splice(
						notifChannels.indexOf(e.target.id.replace("channelid-", ""), 1)
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

				if (id && id != Channel.id) {
					if (notifChannels.includes(id)) {
						notifChannels.splice(notifChannels.indexOf(id), 1);
						handleChannelNotif(
							document.getElementById(`channelid-${id}`),
							true
						);

						removeServerNotif(id);
					}

					Channel = client.channels.cache.get(id) || {};
					newChannel();
					readChannel(id).catch(console.error);
				}
			});

		const addUserFromInput = () => {
			if (document.querySelector("#channel-list .channel-add input").value) {
				if (
					document
						.querySelector("#channel-list .channel-add input")
						.hasAttribute("class")
				) {
					document
						.querySelector("#channel-list .channel-add input")
						.removeAttribute("class");
				}

				let id = document.querySelector(
					"#channel-list .channel-add input"
				).value;
				if (id != "" && parseInt(id) && id.length === 18) {
					user = client.users
						.fetch(id)
						.then((user) => {
							if (user) {
								createDM(user.id)
									.then((c) => {
										if (!openDMs.includes(c)) openDMs.push(c);

										openDMs.forEach((channel) => {
											if (!document.querySelector(`.channelid-${c.id}`))
												displayChannel(channel);
										});
									})
									.catch((e) => {
										document
											.querySelector("#channel-list .channel-add input")
											.classList.add("error");
									});
								document.querySelector(
									"#channel-list .channel-add input"
								).value = "";
							}
						})
						.catch((e) => {
							document
								.querySelector("#channel-list .channel-add input")
								.classList.add("error");
						});
				}
			}
		};

		client.on("message", async (message) => {
			if (["text", "news", "dm"].includes(message.channel.type)) {
				if (
					!document.querySelector(
						`.server-existing #serverid-${message.guild.id}`
					)
				)
					displayServer(message.guild);

				let id = message.channel.id;

				if (message.channel.type === "dm" && !openDMs.includes(message.channel))
					openDMs.push(message.channel);

				let activeChannel =
					document
						.querySelector("#channel-open .channel-openinner")
						.hasAttribute("id") &&
					id ===
						document
							.querySelector("#channel-open .channel-openinner")
							.getAttribute("id")
							.replace("openid-", "");

				if (
					message.author.id !== client.user.id &&
					!notifChannels.includes(id) &&
					!activeChannel
				)
					notifChannels.push(id);

				let activeServer = document
					.querySelector(`.server-existing #serverid-${message.guild.id} img`)
					.hasAttribute("selected");

				if (!activeServer) {
					document
						.querySelector(`#serverid-${message.guild.id} img`)
						.setAttribute("servernotif", "");
				}

				if (activeChannel) {
					displayMessage(message, true);
					after = parseInt(message.id);
					await new Promise((r) => setTimeout(r, 500));
					document
						.getElementById("scroll-el")
						.scrollIntoView({ behaviour: "smooth", block: "end" });
				} else if (
					!document.getElementById(`channelid-${id}`) &&
					Guild === message.guild
				)
					displayChannel(message.channel);

				if (
					(!activeChannel || !windowActive) &&
					message.author.id !== client.user.id
				) {
					if (!activeChannel && Guild === message.guild) {
						handleChannelNotif(
							document.getElementById(`channelid-${message.channel.id}`),
							false
						);
					}

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
								body: parseMessage(message, client, true),
								icon: message.author.displayAvatarURL(),
							}
						);
					} else {
						notif = new Notification(message.author.tag, {
							body: message.content,
							icon: message.author.displayAvatarURL(),
						});
					}

					notif.onclick = () => {
						if (!activeChannel) {
							Channel = message.channel;
							if (!activeServer) {
								if (document.querySelector(`.server-item [selected]`))
									document
										.querySelector(`.server-item [selected]`)
										.removeAttribute("selected");
								document
									.querySelector(`#serverid-${message.guild.id} img`)
									.setAttribute("selected", "");
							}
							Guild = message.guild ?? {};
							newChannel();
							clearChannel();

							if (message.guild) displayChannels(message.guild.id);
							else {
								openDMs.forEach((c) => {
									displayChannel(c);
								});
							}

							readChannel(Channel.id).catch(console.error);
							notifChannels = notifChannels.splice(
								notifChannels.indexOf(Channel.id),
								1
							);
							Array.from(
								document.getElementsByClassName("channel-newmessage")
							).forEach((e) => {
								if (notifChannels.includes(e.id.replace("channelid-", ""))) {
									e.classList.remove("channel-newmessage");
									notifChannels.splice(
										notifChannels.indexOf(e.id.replace("channelid-", "")),
										1
									);
								}
							});
							removeServerNotif(Channel.id);
						}
					};
				}
			}
		});

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
					Channel = client.channels.cache.get(
						document
							.querySelector(".channel-openinner")
							.id.replace("openid-", "")
					);
					if (Channel) {
						Channel.send(e.target.value);

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
					Channel = client.channels.cache.get(
						document
							.querySelector(".channel-openinner")
							.id.replace("openid-", "")
					);
					if (Channel) displayMore(Channel);
				}
			}, 3000)
		);
	}
});
