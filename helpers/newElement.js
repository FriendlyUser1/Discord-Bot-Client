/**
 * Creates a new element with specified type, attributes and children
 * @param {string} tagname Type of element (h1, p, img, etc)
 * @param {obj} attributes The new element's attributes
 * @param {HTMLElement[]} children Elements to append to new element
 * @returns {HTMLElement} The new element
 */
export const newElement = (tagname, attributes = {}, children = []) => {
	const ele = Object.assign(document.createElement(tagname), attributes);
	children.forEach((child) => ele.append(child));
	return ele;
};
