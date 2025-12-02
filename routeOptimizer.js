// Optymalizator tras pojazdów

class RouteOptimizer {
    constructor() {
        // Współczynniki dla optymalizacji (można dostosować)
        this.trafficMultiplier = 1.0; // Mnożnik natężenia ruchu
    }

    // Algorytm najkrótszej ścieżki (Nearest Neighbor - prosty algorytm TSP)
    optimizeRoute(vehicleId) {
        const vehicle = fleetManager.getVehicle(vehicleId);
        if (!vehicle || vehicle.route.length < 2) {
            return vehicle ? vehicle.route : [];
        }

        // Punkt startowy
        const start = vehicle.currentPosition;
        const unvisited = [...vehicle.route];
        const optimizedRoute = [];
        let currentPoint = start;

        // Algorytm Nearest Neighbor
        while (unvisited.length > 0) {
            let nearestIndex = 0;
            let nearestDistance = this.calculateDistanceWithTraffic(
                currentPoint.lat, currentPoint.lng,
                unvisited[0].lat, unvisited[0].lng
            );

            // Znajdź najbliższy nieodwiedzony punkt
            for (let i = 1; i < unvisited.length; i++) {
                const distance = this.calculateDistanceWithTraffic(
                    currentPoint.lat, currentPoint.lng,
                    unvisited[i].lat, unvisited[i].lng
                );
                
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestIndex = i;
                }
            }

            // Dodaj najbliższy punkt do optymalnej trasy
            optimizedRoute.push(unvisited[nearestIndex]);
            currentPoint = unvisited[nearestIndex];
            unvisited.splice(nearestIndex, 1);
        }

        return optimizedRoute;
    }

    // Oblicz odległość z uwzględnieniem natężenia ruchu
    calculateDistanceWithTraffic(lat1, lng1, lat2, lng2) {
        const baseDistance = fleetManager.calculateDistance(lat1, lng1, lat2, lng2);
        
        // Symulacja zmiennego natężenia ruchu (można rozbudować)
        const timeOfDay = new Date().getHours();
        let trafficFactor = 1.0;
        
        // Godziny szczytu: 7-9 i 17-19
        if ((timeOfDay >= 7 && timeOfDay <= 9) || (timeOfDay >= 17 && timeOfDay <= 19)) {
            trafficFactor = 1.5; // 50% dłuższy czas przejazdu
        }
        
        return baseDistance * trafficFactor * this.trafficMultiplier;
    }

    // Optymalizacja z uwzględnieniem wielu pojazdów (prosty podział zadań)
    optimizeFleetRoutes(vehicles) {
        // Dla każdego pojazdu optymalizuj jego trasę
        vehicles.forEach(vehicle => {
            if (vehicle.route.length >= 2) {
                const optimized = this.optimizeRoute(vehicle.id);
                vehicle.route = optimized;
                fleetManager.calculateRouteDistance(vehicle.id);
            }
        });
    }

    // Oblicz całkowitą długość trasy
    calculateRouteLength(route, startPoint) {
        if (route.length < 1) return 0;

        let totalDistance = 0;
        let prevPoint = startPoint;

        for (let point of route) {
            totalDistance += fleetManager.calculateDistance(
                prevPoint.lat, prevPoint.lng,
                point.lat, point.lng
            );
            prevPoint = point;
        }

        return totalDistance;
    }

    // Porównaj długość trasy przed i po optymalizacji
    compareRoutes(originalRoute, optimizedRoute, startPoint) {
        const originalLength = this.calculateRouteLength(originalRoute, startPoint);
        const optimizedLength = this.calculateRouteLength(optimizedRoute, startPoint);
        
        const improvement = ((originalLength - optimizedLength) / originalLength) * 100;
        
        return {
            originalLength: originalLength.toFixed(2),
            optimizedLength: optimizedLength.toFixed(2),
            improvement: improvement.toFixed(2),
            savedDistance: (originalLength - optimizedLength).toFixed(2)
        };
    }

    // Ustaw współczynnik natężenia ruchu
    setTrafficMultiplier(multiplier) {
        this.trafficMultiplier = Math.max(0.5, Math.min(3.0, multiplier));
    }
}

// Eksportuj instancję globalną
window.routeOptimizer = new RouteOptimizer();

