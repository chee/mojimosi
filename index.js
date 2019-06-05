#!/usr/bin/env node
let {promisify} = require("util")
let {existsSync, promises: fs} = require("fs")
let getPixels = promisify(require("get-pixels"))
let resolvePath = require("path").resolve
let findColor = require("./find-color").find
let readDataUri = require("data-uri-to-buffer")
let createSlices = promisify(require("image-to-slices"))
let getAverageColor = require("./get-average-color")
let {EOL} = require("os")

createSlices.configure({
	clipperOptions: {
		canvas: require("canvas"),
	},
})

let print = thing => process.stdout.write(thing.toString())

function parseLine(line, lineno) {
	// TODO: stick mathias's emoji regex in here for bants
	let match = line.match(/(.*)\t([0-9]+)\t([0-9]+)\t([0-9]+)\t([0-9]+)/)
	if (!match) {
		throw new Error(`bad line: ${line} (${lineno + 1})`)
	}

	let [, emoji, red, green, blue, alpha] = match

	// ignoring alpha here
	return {
		emoji,
		color: [red, green, blue],
	}
}

async function readDatabase(databasePath) {
	let contents = await fs.readFile(databasePath, "utf-8")
	let lines = contents.trim().split("\n")
	return lines.map(parseLine)
}

let databasePath = resolvePath(__dirname, "database")

let imagepath = process.argv[2]
if (!imagepath) {
	console.error("usage: mojimosi <imagepath> [tilesize]")
	process.exit(22)
}

function createRange(from, to, step) {
	let output = [from]
	while (from + step < to) {
		output.push((from = from + step))
	}
	return output
}

let emojiHeight = Number(process.argv[3]) || 32

function createLines(n) {
	return createRange(emojiHeight, n, emojiHeight)
}

;(async function beepBoopBork() {
	let database = await readDatabase(databasePath)
	let colors = database.map(line => line.color)
	let [width, height] = (await getPixels(imagepath)).shape
	let lines = [createLines(height), createLines(width)]

	// this always throws? ^_^ what
	let slices = await createSlices(imagepath, ...lines, {
		saveToDataUrl: true,
	}).catch(what => what)

	// all in one big loop !!
	let previousSlice
	for (let slice of slices) {
		if (previousSlice && slice.y > previousSlice.y) {
			print(EOL)
		}
		let color = await getAverageColor(readDataUri(slice.dataURI))
		let rgb = color.slice(0, 3)
		let closest = findColor(rgb, colors)
		let match = database.find(line => {
			return closest === line.color
		})
		let emoji = match && match.emoji
		print(emoji + " ")
		previousSlice = slice
	}
	print(EOL)
})()
