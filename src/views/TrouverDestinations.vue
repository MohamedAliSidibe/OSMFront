<script setup lang="ts">
import { ref } from "vue";

// Données pour la recherche
const searchQuery = ref<string>(""); // Requête de recherche
const searchResults = ref<{ id: string; name: string; coordinates: [number, number] }[]>([]); // Résultats de recherche

// Fonction pour rechercher des destinations via l'API JawgMaps
const searchDestinations = async () => {
  if (!searchQuery.value.trim()) {
    alert("Veuillez entrer une destination !");
    return;
  }

  const apiKey = "HfPSuO6CUKmBAHY0lfk4PVSaUHY9V7uex6zYgTjX1QKqK6zSnk0bEi9elG0Wo85N" // Remplacez par votre clé API Jawg
  const endpoint = `https://api.jawg.io/places/v1/search?q=${encodeURIComponent(
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

// Fonction pour ajouter une destination (action au clic)
const addDestination = (destination: { id: string; name: string; coordinates: [number, number] }) => {
  console.log("Destination ajoutée :", destination);
  alert(`Destination ajoutée : ${destination.name}`);
};
</script>

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
          <span>{{ destination.name }} - {{ destination.coordinates.join(", ") }}</span>
          <button @click="addDestination(destination)" class="add-button">Ajouter</button>
        </li>
      </ul>
    </div>

    <!-- Message si aucun résultat -->
    <div v-else>
      <p>Aucun résultat pour cette recherche.</p>
    </div>
  </div>
</template>

<style scoped>
.container {
  padding: 20px;
  font-family: Arial, sans-serif;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.search-button {
  padding: 10px 20px;
  background-color: #71108a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.search-button:hover {
  background-color: #57096a;
}

.results {
  margin-top: 20px;
}

.results-list {
  list-style-type: none;
  padding: 0;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #ddd;
}

.result-item:last-child {
  border-bottom: none;
}

.add-button {
  padding: 5px 10px;
  background-color: #34a853;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.add-button:hover {
  background-color: #2c8c46;
}
</style>
