// @ts-check

// module.paths.push('/usr/local/lib/node_modules');

const fs = require('fs');
const xml2json = require('xml2json');
const kanji = require('kanji');
const csvtojson = require("csvtojson");

async function chamJpDeckMaker(jmdictPath, kanjidicPath) {
    const raw = require(__dirname + "/source/assets.js");

    console.log('Loading JMdict');
    /** @type {any} */
    const JMdictJSON = xml2json.toJson(fs.readFileSync('./JMdict_e', 'utf8'), {
        object: true,
    });
    const JMdict = JMdictJSON.JMdict.entry;

    console.log('Loading KANJIDIC');
    /** @type {any} */
    const KANJIDICJSON = xml2json.toJson(fs.readFileSync('./kanjidic2.xml', 'utf8'), {
        object: true,
    });
    const KANJIDIC = KANJIDICJSON.kanjidic2.character;

    console.log('👍 Done loading files');

    const switcher = {
        test_data: false,
        jmdict_details: true,
        jmdict_non_freq: false,
        kanjidic_details: true,
        kanji_only: false,
    };

    // Sort kanji_kanken10 to kanji_kanken2 by freq

    const joyo_kanji_order = {};
    raw.kanji_joyo.forEach(function (el, i) {
        joyo_kanji_order[el] = i + 1;
    });

    function kanji_sorter(a, b) {
        if (joyo_kanji_order[a] < joyo_kanji_order[b]) return -1;
        return 1;
    }

    for (var i = 10; i >= 2; i--) {
        raw[`kanji_kanken${i}`].sort(kanji_sorter);
    }
    raw[`kanji_kanken2jyun`].sort(kanji_sorter);

    // Fix JMDict array consistencies

    process.stdout.write("Creating JMDict object...\n");

    JMdict.forEach(function (entry) {
        if (entry.k_ele && !Array.isArray(entry.k_ele)) entry.k_ele = [entry.k_ele];

        if (entry.k_ele) {
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

    // JMDict build dictionary object

    const JMdictObj = {};
    JMdict.forEach(function (entry) {
        // If the entry has kanji writing
        if (entry.k_ele) entry.k_ele.forEach(k_ele => {
            // Create array if it's not in the new dict yet
            if (!JMdictObj[k_ele.keb]) {
                JMdictObj[k_ele.keb] = [entry];
                // Otherwise, push the alternate meaning 
            } else {
                JMdictObj[k_ele.keb].push(entry);
            }
        });
    });
    process.stdout.write("👍 Done JMDict creating object\n");

    // KANJIDIC Restructure

    process.stdout.write("Creating KANJIDIC object...\n");
    var KANJIDICObj = {};
    KANJIDIC.forEach(function (character) {
        KANJIDICObj[character.literal] = character;
        if (character.reading_meaning) {
            if (!Array.isArray(character.reading_meaning.rmgroup.reading))
                character.reading_meaning.rmgroup.reading =
                    [character.reading_meaning.rmgroup.reading];
            if (!Array.isArray(character.reading_meaning.rmgroup.meaning))
                character.reading_meaning.rmgroup.meaning =
                    [character.reading_meaning.rmgroup.meaning];
        }
    });
    process.stdout.write("👍 Done creating KANJIDIC object\n");

    process.stdout.write("CCD creating object...\n");

    var CCDObj = {};
    // Initial CCD Obj
    Object.keys(KANJIDICObj).forEach(kanjiChar => {
        if (kanjiChar.length > 1) {
            CCDObj[kanjiChar] = { element: kanjiChar };
            return;
        }

        CCDObj[kanjiChar] = kanji.kanjiTree(kanjiChar);

        if (CCDObj[kanjiChar] === null) {
            CCDObj[kanjiChar] = { element: kanjiChar };
            return;
        }
    });

    // Rename the property names
    const CCDRenamer = function (comp) {
        comp.kanji = comp.element;
        delete comp.element;

        if (comp.g) {
            comp.compositions = comp.g;
            delete comp.g;

            comp.compositions.forEach(subComp => {
                CCDRenamer(subComp);
            });
        }
    }

    // Fill meaning and reading
    const CCDFiller = function (comp) {
        comp.meaning = [];
        comp.reading = [];

        if (KANJIDICObj[comp.kanji] && KANJIDICObj[comp.kanji].reading_meaning) {
            // Get reading
            KANJIDICObj[comp.kanji].reading_meaning.rmgroup.reading.forEach(reading => {
                if (reading && reading.r_type == "ja_on") comp.reading.push(reading.$t);
                if (reading && reading.r_type == "ja_kun") comp.reading.push(reading.$t);
            });

            // Get meaning
            KANJIDICObj[comp.kanji].reading_meaning.rmgroup.meaning.forEach(meaning => {
                if (typeof meaning === 'string') comp.meaning.push(meaning);
            });
        }

        comp.meaning = comp.meaning.join("; ");
        comp.reading = comp.reading.join("; ");

        if (comp.meaning.length === 0) delete comp.meaning;
        if (comp.reading.length === 0) delete comp.reading;
        if (comp.kanji === undefined) comp.kanji = '？';

        if (comp.compositions) {
            comp.compositions.forEach(subComp => {
                CCDFiller(subComp);
            });
        }
    }

    Object.keys(CCDObj).forEach(kanjiChar => {
        CCDRenamer(CCDObj[kanjiChar]);
        CCDFiller(CCDObj[kanjiChar]);
    });

    process.stdout.write("👍 Done creating CCD object\n");

    // Add raw from JMdict Freq

    raw.vocab_jmdict_freq = [];

    JMdict.forEach(function (entry) {

        if (entry.k_ele) entry.k_ele.forEach(function (k_ele) {

            // if it has freq tag, add to the collection
            if (k_ele.ke_pri) {
                raw.vocab_jmdict_freq.push(k_ele.keb);
            }
        });
    });

    // Add raw from JMdict All

    raw.vocab_jmdict = [];

    if (switcher.jmdict_non_freq) {
        JMdict.forEach(function (entry) {

            if (entry.k_ele) entry.k_ele.forEach(function (k_ele) {
                raw.vocab_jmdict.push(k_ele.keb);
            });

        });
    } else {
        // If we don't add all jmdict words, we'll remove the extra kanjis from assets.js
        delete raw.kanji_jmdict_extra;
    }

    // Combine everything into one object

    var fin = {};

    Object.keys(raw).forEach(function (key) {
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
        if (!key.match(/[\u4e00-\u9faf\u3400-\u4dbf]/g)) {
            delete fin[key];

        // remove error items from manythings
        } else if (key.match(/�/g)) {
            delete fin[key];
        }
    });

    process.stdout.write("Total items after removing kanjiless items : " + Object.keys(fin).length + "\n");

    // Kanji only mode, only words with one character
    if (switcher.kanji_only) {
        process.stdout.write("Kanji mode..." + Object.keys(fin).length + "\n");

        Object.keys(fin).forEach(key => {
            if (key.length != 1) {
                delete fin[key];
            }
        });

        process.stdout.write("Total items after kanji mode filter: " + Object.keys(fin).length + "\n");
    }

    // remove duplicates in source array in each item

    Object.keys(fin).forEach(function (key) {
        fin[key].sources = fin[key].sources.filter(function (item, pos) {
            return fin[key].sources.indexOf(item) == pos;
        });
    });

    // Select items for testing
    // Set this part to false for production

    if (switcher.test_data) {
        process.stdout.write("Test mode on\n");

        Object.keys(fin).forEach(function (key) {
            if (!["逑", "投票する", "立つ", "齎す", "齎", "〜年来", "諸〜", "擤"].includes(key)) {
                delete fin[key];
            }
        });
    }

    // JMdict details

    if (switcher.jmdict_details) {
        // Search for meaning

        process.stdout.write("Matching for JMdict details...\n");
        const keys = Object.keys(fin);
        let index = 1;

        Object.keys(fin).forEach(function (key) {
            process.stdout.write(`(${index++}) Searching for ${key} ...`);

            const alternatives = {
                nosuru: "",
                nopredash: "",
                nopostdash: ""
            };

            if (key.substring(key.length - 2, key.length) == "する") alternatives.nosuru = key.substring(0, key.length - 2);
            if (key.substring(key.length - 1, key.length) == "〜") alternatives.nopredash = key.substring(0, key.length - 1);
            if (key.substring(0, 1) == "〜") alternatives.nopostdash = key.substring(1, key.length);

            if (JMdictObj[key]) {
                fin[key].jmdict_details = JMdictObj[key];

            } else if (alternatives.nosuru && JMdictObj[alternatives.nosuru]) {
                fin[key].jmdict_details = JMdictObj[alternatives.nosuru];

            } else if (alternatives.nopredash && JMdictObj[alternatives.nopredash]) {
                fin[key].jmdict_details = JMdictObj[alternatives.nopredash];

            } else if (alternatives.nopostdash && JMdictObj[alternatives.nopostdash]) {
                fin[key].jmdict_details = JMdictObj[alternatives.nopostdash];

            } else {
                fin[key].jmdict_details = [];
            };

            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);

        });

        // Get freq from JMdict

        Object.keys(fin).forEach(function (key) {
            let jmdict_freq = [];

            fin[key].jmdict_details.forEach(entry => {
                entry.k_ele.forEach(k_ele => {
                    if (k_ele.ke_pri && !Array.isArray(k_ele.ke_pri))
                        k_ele.ke_pri = [k_ele.ke_pri];

                    if (k_ele.keb == key)
                        jmdict_freq = jmdict_freq.concat(k_ele.ke_pri);

                });
            });

            // remove duplicates and null
            jmdict_freq = jmdict_freq.filter(function (item, pos) {
                if (!item) {
                    return false;
                }

                return jmdict_freq.indexOf(item) == pos;
            });

            fin[key].jmdict_freq = jmdict_freq;
        });

        process.stdout.write("👍 Done matching for JMdict details\n");
    }

    // KANJIDIC details

    if (switcher.kanjidic_details) {
        process.stdout.write("Matching KANJIDIC details...\n");

        Object.keys(fin).forEach(function (key) {
            if (key.length == 1 && KANJIDICObj[key]) {
                fin[key].kanjidic_details = KANJIDICObj[key];
                fin[key].kanjidic_misc = [];
                if (KANJIDICObj[key].misc.grade) fin[key].kanjidic_misc.push(`kanjidic_grade_${KANJIDICObj[key].misc.grade}`);

                if (KANJIDICObj[key].misc.stroke_count && !Array.isArray(KANJIDICObj[key].misc.stroke_count))
                    KANJIDICObj[key].misc.stroke_count = [KANJIDICObj[key].misc.stroke_count];

                KANJIDICObj[key].misc.stroke_count.forEach(function (el) {
                    fin[key].kanjidic_misc.push(`kanjidic_stroke_${el}`);
                })

                if (KANJIDICObj[key].misc.jlpt) fin[key].kanjidic_misc.push(`kanjidic_jlpt_${KANJIDICObj[key].misc.jlpt}`);
            }
        });

        process.stdout.write("👍 Done matching KANJIDIC details\n");
    }

    // CCD details
    process.stdout.write("Adding CCD details...\n");
    Object.keys(fin).forEach(function (key) {
        fin[key].ccd_details = [];
        fin[key].word.split("").forEach(function (character) {
            if (CCDObj[character]) fin[key].ccd_details.push(CCDObj[character]);
        })
    });
    process.stdout.write("👍 Done adding CCD details\n");

    // Add kanjidic freq index
    process.stdout.write("Adding kanjidic freq index...\n");
    Object.keys(fin).forEach(function (key) {
        fin[key].index_kanjidic_freq = "";
    });
    raw.kanji_freq.forEach((key, index) => {
        if (fin[key] !== undefined && fin[key].index_kanjidic_freq === "") {
            fin[key].index_kanjidic_freq = index + 1;
        }
    });
    process.stdout.write("👍 Done adding kanjidic freq index\n");


    // Add netflix12k index
    process.stdout.write("Adding Netflix index...\n");
    Object.keys(fin).forEach(function (key) {
        fin[key].index_netflix = "";
    });
    raw.vocab_netflix12k.forEach((key, index) => {
        if (fin[key] !== undefined && fin[key].index_netflix === "") {
            fin[key].index_netflix = index + 1;
        }
    });
    process.stdout.write("👍 Done adding Netflix index\n");

    // Add core6k index
    process.stdout.write("Adding core6k index...\n");
    Object.keys(fin).forEach(function (key) {
        fin[key].index_core6k = "";
    });
    raw.vocab_core6k.forEach((key, index) => {
        if (fin[key] !== undefined && fin[key].index_core6k === "") {
            fin[key].index_core6k = index + 1;
        }
    });
    process.stdout.write("👍 Done adding core6k index\n");

    process.stdout.write("Sorting...\n");

    // Add kanji ID for sorting

    i = 1;
    Object.keys(fin).forEach(function (key) {
        if (key.length == 1) {
            fin[key].kanji_id = i;
            i++;
        } else {
            fin[key].kanji_id = "";
        }
    });

    // Find all kanjis

    Object.keys(fin).forEach(function (key) {
        fin[key].kanji_ids = [];
        key.split("").forEach(el => {
            if (fin[el]) {
                fin[key].kanji_ids.push(fin[el].kanji_id);
            }
        });

        fin[key].kanji_ids.sort((a, b) => b - a);
    });

    // Sort Entries

    var arrFin = [];
    Object.keys(fin).forEach(function (key) {
        arrFin.push(fin[key]);
    });

    arrFin.sort(function (a, b) {
        for (var i = 0; i <= 10; i++) {
            if (typeof a.kanji_ids[i] == 'undefined') a.kanji_ids[i] = 0;
            if (typeof b.kanji_ids[i] == 'undefined') b.kanji_ids[i] = 0;
        }

        if (a.kanji_ids[0] != b.kanji_ids[0]) {
            return a.kanji_ids[0] > b.kanji_ids[0] ? 1 : -1;
        } else if (a.kanji_ids[1] != b.kanji_ids[1]) {
            return a.kanji_ids[1] > b.kanji_ids[1] ? 1 : -1;
        } else if (a.kanji_ids[2] != b.kanji_ids[2]) {
            return a.kanji_ids[2] > b.kanji_ids[2] ? 1 : -1;
        } else if (a.kanji_ids[3] != b.kanji_ids[3]) {
            return a.kanji_ids[3] > b.kanji_ids[3] ? 1 : -1;
        } else if (a.kanji_ids[4] != b.kanji_ids[4]) {
            return a.kanji_ids[4] > b.kanji_ids[4] ? 1 : -1;
        } else if (a.kanji_ids[5] != b.kanji_ids[5]) {
            return a.kanji_ids[5] > b.kanji_ids[5] ? 1 : -1;
        } else if (a.kanji_ids[6] != b.kanji_ids[6]) {
            return a.kanji_ids[6] > b.kanji_ids[6] ? 1 : -1;
        } else if (a.kanji_ids[7] != b.kanji_ids[7]) {
            return a.kanji_ids[7] > b.kanji_ids[7] ? 1 : -1;
        } else if (a.kanji_ids[8] != b.kanji_ids[8]) {
            return a.kanji_ids[8] > b.kanji_ids[8] ? 1 : -1;
        } else if (a.kanji_ids[9] != b.kanji_ids[9]) {
            return a.kanji_ids[9] > b.kanji_ids[9] ? 1 : -1;
        } else if (a.kanji_ids[10] != b.kanji_ids[10]) {
            return a.kanji_ids[10] > b.kanji_ids[10] ? 1 : -1;
        }

        if (a.word.length > b.word.length) return 1;
        if (a.word.length < b.word.length) return -1;
        return 0;
    });

    // Sort the best meaning
    arrFin.forEach(function (entry) {
        entry.jmdict_details.sort(function (a, b) {

            let check = function (obj) {
                let score = 0;

                if (obj.k_ele[0].keb == entry.word) score += 1000;
                if (obj.r_ele[0].re_pri) score += 100;
                if (obj.k_ele[0].ke_pri) score += 10;

                return -score;
            }

            return check(a) - check(b);
        });
    });
    process.stdout.write("👍 Done sorting\n");

    return arrFin;
}
module.exports.chamJpDeckMaker = chamJpDeckMaker;

async function chamJpDeckMakerJSON() {
    let arrFin = await chamJpDeckMaker();

    process.stdout.write("Saving cham_jp_deck.json...\n");
    fs.writeFileSync('./cham_jp_deck.json', JSON.stringify(arrFin, null, 4), 'utf8');
    process.stdout.write("👍 Done saving cham_jp_deck.json\n");
}
module.exports.chamJpDeckMakerJSON = chamJpDeckMakerJSON;

async function chamJpDeckMakerCSV() {
    let arrFin = await chamJpDeckMaker();

    process.stdout.write("Saving cham_jp_deck.csv...\n");
    // Create CSV
    var csvstring = "";
    arrFin.forEach((element, index) => {
        csvstring +=
            /* word */              element.word + "\t" +
            /* index */             (index + 1) + "\t" +
            /* index_kanjidic_freq */ element.index_kanjidic_freq + "\t" +
            /* index_netflix */     element.index_netflix + "\t" +
            /* index_core6k */      element.index_core6k + "\t" +
            /* sources */           element.sources.join(" ") + "\t" +
            /* kanjidic_details */  (element.kanjidic_details ? JSON.stringify(element.kanjidic_details).replace(/\t/g, "") : "") + "\t" +
            /* kanjidic_misc */     (element.kanjidic_misc ? element.kanjidic_misc.join(" ") : "") + "\t" +
            /* jmdict_details */    (element.jmdict_details ? JSON.stringify(element.jmdict_details).replace(/\t/g, "") : "[]") + "\t" +
            /* jmdict_freq */       (element.jmdict_freq ? element.jmdict_freq.join(" ") : "") + "\t" +
            /* ccd_details */       (element.ccd_details ? JSON.stringify(element.ccd_details).replace(/\t/g, "") : "[]") + "\t" +
            /* kanji_id */          element.kanji_id + "\t" +
            /* kanji_ids */         element.kanji_ids.join(" ").replace(/ 0/g, "") + "\t" +
            /* tags */              (element.sources.join(" ") + " " + (element.kanjidic_misc ? element.kanjidic_misc.join(" ") : "") + " " + (element.jmdict_freq ? element.jmdict_freq.join(" ") : "") + " " + (element.word.length == 1 ? "kanji" : "")) + // tags
            "\n";
    });

    // Save CSV
    fs.writeFileSync('./cham_jp_deck.csv', csvstring, 'utf8');
    process.stdout.write("👍 Done saving cham_jp_deck.csv\n");
}
module.exports.chamJpDeckMakerCSV = chamJpDeckMakerCSV;