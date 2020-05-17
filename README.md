
# Cham JP Deck

This simple code generates CSV table from [JMdict](https://www.edrdg.org/jmdict/j_jmdict.html), [KANJIDIC](http://www.edrdg.org/wiki/index.php/KANJIDIC_Project), and other sources. The CSV can be imported as a deck in [Anki](https://apps.ankiweb.net).

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

### Which words and kanji characters are included?

- Words from **JMdict** that contains has frequency tags and contains kanji.
- Words from **JMdict** that don't have frequency tags but appear in ManyThings examples, Wanikani vocabs, Core 6K, Core 10K, Tanos JLPT vocabs, and Netflix Frequency 12K.
- Kanji letters from **KANJIDIC**, starting from kanken 10 to kanken 1.

### How the items are sorted?

First, all kanji letters are sorted by kanji frequency list in KANJIDIC. After each kanji, sample vocabs are added based on kanji that appeared previously.

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

- word
- index
- index_kanjidic_freq
- index_netflix
- index_core6k
- sources
- kanjidic_details
- kanjidic_misc
- jmdict_details
- jmdict_freq
- ccd_details
- kanji_id
- kanji_ids
- tags

### 30k+ cards are too much, how do I reduce the items?

Yeah, I don't recommend to learn all of them. You can always suspend and unsuspend using the tags and sources field.

If you are trying to learn the joyo kanji, try this steps:
- Suspend all the cards `"deck:Cham JP Deck"`.
- Unsuspend the joyo kanji `"deck:Cham JP Deck" (tag:kanji_kanshudo_joyo or tag:kanji_jitenon_kanken2)`.
- Unsuspend the first 500 vocabs from frequency-of-use ranking by using this filter `"deck:Cham JP Deck" tag:nf01`.
- Up until this steps, you will have around 2583 items to learn. I think these are not sufficient. 
- Add more samples by unsuspending even more frequency-of-use vocabs using this filter `"deck:Cham JP Deck" (tag:nf02 or tag:nf03 or tag:nf04 or tag:nf05 or tag:nf06 or tag:nf07 or tag:nf08 or tag:nf09 or tag:nf10 or tag:nf11 or tag:nf12 or tag:nf13 or tag:nf14 or tag:nf15)`.
- Check the result `"deck:Cham JP Deck" -is:suspended`. You'll have around 8910 items.
- Assuming you study 15 new items everyday, you will complete all items in around 1 year 8 months.

As comparison, Wanikani has 8330 total items (excluding radicals).

**TLDR;** Suspend eveything, unsuspend `"deck:Cham JP Deck" ((tag:kanji_kanshudo_joyo or tag:kanji_jitenon_kanken2) or (tag:nf01 or tag:nf02 or tag:nf03 or tag:nf04 or tag:nf05 or tag:nf06 or tag:nf07 or tag:nf08 or tag:nf09 or tag:nf10 or tag:nf11 or tag:nf12 or tag:nf13 or tag:nf14 or tag:nf15))`.

### I also use Wanikani or iKnow Core 6000, how do I remove the items to avoid overlapping? 

For Wanikani: use `"deck:Cham JP Deck" sources:*wk*` filter and suspend the items.

For Core 6K: use `"deck:Cham JP Deck" tag:vocab_core6k` filter and suspend the items.

### I don't want to include Kanji Kentei level 1.

Filter the deck `"deck:Cham JP Deck" (tag:kanji_jitenon_kanken1jyun or tag:kanji_jitenon_kanken1 or tag:kanji_jitenon_kanken1alt)` and suspend them.

### I found an entry that doesn't have any details JMDict and KANIDIC.

Yep.

- Some letters in Kanji Kentei level 1 are not found in KANJIDIC. Use this filter `"deck:Cham JP Deck" kanjidic_details:"" tag:kanji` and suspend them.
- Some words exist in external sources (e.g. Wanikani or ManyThings) but they don't exist in JMdict. Use this filter `"deck:Cham JP Deck" jmdict_details:[] -tag:kanji` and suspend them.

### Is there audio in this deck? 

Nope. But I'm planning to use this [WaniKani open souce pronounciation audio](https://github.com/tofugu/japanese-vocabulary-pronunciation-audio).

## Development

```sh
git clone https://github.com/echamudi/cham-jp-deck
cd cham-jp-deck

# Put JMdict_e and kanjidic2.xml in the current folder

node cli-csv.js     # run this to generate CSV
node cli-json.js    # run this to generate JSON
```

## Acknowledgment

The items are collected from following sources:

- JLPT Study by Peter van der Woude https://jlptstudy.net
- JMdict https://www.edrdg.org/jmdict/j_jmdict.html
- Japanese Core 6000 (Core 6K) https://iknow.jp/content/japanese
- Japanese Sensei (Core 10K) http://en.colezhu.com/jsensei/
- Jonathan Waller JLPT Lists http://www.tanos.co.uk/jlpt/
- KANJIDIC Project http://www.edrdg.org/wiki/index.php/KANJIDIC_Project
- KanjiVG by Ulrich Apel https://github.com/KanjiVG/kanjivg
- Kanjium by Uros Ozvatic https://github.com/mifunetoshiro/kanjium
- ManyThings Kanji Dictionary http://www.manythings.org/kanji/d/index.html
- Netflix 12K list https://www.youtube.com/watch?v=DwJWld8hW0M
- Wanikani https://wanikani.com
- 日本漢字能力検定級別漢字表 https://www.kanken.or.jp/kanken/outline/degree.html

## Authors

* **Ezzat Chamudi** - [echamudi](https://github.com/echamudi)

## License

Copyright © 2020 [Ezzat Chamudi](https://github.com/echamudi)

Cham JP Deck code is licensed under [MPL-2.0](https://www.mozilla.org/en-US/MPL/2.0/). Images, logos, docs, and articles in this project are released under [CC-BY-SA-4.0](https://creativecommons.org/licenses/by-sa/4.0/legalcode).

Libraries, dependencies, and tools used in this project are tied with their licenses.
