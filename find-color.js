/**
 * find-color
 * Copyright(c) 2016 Mihai Potra <mike@mpotra.com>
 * MIT Licensed
 */

/**
 * Find a RGB tuple inside a list of colors.
 *
 * Computes the distance between the given RGB color
 * expressed as a 3D point, and each of the colors in the list.
 * Returns the color in the list that is closest.
 *
 */
const findNearestRGB = (find, colors) => {
	var nearest

	if (!find) {
		return find
	}

	// For each color in the list, compute the distance to the color
	// that needs matching.
	// Formula: sqrt((x1 - x2)^2 + (y1 - y2)^2 + (z1 - z2)^2)
	nearest = colors
		.map(color =>
			Math.sqrt(
				Math.pow(find[0] - color[0], 2) +
					Math.pow(find[1] - color[1], 2) +
					Math.pow(find[2] - color[2], 2)
			)
		)
		// Find the smallest distance.
		.reduce(
			(prev, curr, index) => {
				if ((prev && prev.distance > curr) || !prev) {
					return {distance: curr, index: index}
				} else {
					return prev
				}
			},
			{distance: Infinity, index: -1}
		)

	return nearest.index >= 0 ? colors[nearest.index] : undefined
}

/**
 * Find a color in a list of RGB tuple colors.
 */
const find = (color, colors) => {
	return findNearestRGB(color, colors)
}

/**
 * Create an object that allows finding a color,
 * from an array of RGB tuples.
 */
const fromRGB = arrRGB => {
	return {find: color => find(color, arrRGB)}
}

/**
 * Create an object that allows finding a color,
 * from an array of colors given in HEX.
 */
const fromHex = arrHex => {
	return fromRGB(arrHex.map(color => decodeHex(color)))
}

/**
 * Export
 */
module.exports = {fromHex, fromRGB, find}
