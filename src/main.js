import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { registerPwa } from "./services/pwa.js";
import "./style.css";

createApp(App).use(createPinia()).mount("#app");
registerPwa();
