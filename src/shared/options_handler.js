/* global chrome */

const optionsHandler = {
	root: null,
	body: null,
	form: null,

	// Initialize the options handler
	init: function () {
		const self = optionsHandler;

		self.root = document.querySelector(":root");
		self.body = document.querySelector("body");

		self.initForm();

		/* Listen for changes to options */
		chrome.storage.onChanged.addListener(function (changes, area) {
			if (area !== "sync") {
				return;
			}

			if ("options" in changes) {
				const options = changes.options.newValue;
				self.updateOptionsOnPage(options);
			}

			if ("app_selections" in changes) {
				const app_selections = changes.app_selections.newValue;
				self.updateOptionsOnPage(app_selections);
			}
		});

		/* On load, get initial options */
		chrome.storage.sync.get("options", function (data) {
			if (!("options" in data)) {
				return;
			}

			self.updateOptionsOnPage(data.options);

			// Initialize inputs *after* loading option data
			self.initInputs();
		});

		/* On load, get initial options */
		chrome.storage.sync.get("app_selections", function (data) {
			if (!("app_selections" in data)) {
				return;
			}

			self.updateOptionsOnPage(data.app_selections);
		});
	},

	/**
	 * Init form and input handling on options page
	 */
	initForm: function () {
		const self = optionsHandler;
		self.form = document.querySelector("form#gkfs-options-form");
		if (self.form) {
			self.form.addEventListener("submit", function (event) {
				event.preventDefault();
				const options = {};
				this.querySelectorAll("input[name]").forEach((input) => {
					options[input.name] = parseInt(input.value);
				});
				self.changeOptions(options);
				self.initInputs();
			});
		}
	},

	/**
	 * Initialize inputs to watch when they change form initial values
	 */
	initInputs: function () {
		const self = optionsHandler;
		const inputs = self.form.querySelectorAll("input[name]");
		const initial_values = {};
		inputs.forEach((input) => {
			initial_values[input.name] = input.value;
			input.classList.remove("gkfs-options-unsaved-changes");
			input.addEventListener("change", function (event) {
				const changed_input = event.target;
				changed_input.classList.toggle(
					"gkfs-options-unsaved-changes",
					initial_values[changed_input.name] !== changed_input.value
				);

				console.log("-----------------------------");
				console.log(event);
				console.log(event.target);
				console.log(initial_values);
				console.log(changed_input.name);
				console.log(changed_input.value);
			});
		});
	},

	/**
	 * Update options when they change
	 */
	updateOptionsOnPage: function (options) {
		const self = optionsHandler;

		for (const option_name in options) {
			const option_value = options[option_name];

			// console.log('Updating option:', option_name, option_value);

			// Toggle dark mode
			if (option_name === "dark_mode") {
				self.body.classList.toggle("gkfs-dark-mode", option_value);
				return;
			}

			// Toggle custom size based on note_size
			if (option_name === "note_size") {
				self.body.classList.toggle(
					"gkfs-fullscreen-custom-size",
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
		chrome.storage.sync.get("options", function (data) {
			let oldOptions = {};
			if ("options" in data) {
				oldOptions = data.options;
			}

			const mergedOptions = Object.assign(oldOptions, newOptions);

			chrome.storage.sync.set({ options: mergedOptions });
		});
	},
};

document.addEventListener("DOMContentLoaded", () => {
	optionsHandler.init();
});
