# 🔧 Troubleshooting - Erro "client-token is not configured"

## ❌ Erro Completo
```
{"error":"your client-token is not configured"}
```

## 🔍 Causa
A Z-API exige que o header `Client-Token` seja enviado em **cada requisição**, além do token na URL.

**IMPORTANTE**: O `Client-Token` deve usar a variável `Z_API_CLIENT_TOKEN` (não o `Z_API_TOKEN`)!

## ✅ Solução Aplicada (Corrigida)

### 1. Configuração das Variáveis de Ambiente
São necessárias **3 variáveis** no arquivo `.env`:

```bash
Z_API_URL=https://api.z-api.io
Z_API_INSTANCE_ID=sua_instancia_aqui
Z_API_TOKEN=seu_token_aqui
Z_API_CLIENT_TOKEN=seu_client_token_aqui  # ⚠️ OBRIGATÓRIO
```

### 2. Header Correto nas Requisições
O header `Client-Token` agora usa o valor correto (`clientToken`):

```typescript
const headers = {
  'Content-Type': 'application/json',
  'Client-Token': this.clientToken,  // ✅ Correto: usa Z_API_CLIENT_TOKEN
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

- [x] ✅ Variável `Z_API_CLIENT_TOKEN` configurada no `.env`
- [x] ✅ Header `Client-Token` usando `this.clientToken` (não `this.token`)
- [x] ✅ Header `Client-Token` adicionado em todas as requisições
- [x] ✅ Validação obrigatória do Client-Token implementada
- [ ] ⚠️ **Aplicação reiniciada** ← IMPORTANTE!

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
