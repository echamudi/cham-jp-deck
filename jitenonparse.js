module.paths.push('/usr/local/lib/node_modules');
var fs = require('fs');
var data = require("./source/otherassets.js");
var cheerio = require('cheerio');

var i = 1;
Object.keys(data.kanji_jitenon_url).forEach(function(key) {
    process.stdout.write("Processing : " + i++ + " " + key);
    var $ = cheerio.load(fs.readFileSync("./source/kanji.jitenon.jp" + data.kanji_jitenon_url[key], 'utf8'));
    var txt = $("#kanjiright").html()
        .replace("kanjirighttb", "table table-bordered table-sm")
        .replace(/h3/g, "span")
        .replace(/h2/g, "span")
        .replace(/img src="https:\/\/kanji\.jitenon\.jp/g, "img src=\"")
        .replace(/\t/g, "")
        .replace(/\n/g, "");

    fs.writeFileSync('./dist_jitenon/jitenon_' + key + '.txt', txt, 'utf8'); 
    process.stdout.clearLine(); 
    process.stdout.cursorTo(0);  
});