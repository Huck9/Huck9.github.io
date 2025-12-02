# System Zarządzania Flotą Pojazdów z Monitorowaniem GPS

Kompleksowy system do zarządzania flotą pojazdów z wizualizacją GPS, optymalizacją tras i monitorowaniem parametrów pojazdów.

## Funkcjonalności

### 📍 Wprowadzanie danych o pozycjach GPS pojazdów
- Dodawanie pojazdów z współrzędnymi geograficznymi (szerokość, długość)
- Wprowadzanie punktów trasy dla każdego pojazdu
- Symulowane dane GPS w czasie rzeczywistym
- Zapis danych w localStorage przeglądarki

### 🗺️ Wizualizacja trasy na mapie
- Interaktywna mapa używająca biblioteki Leaflet
- Wizualizacja tras pojazdów na mapie z kolorowymi liniami
- Markery pojazdów z aktualną pozycją GPS
- Możliwość śledzenia wielu pojazdów jednocześnie
- Aktualizacja pozycji w czasie rzeczywistym podczas symulacji

### 🚀 Optymalizacja tras pojazdów
- Algorytm wyznaczania najkrótszej trasy (Nearest Neighbor - uproszczony TSP)
- Obliczanie dystansów między punktami GPS (formuła Haversine)
- Optymalizacja z uwzględnieniem natężenia ruchu
- Porównanie długości trasy przed i po optymalizacji
- Symulacja scenariuszy dostaw w różnych lokalizacjach

### 📊 Monitorowanie parametrów floty
- **Śledzenie zużycia paliwa**: Model zużycia paliwa na podstawie przejechanej odległości (8L/100km)
- **Monitorowanie czasu pracy kierowców**: Obliczanie czasu pracy na podstawie trasy i prędkości
- **Śledzenie postojów**: Symulacja czasu postojów pojazdów
- **Przebyta odległość**: Automatyczne obliczanie całkowitej odległości dla każdego pojazdu

### 📈 Wizualizacja danych
- **Wykresy efektywności floty**:
  - Wykres zużycia paliwa dla wszystkich pojazdów
  - Wykres czasu pracy kierowców
  - Wykres przebytej odległości
- **Statystyki floty**:
  - Całkowita liczba pojazdów
  - Suma przebytych odległości
  - Całkowite zużycie paliwa
  - Całkowity czas pracy
- **Mapa flotowa**: Wszystkie pojazdy i ich trasy wyświetlone na mapie z różnymi kolorami

## Struktura projektu

```
magdaProjekt/
├── index.html          # Główny plik HTML z interfejsem użytkownika
├── style.css           # Style CSS dla aplikacji
├── script.js           # Główny plik obsługujący interfejs
├── fleetManager.js     # System zarządzania flotą pojazdów
├── mapManager.js       # Zarządzanie mapą i wizualizacją
├── routeOptimizer.js   # Algorytmy optymalizacji tras
├── simulation.js        # Symulacja pojazdów w czasie rzeczywistym
├── charts.js           # Zarządzanie wykresami (Chart.js)
└── README.md           # Dokumentacja
```

## Jak uruchomić

1. Otwórz plik `index.html` w nowoczesnej przeglądarce (Chrome, Firefox, Edge)
2. Aplikacja działa bezpośrednio w przeglądarce - nie wymaga serwera
3. Wszystkie dane są zapisywane lokalnie w przeglądarce (localStorage)

## Użycie

### Dodawanie pojazdu
1. Wprowadź nazwę pojazdu (opcjonalnie)
2. Wprowadź współrzędne GPS (szerokość i długość geograficzną)
3. Kliknij "Dodaj pojazd"
4. Pojazd pojawi się na mapie jako kolorowy marker

### Dodawanie punktów trasy
1. Wybierz pojazd z listy rozwijanej
2. Wprowadź współrzędne GPS punktu trasy
3. Kliknij "Dodaj punkt trasy"
4. Trasa zostanie narysowana na mapie

### Optymalizacja trasy
1. Wybierz pojazd z listy
2. Upewnij się, że pojazd ma co najmniej 2 punkty trasy
3. Kliknij "Optymalizuj trasę"
4. System znajdzie najkrótszą trasę i wyświetli statystyki oszczędności

### Symulacja
1. Ustaw liczbę pojazdów do wygenerowania
2. Kliknij "Start symulacji"
3. Pojazdy będą automatycznie poruszać się po trasach
4. Statystyki i wykresy będą aktualizowane w czasie rzeczywistym
5. Kliknij "Stop symulacji" aby zatrzymać

### Kontrola mapy
- **Centruj mapę**: Automatycznie wyśrodkuje mapę na wszystkich pojazdach
- **Pokaż/Ukryj markery**: Przełącza widoczność markerów pojazdów

## Technologie

- **HTML5** - Struktura aplikacji
- **CSS3** - Stylowanie i responsywność
- **Vanilla JavaScript** - Logika aplikacji (bez frameworków)
- **Leaflet.js** - Biblioteka do map interaktywnych
- **Chart.js** - Biblioteka do tworzenia wykresów
- **LocalStorage API** - Zapis danych lokalnie w przeglądarce

## Algorytmy

### Obliczanie odległości GPS
Używa formuły Haversine do obliczania odległości między dwoma punktami na powierzchni Ziemi:
```
a = sin²(Δφ/2) + cos(φ1) × cos(φ2) × sin²(Δλ/2)
c = 2 × atan2(√a, √(1−a))
d = R × c
```
gdzie R = 6371 km (promień Ziemi)

### Optymalizacja trasy
Algorytm Nearest Neighbor (najbliższy sąsiad) - uproszczona wersja problemu komiwojażera (TSP):
1. Start z pozycji początkowej pojazdu
2. Znajdź najbliższy nieodwiedzony punkt
3. Przejdź do tego punktu
4. Powtarzaj aż wszystkie punkty zostaną odwiedzone

### Model zużycia paliwa
```
Zużycie paliwa = (Odległość / 100) × 8 L/100km
```

### Model czasu pracy
```
Czas pracy = (Odległość / Prędkość) + Czas postojów
Prędkość = 50 km/h (średnia)
```

## Przykładowe współrzędne GPS (Warszawa)

- Centrum Warszawy: 52.2297, 21.0122
- Lotnisko Chopina: 52.1657, 20.9671
- Pałac Kultury: 52.2319, 21.0067
- Stadion Narodowy: 52.2391, 21.0452

## Rozszerzenia możliwe do dodania

- Eksport danych do CSV/JSON
- Import danych z plików
- Zaawansowane algorytmy optymalizacji (genetyczne, simulated annealing)
- Integracja z rzeczywistymi danymi GPS (API)
- Powiadomienia o przekroczeniu limitów
- Raporty PDF
- Historia tras pojazdów
- Geofencing (strefy geograficzne)

## Licencja

Projekt edukacyjny - do użytku własnego.
