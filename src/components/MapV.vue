<script setup lang="ts">
import { onMounted, ref, watch,computed } from "vue";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import jsonData from "../assets/data.json";

const mapContainer = ref<HTMLDivElement | null>(null);
const loading = ref(true);
const currentDay = ref(1); // Jour actuel

// Ajoutez ici la logique pour le mode
const mode = computed(() => {
  const dayData = jsonData.jours.find((jour) => jour.day === currentDay.value);
  return dayData?.routes?.mode || "walking"; // Par défaut, "walking" si non défini
});

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

  // Nettoyer les couches et les sources
  if (map.getLayer("route-line")) map.removeLayer("route-line");
  if (map.getSource("route")) map.removeSource("route");

  // Supprimer les anciens marqueurs
  currentMarkers.forEach((marker) => marker.remove());
  currentMarkers = [];

  // Charger les données pour le jour actuel
  const dayData = jsonData.jours.find((jour) => jour.day === currentDay.value);
  if (!dayData) {
    console.error("Aucune donnée pour le jour", currentDay.value);
    return;
  }

 
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

  // Charger et tracer l'itinéraire
  try {
    const coordinates = dayData.points.map((point) => point.coordinates).join(";");
    const response = await fetch(
      `https://api.jawg.io/routing/route/v1/${dayData.routes.mode}/${coordinates}?alternatives=false&geometries=geojson&overview=full&access-token=${accessToken}`
    );

    if (!response.ok) {
      console.error("Erreur lors du chargement de l'itinéraire", response.status);
      return;
    }

    const data = await response.json();
    const route = data.routes[0];
    if (!route || !route.geometry) {
      console.error("Aucun itinéraire valide trouvé");
      return;
    }

    // Ajouter la source et la couche pour l'itinéraire
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
        "line-color": dayData.routes.mode === "walking" ? "#71108a" : "#71108a",
        "line-width": 6,
        ...(dayData.routes.mode === "walking" && { "line-dasharray": [2, 2] }), // Ajoute uniquement pour les piétons
      },
    });

    // Ajuster la vue pour inclure tout l'itinéraire
    const bounds = new maplibregl.LngLatBounds();
    route.geometry.coordinates.forEach((coord:any) => bounds.extend(coord));
    map.fitBounds(bounds, { padding: 50 });
  } catch (error) {
    console.error("Erreur lors du tracé de l'itinéraire :", error);
  }
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
    <div class="mode-indicator">
      Mode actuel : <strong>{{ mode === "walking" ? "Piéton" : "Voiture" }}</strong>
    </div>
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
.mode-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 10px 0;
  padding: 10px 15px;
  background-color: #f8f9fa; 
  border: 2px solid #71108a; 
  border-radius: 8px; 
  font-size: 18px; 
  font-weight: bold; 
  color: #333; 
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.mode-indicator strong {
  color: #71108a; 
  font-weight: bold; 
}

</style>
