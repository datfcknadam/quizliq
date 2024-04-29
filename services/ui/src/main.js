import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import { Quasar } from 'quasar';
import quasarUserOptions from './quasar-user-options';
import i18n from './i18n';

createApp(App)
  .use(i18n)
  .use(Quasar, quasarUserOptions)
  .use(createPinia())
  .use(router)
  .mount('#app');
