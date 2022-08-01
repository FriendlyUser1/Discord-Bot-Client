/**
 * Prepares the document to render new channel content
 */
export const clearChannel = () => {
	document.querySelector("#channel-list .channel-existing").innerHTML = "";
	document.querySelector(".channel-guildtopname .channel-name").innerHTML = "";
	document.querySelector(".channel-guildtopname .channel-topic").innerHTML = "";
	let oi = document.querySelector(".channel-openinner");
	oi.id = "";
	oi.innerHTML = "";

	let textbox = document.querySelector(".channel-textboxcontain .textbox");

	if (textbox.hasAttribute("placeholder"))
		textbox.removeAttribute("placeholder");
};
