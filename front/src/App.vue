<script setup lang="ts">
import { RouterView } from 'vue-router'
// O App.vue não precisa de muita lógica além de importar a RouterView
// e talvez um componente de navegação (RouterLink, se houver outras rotas).
</script>

<template>
  <!-- 
    App.vue é o componente raiz da sua aplicação.
    Ele define o layout principal, cabeçalhos, rodapés, etc. 
  -->
  <div id="app-container" class="min-vh-100 bg-dark">
    <!-- 
      O componente RouterView é o ÚNICO lugar onde o Vue Router
      renderiza o componente da rota ativa (neste caso, o LoginView).
      Se ele estiver faltando, nenhuma rota será exibida!
    -->
    <RouterView />
  </div>
</template>

<style scoped>
/* Estilos globais ou para o container principal aqui. 
   Usando min-vh-100 para garantir que o container ocupe toda a altura da tela.
*/
</style>