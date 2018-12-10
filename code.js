module.paths.push('/usr/local/lib/node_modules');

var fs = require('fs');
var cheerio = require('cheerio');

var JMdict = require('./dist/JMdict.json').JMdict.entry;
var raw = require("./source/assets.js");
var data = require("./source/otherassets.js");

data.wk_audio = require("./source/_wkaudio.json")[0];
data.core10k_audio = require("./source/_core10kaudio.json")[0];

var switcher = {
    test_data: false,
    jmdict_details: false,
    jmdict_non_freq: false,
    kanji_only: true,
    audio: false
};

// Add raw from JMdict Freq

raw.vocab_jmdict_freq = [];

JMdict.forEach(function(entry) {

    // if k_ele property is an array of k_ele
    if (Array.isArray(entry.k_ele)) {
        entry.k_ele.forEach(function (k_ele) {

            // if it has freq tag, add to the collection
            if (k_ele.ke_pri) {
                raw.vocab_jmdict_freq.push(k_ele.keb);
            }
        });

    // if k_ele property is the k_ele itself
    } else if (entry.k_ele && entry.k_ele.ke_pri) {
        raw.vocab_jmdict_freq.push(entry.k_ele.keb);
    }

});

// Add raw from JMdict All

raw.vocab_jmdict = [];

if (switcher.jmdict_non_freq) {
    JMdict.forEach(function(entry) {

        // if k_ele property is an array of k_ele
        if (Array.isArray(entry.k_ele)) {
            entry.k_ele.forEach(function (k_ele) {
                raw.vocab_jmdict.push(k_ele.keb);
            });

        // if k_ele property is the k_ele itself
        } else if (entry.k_ele) {
            raw.vocab_jmdict.push(entry.k_ele.keb);
        }
    });
} else {
    // If we don't add all jmdict words, we'll remove the extra kanjis from them.
    delete raw.kanji_jmdict_extra;
}

// Combine everything into one object

var fin = {};

Object.keys(raw).forEach(function(key) {
    raw[key].forEach(element => {
        if (!fin[element]) {
            fin[element] = {
                word: element,
                sources: [key]
            };
        } else {
            fin[element].sources.push(key);
        }
    });
});

process.stdout.write("Total unique items : " + Object.keys(fin).length + "\n"); 

// remove kanjiless items

Object.keys(fin).forEach(key => {
    // Only items with kanji
    if(!key.match(/[\u4e00-\u9faf\u3400-\u4dbf]/g)) {
        delete fin[key];

    // remove error items from manythings
    } else if (key.match(/�/g, "")) {
        delete fin[key];
    }
});

// Kanji only, only words with one character
if(switcher.kanji_only) {
    Object.keys(fin).forEach(key => {
        if(key.length != 1) {
            delete fin[key];
        }
    });
}

process.stdout.write("Removed kanjiless items : " + Object.keys(fin).length + "\n"); 

// remove duplicates in source array in each item

Object.keys(fin).forEach(function(key) {
    fin[key].sources = fin[key].sources.filter(function(item, pos) {
        return fin[key].sources.indexOf(item) == pos;
    });
});

// Select items for testing
// Set this part to false for production

if (switcher.test_data) {
    Object.keys(fin).forEach(function(key) {
        if(!["投票する", "立つ", "齎す", "齎", "〜年来", "諸〜", "擤"].includes(key)) {
            delete fin[key];
        }
    });
}

// JMdict details

if (switcher.jmdict_details) {
    // JMdict compact, remove unrelated JMdict items

    process.stdout.write("JMdict before compact : " + Object.keys(JMdict).length + " \n"); 

    keys = Object.keys(fin);
    keys.forEach(key => { // variant writings from WaniKani
        if (key.substring(key.length - 2, key.length) == "する") keys.push(key.substring(0, key.length - 2)); 
        if (key.substring(key.length - 1, key.length) == "〜") keys.push(key.substring(0, key.length - 1));
        if (key.substring(0, 1) == "〜") keys.push(key.substring(1, key.length));
    });

    i = 0;
    JMdict = JMdict.filter(entry => {
        process.stdout.write(`(${i++})`);

        var found = false;

        if (entry.k_ele) {
            if (!Array.isArray(entry.k_ele)) {
                entry.k_ele = [entry.k_ele];
            }

            entry.k_ele.forEach(k_ele => {
                if (keys.includes(k_ele.keb)) {
                    found = true;
                    return;
                }
            });
        }

        process.stdout.clearLine(); 
        process.stdout.cursorTo(0);  
        return found;
    });
    process.stdout.write("Compacted JMdict : " + Object.keys(JMdict).length + " \n");
    fs.writeFileSync('./dist/JMdict_compact.json', JSON.stringify(JMdict, null, 4), 'utf8'); 

    // Search for meaning

    process.stdout.write("Searching for meaning\n"); 
    keys = Object.keys(fin);
    index = 1;

    Object.keys(fin).forEach(function(key) {
        process.stdout.write(`(${index++}) Searching for ${key} ...`);

        keys = [key];
        if (key.substring(key.length - 2, key.length) == "する") keys.push(key.substring(0, key.length - 2));
        if (key.substring(key.length - 1, key.length) == "〜") keys.push(key.substring(0, key.length - 1));
        if (key.substring(0, 1) == "〜") keys.push(key.substring(1, key.length));

        var searchFoundings = JMdict.filter(entry => {

            var found = false;

            entry.k_ele.forEach(k_ele => {
                if (keys.includes(k_ele.keb)) {
                    found = true;
                    return;
                }
            });

            return found;
        });

        process.stdout.clearLine(); 
        process.stdout.cursorTo(0);  

        if(searchFoundings.length >= 1) {
            fin[key].jmdict_details = searchFoundings;
        } else {
            fin[key].jmdict_details = [];
        }
    });
    process.stdout.write("Done searching for meaning\n");

    // Get freq from JMdict

    Object.keys(fin).forEach(function(key) {
        jmdict_freq = [];

        fin[key].jmdict_details.forEach(entry => {
            entry.k_ele.forEach(k_ele => {
                if(k_ele.ke_pri && !Array.isArray(k_ele.ke_pri))
                    k_ele.ke_pri = [k_ele.ke_pri];

                if(k_ele.keb == key)
                    jmdict_freq = jmdict_freq.concat(k_ele.ke_pri);

            });
        });

        // remove duplicates and null
        jmdict_freq = jmdict_freq.filter(function(item, pos) {
            if(!item) {
                return false;
            }

            return jmdict_freq.indexOf(item) == pos;
        });

        fin[key].jmdict_freq = jmdict_freq;
    });
}

// Add audios
// Put false to skip audio 

if (switcher.audio) {
    Object.keys(fin).forEach(function(key) {
        if (data.core10k_audio[key]) {
            fin[key].audio = "[sound:" + data.core10k_audio[key] + "]";
        } else if(data.wk_audio[key]) {
            fin[key].audio = "[sound:" + data.wk_audio[key] + "]";
        } else {
            fin[key].audio = "";
        }
    });
} else {
    Object.keys(fin).forEach(function(key) {
        fin[key].audio = "";
    });
}

// Add kanji ID for sorting

i = 1;
Object.keys(fin).forEach(function(key) {
    if(key.length == 1){
        fin[key].kanji_id = i;
        i++;
    } else {
        fin[key].kanji_id = "";
    }
});

// Find all kanjis

Object.keys(fin).forEach(function(key) {
    fin[key].kanji_ids = [];
    key.split("").forEach(el => {
        if(fin[el]) {
            fin[key].kanji_ids.push(fin[el].kanji_id);
        }
    });

    fin[key].kanji_ids.sort((a, b) => b - a);
});

// Sort

var arrFin = [];
Object.keys(fin).forEach(function(key) {
    arrFin.push(fin[key]);
});

arrFin.sort(function(a, b) {
    for (var i = 0; i <= 10; i++) {
        if(typeof a.kanji_ids[i] == 'undefined') a.kanji_ids[i] = 0;
        if(typeof b.kanji_ids[i] == 'undefined') b.kanji_ids[i] = 0;
    }

    if(a.kanji_ids[0] != b.kanji_ids[0]) {
        return a.kanji_ids[0] > b.kanji_ids[0] ? 1 : -1;
    } else if(a.kanji_ids[1] != b.kanji_ids[1]) {
        return a.kanji_ids[1] > b.kanji_ids[1] ? 1 : -1;
    } else if(a.kanji_ids[2] != b.kanji_ids[2]) {
        return a.kanji_ids[2] > b.kanji_ids[2] ? 1 : -1;
    } else if(a.kanji_ids[3] != b.kanji_ids[3]) {
        return a.kanji_ids[3] > b.kanji_ids[3] ? 1 : -1;
    } else if(a.kanji_ids[4] != b.kanji_ids[4]) {
        return a.kanji_ids[4] > b.kanji_ids[4] ? 1 : -1;
    } else if(a.kanji_ids[5] != b.kanji_ids[5]) {
        return a.kanji_ids[5] > b.kanji_ids[5] ? 1 : -1;
    } else if(a.kanji_ids[6] != b.kanji_ids[6]) {
        return a.kanji_ids[6] > b.kanji_ids[6] ? 1 : -1;
    } else if(a.kanji_ids[7] != b.kanji_ids[7]) {
        return a.kanji_ids[7] > b.kanji_ids[7] ? 1 : -1;
    } else if(a.kanji_ids[8] != b.kanji_ids[8]) {
        return a.kanji_ids[8] > b.kanji_ids[8] ? 1 : -1;
    } else if(a.kanji_ids[9] != b.kanji_ids[9]) {
        return a.kanji_ids[9] > b.kanji_ids[9] ? 1 : -1;
    } else if(a.kanji_ids[10] != b.kanji_ids[10]) {
        return a.kanji_ids[10] > b.kanji_ids[10] ? 1 : -1;
    }

    if(a.word.length > b.word.length) return 1;
    if(a.word.length < b.word.length) return -1;
    return 0;
});

// Stringify
arrFin.forEach((element, index) => {
    arrFin[index].sources           = element.sources.join(" ");
    if(element.jmdict_details) arrFin[index].jmdict_details = JSON.stringify(element.jmdict_details).replace(/\t/g, "");
    arrFin[index].jmdict_freq       = element.jmdict_freq ? element.jmdict_freq.join(" ") : "";
    arrFin[index].kanji_ids         = element.kanji_ids.join(" ").replace(/ 0/g, "");
    arrFin[index].tags              = arrFin[index].sources + " " + arrFin[index].jmdict_freq + (element.word.length == 1 ? " kanji" : "");
});

fs.writeFileSync('./dist/fin.json', JSON.stringify(arrFin, null, 4), 'utf8'); 

// create csv

var csvstring = "";
arrFin.forEach((element, index) => {
    csvstring += 
        element.word + "\t" +
        (index + 1) + "\t" +
        element.sources + "\t" +
        element.jmdict_details + "\t" +
        element.jmdict_freq + "\t" +
        element.kanji_id + "\t" +
        element.kanji_ids + "\t" +
        element.audio + "\t" +
        element.tags +
        "\n";
});

fs.writeFileSync('./dist/fin.csv', csvstring, 'utf8'); 