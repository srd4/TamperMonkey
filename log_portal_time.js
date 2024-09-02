// ==UserScript==
// @name         Log Portal Time
// @namespace    http://tampermonkey.net/
// @version      2024-07-25
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

    // Function to get last Monday at the start of the day (00:00:00)
    function getLastMonday() {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of today
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
        return new Date(today.setDate(diff));
    }

    // Function to initialize the status display
    function initStatusDisplay() {
        const callControlHeader = document.querySelector('.call-control-header');
        if (callControlHeader) {
            const statusDisplay = document.createElement('div');
            statusDisplay.id = 'statusDisplay';
            // Apply CSS styles to the status display
            statusDisplay.style.cssText = `
                padding: 10px;
                margin-top: 0;
                margin-bottom:12px;
                background-color: #f2f2f2;
                border-radius: 5px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                font-family: Arial, sans-serif;
                color: #333;
                font-size: 18px;
                line-height: 1.5;
                width: 50%;
            `; // Container styles
            callControlHeader.appendChild(statusDisplay);

            // Clear the interval once the element has been successfully added
            clearInterval(checkHeaderInterval);

            // Retrieve all status durations data or initialize if not present
            let allStatusDurations = JSON.parse(localStorage.getItem('allStatusDurations')) || {};
            let lastStatus = null;
            let lastUpdateTime = Date.now();
            let currentDate = new Date().toDateString();

            // Initialize today's status durations if not already present
            if (!allStatusDurations[currentDate]) {
                allStatusDurations[currentDate] = {};
            }

            setInterval(() => {
                const headlines = document.querySelectorAll('h2.app-headline');
                if (headlines.length > 1) {
                    const statusText = headlines[1].textContent;
                    const currentStatus = statusText.split('Call Status: ')[1].trim();
                    let currentTime = Date.now();

                    // Check if the date has changed
                    let newDate = new Date().toDateString();
                    if (currentDate !== newDate) {
                        currentDate = newDate;
                        allStatusDurations[currentDate] = {}; // Initialize new date entry
                        lastUpdateTime = currentTime; // Reset the update time
                    }

                    if (lastStatus !== currentStatus) {
                        if (lastStatus && allStatusDurations[currentDate][lastStatus] !== undefined) {
                            let timeDiff = Math.round((currentTime - lastUpdateTime) / 1000);
                            allStatusDurations[currentDate][lastStatus] += timeDiff;
                        }
                        lastUpdateTime = currentTime;
                        lastStatus = currentStatus;
                    }

                    if (allStatusDurations[currentDate][currentStatus] === undefined) {
                        allStatusDurations[currentDate][currentStatus] = 0;
                    }

                    // Update the duration of the current status
                    if (lastStatus === currentStatus) {
                        let timeDiff = Math.round((currentTime - lastUpdateTime) / 1000);
                        allStatusDurations[currentDate][currentStatus] += timeDiff;
                        lastUpdateTime = currentTime;
                    }

                    // Save the updated durations to localStorage as integers
                    for (let date in allStatusDurations) {
                        for (let status in allStatusDurations[date]) {
                            allStatusDurations[date][status] = Math.floor(allStatusDurations[date][status]);
                        }
                    }

                    localStorage.setItem('allStatusDurations', JSON.stringify(allStatusDurations));

                    // Calculate Total Portal Hours, Utilization, and Goal Percentage
                    const durations = allStatusDurations[currentDate];
                    const in_portal = (durations['Offline'] || 0) + (durations['Available'] || 0) + (durations['Ringing'] || 0) + (durations['Interpreting'] || 0) + (durations['Wrap Up'] || 0) + (durations['Not Available'] || 0) + (durations['Rejected'] || 0);
                    const working = (durations['Available'] || 0) + (durations['Ringing'] || 0) + (durations['Interpreting'] || 0) + (durations['Wrap Up'] || 0);
                    const utilization = ((durations['Interpreting'] || 0)) / working;
                    const goalPercentage = ((durations['Interpreting'] || 0) / (320*60)) * 100; // Calculate goal percentage based on logged_in

                    // Calculate Current Week Working Time up to and including today
                    const lastMonday = getLastMonday();
                    const today = new Date();
                    today.setHours(23, 59, 59, 999); // Set to end of today for inclusive comparison
                    let currentWeekWorking = 0;
                    for (let date in allStatusDurations) {
                        const dateObj = new Date(date);
                        dateObj.setHours(0, 0, 0, 0); // Set to start of the day for accurate comparison
                        if (dateObj >= lastMonday && dateObj <= today) {
                            const dayDurations = allStatusDurations[date];
                            currentWeekWorking += (dayDurations['Available'] || 0) + (dayDurations['Ringing'] || 0) + (dayDurations['Interpreting'] || 0) + (dayDurations['Wrap Up'] || 0);
                        }
                    }

                    // Update the status display element for the current date
                    let displayText = '<strong>Status Durations:</strong><br>';
                    for (const [status, duration] of Object.entries(allStatusDurations[currentDate])) {
                        displayText += `<div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                            <span style="font-weight: bold;">${status}:</span>
                                            <span style="margin-left: auto;">${formatTime(duration)}</span>
                                        </div>`;
                    }
                    displayText += `<div><strong>In Portal:</strong> ${formatTime(in_portal)}</div>`;
                    displayText += `<div><strong>Working:</strong> ${formatTime(working)}</div>`;
                    displayText += `<div><strong>Utilization:</strong> ${isNaN(utilization) ? 'N/A' : (utilization * 100).toFixed(2) + '%'}</div>`;
                    displayText += `<div><strong>Goal:</strong> ${isNaN(goalPercentage) ? 'N/A' : goalPercentage.toFixed(2) + '%'}</div>`;
                    displayText += `<div><strong>Current Week Working:</strong> ${formatTime(currentWeekWorking)}</div>`;

                    document.getElementById('statusDisplay').innerHTML = displayText;
                }
            }, 1000);
        }
    }

    // Check if the .call-control-header exists every 500ms
    const checkHeaderInterval = setInterval(initStatusDisplay, 500);
})();