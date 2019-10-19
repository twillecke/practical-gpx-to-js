import * as fs from 'fs';
import * as path from 'path';
import {
	parseGpxString,
	parseGpxMetadata,
	parseGpxWpt,
	parseGpxTrk,
} from '../src/parser';

describe('Parser', () => {
	it('parse .gpx', async () => {
		// let file = fs.readFileSync(path.join(__dirname, 'testTrack.gpx'), {
		let file = fs.readFileSync(path.join(__dirname, 'Praha-88km.gpx'), {
			encoding: 'utf8',
		});

		let result: any = {};

		let parsedGpx: any = await parseGpxString(file);

		let metadata = parseGpxMetadata(parsedGpx);
		result.metadata = metadata;

		let waypoints = parseGpxWpt(parsedGpx);
		result.waypoints = waypoints;

		let tracks = parseGpxTrk(parsedGpx);
		if (tracks !== null) {
			result.trackName = tracks[0].name;
			result.trackLength = tracks[0].trackpoints.length;
			result.tractFirstPoint = tracks[0].trackpoints[0];
			result.tractLastPoint =
				tracks[0].trackpoints[tracks[0].trackpoints.length - 1];
		}

		console.log(result);
		expect(result).toMatchSnapshot();
	});
});
