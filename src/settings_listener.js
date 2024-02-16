/* global chrome */
const root = document.querySelector(':root');
const body = document.querySelector('body');

/* Listen for messages to update settings */
const options = ['note_size', 'note_padding', 'backdrop_opacity'];
chrome.runtime.onMessage.addListener(function (request) {
	console.log(request);

	if ('settings' in request) {
		options.forEach((option) => {
			const variable = `--setting_${option}`;
			const new_value = request.settings[option];
			if (option === 'note_size') {
				body.classList.toggle(
					'gkfs-fullscreen-custom-size',
					new_value < 100
				);
			}
			root.style.setProperty(variable, request.settings[input.name]);
			const input = document.querySelector(`input[name="${option}"]`);
			if (input) {
				input.value = new_value;
			}
		});
	}
});

chrome.storage.sync.get(data, resolve);

function updateSettings(settings) {
	document.querySelectorAll('input[name]').forEach((input) => {
		input.value = settings[input.name];
	});
}
