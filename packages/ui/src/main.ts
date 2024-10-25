import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { WagmiPlugin } from '@wagmi/vue';
import { createApp } from 'vue';
import { createWebHistory, createRouter } from 'vue-router';

import Home from '@/pages/Home.vue';

import App from './App.vue';
import { config } from './wagmi';

const routerHistory = createWebHistory();
const router = createRouter({
  history: routerHistory,
  routes: [{ path: '/', component: Home }],
});

const queryClient = new QueryClient();

const app = createApp(App);

app.use(router);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
app.use(WagmiPlugin, { config });
app.use(VueQueryPlugin, { queryClient });

app.mount('#app');

export { routerHistory, router };
