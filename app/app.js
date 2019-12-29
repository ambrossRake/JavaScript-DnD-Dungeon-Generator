
// TODO:
// Room type item affinity
// Flush out items
// Furniture
// Fill containers
// Doors, locked doors, keys
// Secret doors, secret rooms
// Traps
// Room vegetation
// Checkboxes for randomized sets
// Dungeon map item

import {
    actions,
    attachActions,
    toggleCollapsed,
    toggleVisibility,
} from './ui/action';

import { article, div, section } from './ui/block';
import { drawLegend } from './dungeons/legend';
import { generateDungeon } from './dungeons/generate';
import { generateItems } from './items/generate';
import { generateRooms } from './rooms/generate';
import { getKnobConfig } from './knobs';
import { getRoomDescription } from './rooms/description';
import { nav, setActive, getActive, pages } from './ui/nav';
import { renderKnobs, getFormData } from './ui/form';
import { toDash } from './utility/tools';

const navContainer     = document.getElementById('nav');
const knobContainer    = document.getElementById('knobs');
const contentContainer = document.getElementById('content');

const navigate = (target, el) => {
    el && setActive(el);

    let page = target || getActive(navContainer);

    let config = getKnobConfig(page);

    contentContainer.innerHTML = '';
    knobContainer.innerHTML    = renderKnobs(config, page);

    el && toggleCollapsed(`fieldset-${toDash(config[0].label)}`);
};

const formatRoom = (room, i) => article(getRoomDescription(room, i + 1) + room.items.join(''));

const getItems = (settings) => generateItems(settings).join('');

const getRooms = (settings) => {
    return generateRooms(settings).map((room, i) => formatRoom(room, i)).join('');
};

const getDungeon = (settings) => {
    let { map, rooms } = generateDungeon(settings);

    let legend     = drawLegend();
    let roomBlocks = rooms.map((room, i) => formatRoom(room, i)).join('');

    return map + legend + div(roomBlocks, { 'data-grid': true });
};

const generators = {
    [pages.dungeon]: getDungeon,
    [pages.items]  : getItems,
    [pages.room]   : getRooms,
};

const generate = () => {
    let settings  = getFormData(knobContainer);
    let page      = getActive(navContainer);
    let generator = generators[page]

    if (!generator) {
        throw 'Invalid page';
    }

    let text = generator(settings);

    contentContainer.innerHTML = section(text);
};

attachActions({
    [actions.expandCollapse]: toggleCollapsed,
    [actions.generate]: generate,
    [actions.navigate]: navigate,
    [actions.showHide]: toggleVisibility,
});

navContainer.innerHTML  = nav;

navigate();
generate();
