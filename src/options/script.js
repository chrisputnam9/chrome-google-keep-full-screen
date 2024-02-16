/* global chrome */

/* Listen for form submit and update settings */
document.querySelector('form').addEventListener('submit', function (event) {
	event.preventDefault();
	const settings = {};
	this.querySelectorAll('input[name]').forEach((input) => {
		settings[input.name] = parseInt(input.value);
	});
	chrome.storage.sync.set({
		settings: settings,
	});
});
