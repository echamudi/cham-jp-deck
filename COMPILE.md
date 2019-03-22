This project uses node.js.

First, Install csvtojson and xml2json.

```
npm install -g csvtojson
npm install -g xml2json
```

Put the sources in the source folder
```
# Source: http://www.edrdg.org/kanjidic/kanjidic2.xml.gz
source/kanjidic2.xml

# Source: http://ftp.monash.edu/pub/nihongo/JMdict_e.gz
source/JMdict_e

# Source: https://commons.wikimedia.org/wiki/User:Artsakenos/CCD-TSV
source/CCD.csv
```

and then

```
mkdir -p dist
csvtojson --delimiter="\t" --noheader="true" --headers="[\"empty\",\"char\",\"strokes\",\"composition_kind\",\"first\",\"first_strokes\",\"first_verification\",\"second\",\"second_strokes\",\"second_verification\",\"cangjie_coding\",\"radical\"]" ./source/CCD.csv > ./dist/CCD.json
xml2json ./source/kanjidic2.xml ./dist/kanjidic2.json
xml2json ./source/JMdict_e ./dist/JMdict.json
node --max-old-space-size=4096 code.js
node --max-old-space-size=4096 makecsv.js
```