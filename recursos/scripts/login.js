document.addEventListener("DOMContentLoaded", function () {

    /* === Tab switching === */
    var tabBtns = document.querySelectorAll(".auth-tab-btn");
    var panels  = document.querySelectorAll(".auth-panel");

    function switchTab(targetId) {
        panels.forEach(function (p) { p.classList.remove("active"); });
        tabBtns.forEach(function (b) { b.classList.remove("active"); });

        var panel = document.getElementById(targetId);
        if (panel) panel.classList.add("active");

        tabBtns.forEach(function (b) {
            if (b.getAttribute("data-target") === targetId) b.classList.add("active");
        });
    }

    tabBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
            switchTab(this.getAttribute("data-target"));
        });
    });

    /* === Toggle links inside forms === */
    document.querySelectorAll(".auth-toggle-link").forEach(function (link) {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            switchTab(this.getAttribute("data-target"));
        });
    });
});
