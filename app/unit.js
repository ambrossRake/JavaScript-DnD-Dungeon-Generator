
import { getNav, getOutput } from './unit/output.js';
import { useState } from './unit/state.js';
import suite from './unit/suite.js';

// -- Config -------------------------------------------------------------------

/**
 * Container unit test output is rendered to.
 *
 * @type {Element}
 */
 const contentContainer = document.getElementById('content');

 /**
 * Container unit test navigation is rendered to.
 *
 * @type {Element}
 */
 const navContainer = document.getElementById('nav');

/**
 * URL params
 *
 * @type {URLSearchParams}
 */
const urlParams = new URLSearchParams(window.location.search);

/**
 * URL parameter to run a specific test file.
 *
 * @type {string}
 */
const scope = urlParams.get('scope');

/**
 * URL parameter to include verbose output.
 *
 * @type {boolean}
 */
const verbose = Boolean(urlParams.get('verbose'));

// -- Initialization -----------------------------------------------------------

navContainer.innerHTML     = getNav({ scope, verbose });
contentContainer.innerHTML = getOutput(suite, useState(), {
    scope,
    verbose,
    onError: console.error,
    onSuccess: console.log,
});
