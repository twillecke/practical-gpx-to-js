import * as GpxTypes from './types';
import { Builder } from 'xml2js';

export function buildGpx({
	metadata,
	tracks = [],
	waypoints = [],
}: {
	metadata: Partial<GpxTypes.GpxMetadata>;
	tracks?: Array<Partial<GpxTypes.GpxTrack>>;
	waypoints?: Array<Partial<GpxTypes.GpxWaypoint>>;
}) {
	let trks = tracksToGpxTrk(tracks);
	let wpts = waypointsToGpxWpt(waypoints);

	var builder = new Builder();

	let gpx: any = {
		gpx: {
			$: {
				version: '1.1',
				xmlns: 'http://www.topografix.com/GPX/1/1',
				creator: metadata ? metadata.creator : '',
			},
			metadata: {
				time: metadata.time
					? metadata.time.toISOString()
					: new Date().toISOString(),
			},
		},
	};

	if (metadata.name) {
		gpx.gpx.metadata.name = metadata.name;
	}
	if (metadata.description) {
		gpx.gpx.metadata.desc = metadata.description;
	}

	if (wpts.length > 0) {
		gpx.gpx.wpt = wpts;
	}

	if (trks.length > 0) {
		gpx.gpx.trk = trks;
	}

	var xml = builder.buildObject(gpx);

	return xml;
}

export function waypointsToGpxWpt(
	waypoints: Array<Partial<GpxTypes.GpxWaypoint>> = []
) {
	let wpts: Array<any> = [];

	waypoints.forEach((waypoint) => {
		let wpt = waypointToGpxWpt(waypoint);
		wpts.push(wpt);
	});

	return wpts;
}

export function waypointToGpxWpt(waypoint: Partial<GpxTypes.GpxWaypoint>) {
	let wpt: any = {
		$: {
			lat: waypoint.lat ? waypoint.lat.toString(10) : undefined,
			lon: waypoint.lon ? waypoint.lon.toString(10) : undefined,
		},
	};

	if (waypoint.name) {
		wpt.name = waypoint.name;
	}

	if (waypoint.description) {
		wpt.desc = waypoint.description;
	}

	if (waypoint.time) {
		wpt.time = waypoint.time.toISOString();
	}

	if (waypoint.symbol) {
		wpt.sym = waypoint.symbol;
	}

	if (waypoint.altitude) {
		wpt.ele = waypoint.altitude;
	}

	return wpt;
}

export function tracksToGpxTrk(tracks: Array<Partial<GpxTypes.GpxTrack>> = []) {
	let trks: Array<any> = [];

	tracks.forEach((track) => {
		let trk = trackToGpxTrk(track);
		trks.push(trk);
	});

	return trks;
}

export function trackpointToGpxTrkpt(
	trackpoint: Partial<GpxTypes.GpxTrackpoint>
) {
	let point: any = {
		trkpt: {
			$: {
				lat: trackpoint.lat ? trackpoint.lat.toString(10) : undefined,
				lon: trackpoint.lon ? trackpoint.lon.toString(10) : undefined,
			},
		},
	};

	if (trackpoint.time) {
		point.trkpt.time = trackpoint.time.toISOString();
	}

	if (trackpoint.altitude) {
		point.trkpt.ele = trackpoint.altitude;
	}

	if (trackpoint.speed) {
		point.trkpt.speed = trackpoint.speed;
	}

	if (trackpoint.heartRate == null && trackpoint.cadence == null) {
		return point;
	}

	// Add extensions

	let extension: any = {};

	if (trackpoint.heartRate != null) {
		extension['gpxtpx:hr'] = [trackpoint.heartRate.toString()];
	}
	if (trackpoint.cadence != null) {
		extension['gpxtpx:cad'] = [trackpoint.cadence.toString()];
	}

	let extensions = [
		{
			'gpxtpx:TrackPointExtension': [extension],
		},
	];

	point.trkpt.extensions = extensions;

	return point;
}

export function trackToGpxTrk(track: Partial<GpxTypes.GpxTrack>) {
	let trk: any = {
		name: track.name,
		trkseg: [],
	};

	// TS is complaining about undefined in the forEach below
	const segments = track.segments;

	if (
		track.trackpoints == undefined ||
		track.trackpoints.length === 0 ||
		segments == undefined ||
		segments.length === 0
	) {
		return trk;
	}

	let trackSegmentPoints: Array<any> = [];
	let trackSegmentIndex = 0;
	let trackPointCount = 0;

	track.trackpoints.forEach((trackpoint) => {
		let trkpt = trackpointToGpxTrkpt(trackpoint);
		trackSegmentPoints.push(trkpt);

		trackPointCount++;

		if (trackPointCount >= segments[trackSegmentIndex]) {
			trackPointCount = 0;
			trackSegmentIndex++;

			// Add track segment to track
			trk.trkseg.push(trackSegmentPoints);
			trackSegmentPoints = [];

			// Error: There are more segments than actual track points
			if (trackSegmentIndex >= segments.length) {
				return false;
			}
		}

		return undefined;
	});

	return trk;
}
