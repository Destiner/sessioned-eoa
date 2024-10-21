import type { RouterConfig } from '@nuxt/schema';

import Home from '@/pages/Home.vue';

export default <RouterConfig>{
  routes: (_routes) => [
    {
      name: 'home',
      path: '/',
      component: Home,
    },
  ],
};
