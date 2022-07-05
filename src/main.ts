import { createApp } from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import PrimeVue from "primevue/config";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Textarea from "primevue/textarea";
import RadioButton from "primevue/radiobutton";
import SelectButton from "primevue/selectbutton";
import Dropdown from "primevue/dropdown";
import Slider from "primevue/slider";
import Tooltip from "primevue/tooltip";
import Chart from "primevue/chart";
import mitt from "mitt";

import "primeicons/primeicons.css";
import "primevue/resources/primevue.min.css";
import "primeflex/primeflex.min.css";
import "primevue/resources/themes/tailwind-light/theme.css";

const emitter = mitt();
const app = createApp(App);
app.config.globalProperties.emitter = emitter;

app.use(PrimeVue);
app.component("Button", Button);
app.component("InputText", InputText);
app.component("Textarea", Textarea);
app.component("RadioButton", RadioButton);
app.component("SelectButton", SelectButton);
app.component("Dropdown", Dropdown);
app.component("Slider", Slider);
app.directive("tooltip", Tooltip);
app.component("Chart", Chart);

app.mount("#psychometric-widget");
