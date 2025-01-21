<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import jsonData from "../assets/data.json";

const mapContainer = ref<HTMLDivElement | null>(null);
const loading = ref(true);
const currentDay = ref(1); // Jour actuel

let map: maplibregl.Map | null = null;
let currentMarkers: maplibregl.Marker[] = []; 

// Ajoutez votre access token pour la Jawg API
const accessToken = "HfPSuO6CUKmBAHY0lfk4PVSaUHY9V7uex6zYgTjX1QKqK6zSnk0bEi9elG0Wo85N";

// Fonction pour aller au jour suivant
const nextDay = () => {
  if (currentDay.value < jsonData.jours.length) {
    currentDay.value++;
    loadDayRouteAndMarkers();
  }
};

// Fonction pour aller au jour précédent
const previousDay = () => {
  if (currentDay.value > 1) {
    currentDay.value--;
    loadDayRouteAndMarkers();
  }
};

// Fonction pour récupérer une image depuis l'API Unsplash en fonction de `photoQuery`
const getUnsplashImage = async (query: string): Promise<string> => {
  const unsplashAccessKey = "rYh6qhedSiJ0-t0rmVGyq1zoU-5bbTFkIcNSTHVS4CQ"; // Remplacez par votre clé Unsplash
  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${unsplashAccessKey}`
  );
  const data = await response.json();
  if (data.results && data.results.length > 0) {
    //console.log(data.results[0].urls.raw);
    
    return data.results[0].urls.small; 
  }
  return ""; // Si aucune image n'est trouvée, retournez une chaîne vide
};


// Fonction pour charger les itinéraires et marqueurs du jour actuel
const loadDayRouteAndMarkers = async () => {
  if (!map) return;

  const dayData = jsonData.jours.find((jour) => jour.day === currentDay.value);
  if (!dayData) return;

  // Nettoyer les couches existantes
  if (map.getLayer("route-line")) {
    map.removeLayer("route-line");
  }
  if (map.getLayer("route-case")) {
    map.removeLayer("route-case");
  }
  if (map.getLayer("route-start")) {
    map.removeLayer("route-start");
  }
  if (map.getSource("route")) {
    map.removeSource("route");
  }

  // Supprimer les anciens marqueurs
  currentMarkers.forEach((marker) => marker.remove());
  currentMarkers = [];

  // Ajouter les marqueurs
  dayData.points.forEach((point: any) => {

    getUnsplashImage(point.photoQuery).then((img) => {
  const popupContent = `
    <h3>${point.name}</h3>
    <img src="${img}" alt="${point.name}" style="width:100%;border-radius:8px;" />
    <p><strong>Heures :</strong> ${point.arrivalTime} - ${point.departureTime}</p>
    <p><strong>Description :</strong> ${point.description}</p>
  `;
  const marker = new maplibregl.Marker({ color: "teal" })
    .setLngLat(point.coordinates)
    .setPopup(new maplibregl.Popup().setHTML(popupContent))
    .addTo(map!);

  currentMarkers.push(marker); // Ajouter le marqueur à la liste
});
});

  // Requête pour l'itinéraire
  const coordinates = dayData.points.map((point: any) => point.coordinates).join(";");
  const response = await fetch(
    `https://api.jawg.io/routing/route/v1/car/${coordinates}?alternatives=false&geometries=geojson&overview=full&access-token=${accessToken}`
  ).then((res) => res.json());

  const route = response.routes[0];

  // Ajout des styles pour la route
  map.addSource("route", {
    type: "geojson",
    data: route.geometry,
  });

  map.addLayer({
    id: "route-line",
    type: "line",
    source: "route",
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": "#71108a",
      "line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 5, 3, 18, 8],
    },
  });

  map.addLayer({
    id: "route-case",
    type: "line",
    source: "route",
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 5, 2, 18, 3],
      "line-color": "#71108a",
      "line-gap-width": ["interpolate", ["exponential", 1.5], ["zoom"], 5, 3, 18, 8],
    },
  });

  map.addLayer({
    id: "route-start",
    type: "circle",
    source: {
      type: "geojson",
      data: {
        type: "MultiPoint",
        coordinates: [
          route.geometry.coordinates[0],
          route.geometry.coordinates[route.geometry.coordinates.length - 1],
        ],
      },
    },
    paint: {
      "circle-radius": ["interpolate", ["exponential", 1.5], ["zoom"], 5, 6, 18, 15],
      "circle-color": "#13BBFA",
      "circle-stroke-width": 3,
      "circle-stroke-color": "#4D93E3",
    },
  });

  // Ajuster la vue
  const bounds = new maplibregl.LngLatBounds();
  route.geometry.coordinates.forEach((coord: any) => bounds.extend(coord));
  map.fitBounds(bounds, { padding: 50, animate: true });
};

onMounted(() => {
  if (mapContainer.value) {
    map = new maplibregl.Map({
      container: mapContainer.value,
      style:
        "https://api.jawg.io/styles/jawg-streets.json?access-token=" +
        accessToken,
      center: [2.3522, 48.8566], // Coordonnées de Paris
      zoom: 12,
      maxZoom: 20,
      minZoom: 5,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      loading.value = false;
      loadDayRouteAndMarkers(); // Charger le jour initial
    });
  }
});
</script>

<template>
  <div>
    <!-- Boutons pour naviguer entre les jours -->
    <div class="navigation-buttons">
      <button @click="previousDay" :disabled="currentDay === 1">Jour précédent</button>
      <span>Jour {{ currentDay }}</span>
      <button @click="nextDay" :disabled="currentDay === jsonData.jours.length">Jour suivant</button>
    </div>

    <!-- Conteneur de la carte -->
    <div ref="mapContainer" class="map-container">
      <div v-if="loading" class="loading-overlay">Chargement de la carte...</div>
    </div>
  </div>
</template>

<style scoped>
.navigation-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
}

.navigation-buttons button {
  margin: 0 10px;
  padding: 8px 16px;
  background-color: #71108a;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.navigation-buttons button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.navigation-buttons span {
  font-size: 16px;
  font-weight: bold;
}

.map-container {
  width: 100%;
  height: 70vh;
  border-radius: 20px;
  background-color: #f0f0f0;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.loading-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  padding: 15px 20px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.2);
}
</style>
