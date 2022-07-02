const { ipcRenderer } = require("electron"),
	Discord = require("discord.js"),
	client = new Discord.Client(),
	mentionRegex = /<(@|@!|@&|#)(\d{17,19})>/gi,
	_ = require("lodash");
var before = 0,
	after = 0,
	loadedMore = 0;
let Channel = null;

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
							return "@" + member.displayName;
						}
					} else {
						const user = client.users.cache.get(id);

						if (user) {
							return "@" + user.username;
						}
					}
					break;
				case "@&":
					if (msg instanceof Discord.GuildChannel) {
						const role = msg.guild.roles.get(id);

						if (role) {
							return "@" + role.name;
						}
					}
					return "@deleted-role";
				case "#":
					const channel = client.channels.cache.get(id);

					if (channel) {
						return "#" + channel.name;
					}
					return "#deleted-channel";
			}
		});

		return content;
	};

	const newChannel = () => {
		before = 0;
		after = 0;
		loadedMore = 0;
		document.querySelector("#channel-open .channel-openinner").innerHTML = "";
	};

	const fetchMessages = async (channel, options) => {
		// console.log(before);
		if (options.before === 0) {
			delete options.before;
		}

		return await channel.messages.fetch(options);
	};

	const displayMessage = (msg, append) => {
		let outerDiv = document.createElement("div"),
			innerImg = document.createElement("img"),
			innerSpan = document.createElement("span"),
			namedateSpan = document.createElement("span"),
			nameSpan = document.createElement("span"),
			dateSpan = document.createElement("span"),
			messageSpan = document.createElement("span");

		outerDiv.setAttribute("id", "messageid-" + msg.id);
		outerDiv.setAttribute("class", "channel-message");

		innerImg.setAttribute("src", msg.author.displayAvatarURL());
		innerImg.setAttribute("class", "channel-icon");

		innerSpan.setAttribute("class", "channel-text");

		namedateSpan.setAttribute("class", "channel-namedate");

		nameSpan.textContent = msg.author.username;
		nameSpan.setAttribute("class", "channel-name");
		nameSpan.setAttribute("id", "userid-" + msg.author.id);

		let today = new Date();
		let date =
			msg.createdAt.getDate() == today.getDate() &&
			msg.createdAt.getMonth() == today.getMonth() &&
			msg.createdAt.getFullYear() == today.getFullYear();
		if (date) {
			date = `Today at ${msg.createdAt.toLocaleTimeString().slice(0, -3)}`;
			console.log(msg.createdAt.toString().slice(0, 15));
			console.log(new Date(today.getFullYear(), today.getMonth(), 0));
		} else if (
			msg.createdAt.getDate() == today.getDate() - 1 &&
			(msg.createdAt.getMonth() == today.getMonth() ||
				msg.createdAt.toString().slice(0, 15) ==
					new Date(today.getFullYear(), today.getMonth(), 0)
						.toString()
						.slice(0, 15))
		)
			date = `Yesterday at ${msg.createdAt.toLocaleTimeString().slice(0, -3)}`;
		else date = msg.createdAt.toLocaleDateString();

		dateSpan.textContent = date;
		dateSpan.setAttribute("class", "channel-date");

		messageSpan.textContent = parseMessage(msg);
		messageSpan.setAttribute("class", "channel-content");

		namedateSpan.appendChild(nameSpan);
		namedateSpan.appendChild(dateSpan);
		innerSpan.appendChild(namedateSpan);
		innerSpan.appendChild(messageSpan);

		outerDiv.appendChild(innerImg);
		outerDiv.appendChild(innerSpan);

		if (append)
			document.getElementById("openid-" + msg.channel.id).append(outerDiv);
		else document.getElementById("openid-" + msg.channel.id).prepend(outerDiv);
	};

	const displayServer = (guild) => {
		if (!document.querySelector("#serverid-" + guild.id)) {
			let outerDiv = document.createElement("div"),
				innerImg = document.createElement("img"),
				tooltip = document.createElement("div"),
				tooltipspan = document.createElement("span");

			let info = {
				name: guild.name,
				icon: guild.icon
					? guild.iconURL()
					: `https://textoverimage.moesif.com/image?image_url=https://github.com/FriendlyUser1/apis/blob/364c4bd2f4458af085752af557c1ea5837b95baa/dbcguild.png?raw=true&text=${guild.nameAcronym}&x_align=center&y_align=middle&text_size=128`,
			};

			tooltip.className = "tooltip";
			tooltipspan.className = "tooltiptext";
			tooltipspan.textContent = info.name;
			tooltip.append(tooltipspan);

			innerImg.setAttribute("src", info.icon);
			innerImg.className = "server-icon";

			outerDiv.id = `serverid-${guild.id}`;
			outerDiv.className = "server-item";
			outerDiv.append(innerImg);

			document.querySelector(".server-existing").append(outerDiv);
		}
	};

	const displayChannel = (channel) => {
		if (channel) {
			let perms = channel.permissionsFor(client.user).toArray();
			if (
				perms.includes("VIEW_CHANNEL") &&
				perms.includes("READ_MESSAGE_HISTORY")
			) {
				if (!document.querySelector("#channelid-" + channel.id)) {
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

					outerDiv.setAttribute("id", "channelid-" + channel.id);
					outerDiv.setAttribute(
						"class",
						"channel-item " +
							(channel.type === "dm" ? "channel-dm" : "channel-guild")
					);

					if (info.icon) {
						let innerImg = document.createElement("img");
						innerImg.setAttribute("src", info.icon);
						innerImg.setAttribute("class", "channel-icon");
					}

					innerSpan.setAttribute("class", "channel-text");

					titleSpan.textContent =
						(channel.type === "dm" ? "@" : "#") + info.name;
					titleSpan.setAttribute("class", "channel-title");

					innerSpan.appendChild(titleSpan);
					innerSpan.appendChild(recipientsSpan);

					outerDiv.appendChild(innerImg);
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
			}

			document
				.querySelector("#channel-list .channel-existing")
				.addEventListener("click", (e) => {
					if (e.target.hasAttribute("class")) {
						let classes = e.target.getAttribute("class").split(" ");
						if (classes.includes("channel-newmessage")) {
							classes.splice(classes.indexOf("channel-newmessage"), 1);
							e.target.setAttribute("class", classes.join(" "));
						}
					}
				});

			document
				.querySelector("#channel-open .channel-openinner")
				.setAttribute("id", "openid-" + channel.id);

			// console.log("messages: " + messages.slice(0, 10));

			messages.forEach((msg) => {
				displayMessage(msg, false);
			});
			// console.log("after: " + after);
			// console.log("before: " + before);
			if (after != 0 && loadedMore === 0) {
				document
					.getElementById(`messageid-${after}`)
					.scrollIntoView({ behaviour: "smooth", block: "end" });
				console.log("scrolled");
			}

			// console.log("displayed");
			return messages;
		});
	};

	const readChannel = (id) => {
		return new Promise(function (success, fail) {
			let channel = client.channels.cache.get(id);
			if (channel) {
				let perms = channel.permissionsFor(client.user).toArray();
				if (
					perms.includes("VIEW_CHANNEL") &&
					perms.includes("READ_MESSAGE_HISTORY")
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
									? "@" + channel.recipient.username
									: "#" + channel.name
							}`
						);
					document
						.querySelectorAll("[selected]")
						.forEach((s) => s.removeAttribute("selected"));
					document
						.querySelector(
							"#channel-list .channel-existing #channelid-" + channel.id
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

		// let channelList = client.channels.cache.filter(
		// 	(c) => ["dm", "text", "news"].includes(c.type)
		// );

		// channelList.forEach((c) => {
		// 	displayChannel(c);
		// });

		let serverList = client.guilds.cache;

		serverList.forEach((s) => {
			displayServer(s);
		});

		document
			.querySelector("#channel-list .channel-existing")
			.addEventListener("click", (e) => {
				let id = null;
				e.path.every((path) => {
					if (path === document.body) return false;
					else if (
						path.getAttribute("class") &&
						path.getAttribute("class").split(" ").includes("channel-item")
					)
						id = path
							.getAttribute("id")
							.split(" ")[0]
							.replace("channelid-", "");
				});

				if (id) {
					newChannel();
					readChannel(id).catch(console.error);
				}
			});

		const addUserFromInput = () => {
			//add user
			if (document.querySelector("#channel-list .channel-add input").value) {
				let id = document.querySelector(
					"#channel-list .channel-add input"
				).value;
				if (typeof id === "string") id = client.users.find("tag", id).id;
				createDM(id).then(displayChannel());
				document.querySelector("#channel-list .channel-add input").value = "";
			}
		};
		document
			.querySelector("#channel-list .channel-add span")
			.addEventListener("click", addUserFromInput);
		document
			.querySelector("#channel-list .channel-add input")
			.addEventListener("keypress", (e) => {
				if (e.code === "Enter") addUserFromInput();
			});

		client.on("message", (message) => {
			if (
				["dm", "text", "news"].includes(message.channel.type) &&
				message.author.id !== client.user.id
			) {
				let id = message.channel.id;

				let activeDM =
					document
						.querySelector("#channel-open .channel-openinner")
						.hasAttribute("id") &&
					id ===
						document
							.querySelector("#channel-open .channel-openinner")
							.getAttribute("id")
							.replace("openid-", "");

				if (activeDM) {
					displayMessage(message, true);
					document
						.getElementById(`messageid-${message.id}`)
						.scrollIntoView({ behaviour: "smooth", block: "end" });
				} else if (!document.getElementById("channelid-" + id))
					displayChannel(message.channel);

				if (!activeDM || !windowActive) {
					if (!activeDM) {
						console.log("channelid-" + message.author.id);
						let DMInList = document.getElementById(
								"channelid-" + message.channel.id
							),
							classes = DMInList.getAttribute("class");
						classes = classes.split(" ");
						if (classes.includes("channel-newmessage")) {
							classes.push("channel-newmessage");
							DMInList.setAttribute("class", classes.join(" "));
						}
					}

					let notif = new Notification(
						message.guild.member(message.author).displayName,
						{
							body: message.content,
							icon: message.author.displayAvatarURL(),
						}
					);

					notif.onclick = () => {
						console.log(activeDM, message.channel.id);
						if (!activeDM) {
							Channel = message.channel;
							newChannel();
							readChannel(message.channel.id).catch(console.error);
						}
					};
				}
			}
		});

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
