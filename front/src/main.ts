import { createApp } from 'vue'
import App from './App.vue'
import { AccountGatewayHttp } from './AccountGateway';
import router from './router';

// 1. Importe os arquivos CSS do Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'

// 2. CORREÇÃO: Importe a função 'createBootstrap'
// O plugin não é exportado como default nem com o nome da biblioteca, mas sim como 'createBootstrap'
import { createBootstrap } from 'bootstrap-vue-next' // 👈 Importação corrigida
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css' 

const app = createApp(App);

app.use(router);

// 3. Use a função 'createBootstrap' para instalar o plugin
// Você chama a função e passa o resultado (o plugin) para app.use()
app.use(createBootstrap()); // 👈 Uso corrigido

app.provide("accountGateway", new AccountGatewayHttp());

app.mount('#app')