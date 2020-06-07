
import runSuite from './run.js';
import suite from './suite.js';
import unit from './unit.js';

import {
    dot,
    log,
    nav,
    render,
    scopeList,
    summary,
} from './output.js';

/**
 * URL params
 *
 * @type {URLSearchParams}
 */
const urlParams = new URLSearchParams(window.location.search);

/**
 * Scope
 *
 * @type {string}
 */
const scope = urlParams.get('scope');

/**
 * Verbose
 *
 * @type {boolean}
 */
const verbose = Boolean(urlParams.get('verbose'));

const dotsContainer    = document.getElementById('dots');
const infoContainer    = document.getElementById('info');
const logContainer     = document.getElementById('log');
const navContainer     = document.getElementById('nav');
const statusContainer  = document.getElementById('status');
const summaryContainer = document.getElementById('summary');

/**
 * Delay
 *
 * @param {number} [ms=0]
 *
 * @returns {Promise}
 */
const delay = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Append
 *
 * @param {Result} result
 *
 * @returns {Element}
 */
const drawDot = (result) => dotsContainer.appendChild(dot(result));

/**
 * Animate dots
 *
 * @param {Result[]} results
 *
 * @returns {Promise}
 */
const animateDots = (results) => new Promise(async (resolve) => {
    let chunkSize = Math.ceil(results.length / 100);
    let current   = 0;

    for (let i = 0; i < Math.ceil(results.length / chunkSize); i++) {
        await delay();

        for (let x = 0; x < chunkSize; x++) {
            if (!results[current]) {
                break;
            }

            drawDot(results[current]);
            current++;
        }
    }

    resolve();
});

/**
 * On complete
 *
 * @param {import('./unit.js').Summary}
 */
const onComplete = async ({ assertions, errors, failures, results }) => {
    await animateDots(results);
    render(statusContainer, 'Complete');
    render(summaryContainer, summary(assertions, failures, errors.length));
    render(logContainer, log(results, { verbose }));
};

render(navContainer, nav({
    scope,
    verbose,
}));

(() => {
    const list = Object.keys(suite);

    if (scope === 'list') {
        render(statusContainer, 'Tests');
        render(logContainer, scopeList(list, { verbose }));
        return;
    }

    let testScope = list.includes(scope) ? scope : undefined;

    render(statusContainer, 'Running tests');
    render(infoContainer, `Tests: ${testScope ? scope : 'All'}`);

    onComplete(runSuite(unit(), suite, testScope));
})();
