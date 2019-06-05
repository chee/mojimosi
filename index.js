#!/usr/bin/env node
let {existsSync, createReadStream, promises: fs} = require("fs")
let resolvePath = require("path").resolve
let findColor = require("./find-color").find
let {EOL} = require("os")
let getImageSize = require("image-size")
let Canvas = require("canvas")
let colors = require("blee").all
let getPalette = require("get-rgba-palette")

let symbols = {
	readFromStdin: Symbol("read from stdin"),
}

function getColorFromName(name) {
	let color = colors.get(name)
	if (!color) {
		throw `couldn't turn ${name} into a color :(`
	}
	let {r, g, b} = color
	return [r, g, b]
}

let {argv} = require("yargs").command({
	command: "$0 [image]",
	describe: "make an emoji mosaic from an image",
	builder: yargs => {
		yargs
			.options({
				tilesize: {
					alias: ["t"],
					description: "the number of pixels an emoji should represent",
					type: "number",
					default: 32,
				},
				background: {
					alias: ["b"],
					description:
						'a colour like "white" or "#ff2a50" to use in place of transparent tiles',
					type: "string",
					default: "white",
					coerce: getColorFromName,
				},
			})
			.conflicts("width", "tilesize")
			.positional("image", {
				describe: "the image to turn into an emoji mosaic",
				default: true,
				coerce: path => {
					if (Object.is(path, true)) {
						return symbols.readFromStdin
					}
					if (!existsSync(path)) {
						throw new Error(`expected a file that exists, got: ${path}`)
					}
					return path
				},
			})
	},
})

let print = thing => process.stdout.write(thing.toString())

function parseLine(line, lineno) {
	// TODO: stick mathias's emoji regex in here for bants
	let match = line.match(/(.*)\t([0-9]+)\t([0-9]+)\t([0-9]+)\t([0-9]+)/)
	if (!match) {
		throw new Error(`bad line: ${line} (${lineno + 1})`)
	}

	// ignoring alpha here
	let [, emoji, red, green, blue] = match

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

async function getImage(imageData, size = getImageSize(imageData)) {
	let canvas = Canvas.createCanvas(size.width, size.height)
	let context = canvas.getContext("2d")
	let imageElement = new Canvas.Image()
	return new Promise((resolve, reject) => {
		imageElement.onload = () => {
			context.drawImage(imageElement, 0, 0)
			resolve({
				imageElement,
				context,
				size,
			})
		}
		imageElement.onerror = reject
		imageElement.src = imageData
	})
}

// read a stream into memory
async function unstream(stream) {
	let chunks = []
	stream.on("data", chunk => chunks.push(chunk))
	return new Promise((keep, brake) => {
		stream.on("end", () => {
			let buffer = Buffer.concat(chunks)
			keep(buffer)
		})
		stream.on("error", brake)
	})
}

function* sliceImage({context, size: {width, height}, tilesize}) {
	let columns = width / tilesize
	let rows = height / tilesize
	for (let rowStep = 0; rowStep < rows; rowStep++) {
		for (let columnStep = 0; columnStep < columns; columnStep++) {
			let x = tilesize * columnStep
			let y = tilesize * rowStep
			let pixels
			try {
				pixels = context.getImageData(x, y, tilesize, tilesize).data
			} catch (error) {
				throw new Error("width provided was bigger than the image")
			}
			let [color] = getPalette(pixels, 1, 1 + tilesize / 2)
			yield {
				x,
				y,
				color,
			}
		}
	}
}

function getTilesize({imageWidth, argv}) {
	return argv.tilesize
		? argv.tilesize
		: argv.width
		? imageWidth / argv.width
		: 32
}

(async function beepBoopBork() {
	let database = await readDatabase(databasePath)
	let emojiColors = database.map(line => line.color)
	let imageStream =
		argv.image === symbols.readFromStdin
			? process.stdin
			: createReadStream(argv.image)
	let imageData = await unstream(imageStream)
	let {context, size} = await getImage(imageData)

	let slices = sliceImage({
		context,
		size,
		tilesize: getTilesize({imageWidth: size.width, argv}),
	})

	// all in one big loop !!
	let previousSlice
	for (let slice of slices) {
		if (previousSlice && slice.y > previousSlice.y) {
			print(EOL)
		}
		let color = slice.color || argv.background
		let closest = findColor(color, emojiColors)
		let match = database.find(line => closest === line.color)
		let emoji = match && match.emoji
		print(emoji)
		print(" ")
		previousSlice = slice
	}
	print(EOL)
})().catch(console.error)
