<template>
  <div>
    <!-- Boutons pour naviguer entre les jours -->
    <div class="navigation-buttons">
      <button @click="previousDay" :disabled="currentDay === 1">Jour précédent</button>
      <span>Jour {{ currentDay }}</span>
      <button @click="nextDay" :disabled="currentDay === jsonData.jours.length">Jour suivant</button>
      <button @click="showAllRoutes" class="show-all">Afficher tous les itinéraires</button>
    </div>

    <!-- Conteneur de la carte -->
    <div ref="mapContainer" class="map-container">
      <div v-if="loading" class="loading-overlay">Chargement de la carte...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import jsonData from "../assets/data.json";

const mapContainer = ref<HTMLDivElement | null>(null);
const loading = ref(true);
const currentDay = ref(1); // Jour actuel

let map: maplibregl.Map | null = null;

// Fonction pour aller au jour suivant
const nextDay = () => {
  if (currentDay.value < jsonData.jours.length) {
    currentDay.value++;
  }
};

// Fonction pour aller au jour précédent
const previousDay = () => {
  if (currentDay.value > 1) {
    currentDay.value--;
  }
};

// Fonction pour afficher tous les itinéraires
const showAllRoutes = () => {
  if (!map) return;

  // Nettoyage des couches existantes
  jsonData.jours.forEach((jour) => {
    if (map?.getLayer(`route-${jour.day}`)) {
      map.removeLayer(`route-${jour.day}`);
    }
    if (map?.getSource(`route-${jour.day}`)) {
      map.removeSource(`route-${jour.day}`);
    }
  });

  // Ajouter les marqueurs et tracés de tous les jours
  jsonData.jours.forEach((jour) => {
    // Ajouter les markers
    jour.points.forEach((point: any) => {
      if (
        Array.isArray(point.coordinates) &&
        point.coordinates.length === 2 &&
        typeof point.coordinates[0] === "number" &&
        typeof point.coordinates[1] === "number"
      ) {
        new maplibregl.Marker()
          .setLngLat(point.coordinates)
          .setPopup(
            new maplibregl.Popup().setHTML(`
              <h3>${point.name}</h3>
              <img src="${point.photos[0]}" alt="${point.name}" style="width:100%; border-radius:8px;" />
              <p><strong>Heures :</strong> ${point.arrivalTime} - ${point.departureTime}</p>
              <p><strong>Description :</strong> ${point.description}</p>
            `)
          )
          .addTo(map!);
      }
    });

    // Ajouter les tracés
    map?.addSource(`route-${jour.day}`, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: jour.routes.path,
            },
            properties: {},
          },
        ],
      },
    });

    map?.addLayer({
      id: `route-${jour.day}`,
      type: "line",
      source: `route-${jour.day}`,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#00ff00", // Couleur verte pour les itinéraires combinés
        "line-width": 3,
      },
    });
  });
};

onMounted(() => {
  if (mapContainer.value) {
    map = new maplibregl.Map({
      container: mapContainer.value,
      style:
        "https://api.jawg.io/styles/jawg-streets.json?access-token=HfPSuO6CUKmBAHY0lfk4PVSaUHY9V7uex6zYgTjX1QKqK6zSnk0bEi9elG0Wo85N",
      center: [2.3522, 48.8566], // Coordonnées de Paris
      zoom: 12,
      maxZoom: 20,
      minZoom: 5,
    });

    map.on("load", () => {
      loading.value = false;

      // Observer le jour actuel et mettre à jour la carte
      watch(
        currentDay,
        (newDay) => {
          const dayData = jsonData.jours.find((jour) => jour.day === newDay);
          if (!dayData) return;

          // Supprimer les anciennes couches et sources
          if (map?.getLayer("route")) {
            map.removeLayer("route");
          }
          if (map?.getSource("route")) {
            map.removeSource("route");
          }

          // Ajouter les markers
          dayData.points.forEach((point: any) => {
            new maplibregl.Marker()
              .setLngLat(point.coordinates)
              .setPopup(
                new maplibregl.Popup().setHTML(`
                  <h3>${point.name}</h3>
                  <img src="${point.photos[0]}" alt="${point.name}" style="width:100%; border-radius:8px;" />
                  <p><strong>Heures :</strong> ${point.arrivalTime} - ${point.departureTime}</p>
                  <p><strong>Description :</strong> ${point.description}</p>
                `)
              )
              .addTo(map!);
          });

          // Ajouter le tracé
          map?.addSource("route", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  geometry: {
                    type: "LineString",
                    coordinates: dayData.routes.path,
                  },
                  properties: {},
                },
              ],
            },
          });

          map?.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#ff0000", // Couleur rouge pour l'itinéraire du jour
              "line-width": 4,
            },
          });
        },
        { immediate: true }
      );
    });
  }
});
</script>

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
  background-color: #007bff;
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

.navigation-buttons .show-all {
  margin-left: 10px;
  background-color: #28a745;
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
