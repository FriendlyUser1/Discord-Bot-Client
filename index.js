const { ipcRenderer } = require("electron"),
	Discord = require("discord.js"),
	client = new Discord.Client(),
	mentionRegex = /<(@|@!|@&|#)(\d{17,19})>/gi,
	_ = require("lodash");
var before = 0;
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

	const fetchMessages = async (channel, options) => {
		console.log(before);
		if (options.before === 0) {
			delete options.before;
		}

		return await channel.messages.fetch(options);
	};

	const displayMessage = (msg) => {
		let outerDiv = document.createElement("div"),
			innerImg = document.createElement("img"),
			innerSpan = document.createElement("span"),
			namedateSpan = document.createElement("span"),
			nameSpan = document.createElement("span"),
			dateSpan = document.createElement("span"),
			messageSpan = document.createElement("span");

		outerDiv.setAttribute("id", "messageid-" + msg.id);
		outerDiv.setAttribute("class", "dm-message");

		innerImg.setAttribute("src", msg.author.displayAvatarURL());
		innerImg.setAttribute("class", "dm-icon");

		innerSpan.setAttribute("class", "dm-text");

		namedateSpan.setAttribute("class", "dm-namedate");

		nameSpan.textContent = msg.author.username;
		nameSpan.setAttribute("class", "dm-name");
		nameSpan.setAttribute("id", "userid-" + msg.author.id);

		dateSpan.textContent = msg.createdTimestamp;
		dateSpan.setAttribute("class", "dm-date");

		messageSpan.textContent = parseMessage(msg);
		messageSpan.setAttribute("class", "dm-content");

		namedateSpan.appendChild(nameSpan);
		namedateSpan.appendChild(dateSpan);

		innerSpan.appendChild(namedateSpan);
		innerSpan.appendChild(messageSpan);

		outerDiv.appendChild(innerImg);
		outerDiv.appendChild(innerSpan);

		document.getElementById("openid-" + msg.channel.id).append(outerDiv);
	};

	const displayChannel = (channel) => {
		if (channel) {
			let perms = channel.permissionsFor(client.user).toArray();
			if (
				perms.includes("VIEW_CHANNEL") &&
				perms.includes("READ_MESSAGE_HISTORY")
			) {
				if (!document.querySelector("#channelid-" + channel.id)) {
					let outterDiv = document.createElement("div"),
						innerImg = document.createElement("img"),
						innerSpan = document.createElement("span"),
						titleSpan = document.createElement("span"),
						recipientsSpan = document.createElement("span");

					let info = {};

					if (channel.type === "dm")
						info = {
							icon: channel.recipient.avatarURL(),
							name: channel.recipient.username,
							length: 1,
						};
					else {
						info = {
							icon: channel.guild.icon
								? channel.guild.iconURL()
								: `https://textoverimage.moesif.com/image?image_url=https://raw.githubusercontent.com/FriendlyUser1/apis/3c101df160908315c27a9143a0653dbe23edfe53/Untitled.png&text=${channel.guild.nameAcronym}&x_align=center&y_align=middle&text_size=128`,
							name: channel.name,
							length: channel.members.length,
						};
					}

					outterDiv.setAttribute("id", "channelid-" + channel.id);
					outterDiv.setAttribute(
						"class",
						"dm-item " + (channel.type === "group" ? "dm-group" : "dm-user")
					);

					if (info.icon) innerImg.setAttribute("src", info.icon);
					innerImg.setAttribute("class", "dm-icon");

					innerSpan.setAttribute("class", "dm-text");

					titleSpan.textContent = info.name;
					titleSpan.setAttribute("class", "dm-title");

					recipientsSpan.textContent = info.length;
					recipientsSpan.setAttribute("class", "dm-recipientcount");

					innerSpan.appendChild(titleSpan);
					innerSpan.appendChild(recipientsSpan);

					outterDiv.appendChild(innerImg);
					outterDiv.appendChild(innerSpan);

					document.querySelector("#dm-list .dm-existing").prepend(outterDiv);
				}
			}
		}
	};

	const displayMore = async (channel, id) => {
		fetchMessages(channel, { limit: 100, before: before }).then((messages) => {
			messages = Array.from(messages.values());
			var rev = messages.reverse();

			if (messages.length > 0) {
				before = rev[0].id;
			}

			document
				.querySelector("#dm-list .dm-existing")
				.addEventListener("click", (e) => {
					if (e.target.hasAttribute("class")) {
						let classes = e.target.getAttribute("class").split(" ");
						if (classes.includes("dm-newmessage")) {
							classes.splice(classes.indexOf("dm-newmessage"), 1);
							e.target.setAttribute("class", classes.join(" "));
						}
					}
				});

			document
				.querySelector("#dm-open .dm-openinner")
				.setAttribute("id", "openid-" + id);
			document.querySelector("#dm-open .dm-openinner").innerHTML = "";

			rev.forEach((msg) => {
				displayMessage(msg);
			});

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
						.querySelectorAll("[selected]")
						.forEach((s) => s.removeAttribute("selected"));
					document
						.querySelector("#dm-list .dm-existing #channelid-" + channel.id)
						.setAttribute("selected", "");

					var messages = displayMore(channel, id);
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

		let channelList = client.channels.cache.filter(
			(c) => ["dm", "text", "news"].includes(c.type)
			// console.log(c.name);
		);

		channelList.forEach((c) => {
			displayChannel(c);
		});

		document
			.querySelector("#dm-list .dm-existing")
			.addEventListener("click", (e) => {
				//read dm
				let id = null;
				e.path.every((path) => {
					if (path === document.body) return false;
					else if (
						path.getAttribute("class") &&
						path.getAttribute("class").split(" ").includes("dm-item")
					)
						id = path
							.getAttribute("id")
							.split(" ")[0]
							.replace("channelid-", "");
				});

				if (id) {
					before = 0;
					readChannel(id).catch(console.error);
				}
			});

		const addUserFromInput = () => {
			//add user
			if (document.querySelector("#dm-list .dm-add input").value) {
				let id = document.querySelector("#dm-list .dm-add input").value;
				if (typeof id === "string") id = client.users.find("tag", id).id;
				createDM(id).then(displayChannel());
				document.querySelector("#dm-list .dm-add input").value = "";
			}
		};
		document
			.querySelector("#dm-list .dm-add span")
			.addEventListener("click", addUserFromInput);
		document
			.querySelector("#dm-list .dm-add input")
			.addEventListener("keypress", (e) => {
				if (e.code === "Enter") addUserFromInput();
			});

		client.on("message", (message) => {
			if (
				["dm", "group"].includes(message.channel.type) &&
				message.author.id !== client.user.id
			) {
				let id = message.channel.id;

				let activeDM =
					document.querySelector("#dm-open .dm-openinner").hasAttribute("id") &&
					id ===
						document
							.querySelector("#dm-open .dm-openinner")
							.getAttribute("id")
							.replace("openid-", "");

				if (activeDM) displayMessage(message, id);
				else if (!document.getElementById("channelid-" + id))
					displayChannel(message.channel);

				if (!activeDM || !windowActive) {
					if (!activeDM) {
						console.log("channelid-" + message.author.id);
						let DMInList = document.getElementById(
								"channelid-" + message.channel.id
							),
							classes = DMInList.getAttribute("class");
						classes = classes.split(" ");
						if (classes.includes("dm-newmessage")) {
							classes.push("dm-newmessage");
							DMInList.setAttribute("class", classes.join(" "));
						}
					}

					let notif = new Notification(
						message.author.username + "#" + message.author.discriminator,
						{
							body: message.content,
							icon: message.author.displayAvatarURL(),
						}
					);

					notif.onclick = () => {
						console.log(activeDM, message.channel.id);
						if (!activeDM) {
							Channel = message.channel;
							readChannel(message.channel.id).catch(console.error);
						}
					};
				}
			}
		});

		document
			.querySelector("#dm-open .dm-textboxcontain input.textbox")
			.addEventListener("keydown", (e) => {
				if (
					document.querySelector("#dm-open .dm-openinner").hasAttribute("id") &&
					e.key === "Enter"
				) {
					Channel = client.channels.cache.get(
						document.querySelector(".dm-openinner").id.replace("openid-", "")
					);
					if (Channel) {
						Channel.send(e.target.value).then((message) => {
							displayMessage(message);
						});

						e.target.value = "";
					}
				}
			});
	};

	let inner = document.querySelector(".dm-openinner");
	if (inner) {
		inner.addEventListener(
			"scroll",
			_.throttle((e) => {
				if (inner.clientHeight < inner.scrollHeight && inner.scrollTop < 200) {
					Channel = client.channels.cache.get(
						document.querySelector(".dm-openinner").id.replace("openid-", "")
					);
					if (Channel) displayMore(Channel, Channel.id);
				}
			}, 3000)
		);
	}
});
