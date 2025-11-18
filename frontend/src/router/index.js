import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { guest: true },
  },
  {
    path: '/profiles',
    name: 'Profiles',
    component: () => import('@/views/Profiles.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/browse',
    name: 'Browse',
    component: () => import('@/views/Browse.vue'),
    meta: { requiresAuth: true, requiresProfile: true },
  },
  {
    path: '/watch/:id',
    name: 'Watch',
    component: () => import('@/views/Watch.vue'),
    meta: { requiresAuth: true, requiresProfile: true },
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/Search.vue'),
    meta: { requiresAuth: true, requiresProfile: true },
  },
  {
    path: '/account',
    name: 'Account',
    component: () => import('@/views/Account.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/Admin.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'Login' });
  }

  // Check if route requires profile selection
  if (to.meta.requiresProfile && !authStore.currentProfile) {
    return next({ name: 'Profiles' });
  }

  // Check if route requires admin
  if (to.meta.requiresAdmin && !authStore.user?.isAdmin) {
    return next({ name: 'Browse' });
  }

  // Redirect authenticated users away from guest pages
  if (to.meta.guest && authStore.isAuthenticated) {
    return next({ name: 'Home' });
  }

  next();
});

export default router;
