export const addUserFromInput = () => {
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
