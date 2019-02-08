var main = {

    SELECTOR_OPEN_NOTE_CONTAINER: '',
    SELECTOR_OPEN_NOTE: '',
    SELECTOR_OPEN_NOTE_TOOLBAR: '',

    timeout: null,
    fullscreen: true,

    init: function () {
        this.SELECTOR_OPEN_NOTE_CONTAINER = '.VIpgJd-TUo6Hb.XKSfm-L9AdLc.eo9XGd .IZ65Hb-n0tgWb';
        this.SELECTOR_OPEN_NOTE = this.SELECTOR_OPEN_NOTE_CONTAINER + ' .IZ65Hb-TBnied';
        this.SELECTOR_OPEN_NOTE_TOOLBAR = this.SELECTOR_OPEN_NOTE + ' .IZ65Hb-yePe5c';

        this.timeout = window.setInterval(this.tick, 250);
    },

    tick: function () {
        main.checkForOpenNote();
    },

    checkForOpenNote: function () {
        var elNote = document.querySelector(main.SELECTOR_OPEN_NOTE);
        if (elNote) {
            if (!(elNote.dataset.hasOwnProperty('gkfs')) || !elNote.dataset.gkfs) {
                main.note  = new Note(elNote);
            }
        }
    },

};

/* Note Object */
var Note = function (el) {

    // Mark element init in progress
    el.dataset.gkfs = 1;

    var inst = this,
        elContainer = document.querySelector(main.SELECTOR_OPEN_NOTE_CONTAINER),
        elToolbar = el.querySelector(main.SELECTOR_OPEN_NOTE_TOOLBAR),
        elBtnMore = elToolbar.querySelector('div[role="button"][aria-label="More"]'),
        elBtnToggle,
        elBtnHelp;

    // Set up toggle button
    elBtnToggle = document.createElement('div');
    elBtnToggle.setAttribute('role', 'button');
    elBtnToggle.setAttribute('aria-label', 'Full-screen Toggle');
    elBtnToggle.classList.add(
        "gkfs-toggle",
        "Q0hgme-LgbsSe",
        "Q0hgme-Bz112c-LgbsSe",
        "INgbqf-LgbsSe",
        "VIpgJd-LgbsSe"
    );
    if (main.fullscreen) {
        elBtnToggle.classList.add("active");
    }
    elBtnMore.insertAdjacentElement('beforebegin', elBtnToggle);
    elBtnToggle.addEventListener('click', inst.toggle_fullscreen);

    // TODO get tag and set up style, position, link to gh readme
    elBtnHelp = document.createElement('a');
    elBtnToggle.setAttribute('role', 'button');
    elBtnToggle.setAttribute('aria-label', 'Full-screen Toggle');
    elBtnToggle.classList.add(
        "gkfs-help",
        "Q0hgme-LgbsSe",
        "Q0hgme-Bz112c-LgbsSe",
        "INgbqf-LgbsSe",
        "VIpgJd-LgbsSe"
    );
    elBtnHelp.setAttribute('href', '');
    elBtnHelp.setAttribute('target', '_blank');
    elBtnMore.insertAdjacentElement('beforeend', elBtnHelp);

    // Set up properties
    inst.el = el;
    inst.elContainer = elContainer;
    inst.elBtnToggle = elBtnToggle;

    // Set up methods
    inst.toggle_fullscreen = function () {
        inst.container.classList.toggle('gkfs-fullscreen');
        inst.elBtnToggle.classList.toggle('active');
    };

    // Fully initialized, set instance on element data
    inst.el.dataset.gkfs = inst;
};

main.init();
