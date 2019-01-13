var main = {

    timeout: null,
    fullscreen: true,

    init: function () {
        main.timeout = window.setInterval(main.tick, 250);
    },

    tick: function () {
        main.checkForOpenNote();
    },

    /* TODO confirm selector */
    checkForOpenNote: function () {
        var noteEl = document.querySelector('.eo9XGd .IZ65Hb-TBnied');
        if (!(noteEl.dataset.hasOwnProperty('gkfs')) || !noteEl.dataset.gkfs) {
            main.note  = new Note(noteEl);
        }
    },

};

/* Note Object */
var Note = function (el) {

    // Mark element init in progress
    el.dataset.gkfs = 1;

    var inst = this,
        container = document.querySelector('.eo9XGd'),
        // TODO confirm selector
        toolbar = inst.el.querySelector('.eo9XGd .IZ65Hb-QQhtn .IZ65Hb-TBnied .IZ65Hb-yePe5c'),
        // TODO get selector
        last_button = toolbar.querySelector('.last-button'),
        // TODO get selector
        menu = toolbar.querySelector('.menu'),
        fs_toggle,
        fs_help;

    // Set up toggle button
    // TODO get tag and set up style
    fs_toggle = document.createElement('a');
    fs_toggle.classList.add("fs-toggle");
    if (main.fullscreen) {
        fs_toggle.classList.add("active");
    }
    last_button.insertAdjacentHTML('afterend', fs_toggle);
    fs_toggle.addEventListener('click', inst.toggle_fullscreen);

    // TODO get tag and set up style, position, link to gh readme
    fs_help = document.createElement('a');
    fs_help.setAttribute('href', '');
    fs_help.setAttribute('target', '_blank');
    menu.insertAdjacentHTML('beforeend', fs_help);

    // Set up properties
    inst.el = el;
    inst.container = container;
    inst.fs_toggle = fs_toggle;

    // Set up methods
    inst.toggle_fullscreen = function () {
        inst.container.classList.toggle('gkfs-fullscreen');
        inst.fs_toggle.classList.toggle('active');
    };

    // Fully initialized, set instance on element data
    inst.el.dataset.gkfs = inst;
};

main.init();
