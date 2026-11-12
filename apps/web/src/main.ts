import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './app/App.vue';
import { router } from './app/router';
import { useSessionStore } from './features/auth';
import { useTheme } from './shared';
import './style.css';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

useTheme();
const session = useSessionStore(pinia);

// Sesi berakhir di tengah jalan (refresh gagal) → kembali ke halaman masuk.
session.$subscribe((_m, state) => {
  if (state.status === 'anonymous' && router.currentRoute.value.meta.requiresAuth) {
    void router.replace({ name: 'login' });
  }
});

app.use(router);
app.mount('#app');
