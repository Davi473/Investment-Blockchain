import { createRouter, createWebHistory } from 'vue-router'

// 1. Definições de Componentes
// Você pode importar diretamente (eager loading) ou usar lazy loading abaixo.
// import LoginView from '../views/LoginView.vue' 
// import RegisterView from '../views/RegisterView.vue' 
// import AboutView from '../views/AboutView.vue'

// 2. Defina o array de rotas (Routes)
const routes = [
  {
    path: '/', // O caminho no URL
    name: 'Login', // Um nome para referenciar a rota
    // CORRIGIDO: Usando o caminho relativo (../) para o lazy loading, 
    // garantindo que o componente seja encontrado.
    component: () => import('../views/LoginView.vue') 
  },
  // Adicionando a rota 'Register' referenciada no LoginView
//   {
//     path: '/register',
//     name: 'Register',
//     // Usando lazy loading para o componente RegisterView
//     component: () => import('../views/RegisterView.vue') 
//   },
  //   {
  //     path: '/sobre',
  //     name: 'Sobre',
  //     component: SobreView
  //   },
]

// 3. Cria o objeto router
const router = createRouter({
  // Cria o histórico de navegação no modo HTML5
  history: createWebHistory("/"), 
  routes
})

export default router