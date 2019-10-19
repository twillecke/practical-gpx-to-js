import * as fs from 'fs';
import * as path from 'path';
import {
	parseGpxString,
	parseGpxWpt,
	parseGpxTrk,
	parseGpxMetadata,
} from '../src/parser';
import { waypointsToGpxWpt, tracksToGpxTrk, buildGpx } from '../src/builder';
import { GpxTrack } from '../src/types';

describe('Builder', () => {
	it('build parsed .gpx', async () => {
		let file = fs.readFileSync(path.join(__dirname, 'Praha-88km.gpx'), {
			encoding: 'utf8',
		});

		let result: any = {};
		let parsedGpx: any = await parseGpxString(file);

		let metadata = parseGpxMetadata(parsedGpx);
		// console.log(metadata);

		let waypoints = parseGpxWpt(parsedGpx);
		// console.log(waypoints);

		if (waypoints !== null) {
			let wpts = waypointsToGpxWpt(waypoints);
			// console.log(wpts);
		}

		let tracks = parseGpxTrk(parsedGpx);
		// console.log(JSON.stringify(tracks, null, ' '));

		if (tracks !== null) {
			let trks = tracksToGpxTrk(tracks);
			// console.log(JSON.stringify(trks, null, ' '));
		}

		let firstLastTrackpointTrack: Partial<GpxTrack> = {};

		if (tracks != null && tracks.length > 0) {
			firstLastTrackpointTrack = { ...tracks[0] };
			firstLastTrackpointTrack.trackpoints = [
				tracks[0].trackpoints[0],
				tracks[0].trackpoints[tracks[0].trackpoints.length - 1],
			];
			firstLastTrackpointTrack.segments = [2];
		}

		console.log(firstLastTrackpointTrack);

		let gpx = {};
		if (waypoints != null && tracks !== null) {
			gpx = buildGpx({
				metadata,
				waypoints,
				tracks: [firstLastTrackpointTrack],
			});
			// console.log(gpx);
		}

		expect(gpx).toMatchSnapshot();
	});
});
