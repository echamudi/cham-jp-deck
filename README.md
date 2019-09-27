
# Cham JP Deck

This simple code takes data from [JMdict](https://www.edrdg.org/jmdict/j_jmdict.html), [KANJIDIC](http://www.edrdg.org/wiki/index.php/KANJIDIC_Project), and [Chinese characters decomposition](https://commons.wikimedia.org/wiki/Commons:Chinese_characters_decomposition), combines them, and generetes a CSV table that can be imported in [Anki](https://apps.ankiweb.net).

## Usage

1. Download [JMdict_e.gz](https://www.edrdg.org/jmdict/edict_doc.html) and [kanjidic2.xml.gz](http://www.edrdg.org/wiki/index.php/KANJIDIC_Project) file.

1. Create a new folder and open it.

1. Extract the JMdict and KANJIDIC file. Your folder structure should look like this:

    ```
    your_new_folder
    ├── JMdict_e
    └── kanjidic2.xml
    ```

    The file names must be the same as above.

1. Open the folder in terminal and run following commands:

    ```sh
    npm install -g cham-jp-deck
    chamjpdeck-csv
    ```

1. If it runs successfully, you'll get the result as `cham_jp_deck.csv`.

## FAQ

### Which items are included?

- Words from **JMdict** that contains has frequency tags and contains kanji,
- Words from **JMdict** that don't have frequency tags but appear in ManyThings examples, Wanikani vocabs, Core 6K, Core 10K, and Tanos JLPT vocabs, 
- Kanji letters from **KANJIDIC**, starting from kanken 10 to kanken 1.

### How the items are sorted?

First, all kanji letters are sorted by kanji kentei level. After each kanji, sample vocabs are added based on the learned kanji items.

### What is JMdict frequency tag

Taken from https://www.edrdg.org/jmdict/edict_doc.html

> Word Priority Marking
> 
> The ke_pri and equivalent re_pri fields in the JMdict file are provided to record information about the relative commonness or priority of the entry, and consist of codes indicating the word appears in various references which can be taken as an indication of the frequency with which the word is used. This field is intended for use either by applications which want to concentrate on entries of a particular priority, or to generate subset files. The current values in this field are:
> 
> - news1/2: appears in the "wordfreq" file compiled by Alexandre Girardi from the Mainichi Shimbun. (See the Monash ftp archive for a copy.) Words in the first 12,000 in that file are marked "news1" and words in the second 12,000 are marked "news2".
> ichi1/2: appears in the "Ichimango goi bunruishuu", Senmon Kyouiku Publishing, Tokyo, 1998. (The entries marked "ichi2" were demoted from ichi1 because they were observed to have low frequencies in the WWW and newspapers.)
> - spec1 and spec2: a small number of words use this marker when they are detected as being common, but are not included in other lists.
> - gai1/2: common loanwords, also based on the wordfreq file.
> nfxx: this is an indicator of frequency-of-use ranking in the wordfreq file. "xx" is the number of the set of 500 words in which the entry can be found, with "01" assigned to the first 500, "02" to the second, and so on.
> 
> Entries with news1, ichi1, spec1/2 and gai1 values are marked with a "(P)" in the EDICT and EDICT2 files.

### What are the columns in the csv file?

Check the comments in `makecsv.js` file.

### 30k+ cards are too much, how do I reduce the items?

Yeah, I don't recommend to learn all of them. You can always suspend and unsuspend using the tags and sources field.

If you are trying to learn the joyo kanji, try this steps:
- Suspend all the cards `"deck:JP Yomi Ezzat"`.
- Unsuspend the joyo kanji `"deck:JP Yomi Ezzat" (tag:kanji_kanshudo_joyo or tag:kanji_jitenon_kanken2)`.
- Unsuspend the first 500 vocabs from frequency-of-use ranking by using this filter `"deck:JP Yomi Ezzat" tag:nf01`.
- Up until this steps, you will have around 2583 items to learn. I think these are not sufficient. 
- Add more samples by unsuspending even more frequency-of-use vocabs using this filter `"deck:JP Yomi Ezzat" (tag:nf02 or tag:nf03 or tag:nf04 or tag:nf05 or tag:nf06 or tag:nf07 or tag:nf08 or tag:nf09 or tag:nf10 or tag:nf11 or tag:nf12 or tag:nf13 or tag:nf14 or tag:nf15)`.
- Check the result `"deck:JP Yomi Ezzat" -is:suspended`. You'll have around 8910 items.
- Assuming you study 15 new items everyday, you will complete all items in around 1 year 8 months.

As comparison, Wanikani has 8330 total items (excluding radicals).

**TLDR;** Suspend eveything, unsuspend `"deck:JP Yomi Ezzat" ((tag:kanji_kanshudo_joyo or tag:kanji_jitenon_kanken2) or (tag:nf01 or tag:nf02 or tag:nf03 or tag:nf04 or tag:nf05 or tag:nf06 or tag:nf07 or tag:nf08 or tag:nf09 or tag:nf10 or tag:nf11 or tag:nf12 or tag:nf13 or tag:nf14 or tag:nf15))`.

### I also use Wanikani or iKnow Core 6000, how do I remove the items to avoid overlapping? 

For Wanikani: use `"deck:JP Yomi Ezzat" sources:*wk*` filter and suspend the items.

For Core 6K: use `"deck:JP Yomi Ezzat" tag:vocab_core6k` filter and suspend the items.


### I don't want to include Kanji Kentei level 1.

Filter the deck `"deck:JP Yomi Ezzat" (tag:kanji_jitenon_kanken1jyun or tag:kanji_jitenon_kanken1 or tag:kanji_jitenon_kanken1alt)` and suspend them.

### I found an entry that doesn't have any details JMDict and KANIDIC.

Yep.

- Some letters in Kanji Kentei level 1 are not found in KANJIDIC. Use this filter `"deck:JP Yomi Ezzat" kanjidic_details:"" tag:kanji` and suspend them.
- Some words exist in external sources (e.g. Wanikani or ManyThings) but they don't exist in JMdict. Use this filter `"deck:JP Yomi Ezzat" jmdict_details:[] -tag:kanji` and suspend them.

### Is there audio in this deck? 

No :(, I can't find open source audio sources that I can use here.

## Creating the CSV deck

Please check [compile](COMPILE.md) document.

## Acknowledgement

- JMdict https://www.edrdg.org/jmdict/j_jmdict.html
- KANJIDIC http://www.edrdg.org/wiki/index.php/KANJIDIC_Project
- Chinese characters decomposition https://commons.wikimedia.org/wiki/Commons:Chinese_characters_decomposition
- JLPT Kanji List by Peter van der Woude https://jlptstudy.net/N5/
- Japanese Core 6000 (Core 6K) https://iknow.jp/content/japanese
- Japanese Sensei (Core 10K) http://en.colezhu.com/jsensei/
- Jitenon https://kanji.jitenon.jp
- Kanshudo Collection https://www.kanshudo.com/collections
- ManyThings Kanji Dictionary http://www.manythings.org/kanji/d/index.html
- Tanos JLPT http://www.tanos.co.uk/jlpt/
- Wanikani https://wanikani.com

## Authors

* **Ezzat Chamudi** - [ezhmd](https://github.com/ezhmd)

## License

Code and documentation copyright 2019 the [Cham JP Deck Project Authors](https://github.com/ezhmd/cham-jp-deck/graphs/contributors). 

Cham JP Deck code is licensed under [MPL-2.0](https://www.mozilla.org/en-US/MPL/2.0/). Images, logos, docs, and articles in this Cham JP Deck project are released under [CC-BY-SA-4.0](https://creativecommons.org/licenses/by-sa/4.0/legalcode).

Libraries, dependencies, and tools used in this project are tied with their own licenses respectively.