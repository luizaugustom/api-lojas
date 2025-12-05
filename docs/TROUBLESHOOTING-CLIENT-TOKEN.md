# 🔧 Troubleshooting - Erro "client-token is not configured"

## ❌ Erro Completo
```
{"error":"your client-token is not configured"}
```

## 🔍 Causa
A Z-API exige que o header `Client-Token` seja enviado em **cada requisição**, além do token na URL.

## ✅ Solução Aplicada

### 1. Header no Cliente HTTP
O header `Client-Token` foi adicionado ao criar o cliente axios:

```typescript
this.httpClient = axios.create({
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Client-Token': this.token, // Header global
  },
});
```

### 2. Header Explícito nas Requisições
Adicionado também explicitamente em cada requisição para garantir:

```typescript
const headers = {
  'Client-Token': this.token,
  'Content-Type': 'application/json',
};

const response = await this.httpClient.post(url, payload, { headers });
```

## 🚀 Como Aplicar a Correção

### Opção 1: Reiniciar a Aplicação

```powershell
# No terminal da aplicação, pressione Ctrl+C e depois:
cd c:\Users\Luiz\www\MontShop\api-lojas
npm run start:dev
```

### Opção 2: Se estiver usando Docker

```powershell
docker-compose restart api-lojas
```

### Opção 3: Se estiver em produção

```powershell
# Rebuild e restart
npm run build
pm2 restart api-lojas
```

## 📋 Checklist de Verificação

- [x] Header `Client-Token` adicionado ao construtor do httpClient
- [x] Header `Client-Token` adicionado explicitamente nas requisições POST
- [x] Header `Client-Token` adicionado nas requisições GET (status)
- [ ] **Aplicação reiniciada** ← IMPORTANTE!

## 🧪 Como Testar Após Reiniciar

1. **Aguarde a aplicação reiniciar completamente**
2. Acesse a página **Teste WhatsApp** no menu admin
3. Clique em **"Enviar Mensagem"**
4. Verifique os logs no terminal

### Logs Esperados (Sucesso):
```
📤 Enviando para Z-API | URL: https://api.z-api.io/...
✅ Mensagem Z-API enviada | Destino: 5548998482590 | Status: 200
```

### Se Ainda Houver Erro:

#### Verifique as variáveis de ambiente:
```powershell
# No terminal da API
cd c:\Users\Luiz\www\MontShop\api-lojas
cat .env | Select-String "Z_API"
```

Deve mostrar:
```
Z_API_URL=https://api.z-api.io
Z_API_INSTANCE_ID=3EB1EF96DCBF1149CC50C602B1EAD034
Z_API_TOKEN=7E3B0583131D3F587A1E035B
```

#### Verifique se o token está correto:
- Acesse: https://developer.z-api.io/
- Faça login
- Vá em "Minhas Instâncias"
- Verifique se o token corresponde ao da instância

## 🆘 Ainda Não Funciona?

Se após reiniciar ainda apresentar o erro, pode ser um dos casos:

### 1. Token Inválido ou Expirado
- Gere um novo token no painel da Z-API
- Atualize o `.env`
- Reinicie a aplicação

### 2. Instância Desconectada
- Acesse o painel da Z-API
- Verifique se o WhatsApp está conectado
- Escaneie o QR Code novamente se necessário

### 3. Limite de Requisições Atingido
- Verifique seu plano na Z-API
- Aguarde o reset do limite
- Considere upgrade se necessário

## 📞 Suporte

- **Documentação Z-API**: https://developer.z-api.io/
- **Painel Z-API**: https://api.z-api.io/
- **Status da API**: Verifique se há manutenções programadas

---

**Última atualização:** 5 de dezembro de 2025
