const inputs = document.querySelectorAll("input[name]");
const initial_values = {};

inputs.forEach((input) => {
	initial_values[input.name] = input.value;

	input.addEventListener("change", function (event) {
		const changed_input = event.target;
		console.log(event);
		console.log(initial_values);
		console.log(changed_input.name);
		console.log(changed_input.value);
		changed_input.classList.toggle(
			"gkfs-options-unsaved-changes",
			initial_values[changed_input.name] !== changed_input.value
		);
	});
});

// TODO Listen for full window load so other script has run
// OR maybe easier, merge this into options_handler.js
document.addEventListener("DOMContentLoaded", () => {
