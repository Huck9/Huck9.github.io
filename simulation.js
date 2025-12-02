// Symulacja pojazdów w czasie rzeczywistym

class Simulation {
    constructor() {
        this.isRunning = false;
        this.intervalId = null;
        this.updateInterval = 2000; // 2 sekundy
        this.simulationSpeed = 1.0; // Mnożnik prędkości symulacji
    }

    // Start symulacji
    start(vehicleCount = 5) {
        if (this.isRunning) {
            console.log('Symulacja już działa');
            return;
        }

        if (!fleetManager) {
            console.error('FleetManager nie jest dostępny!');
            alert('Błąd: System zarządzania flotą nie jest załadowany.');
            return;
        }

        console.log(`Rozpoczynam symulację z ${vehicleCount} pojazdami...`);
        this.isRunning = true;
        
        // Utwórz pojazdy jeśli nie istnieją
        if (fleetManager.getAllVehicles().length === 0) {
            this.createSimulatedVehicles(vehicleCount);
        }

        // Upewnij się, że pojazdy są widoczne na mapie
        setTimeout(() => {
            if (mapManager && mapManager.initialized) {
                mapManager.refreshAllVehicles();
                mapManager.centerOnVehicles();
            }
        }, 300);

        // Rozpocznij aktualizację pozycji
        this.intervalId = setInterval(() => {
            if (this.isRunning) {
                this.updateVehiclePositions();
            }
        }, this.updateInterval);

        console.log('Symulacja rozpoczęta pomyślnie');
    }

    // Stop symulacji
    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        console.log('Symulacja zatrzymana');
    }

    // Utwórz symulowane pojazdy
    createSimulatedVehicles(count) {
        console.log(`Tworzenie ${count} symulowanych pojazdów...`);
        
        // Obszar symulacji: okolice Warszawy
        const centerLat = 52.2297;
        const centerLng = 21.0122;
        const radius = 0.1; // ~11 km

        for (let i = 0; i < count; i++) {
            // Losowa pozycja w okolicy
            const lat = centerLat + (Math.random() - 0.5) * radius;
            const lng = centerLng + (Math.random() - 0.5) * radius;

            const vehicle = fleetManager.addVehicle(
                `Pojazd ${i + 1}`,
                lat,
                lng
            );

            // Dodaj losową trasę dla każdego pojazdu
            this.generateRandomRoute(vehicle, 5); // 5 punktów trasy
        }

        // Odśwież mapę (jeśli jest zainicjalizowana)
        if (mapManager && mapManager.initialized) {
            setTimeout(() => {
                mapManager.refreshAllVehicles();
            }, 100);
        } else {
            console.warn('Mapa nie jest jeszcze zainicjalizowana, pojazdy zostaną dodane później');
        }
        
        console.log(`Utworzono ${count} pojazdów`);
    }

    // Generuj losową trasę dla pojazdu
    generateRandomRoute(vehicle, pointCount) {
        const centerLat = vehicle.currentPosition.lat;
        const centerLng = vehicle.currentPosition.lng;
        const radius = 0.05; // ~5.5 km

        for (let i = 0; i < pointCount; i++) {
            const lat = centerLat + (Math.random() - 0.5) * radius;
            const lng = centerLng + (Math.random() - 0.5) * radius;
            
            fleetManager.addRoutePoint(vehicle.id, lat, lng);
        }

        // Optymalizuj trasę (jeśli jest więcej niż 1 punkt)
        if (vehicle.route.length > 1 && routeOptimizer) {
            const optimized = routeOptimizer.optimizeRoute(vehicle.id);
            if (optimized && optimized.length > 0) {
                vehicle.route = optimized;
            }
        }
        
        fleetManager.calculateRouteDistance(vehicle.id);
        
        // Narysuj trasę na mapie (jeśli mapa jest gotowa)
        if (mapManager && mapManager.initialized && mapManager.map) {
            mapManager.drawRoute(vehicle);
        }
    }

    // Aktualizuj pozycje pojazdów (symulacja ruchu)
    updateVehiclePositions() {
        if (!fleetManager) {
            console.error('FleetManager nie jest dostępny!');
            return;
        }

        const vehicles = fleetManager.getAllVehicles();
        
        if (vehicles.length === 0) {
            console.warn('Brak pojazdów do symulacji');
            return;
        }
        
        vehicles.forEach(vehicle => {
            if (vehicle.route && vehicle.route.length > 0) {
                // Przesuń pojazd w kierunku następnego punktu trasy
                const nextPoint = vehicle.route[0];
                const currentPos = vehicle.currentPosition;
                
                // Oblicz odległość do następnego punktu
                const distance = fleetManager.calculateDistance(
                    currentPos.lat, currentPos.lng,
                    nextPoint.lat, nextPoint.lng
                );

                // Prędkość: ~50 km/h = ~0.014 km/s = ~0.028 km w 2 sekundy
                const speed = 0.028 * this.simulationSpeed; // km na update
                
                if (distance <= speed || distance < 0.001) {
                    // Osiągnięto punkt - usuń go z trasy
                    vehicle.currentPosition = { ...nextPoint }; // Kopia obiektu
                    vehicle.route.shift();
                    
                    // Aktualizuj całkowitą odległość
                    fleetManager.calculateRouteDistance(vehicle.id);
                    
                    // Jeśli trasa zakończona, wygeneruj nową
                    if (vehicle.route.length === 0) {
                        this.generateRandomRoute(vehicle, 5);
                    }
                } else {
                    // Przesuń pojazd w kierunku następnego punktu
                    const ratio = speed / distance;
                    vehicle.currentPosition = {
                        lat: currentPos.lat + (nextPoint.lat - currentPos.lat) * ratio,
                        lng: currentPos.lng + (nextPoint.lng - currentPos.lng) * ratio
                    };
                }

                // Aktualizuj metryki
                fleetManager.updateVehicleMetrics(vehicle);
                
                // Aktualizuj marker na mapie (jeśli mapa jest gotowa)
                if (mapManager && mapManager.initialized && mapManager.map) {
                    // Sprawdź czy marker istnieje, jeśli nie - utwórz go
                    const markerExists = mapManager.markers.some(m => m.vehicleId === vehicle.id);
                    if (!markerExists) {
                        mapManager.addVehicleMarker(vehicle, vehicle.currentPosition);
                    } else {
                        mapManager.updateVehicleMarker(vehicle.id, vehicle.currentPosition);
                    }
                }
            } else {
                // Jeśli pojazd nie ma trasy, dodaj losowy postój
                vehicle.idleTime += this.updateInterval / 3600000; // konwersja na godziny
            }
        });

        // Odśwież statystyki i wykresy
        if (typeof updateStats === 'function') updateStats();
        if (typeof updateCharts === 'function') updateCharts();
        if (typeof updateVehiclesList === 'function') updateVehiclesList();
    }

    // Ustaw prędkość symulacji
    setSimulationSpeed(speed) {
        this.simulationSpeed = Math.max(0.1, Math.min(5.0, speed));
    }
}

// Eksportuj instancję globalną
window.simulation = new Simulation();

