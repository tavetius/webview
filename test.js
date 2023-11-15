const fs = require('fs');

let rawdata = fs.readFileSync('test.json');
let student = JSON.parse(rawdata);


const getPgnRavLines = (
	moves
) => {
	moves.forEach((move, indx) => {
		console.log(move)
		if (move.ravs) {
			let moveRavs = move.ravs;
			let moveRavsAndRemaining = [...moveRavs];

			moveRavsAndRemaining.forEach((moveRav, index) => {
				getPgnRavLines(
					moveRav.moves,
				);
				container = [];
			})
		}
	})
}

getPgnRavLines(student)