let fs = require("fs").promises
let {promisify} = require("util")
let getAverageColor = promisify(require("image-average-color"))
let resolvePath = require("path").resolve
let {EOL} = require("os")

function convertHexCodeToEmoji(code) {
	return String.fromCodePoint(parseInt(code, 16))
}

function getCodeFromFilename(path) {
	let match = path.match(/emoji_([a-f0-9]+)\.png/)
	if (!match || !match[1]) {
		throw new Error(`${path} doesn't look like an emoji filename`)
	}
	let [, code] = match
	return code
}

;(async function() {
	/*
		this is a directory full of emoji extracted by Devon Govett's emoji
		extractor
	*/
	let emojiDirName = "emoji"
	let dir = await fs.readdir(emojiDirName)
	for (let path of dir) {
		let [red, green, blue, alpha] = await getAverageColor(
			resolvePath(emojiDirName, path)
		)
		let emoji = convertHexCodeToEmoji(getCodeFromFilename(path))
		process.stdout.write([emoji, red, green, blue, alpha].join("\t") + EOL)
	}
})()
