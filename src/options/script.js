const root = document.querySelector(':root');
const body = document.querySelector('body');

/* Initialize inputs */
document.querySelectorAll('input').forEach((input) => {
	const variable = `--setting_${input.name}`;

	/* Set initial value */
	input.value = getComputedStyle(root).getPropertyValue(variable);

	/* Listen for changes */
	input.addEventListener('change', function () {
		// Validate int values with min/max
		let new_value = parseInt(this.value);
		if (new_value < this.min) {
			new_value = this.min;
		}
		if (new_value > this.max) {
			new_value = this.max;
		}
		this.value = new_value;

		if (this.name === 'note_size') {
			body.classList.toggle(
				'gkfs-fullscreen-custom-size',
				new_value < 100
			);
		}

		root.style.setProperty(variable, new_value);
	});
});
