/* global chrome */
const main = {
	SELECTOR_CREATED_NOTES_GROUP_CONTAINER: '',
	SELECTOR_NOTE_CONTAINER: '',
	SELECTOR_OPEN_NOTE_CONTAINER: '',
	SELECTOR_OPEN_NOTE: '',
	SELECTOR_OPEN_NOTE_TOOLBAR: '',
	SELECTOR_NOTE_MENU: '',

	fullscreen: true, // Default - full screen enabled
	note: null,

	elMenu: null,
	elContainer: null,

	menuInterval: null,

	observerNewNotes: null,
	observerNoteChanges: null,

	init: async function () {
		this.SELECTOR_CREATED_NOTES_GROUP_CONTAINER =
			'.gkA7Yd-sKfxWe.ma6Yeb-r8s4j-gkA7Yd>div';
		this.SELECTOR_NOTE_CONTAINER = '.IZ65Hb-n0tgWb';
		this.SELECTOR_OPEN_NOTE_CONTAINER =
			this.SELECTOR_NOTE_CONTAINER + '.IZ65Hb-QQhtn';
		this.SELECTOR_OPEN_NOTE =
			this.SELECTOR_OPEN_NOTE_CONTAINER + ' .IZ65Hb-TBnied';
		this.SELECTOR_OPEN_NOTE_TOOLBAR =
			this.SELECTOR_OPEN_NOTE + ' .IZ65Hb-yePe5c';
		this.SELECTOR_NOTE_MENU = '.VIpgJd-xl07Ob.VIpgJd-xl07Ob-BvBYQ';

		// Initial Setup
		main.observerNoteChanges = new MutationObserver(main.checkForOpenNote);
		main.observerNewNotes = new MutationObserver(main.initNoteObservers);

		main.checkForDarkMode();
		main.checkForOpenNote();

		const storage = await promise_chrome_storage_sync_get(['settings']);

		if ('settings' in storage && 'fullscreen' in storage.settings) {
			this.fullscreen = storage.settings.fullscreen;
		}

		// TODO Change this to a mutation observer
		this.menuInterval = window.setInterval(() => {
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

		// console.log('Background-color: ' + backgroundColor);
		// console.log('DarkMode: ' + darkMode);

		elBody.classList.toggle('gkfs-dark-mode', darkMode);
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
					main.elContainer.classList.add('gkfs-fullscreen');
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
		this.elMenu = document.querySelector(this.SELECTOR_NOTE_MENU);
		if (this.elMenu) {
			// No need to keep running
			window.clearInterval(this.menuInterval);

			const elBtnHelpCnt = document.createElement('div'),
				elBtnHelp = document.createElement('a');

			elBtnHelpCnt.setAttribute('role', 'menuitem');
			elBtnHelpCnt.classList.add('gkfs-help-container', 'VIpgJd-j7LFlb');

			elBtnHelp.classList.add('gkfs-help', 'VIpgJd-j7LFlb-bN97Pc');
			elBtnHelp.innerText = 'Fullscreen Help';
			elBtnHelp.setAttribute(
				'href',
				'https://github.com/chrisputnam9/chrome-google-keep-full-screen/blob/master/README.md'
			);
			elBtnHelp.setAttribute('target', '_blank');

			this.elMenu.insertAdjacentElement('beforeend', elBtnHelpCnt);
			elBtnHelpCnt.insertAdjacentElement('afterbegin', elBtnHelp);
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

	elBtnToggle.classList.toggle('active', main.fullscreen);

	elBtnMore.insertAdjacentElement('beforebegin', elBtnToggle);

	// Set up properties
	inst.el = el;
	inst.elContainer = elContainer;
	inst.elBtnToggle = elBtnToggle;

	// Set up methods
	inst.toggle_fullscreen = function (event_or_state) {
		if (event_or_state === true || event_or_state === false) {
			// console.log("Setting fullscreen to: " + event_or_state);
			inst.elContainer.classList.toggle(
				'gkfs-fullscreen',
				event_or_state
			);
		} else {
			// console.log("Toggling fullscreen");
			inst.elContainer.classList.toggle('gkfs-fullscreen');
		}

		const active = inst.elContainer.classList.contains('gkfs-fullscreen');
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
