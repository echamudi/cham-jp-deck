// Audio is not available due to copyright issues

var fs = require('fs');
var arrFin = require("../dist/fin.json");
var data = {};

data.wk_audio = require("./_wkaudio.json")[0];
data.core10k_audio = require("./_core10kaudio.json")[0];

arrFin.forEach(function(el) {
    if (data.core10k_audio[el.word]) {
        el.audio = "[sound:" + data.core10k_audio[el.word] + "]";
    } else if(data.wk_audio[el.word]) {
        el.audio = "[sound:" + data.wk_audio[el.word] + "]";
    } else {
        el.audio = "";
    }
});

fs.writeFileSync('./dist/fin.json', JSON.stringify(arrFin, null, 4), 'utf8'); 
