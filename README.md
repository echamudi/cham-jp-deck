
# JMdict to Anki

This simple code takes data from [JMdict](https://www.edrdg.org/jmdict/j_jmdict.html), [KANJIDIC](http://www.edrdg.org/wiki/index.php/KANJIDIC_Project), and [Chinese characters decomposition](https://commons.wikimedia.org/wiki/Commons:Chinese_characters_decomposition), combines them, and generetes a CSV table that can be imported in anki.

## FAQ

### Which items are included?

The contents are :
- Words from **JMdict** that contains has frequency tags and contains kanji,
- Words from **JMdict** that don't have frequency tags but appear in ManyThings examples, Wanikani vocabs, Core 6K, and Core 10K.
- Kanji letters from **KANJIDIC** from kanken 10 to kanken 1.

### I use wanikani, how do I remove words from Wanikani or Core 6K to avoid overlapping? 

All items are tagged with their sources, so you can use `sources:*wk*` filter in anki and suspend the items.

### Is there audio in this deck? 

No :(, I can't find open source audio sources that I can use here.

## Create the CSV deck

```
mkdir -p dist
csvtojson --delimiter="\t" --noheader="true" --headers="[\"empty\",\"char\",\"strokes\",\"composition_kind\",\"first\",\"first_strokes\",\"first_verification\",\"second\",\"second_strokes\",\"second_verification\",\"cangjie_coding\",\"radical\"]" ./source/CCD.csv > ./dist/CCD.json
xml2json ./source/kanjidic2.xml ./dist/kanjidic2.json
xml2json ./source/JMdict_e ./dist/JMdict.json
node --max-old-space-size=4096 code.js
node --max-old-space-size=4096 makecsv.js
```

## Acknowledgement

- JMdict https://www.edrdg.org/jmdict/j_jmdict.html
- KANJIDIC http://www.edrdg.org/wiki/index.php/KANJIDIC_Project
- Chinese characters decomposition https://commons.wikimedia.org/wiki/Commons:Chinese_characters_decomposition
- Jitenon https://kanji.jitenon.jp
- Kanshudo Collection https://www.kanshudo.com/collections
- ManyThings Kanji Dictionary http://www.manythings.org/kanji/d/index.html
- Japanese Core 6000 (Core 6K) https://iknow.jp/content/japanese
- Japanese Sensei (Core 10K) http://en.colezhu.com/jsensei/
- Wanikani https://wanikani.com