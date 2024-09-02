// ==UserScript==
// @name         Auto Break
// @namespace    http://tampermonkey.net/
// @version      2024-08-13
// @description  Auto press stop calls and back after an amount of time relative to call duration.
// @author       You
// @match        https://interpreters.propio-ls.com/portal
// @icon         https://www.google.com/s2/favicons?sz=64&domain=propio-ls.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log("Auto Break script initialized.");

    // Define a variable outside the function scope to indicate if the 'Stop Calls' has been clicked
    let stopCallsClicked = false;

    // Function to get the total interpreting time for the current day from localStorage
    function getTodayInterpretingTime() {
        const today = new Date().toDateString();
        const allStatusDurations = JSON.parse(localStorage.getItem('allStatusDurations') || '{}');
        const todayStats = allStatusDurations[today] || {};
        // Interpreting time is stored in seconds, convert it to minutes
        const interpretingTime = (todayStats['Interpreting'] || 0) / 60;
        console.log(`Today's interpreting time in minutes: ${interpretingTime}`);
        return interpretingTime;
    }

    // Function to get the duration of the last interpreting call in minutes
    function getLastCallDuration() {
        // Get the duration in seconds from localStorage and convert it to minutes
        const lastCallDuration = parseInt(localStorage.getItem('lastCallDuration') || '0', 10) / 60;
        console.log(`Last call duration in minutes: ${lastCallDuration}`);
        return lastCallDuration;
    }

    // Function to calculate the break time proportion based on the goal and shift time left with added debug prints
    function calculateBreakProportion() {
        console.log("Starting calculation of break proportion.");
        const goalMinutes = 320;
        console.log(`Goal minutes for the day: ${goalMinutes}`);
        const interpretedMinutesToday = getTodayInterpretingTime();
        console.log(`Interpreted minutes today: ${interpretedMinutesToday}`);
        const minutesLeftToGoal = goalMinutes - interpretedMinutesToday;
        console.log(`Minutes left to reach goal: ${minutesLeftToGoal}`);
        const shiftEndTime = new Date();
        shiftEndTime.setHours(16, 0, 0, 0); // Shift ends at 4 PM
        console.log(`Shift end time set to: ${shiftEndTime.toTimeString()}`);
        const currentTime = new Date();
        console.log(`Current time: ${currentTime.toTimeString()}`);
        const shiftTimeLeftInMinutes = (shiftEndTime - currentTime) / 60000;
        console.log(`Shift time left in minutes: ${shiftTimeLeftInMinutes}`);
        const breakTimeLeft = shiftTimeLeftInMinutes - minutesLeftToGoal;
        console.log(`Break time left in minutes: ${breakTimeLeft}`);
        const breakProportion = breakTimeLeft / shiftTimeLeftInMinutes;
        console.log(`Final break proportion calculated: ${breakProportion}`);
        return breakProportion;
    }

    // Function to click a button based on its text content
    function clickButtonByText(textContent) {
        const xpath = `//button[span[contains(text(), '${textContent}')]]`;
        const button = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (button) {
            console.log(`Clicking button: ${textContent}`);
            button.click();
        } else {
            console.log(`Button with text "${textContent}" not found`);
        }
    }

    // Function to handle the call status changes
    function handleCallStatusChange(statusText) {
        if (statusText === 'Wrap Up' && !stopCallsClicked) {
            console.log("Wrap Up detected, proceeding with stop calls process.");
            // Set stopCallsClicked to true to prevent multiple clicks
            stopCallsClicked = true;
            console.log(`stopCallsClicked set to: ${stopCallsClicked}`);

            // Define the milliseconds it takes for wrap up
            const wrapUpTime = 106999; // 1 minute and 30 seconds in milliseconds
            console.log(`Wrap up time defined as: ${wrapUpTime} ms`);

            // Wait before clicking 'Stop Calls'
            setTimeout(() => {
                clickButtonByText('Stop Calls');
                // After clicking 'Stop Calls', calculate wait time based on the proportion of break time
                const breakProportion = calculateBreakProportion();
                console.log(`Break proportion: ${breakProportion}`);
                const lastCallDurationMinutes = getLastCallDuration();
                console.log(`Last call duration in minutes: ${lastCallDurationMinutes}`);
                const dayOfWeek = new Date().getDay();
                let waitTime;
                if (dayOfWeek === 0 || dayOfWeek === 6) { // 0 is Sunday, 6 is Saturday
                    waitTime = lastCallDurationMinutes * 60 * 1000; // Use this on weekends
                } else {
                    waitTime = (lastCallDurationMinutes * 60 * 1000 * breakProportion) - wrapUpTime; // Use this on weekdays
                }
                console.log(`Calculated wait time before starting calls again: ${waitTime} ms`);
                setTimeout(() => {
                    clickButtonByText('Start Calls');
                    // Reset stopCallsClicked to allow for future clicks
                    stopCallsClicked = false;
                    console.log(`stopCallsClicked reset to: ${stopCallsClicked}`);
                }, waitTime > 1000 ? waitTime : 1000); // Ensure waitTime is not negative
            }, wrapUpTime);
        }
    }

    // Poll for the call status element and handle status changes
    setInterval(() => {
        const headlines = document.querySelectorAll('h2.app-headline');
        if (headlines.length > 1) {
            const statusText = headlines[1].textContent;
            const currentStatus = statusText.split('Call Status: ')[1].trim();
            handleCallStatusChange(currentStatus);
        }
    }, 1000);
})();
