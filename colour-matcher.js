const settings = {
	'ignore-transparent': false,
	'ignore-chrome': false,
	'ignore-speckle': false,
	'ignore-modulex': true,
	'use-cie': true,
};

$(document).ready(() => {
	const debouncedUpdate = _.debounce(update, 500);

	const updateImmediate = (showErrors) => {
		const input = $('#input').val();
		debouncedUpdate.cancel();
		debouncedUpdate(input, showErrors);
		debouncedUpdate.flush();
	}

	$('#input').on('input', (event) => {
		const input = $(event.currentTarget).val();
		debouncedUpdate(input, false);
	});

	$('#input').on('change', (event) => {
		updateImmediate(true);
	});

	for(const setting in settings) {
		$(`#${setting}`).on('click', (event) => {
			settings[setting] = !settings[setting];
			$(`#${setting} .fa-menu-item`).toggleClass('fa-check fa-close');
			updateImmediate(false);
		});
	}
});

function update(input, showError) {
	try {
		const closest = searchForColour(input, showError);
		$('#results').empty();
		for(const result of closest) {
			$('#results').append(`
				<a
					class="list-group-item result"
					href="https://rebrickable.com/colors/${result.id}"
				>
					<div class="swatch" style="background-color: #${result.rgb}"></div>
					${result.name} (#${result.rgb})
				</a>
			`);
		}
	}
	catch(err)
	{
		if(!showError)
			return;

		$('#results').empty();
		$('#results').append(`
			<li class="list-group-item error">${err}</li>
		`);
	}
}

function searchForColour(colour) {
	colour = _.trim(colour);
	if(colour === '')
		return [];

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
		.filter(listColour => settings['ignore-transparent'] ? !listColour.is_trans : true)
		.filter(listColour => settings['ignore-chrome'] ? !listColour.name.startsWith('Chrome') : true)
		.filter(listColour => settings['ignore-speckle'] ? !listColour.name.startsWith('Speckle') : true)
		.filter(listColour => settings['ignore-modulex'] ? !listColour.name.startsWith('Modulex') : true)
		.orderBy(listColour => compareListColour(rgb, listColour))
		.take(10)
		.value();
}

function compareListColour(rgb, listColour) {
	const listRgb = parseColour(`#${listColour.rgb}`);
	return colourDistance(rgb, listRgb);
}

function colourDistance(a, b) {
	if(settings['use-cie']) {
		return deltaE(
			rgb2lab([a.red, a.green, a.blue]),
			rgb2lab([b.red, b.green, b.blue])
		);
	}
	else {
		return Math.sqrt(
			Math.pow(a.red   - b.red,   2) +
			Math.pow(a.green - b.green, 2) +
			Math.pow(a.blue  - b.blue,  2)
		);
	}
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
