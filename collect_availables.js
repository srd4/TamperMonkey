// ==UserScript==
// @name         Collect Availables
// @namespace    http://tampermonkey.net/
// @version      2024-09-01
// @description  try to take over the world!
// @author       You
// @match        https://interpreters.propio-ls.com/portal
// @icon         https://www.google.com/s2/favicons?sz=64&domain=propio-ls.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let lastStatus = null;
    let statusChangeTime = Date.now();
    let queueTimes = JSON.parse(localStorage.getItem('queueTimes')) || [];

    function updateQueueTimes(status) {
        const currentTime = Date.now();

        if (status !== lastStatus) {
            if (lastStatus === 'Offline' && status === 'Available') {
                // Transition from 'Offline' to 'Available'
                const offlineDuration = currentTime - statusChangeTime;
                queueTimes.push({ offlineDuration, availableDuration: null });
            } else if (lastStatus === 'Available' && status !== 'Available') {
                // Transition from 'Available' to any other status
                if (queueTimes.length > 0 && queueTimes[queueTimes.length - 1].availableDuration === null) {
                    const availableDuration = currentTime - statusChangeTime;
                    queueTimes[queueTimes.length - 1].availableDuration = availableDuration;
                }
            }

            // Update the statusChangeTime for the next status change
            statusChangeTime = currentTime;
            lastStatus = status;

            // Save the updated queueTimes to localStorage
            localStorage.setItem('queueTimes', JSON.stringify(queueTimes));
        }
    }

    setInterval(() => {
        const headlines = document.querySelectorAll('h2.app-headline');
        if (headlines.length > 1) {
            const statusText = headlines[1].textContent;
            const currentStatus = statusText.split('Call Status: ')[1].trim();
            updateQueueTimes(currentStatus);
        }
    }, 1000);
})();