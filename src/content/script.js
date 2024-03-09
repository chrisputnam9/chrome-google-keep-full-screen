/* global chrome */
const main = {
	SELECTOR_CREATED_NOTES_GROUP_CONTAINER:
		".gkA7Yd-sKfxWe.ma6Yeb-r8s4j-gkA7Yd>div",
	SELECTOR_NOTE_CONTAINER: ".IZ65Hb-n0tgWb",
	SELECTOR_OPEN_NOTE_CONTAINER: "", // dynamic
	SELECTOR_OPEN_NOTE: "", // dynamic
	SELECTOR_OPEN_NOTE_TOOLBAR: "", // dynamic
	SELECTOR_NOTE_MENU: ".VIpgJd-xl07Ob.VIpgJd-xl07Ob-BvBYQ",

	fullscreen: true, // Default - full screen enabled
	note: null,

	elBody: null,
	elContainer: null,

	menuInterval: null,

	observerMenu: null,
	observerNewNotes: null,
	observerNoteChanges: null,

	init: async function () {
		main.SELECTOR_OPEN_NOTE_CONTAINER =
			main.SELECTOR_NOTE_CONTAINER + ".IZ65Hb-QQhtn";
		main.SELECTOR_OPEN_NOTE =
			main.SELECTOR_OPEN_NOTE_CONTAINER + " .IZ65Hb-TBnied";
		main.SELECTOR_OPEN_NOTE_TOOLBAR =
			main.SELECTOR_OPEN_NOTE + " .IZ65Hb-yePe5c";

		main.elBody = document.querySelector("body");

		main.observerMenu = new MutationObserver(main.maybeInitMenu);
		main.observerNoteChanges = new MutationObserver(main.checkForOpenNote);
		main.observerNewNotes = new MutationObserver(main.initNoteObservers);

		main.checkForDarkMode();
		main.checkForOpenNote();
		main.maybeInitMenu();

		const storage = await promise_chrome_storage_sync_get(["settings"]);

		if ("settings" in storage && "fullscreen" in storage.settings) {
			this.fullscreen = storage.settings.fullscreen;
		}

		// Observe body for menus
		main.initMenuObservers();

		// Observe existing notes on load for open/close
		main.initNoteObservers();

		// Observe note group container for added/removed children
		const elCreatedNotesGroupContainer = document.querySelector(
			this.SELECTOR_CREATED_NOTES_GROUP_CONTAINER
		);

		// Listen for list of notes to change - add/remove or page switch
		main.observerNewNotes.observe(elCreatedNotesGroupContainer, {
			childList: true,
		});

		// Listen for popstate - triggered by forward and back buttons, and manual hash entry
		window.addEventListener("popstate", main.checkForOpenNote);

		// Listen for child change in head (eg. script swap for normal/dark mode)
		// - check whether to toggle dark mode class, based on body style
		const elHead = document.querySelector("head");
		new MutationObserver(main.checkForDarkMode).observe(elHead, {
			childList: true,
		});

		// Listen for messages
		chrome.runtime.onMessage.addListener(function (request) {
			// Handle keyboard shortcuts
			if (
				"command" in request &&
				request.command === "toggle-fullscreen"
			) {
				main.set({ fullscreen: !main.fullscreen });
				if (main.note) {
					main.note.toggle_fullscreen();
				}
			}
		});
	},

	/** Update one or more settings **/
	set: async function (settings) {
		for (const key in settings) {
			if (key in main) {
				main[key] = settings[key];
			}
		}
		return main.syncSettings();
	},

	/** Sync settings with storage **/
	syncSettings: async function () {
		return await promise_chrome_storage_sync_set({
			settings: {
				fullscreen: this.fullscreen,
			},
		});
	},

	initMenuObservers: function () {
		main.observerMenu.observe(main.elBody, {
			childList: true,
		});
	},

	initNoteObservers: function () {
		const elNoteContainers = document.querySelectorAll(
			main.SELECTOR_NOTE_CONTAINER
		);
		if (elNoteContainers) {
			elNoteContainers.forEach((elNoteContainer) => {
				if (!elNoteContainer.classList.contains("gkfs-observed")) {
					// Only listen for this specific element's attributes to change
					//  - when they do, check for an open note via same old logic
					main.observerNoteChanges.observe(elNoteContainer, {
						attributes: true,
					});

					elNoteContainer.classList.add("gkfs-observed");
				}
			});
		}
	},

	checkForDarkMode: function () {
		const elBody = document.querySelector("body"),
			bodyStyles = getComputedStyle(elBody),
			backgroundColor = bodyStyles["background-color"],
			darkMode = backgroundColor !== "rgb(255, 255, 255)";

		elBody.classList.toggle("gkfs-dark-mode", darkMode);

		promise_chrome_storage_sync_set({
			app_selections: {
				dark_mode: darkMode,
			},
		});
	},

	checkForOpenNote: function () {
		const elNote = document.querySelector(main.SELECTOR_OPEN_NOTE);
		if (elNote) {
			main.elBody.classList.add("gkfs-has-open-note");

			main.elContainer = document.querySelector(
				main.SELECTOR_OPEN_NOTE_CONTAINER
			);

			// Initialize container if needed
			if (!main.elContainer.classList.contains("gkfs-initialized")) {
				main.elContainer.classList.add("gkfs-initialized");

				if (main.fullscreen) {
					main.elBody.classList.add("gkfs-fullscreen");
				}
			}

			if (elNote.hasOwnProperty("gkfs") && elNote.gkfs) {
				main.note = elNote.gkfs;
				main.note.toggle_fullscreen(main.fullscreen);
			} else {
				main.note = new Note(elNote, main.elContainer);
			}
		} else {
			main.elBody.classList.remove("gkfs-has-open-note");
		}
	},

	maybeInitMenu: function () {
		const elMenus = document.querySelectorAll(main.SELECTOR_NOTE_MENU);

		elMenus.forEach(function (elMenu) {
			if (
				// Make sure it's one of the menus we care about
				!elMenu.querySelector('[id=":16"], [id=":1"]') ||
				// Skip if we already hit this menu
				elMenu.classList.contains("gkfs-menu-initialized")
			) {
				return;
			}

			// Add the help menu item link
			main.addMenuItem(
				elMenu,
				"Fullscreen Info & Help",
				"https://github.com/chrisputnam9/chrome-google-keep-full-screen/blob/master/README.md"
			);

			// Add the options menu item with click event
			const elMenuItemOptions = main.addMenuItem(
				elMenu,
				"Fullscreen Options",
				"#"
			);
			elMenuItemOptions.addEventListener("click", function (event) {
				event.preventDefault();
				chrome.runtime.sendMessage({ action: "open-options" });
			});

			// Mark as initialized
			elMenu.classList.add("gkfs-menu-initialized");
		});
	},

	addMenuItem: function (elMenu, text, url = "#") {
		const elMenuItem = document.createElement("a"),
			elMenuItemText = document.createElement("span");
		elMenuItem.setAttribute("role", "menuitem");
		elMenuItem.classList.add("gkfs-menu-item", "VIpgJd-j7LFlb");
		elMenuItem.setAttribute("href", url);
		elMenuItem.setAttribute("target", "_blank");
		elMenuItemText.classList.add(
			"gkfs-menu-item-text",
			"VIpgJd-j7LFlb-bN97Pc"
		);
		elMenuItemText.innerText = text;
		elMenu.insertAdjacentElement("beforeend", elMenuItem);
		elMenuItem.insertAdjacentElement("afterbegin", elMenuItemText);

		return elMenuItem;
	},
};

/* Note Object */
const Note = function (el, elContainer) {
	// Mark element init in progress
	el.gkfs = 1;

	const inst = this;
	const elToolbar = el.querySelector(main.SELECTOR_OPEN_NOTE_TOOLBAR);
	const elBtnMore = elToolbar.querySelector(
		".Q0hgme-LgbsSe.Q0hgme-Bz112c-LgbsSe.xl07Ob.INgbqf-LgbsSe.VIpgJd-LgbsSe"
	);

	// Set up toggle button
	const elBtnToggle = document.createElement("div");
	elBtnToggle.setAttribute("role", "button");
	elBtnToggle.setAttribute("aria-label", "Full-screen Toggle");
	elBtnToggle.setAttribute("title", "Full-screen Toggle");
	elBtnToggle.classList.add(
		"gkfs-toggle",
		"active",
		"Q0hgme-LgbsSe",
		"Q0hgme-Bz112c-LgbsSe",
		"INgbqf-LgbsSe",
		"VIpgJd-LgbsSe"
	);

	// Set up icon span
	const elIconSpan = document.createElement("span");
	elIconSpan.classList.add("gkfs-toggle-icon");

	elBtnToggle.classList.toggle("active", main.fullscreen);

	// Add toggle button right before the more button
	elBtnMore.insertAdjacentElement("beforebegin", elBtnToggle);

	// Add icon span inside the toggle button
	elBtnToggle.insertAdjacentElement("beforeend", elIconSpan);

	// Set up properties
	inst.el = el;
	inst.elContainer = elContainer;
	inst.elBtnToggle = elBtnToggle;

	// Set up methods
	inst.toggle_fullscreen = function (event_or_state) {
		if (event_or_state === true || event_or_state === false) {
			main.elBody.classList.toggle("gkfs-fullscreen", event_or_state);
		} else {
			main.elBody.classList.toggle("gkfs-fullscreen");
		}

		const active = main.elBody.classList.contains("gkfs-fullscreen");
		const elBtns = document.querySelectorAll(".gkfs-toggle");

		main.set({ fullscreen: active });

		elBtns.forEach((elBtn) => {
			elBtn.classList.toggle("active", active);
		});
	};

	inst.update_buttons = function () {};

	// Event listener, now that it's defined
	elBtnToggle.addEventListener("click", inst.toggle_fullscreen);

	// Fully initialized, set instance on element data
	inst.el.gkfs = inst;
};

/** Promisified Chrome API methods **/
function promise_chrome_storage_sync_set(data) {
	return new Promise((resolve, reject) => {
		try {
			chrome.storage.sync.set(data, resolve);
		} catch (error) {
			reject(error);
		}
	});
}

function promise_chrome_storage_sync_get(data) {
	return new Promise((resolve, reject) => {
		try {
			chrome.storage.sync.get(data, resolve);
		} catch (error) {
			reject(error);
		}
	});
}

window.addEventListener("load", () => {
	main.init();
});
