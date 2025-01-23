import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';


// Import Font Awesome
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

// Import des icônes nécessaires
import { faMapMarkedAlt, faSearchLocation, faCogs } from '@fortawesome/free-solid-svg-icons';

// Ajouter les icônes à la bibliothèque
library.add(faMapMarkedAlt, faSearchLocation, faCogs);

const app = createApp(App)


// Enregistrer le composant FontAwesome
app.component('font-awesome-icon', FontAwesomeIcon);

app.use(router)

app.mount('#app')
