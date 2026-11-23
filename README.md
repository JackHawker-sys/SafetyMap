## Chạy backend

java version: JDK 25
cd safetymap-backend
copy .env.example .env # rồi điền DB_PASSWORD
./mvnw spring-boot:run

## Chạy frontend

cd safetymap-frontend
npm install
npm run dev


## OSM data (Map import)
1. Download the dated vietnam extract form Geofabrik (do not use 'vietnam-latest', it changes daily):
```powershell
New-Item -ItemType Directory -Force data/osm
curl.exe -L --fail --retry 3 -C - -o data/osm/vietnam-2026-11-11.osm.pbf https://download.geofabrik.de/asia/vietnam-261111.osm.pbf
```

2. Verify the file
```powershell
Get-FileHash data/osm/vietnam-2026-11-11.osm.pbf -Algorithm SHA256 
# expected Result: 5eb2bce83b0e93d43119de637311066ecc8815e045539514cc528a686731c7a8
```

Data © OpenStreetMap contributors, licensed under ODbL (https://www.openstreetmap.org/copyright).