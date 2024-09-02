// ==UserScript==
// @name         Status Timer
// @namespace    http://tampermonkey.net/
// @version      2024-07-26
// @description  try to take over the world!
// @author       You
// @match        https://interpreters.propio-ls.com/portal
// @icon         https://www.google.com/s2/favicons?sz=64&domain=propio-ls.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to format time in HH:MM:SS
    function formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return [hours, minutes, secs]
            .map(v => v < 10 ? "0" + v : v)
            .join(":");
    }

    // Retrieve saved times from localStorage or initialize if not present
    let lastStatusText = localStorage.getItem('lastStatusText') || '';
    let lastElapsedTime = localStorage.getItem('lastElapsedTime') || '';
    let previousElapsedTime = localStorage.getItem('previousElapsedTime') || ''; // Added variable for previous to last elapsed time
    let statusStartTime = localStorage.getItem('statusStartTime') ? parseInt(localStorage.getItem('statusStartTime'), 10) : Date.now();

    // Function to set the duration of the last interpreting call
    function setLastCallDuration(duration) {
        localStorage.setItem('lastCallDuration', duration.toString());
    }

    // Function to check and update the timer
    function updateStatusTimer() {
        const headlineElements = document.querySelectorAll('h2.app-headline');
        if (headlineElements.length > 1) {
            const secondHeadline = headlineElements[1];
            const currentStatusText = secondHeadline.textContent;

            // Check if the status text has changed
            if (lastStatusText !== currentStatusText) {
                // Status has changed, store the previous last elapsed time, then the last elapsed time, reset the start time, and update last status
                if (lastStatusText !== '') {
                    // If the status changes to 'Wrap Up', set the last call duration based on the last interpreting session

                    previousElapsedTime = lastElapsedTime; // Update previous to last elapsed time
                    lastElapsedTime = formatTime(Math.round((Date.now() - statusStartTime) / 1000));
                    // Save the previous and last elapsed times to localStorage
                    localStorage.setItem('previousElapsedTime', previousElapsedTime);
                    localStorage.setItem('lastElapsedTime', lastElapsedTime);

                    if (currentStatusText === 'Call Status: Wrap Up' ) {
                        setLastCallDuration(Math.round((Date.now() - statusStartTime) / 1000));
                    }

                }
                statusStartTime = Date.now();
                lastStatusText = currentStatusText;
                // Save the start time and last status text to localStorage
                localStorage.setItem('statusStartTime', statusStartTime.toString());
                localStorage.setItem('lastStatusText', lastStatusText);
            }

            // Calculate the elapsed time
            const elapsedTime = Math.round((Date.now() - statusStartTime) / 1000);
            const formattedTime = formatTime(elapsedTime);

            // Update or create the timer display
            let timerDisplay = document.getElementById('statusTimer');
            if (!timerDisplay) {
                timerDisplay = document.createElement('div');
                timerDisplay.id = 'statusTimer';
                timerDisplay.style.cssText = `
                    padding: 10px;
                    margin-top: -25px;
                    background-color: #e8e8e8; /* Slightly lighter than statusDisplay for visual hierarchy */
                    border-radius: 5px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    font-family: Arial, sans-serif;
                    color: #333;
                    font-size: 18px; /* Slightly smaller font size for subtext */
                    line-height: 1.5;
                    width: 50%; /* Same width as statusDisplay */
                    text-align: center; /* Center the text */
                `;
                secondHeadline.parentNode.insertBefore(timerDisplay, secondHeadline.nextSibling);
            }
            // Display the current, the last, and the previous to last elapsed time
            timerDisplay.innerHTML = `<strong>Current:</strong> ${formattedTime}` + 
                                     (lastElapsedTime ? `<br/><strong>Last:</strong> ${lastElapsedTime}` : '') +
                                     (previousElapsedTime ? `<br/><strong>Previous:</strong> ${previousElapsedTime}` : '');
        }
    }

    // Initialize the timer display and update it every second
    setInterval(updateStatusTimer, 1000);

    // ... (rest of your existing code for statusDisplay) ...
})();