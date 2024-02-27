/* global chrome */

// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener(function (command) {
	// Pass the command to the content script on the active tab
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		chrome.tabs.sendMessage(tabs[0].id, { command: command });
	});
});

// Listen for messages
chrome.runtime.onMessage.addListener(function (request) {
	if (!('action' in request)) {
		return;
	}
	if (request.action === 'open-options') {
		chrome.runtime.openOptionsPage();
	}
});
