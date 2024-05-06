import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
  },
  {
    path: '/room/:id',
    name: 'Room',
    component: () => import('../views/RoomView.vue'),
  },
  {
    path: '/game/:id',
    name: 'Game',
    component: () => import('../modules/game/GameView.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
