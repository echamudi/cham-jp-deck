
# JMdict to Anki

## Create the main deck

```
mkdir -p dist
xml2json ./source/JMdict_e ./dist/JMdict.json
node code.js
node fintocsv.js
```

## Parse Jitenon Kanji Details
```
mkdir -p dist_jitenon
node jitenonparse.js
```
