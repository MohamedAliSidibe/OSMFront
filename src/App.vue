<template>
  <div class="container-fluid">
    <!-- Contenu principal avec barre latérale -->
    <div class="row min-height-600">
      <!-- Barre latérale -->
      <nav id="sidebar" class="col-md-3 col-lg-2 bg-light sidebar">
        <!-- En-tête du menu -->
        <div class="menu-header text-center py-3">
          <h4>Itinéraire de Voyage</h4>
          <small class="form-text text-light" style="font-weight: bold;">By Mohamed Ali</small>
        </div>
        <hr />
        <!-- Navigation -->
        <div class="position-sticky">
          <ul class="nav flex-column">
            <li class="nav-item">
              <a class="nav-link active" href="#">
                <i class="fas fa-map-marked-alt"></i> Planifier un voyage
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#">
                <i class="fas fa-search-location"></i> Trouver des destinations
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#">
                <i class="fas fa-cogs"></i> Paramètres
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Contenu principal (Carte) -->
      <main class="col-md-9 col-lg-10 ms-sm-auto px-md-4 map-container">
        <!-- Section Carte -->
        <div class="map-header card-header text-center mb-3">
          <h5>Carte Interactive</h5>
        </div>
        <div class="map-content">
          <MapV />
        </div>
        <!-- Footer -->
        <footer class="card-footer text-center mt-3">
          <p>© 2025 - Application de Voyage</p>
        </footer>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import MapV from './components/MapV.vue';
</script>

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
