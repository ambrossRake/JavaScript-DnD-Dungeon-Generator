
import * as assertFunctions from './assert.js';
import { getResultMessage } from './output.js';

/**
 * Summary
 *
 * @typedef {object} Summary
 *
 * @property {number} assertions
 * @property {number} failures
 * @property {Result[]} results
 * @property {string[]} errors
 */

/**
 * Assertion
 *
 * @typedef {(value: *, expected?: *) => Result} Assertion
 */

/**
 * Assertions
 *
 * @typedef {object} Assertions
 *
 * @property {Assertion} equals
 * @property {Assertion} equalsArray
 * @property {Assertion} equalsObject
 * @property {Assertion} isArray
 * @property {Assertion} isBoolean
 * @property {Assertion} isFalse
 * @property {Assertion} isFunction
 * @property {Assertion} isHtmlTag
 * @property {Assertion} isNull
 * @property {Assertion} isNumber
 * @property {Assertion} isObject
 * @property {Assertion} isString
 * @property {Assertion} isTrue
 * @property {Assertion} isUndefined
 * @property {Assertion} stringExcludes
 * @property {Assertion} stringIncludes
 * @property {Assertion} throws
 */

/**
 * Utility
 *
 * @typedef {object} Utility
 *
 * @property {(value:*) => Assertions} assert
 * @property {Function} describe
 * @property {Function} it
 */

/**
 * State
 *
 * @typedef {object} State
 *
 * @property {() => Summary} getSummary
 * @property {(error: string) => undefined} onError
 * @property {(path: string, tests: Function) => undefined} runUnits
 */

/**
 * Entry
 *
 * @typedef {object} Entry
 *
 * @property {string} msg
 * @property {boolean} isOk
 */

/**
 * Result
 *
 * @typedef {import('./assert.js').Result}
 */

// -- Config -------------------------------------------------------------------

/**
 * Scope
 *
 * @type {object.<string, string>}
 */
const scope = {
    assert  : 'assert()',
    describe: 'describe()',
    it      : 'it()',
    suite   : 'default()',
};

// -- Public Functions ---------------------------------------------------------

/**
 * Creates a closure containing unit test state: assertions, errors, and
 * failures. Returns an object of unit test operations.
 *
 * @type {State}
 */
export function useState() {

    /**
     * Assertions
     *
     * @type {number}
     */
    let assertions = 0;

    /**
     * Current
     *
     * @type {Entry[]}
     */
    let current = [];

    /**
     * Errors
     *
     * @type {string[]}
     */
    let errors = [];

    /**
     * Failures
     *
     * @type {number}
     */
    let failures = 0;

    /**
     * Results
     *
     * @type {Result[]}
     */
    let results = [];

    /**
     * Check scope
     *
     * @param {string} nextScope
     * @param {string[] array
     *
     * @throws
     */
    const checkScope = (nextScope, allowed) => {
        let currentEntry = current[current.length - 1];
        let currentScope = currentEntry.scope;

        if (!allowed.includes(currentScope)) {
            throw new TypeError(`${nextScope} must be called inside of ${allowed.join(' or ')}`);
        }
    };

    /**
     * Describe
     *
     * @param {string} msg
     * @param {Function} callback
     */
    const describe = (msg, callback) => {
        checkScope(scope.describe, [ scope.suite, scope.describe ]);

        current.push({ scope: scope.describe, msg });
        callback();
        current.pop();
    };

    /**
     * It
     *
     * @param {string} msg
     * @param {Function} callback
     */
    const it = (msg, callback) => {
        checkScope(scope.it, [ scope.describe ]);

        current.push({ scope: scope.it, msg });
        callback();
        current.pop();
    };

    /**
     * Run assert
     *
     * @param {*} actual
     * @param {*} expected
     * @param {Function} assertion
     *
     * @returns {Assertions}
     */
    const runAssert = (actual, expected, assertion) => {
        checkScope(scope.assert, [ scope.it ]);

        let result = assertion(actual, expected);
        let { msg, isOk } = result;

        assertions++;

        if (!isOk) {
            failures++;
        }

        current.push({
            scope: scope.assert,
            msg: `${isOk ? 'Pass:' : 'Failure:'} ${msg}`
        });

        results.push({
            isOk,
            msg: getResultMessage(current),
        });

        current.pop();

        return assert(actual);
    };

    /**
     * Assert
     *
     * @param {*} value
     *
     * @returns {Assertions}
     */
    const assert = (value) => Object.entries(assertFunctions).reduce((assertObj, [ key, assertion ]) => {
        assertObj[key] = (expected) => runAssert(value, expected, assertion);
        return assertObj;
    }, {});

    /**
     * Utility
     *
     * @type {Utility}
     */
    const utility = {
        assert,
        describe,
        it,
    };

    /**
     * Run units
     *
     * @param {string} path
     * @param {function} tests
     */
    const runUnits = (path, tests) => {
        current.push({ scope: scope.suite, msg: path });
        tests(utility);
        current.pop();
    };

    /**
     * Get summary
     *
     * @returns {Summary}
     */
    const getSummary = () => {
        return {
            assertions,
            errors: [ ...errors ],
            failures,
            results: [ ...results ],
        };
    };

    /**
     * Get summary
     *
     * @param {string} error
     */
    const onError = (error) => {
        let result = { isOk: false, msg: error };

        results.push(result);
        errors.push(result);
    };

    return {
        getSummary,
        onError,
        runUnits,
    };
}
