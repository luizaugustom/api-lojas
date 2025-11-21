# Integração WhatsApp para Envio de Mensagens de Cobrança

## Visão Geral

Este documento descreve a integração com a **Evolution API** para envio automático de mensagens de cobrança de parcelas via WhatsApp.

## ⚠️ Pré-requisitos

Antes de usar os endpoints de cobrança, você precisa:

1. **Ter a Evolution API instalada e rodando**
   - Siga o guia completo: [EVOLUTION-API-SETUP.md](./EVOLUTION-API-SETUP.md)

2. **Ter uma instância do WhatsApp conectada**
   - Crie uma instância na Evolution API
   - Conecte seu WhatsApp escaneando o QR Code

## Configuração

### Variáveis de Ambiente

Adicione as seguintes variáveis no arquivo `.env` do projeto `api-lojas`:

```env
# Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua-chave-secreta-aqui
EVOLUTION_INSTANCE=minha-loja
```

**Onde obter essas informações:**
- `EVOLUTION_API_URL`: URL onde a Evolution API está rodando (sem barra no final)
- `EVOLUTION_API_KEY`: A chave configurada no `AUTHENTICATION_API_KEY` do docker-compose da Evolution API
- `EVOLUTION_INSTANCE`: Nome da instância que você criou na Evolution API

**📖 Para mais detalhes sobre como configurar a Evolution API, consulte: [EVOLUTION-API-SETUP.md](./EVOLUTION-API-SETUP.md)**

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

1. **Verifique se a Evolution API está rodando:**
   ```bash
   docker-compose ps
   # ou
   curl http://localhost:8080
   ```

2. **Verifique as variáveis de ambiente no `.env`:**
   - `EVOLUTION_API_URL` está correto?
   - `EVOLUTION_API_KEY` está correto?
   - `EVOLUTION_INSTANCE` existe e está conectada?

3. **Verifique os logs do MontShop:**
   - Procure por mensagens de erro relacionadas ao WhatsApp
   - Verifique se aparece: `Evolution API configurada: ...`

4. **Verifique os logs da Evolution API:**
   ```bash
   docker-compose logs -f evolution-api
   ```

5. **Certifique-se de que o número de telefone do cliente está cadastrado**

### Erro de autenticação (401 Unauthorized)

- Verifique se `EVOLUTION_API_KEY` no `.env` do MontShop é igual ao `AUTHENTICATION_API_KEY` do docker-compose da Evolution API
- Certifique-se de que não há espaços extras na chave

### Instância não encontrada

1. Liste as instâncias disponíveis:
   ```bash
   curl -X GET http://localhost:8080/instance/fetchInstances \
     -H "apikey: sua-chave-secreta-aqui"
   ```

2. Verifique se o nome em `EVOLUTION_INSTANCE` corresponde exatamente ao nome criado
3. Verifique se a instância está conectada (status: `open`)

### Número de telefone inválido

- O número deve estar no formato brasileiro (11 dígitos) ou internacional (com código do país)
- O sistema formata automaticamente para o formato internacional (55 + DDD + número)
- Exemplo: `11999999999` → `5511999999999`

### Erro de conexão

- Verifique se a URL da Evolution API está acessível do servidor do MontShop
- Se estiver em servidores diferentes, verifique firewall e rede
- Certifique-se de que a URL não tem barra no final: `http://localhost:8080` (não `http://localhost:8080/`)

**📖 Para mais soluções de problemas, consulte: [EVOLUTION-API-SETUP.md](./EVOLUTION-API-SETUP.md#troubleshooting)**

## Próximos Passos

- [ ] Implementar envio automático agendado (cron job)
- [ ] Adicionar suporte a templates personalizados
- [ ] Implementar webhook para receber status de entrega
- [ ] Adicionar relatório de mensagens enviadas

---

## 📚 Documentação Relacionada

- **[EVOLUTION-API-SETUP.md](./EVOLUTION-API-SETUP.md)** - Guia completo de instalação e configuração da Evolution API
- **[MENSAGENS-AUTOMATICAS.md](./MENSAGENS-AUTOMATICAS.md)** - Documentação sobre mensagens automáticas (se existir)

