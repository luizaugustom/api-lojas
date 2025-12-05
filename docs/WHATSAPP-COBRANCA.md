# 💬 Sistema de Envio de Mensagens de Cobrança via WhatsApp (Z-API)

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Configuração](#configuração)
3. [Endpoints Disponíveis](#endpoints-disponíveis)
4. [Exemplos de Uso](#exemplos-de-uso)
5. [Testes e Validação](#testes-e-validação)
6. [Troubleshooting](#troubleshooting)
7. [Boas Práticas](#boas-práticas)

---

## 🎯 Visão Geral

Sistema completo de envio de mensagens de cobrança via WhatsApp utilizando a **Z-API** como provider. O sistema suporta:

- ✅ Envio de mensagens de cobrança de parcelas individuais
- ✅ Envio de mensagens de cobrança múltiplas para um cliente
- ✅ Validação automática de números de telefone
- ✅ Formatação automática de números (padrão internacional)
- ✅ Retry automático com backoff exponencial (3 tentativas)
- ✅ Logs detalhados de todas as operações
- ✅ Rastreamento de mensagens enviadas (contador e data)

---

## ⚙️ Configuração

### 1. Criar Conta na Z-API

1. Acesse: https://developer.z-api.io/
2. Crie uma conta
3. Crie uma nova instância do WhatsApp
4. Obtenha suas credenciais:
   - `Z_API_INSTANCE_ID` (ID da instância)
   - `Z_API_TOKEN` (Token de autenticação)

### 2. Configurar Variáveis de Ambiente

Edite o arquivo `.env` da sua aplicação e adicione:

```env
# WHATSAPP BUSINESS API - Z-API
Z_API_URL=https://api.z-api.io
Z_API_INSTANCE_ID=sua-instance-id-aqui
Z_API_TOKEN=seu-token-aqui
```

### 3. Conectar WhatsApp

1. No painel da Z-API, escaneie o QR Code com o WhatsApp Business
2. Aguarde a conexão ser estabelecida
3. Verifique o status da instância

### 4. Verificar Configuração

Após iniciar a aplicação, verifique os logs:

```
✅ Z-API configurada: https://api.z-api.io (Instance: 12345678...)
```

---

## 🔌 Endpoints Disponíveis

### 1. Enviar Cobrança de Parcela Individual

**POST** `/whatsapp/send-installment-billing`

Envia mensagem de cobrança para uma parcela específica.

**Headers:**
```
Authorization: Bearer {seu-token-jwt}
Content-Type: application/json
```

**Body:**
```json
{
  "installmentId": "uuid-da-parcela"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Mensagem de cobrança enviada com sucesso"
}
```

**Exemplo de Mensagem Enviada:**
```
📅 COBRANÇA - PARCELA 3/5

Olá, João Silva!

*Vence em 5 dia(s)*

📋 Detalhes da Parcela:
• Parcela: 3 de 5
• Valor Total: R$ 150,00
• Valor Restante: R$ 100,00
• Vencimento: 10/12/2025

🏢 MontShop

Por favor, efetue o pagamento até a data de vencimento.

Obrigado pela atenção! 🙏
```

---

### 2. Enviar Cobrança para Cliente (Múltiplas Parcelas)

**POST** `/whatsapp/send-customer-billing`

Envia mensagem de cobrança consolidada com todas as parcelas pendentes de um cliente.

**Headers:**
```
Authorization: Bearer {seu-token-jwt}
Content-Type: application/json
```

**Body (enviar todas as parcelas):**
```json
{
  "customerId": "uuid-do-cliente",
  "sendAll": true
}
```

**Body (enviar parcelas específicas):**
```json
{
  "customerId": "uuid-do-cliente",
  "sendAll": false,
  "installmentIds": ["uuid-parcela-1", "uuid-parcela-2"]
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Mensagem de cobrança enviada com sucesso para 3 parcela(s)",
  "installmentsCount": 3
}
```

**Exemplo de Mensagem Enviada:**
```
💰 RESUMO DE COBRANÇAS

Olá, João Silva!

Você possui 3 parcela(s) pendente(s):
📅 Parcela 2/5: R$ 150,00 - Venc: 10/12/2025
🔴 Parcela 1/5: R$ 150,00 - Venc: 05/11/2025
📅 Parcela 3/5: R$ 150,00 - Venc: 10/01/2026

📊 Total em Aberto: R$ 450,00
⚠️ 1 parcela(s) vencida(s)

🏢 MontShop

Por favor, entre em contato para regularizar sua situação.

Obrigado pela atenção! 🙏
```

---

### 3. Validar Número de Telefone

**POST** `/whatsapp/validate-phone`

Valida se um número de telefone está no formato correto.

**Body:**
```json
{
  "phone": "11987654321"
}
```

**Resposta:**
```json
{
  "isValid": true,
  "message": "Número válido"
}
```

---

### 4. Formatar Número de Telefone

**POST** `/whatsapp/format-phone`

Formata um número de telefone para o padrão internacional.

**Body:**
```json
{
  "phone": "(11) 98765-4321"
}
```

**Resposta:**
```json
{
  "success": true,
  "formattedPhone": "5511987654321",
  "message": "Número formatado com sucesso"
}
```

---

## 💡 Exemplos de Uso

### Exemplo 1: Enviar Cobrança de Parcela via cURL

```bash
curl -X POST http://localhost:3000/whatsapp/send-installment-billing \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "installmentId": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

### Exemplo 2: Enviar Cobrança de Cliente via JavaScript

```javascript
const sendBilling = async (customerId) => {
  const response = await fetch('http://localhost:3000/whatsapp/send-customer-billing', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      customerId: customerId,
      sendAll: true
    })
  });
  
  const result = await response.json();
  console.log(result);
};
```

### Exemplo 3: Validar Telefone via Postman

**Método:** POST  
**URL:** `http://localhost:3000/whatsapp/validate-phone`  
**Headers:**
- Authorization: Bearer {seu-token}
- Content-Type: application/json

**Body:**
```json
{
  "phone": "11987654321"
}
```

---

## 🧪 Testes e Validação

### 1. Verificar Status da Instância

Ao iniciar a aplicação, verifique os logs:

```
✅ Z-API configurada: https://api.z-api.io (Instance: 12345678...)
🟢 Z-API conectada | Status: connected
```

### 2. Testar Envio de Mensagem Simples

Use o endpoint `/whatsapp/send-message` para testar:

```json
{
  "to": "5511987654321",
  "message": "Teste de conexão Z-API",
  "type": "text"
}
```

### 3. Formatos de Telefone Aceitos

O sistema aceita os seguintes formatos:

- ✅ `11987654321` (11 dígitos - DDD + número)
- ✅ `5511987654321` (13 dígitos - código país + DDD + número)
- ✅ `(11) 98765-4321` (formatado - será limpo automaticamente)
- ✅ `+55 11 98765-4321` (internacional formatado)
- ✅ `1187654321` (10 dígitos - formato antigo sem 9)
- ✅ `551187654321` (12 dígitos - formato antigo com 55)

### 4. Verificar Logs

Os logs fornecem informações detalhadas sobre cada operação:

```
📤 Enviando mensagem WhatsApp via Z-API | Destino: 5511987654321 | Tamanho: 245 chars | Tentativa: 1/3
✅ Mensagem Z-API enviada | Destino: 5511987654321 | Status: 200 | ID: msg_123456
✅ Mensagem WhatsApp enviada com sucesso via Z-API | Destino: 5511987654321 | Tempo: 1250ms
💰 Mensagem de cobrança enviada para João Silva (5511987654321)
```

### 5. Rastreamento de Mensagens

Cada parcela rastreia as mensagens enviadas:

- `lastMessageSentAt`: Data da última mensagem enviada
- `messageCount`: Contador total de mensagens enviadas

---

## 🔧 Troubleshooting

### Problema: "Z-API não configurada"

**Causa:** Variáveis de ambiente não configuradas.

**Solução:**
1. Verifique se o arquivo `.env` contém `Z_API_INSTANCE_ID` e `Z_API_TOKEN`
2. Reinicie a aplicação após adicionar as variáveis
3. Verifique os logs de inicialização

---

### Problema: "Número de telefone inválido"

**Causa:** Formato de telefone não aceito.

**Solução:**
1. Use o formato com DDD: `11987654321`
2. Certifique-se de que o DDD está entre 11 e 99
3. Para celular, o número deve ter 9 dígitos após o DDD
4. Use o endpoint `/whatsapp/format-phone` para testar

---

### Problema: "Erro 401 - Autenticação"

**Causa:** Token da Z-API inválido ou expirado.

**Solução:**
1. Verifique se o `Z_API_TOKEN` está correto no `.env`
2. Acesse o painel da Z-API e regenere o token se necessário
3. Atualize o `.env` e reinicie a aplicação

---

### Problema: "Erro 404 - Endpoint não encontrado"

**Causa:** Instance ID incorreto ou instância não existe.

**Solução:**
1. Verifique se o `Z_API_INSTANCE_ID` está correto no `.env`
2. Confirme no painel da Z-API que a instância existe
3. Certifique-se de que a instância está ativa

---

### Problema: "Instância não está conectada"

**Causa:** WhatsApp não está conectado à instância.

**Solução:**
1. Acesse o painel da Z-API
2. Escaneie o QR Code novamente com o WhatsApp Business
3. Aguarde a conexão ser estabelecida
4. Tente enviar a mensagem novamente

---

### Problema: "Timeout ao enviar mensagem"

**Causa:** Conexão lenta ou problema temporário.

**Solução:**
1. O sistema tenta automaticamente 3 vezes com backoff exponencial
2. Verifique sua conexão com a internet
3. Verifique se a API da Z-API está operacional
4. Aguarde alguns minutos e tente novamente

---

### Problema: "Cliente não possui telefone cadastrado"

**Causa:** Campo `phone` do cliente está vazio.

**Solução:**
1. Cadastre o telefone do cliente no sistema
2. Use o formato correto: `11987654321`
3. Tente enviar a mensagem novamente

---

## ✨ Boas Práticas

### 1. Gerenciamento de Envios

- ✅ **Não envie cobranças com muita frequência** - Respeite o cliente e evite spam
- ✅ **Personalize as mensagens** - Use o nome do cliente e dados da empresa
- ✅ **Envie em horário comercial** - Evite envios muito cedo ou muito tarde
- ✅ **Monitore o contador de mensagens** - Acompanhe quantas vezes cada parcela foi cobrada

### 2. Validação de Dados

- ✅ **Sempre valide o telefone antes de enviar** - Use o endpoint de validação
- ✅ **Verifique se a parcela está pendente** - Não cobre parcelas já pagas
- ✅ **Confirme os dados da parcela** - Valor, vencimento, etc.

### 3. Tratamento de Erros

- ✅ **Monitore os logs** - Acompanhe erros e sucessos
- ✅ **Implemente notificações** - Alerte sobre falhas críticas
- ✅ **Tenha um plano B** - Considere outros meios de comunicação se o WhatsApp falhar

### 4. Segurança

- ✅ **Proteja suas credenciais** - Nunca exponha `Z_API_TOKEN` publicamente
- ✅ **Use HTTPS** - Sempre em produção
- ✅ **Implemente rate limiting** - Evite abuso da API
- ✅ **Valide permissões** - Apenas usuários autorizados podem enviar cobranças

### 5. Performance

- ✅ **Não envie milhares de mensagens de uma vez** - Implemente filas
- ✅ **Use batch processing** - Agrupe envios quando possível
- ✅ **Cache de validações** - Reutilize validações de telefone
- ✅ **Monitore custos** - Acompanhe o consumo da API

---

## 📊 Monitoramento e Métricas

### Logs Importantes

```
✅ Mensagem Z-API enviada - Sucesso
⚠️ Falha ao enviar, tentando novamente - Retry
❌ Erro ao enviar mensagem - Falha definitiva
🟢 Z-API conectada - Status OK
🔴 Z-API não está conectada - Problema de conexão
```

### Campos de Rastreamento

Na tabela `Installment`:
- `lastMessageSentAt`: Última mensagem enviada
- `messageCount`: Total de mensagens enviadas

Consulta útil:
```sql
SELECT 
  i.id,
  c.name,
  i.lastMessageSentAt,
  i.messageCount,
  i.dueDate
FROM "Installment" i
JOIN "Customer" c ON c.id = i.customerId
WHERE i.isPaid = false
ORDER BY i.lastMessageSentAt DESC NULLS LAST;
```

---

## 🆘 Suporte

Se você encontrar problemas não listados neste guia:

1. **Verifique os logs da aplicação** - Eles contêm informações detalhadas
2. **Consulte a documentação da Z-API** - https://developer.z-api.io/
3. **Verifique o status da API** - Pode haver manutenção programada
4. **Entre em contato com o suporte da Z-API** - Para problemas específicos da API

---

## 📝 Changelog

### v1.0.0 (Dezembro 2025)
- ✅ Implementação inicial do sistema de cobrança
- ✅ Integração completa com Z-API
- ✅ Suporte a envio de parcelas individuais e múltiplas
- ✅ Validação e formatação automática de telefones
- ✅ Retry automático com backoff exponencial
- ✅ Logs detalhados e rastreamento de mensagens
- ✅ Tratamento de erros robusto
- ✅ Documentação completa

---

**Desenvolvido com ❤️ para MontShop**
