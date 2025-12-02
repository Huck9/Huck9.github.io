// Zarządzanie mapą i wizualizacją pojazdów

class MapManager {
    constructor() {
        this.map = null;
        this.markers = [];
        this.polylines = [];
        this.showMarkers = true;
        this.initialized = false;
    }

    // Inicjalizuj mapę Leaflet
    initMap() {
        // Sprawdź czy Leaflet jest załadowany
        if (typeof L === 'undefined') {
            console.error('Leaflet nie jest załadowany!');
            return false;
        }

        // Sprawdź czy element mapy istnieje
        const mapElement = document.getElementById('map');
        if (!mapElement) {
            console.error('Element #map nie został znaleziony!');
            return false;
        }

        // Sprawdź czy mapa już została zainicjalizowana
        if (this.map) {
            console.log('Mapa już jest zainicjalizowana');
            return true;
        }

        try {
            console.log('Rozpoczynam inicjalizację mapy...');
            
            // Sprawdź czy CSS Leaflet jest załadowany
            const leafletStyles = document.querySelector('link[href*="leaflet"]');
            if (!leafletStyles) {
                console.warn('CSS Leaflet może nie być załadowany!');
            }
            
            // Domyślna pozycja: Warszawa
            this.map = L.map('map', {
                center: [52.2297, 21.0122],
                zoom: 10,
                zoomControl: true
            });

            console.log('Obiekt mapy utworzony');
            console.log('Rozmiar kontenera:', mapElement.offsetWidth, 'x', mapElement.offsetHeight);

            // Spróbuj różnych dostawców map (fallback)
            const tileLayers = [
                {
                    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    options: {
                        attribution: '© OpenStreetMap contributors',
                        maxZoom: 19
                    }
                },
                {
                    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
                    options: {
                        attribution: '© OpenStreetMap contributors © CARTO',
                        maxZoom: 20
                    }
                },
                {
                    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
                    options: {
                        attribution: '© OpenTopoMap contributors',
                        maxZoom: 17
                    }
                }
            ];

            // Spróbuj dodać pierwszą warstwę
            let layerAdded = false;
            for (let i = 0; i < tileLayers.length; i++) {
                try {
                    const layer = L.tileLayer(tileLayers[i].url, tileLayers[i].options);
                    layer.addTo(this.map);
                    layerAdded = true;
                    console.log(`Warstwa mapy ${i + 1} dodana pomyślnie`);
                    break;
                } catch (e) {
                    console.warn(`Nie udało się dodać warstwy ${i + 1}:`, e);
                }
            }

            if (!layerAdded) {
                console.error('Nie udało się dodać żadnej warstwy mapy!');
                // Dodaj podstawową warstwę bez sprawdzania
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 19
                }).addTo(this.map);
            }

            // Wymuś odświeżenie mapy po załadowaniu
            setTimeout(() => {
                if (this.map) {
                    this.map.invalidateSize();
                    console.log('Rozmiar mapy zaktualizowany');
                }
            }, 200);

            // Dodatkowe odświeżenie po pełnym załadowaniu
            window.addEventListener('load', () => {
                if (this.map) {
                    setTimeout(() => {
                        this.map.invalidateSize();
                        console.log('Mapa odświeżona po pełnym załadowaniu strony');
                    }, 100);
                }
            });

            this.initialized = true;
            console.log('Mapa została zainicjalizowana pomyślnie');
            return true;
        } catch (error) {
            console.error('Błąd inicjalizacji mapy:', error);
            console.error('Stack trace:', error.stack);
            return false;
        }
    }

    // Dodaj marker pojazdu na mapie
    addVehicleMarker(vehicle, position) {
        if (!this.map || !this.initialized) {
            console.warn('Mapa nie jest jeszcze zainicjalizowana');
            return null;
        }
        
        if (!this.showMarkers) return null;

        const icon = L.divIcon({
            className: 'vehicle-marker',
            html: `<div style="
                background-color: ${vehicle.color};
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            "></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        const marker = L.marker([position.lat, position.lng], { icon: icon })
            .addTo(this.map)
            .bindPopup(`
                <strong>${vehicle.name}</strong><br>
                Pozycja: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}<br>
                Odległość: ${vehicle.totalDistance.toFixed(2)} km<br>
                Paliwo: ${vehicle.fuelConsumption.toFixed(2)} L
            `);

        this.markers.push({ vehicleId: vehicle.id, marker: marker });
        return marker;
    }

    // Aktualizuj pozycję markera pojazdu
    updateVehicleMarker(vehicleId, newPosition) {
        const markerData = this.markers.find(m => m.vehicleId === vehicleId);
        if (markerData) {
            markerData.marker.setLatLng([newPosition.lat, newPosition.lng]);
        }
    }

    // Narysuj trasę pojazdu na mapie
    drawRoute(vehicle) {
        if (!this.map || !this.initialized) {
            console.warn('Mapa nie jest jeszcze zainicjalizowana');
            return;
        }
        
        if (vehicle.route.length === 0) return;

        // Usuń poprzednią linię trasy dla tego pojazdu
        this.removeRoute(vehicle.id);

        const routePoints = [
            [vehicle.currentPosition.lat, vehicle.currentPosition.lng],
            ...vehicle.route.map(p => [p.lat, p.lng])
        ];

        const polyline = L.polyline(routePoints, {
            color: vehicle.color,
            weight: 4,
            opacity: 0.7
        }).addTo(this.map);

        this.polylines.push({ vehicleId: vehicle.id, polyline: polyline });

        // Dodaj markery punktów trasy
        vehicle.route.forEach((point, index) => {
            if (this.showMarkers) {
                L.circleMarker([point.lat, point.lng], {
                    radius: 5,
                    fillColor: vehicle.color,
                    color: '#fff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(this.map)
                .bindPopup(`Punkt ${index + 1}: ${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`);
            }
        });
    }

    // Usuń trasę pojazdu z mapy
    removeRoute(vehicleId) {
        const polylineData = this.polylines.find(p => p.vehicleId === vehicleId);
        if (polylineData) {
            this.map.removeLayer(polylineData.polyline);
            this.polylines = this.polylines.filter(p => p.vehicleId !== vehicleId);
        }
    }

    // Usuń wszystkie markery pojazdu
    removeVehicleMarkers(vehicleId) {
        this.markers = this.markers.filter(m => {
            if (m.vehicleId === vehicleId) {
                this.map.removeLayer(m.marker);
                return false;
            }
            return true;
        });
    }

    // Wyczyść wszystkie markery i trasy
    clearAll() {
        this.markers.forEach(m => this.map.removeLayer(m.marker));
        this.polylines.forEach(p => this.map.removeLayer(p.polyline));
        this.markers = [];
        this.polylines = [];
    }

    // Przełącz widoczność markerów
    toggleMarkers() {
        this.showMarkers = !this.showMarkers;
        
        if (this.showMarkers) {
            // Pokaż wszystkie markery
            fleetManager.getAllVehicles().forEach(vehicle => {
                this.addVehicleMarker(vehicle, vehicle.currentPosition);
            });
        } else {
            // Ukryj wszystkie markery pojazdów (zostaw tylko trasy)
            this.markers.forEach(m => this.map.removeLayer(m.marker));
            this.markers = [];
        }
    }

    // Wyśrodkuj mapę na wszystkich pojazdach
    centerOnVehicles() {
        const vehicles = fleetManager.getAllVehicles();
        if (vehicles.length === 0) return;

        if (vehicles.length === 1) {
            const pos = vehicles[0].currentPosition;
            this.map.setView([pos.lat, pos.lng], 12);
        } else {
            const bounds = vehicles.map(v => [v.currentPosition.lat, v.currentPosition.lng]);
            this.map.fitBounds(bounds, { padding: [50, 50] });
        }
    }

    // Odśwież wizualizację wszystkich pojazdów
    refreshAllVehicles() {
        this.clearAll();
        const vehicles = fleetManager.getAllVehicles();
        
        vehicles.forEach(vehicle => {
            this.addVehicleMarker(vehicle, vehicle.currentPosition);
            if (vehicle.route.length > 0) {
                this.drawRoute(vehicle);
            }
        });
    }
}

// Eksportuj instancję globalną (nie inicjalizuj od razu)
window.mapManager = new MapManager();

