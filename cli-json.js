#!/usr/bin/env node

const fs = require('fs');
const { chamJpDeckMakerJSON } = require('./code.js');

try {
    if (fs.existsSync('./cham_jp_deck.json')) {
        throw new Error('./cham_jp_deck.json exists, please move or delete it and rerun the command.')
    };
    
    chamJpDeckMakerJSON();
} catch (e) {
    console.error(e);
}
