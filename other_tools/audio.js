// Audio is not available due to copyright issues
// Please ignore this file

// node --max-old-space-size=4096 ./other_tools/audio.js

var fs = require('fs');
var arrFin = require("../dist/jp_yomi_ezzat.json");
var data = {};

data.wk_audio = require("./_wkaudio.json")[0];
data.core10k_audio = require("./_core10kaudio.json")[0];
data.jpod_audio = require("./_jpodaudio.json");

arrFin.forEach(function(el) {
    if (data.jpod_audio[el.word]) {
        el.audio = "[sound:" + data.jpod_audio[el.word].file + "]";
    } else if (data.core10k_audio[el.word]) {
        el.audio = "[sound:" + data.core10k_audio[el.word] + "]";
    } else if(data.wk_audio[el.word]) {
        el.audio = "[sound:" + data.wk_audio[el.word] + "]";
    } else {
        el.audio = "";
    }
});

fs.writeFileSync('./dist/jp_yomi_ezzat.json', JSON.stringify(arrFin, null, 4), 'utf8'); 
