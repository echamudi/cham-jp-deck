
# JMdict to Anki

## Create the csv deck

```
mkdir -p dist
csvtojson --delimiter="\t" --noheader="true" --headers="[\"empty\",\"char\",\"strokes\",\"composition_kind\",\"first\",\"first_strokes\",\"first_verification\",\"second\",\"second_strokes\",\"second_verification\",\"cangjie_coding\",\"radical\"]" ./source/CCD.csv > ./dist/CCD.json
xml2json ./source/kanjidic2.xml ./dist/kanjidic2.json
xml2json ./source/JMdict_e ./dist/JMdict.json
node --max-old-space-size=4096 code.js
```

