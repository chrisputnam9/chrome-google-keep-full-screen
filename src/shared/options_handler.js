/* global chrome */

const optionsHandler = {
	root: null,
	body: null,
	form: null,

	// Initialize the options handler
	init: function () {
		const self = optionsHandler;

		self.root = document.querySelector(':root');
		self.body = document.querySelector('body');

		/* Listen for options form submit and update options */
		self.form = document.querySelector('form#gkfs-options-form');

		if (self.form) {
			self.form.addEventListener('submit', function (event) {
				event.preventDefault();
				const options = {};
				this.querySelectorAll('input[name]').forEach((input) => {
					options[input.name] = parseInt(input.value);
				});
				self.changeOptions(options);
			});
		}

		/* Listen for changes to options */
		chrome.storage.onChanged.addListener(function (changes, area) {
			if (area !== 'sync' || !('options' in changes)) {
				return;
			}

			const options = changes.options.newValue;

			self.updateOptionsOnPage(options);
		});

		/* On load, get initial options */
		chrome.storage.sync.get('options', function (data) {
			if (!('options' in data)) {
				return;
			}

			self.updateOptionsOnPage(data.options);
		});
	},

	/**
	 * Update options when they change
	 */
	updateOptionsOnPage: function (options) {
		const self = optionsHandler;

		for (const option_name in options) {
			const option_value = options[option_name];

			// Toggle custom size based on note_size
			if (option_name === 'note_size') {
				self.body.classList.toggle(
					'gkfs-fullscreen-custom-size',
					option_value < 100
				);
			}

			// Set the CSS variable
			const variable = `--setting_${option_name}`;
			self.root.style.setProperty(variable, option_value);

			// Set the input value
			if (self.form) {
				const input = self.form.querySelector(
					`input[name="${option_name}"]`
				);
				if (input) {
					input.value = option_value;
				}
			}
		}
	},

	/**
	 * Change some options without impacting any that are not specified
	 */
	changeOptions: function (newOptions) {
		chrome.storage.sync.get('options', function (data) {
			let oldOptions = {};
			if ('options' in data) {
				oldOptions = data.options;
			}

			const mergedOptions = Object.assign(oldOptions, newOptions);

			chrome.storage.sync.set({ options: mergedOptions });
		});
	},
};

window.addEventListener('load', () => {
	optionsHandler.init();
});
