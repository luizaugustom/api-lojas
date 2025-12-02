# 🧪 Como Testar o Envio de Mensagens WhatsApp

## 📋 Pré-requisitos

Antes de testar, certifique-se de que:

1. ✅ Z-API está configurada no `.env`:
   ```env
   Z_API_URL=https://api.z-api.io
   Z_API_INSTANCE_ID=seu-instance-id
   Z_API_TOKEN=seu-token
   ```

2. ✅ WhatsApp está conectado na plataforma Z-API
3. ✅ API do MontShop está rodando
4. ✅ Você tem um token JWT válido (faça login primeiro)

## 🔍 1. Verificar Status da Conexão

Antes de enviar mensagens, verifique se a instância está conectada:

### Via Logs da Aplicação

Verifique os logs ao iniciar a aplicação. Você deve ver:

```
✅ Z-API configurada como provider de WhatsApp
Z-API configurada: https://api.z-api.io (Instance: seu-instance-id)
```

### Via Painel Z-API

1. Acesse o painel da Z-API: https://developer.z-api.io/
2. Verifique se sua instância está com status "Conectado" ou "Online"

## 🧪 2. Testar Envio de Mensagem Simples

### Opção A: Via Swagger (Mais Fácil)

1. **Acesse o Swagger:**
   - URL: `http://localhost:3000/api` (ou sua URL de produção)
   - Faça login usando o botão "Authorize" no topo

2. **Navegue até a seção `whatsapp`**

3. **Use o endpoint `POST /whatsapp/send-message`**

4. **Preencha o body:**
   ```json
   {
     "to": "11999999999",
     "message": "Teste de mensagem do MontShop! 🚀"
   }
   ```

5. **Clique em "Execute"**

6. **Verifique a resposta:**
   ```json
   {
     "success": true,
     "message": "Mensagem enviada com sucesso"
   }
   ```

### Opção B: Via cURL

```bash
curl -X POST http://localhost:3000/whatsapp/send-message \
  -H "Authorization: Bearer SEU_TOKEN_JWT_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "11999999999",
    "message": "Teste de mensagem do MontShop! 🚀"
  }'
```

**Substitua:**
- `SEU_TOKEN_JWT_AQUI` pelo seu token JWT
- `11999999999` pelo número de telefone de teste (formato: DDD + número)

### Opção C: Via Postman/Insomnia

1. **Método:** `POST`
2. **URL:** `http://localhost:3000/whatsapp/send-message`
3. **Headers:**
   ```
   Authorization: Bearer SEU_TOKEN_JWT
   Content-Type: application/json
   ```
4. **Body (JSON):**
   ```json
   {
     "to": "11999999999",
     "message": "Teste de mensagem do MontShop! 🚀"
   }
   ```

## 📱 3. Formatos de Telefone Aceitos

O sistema aceita vários formatos e converte automaticamente:

✅ **Formatos válidos:**
- `11999999999` (11 dígitos)
- `(11) 99999-9999`
- `11 99999-9999`
- `+5511999999999` (13 dígitos com código do país)

O sistema formata automaticamente para: `5511999999999`

## ✅ 4. Validar Número de Telefone

Antes de enviar, você pode validar o número:

### Via Swagger

**Endpoint:** `POST /whatsapp/validate-phone`

**Body:**
```json
{
  "phone": "11999999999"
}
```

**Resposta:**
```json
{
  "isValid": true,
  "message": "Número válido"
}
```

### Via cURL

```bash
curl -X POST http://localhost:3000/whatsapp/validate-phone \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "11999999999"
  }'
```

## 🔢 5. Formatar Número de Telefone

Para ver como o sistema formata um número:

### Via Swagger

**Endpoint:** `POST /whatsapp/format-phone`

**Body:**
```json
{
  "phone": "11999999999"
}
```

**Resposta:**
```json
{
  "success": true,
  "formattedPhone": "5511999999999",
  "message": "Número formatado com sucesso"
}
```

## 💰 6. Testar Mensagem de Cobrança

### Enviar Cobrança de Uma Parcela

**Endpoint:** `POST /whatsapp/send-installment-billing`

**Body:**
```json
{
  "installmentId": "uuid-da-parcela"
}
```

**Via cURL:**
```bash
curl -X POST http://localhost:3000/whatsapp/send-installment-billing \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "installmentId": "uuid-da-parcela"
  }'
```

### Enviar Cobrança para Cliente (Todas as Parcelas)

**Endpoint:** `POST /whatsapp/send-customer-billing`

**Body:**
```json
{
  "customerId": "uuid-do-cliente",
  "sendAll": true
}
```

**Via cURL:**
```bash
curl -X POST http://localhost:3000/whatsapp/send-customer-billing \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "uuid-do-cliente",
    "sendAll": true
  }'
```

## 📊 7. Verificar Logs

Após enviar uma mensagem, verifique os logs da aplicação:

### Logs de Sucesso

```
✅ Z-API configurada como provider de WhatsApp
📤 Enviando mensagem WhatsApp via Z-API | Destino: 5511999999999 | Tamanho: 35 chars | Tentativa: 1/3
✅ Mensagem WhatsApp enviada com sucesso via Z-API | Destino: 5511999999999 | Tempo: 234ms
```

### Logs de Erro

```
❌ Erro ao enviar mensagem WhatsApp via Z-API | Destino: 5511999999999
📊 Detalhes do erro | Status: 401 | Resposta: {"error": "Unauthorized"}
```

## 🔍 8. Troubleshooting

### Erro: "Z-API não configurada"

**Solução:**
1. Verifique se as variáveis estão no `.env`:
   ```env
   Z_API_INSTANCE_ID=seu-instance-id
   Z_API_TOKEN=seu-token
   ```
2. Reinicie a aplicação

### Erro: "Instância não está conectada"

**Solução:**
1. Acesse o painel da Z-API
2. Verifique se a instância está conectada
3. Se não estiver, reconecte escaneando o QR Code

### Erro: "401 Unauthorized"

**Solução:**
1. Verifique se o `Z_API_TOKEN` está correto
2. Verifique se o token não expirou
3. Gere um novo token na plataforma Z-API se necessário

### Erro: "Número de telefone inválido"

**Solução:**
1. Use o endpoint `/whatsapp/validate-phone` para validar
2. Certifique-se de que o número está no formato brasileiro (11 dígitos)
3. Exemplo válido: `11999999999`

### Mensagem não chega

**Solução:**
1. Verifique se o número tem WhatsApp
2. Verifique se o número está no formato correto
3. Verifique os logs para erros específicos
4. Teste enviando para seu próprio número primeiro

## 🎯 9. Exemplo Completo de Teste

### Passo a Passo:

1. **Obter Token JWT:**
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "seu-email@exemplo.com",
       "password": "sua-senha"
     }'
   ```
   
   Copie o `accessToken` da resposta.

2. **Validar Telefone:**
   ```bash
   curl -X POST http://localhost:3000/whatsapp/validate-phone \
     -H "Authorization: Bearer SEU_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"phone": "11999999999"}'
   ```

3. **Enviar Mensagem:**
   ```bash
   curl -X POST http://localhost:3000/whatsapp/send-message \
     -H "Authorization: Bearer SEU_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "to": "11999999999",
       "message": "Teste de mensagem! 🚀"
     }'
   ```

4. **Verificar Resposta:**
   ```json
   {
     "success": true,
     "message": "Mensagem enviada com sucesso"
   }
   ```

5. **Verificar no WhatsApp:**
   - Abra o WhatsApp do número de destino
   - Você deve receber a mensagem

## 📝 10. Dicas de Teste

1. **Sempre teste primeiro com seu próprio número**
2. **Use números de teste** antes de enviar para clientes reais
3. **Verifique os logs** para entender o que está acontecendo
4. **Teste a validação** antes de enviar mensagens
5. **Monitore o rate limiting** (máximo 50 mensagens/hora por empresa)

## 🔗 Links Úteis

- **Documentação Z-API:** https://developer.z-api.io/
- **Swagger da API:** `http://localhost:3000/api`
- **Painel Z-API:** https://developer.z-api.io/

## ✅ Checklist de Teste

- [ ] Z-API configurada no `.env`
- [ ] WhatsApp conectado na plataforma Z-API
- [ ] Token JWT obtido
- [ ] Número de telefone validado
- [ ] Mensagem de teste enviada com sucesso
- [ ] Mensagem recebida no WhatsApp
- [ ] Logs verificados

---

**Pronto!** Agora você sabe como testar o envio de mensagens WhatsApp! 🎉

