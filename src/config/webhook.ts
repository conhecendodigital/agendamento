// ⚠️ CONFIGURAR: Cole a URL do seu webhook n8n abaixo
// No n8n, crie um workflow com um nó Webhook e copie a URL de produção

export const WEBHOOK_URL = "COLE_A_URL_DO_SEU_WEBHOOK_N8N_AQUI";

// Verificação de configuração
if (WEBHOOK_URL === "COLE_A_URL_DO_SEU_WEBHOOK_N8N_AQUI") {
    console.warn("⚠️ Webhook n8n não configurado! Edite src/config/webhook.ts com a URL do seu webhook.");
}
