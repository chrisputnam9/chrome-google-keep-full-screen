/* jshint esversion: 6 */

var main = {

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

    observerNewNotes: null,
    observerNoteChanges: null,

    init: function () {
        this.SELECTOR_CREATED_NOTES_GROUP_CONTAINER = '.gkA7Yd-sKfxWe.ma6Yeb-r8s4j-gkA7Yd>div';
        this.SELECTOR_NOTE_CONTAINER = '.IZ65Hb-n0tgWb';
        this.SELECTOR_OPEN_NOTE_CONTAINER = this.SELECTOR_NOTE_CONTAINER + '.IZ65Hb-QQhtn';
        this.SELECTOR_OPEN_NOTE = this.SELECTOR_OPEN_NOTE_CONTAINER + ' .IZ65Hb-TBnied';
        this.SELECTOR_OPEN_NOTE_TOOLBAR = this.SELECTOR_OPEN_NOTE + ' .IZ65Hb-yePe5c';
        this.SELECTOR_NOTE_MENU = '.VIpgJd-xl07Ob.VIpgJd-xl07Ob-BvBYQ';

        // Initial Setup
        main.observerNoteChanges = new MutationObserver(main.checkForOpenNote)
        main.observerNewNotes = new MutationObserver(main.initNoteObservers);

        main.checkForDarkMode();
        main.checkForOpenNote();

        // In Dark Mode, menu seems to behave a little differently
        // Delay seems necessary to render it correctly
        window.setTimeout( () => {
            main.initMenu();
        } , 3000);

        // Observe existing notes on load for open/close
        main.initNoteObservers();

        // Observe note group container for added/removed children
        var elCreatedNotesGroupContainer = document.querySelector(this.SELECTOR_CREATED_NOTES_GROUP_CONTAINER);

        // Listen for list of notes to change - add/remove or page switch
        main.observerNewNotes.observe(
            elCreatedNotesGroupContainer,
            {
                childList: true,
                attributes: false,
                subtree: false
            }
        );

        // Listen for popstate - triggered by forward and back buttons, and manual hash entry
        window.addEventListener('popstate', main.checkForOpenNote);


        // Listen for child change in head (eg. script swap for normal/dark mode)
        // - check whether to toggle dark mode class, based on body style
        var elHead = document.querySelector('head');
        new MutationObserver(main.checkForDarkMode)
            .observe(
                elHead,
                {
                    childList: true,
                    attributes: false,
                    subtree: false
                }
            );
    },

    initNoteObservers: function () {
        var elNoteContainers = document.querySelectorAll(main.SELECTOR_NOTE_CONTAINER);
        if (elNoteContainers) {
            elNoteContainers.forEach(elNoteContainer => {
                if (! elNoteContainer.classList.contains('gkfs-observed')) {

                    // Only listen for this specific element's attributes to change
                    //  - when they do, check for an open note via same old logic
                    // console.log('New note seen - observing it for attribute changes');
                    main.observerNoteChanges.observe(
                            elNoteContainer,
                            {
                                childList: false,
                                attributes: true,
                                subtree: false
                            }
                        );

                    elNoteContainer.classList.add('gkfs-observed');
                }
            });
        }
    },

    checkForDarkMode: function () {
        // console.log('checkForDarkMode');
        var elBody = document.querySelector('body'),
            bodyStyles = getComputedStyle(elBody),
            backgroundColor = bodyStyles['background-color'],
            darkMode = (backgroundColor != "rgb(255, 255, 255)");

        // console.log('Background-color: ' + backgroundColor);
        // console.log('DarkMode: ' + darkMode);

        elBody.classList.toggle('gkfs-dark-mode', darkMode);
    },

    checkForOpenNote: function () {
        // console.log('attribute on note changed, or user change url - checkForOpenNote');
        var elNote = document.querySelector(main.SELECTOR_OPEN_NOTE);
        if (elNote) {

            main.elContainer = document.querySelector(main.SELECTOR_OPEN_NOTE_CONTAINER);

            // Initialize container if needed
            if (! main.elContainer.classList.contains('gkfs-initialized')) {

                main.elContainer.classList.add('gkfs-initialized');

                if (main.fullscreen) {
                    main.elContainer.classList.add('gkfs-fullscreen');
                }
            }

            if (elNote.hasOwnProperty('gkfs') && elNote.gkfs) {
                main.note = elNote.gkfs;
                main.note.toggle_fullscreen(main.fullscreen);
            } else {
                main.note  = new Note(elNote, main.elContainer);
            }
        }
    },

    initMenu: function () {
        // console.log('initMenu');
        this.elMenu = document.querySelector(this.SELECTOR_NOTE_MENU);
        if (this.elMenu) {
            var elBtnHelpCnt = document.createElement('div'),
                elBtnHelp = document.createElement('a');

            elBtnHelpCnt.setAttribute('role', 'menuitem');
            elBtnHelpCnt.classList.add(
                "gkfs-help-container",
                "VIpgJd-j7LFlb"
            );

            elBtnHelp.classList.add(
                "gkfs-help",
                "VIpgJd-j7LFlb-bN97Pc"
            );
            elBtnHelp.innerText = "Fullscreen Help";
            elBtnHelp.setAttribute('href', 'https://github.com/chrisputnam9/chrome-google-keep-full-screen/blob/master/README.md');
            elBtnHelp.setAttribute('target', '_blank');

            this.elMenu.insertAdjacentElement('beforeend', elBtnHelpCnt);
            elBtnHelpCnt.insertAdjacentElement('afterbegin', elBtnHelp);
        }
    }

};

/* Note Object */
var Note = function (el, elContainer) {

    // Mark element init in progress
    el.gkfs = 1;

    var inst = this,
        elToolbar = el.querySelector(main.SELECTOR_OPEN_NOTE_TOOLBAR),
        elBtnMore = elToolbar.querySelector('div[role="button"][aria-label="More"]'),
        elBtnToggle;

    // Set up toggle button
    elBtnToggle = document.createElement('div');
    elBtnToggle.setAttribute('role', 'button');
    elBtnToggle.setAttribute('aria-label', 'Full-screen Toggle');
    elBtnToggle.setAttribute('title', 'Full-screen Toggle');
    elBtnToggle.classList.add(
        "gkfs-toggle",
        "active",
        "Q0hgme-LgbsSe",
        "Q0hgme-Bz112c-LgbsSe",
        "INgbqf-LgbsSe",
        "VIpgJd-LgbsSe"
    );

    elBtnToggle.classList.toggle("active", main.fullscreen);

    elBtnMore.insertAdjacentElement('beforebegin', elBtnToggle);

    // Set up properties
    inst.el = el;
    inst.elContainer = elContainer;
    inst.elBtnToggle = elBtnToggle;

    // Set up methods
    inst.toggle_fullscreen = function (event_or_state) {
        
        if (event_or_state === true || event_or_state === false) {
            // console.log("Setting fullscreen to: " + event_or_state);
            inst.elContainer.classList.toggle('gkfs-fullscreen', event_or_state);
        } else {
            // console.log("Toggling fullscreen");
            inst.elContainer.classList.toggle('gkfs-fullscreen');
        }

        var active = inst.elContainer.classList.contains('gkfs-fullscreen');
        let elBtns = document.querySelectorAll('.gkfs-toggle');

        main.fullscreen = active;

        elBtns.forEach(elBtn => {
            elBtn.classList.toggle('active', active);
        });
    };

    inst.update_buttons = function () {
    }

    // Event listener, now that it's defined
    elBtnToggle.addEventListener('click', inst.toggle_fullscreen);

    // Fully initialized, set instance on element data
    inst.el.gkfs = inst;
};

window.addEventListener('load', (event) => {
    main.init();
});
