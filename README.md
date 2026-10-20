## Chạy backend

java version: JDK 25
cd safetymap-backend
copy .env.example .env # rồi điền DB_PASSWORD
./mvnw spring-boot:run

## Chạy frontend

cd safetymap-frontend
npm install
npm run dev
