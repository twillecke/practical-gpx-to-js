import * as GpxTypes from './types';
import { parseStringPromise } from 'xml2js';
import { parseISO } from 'date-fns';

export async function parseGpx(gpxString: string): Promise<GpxTypes.Gpx> {
	let parsedGpx = await parseGpxString(gpxString);

	let metadata = parseGpxMetadata(parsedGpx);
	let waypoints = parseGpxWpt(parsedGpx);
	let tracks = parseGpxTrk(parsedGpx);

	return {
		metadata,
		waypoints,
		tracks,
	};
}

/**
 * Parses .gpx file using xml2js into js structures
 *
 * @param gpxString .gpx file contents
 */
export async function parseGpxString(
	gpxString: string
): Promise<GpxTypes.ParsedGpx> {
	let parsedGpx;

	try {
		parsedGpx = await parseStringPromise(gpxString);
	} catch (e) {
		throw `Couldn't parse given .gpx, error: ${e}`;
	}

	if (parsedGpx.gpx === undefined) {
		throw 'Given file is not a .gpx file';
	}

	return parsedGpx;
}

export function hasGpxTagValue(value: any): value is Array<any> {
	return value != undefined && Array.isArray(value) && value.length > 0;
}

export function parseGpxMetadata(parsedGpx: GpxTypes.ParsedGpx) {
	let metadata: GpxTypes.GpxMetadata = {
		creator: null,
		name: null,
		description: null,
		time: null,
	};
	// <gpx>
	if (parsedGpx.gpx.$ !== undefined && parsedGpx.gpx.$.creator !== undefined) {
		metadata.creator = parsedGpx.gpx.$.creator;
	}

	// <metadata>
	if (hasGpxTagValue(parsedGpx.gpx.metadata)) {
		let gpxMetadata = parsedGpx.gpx.metadata[0];
		metadata.name = hasGpxTagValue(gpxMetadata.name)
			? gpxMetadata.name[0]
			: null;
		metadata.description = hasGpxTagValue(gpxMetadata.desc)
			? gpxMetadata.desc[0]
			: null;
		metadata.time = hasGpxTagValue(gpxMetadata.time)
			? parseISO(gpxMetadata.time[0])
			: null;
	}

	return metadata;
}

export function parseGpxWpt(
	parsedGpx: GpxTypes.ParsedGpx
): Array<GpxTypes.GpxWaypoint> | null {
	let waypoints: Array<GpxTypes.GpxWaypoint> = [];

	if (!hasGpxTagValue(parsedGpx.gpx.wpt)) {
		return null;
	}

	parsedGpx.gpx.wpt.forEach((wpt) => {
		// Skip waypoints without both Lat and Lon
		if (
			wpt.$ == undefined ||
			wpt.$.lat == undefined ||
			wpt.$.lon == undefined
		) {
			return;
		}

		let waypoint: Partial<GpxTypes.GpxWaypoint> = {};

		waypoint.lat = Number(wpt.$.lat);
		waypoint.lon = Number(wpt.$.lon);
		waypoint.time = hasGpxTagValue(wpt.time) ? parseISO(wpt.time[0]) : null;
		waypoint.name = hasGpxTagValue(wpt.name) ? wpt.name[0] : null;
		waypoint.description = hasGpxTagValue(wpt.desc) ? wpt.desc[0] : null;
		waypoint.symbol = hasGpxTagValue(wpt.sym) ? wpt.sym[0] : null;
		waypoint.altitude = hasGpxTagValue(wpt.ele) ? Number(wpt.ele[0]) : null;

		waypoints.push(<GpxTypes.GpxWaypoint>waypoint);
	});

	return waypoints;
}

export function parseGpxTrk(
	parsedGpx: GpxTypes.ParsedGpx
): Array<GpxTypes.GpxTrack> | null {
	let tracks: Array<GpxTypes.GpxTrack> = [];

	if (!hasGpxTagValue(parsedGpx.gpx.trk)) {
		return null;
	}

	parsedGpx.gpx.trk.forEach((trk) => {
		let track: GpxTypes.GpxTrack = {
			name: hasGpxTagValue(trk.name) ? trk.name[0] : null,
			trackpoints: [],
			segments: [],
		};

		// Track has no trackpoints
		if (!trk.trkseg || !Array.isArray(trk.trkseg)) {
			tracks.push(track);
			return false;
		}

		let trkSegments: Array<{ trkpt: Array<any> }> = trk.trkseg;

		trkSegments.forEach((segment) => {
			track.segments.push(segment.trkpt.length);

			let trkPoints: Array<any> = segment.trkpt;

			trkPoints.forEach((point) => {
				// Skip trackpoints without both Lat and Lon
				if (
					point.$ == undefined ||
					point.$.lat == undefined ||
					point.$.lon == undefined
				) {
					return;
				}

				let trackpoint: Partial<GpxTypes.GpxTrackpoint> = {
					cadence: null,
					heartRate: null,
				};

				trackpoint.lat = Number(point.$.lat);
				trackpoint.lon = Number(point.$.lon);
				trackpoint.time = hasGpxTagValue(point.time)
					? parseISO(point.time[0])
					: null;
				trackpoint.altitude = hasGpxTagValue(point.ele)
					? Number(point.ele)
					: null;
				trackpoint.speed = hasGpxTagValue(point.speed)
					? Number(point.speed)
					: null;

				// Handle trackpoint extensions such as heart rate and cadence
				if (point.extensions != null && hasGpxTagValue(point.extensions)) {
					let extensions = parseTrackpointExtensions(point.extensions);

					if (extensions.cad !== undefined) {
						trackpoint.cadence = extensions.cad;
					}
					if (extensions.hr !== undefined) {
						trackpoint.heartRate = extensions.hr;
					}
				}

				track.trackpoints.push(<GpxTypes.GpxTrackpoint>trackpoint);
			});
		});

		tracks.push(track);
		return undefined;
	});

	return tracks;
}

/**
 * Parses .gpx trackpoint extension cadence and heart rate to Trackpoint values
 *
 * @param extensions
 */
export function parseTrackpointExtensions(
	extensions: Array<any>
): { hr?: number; cad?: number } {
	let extensionValues: any = {};

	// TODO: Seems there are many different extension, will handle when needed
	// extensions = [ { 'gpxtpx:TrackPointExtension': [ [Object] ] } ]
	extensions.forEach((extension) => {
		for (let extensionName in extension) {
			if (!extension.hasOwnProperty(extensionName)) {
				continue;
			}

			// Is it really a TrackPointExtension
			let extensionNameOnly = extensionName.split(':');
			if (
				extensionNameOnly.length !== 2 &&
				extensionNameOnly[1] !== 'TrackPointExtension'
			) {
				continue;
			}

			// It is, now get the values
			let trackPointExtensions = extension[extensionName];

			trackPointExtensions.forEach((trackPointExtension: any) => {
				for (let extensionValueName in trackPointExtension) {
					if (!trackPointExtension.hasOwnProperty(extensionValueName)) {
						continue;
					}

					// Now we have value name, such as cad, hr
					let valueNameOnly = extensionValueName.split(':');
					if (valueNameOnly.length !== 2) {
						continue;
					}

					// Pick only select extension values
					let valueName = '';
					if (valueNameOnly[1] === 'cad') {
						valueName = valueNameOnly[1];
						let extensionValue = trackPointExtension[extensionValueName];
						if (hasGpxTagValue(extensionValue)) {
							extensionValues[valueName] = Number(extensionValue[0]);
						}
					}
					if (valueNameOnly[1] === 'hr') {
						valueName = valueNameOnly[1];
						let extensionValue = trackPointExtension[extensionValueName];
						if (hasGpxTagValue(extensionValue)) {
							extensionValues[valueName] = Number(extensionValue[0]);
						}
					}
				}
			});
		}
	});

	return extensionValues;
}
