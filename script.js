// Główny plik aplikacji - obsługa interfejsu użytkownika

// Funkcje pomocnicze
function updateStats() {
    const stats = fleetManager.getFleetStats();
    
    document.getElementById('totalVehicles').textContent = stats.totalVehicles;
    document.getElementById('totalDistance').textContent = stats.totalDistance.toFixed(2) + ' km';
    document.getElementById('totalFuel').textContent = stats.totalFuel.toFixed(2) + ' L';
    document.getElementById('totalWorkTime').textContent = stats.totalWorkTime.toFixed(2) + ' h';
}

function updateVehiclesList() {
    const vehiclesList = document.getElementById('vehiclesList');
    const vehicles = fleetManager.getAllVehicles();
    
    if (vehicles.length === 0) {
        vehiclesList.innerHTML = '<p style="color: #bdc3c7; text-align: center; padding: 20px;">Brak pojazdów</p>';
        return;
    }

    vehiclesList.innerHTML = vehicles.map(vehicle => `
        <div class="vehicle-item">
            <h4>${vehicle.name}</h4>
            <p>Pozycja: ${vehicle.currentPosition.lat.toFixed(4)}, ${vehicle.currentPosition.lng.toFixed(4)}</p>
            <div class="vehicle-stats">
                <div class="stat">
                    <div class="stat-value">${vehicle.totalDistance.toFixed(1)}</div>
                    <div>km</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${vehicle.fuelConsumption.toFixed(1)}</div>
                    <div>L</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${vehicle.workTime.toFixed(1)}</div>
                    <div>h</div>
                </div>
            </div>
        </div>
    `).join('');
}

function updateVehicleSelect() {
    const select = document.getElementById('vehicleSelect');
    const vehicles = fleetManager.getAllVehicles();
    
    select.innerHTML = '<option value="">Wybierz pojazd...</option>' +
        vehicles.map(v => `<option value="${v.id}">${v.name}</option>`).join('');
}

// Event listenery

// Dodaj pojazd
document.getElementById('addVehicleBtn').addEventListener('click', () => {
    const name = document.getElementById('vehicleName').value.trim();
    const lat = parseFloat(document.getElementById('latitude').value);
    const lng = parseFloat(document.getElementById('longitude').value);

    if (isNaN(lat) || isNaN(lng)) {
        alert('Proszę podać prawidłowe współrzędne GPS!');
        return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        alert('Współrzędne GPS są poza zakresem!');
        return;
    }

    const vehicle = fleetManager.addVehicle(name || null, lat, lng);
    mapManager.addVehicleMarker(vehicle, vehicle.currentPosition);
    
    updateVehiclesList();
    updateVehicleSelect();
    updateStats();
    updateCharts();

    // Wyczyść pola
    document.getElementById('vehicleName').value = '';
    document.getElementById('latitude').value = '';
    document.getElementById('longitude').value = '';
});

// Dodaj punkt trasy
document.getElementById('addRoutePointBtn').addEventListener('click', () => {
    const vehicleId = parseInt(document.getElementById('vehicleSelect').value);
    const lat = parseFloat(document.getElementById('latitude').value);
    const lng = parseFloat(document.getElementById('longitude').value);

    if (!vehicleId) {
        alert('Proszę wybrać pojazd!');
        return;
    }

    if (isNaN(lat) || isNaN(lng)) {
        alert('Proszę podać prawidłowe współrzędne GPS!');
        return;
    }

    const vehicle = fleetManager.getVehicle(vehicleId);
    if (!vehicle) return;

    fleetManager.addRoutePoint(vehicleId, lat, lng);
    mapManager.drawRoute(vehicle);
    fleetManager.calculateRouteDistance(vehicleId);
    
    updateVehiclesList();
    updateStats();
    updateCharts();
});

// Optymalizuj trasę
const optimizeBtn = document.getElementById('optimizeRouteBtn');
if (optimizeBtn) {
    optimizeBtn.addEventListener('click', () => {
        const vehicleId = parseInt(document.getElementById('vehicleSelect').value);
        
        if (!vehicleId) {
            alert('Proszę wybrać pojazd!');
            return;
        }

        const vehicle = fleetManager.getVehicle(vehicleId);
        if (!vehicle) {
            alert('Pojazd nie został znaleziony!');
            return;
        }

        if (!vehicle.route || vehicle.route.length < 2) {
            alert('Pojazd musi mieć co najmniej 2 punkty trasy do optymalizacji!');
            return;
        }

        console.log('Optymalizuję trasę dla pojazdu:', vehicle.name);
        console.log('Oryginalna trasa:', vehicle.route);

        // Zapisz oryginalną trasę
        const originalRoute = JSON.parse(JSON.stringify(vehicle.route)); // Głęboka kopia
        const originalLength = routeOptimizer.calculateRouteLength(originalRoute, vehicle.currentPosition);
        
        // Optymalizuj trasę
        const optimizedRoute = routeOptimizer.optimizeRoute(vehicleId);
        
        if (!optimizedRoute || optimizedRoute.length === 0) {
            alert('Błąd podczas optymalizacji trasy!');
            console.error('Optymalizacja zwróciła pustą trasę');
            return;
        }

        console.log('Zoptymalizowana trasa:', optimizedRoute);
        
        // Zaktualizuj trasę pojazdu
        vehicle.route = optimizedRoute;
        
        // Oblicz nową odległość
        fleetManager.calculateRouteDistance(vehicleId);
        
        // Zapisz zmiany
        fleetManager.saveToStorage();
        
        // Oblicz porównanie
        const optimizedLength = routeOptimizer.calculateRouteLength(optimizedRoute, vehicle.currentPosition);
        const savedDistance = originalLength - optimizedLength;
        const improvement = originalLength > 0 ? ((savedDistance / originalLength) * 100) : 0;
        
        // Usuń starą trasę z mapy i narysuj nową
        if (mapManager && mapManager.initialized) {
            mapManager.removeRoute(vehicleId);
            setTimeout(() => {
                mapManager.drawRoute(vehicle);
            }, 50);
        }
        
        // Odśwież interfejs
        updateVehiclesList();
        updateStats();
        updateCharts();
        
        // Pokaż wyniki
        const message = `Trasa zoptymalizowana!\n\n` +
              `Oryginalna długość: ${originalLength.toFixed(2)} km\n` +
              `Zoptymalizowana: ${optimizedLength.toFixed(2)} km\n` +
              `Oszczędność: ${savedDistance.toFixed(2)} km (${improvement.toFixed(2)}%)`;
        
        alert(message);
        console.log('Optymalizacja zakończona:', message);
    });
} else {
    console.error('Przycisk optimizeRouteBtn nie został znaleziony!');
}

// Wyczyść trasę
document.getElementById('clearRouteBtn').addEventListener('click', () => {
    const vehicleId = parseInt(document.getElementById('vehicleSelect').value);
    
    if (!vehicleId) {
        alert('Proszę wybrać pojazd!');
        return;
    }

    fleetManager.clearRoute(vehicleId);
    mapManager.removeRoute(vehicleId);
    
    updateVehiclesList();
    updateStats();
    updateCharts();
});

// Start symulacji
const startSimBtn = document.getElementById('startSimulationBtn');
if (startSimBtn) {
    startSimBtn.addEventListener('click', () => {
        const count = parseInt(document.getElementById('simVehicleCount').value) || 5;
        
        if (!window.simulation) {
            alert('Błąd: Symulacja nie jest załadowana. Odśwież stronę.');
            console.error('Simulation object nie istnieje');
            return;
        }
        
        simulation.start(count);
        
        // Odśwież interfejs po chwili (gdy pojazdy zostaną utworzone)
        setTimeout(() => {
            updateVehiclesList();
            updateVehicleSelect();
            updateStats();
            updateCharts();
        }, 500);
    });
} else {
    console.error('Przycisk startSimulationBtn nie został znaleziony!');
}

// Stop symulacji
const stopSimBtn = document.getElementById('stopSimulationBtn');
if (stopSimBtn) {
    stopSimBtn.addEventListener('click', () => {
        if (window.simulation) {
            simulation.stop();
            updateVehiclesList();
            updateStats();
            updateCharts();
        } else {
            console.error('Simulation object nie istnieje');
        }
    });
} else {
    console.error('Przycisk stopSimulationBtn nie został znaleziony!');
}

// Kontrola mapy
document.getElementById('centerMapBtn').addEventListener('click', () => {
    mapManager.centerOnVehicles();
});

document.getElementById('toggleMarkersBtn').addEventListener('click', () => {
    mapManager.toggleMarkers();
    mapManager.refreshAllVehicles();
});

// Funkcja inicjalizacji mapy z retry
function initMapWithRetry(retries = 5, delay = 500) {
    // Sprawdź czy jesteśmy w trybie file://
    if (window.location.protocol === 'file:') {
        console.warn('Uwaga: Plik otwarty przez file:// - niektóre funkcje mogą nie działać');
        const mapElement = document.getElementById('map');
        if (mapElement && !mapElement.querySelector('.file-protocol-warning')) {
            const warning = document.createElement('div');
            warning.className = 'file-protocol-warning';
            warning.style.cssText = 'padding: 10px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; margin: 10px; font-size: 0.9em;';
            warning.innerHTML = '⚠️ Uwaga: Aby mapa działała poprawnie, uruchom aplikację przez serwer HTTP (np. Python: python -m http.server)';
            mapElement.appendChild(warning);
        }
    }
    
    if (typeof L !== 'undefined') {
        console.log('Leaflet jest załadowany, inicjalizuję mapę...');
        if (window.mapManager && typeof mapManager.initMap === 'function') {
            const success = mapManager.initMap();
            if (success) {
                console.log('Mapa zainicjalizowana pomyślnie');
                // Usuń ostrzeżenie jeśli było
                const warning = document.querySelector('.file-protocol-warning');
                if (warning) warning.remove();
                return;
            }
        }
    }
    
    if (retries > 0) {
        console.log(`Ponawiam próbę inicjalizacji mapy... (pozostało ${retries} prób)`);
        setTimeout(() => {
            initMapWithRetry(retries - 1, delay);
        }, delay);
    } else {
        console.error('Nie udało się zainicjalizować mapy po wszystkich próbach');
        const mapElement = document.getElementById('map');
        if (mapElement && !mapElement.querySelector('.error-message')) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.style.cssText = 'padding: 20px; text-align: center; color: #666; background: #f0f0f0; border: 2px solid #ccc; border-radius: 5px; margin: 20px;';
            errorDiv.innerHTML = 
                '<h3>Błąd ładowania mapy</h3>' +
                '<p>Nie można załadować biblioteki Leaflet.</p>' +
                '<p>Sprawdź połączenie internetowe i odśwież stronę.</p>' +
                '<p style="font-size: 0.8em; color: #999; margin-top: 10px;">' +
                'Jeśli otwierasz plik lokalnie (file://), uruchom serwer HTTP:<br>' +
                '<code style="background: #e0e0e0; padding: 5px; border-radius: 3px; display: inline-block; margin-top: 5px;">python -m http.server 8000</code><br>' +
                'Następnie otwórz: <code style="background: #e0e0e0; padding: 5px; border-radius: 3px;">http://localhost:8000</code>' +
                '</p>';
            mapElement.appendChild(errorDiv);
        }
    }
}

// Inicjalizacja przy załadowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM załadowany, sprawdzam komponenty...');
    
    // Sprawdź czy wszystkie komponenty są załadowane
    if (!window.fleetManager) {
        console.error('FleetManager nie jest załadowany!');
    }
    if (!window.mapManager) {
        console.error('MapManager nie jest załadowany!');
    }
    if (!window.simulation) {
        console.error('Simulation nie jest załadowany!');
    }
    if (!window.routeOptimizer) {
        console.error('RouteOptimizer nie jest załadowany!');
    }
    
    // Poczekaj chwilę na załadowanie Leaflet
    setTimeout(() => {
        initMapWithRetry();
    }, 100);
    
    // Wczytaj zapisane pojazdy
    const vehicles = fleetManager.getAllVehicles();
    
    if (vehicles.length > 0) {
        // Poczekaj chwilę na pełne załadowanie mapy
        setTimeout(() => {
            if (mapManager && mapManager.initialized) {
                mapManager.refreshAllVehicles();
            }
        }, 500);
    }
    
    updateVehiclesList();
    updateVehicleSelect();
    updateStats();
    updateCharts();
    
    // Aktualizuj co 5 sekund (dla symulacji)
    setInterval(() => {
        if (!simulation || !simulation.isRunning) {
            updateVehiclesList();
            updateStats();
            updateCharts();
        }
    }, 5000);
    
    console.log('Inicjalizacja zakończona');
});
