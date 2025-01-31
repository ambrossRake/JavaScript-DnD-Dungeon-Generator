
import { article } from '../ui/block.js';
import { capacity, itemSizeSpace, maxItemQuantitySmall } from './types/container.js';
import furnishing, {
    anyRoomFurniture,
    furnishingByRoomType,
    furnishingQuantityRanges,
    furnitureQuantity, // TODO rename?
    requiredRoomFurniture,
} from './types/furnishing.js';
import { generateItem } from './item.js';
import { getRarityDescription, getConditionDescription, getItemDescription } from './description.js';
import { knobs } from '../knobs.js';
import { list } from '../ui/list.js';
import { random } from '../utility/random.js';
import { roll, rollArrayItem } from '../utility/roll.js';
import { em, paragraph, subtitle,  } from '../ui/typography.js';
import condition from '../attributes/condition.js';
import quantity, { getRange, probability as quantityProbability } from '../attributes/quantity.js';
import size from '../attributes/size.js';

// TODO incomplete test coverage

/**
 * @typedef {import('../typedefs.js').Settings} Settings
 * @typedef {import('../typedefs.js').Item} Item
 */

// -- Config -------------------------------------------------------------------

/**
 * Maximum number of columns for dungeon item lists.
 *
 * TODO rename.
 *
 * @type {number}
 */
const maxColumnsItems = 4;

/**
 * Maximum number of columns for non-dungeon room item lists.
 *
 * @type {number}
 */
const maxColumnsRoom = 2;

// -- Private Functions --------------------------------------------------------

/**
 * Generates furnishings by room type.
 *
 * @param {string} roomType
 * @param {string} quantity
 *
 * @returns {Item[]}
 */
 function generateFurnishings(roomType, quantity) {
    let furniture = [];

    if (quantity === furnitureQuantity.none) {
        return furniture;
    }

    if (requiredRoomFurniture[roomType]) {
        requiredRoomFurniture[roomType].forEach((item) => {
            furniture.push(item);
        });
    }

    let extraItems = roll(1, furnishingQuantityRanges[quantity]);
    let itemSet    = furnishingByRoomType[roomType]
        ? anyRoomFurniture.concat(furnishingByRoomType[roomType])
        : Object.values(furnishing);

    for (let i = 0; i < extraItems; i++) {
        furniture.push(rollArrayItem(itemSet));
    }

    return furniture;
}

/**
 * Generate item objects
 *
 * @param {number} count
 * @param {Settings} settings
 *
 * @returns {object.<string, Item>}
 */
const generateItemObjects = (count, settings) => [ ...Array(count) ].reduce((obj) => {
    let item  = generateItem(settings);
    let label = item.label;

    // TODO use an identifier instead of label?
    if (!obj[label]) {
        obj[label] = { ...item };
        obj[label].count = 1;

        return obj;
    }

    obj[label].count++;

    return obj; // TODO rename to `items`
}, {});

/**
 * Get furnishing objects
 *
 * TODO rename to `getFurnishing()`
 * TODO move to furnishing.js
 *
 * @param {Item[]} furnishings
 * @param {string} roomCondition
 *
 * @returns {{ [label: string]: Item }}
 */
const getFurnishingObjects = (furnishings, roomCondition) => furnishings.reduce((obj, item) => {
    let label = item.label;

    if (roomCondition !== condition.average) {
        label += ` (${em(roomCondition)})`;
    }

    // TODO use an identifier instead of label?
    if (!obj[label]) {
        obj[label] = { ...item, label };
        obj[label].count = 1;

        return obj;
    }

    obj[label].count++;

    return obj;
}, {});

/**
 * Get item count based on quantity config.
 *
 * @param {string} itemQuantity
 *
 * @returns {number}
 */
 function getItemCount(itemQuantity) {
    let { min, max } = getRange(itemQuantity);

    return roll(min, max);
}

export const _private = {
    generateFurnishings,
    generateItemObjects,
    getFurnishingObjects,
    getItemCount,
};

// -- Public Functions ---------------------------------------------------------

/**
 * Generate items
 *
 * @param {import('../typedefs.js').Settings}
 *
 * TODO separate HTMl from generation logic
 *
 * @returns {string[]}
 */
export function generateItems(settings) {
    let {
        [knobs.roomType]      : roomType,
        [knobs.itemCondition] : itemCondition,
        [knobs.itemQuantity]  : itemQuantity,
        [knobs.itemRarity]    : itemRarity,
        [knobs.itemType]      : itemType,
        [knobs.roomFurnishing]: furnitureQuantity,
        [knobs.roomCondition] : roomCondition,
    } = settings;

    // TODO collapse
    if (!itemQuantity) {
        throw new TypeError('Item quantity is required in generateItems()');
    }

    if (!itemRarity) {
        throw new TypeError('Item rarity is required in generateItems()');
    }

    if (!itemType) {
        throw new TypeError('Item type is required in generateItems()');
    }

    if (!itemCondition) {
        throw new TypeError('Item condition is required in generateItems()');
    }

    let inRoom = Boolean(roomType); // TODO Boolean cast necessary?

    if (inRoom && !roomCondition) {
        throw new TypeError('Room condition is required for room in generateItems()');
    }

    if (itemQuantity === random) {
        itemQuantity = quantityProbability.roll();
    }

    if (itemQuantity === quantity.zero) {
        return inRoom ? [] : [ subtitle('Items (0)') ];
    }

    let count = getItemCount(itemQuantity);
    let items = generateItemObjects(count, settings);

    let containers = [];
    let smallItems = [];
    let remaining  = [];

    let furnishings   = inRoom ? generateFurnishings(roomType, furnitureQuantity) : [];
    let furnishingObj = getFurnishingObjects(furnishings, roomCondition);

    let total = count + furnishings.length;

    // TODO break out into function for testing
    Object.keys(furnishingObj).forEach((key) => {
        let item = furnishingObj[key];

        if (item.capacity) {
            containers.push(item);
            return;
        }

        remaining.push(item);
    });

    // TODO break out into function for testing
    Object.keys(items).forEach((key) => {
        let item = items[key];

        if (item.type === itemType.container) {
            containers.push(item);
            return;
        }

        if (item.size === size.tiny || item.size === size.small) {
            smallItems.push(item);
            return;
        }

        remaining.push(item);
    });

    // TODO break out into function for testing
    containers.forEach((_, index, array) => {
        let container = array[index];

        if (!smallItems.length) {
            return;
        }

        let contents       = [];
        let remainingSpace = capacity[container.size];
        let itemCount      = smallItems.length;

        for (let i = 0; i < itemCount; i++) {
            if (remainingSpace <= 0) {
                continue;
            }

            let item = smallItems[0];

            if (!item) {
                continue;
            }

            if (item.quantity > maxItemQuantitySmall) {
                continue;
            }

            let spaceRequired     = itemSizeSpace[item.size];
            let spaceAfterAdded   = remainingSpace - spaceRequired;

            if (spaceAfterAdded < 0) {
                continue;
            }

            remainingSpace = spaceAfterAdded;

            contents.push(smallItems.shift());
        };

        if (contents.length) {
            container.contents = contents;
        }
    });

    let emptyContainers = [];

    let containerList = containers.map((container) => {
        let hasStuff = container.contents;

        if (!hasStuff) {
            emptyContainers.push(container);
            return;
        }

        let items = container.contents.length && container.contents.map((item) => getItemDescription(item));
        let desc  = getItemDescription(container);

        return article(desc + (items ? list(items) : ''));
    }).filter(Boolean).join('');

    let notContained = remaining.concat(smallItems, emptyContainers).map((item) => getItemDescription(item));
    let maxColumns   = inRoom ? maxColumnsRoom : maxColumnsItems;
    let columns      = Math.min(maxColumns, Math.max(1, Math.floor(notContained.length / maxColumns)));

    let itemList = containerList;

    if (notContained.length) {
        itemList += list(notContained, { 'data-columns': columns });
    }

    let descriptions = [];

    if (itemQuantity !== quantity.one && itemCondition !== random) {
        let conditionDescription = getConditionDescription(itemCondition)
        conditionDescription && descriptions.push(conditionDescription);
    }

    if (itemQuantity !== quantity.one && itemRarity !== random) {
        let rarityDescription = getRarityDescription(itemRarity);
        rarityDescription && descriptions.push(rarityDescription)
    }

    let description = descriptions.length && paragraph(descriptions.map((desc) => desc).join(' | '));

    return [
        subtitle(`Items (${total})`),
        description,
        itemList,
    ].filter(Boolean);
}
