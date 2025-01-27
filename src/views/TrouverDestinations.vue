<template>
  <div class="container">
    <!-- Formulaire de recherche -->
    <div class="search-bar">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Rechercher une destination"
        class="search-input"
      />
      <button @click="searchDestinations" class="search-button">Rechercher</button>
    </div>

    <!-- Résultats de recherche -->
    <div class="results" v-if="searchResults.length > 0">
      <h3>Résultats :</h3>
      <ul class="results-list">
        <li v-for="destination in searchResults" :key="destination.id" class="result-item">
          <div class="destination-info">
            <span class="destination-name">{{ destination.name }}</span>
            <span class="destination-coordinates">[{{ destination.coordinates.join(", ") }}]</span>
          </div>
          <button @click="addDestination(destination)" class="add-button">Ajouter</button>
        </li>
      </ul>
    </div>

    <!-- Message si aucun résultat -->
    <div v-else class="no-results">
      <p>Aucun résultat pour cette recherche.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

// Données pour la recherche
const searchQuery = ref<string>(""); // Requête de recherche
const searchResults = ref<{ id: string; name: string; coordinates: [number, number] }[]>([]); // Résultats de recherche

// Clé API JawgMaps
const apiKey = "HfPSuO6CUKmBAHY0lfk4PVSaUHY9V7uex6zYgTjX1QKqK6zSnk0bEi9elG0Wo85N"; // Remplacez par votre clé API Jawg

// Fonction pour rechercher des destinations
const searchDestinations = async () => {
  if (!searchQuery.value.trim()) {
    alert("Veuillez entrer une destination !");
    return;
  }

  const endpoint = `https://api.jawg.io/places/v1/search?text=${encodeURIComponent(
    searchQuery.value
  )}&access-token=${apiKey}`;

  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des données");
    }

    const data = await response.json();

    // Mapper les résultats pour les afficher
    searchResults.value = data.features.map((feature: any) => ({
      id: feature.properties.id,
      name: feature.properties.label,
      coordinates: feature.geometry.coordinates,
    }));
  } catch (error) {
    console.error("Erreur lors de la recherche :", error);
    alert("Une erreur est survenue lors de la recherche des destinations.");
  }
};

// Fonction pour ajouter une destination
const addDestination = (destination: { id: string; name: string; coordinates: [number, number] }) => {
  console.log("Destination ajoutée :", destination);
  alert(`Destination ajoutée : ${destination.name}`);
};
</script>

<style scoped>
.container {
  padding: 20px;
  font-family: 'Roboto', sans-serif;
  max-width: 800px;
  margin: 0 auto;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.search-input {
  flex: 1;
  padding: 12px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 5px;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  border-color: #71108a;
  outline: none;
}

.search-button {
  padding: 12px 20px;
  background-color: #71108a;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
}

.search-button:hover {
  background-color: #57096a;
  transform: scale(1.05);
}

.results {
  margin-top: 20px;
}

.results h3 {
  color: #71108a;
  margin-bottom: 15px;
}

.results-list {
  list-style: none;
  padding: 0;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.result-item:hover {
  transform: translateY(-3px);
}

.destination-info {
  display: flex;
  flex-direction: column;
}

.destination-name {
  font-weight: bold;
  color: #333;
}

.destination-coordinates {
  font-size: 14px;
  color: #666;
}

.add-button {
  padding: 8px 15px;
  background-color: #34a853;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s, transform 0.2s;
}

.add-button:hover {
  background-color: #2c8c46;
  transform: scale(1.1);
}

.no-results {
  text-align: center;
  font-size: 16px;
  color: #999;
}
</style>
