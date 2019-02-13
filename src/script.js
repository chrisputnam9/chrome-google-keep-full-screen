/* jshint esversion: 6 */

var main = {

    SELECTOR_OPEN_NOTE_CONTAINER: '',
    SELECTOR_OPEN_NOTE: '',
    SELECTOR_OPEN_NOTE_TOOLBAR: '',
    SELECTOR_NOTE_MENU: '',

    interval: null,
    fullscreen: true, // Default - full screen enabled
    note: null,

    elMenu: null,
    elContainer: null,

    init: function () {
        this.SELECTOR_OPEN_NOTE_CONTAINER = '.VIpgJd-TUo6Hb.XKSfm-L9AdLc.eo9XGd .IZ65Hb-n0tgWb';
        this.SELECTOR_OPEN_NOTE = this.SELECTOR_OPEN_NOTE_CONTAINER + ' .IZ65Hb-TBnied';
        this.SELECTOR_OPEN_NOTE_TOOLBAR = this.SELECTOR_OPEN_NOTE + ' .IZ65Hb-yePe5c';
        this.SELECTOR_NOTE_MENU = '.VIpgJd-xl07Ob.VIpgJd-xl07Ob-BvBYQ';

        // TODO set a better way to do this - eg. mutation observer?
        this.interval = window.setInterval(this.tick, 250);
    },

    tick: function () {
        main.checkForOpenNote();
        if (!main.elMenu) {
            main.initMenu();
        }
    },

    checkForOpenNote: function () {
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

            if (elNote.dataset.hasOwnProperty('gkfs') && elNote.dataset.gkfs) {
                main.note = elNote.dataset.gkfs;
            } else {
                main.note  = new Note(elNote, main.elContainer);
            }
        }
    },

    initMenu: function () {
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
    el.dataset.gkfs = 1;

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
    inst.toggle_fullscreen = function (event) {
        inst.elContainer.classList.toggle('gkfs-fullscreen');
        var active = inst.elContainer.classList.contains('gkfs-fullscreen');
        let elBtns = document.querySelectorAll('.gkfs-toggle');

        main.fullscreen = ! main.fullscreen;

        elBtns.forEach(elBtn => {
            elBtn.classList.toggle('active', active);
        });
    };

    // Event listener, now that it's defined
    elBtnToggle.addEventListener('click', inst.toggle_fullscreen);

    // Fully initialized, set instance on element data
    inst.el.dataset.gkfs = inst;
};

main.init();
