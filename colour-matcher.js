$(document).ready(() => {
	$('#search').on('click', () => {
		const input = $('#input').val();
		try {
			const closest = searchForColour(input);
			$('#results').empty();
			for(const result of closest) {
				$('#results').append(`
					<li class="list-group-item result">
						<div class="swatch" style="background-color: #${result.rgb}"></div>
						<a href="https://rebrickable.com/colors/${result.id}">${result.name} (#${result.rgb})</a>
					</li>
				`);
			}
		}
		catch(err)
		{
			$('#results').empty();
			$('#results').append(`
				<li class="list-group-item error">${err}</li>
			`);
		}
	});
});

function searchForColour(colour) {
	let rgb;
	try {
		rgb = parseColour(colour);
	}
	catch(err){
		try {
			rgb = parseColour(`#${colour}`);
		}
		catch {
			throw err;
		}
	}

	return _(legoColours)
		.orderBy(listColour => compareListColour(rgb, listColour))
		.take(10)
		.value();
}

function compareListColour(rgb, listColour) {
	const listRgb = parseColour(`#${listColour.rgb}`);
	return colourDistance(rgb, listRgb);
}

function colourDistance(a, b) {
	return Math.sqrt(
		Math.pow(a.red   - b.red,   2) +
		Math.pow(a.green - b.green, 2) +
		Math.pow(a.blue  - b.blue,  2)
	);
}

function parseColour(input) {
	const div = document.createElement('div');
	document.body.appendChild(div);
	div.style.color = input;
	const matchRGB = /^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i;
	const computed = getComputedStyle(div).color.match(matchRGB);
	document.body.removeChild(div);

	if(!computed || !div.style.color)
		throw new Error(`Could not parse colour: "${input}"`);

	return {
		red: computed[1],
		green: computed[2],
		blue: computed[3],
	};
}
