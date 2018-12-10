
# JMdict to Anki

## Create the csv deck

```
mkdir -p dist
xml2json ./source/kanjidic2.xml ./dist/kanjidic2.json
xml2json ./source/JMdict_e ./dist/JMdict.json
node code.js
```