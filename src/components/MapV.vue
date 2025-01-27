<script setup lang="ts">
import { onMounted, ref, watch, computed } from "vue";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import jsonData from "../assets/data.json"; // Charger les données JSON

// Props pour recevoir l'ID du voyage
const props = defineProps({
  voyageId: String, // ID du voyage sélectionné
});

const mapContainer = ref<HTMLDivElement | null>(null);
const loading = ref(true);
const currentDay = ref(1); // Jour actuel
let map: maplibregl.Map | null = null;
let currentMarkers: maplibregl.Marker[] = [];
const dynamicDuration = ref<string>(""); // Durée dynamique récupérée via l'API


// Ajoutez votre access token pour la Jawg API
const accessToken = "HfPSuO6CUKmBAHY0lfk4PVSaUHY9V7uex6zYgTjX1QKqK6zSnk0bEi9elG0Wo85N";

// Trouver le voyage correspondant à l'ID
const voyage = computed(() =>
  jsonData.voyages.find((v) => v.id === props.voyageId)
);

// Récupérer les jours du voyage sélectionné
const days = computed(() => (voyage.value ? voyage.value.jours : []));

// Ajoutez ici la logique pour le mode
const mode = computed(() => {
  const dayData = days.value.find((jour) => jour.day === currentDay.value);
  return dayData?.routes?.mode || "walking"; // Par défaut, "walking" si non défini
});


// Fonction pour aller au jour suivant
const nextDay = () => {
  if (currentDay.value < days.value.length) {
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
  const unsplashAccessKey = "rYh6qhedSiJ0-t0rmVGyq1zoU-5bbTFkIcNSTHVS4CQ";
  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${unsplashAccessKey}`
  );
  const data = await response.json();
  if (data.results && data.results.length > 0) {
    return data.results[0].urls.small;
  }
  return "";
};

const cachedDurations = ref<Record<string, string>>({}); // Cache pour stocker les durées
// Fonction pour récupérer la durée totale depuis Jawg API
const fetchDurationFromJawg = async (coordinates: string) => {
  try {    
    const response = await fetch(
      `https://api.jawg.io/routing/route/v1/${mode.value}/${coordinates}?alternatives=false&geometries=geojson&overview=full&access-token=${accessToken}`
    );
    if (response.ok) {
      const data = await response.json();
      console.log(data);
      const durationInSeconds = data.routes[0]?.duration; // Durée en secondes      
      const hours = Math.floor(durationInSeconds / 3600);
      const minutes = Math.floor((durationInSeconds % 3600) / 60);
      const durationString = `${hours} h ${minutes} min`;
      cachedDurations.value[coordinates] = durationString; // Mettre en cache
      dynamicDuration.value = durationString;
    } else {
      console.error("Erreur lors de la récupération de la durée depuis Jawg");
      dynamicDuration.value = "Indisponible";
    }
  } catch (error) {
    console.error("Erreur lors de la requête à Jawg:", error);
    dynamicDuration.value = "Indisponible";
  }
};



// Fonction pour charger les itinéraires et marqueurs du jour actuel
const loadDayRouteAndMarkers = async () => {
  if (!map || !voyage.value) return;

  // Nettoyer les couches et les sources
  if (map.getLayer("route-line")) map.removeLayer("route-line");
  if (map.getSource("route")) map.removeSource("route");

  // Supprimer les anciens marqueurs
  currentMarkers.forEach((marker) => marker.remove());
  currentMarkers = [];

  // Charger les données pour le jour actuel
  const dayData = days.value.find((jour) => jour.day === currentDay.value);
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
        ...(dayData.routes.mode === "walking" && { "line-dasharray": [2, 2] }),
      },
    });

      // Récupérer la durée totale depuis Jawg API
      await fetchDurationFromJawg(coordinates);


    // Ajuster la vue pour inclure tout l'itinéraire
    const bounds = new maplibregl.LngLatBounds();
    route.geometry.coordinates.forEach((coord: any) => bounds.extend(coord));
    map.fitBounds(bounds, { padding: 50 });
  } catch (error) {
    console.error("Erreur lors du tracé de l'itinéraire :", error);
  }
};

// Charger les données lorsque la carte est montée ou que le voyageId change
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

watch(
  () => props.voyageId,
  () => {
    loadDayRouteAndMarkers(); // Recharger les données si l'ID de voyage change
  }
);
</script>

<template>
  <div>
    <div class="mode-indicator">
      Mode actuel : <strong>{{ mode === "walking" ? "Piéton" : "Voiture" }}</strong>
    </div>
    <div class="duration-indicator">
      Durée totale du jour : <strong>{{ dynamicDuration }}</strong>
    </div>
    <!-- Boutons pour naviguer entre les jours -->
    <div class="navigation-buttons">
      <button @click="previousDay" :disabled="currentDay === 1">Jour précédent</button>
      <span>Jour {{ currentDay }}</span>
      <button @click="nextDay" :disabled="currentDay === days.length">Jour suivant</button>
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

.duration-indicator {
  text-align: center;
  margin: 10px 0;
  font-size: 16px;
  font-weight: bold;
}
</style>
