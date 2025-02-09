<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Voyage } from '../types' // Importer le type

//import jsonData from "../assets/data.json"; // Charger les données JSON

// Props pour recevoir l'ID du voyage
const props = defineProps({
  voyageId: String, // ID du voyage sélectionné
})

const mapContainer = ref<HTMLDivElement | null>(null)
const loading = ref(true)
const currentDay = ref(1) // Jour actuel
let map: maplibregl.Map | null = null
let currentMarkers: maplibregl.Marker[] = []
const dynamicDuration = ref<string>('') // Durée dynamique récupérée via l'API

const searchQuery = ref<string>('') // Texte saisi dans la barre de recherche
const geocodeResult = ref<any | null>(null) // Résultat de géocodage
const voyages = ref<Voyage[]>([])

// Ajoutez votre access token pour la Jawg API
const accessToken = 'HfPSuO6CUKmBAHY0lfk4PVSaUHY9V7uex6zYgTjX1QKqK6zSnk0bEi9elG0Wo85N'

// Charger les données de l'API avec `fetch`
const fetchVoyages = async () => {
  try {
    loading.value = true // Déjà déclaré avant, donc on met juste à true
    const response = await fetch('http://localhost:8080/voyages') // Remplace par ton URL d'API
    if (!response.ok) {
      throw new Error(`Erreur HTTP : ${response.status}`)
    }
    voyages.value = await response.json()
    console.log("Données chargées depuis l'API :", voyages.value)
  } catch (error) {
    console.error('Erreur lors de la récupération des voyages :', error)
  } finally {
    loading.value = false
  }
}

// Trouver le voyage correspondant à l'ID
const voyage = computed(() => voyages.value.find((v: Voyage) => v.id === props.voyageId))

// Récupérer les jours du voyage sélectionné
const days = computed(() => (voyage.value ? voyage.value.jours : []))

// Ajoutez ici la logique pour le mode
const mode = computed(() => {
  const dayData = days.value.find((jour) => jour.day === currentDay.value)
  return dayData?.mode || 'walking' // Par défaut, "walking" si non défini
})

// Fonction pour aller au jour suivant
const nextDay = () => {
  if (currentDay.value < days.value.length) {
    currentDay.value++
    loadDayRouteAndMarkers()
  }
}

// Fonction pour aller au jour précédent
const previousDay = () => {
  if (currentDay.value > 1) {
    currentDay.value--
    loadDayRouteAndMarkers()
  }
}

// Fonction pour récupérer une image depuis l'API Unsplash en fonction de `photoQuery`
const getUnsplashImage = async (query: string): Promise<string> => {
  const unsplashAccessKey = 'rYh6qhedSiJ0-t0rmVGyq1zoU-5bbTFkIcNSTHVS4CQ'
  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${unsplashAccessKey}`,
  )
  const data = await response.json()
  if (data.results && data.results.length > 0) {
    return data.results[0].urls.small
  }
  return ''
}

const cachedDurations = ref<Record<string, string>>({}) // Cache pour stocker les durées
// Fonction pour récupérer la durée totale depuis Jawg API
const fetchDurationFromJawg = async (coordinates: string) => {
  try {
    const response = await fetch(
      `https://api.jawg.io/routing/route/v1/${mode.value}/${coordinates}?alternatives=false&geometries=geojson&overview=full&access-token=${accessToken}`,
    )
    if (response.ok) {
      const data = await response.json()
      console.log(data)

      const distanceInMeters = data.routes[0]?.distance // Distance totale en mètres
      const distanceInKm = distanceInMeters / 1000 // Convertir en km

      if (distanceInKm > 25) {
        console.warn(`L'itinéraire dépasse la limite de 25 km (${distanceInKm.toFixed(2)} km)`)
        alert(`Attention : L'itinéraire dépasse 25 km (${distanceInKm.toFixed(2)} km).`)
        return // Stoppe l'affichage de l'itinéraire
      }

      const durationInSeconds = data.routes[0]?.duration // Durée en secondes
      const hours = Math.floor(durationInSeconds / 3600)
      const minutes = Math.floor((durationInSeconds % 3600) / 60)
      const durationString = `${hours} h ${minutes} min`
      cachedDurations.value[coordinates] = durationString // Mettre en cache
      dynamicDuration.value = durationString
    } else {
      console.error('Erreur lors de la récupération de la durée depuis Jawg')
      dynamicDuration.value = 'Indisponible'
    }
  } catch (error) {
    console.error('Erreur lors de la requête à Jawg:', error)
    dynamicDuration.value = 'Indisponible'
  }
}

const suggestions = ref<any[]>([]) // Suggestions de lieux

const searchLocation = async () => {
  if (!searchQuery.value.trim()) return

  try {
    const response = await fetch(
      `https://api.jawg.io/places/v1/autocomplete?text=${encodeURIComponent(
        searchQuery.value,
      )}&access-token=${accessToken}`,
    )

    if (response.ok) {
      const data = await response.json()
      suggestions.value = data.features.map((feature: any) => ({
        name: feature.properties.label,
        coordinates: feature.geometry.coordinates,
      }))
    } else {
      console.error("Erreur lors de la recherche de l'emplacement.")
      suggestions.value = []
    }
  } catch (error) {
    console.error('Erreur de géocodage :', error)
    suggestions.value = []
  }
}

const zoomToLocation = (coordinates: [number, number]) => {
  map!.flyTo({
    center: coordinates,
    zoom: 16,
    speed: 1.2,
    curve: 1.4,
  })
  suggestions.value = [] // Masquer les suggestions après sélection
}

// Fonction pour charger les itinéraires et marqueurs du jour actuel
const loadDayRouteAndMarkers = async () => {
  if (!map || !voyage.value) return

  // Nettoyer les couches et les sources
  if (map.getLayer('route-line')) map.removeLayer('route-line')
  if (map.getSource('route')) map.removeSource('route')

  // Supprimer les anciens marqueurs
  currentMarkers.forEach((marker) => marker.remove())
  currentMarkers = []

  // Charger les données pour le jour actuel
  const dayData = days.value.find((jour) => jour.day === currentDay.value)
  if (!dayData) {
    console.error('Aucune donnée pour le jour', currentDay.value)
    return
  }

  // Ajouter les marqueurs
  dayData.points.forEach((point: any) => {
    getUnsplashImage(point.photoQuery).then((img) => {
      const popupContent = `
        <h3>${point.name}</h3>
        <img src="${img}" alt="${point.name}" style="width:100%;border-radius:8px;" />
        <p><strong>Heures :</strong> ${point.arrivalTime} - ${point.departureTime}</p>
        <p><strong>Description :</strong> ${point.description}</p>
      `
      const marker = new maplibregl.Marker({ color: 'teal' })
        .setLngLat(point.coordinates)
        .setPopup(new maplibregl.Popup().setHTML(popupContent))
        .addTo(map!)

      currentMarkers.push(marker) // Ajouter le marqueur à la liste
    })
  })
  console.log(dayData.mode)

  // Charger et tracer l'itinéraire
  try {
    const coordinates = dayData.points.map((point) => point.coordinates).join(';')
    const response = await fetch(
      `https://api.jawg.io/routing/route/v1/${dayData.mode}/${coordinates}?alternatives=false&geometries=geojson&overview=full&access-token=${accessToken}`,
    )

    if (!response.ok) {
      console.error("Erreur lors du chargement de l'itinéraire", response.status)
      return
    }

    const data = await response.json()
    const route = data.routes[0]
    if (!route || !route.geometry) {
      console.error('Aucun itinéraire valide trouvé')
      return
    }

    // Ajouter la source et la couche pour l'itinéraire
    map.addSource('route', {
      type: 'geojson',
      data: route.geometry,
    })

    map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': dayData.mode === 'walking' ? '#71108a' : '#71108a',
        'line-width': 6,
        ...(dayData.mode === 'walking' && { 'line-dasharray': [2, 2] }),
      },
    })

    // Récupérer la durée totale depuis Jawg API
    await fetchDurationFromJawg(coordinates)

    // Ajuster la vue pour inclure tout l'itinéraire
    const bounds = new maplibregl.LngLatBounds()
    route.geometry.coordinates.forEach((coord: any) => bounds.extend(coord))
    map.fitBounds(bounds, { padding: 50 })
  } catch (error) {
    console.error("Erreur lors du tracé de l'itinéraire :", error)
  }
}

// Charger les données lorsque la carte est montée ou que le voyageId change
onMounted(() => {
  ;(async () => {
    await fetchVoyages() // Charger les voyages depuis l'API
    if (mapContainer.value) {
      map = new maplibregl.Map({
        container: mapContainer.value,
        style: `https://api.jawg.io/styles/jawg-streets.json?access-token=${accessToken}`,
        center: [2.3522, 48.8566],
        zoom: 12,
        maxZoom: 20,
        minZoom: 5,
      })

      map.addControl(new maplibregl.NavigationControl(), 'top-right')

      map.on('load', () => {
        loading.value = false
        loadDayRouteAndMarkers() // Charger les itinéraires et marqueurs
      })
    }
  })()
})

watch(
  () => props.voyageId,
  () => {
    loadDayRouteAndMarkers() // Recharger les données si l'ID de voyage change
  },
)
</script>

<template>
  <div>
    <div class="mode-indicator">
      Mode actuel : <strong>{{ mode === 'walking' ? 'Piéton' : 'Voiture' }}</strong>
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
    <div class="search-container">
      <div class="search-input">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Recherchez un lieu"
          @input="searchLocation"
        />
        <button>
          <i class="fa fa-search"></i>
        </button>
      </div>
      <ul class="suggestions-list" v-if="suggestions.length > 0">
        <li
          v-for="(suggestion, index) in suggestions"
          :key="index"
          @click="zoomToLocation(suggestion.coordinates)"
        >
          {{ suggestion.name }}
        </li>
      </ul>
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

/* Conteneur de la recherche */
.search-container {
  position: relative;
  max-width: 400px;
  /* margin: 20px auto;*/
  z-index: 1000;
}

/* Barre de recherche */
.search-input {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 30px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  background-color: #fff;
}

.search-input input {
  flex: 1;
  padding: 10px 15px;
  border: none;
  outline: none;
  font-size: 16px;
  color: #333;
}

.search-input button {
  background-color: #71108a;
  border: none;
  padding: 10px 15px;
  color: #fff;
  cursor: pointer;
  border-radius: 0 30px 30px 0;
  transition: background-color 0.3s ease;
}

.search-input button:hover {
  background-color: #5c0b6b;
}

.search-input button i {
  font-size: 18px;
}

/* Liste des suggestions */
.suggestions-list {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  margin-top: 5px;
  max-height: 300px;
  overflow-y: auto;
  list-style: none;
  padding: 0;
  z-index: 2000;
}

.suggestions-list li {
  padding: 12px 15px;
  cursor: pointer;
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
  font-size: 14px;
  border-bottom: 1px solid #eee;
}

.suggestions-list li:hover {
  background-color: #f5f5f5;
  color: #71108a;
}

.suggestions-list li:last-child {
  border-bottom: none;
}
</style>
