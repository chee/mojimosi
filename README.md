# mosimoji

make an e**moji** **mos**a**i**c of from your picture

## getty

- `npm i -g mojimosi`

## usage

1. `npx mojimosi <imagepath> [tilesize]`

so like

`npx mojimosi 12 frend.png > frend.txt`

## thanks

- to @InboxAppCo who made the MIT licensed [emoji extractor](https://github.com/InboxAppCo/extract-emoji) that's been subtree'd in, but is not a runtime dependency
- to @DavidBarts who made the [getfonts](https://github.com/DavidBarts/getfonts) package that's been illegally subtree'd in. they took a lot of flack for it on reddit because of _IANAL but EULA amirite_, and it's unlicensed so i've included their copyrighted code in this project.
- Mihai Potra whose MIT licensed find-color script is included here with some features removed to make it work for me
- everyone who made any of the dependencies
- the people i love and the people who love me and most especially the intersect

## story

the first thing i did was i extracted the TTF (true type) font files from the
TTC collection at `/System/Library/Fonts/Apple Color Emoji.ttc` using the
`getfonts` script that's subtree'd in here, but was written by @DavidBarts (who
posted about it on reddit and then everyone told them they were bad). then i
extracted the emoji from the ttfs using the `extract-emoji` script here, that
was by @InboxAppCo (or by @devangovett according to the package.json).
then i created a plain text file that i've called [`database`](./database) to
annoy rich hickey, which contains one-per-line of: `emoji red green blue alpha`,
of the average colour of the image reported by the [`image-average-color`](https://npmjs.org/image-average-color)
npm package.
then, the picture that's given on the command line is sliced up into a grid the
size of the [tilesize] provided on the command line (defaults to 32), then the
average colour of each slice is matched as closely as it can be (by Mihai's
find-color script) to one of the emoji average colours, then the emoji are
printed out in that same grid.
