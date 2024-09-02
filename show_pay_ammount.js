// ==UserScript==
// @name         Show Pay Amount in COP
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Update Pay based on Minutes * 0.11 USD and convert to COP, with rate fetching optimization
// @author       You
// @match        https://interpreters.propio-ls.com/portal
// @icon         https://www.google.com/s2/favicons?sz=64&domain=propio-ls.com
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    let lastFetchedTime = 0;
    let cachedConversionRate = null;

    async function fetchConversionRate() {
        const currentTime = Date.now();
        // Check if last fetched time is more than 1 hour ago
        if (currentTime - lastFetchedTime > 3600000 || !cachedConversionRate) { // 3600000 ms = 1 hour
            return new Promise((resolve, reject) => {
                fetch(`https://v6.exchangerate-api.com/v6/da23212cc2358198912402ab/latest/USD`)
                .then(response => response.json())
                .then(data => {
                    if (data && data.result === "success") {
                        cachedConversionRate = data.conversion_rates.COP;
                        lastFetchedTime = currentTime;
                        resolve(cachedConversionRate);
                    } else {
                        reject(new Error('Failed to fetch conversion rate'));
                    }
                })
                .catch(error => reject(error));
            });
        } else {
            return Promise.resolve(cachedConversionRate);
        }
    }

    async function recalculatePay() {
        try {
            const conversionRate = await fetchConversionRate();
            const rows = document.querySelectorAll('.mat-mdc-table .mat-mdc-row');
            rows.forEach(row => {
                const durationCell = row.querySelector('.mat-mdc-cell.mdc-data-table__cell.cdk-cell.cdk-column-callDuration.mat-column-callDuration.ng-star-inserted');
                const payCell = row.querySelector('.mat-mdc-cell.mdc-data-table__cell.cdk-cell.cdk-column-pay.mat-column-pay.ng-star-inserted');
                if (durationCell && payCell) {
                    let minutes = parseInt(durationCell.textContent.trim(), 10);
                    const payUSD = minutes * 0.11;
                    const payCOP = (payUSD * conversionRate).toFixed(2);
                    payCell.textContent = `Pay: $${payCOP} COP ($${payUSD.toFixed(2)})`;
                }
            });

            // Original functionality to update labels
            const labels = document.querySelectorAll('.mdc-evolution-chip__text-label.mat-mdc-chip-action-label');
            let minutes = 0;
            labels.forEach(label => {
                if(label.textContent.includes('Minutes')) {
                    let minutesText = label.textContent.split('Minutes:')[1].trim();
                    minutes = parseInt(minutesText.replace(',', ''), 10);
                }
            });
            const payUSD = minutes * 0.11;
            const payCOP = (payUSD * conversionRate).toFixed(2);
            labels.forEach(label => {
                if(label.textContent.includes('Pay')) {
                    label.textContent = `Pay: $${payCOP} COP ($${payUSD})`;
                }
            });
        } catch (error) {
            console.error('Error fetching conversion rate:', error);
        }
    }

    setInterval(recalculatePay, 1000);
})();