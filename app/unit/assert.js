
/**
 * Result
 *
 * @typedef {Object} Result
 *
 * @property {string} msg
 * @property {boolean} isOk
 */

// -- Config -------------------------------------------------------------------

 /**
  * Empty elements
  *
  * TODO rename to `selfClosingElements`
  *
  * @type {string[]}
  */
const emptyElements = [
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
];

// -- Public Functions ---------------------------------------------------------

/** @type {(value: *, expected: *) => Result} equals */
export function equals(value, expected) {
    let isOk = expected === value;
    let msg  = `expected "${value}" to equal "${expected}"`;

    return { msg, isOk };
}

/** @type {(value: *, expected: *[]) => Result} equalsArray */
export function equalsArray(value, expected) {
    let checkType = isArray(value);

    if (!checkType.isOk) {
        return checkType;
    }

    if (value.length !== expected.length) {
        return {
            msg: `expected array length of ${value.length} to be ${expected.length}`,
            isOk: false,
        };
    }

    let msg  = `expected [ ${value.join(', ')} ] to equal [ ${expected.join(', ')} ]`;
    let isOk = value.filter((a, i) => a === expected[i]).length === value.length;

    return { msg, isOk };
}

/** @type {(value: *, expected: object) => Result} equalsObject */
export function equalsObject(value, expected) {
    let checkType = isObject(value);

    if (!checkType.isOk) {
        return checkType;
    }

    let isOk = JSON.stringify(value) === JSON.stringify(expected);
    let msg  = `expected object\n\n${JSON.stringify(value, null, 1)}\n\nto equal\n\n${JSON.stringify(expected, null, 1)}`;

    return { msg, isOk };
}

/** @type {(value: *) => Result} isArray */
export function isArray(value) {
    let isOk = Array.isArray(value);
    let msg  = `expected "${value}" to be an array`;

    return { msg, isOk };
}

/** @type {(value: *) => Result} isBoolean */
export function isBoolean(value) {
    let isOk = typeof value === 'boolean';
    let msg  = `expected "${value}" to be boolean`;

    return { msg, isOk };
}

/** @type {(value: *) => Result} isFalse */
export function isFalse(value) {
    let isOk = value === false;
    let msg  = `expected "${value}" to be false`;

    return { msg, isOk };
}

/** @type {(value: *) => Result} isFunction */
export function isFunction(value) {
    let isOk = typeof value === 'function';
    let msg  = `expected "${value}" to be a function`;

    return { msg, isOk };
}

/** @type {(value: *, tag: string) => Result} isHtmlTag */
export function isHtmlTag(value, tag) {
    let checkType = isString(value);

    if (!checkType.isOk) {
        return checkType;
    }

    let regExp  = new RegExp('^<'+tag+'(?:>| [^>]+>)', 'g');
    let isEmpty = emptyElements.includes(tag);
    let isOk    = regExp.test(value) && value.endsWith(isEmpty ? ' />' : `</${tag}>`);
    let msg     = `expected "${value}" to be an html tag string of ${isEmpty ? `<${tag} />` : `<${tag}>*</${tag}>`}`;

    return { msg, isOk };
}

/** @type {(value: *) => Result} isNull */
export function isNull(value) {
    let isOk = value === null;
    let msg  = `expected "${value}" to be a null`;

    return { msg, isOk };
}

/** @type {(value: *) => Result} isNumber */
export function isNumber(value) {
    let isOk = typeof value === 'number' && !isNaN(value);
    let msg  = `expected "${value}" to be a number`;

    return { msg, isOk };
}

/** @type {(value: *) => Result} isObject */
export function isObject(value) {
    let isOk = !!value && typeof value === 'object' && !Array.isArray(value);
    let msg  = `expected "${value}" to be an object`;

    return { msg, isOk };
}

/** @type {(value: *) => Result} isString */
export function isString(value) {
    let isOk = typeof value === 'string';
    let msg  = `expected "${value}" to be a string`;

    return { msg, isOk };
}

/** @type {(value: *) => Result} isTrue */
export function isTrue(value) {
    let isOk = value === true;
    let msg  = `expected "${value}" to be true`;

    return { msg, isOk };
}

/** @type {(value: *) => Result} isUndefined */
export function isUndefined(value) {
    let isOk = value === undefined;
    let msg  = `expected "${value}" to be undefined`;

    return { msg, isOk };
}

/** @type {(value: *, includes: string) => Result} stringIncludes */
export function stringIncludes(value, includes) {
    let checkType = isString(value);

    if (!checkType.isOk) {
        return checkType;
    }

    if (includes === '') {
        throw new TypeError('Invalid empty string expected in `stringIncludes`');
    }

    let isOk = value.includes(includes);
    let msg  = `expected "${value}" to include "${includes}"`;

    return { msg, isOk };
}

/** @type {(value: *, excludes: string) => Result} stringExcludes */
export function stringExcludes(value, excludes) {
    let checkType = isString(value);

    if (!checkType.isOk) {
        return checkType;
    }

    let { isOk, msg } = stringIncludes(value, excludes);

    return { msg, isOk: !isOk };
}

/** @type {(func: *, expectedErrorMsg: string) => Result} throws */
export function throws(func, expectedErrorMsg) {
    let checkFunc = isFunction(func);

    if (!checkFunc.isOk) {
        return checkFunc;
    }

    let errorMsg;

    try {
        func();
    } catch(e) {
        errorMsg = e.message;
    }

    if (!errorMsg) {
        return {
            isOk: false,
            msg: `expected function "${func.name}" to throw`,
        };
    }

    let isOk = errorMsg === expectedErrorMsg;
    let msg  = `expected "${errorMsg}" to equal "${expectedErrorMsg}"`;

    return { msg, isOk };
}
