import { client } from "../index.js";
import { displayChannel } from "./index.js";

/**
 * Adds a user's dm
 */
export const addUserFromInput = () => {
	const newDM = (id) => {
		return new Promise(async (success, fail) => {
			let user = client.users.cache.get(String(id));
			if (user) user.createDM().then(success).catch(fail);
			else fail("User Not Found");
		});
	};

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

		let id = document.querySelector("#channel-list .channel-add input").value;
		if (id != "" && parseInt(id) && id.length === 18) {
			user = client.users
				.fetch(id)
				.then((user) => {
					if (user) {
						newDM(user.id)
							.then((c) => {
								if (!global.openDMs.includes(c)) global.openDMs.push(c);

								global.openDMs.forEach((channel) => {
									if (!document.querySelector(`.channelid-${c.id}`))
										displayChannel(channel);
								});
							})
							.catch((e) => {
								document
									.querySelector("#channel-list .channel-add input")
									.classList.add("error");
							});
						document.querySelector("#channel-list .channel-add input").value =
							"";
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
