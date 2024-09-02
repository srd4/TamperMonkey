// ==UserScript==
// @name         Auto Answer Calls with Delay
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Automatically click the "Answer" button when a call is ringing after a 13-second delay.
// @author       You
// @match        https://interpreters.propio-ls.com/portal
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

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

    // Function to handle the call status and click "Answer" if status is "Ringing"
    function handleRingingStatus() {
        const headlines = document.querySelectorAll('h2.app-headline');
        if (headlines.length > 1) {
            const statusText = headlines[1].textContent;
            const currentStatus = statusText.split('Call Status: ')[1].trim();
            if (currentStatus === 'Ringing') {
                // Delay the click action by 13 seconds
                setTimeout(() => {
                    clickButtonByText('Accept');
                }, 13000); // 13 seconds delay
            }
        }
    }

    // Poll for the call status element and handle status changes
    setInterval(handleRingingStatus, 1000);
})();