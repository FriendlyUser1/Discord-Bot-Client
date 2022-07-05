const { ipcRenderer } = require("electron"),
	Discord = require("discord.js"),
	client = new Discord.Client(),
	mentionRegex = /<(@|@!|@&|#)(\d{17,19})>/gi,
	_ = require("lodash");
var before = 0,
	after = 0,
	loadedMore = 0;
let Channel = {},
	Guild = {},
	notifChannels = [],
	openDMs = [];

addEventListener("load", () => {
	let windowActive = document.hidden;
	addEventListener("focus", () => (windowActive = true));
	addEventListener("blur", () => (windowActive = false));

	ipcRenderer.on("token", (event, arg) => {
		client.on("ready", start);
		client.login(arg);
	});
	ipcRenderer.send("ready");

	const parseMessage = (msg) => {
		let content = msg.content;

		content = content.replace(mentionRegex, (match, type, id) => {
			switch (type) {
				case "@":
				case "@!":
					if (msg instanceof Discord.GuildChannel) {
						const member = msg.guild.members.get(id);

						if (member) {
							return `@${member.displayName}`;
						}
					} else {
						const user = client.users.cache.get(id);

						if (user) {
							return `@${user.username}`;
						}
					}
					break;
				case "@&":
					if (msg instanceof Discord.GuildChannel) {
						const role = msg.guild.roles.get(id);

						if (role) {
							return `@${role.name}`;
						}
					}
					return "@deleted-role";
				case "#":
					const channel = client.channels.cache.get(id);

					if (channel) {
						return `#${channel.name}`;
					}
					return "#deleted-channel";
			}
		});

		return content;
	};

	const newElement = (tagname, attributes = {}, children = []) => {
		const ele = Object.assign(document.createElement(tagname), attributes);
		children.forEach((child) => ele.appendChild(child));
		return ele;
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

	const clearChannel = () => {
		document.querySelector("#channel-list .channel-existing").innerHTML = "";
		document.querySelector(".channel-guildtopname .channel-name").innerHTML =
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

		let outerDiv = newElement("div", {
				id: `messageid-${message.id}`,
				className: "channel-message",
			}),
			innerImg = newElement("img", {
				src: message.author.displayAvatarURL(),
				className: "channel-icon",
			}),
			headerSpan = newElement("div", { className: "channel-header" }),
			timestampSpan = newElement("span", {
				className: "timestamp",
				textContent: date,
			}),
			messageSpan = document.createElement("span"),
			innerSpan = newElement("div", { className: "channel-text" }),
			nameSpan = newElement("span", {
				id: `userid-${message.author.id}`,
				className: "channel-name",
				textContent: message.author.tag,
			});

		messageSpan.textContent = parseMessage(message);
		messageSpan.setAttribute("class", "channel-content");

		headerSpan.appendChild(nameSpan);
		headerSpan.appendChild(timestampSpan);

		innerSpan.appendChild(headerSpan);
		innerSpan.appendChild(messageSpan);

		outerDiv.appendChild(innerImg);
		outerDiv.appendChild(innerSpan);
		// outerDiv.appendChild(headerSpan);
		// outerDiv.appendChild(messageSpan);

		if (append)
			document.getElementById(`openid-${message.channel.id}`).append(outerDiv);
		else
			document.getElementById(`openid-${message.channel.id}`).prepend(outerDiv);
	};

	const displayServer = (guild) => {
		if (!document.querySelector(`#serverid-${guild.id}`)) {
			let outerDiv = document.createElement("div"),
				innerImg = document.createElement("img");

			let info = {
				name: guild.name,
				icon: guild.icon
					? guild.iconURL()
					: `https://textoverimage.moesif.com/image?image_url=https://github.com/FriendlyUser1/apis/blob/364c4bd2f4458af085752af557c1ea5837b95baa/dbcguild.png?raw=true&text=${guild.nameAcronym}&x_align=center&y_align=middle&text_size=128`,
			};

			innerImg.setAttribute("src", info.icon);
			innerImg.setAttribute("title", info.name);
			innerImg.className = "server-icon";

			outerDiv.id = `serverid-${guild.id}`;
			outerDiv.className = "server-item";
			outerDiv.append(innerImg);

			document.querySelector(".server-existing").append(outerDiv);
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
					let outerDiv = document.createElement("div"),
						innerSpan = document.createElement("span"),
						titleSpan = document.createElement("span");

					let info = {};

					if (channel.type === "dm")
						info = {
							icon: channel.recipient.avatarURL(),
							name: channel.recipient.username,
						};
					else {
						info = {
							name: channel.name,
						};
					}

					outerDiv.setAttribute("id", `channelid-${channel.id}`);
					outerDiv.setAttribute(
						"class",
						`channel-item ${
							channel.type === "dm" ? "channel-dm" : "channel-guild"
						}${notifChannels.includes(channel.id) ? " channel-newmessage" : ""}`
					);

					if (info.icon) {
						let innerImg = document.createElement("img");
						innerImg.setAttribute("src", info.icon);
						innerImg.setAttribute("class", "channel-icon");
						outerDiv.appendChild(innerImg);
					}

					innerSpan.setAttribute("class", "channel-text");

					titleSpan.textContent = `${channel.type === "dm" ? "@" : "#"}${
						info.name
					}`;
					titleSpan.setAttribute("class", "channel-title");

					innerSpan.appendChild(titleSpan);

					outerDiv.appendChild(innerSpan);

					document
						.querySelector("#channel-list .channel-existing")
						.prepend(outerDiv);
				}
			}
		}
	};

	const displayMore = async (channel) => {
		fetchMessages(channel, { limit: 100, before: before }).then((messages) => {
			messages = Array.from(messages.values());

			if (messages.length > 0) {
				if (before != 0) loadedMore++;
				before = messages[messages.length - 1].id;
				after = messages[0].id;

				document
					.querySelector("#channel-list .channel-existing")
					.addEventListener("click", (e) => {
						if (
							e.target.hasAttribute("class") &&
							Array.from(e.target.classList).includes("channel-item")
						) {
							handleChannelNotif(e.target, true);
							notifChannels.splice(
								notifChannels.indexOf(e.target.id.replace("channelid-", ""), 1)
							);
						}
					});

				document
					.querySelector("#channel-open .channel-openinner")
					.setAttribute("id", `openid-${channel.id}`);

				messages.forEach((msg) => {
					displayMessage(msg, false);
				});
				if (after != 0 && loadedMore === 0) {
					document
						.getElementById(`messageid-${after}`)
						.scrollIntoView({ behaviour: "smooth", block: "end" });
				}
				return messages;
			}
		});
	};

	const readChannel = (id) => {
		return new Promise(function (success, fail) {
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
					document.querySelector(".channel-name").innerHTML = channel.recipient
						? channel.recipient.username
						: channel.name;
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
						.querySelectorAll("[selected]")
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
		return new Promise(async function (success, fail) {
			let user = client.users.cache.get(String(id));
			if (user) user.createDM().then(success).catch(fail);
			else fail("User Not Found");
		});
	};

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
				e.path.forEach((path) => {
					if (path.id && path.id.includes("serverid")) {
						Channel = {};
						if (path.id === "serverid-dm") {
							clearChannel();

							Guild = {};

							let chans = document.querySelector(
								"#channel-list .channel-existing"
							);

							while (chans.firstChild) {
								chans.removeChild(chans.lastChild);
							}

							if (!document.querySelector("#channel-list .channel-add")) {
								let ndmdiv = document.createElement("div");
								ndmdiv.className = "channel-add";
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
				let id = null;
				e.path.forEach((path) => {
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
						.getAttribute("class")
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
											.setAttribute("class", "error");
									});
								document.querySelector(
									"#channel-list .channel-add input"
								).value = "";
							}
						})
						.catch((e) => {
							document
								.querySelector("#channel-list .channel-add input")
								.setAttribute("class", "error");
						});
				}
			}
		};

		client.on("message", (message) => {
			if (["text", "news", "dm"].includes(message.channel.type)) {
				let id = message.channel.id;
				if (message.author.id !== client.user.id && !notifChannels.includes(id))
					notifChannels.push(id);
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

				if (activeChannel) {
					displayMessage(message, true);
					after = message.id;
					document
						.getElementById(`messageid-${message.id}`)
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
					if (message.guild) {
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
								body: message.content,
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
								}
							});
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
						Channel.send(e.target.value).then((message) => {
							displayMessage(message, true);
						});

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
