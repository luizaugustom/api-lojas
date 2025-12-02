# 🚀 Deploy na Digital Ocean App Platform com Evolution API

## 📋 Visão Geral

Este guia explica como fazer deploy da API MontShop junto com a Evolution API na Digital Ocean App Platform, garantindo que ambos os serviços rodem automaticamente e de forma integrada.

## 🎯 Estratégia de Deploy

Para a Digital Ocean App Platform, temos duas opções:

### Opção 1: Serviço Único (Recomendado)
- Um único serviço que roda tanto a API principal quanto a Evolution API
- Usa o `Dockerfile.production` que inicia ambos os serviços
- Mais simples de gerenciar e mais econômico

### Opção 2: Serviços Separados
- Dois serviços separados na Digital Ocean
- Um para a API principal e outro para Evolution API
- Mais controle, mas mais complexo

**Vamos usar a Opção 1 (Serviço Único)** por ser mais simples e automática.

---

## 📦 Passo a Passo: Deploy na Digital Ocean

### Passo 1: Preparar o Repositório

1. **Certifique-se de que o `Dockerfile.production` está no repositório**
   - O arquivo deve estar na raiz do projeto `api-lojas`

2. **Verifique se os scripts estão incluídos:**
   - `scripts/start-all.sh`
   - `scripts/start-evolution-api-simple.js`
   - `scripts/setup-evolution-api.sh`

3. **Faça commit e push:**
   ```bash
   git add .
   git commit -m "Adiciona suporte para Evolution API em produção"
   git push origin main
   ```

### Passo 2: Criar App na Digital Ocean

1. **Acesse o Dashboard da Digital Ocean**
   - Vá para [cloud.digitalocean.com](https://cloud.digitalocean.com)
   - Navegue até **App Platform**

2. **Criar Novo App**
   - Clique em **Create App**
   - Conecte seu repositório GitHub/GitLab
   - Selecione o repositório e branch (geralmente `main`)

3. **Configurar o App**
   - **Nome do App**: `montshop-api` (ou o nome que preferir)
   - **Região**: Escolha a mais próxima dos seus usuários
   - **Branch**: `main`

### Passo 3: Configurar Build e Deploy

1. **Configurações de Build:**
   - **Build Command**: Deixe vazio (o Dockerfile cuida disso)
   - **Dockerfile Path**: `api-lojas/Dockerfile.production`
   - **Dockerfile Context**: `api-lojas`

2. **Configurações de Run:**
   - **Run Command**: Deixe vazio (o Dockerfile define o CMD)
   - **HTTP Port**: `3000` (porta da API principal)
   - **HTTP Request Routes**: `/`

### Passo 4: Configurar Variáveis de Ambiente

Adicione as seguintes variáveis de ambiente na Digital Ocean:

#### Variáveis Obrigatórias da API:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:port/database?schema=public
JWT_SECRET=sua-chave-jwt-super-secreta-aqui
CORS_ORIGIN=https://seu-frontend.com
```

#### Variáveis da Evolution API:

```env
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua-chave-secreta-evolution-api-aqui
EVOLUTION_INSTANCE=montshop-prod
EVOLUTION_API_PORT=8080
```

**⚠️ IMPORTANTE:**
- `EVOLUTION_API_KEY` deve ser uma chave forte e única
- `EVOLUTION_INSTANCE` é o nome da instância do WhatsApp que você criará
- `EVOLUTION_API_URL` deve ser `http://localhost:8080` quando rodando no mesmo container

#### Outras Variáveis (se necessário):

```env
FOCUSNFE_API_KEY=sua-chave-focusnfe
FOCUSNFE_BASE_URL=https://api.focusnfe.com.br
FISCAL_ENVIRONMENT=production
FIREBASE_PROJECT_ID=seu-projeto-firebase
FIREBASE_CLIENT_EMAIL=seu-email-firebase
FIREBASE_PRIVATE_KEY=sua-chave-privada-firebase
FIREBASE_STORAGE_BUCKET=seu-bucket-firebase
```

### Passo 5: Configurar Banco de Dados

1. **Adicionar Database Component**
   - Na tela de configuração do App, clique em **Add Component**
   - Selecione **Database**
   - Escolha **PostgreSQL**
   - Selecione o plano apropriado

2. **Conectar Database à API**
   - A variável `DATABASE_URL` será preenchida automaticamente
   - Ou você pode configurar manualmente

### Passo 6: Configurar Health Check

1. **Health Check Path**: `/health`
2. **Health Check Port**: `3000`
3. **Initial Delay**: `60` segundos (para dar tempo dos serviços iniciarem)

### Passo 7: Deploy

1. **Revisar Configurações**
   - Verifique todas as variáveis de ambiente
   - Confirme o Dockerfile path
   - Verifique o plano de recursos

2. **Fazer Deploy**
   - Clique em **Create Resources** ou **Deploy**
   - Aguarde o build e deploy (pode levar 5-10 minutos)

3. **Monitorar Logs**
   - Durante o deploy, monitore os logs
   - Procure por mensagens como:
     - `🚀 Iniciando serviços...`
     - `📱 Iniciando Evolution API...`
     - `🌐 Iniciando API principal...`
     - `✅ Ambos os serviços estão rodando`

### Passo 8: Configurar Instância do WhatsApp

Após o deploy, você precisa criar e conectar a instância do WhatsApp:

1. **Acessar Evolution API**
   - A Evolution API estará rodando na porta 8080
   - Mas na Digital Ocean, você precisa expor essa porta
   - **Solução**: Adicione uma variável de ambiente `EVOLUTION_API_PORT=8080`
   - E configure um componente adicional ou use o mesmo serviço

2. **Criar Instância via API**
   ```bash
   curl -X POST https://seu-app.ondigitalocean.app:8080/instance/create \
     -H "apikey: sua-chave-secreta-evolution-api-aqui" \
     -H "Content-Type: application/json" \
     -d '{
       "instanceName": "montshop-prod",
       "qrcode": true,
       "integration": "WHATSAPP-BAILEYS"
     }'
   ```

3. **Escanear QR Code**
   - A resposta conterá um QR Code em base64
   - Decodifique e escaneie com seu WhatsApp
   - Ou use a interface web da Evolution API (se disponível)

---

## 🔧 Configuração Alternativa: Serviços Separados

Se preferir rodar Evolution API como serviço separado:

### Passo 1: Criar Serviço para Evolution API

1. **Adicionar Component**
   - No App, clique em **Add Component**
   - Selecione **Service**

2. **Configurar Evolution API Service**
   - **Name**: `evolution-api`
   - **Dockerfile**: Crie um Dockerfile simples:
     ```dockerfile
     FROM atendai/evolution-api:latest
     EXPOSE 8080
     ```
   - **Port**: `8080`
   - **Environment Variables**:
     ```env
     SERVER_URL=https://evolution-api.ondigitalocean.app
     PORT=8080
     DATABASE_ENABLED=true
     DATABASE_PROVIDER=sqlite
     AUTHENTICATION_API_KEY=sua-chave-secreta-aqui
     ```

3. **Atualizar Variáveis da API Principal**
   - `EVOLUTION_API_URL=https://evolution-api.ondigitalocean.app`
   - Mantenha as outras variáveis

---

## ✅ Verificação Pós-Deploy

### 1. Verificar API Principal

```bash
curl https://seu-app.ondigitalocean.app/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Verificar Status do WhatsApp

```bash
curl -X GET https://seu-app.ondigitalocean.app/whatsapp/status \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

**Resposta esperada:**
```json
{
  "connected": true,
  "status": "open",
  "message": "Instância WhatsApp conectada e pronta para enviar mensagens"
}
```

### 3. Verificar Logs

Na Digital Ocean, vá para **Runtime Logs** e verifique:
- ✅ `Evolution API iniciada (PID: XXXX)`
- ✅ `API principal iniciada (PID: XXXX)`
- ✅ `Ambos os serviços estão rodando`

---

## 🔍 Troubleshooting

### Problema: Evolution API não inicia

**Sintomas:**
- Logs mostram erro ao iniciar Evolution API
- Status do WhatsApp retorna `connected: false`

**Soluções:**
1. Verifique se `EVOLUTION_API_KEY` está configurada
2. Verifique se `EVOLUTION_INSTANCE` está configurada
3. Verifique os logs para erros específicos
4. Certifique-se de que a porta 8080 está disponível

### Problema: API principal não inicia

**Sintomas:**
- Health check falha
- App não responde

**Soluções:**
1. Verifique `DATABASE_URL`
2. Verifique `JWT_SECRET`
3. Verifique se as migrações foram executadas
4. Verifique os logs para erros específicos

### Problema: Ambos os serviços não iniciam

**Sintomas:**
- App não sobe
- Timeout no health check

**Soluções:**
1. Verifique se o Dockerfile.production está correto
2. Verifique se os scripts têm permissão de execução
3. Aumente o `Initial Delay` do health check
4. Verifique os recursos (CPU/RAM) do plano

### Problema: Instância WhatsApp não conecta

**Sintomas:**
- Status retorna `connected: false`
- QR Code não aparece

**Soluções:**
1. Verifique se a instância foi criada
2. Verifique se o QR Code foi escaneado
3. Verifique se a Evolution API está acessível
4. Tente criar uma nova instância

---

## 📊 Monitoramento

### Logs Importantes

**Início dos serviços:**
```
🚀 Iniciando serviços...
📱 Iniciando Evolution API na porta 8080...
✅ Evolution API iniciada (PID: XXXX)
🌐 Iniciando API principal...
✅ API principal iniciada (PID: XXXX)
✅ Ambos os serviços estão rodando
```

**Mensagens automáticas:**
```
🚀 Iniciando verificação de parcelas para envio de mensagens automáticas...
✅ Instância WhatsApp conectada. Status: open
📊 Encontradas X empresas com envio automático ativado
```

### Métricas

Monitore na Digital Ocean:
- **CPU Usage**: Deve estar abaixo de 80%
- **Memory Usage**: Deve estar abaixo de 80%
- **Request Rate**: Monitore picos de tráfego
- **Error Rate**: Deve estar próximo de 0%

---

## 🔄 Atualizações

Para atualizar o app:

1. **Fazer alterações no código**
2. **Commit e push:**
   ```bash
   git add .
   git commit -m "Atualização"
   git push origin main
   ```
3. **Digital Ocean detecta automaticamente e faz redeploy**
4. **Monitorar logs durante o deploy**

---

## 💰 Custos

**Estimativa de custos (aproximado):**

- **App Service (Basic)**: $5-12/mês
- **Database (Basic)**: $15/mês
- **Total**: ~$20-30/mês

**Para produção com mais recursos:**
- **App Service (Professional)**: $12-25/mês
- **Database (Professional)**: $60/mês
- **Total**: ~$75-85/mês

---

## ✅ Checklist Final

Antes de considerar o deploy completo:

- [ ] Dockerfile.production criado e testado
- [ ] Scripts de inicialização criados
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados configurado
- [ ] Health check funcionando
- [ ] Evolution API iniciando corretamente
- [ ] API principal iniciando corretamente
- [ ] Instância WhatsApp criada e conectada
- [ ] Teste de envio de mensagem funcionando
- [ ] Logs sendo monitorados
- [ ] Monitoramento configurado

---

## 🎉 Conclusão

Com esta configuração, você terá:

- ✅ API principal rodando automaticamente
- ✅ Evolution API rodando automaticamente
- ✅ Ambos os serviços reiniciam automaticamente se falharem
- ✅ Deploy automático via Git
- ✅ Monitoramento e logs integrados
- ✅ Escalabilidade fácil na Digital Ocean

**O sistema está pronto para produção!** 🚀

