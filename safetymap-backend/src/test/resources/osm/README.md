# OSM test fixture

`binh-duong-ward.osm.pbf`: road network around Binh Duong ward (code 25760, HCMC), used by map import tests
(e.g. "importing the same file twice keeps segment ids").

- Source: BBBike extract service (https://extract.bbbike.org), format PBF
- Bounding box (W,S x E,N): `106.648,10.992 x 106.728,11.118` (ward bbox + ~500 m margin, rounded by BBBike)
- OSM data timestamp: 2026-11-12T00:00:00Z
- MD5: `052b22d56dde29e48ff10cdd0188f46b`
- SHA-256: `337d574610142de62134b6fdfa5f156f33eb89a65af2ce3b244378acb6b93598`

Do not replace this file casually: tests may assert counts derived from it.
To refresh it, request a new extract with the same bounding box and update this README.

Data © OpenStreetMap contributors, ODbL 1.0 (https://www.openstreetmap.org/copyright).