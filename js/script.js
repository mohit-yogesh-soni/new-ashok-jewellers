/* =========================================================
   New Ashok Jewellers — Interactions
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

    /* ---- Navbar background on scroll ---- */
    var navbar = document.getElementById('navbar');
    function onScroll() {
        if (window.scrollY > 40) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
    window.addEventListener('scroll', onScroll);
    onScroll();

    /* ---- Mobile menu toggle ---- */
    var toggle = document.getElementById('navToggle');
    var links = document.getElementById('navLinks');
    toggle.addEventListener('click', function () {
        links.classList.toggle('open');
        toggle.classList.toggle('active');
    });
    // Close menu when a link is clicked
    links.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
            links.classList.remove('open');
            toggle.classList.remove('active');
        });
    });

    /* ---- Scroll reveal using IntersectionObserver ---- */
    var revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        revealEls.forEach(function (el, i) {
            // Small stagger so grouped items animate in sequence
            el.style.transitionDelay = (i % 4) * 0.08 + 's';
            observer.observe(el);
        });
    } else {
        // Fallback: just show everything
        revealEls.forEach(function (el) { el.classList.add('visible'); });
    }

    /* ---- Footer year ---- */
    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
});
