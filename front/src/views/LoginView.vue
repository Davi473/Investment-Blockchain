<!-- ========================== -->
<!-- ========== VIEW ========== -->
<!-- ========================== -->

<template>
    <div class="d-flex justify-content-center align-items-center vh-100 bg-dark">
        <div class="d-flex flex-column gap-3 text-white text-center">
            <h1 class="fw-bold" id="login">Login</h1>

            <div class="d-flex flex-column gap-3">

                <!-- Componente Input para Senha -->
                <InputComponent label="Email" type="email" placeholder="Digite seu e-email" v-model="email"
                    :error="enterEmail" @update:modelValue="clearMessages" />

                <!-- Componente Input para Senha -->
                <InputComponent label="Senha" type="password" placeholder="Digite sua senha" v-model="password"
                    :error="enterPassword" @update:modelValue="clearMessages" />

                <!-- Mensagem de Erro Geral/API -->
                <div v-if="message" class="text-center">
                    <div class="alert alert-danger p-2" role="alert">
                        <small class="fw-bold">{{ message }}</small>
                    </div>
                </div>

                <!-- Botão de Login -->
                <button type="button"
                    class="btn btn-primary rounded-pill shadow px-3 py-2 fw-bold opacity-100 transition-opacity"
                    :disabled="!isAuthReady || isLoading" @click="loginUser">
                    {{ isLoading ? 'Entrando...' : 'Entrar' }}
                </button>
            </div>

            <span class="mt-2 text-white-50">
                Clique aqui para
                <!-- <RouterLink class="text-decoration-underline text-white" :to="{ name: 'Register' }">
                    Registrar
                </RouterLink> -->
            </span>
        </div>
    </div>
</template>

<!-- ========================== -->
<!-- ========= SCRIPT ========= -->
<!-- ========================== -->

<script setup lang="ts">
    import { ref } from 'vue';
    import { useRouter } from 'vue-router';
    import InputComponent from "@/components/InputComponent.vue";

    const router = useRouter();

    // --- Variáveis de Estado (Essenciais) ---
    const email = ref("");
    const enterEmail = ref("");
    const password = ref("");
    const enterPassword = ref("");
    const message = ref("");
    const isLoading = ref(false); 
    const isAuthReady = ref(true); 

    // ------------------------------------
    // 1. Funções de Validação e Limpeza
    // ------------------------------------

    const clearMessages = () => { 
        enterPassword.value = "";
        enterEmail.value = "";
        message.value = "";
    };

    // ------------------------------------
    // 2. Função Principal de Login (Mock)
    // ------------------------------------

    const loginUser = async () => { 
        if (!password.value || !email.value) {
            !email.value ? enterEmail.value = "O e-email é obrigatório." : "";
            !password.value ? enterPassword.value = 'A senha é obrigatória.' : "";
            return;
        }
        isLoading.value = true;
        clearMessages();
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            router.push('/');
        } catch (error: any) {
            message.value = 'Credenciais inválidas. Tente novamente.';
        } finally {
            isLoading.value = false;
        }
    };
</script>

<!-- ========================= -->
<!-- ========= STYLE ========= -->
<!-- ========================= -->

<style scoped>
    .transition-opacity {
        transition: opacity 0.3s ease;
    }

    .btn:disabled {
        opacity: 0.65;
    }
</style>