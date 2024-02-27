/* global chrome */
const main = {
	SELECTOR_CREATED_NOTES_GROUP_CONTAINER:
		'.gkA7Yd-sKfxWe.ma6Yeb-r8s4j-gkA7Yd>div',
	SELECTOR_NOTE_CONTAINER: '.IZ65Hb-n0tgWb',
	SELECTOR_OPEN_NOTE_CONTAINER: '', // dynamic
	SELECTOR_OPEN_NOTE: '', // dynamic
	SELECTOR_OPEN_NOTE_TOOLBAR: '', // dynamic
	SELECTOR_NOTE_MENU: '.VIpgJd-xl07Ob.VIpgJd-xl07Ob-BvBYQ',

	fullscreen: true, // Default - full screen enabled
	note: null,

	elBody: null,
	elMenu: null,
	elContainer: null,

	menuInterval: null,

	observerNewNotes: null,
	observerNoteChanges: null,

	init: async function () {
		main.SELECTOR_OPEN_NOTE_CONTAINER =
			main.SELECTOR_NOTE_CONTAINER + '.IZ65Hb-QQhtn';
		main.SELECTOR_OPEN_NOTE =
			main.SELECTOR_OPEN_NOTE_CONTAINER + ' .IZ65Hb-TBnied';
		main.SELECTOR_OPEN_NOTE_TOOLBAR =
			main.SELECTOR_OPEN_NOTE + ' .IZ65Hb-yePe5c';

		main.elBody = document.querySelector('body');

		main.observerNoteChanges = new MutationObserver(main.checkForOpenNote);
		main.observerNewNotes = new MutationObserver(main.initNoteObservers);

		main.checkForDarkMode();
		main.checkForOpenNote();

		const storage = await promise_chrome_storage_sync_get(['settings']);

		if ('settings' in storage && 'fullscreen' in storage.settings) {
			this.fullscreen = storage.settings.fullscreen;
		}

		// TODO Change this to a mutation observer
		main.menuInterval = window.setInterval(() => {
			main.initMenu();
		}, 500);

		// Observe existing notes on load for open/close
		main.initNoteObservers();

		// Observe note group container for added/removed children
		const elCreatedNotesGroupContainer = document.querySelector(
			this.SELECTOR_CREATED_NOTES_GROUP_CONTAINER
		);

		// Listen for list of notes to change - add/remove or page switch
		main.observerNewNotes.observe(elCreatedNotesGroupContainer, {
			childList: true,
			attributes: false,
			subtree: false,
		});

		// Listen for popstate - triggered by forward and back buttons, and manual hash entry
		window.addEventListener('popstate', main.checkForOpenNote);

		// Listen for child change in head (eg. script swap for normal/dark mode)
		// - check whether to toggle dark mode class, based on body style
		const elHead = document.querySelector('head');
		new MutationObserver(main.checkForDarkMode).observe(elHead, {
			childList: true,
			attributes: false,
			subtree: false,
		});

		// Listen for messages
		chrome.runtime.onMessage.addListener(function (request) {
			// Handle keyboard shortcuts
			if (
				'command' in request &&
				request.command === 'toggle-fullscreen'
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

	initNoteObservers: function () {
		const elNoteContainers = document.querySelectorAll(
			main.SELECTOR_NOTE_CONTAINER
		);
		if (elNoteContainers) {
			elNoteContainers.forEach((elNoteContainer) => {
				if (!elNoteContainer.classList.contains('gkfs-observed')) {
					// Only listen for this specific element's attributes to change
					//  - when they do, check for an open note via same old logic
					// console.log('New note seen - observing it for attribute changes');
					main.observerNoteChanges.observe(elNoteContainer, {
						childList: false,
						attributes: true,
						subtree: false,
					});

					elNoteContainer.classList.add('gkfs-observed');
				}
			});
		}
	},

	checkForDarkMode: function () {
		// console.log('checkForDarkMode');
		const elBody = document.querySelector('body'),
			bodyStyles = getComputedStyle(elBody),
			backgroundColor = bodyStyles['background-color'],
			darkMode = backgroundColor !== 'rgb(255, 255, 255)';

		elBody.classList.toggle('gkfs-dark-mode', darkMode);

		promise_chrome_storage_sync_set({
			app_selections: {
				dark_mode: darkMode,
			},
		});
	},

	checkForOpenNote: function () {
		// console.log('attribute on note changed, or user change url - checkForOpenNote');
		const elNote = document.querySelector(main.SELECTOR_OPEN_NOTE);
		if (elNote) {
			main.elContainer = document.querySelector(
				main.SELECTOR_OPEN_NOTE_CONTAINER
			);

			// Initialize container if needed
			if (!main.elContainer.classList.contains('gkfs-initialized')) {
				main.elContainer.classList.add('gkfs-initialized');

				if (main.fullscreen) {
					main.elBody.classList.add('gkfs-fullscreen');
				}
			}

			if (elNote.hasOwnProperty('gkfs') && elNote.gkfs) {
				main.note = elNote.gkfs;
				main.note.toggle_fullscreen(main.fullscreen);
			} else {
				main.note = new Note(elNote, main.elContainer);
			}
		}
	},

	initMenu: function () {
		const elMenus = document.querySelectorAll(main.SELECTOR_NOTE_MENU);
		// console.log(elMenus);
		if (elMenus.length > 0) {
			// Get the last menu - this is the main one (vs. an in-note link menu)
			this.elMenu = elMenus[elMenus.length - 1];
			// console.log(this.elMenu);

			// No need to keep running
			window.clearInterval(this.menuInterval);

			const elBtnHelpCnt = document.createElement('div'),
				elBtnHelp = document.createElement('a');
			elBtnHelpCnt.setAttribute('role', 'menuitem');
			elBtnHelpCnt.classList.add(
				'gkfs-menu-item-container',
				'VIpgJd-j7LFlb'
			);
			elBtnHelp.classList.add('gkfs-menu-item', 'VIpgJd-j7LFlb-bN97Pc');
			elBtnHelp.innerText = 'Fullscreen Info & Help';
			elBtnHelp.setAttribute(
				'href',
				'https://github.com/chrisputnam9/chrome-google-keep-full-screen/blob/master/README.md'
			);
			elBtnHelp.setAttribute('target', '_blank');
			this.elMenu.insertAdjacentElement('beforeend', elBtnHelpCnt);
			elBtnHelpCnt.insertAdjacentElement('afterbegin', elBtnHelp);

			const elBtnOptionsCnt = document.createElement('div'),
				elBtnOptions = document.createElement('a');
			elBtnOptionsCnt.setAttribute('role', 'menuitem');
			elBtnOptionsCnt.classList.add(
				'gkfs-menu-item-container',
				'VIpgJd-j7LFlb'
			);
			elBtnOptions.classList.add(
				'gkfs-menu-item',
				'VIpgJd-j7LFlb-bN97Pc'
			);
			elBtnOptions.innerText = 'Fullscreen Options';
			elBtnOptions.setAttribute('href', '#');
			this.elMenu.insertAdjacentElement('beforeend', elBtnOptionsCnt);
			elBtnOptionsCnt.insertAdjacentElement('afterbegin', elBtnOptions);
			elBtnOptions.addEventListener('click', function (event) {
				event.preventDefault();
				chrome.runtime.sendMessage({ action: 'open-options' });
			});
		}
	},
};

/* Note Object */
const Note = function (el, elContainer) {
	// Mark element init in progress
	el.gkfs = 1;

	const inst = this;
	const elToolbar = el.querySelector(main.SELECTOR_OPEN_NOTE_TOOLBAR);
	const elBtnMore = elToolbar.querySelector(
		'.Q0hgme-LgbsSe.Q0hgme-Bz112c-LgbsSe.xl07Ob.INgbqf-LgbsSe.VIpgJd-LgbsSe'
	);

	// Set up toggle button
	const elBtnToggle = document.createElement('div');
	elBtnToggle.setAttribute('role', 'button');
	elBtnToggle.setAttribute('aria-label', 'Full-screen Toggle');
	elBtnToggle.setAttribute('title', 'Full-screen Toggle');
	elBtnToggle.classList.add(
		'gkfs-toggle',
		'active',
		'Q0hgme-LgbsSe',
		'Q0hgme-Bz112c-LgbsSe',
		'INgbqf-LgbsSe',
		'VIpgJd-LgbsSe'
	);

	// Set up icon span
	const elIconSpan = document.createElement('span');
	elIconSpan.classList.add('gkfs-toggle-icon');

	elBtnToggle.classList.toggle('active', main.fullscreen);

	// Add toggle button right before the more button
	elBtnMore.insertAdjacentElement('beforebegin', elBtnToggle);

	// Add icon span inside the toggle button
	elBtnToggle.insertAdjacentElement('beforeend', elIconSpan);

	// Set up properties
	inst.el = el;
	inst.elContainer = elContainer;
	inst.elBtnToggle = elBtnToggle;

	// Set up methods
	inst.toggle_fullscreen = function (event_or_state) {
		if (event_or_state === true || event_or_state === false) {
			// console.log("Setting fullscreen to: " + event_or_state);
			main.elBody.classList.toggle('gkfs-fullscreen', event_or_state);
		} else {
			// console.log("Toggling fullscreen");
			main.elBody.classList.toggle('gkfs-fullscreen');
		}

		const active = main.elBody.classList.contains('gkfs-fullscreen');
		const elBtns = document.querySelectorAll('.gkfs-toggle');

		main.set({ fullscreen: active });

		elBtns.forEach((elBtn) => {
			elBtn.classList.toggle('active', active);
		});
	};

	inst.update_buttons = function () {};

	// Event listener, now that it's defined
	elBtnToggle.addEventListener('click', inst.toggle_fullscreen);

	// Fully initialized, set instance on element data
	inst.el.gkfs = inst;
};

/** Promisified Chrome API methods **/
function promise_chrome_storage_sync_set(data) {
	return new Promise((resolve, reject) => {
		try {
			// console.log( 'Setting:', data );
			chrome.storage.sync.set(data, resolve);
		} catch (error) {
			reject(error);
		}
	});
}

function promise_chrome_storage_sync_get(data) {
	return new Promise((resolve, reject) => {
		try {
			// console.log( 'Getting:', data );
			chrome.storage.sync.get(data, resolve);
		} catch (error) {
			reject(error);
		}
	});
}

window.addEventListener('load', () => {
	main.init();
});
