# SafetyMap Frontend

A web map that shows how dangerous each road segment is and where verified incidents have happened.

Built with React, TypeScript, Vite, Leaflet and MapLibre GL.

## Getting started

Requires Node.js `20.19+` or `22.12+`.

```bash
npm install
npm run dev
```

Run `npm install` again whenever `package.json` changes after you pull new code.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run server` | Serve `public/db.json` with json-server on port 3001 |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Lint the code with Oxlint |

## Project structure

```
public/
  db.json        Sample data (road segments, danger scores, incidents)
  map/           Map style used by the app
scripts/         Helper scripts for generating the map style
src/
  Business/      Data access (DAL), logic and models
  GUIs/          Components and pages
```

## Map

The base map is rendered in the browser with MapLibre GL, using vector tiles from
[OpenFreeMap](https://openfreemap.org) (data from [OpenStreetMap](https://www.openstreetmap.org/copyright))
and the style file in `public/map/`. Leaflet draws the app's own layers (road segments, incidents, popups) on top.

An internet connection is required to load the base map.

The style file is generated. To regenerate it, see the usage notes at the top of
`scripts/patch-liberty.mjs` and avoid editing the output by hand.

The attribution shown in the corner of the map is required by the data providers and must be kept.

## Development tools

In development mode, `CoordPicker` helps draw new road segments:
left-click adds a point, right-click starts a new segment from the last point,
and the resulting JSON is printed to the console.
 list of rules and categories.
