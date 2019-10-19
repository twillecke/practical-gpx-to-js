export interface GpxWaypoint {
	lat: number;
	lon: number;
	time: Date | null;
	name: string | null;
	description: string | null;
	symbol: string | null;
	altitude: number | null;
}

export interface GpxTrackpoint {
	lat: number;
	lon: number;
	time: Date | null;
	altitude: number | null;
	speed: number | null;
	cadence: number | null;
	heartRate: number | null;
}

export interface GpxTrack {
	name: string | null;
	trackpoints: Array<GpxTrackpoint>;
	segments: Array<number>;
}

export interface GpxMetadata {
	name: string | null;
	description: string | null;
	creator: string | null;
	time: Date | null;
}

export interface Gpx {
	metadata: GpxMetadata;
	waypoints: Array<GpxWaypoint> | null;
	tracks: Array<GpxTrack> | null;
}

export interface ParsedGpx {
	gpx: {
		$: {
			creator: string;
			[propName: string]: any;
		};
		metadata: Array<any>;
		trk: Array<any>;
		wpt: Array<any>;
	};
}
