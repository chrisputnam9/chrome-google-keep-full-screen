/* global chrome */
const root = document.querySelector(':root');
const body = document.querySelector('body');

/* Listen for changes settings */
chrome.storage.onChanged.addListener(function (changes, area) {
	if (area !== 'sync' || !('settings' in changes)) {
		return;
	}

	const settings = changes.settings.newValue;

	updateSettingsOnPage(settings);
});

/* On load, get initial settings */
chrome.storage.sync.get('settings', function (data) {
	if (!('settings' in data)) {
		return;
	}

	updateSettingsOnPage(data.settings);
});

function updateSettingsOnPage(settings) {
	for (const option_name in settings) {
		const option_value = settings[option_name];

		// Toggle custom size based on note_size
		if (option_name === 'note_size') {
			body.classList.toggle(
				'gkfs-fullscreen-custom-size',
				option_value < 100
			);
		}

		// Set the CSS variable
		const variable = `--setting_${option_name}`;
		root.style.setProperty(variable, option_value);

		// Set the input value
		const input = document.querySelector(`input[name="${option_name}"]`);
		if (input) {
			input.value = option_value;
		}
	}
}

const options = ['note_size', 'note_padding', 'backdrop_opacity'];
chrome.runtime.onMessage.addListener(function (request) {
	console.log(request);

	if ('settings' in request) {
		options.forEach((option) => {
			const variable = `--setting_${option}`;
			const new_value = request.settings[option];
			root.style.setProperty(variable, request.settings[input.name]);
			const input = document.querySelector(`input[name="${option}"]`);
			if (input) {
				input.value = new_value;
			}
		});
	}
});
