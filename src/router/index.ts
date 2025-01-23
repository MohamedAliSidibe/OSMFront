import MapV from '@/components/MapV.vue'
import Parametres from '@/views/Parametres.vue'
import TrouverDestinations from '@/views/TrouverDestinations.vue'
import { createRouter, createWebHistory } from 'vue-router'
//import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: MapV,
    },
    { path: '/destinations', name: 'TrouverDestinations', component: TrouverDestinations},
    { path: '/parametres', name: 'Parametres', component: Parametres},
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
  ],
})

export default router
