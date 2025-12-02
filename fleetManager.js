// System zarządzania flotą pojazdów

class FleetManager {
    constructor() {
        this.vehicles = [];
        this.nextVehicleId = 1;
        this.loadFromStorage();
    }

    // Dodaj nowy pojazd
    addVehicle(name, latitude, longitude) {
        const vehicle = {
            id: this.nextVehicleId++,
            name: name || `Pojazd ${this.nextVehicleId - 1}`,
            currentPosition: { lat: latitude, lng: longitude },
            route: [],
            totalDistance: 0, // km
            fuelConsumption: 0, // L
            workTime: 0, // godziny
            idleTime: 0, // godziny
            isActive: false,
            color: this.getRandomColor()
        };
        
        this.vehicles.push(vehicle);
        this.saveToStorage();
        return vehicle;
    }

    // Dodaj punkt do trasy pojazdu
    addRoutePoint(vehicleId, latitude, longitude) {
        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return null;

        const point = { lat: latitude, lng: longitude };
        vehicle.route.push(point);
        this.saveToStorage();
        return point;
    }

    // Oblicz odległość między dwoma punktami GPS (Haversine formula)
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Promień Ziemi w km
        const dLat = this.toRad(lat2 - lat1);
        const dLng = this.toRad(lng2 - lng1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Odległość w km
    }

    // Konwersja stopni na radiany
    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    // Oblicz całkowitą odległość trasy pojazdu
    calculateRouteDistance(vehicleId) {
        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        if (!vehicle || vehicle.route.length < 2) return 0;

        let totalDistance = 0;
        const startPoint = vehicle.currentPosition;
        let prevPoint = startPoint;

        for (let point of vehicle.route) {
            totalDistance += this.calculateDistance(
                prevPoint.lat, prevPoint.lng,
                point.lat, point.lng
            );
            prevPoint = point;
        }

        vehicle.totalDistance = totalDistance;
        this.updateVehicleMetrics(vehicle);
        this.saveToStorage();
        return totalDistance;
    }

    // Aktualizuj metryki pojazdu (zużycie paliwa, czas pracy)
    updateVehicleMetrics(vehicle) {
        // Zużycie paliwa: średnio 8L/100km (można dostosować)
        const fuelConsumptionRate = 8; // L/100km
        vehicle.fuelConsumption = (vehicle.totalDistance / 100) * fuelConsumptionRate;

        // Czas pracy: średnia prędkość 50 km/h + czas postojów
        const averageSpeed = 50; // km/h
        const drivingTime = vehicle.totalDistance / averageSpeed;
        vehicle.workTime = drivingTime + vehicle.idleTime;
    }

    // Pobierz pojazd po ID
    getVehicle(vehicleId) {
        return this.vehicles.find(v => v.id === vehicleId);
    }

    // Pobierz wszystkie pojazdy
    getAllVehicles() {
        return this.vehicles;
    }

    // Usuń pojazd
    removeVehicle(vehicleId) {
        this.vehicles = this.vehicles.filter(v => v.id !== vehicleId);
        this.saveToStorage();
    }

    // Wyczyść trasę pojazdu
    clearRoute(vehicleId) {
        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        if (vehicle) {
            vehicle.route = [];
            vehicle.totalDistance = 0;
            vehicle.fuelConsumption = 0;
            vehicle.workTime = 0;
            this.saveToStorage();
        }
    }

    // Pobierz statystyki całej floty
    getFleetStats() {
        const stats = {
            totalVehicles: this.vehicles.length,
            totalDistance: 0,
            totalFuel: 0,
            totalWorkTime: 0
        };

        this.vehicles.forEach(vehicle => {
            stats.totalDistance += vehicle.totalDistance;
            stats.totalFuel += vehicle.fuelConsumption;
            stats.totalWorkTime += vehicle.workTime;
        });

        return stats;
    }

    // Generuj losowy kolor dla pojazdu
    getRandomColor() {
        const colors = [
            '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
            '#1abc9c', '#e67e22', '#34495e', '#c0392b', '#16a085'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Zapisz do localStorage
    saveToStorage() {
        localStorage.setItem('fleetVehicles', JSON.stringify(this.vehicles));
        localStorage.setItem('nextVehicleId', this.nextVehicleId.toString());
    }

    // Wczytaj z localStorage
    loadFromStorage() {
        const saved = localStorage.getItem('fleetVehicles');
        if (saved) {
            this.vehicles = JSON.parse(saved);
        }
        
        const savedId = localStorage.getItem('nextVehicleId');
        if (savedId) {
            this.nextVehicleId = parseInt(savedId);
        }
    }
}

// Eksportuj instancję globalną
window.fleetManager = new FleetManager();

