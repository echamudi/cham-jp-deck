var fs = require('fs');
var arrFin = require("./dist/jp_yomi_ezzat.json");

// Create CSV
var csvstring = "";
arrFin.forEach((element, index) => {
    csvstring += 
        /* word */              element.word + "\t" +
        /* index */             (index + 1) + "\t" +
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
fs.writeFileSync('./dist/jp_yomi_ezzat.csv', csvstring, 'utf8'); 