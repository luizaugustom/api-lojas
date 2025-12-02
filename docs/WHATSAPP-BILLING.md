# Integração WhatsApp para Envio de Mensagens de Cobrança

## Visão Geral

Este documento descreve a integração com a **Z-API** para envio automático de mensagens de cobrança de parcelas via WhatsApp.

## ⚠️ Pré-requisitos

Antes de usar os endpoints de cobrança, você precisa:

1. **Ter uma conta na Z-API**
   - Crie uma conta em: https://developer.z-api.io/
   - Obtenha suas credenciais (Instance ID e Token)

2. **Ter uma instância do WhatsApp conectada**
   - Crie uma instância na plataforma Z-API
   - Conecte seu WhatsApp seguindo as instruções da Z-API

## Configuração

### Variáveis de Ambiente

Adicione as seguintes variáveis no arquivo `.env` do projeto `api-lojas`:

```env
# Z-API
Z_API_URL=https://api.z-api.io
Z_API_INSTANCE_ID=seu-instance-id-aqui
Z_API_TOKEN=seu-token-aqui
```

**Onde obter essas informações:**
- `Z_API_URL`: URL da API Z-API (geralmente não precisa alterar)
- `Z_API_INSTANCE_ID`: ID da instância obtido ao criar instância na Z-API
- `Z_API_TOKEN`: Token de autenticação obtido ao criar instância na Z-API

**📖 Para mais detalhes sobre como configurar a Z-API, consulte: [WHATSAPP-PRODUCAO.md](./WHATSAPP-PRODUCAO.md)**

## Endpoints

### 1. Enviar Cobrança de Uma Parcela

**POST** `/whatsapp/send-installment-billing`

Envia mensagem de cobrança para uma parcela específica.

**Body:**
```json
{
  "installmentId": "uuid-da-parcela"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Mensagem de cobrança enviada com sucesso"
}
```

### 2. Enviar Cobrança para Cliente (Múltiplas Parcelas)

**POST** `/whatsapp/send-customer-billing`

Envia mensagem de cobrança para um cliente, podendo incluir todas as parcelas pendentes ou parcelas específicas.

**Body:**
```json
{
  "customerId": "uuid-do-cliente",
  "sendAll": true
}
```

Ou para parcelas específicas:
```json
{
  "customerId": "uuid-do-cliente",
  "sendAll": false,
  "installmentIds": ["uuid-1", "uuid-2"]
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Mensagem de cobrança enviada com sucesso para 3 parcela(s)",
  "installmentsCount": 3
}
```

## Formato das Mensagens

### Mensagem de Parcela Única

```
⚠️ *COBRANÇA - PARCELA 1/3*

Olá, João Silva!

*VENCIDA há 5 dia(s)*

📋 *Detalhes da Parcela:*
• Parcela: 1 de 3
• Valor Total: R$ 100,00
• Valor Restante: R$ 100,00
• Vencimento: 15/01/2024

🏢 *Minha Loja*

Por favor, efetue o pagamento até a data de vencimento.

Obrigado pela atenção! 🙏
```

### Mensagem de Múltiplas Parcelas

```
💰 *RESUMO DE COBRANÇAS*

Olá, João Silva!

Você possui *3 parcela(s) pendente(s)*:
🔴 Parcela 1/3: R$ 100,00 - Venc: 15/01/2024
📅 Parcela 2/3: R$ 100,00 - Venc: 15/02/2024
📅 Parcela 3/3: R$ 100,00 - Venc: 15/03/2024

📊 *Total em Aberto:* R$ 300,00
⚠️ *1 parcela(s) vencida(s)*

🏢 *Minha Loja*

Por favor, entre em contato para regularizar sua situação.

Obrigado pela atenção! 🙏
```

## Rastreamento

O sistema rastreia automaticamente:
- `lastMessageSentAt`: Data/hora do último envio
- `messageCount`: Contador de mensagens enviadas

Esses dados são atualizados automaticamente após cada envio bem-sucedido.

## Validações

O sistema valida:
- ✅ Parcela existe e pertence à empresa
- ✅ Cliente possui número de telefone cadastrado
- ✅ Parcela não está completamente paga
- ✅ Número de telefone está em formato válido

## Exemplos de Uso

### Exemplo 1: Enviar cobrança de uma parcela vencida

```bash
curl -X POST http://localhost:3000/whatsapp/send-installment-billing \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "installmentId": "uuid-da-parcela"
  }'
```

### Exemplo 2: Enviar cobrança de todas as parcelas de um cliente

```bash
curl -X POST http://localhost:3000/whatsapp/send-customer-billing \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "uuid-do-cliente",
    "sendAll": true
  }'
```

## Troubleshooting

### Mensagem não é enviada

1. **Verifique se a Z-API está configurada:**
   - Verifique se `Z_API_INSTANCE_ID` e `Z_API_TOKEN` estão configurados no `.env`
   - Acesse o painel da Z-API para verificar se a instância está ativa

2. **Verifique as variáveis de ambiente no `.env`:**
   - `Z_API_INSTANCE_ID` está correto?
   - `Z_API_TOKEN` está correto?
   - `Z_API_URL` está correto? (geralmente `https://api.z-api.io`)

3. **Verifique os logs do MontShop:**
   - Procure por mensagens de erro relacionadas ao WhatsApp
   - Verifique se aparece: `Z-API configurada: ...`

4. **Verifique o status da instância na Z-API:**
   - Acesse o painel da Z-API
   - Verifique se a instância está conectada e ativa

5. **Certifique-se de que o número de telefone do cliente está cadastrado**

### Erro de autenticação (401 Unauthorized)

- Verifique se `Z_API_TOKEN` no `.env` está correto
- Certifique-se de que não há espaços extras no token
- Verifique se o token não expirou na plataforma Z-API

### Instância não encontrada

1. Verifique no painel da Z-API se a instância existe
2. Verifique se o `Z_API_INSTANCE_ID` corresponde exatamente ao ID da instância
3. Verifique se a instância está conectada e ativa

### Número de telefone inválido

- O número deve estar no formato brasileiro (11 dígitos) ou internacional (com código do país)
- O sistema formata automaticamente para o formato internacional (55 + DDD + número)
- Exemplo: `11999999999` → `5511999999999`

### Erro de conexão

- Verifique se a URL da Z-API está acessível (`https://api.z-api.io`)
- Verifique sua conexão com a internet
- Verifique se há bloqueios de firewall

**📖 Para mais soluções de problemas, consulte: [WHATSAPP-PRODUCAO.md](./WHATSAPP-PRODUCAO.md)**

## Próximos Passos

- [ ] Implementar envio automático agendado (cron job)
- [ ] Adicionar suporte a templates personalizados
- [ ] Implementar webhook para receber status de entrega
- [ ] Adicionar relatório de mensagens enviadas

---

## 📚 Documentação Relacionada

- **[WHATSAPP-PRODUCAO.md](./WHATSAPP-PRODUCAO.md)** - Guia completo de configuração para produção
- **[MENSAGENS-AUTOMATICAS.md](./MENSAGENS-AUTOMATICAS.md)** - Documentação sobre mensagens automáticas (se existir)

