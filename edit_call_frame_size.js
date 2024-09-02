// ==UserScript==
// @name         Edit Call Frame Width and Position for All Similar Divs
// @namespace    http://tampermonkey.net/
// @version      2024-07-31
// @description  Adjust the width of all similar divs and align them to the left on page load and mutation.
// @author       You
// @match        https://interpreters.propio-ls.com/portal
// @icon         https://www.google.com/s2/favicons?sz=64&domain=propio-ls.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const adjustWidthAndPositionForAllSimilarDivs = () => {
        const targetDivs = document.querySelectorAll('.cdk-overlay-pane.intake-dialog-panel');
        targetDivs.forEach(div => {
            div.style.width = '63vw';
            // Adjust the parent div to align the target divs to the left
            const parentDiv = div.closest('.cdk-global-overlay-wrapper');
            if (parentDiv) {
                parentDiv.style.justifyContent = 'flex-start';
                parentDiv.style.padding = '1.50vw';
            }
        });
    };

    // Run adjustWidthAndPositionForAllSimilarDivs on page load
    window.addEventListener('load', adjustWidthAndPositionForAllSimilarDivs);

    // Create an observer instance to monitor DOM changes and adjust the div widths and positions accordingly
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length || mutation.removedNodes.length) {
                adjustWidthAndPositionForAllSimilarDivs();
            }
        });
    });

    // Configuration of the observer:
    const config = { childList: true, subtree: true };

    // Pass in the target node, as well as the observer options
    observer.observe(document.body, config);
})();
