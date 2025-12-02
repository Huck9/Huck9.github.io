// Zarządzanie wykresami i wizualizacją danych

class ChartsManager {
    constructor() {
        this.fuelChart = null;
        this.workTimeChart = null;
        this.distanceChart = null;
        this.initCharts();
    }

    // Inicjalizuj wszystkie wykresy
    initCharts() {
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                }
            }
        };

        // Wykres zużycia paliwa
        const fuelCtx = document.getElementById('fuelChart').getContext('2d');
        this.fuelChart = new Chart(fuelCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Zużycie paliwa (L)',
                    data: [],
                    backgroundColor: 'rgba(52, 152, 219, 0.8)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1
                }]
            },
            options: chartOptions
        });

        // Wykres czasu pracy
        const workTimeCtx = document.getElementById('workTimeChart').getContext('2d');
        this.workTimeChart = new Chart(workTimeCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Czas pracy (h)',
                    data: [],
                    backgroundColor: 'rgba(46, 204, 113, 0.8)',
                    borderColor: 'rgba(46, 204, 113, 1)',
                    borderWidth: 1
                }]
            },
            options: chartOptions
        });

        // Wykres przebytej odległości
        const distanceCtx = document.getElementById('distanceChart').getContext('2d');
        this.distanceChart = new Chart(distanceCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Odległość (km)',
                    data: [],
                    backgroundColor: 'rgba(241, 196, 15, 0.8)',
                    borderColor: 'rgba(241, 196, 15, 1)',
                    borderWidth: 1
                }]
            },
            options: chartOptions
        });
    }

    // Aktualizuj wszystkie wykresy
    updateCharts() {
        const vehicles = fleetManager.getAllVehicles();
        
        const labels = vehicles.map(v => v.name);
        const fuelData = vehicles.map(v => parseFloat(v.fuelConsumption.toFixed(2)));
        const workTimeData = vehicles.map(v => parseFloat(v.workTime.toFixed(2)));
        const distanceData = vehicles.map(v => parseFloat(v.totalDistance.toFixed(2)));

        // Aktualizuj wykres zużycia paliwa
        this.fuelChart.data.labels = labels;
        this.fuelChart.data.datasets[0].data = fuelData;
        this.fuelChart.update();

        // Aktualizuj wykres czasu pracy
        this.workTimeChart.data.labels = labels;
        this.workTimeChart.data.datasets[0].data = workTimeData;
        this.workTimeChart.update();

        // Aktualizuj wykres odległości
        this.distanceChart.data.labels = labels;
        this.distanceChart.data.datasets[0].data = distanceData;
        this.distanceChart.update();
    }
}

// Eksportuj instancję globalną
window.chartsManager = new ChartsManager();

// Funkcja pomocnicza do aktualizacji wykresów
window.updateCharts = function() {
    if (window.chartsManager) {
        chartsManager.updateCharts();
    }
};

