<script setup lang="ts">
import { ref } from "vue";
import { RouterView } from 'vue-router';
import voyagesData from "./assets/data.json"; // Importer les données des voyages

const voyages = ref(voyagesData.voyages); // Liste des voyages
const selectedVoyage = ref<string | null>(null); // ID du voyage sélectionné
const isAccordionOpen = ref(false); // État de l'accordéon

const selectedVoyageChanged = ref(false); // Pour informer le composant enfant

// Fonction pour gérer l'état de l'accordéon
const toggleAccordion = () => {
  isAccordionOpen.value = !isAccordionOpen.value;
};

// Fonction pour sélectionner un voyage
const selectVoyage = (voyageId: string) => {
  selectedVoyage.value = voyageId; // Met à jour l'ID du voyage sélectionné
  isAccordionOpen.value = false; // Ferme l'accordéon après la sélection
  selectedVoyageChanged.value = true; // Indique un changement de voyage
};
</script>

<template>
  <div class="container-fluid">
    <div class="row min-height-600">
      <!-- Barre latérale -->
      <nav id="sidebar" class="col-md-3 col-lg-2 bg-light sidebar">
        <div class="menu-header text-center py-3">
          <h4>Itinéraire de Voyage</h4>
          <small class="form-text text-light" style="font-weight: bold;">By Mohamed Ali</small>
        </div>
        <hr />
        <div class="position-sticky">
        <ul class="nav flex-column">
          <li class="nav-item">
              <button class="nav-link accordion-button" @click="toggleAccordion">
                <router-link to="/" class="" active-class="active" style="text-decoration: none;">
                  <font-awesome-icon icon="map-marked-alt" /> Planifier un voyage
                </router-link>
              <span v-if="isAccordionOpen">▲</span>
              <span v-else>▼</span>
            </button>
            <div v-if="isAccordionOpen" class="accordion-content">
              <ul class="nav flex-column">
                <li
                  v-for="voyage in voyages"
                  :key="voyage.id"
                  class="nav-item"
                  :class="{ active: selectedVoyage === voyage.id }"
                >
                  <button
                    class="nav-link voyage-button"
                    @click="selectVoyage(voyage.id)"
                  >
                    {{ voyage.name }}
                  </button>
                </li>
              </ul>
            </div>
          </li>
          <li class="nav-item">
            <router-link to="/destinations" class="nav-link" active-class="active">
              <font-awesome-icon icon="search-location" /> Trouver des destinations
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/parametres" class="nav-link" active-class="active">
              <font-awesome-icon icon="cogs" /> Paramètres
            </router-link>
          </li>
          </ul>
        </div>
      </nav>

      <!-- Contenu principal -->
      <main class="col-md-9 col-lg-10 ms-sm-auto px-md-4 map-container">
        <div class="map-header card-header text-center mb-3">
          <h5>Carte Interactive</h5>
        </div>
        <div class="map-content">
         <!-- Passez l'information sur le voyage sélectionné -->
         <RouterView
           :voyage-id="selectedVoyage"
           :selected-voyage-changed="selectedVoyageChanged"
           @reset-selected-changed="selectedVoyageChanged = false"
         />
        </div>
      </main>
    </div>
  </div>
</template>


<style scoped>
/* Conteneur principal */
.container-fluid {
  margin: 0;
  padding: 0;
  width: 100%;
}

.row {
  display: flex;
  min-height: 100vh;
}

/* Barre latérale */
.sidebar {
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  overflow-y: auto;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  background-color: #f8f9fa;
  padding: 20px 10px;
  transition: all 0.3s ease;
}

.menu-header {
  margin-bottom: 10px;
  background-color: #3411b4;
  color: white;
  padding: 15px;
  border-radius: 5px;
}

.sidebar .nav-link {
  padding: 10px 15px;
  font-size: 16px;
  color: #333;
  text-decoration: none;
  transition: background-color 0.3s, color 0.3s;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  
}

.sidebar .nav-link i {
  margin-right: 10px;
  font-size: 18px;
}

.sidebar .nav-link:hover,
.sidebar .nav-link.active {
  background-color: #7C32F0;
  color: #fff;
  border-radius: 5px;
  padding: 10px;
}


/* Accordéon */
.accordion-button {
  background: none;
  border: none;
  outline: none;
  cursor: pointer;
  text-align: left;
  width: 100%;
  color: inherit;
}

.accordion-content {
  margin-left: 10px;
  border-left: 2px solid #71108a;
  padding-left: 10px;
}

.voyage-button {
  background: none;
  border: none;
  color: #333;
  cursor: pointer;
  text-align: left;
  padding: 8px 15px;
  border-radius: 5px;
  transition: background-color 0.3s;
}

.voyage-button:hover,
.voyage-button.active {
  background-color: #7C32F0;
  color: white;
}


/* Partie carte */
.map-container {

 /* margin-left: 16.7%; /* Correspond à la largeur de la barre latérale */
  padding: 20px;
  width: 1500px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-color: #ffffff;
  border-radius: 10px;
  transition: all 0.3s ease-in-out;
}

.map-header {
  background-color: #3411b4;
  color: #fff;
  padding: 15px;
  border-radius: 5px;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
}

.map-content {
  flex-grow: 1;
  background-color: #e9ecef;
  border-radius: 10px;
  padding: 0px;
  margin: 10px 0;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
}

.map-content > * {
  height: 100%;
  width: 100%;
}

.card-footer {
  background-color: #3411b4;
  color: white;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
}
@media (max-width: 768px) {
  .sidebar {
    position: relative;
    height: auto;
    width: 100%;
    margin-bottom: 20px;
  }

  .map-container {
    margin-left: 0;
    width: 100%;
  }
}

</style>
