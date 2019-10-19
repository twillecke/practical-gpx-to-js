# Practical gpx to js

This is not a fully featured gpx parser or builder so don't expect it to do everything. The aim is to be simple and practical and do what you need.

`npm install --save practical-gpx-to-js`

## Example

```ts
import { parseGpx, buildGpx } from 'practical-gpx-to-js';
import * as fs from 'fs';
import * as path from 'path';

let gpxString = fs.readFileSync(path.join(__dirname, 'Track.gpx'), {
	encoding: 'utf8',
});

// gpx has the type of Gpx, see below in Types
let gpx = parseGpx(gpxString);

let newGpxString = buildGpx({
	metadata: gpx.metadata,
	waypoints: gpx.waypoints,
	tracks: gpx.tracks,
});

fs.writeFileSync(path.join(__dirname, 'NewTrack.gpx'), newGpxString);
```

## Types

### GPX

```ts
export interface Gpx {
	metadata: GpxMetadata;
	waypoints: Array<GpxWaypoint> | null;
	tracks: Array<GpxTrack> | null;
}
```

### Metadata

```ts
export interface GpxMetadata {
	name: string | null;
	description: string | null;
	creator: string | null;
	time: Date | null;
}
```

### Waypoint

```ts
export interface GpxWaypoint {
	lat: number;
	lon: number;
	time: Date | null;
	name: string | null;
	description: string | null;
	symbol: string | null;
	altitude: number | null;
}
```

### Track

```ts
export interface GpxTrack {
	name: string | null;
	trackpoints: Array<GpxTrackpoint>;
	segments: Array<number>;
}
```

### Trackpoint

```ts
export interface GpxTrackpoint {
	lat: number;
	lon: number;
	time: Date | null;
	altitude: number | null;
	speed: number | null;
	cadence: number | null;
	heartRate: number | null;
}
```

## Extensions

Currently handles only `gpxtpx:TrackPointExtension` `hr` and `cad`

## License

MIT
