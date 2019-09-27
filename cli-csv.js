#!/usr/bin/env node

const fs = require('fs');
const { chamJpDeckMakerCSV } = require('./code.js');

try {
    if (fs.existsSync('./cham_jp_deck.csv')) {
        throw new Error('./cham_jp_deck.csv exists, please move or delete it and rerun the command.')
    };
    
    chamJpDeckMakerCSV();
} catch (e) {
    console.error(e);
}
