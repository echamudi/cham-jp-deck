module.paths.push('/usr/local/lib/node_modules');

var fs = require('fs');
var cheerio = require('cheerio');

var raw = require("./source/assets.js");
var data = require("./source/otherassets.js");

var JMdict = require('./dist/JMdict.json').JMdict.entry;
var KANJIDIC = require('./dist/kanjidic2.json').kanjidic2.character;

data.wk_audio = require("./source/_wkaudio.json")[0];
data.core10k_audio = require("./source/_core10kaudio.json")[0];

var switcher = {
    test_data: false,
    jmdict_details: true,
    jmdict_non_freq: false,
    kanjidic_details: true,
    kanji_only: false,
    audio: true
};

// Fix JMDict array consistencies

process.stdout.write("JMDict arrayfication...\n"); 

JMdict.forEach(function(entry) {
    if (entry.k_ele && !Array.isArray(entry.k_ele)) entry.k_ele = [entry.k_ele]; 

    if(entry.k_ele) {
        entry.k_ele.forEach(k_ele => {
            if (k_ele.ke_inf && !Array.isArray(k_ele.ke_inf)) k_ele.ke_inf = [k_ele.ke_inf]; 
            if (k_ele.ke_pri && !Array.isArray(k_ele.ke_pri)) k_ele.ke_pri = [k_ele.ke_pri]; 
        });
    }

    if (entry.r_ele && !Array.isArray(entry.r_ele)) entry.r_ele = [entry.r_ele]; 
    entry.r_ele.forEach(r_ele => {
        if (r_ele.re_restr && !Array.isArray(r_ele.re_restr)) r_ele.re_restr = [r_ele.re_restr]; 
        if (r_ele.re_inf && !Array.isArray(r_ele.re_inf)) r_ele.re_inf = [r_ele.re_inf]; 
        if (r_ele.re_pri && !Array.isArray(r_ele.re_pri)) r_ele.re_pri = [r_ele.re_pri]; 
    });    

    if (entry.sense && !Array.isArray(entry.sense)) entry.sense = [entry.sense]; 

    entry.sense.forEach(sense => {
        if (sense.stagk && !Array.isArray(sense.stagk)) sense.stagk = [sense.stagk]; 
        if (sense.stagr && !Array.isArray(sense.stagr)) sense.stagr = [sense.stagr]; 
        if (sense.pos && !Array.isArray(sense.pos)) sense.pos = [sense.pos]; 
        if (sense.xref && !Array.isArray(sense.xref)) sense.xref = [sense.xref]; 
        if (sense.ant && !Array.isArray(sense.ant)) sense.ant = [sense.ant]; 
        if (sense.field && !Array.isArray(sense.field)) sense.field = [sense.field]; 
        if (sense.misc && !Array.isArray(sense.misc)) sense.misc = [sense.misc]; 
        if (sense.s_inf && !Array.isArray(sense.s_inf)) sense.s_inf = [sense.s_inf]; 
        if (sense.lsource && !Array.isArray(sense.lsource)) sense.lsource = [sense.lsource]; 
        if (sense.dial && !Array.isArray(sense.dial)) sense.dial = [sense.dial]; 
        if (sense.gloss && !Array.isArray(sense.gloss)) sense.gloss = [sense.gloss]; 
    });
});
process.stdout.write("JMDict arrayfication done\n"); 

// KANJIDIC Fix

process.stdout.write("JMDict restructuring...\n"); 

var temp = {};
KANJIDIC.forEach(function(character) {
    temp[character.literal] = character;
});
KANJIDIC = temp;
process.stdout.write("JMDict restructuring done\n"); 

// Add raw from JMdict Freq

raw.vocab_jmdict_freq = [];

JMdict.forEach(function(entry) {

    if (entry.k_ele) {
        entry.k_ele.forEach(function (k_ele) {

            // if it has freq tag, add to the collection
            if (k_ele.ke_pri) {
                raw.vocab_jmdict_freq.push(k_ele.keb);
            }
        });
    }
});

// Add raw from JMdict All

raw.vocab_jmdict = [];

if (switcher.jmdict_non_freq) {
    JMdict.forEach(function(entry) {

        entry.k_ele.forEach(function (k_ele) {
            raw.vocab_jmdict.push(k_ele.keb);
        });

    });
} else {
    // If we don't add all jmdict words, we'll remove the extra kanjis from assets.js
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
            // If it's already exist in fin, just add the source tags
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

process.stdout.write("Total items after removing kanjiless items : " + Object.keys(fin).length + "\n"); 

// Kanji only mode, only words with one character
if(switcher.kanji_only) {
    process.stdout.write("Kanji mode..." + Object.keys(fin).length + "\n"); 

    Object.keys(fin).forEach(key => {
        if(key.length != 1) {
            delete fin[key];
        }
    });

    process.stdout.write("Total items after kanji mode filter: " + Object.keys(fin).length + "\n"); 
}

// remove duplicates in source array in each item

Object.keys(fin).forEach(function(key) {
    fin[key].sources = fin[key].sources.filter(function(item, pos) {
        return fin[key].sources.indexOf(item) == pos;
    });
});

// Select items for testing
// Set this part to false for production

if (switcher.test_data) {
    process.stdout.write("Test mode on\n"); 

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

// KANJIDIC

if (switcher.kanjidic_details) {
    Object.keys(fin).forEach(function(key) {
        if(key.length == 1 && KANJIDIC[key]) {
            fin[key].kanjidic_details = KANJIDIC[key];
            fin[key].kanjidic_misc    = [];
            if (KANJIDIC[key].misc.grade) fin[key].kanjidic_misc.push(`kanjidic_grade_${KANJIDIC[key].misc.grade}`);
            if (KANJIDIC[key].misc.stroke_count) fin[key].kanjidic_misc.push(`kanjidic_stroke_${KANJIDIC[key].misc.stroke_count}`);
            if (KANJIDIC[key].misc.jlpt) fin[key].kanjidic_misc.push(`kanjidic_jlpt_${KANJIDIC[key].misc.jlpt}`);
        }
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

// Delete 

// Save JSON
fs.writeFileSync('./dist/fin.json', JSON.stringify(arrFin, null, 4), 'utf8'); 

// Create CSV
var csvstring = "";
arrFin.forEach((element, index) => {
    csvstring += 
        element.word + 
        "\t" +
        (index + 1) + 
        "\t" +
        element.sources.join(" ") + 
        "\t" +
        (element.kanjidic_details ? JSON.stringify(element.kanjidic_details).replace(/\t/g, "") : "") + 
        "\t" +
        (element.kanjidic_misc ? element.kanjidic_misc.join(" ") : "") + 
        "\t" +
        (element.jmdict_details ? JSON.stringify(element.jmdict_details).replace(/\t/g, "") : "") + 
        "\t" +
        (element.jmdict_freq ? element.jmdict_freq.join(" ") : "") + 
        "\t" +
        element.kanji_id + 
        "\t" +
        element.kanji_ids.join(" ").replace(/ 0/g, "") + 
        "\t" +
        element.audio + 
        "\t" +
        (element.sources.join(" ") + " " + (element.kanjidic_misc ? element.kanjidic_misc.join(" ") : "") + " " + (element.jmdict_freq ? element.jmdict_freq.join(" ") : "") + " " + (element.word.length == 1 ? "kanji" : "")) + // tags
        "\n";
});

// Save CSV
fs.writeFileSync('./dist/fin.csv', csvstring, 'utf8'); 