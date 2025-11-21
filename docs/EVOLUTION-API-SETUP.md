# Guia Completo: Configuração da Evolution API para Envio de Mensagens de Cobrança

## 📋 Índice

1. [O que é Evolution API](#o-que-é-evolution-api)
2. [Instalação da Evolution API](#instalação-da-evolution-api)
3. [Configuração da Evolution API](#configuração-da-evolution-api)
4. [Configuração no MontShop](#configuração-no-montshop)
5. [Testando a Integração](#testando-a-integração)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 O que é Evolution API

A Evolution API é uma API RESTful open-source que permite enviar e receber mensagens do WhatsApp sem depender da API oficial do Meta. É uma solução ideal para automações e integrações.

**Vantagens:**
- ✅ Gratuita e open-source
- ✅ Fácil de instalar e configurar
- ✅ Não precisa de aprovação do Meta
- ✅ Funciona com qualquer número de WhatsApp
- ✅ Suporte completo a mensagens, mídias e webhooks

---

## 📦 Instalação da Evolution API

### Opção 1: Docker (Recomendado - Mais Fácil)

#### Passo 1: Criar arquivo docker-compose.yml

Crie um arquivo `docker-compose.yml` em uma pasta separada (ex: `evolution-api`):

```yaml
version: '3.8'

services:
  evolution-api:
    container_name: evolution-api
    image: atendai/evolution-api:latest
    restart: always
    ports:
      - "8080:8080"
    environment:
      # Configurações básicas
      SERVER_URL: http://localhost:8080
      PORT: 8080
      
      # Banco de dados (SQLite por padrão - mais simples)
      DATABASE_ENABLED: true
      DATABASE_PROVIDER: sqlite
      DATABASE_NAME: evolution
      
      # Configurações de segurança
      AUTHENTICATION_API_KEY: sua-chave-secreta-aqui
      AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES: true
      
      # Configurações de QR Code
      QRCODE_LIMIT: 30
      QRCODE_COLOR: '#198754'
      
      # Configurações de webhook (opcional)
      WEBHOOK_GLOBAL_URL: ""
      WEBHOOK_GLOBAL_ENABLED: false
      
      # Configurações de Redis (opcional - para produção)
      REDIS_ENABLED: false
      
      # Logs
      LOG_LEVEL: ERROR
      LOG_COLOR: true
      LOG_BAILEYS: error
    volumes:
      - evolution_instances:/evolution/instances
      - evolution_store:/evolution/store
    networks:
      - evolution-network

volumes:
  evolution_instances:
  evolution_store:

networks:
  evolution-network:
    driver: bridge
```

#### Passo 2: Iniciar a Evolution API

```bash
# Navegar para a pasta onde está o docker-compose.yml
cd evolution-api

# Iniciar o container
docker-compose up -d

# Verificar se está rodando
docker-compose ps

# Ver os logs
docker-compose logs -f evolution-api
```

A Evolution API estará disponível em: `http://localhost:8080`

### Opção 2: Instalação Manual (Node.js)

Se preferir instalar manualmente:

```bash
# Clonar o repositório
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Iniciar
npm start
```

---

## ⚙️ Configuração da Evolution API

### Passo 1: Acessar o Painel

Após iniciar a Evolution API, acesse:
- **URL**: `http://localhost:8080`
- **Documentação da API**: `http://localhost:8080/docs` (Swagger)

### Passo 2: Obter a API Key

A API Key está configurada no arquivo `docker-compose.yml` na variável `AUTHENTICATION_API_KEY`.

No exemplo acima, a API Key é: `sua-chave-secreta-aqui`

**⚠️ IMPORTANTE:** Altere esta chave para uma chave segura em produção!

### Passo 3: Criar uma Instância

Você precisa criar uma instância do WhatsApp. Existem duas formas:

#### Método 1: Via API (Recomendado)

```bash
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: sua-chave-secreta-aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "minha-loja",
    "token": "token-opcional-para-webhook",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

**Resposta:**
```json
{
  "instance": {
    "instanceName": "minha-loja",
    "status": "created"
  },
  "qrcode": {
    "code": "data:image/png;base64,iVBORw0KGgoAAAANS..."
  }
}

```

#### Método 2: Via Interface Web

1. Acesse `http://localhost:8080`
2. Clique em "Criar Instância"
3. Digite o nome da instância (ex: `minha-loja`)
4. Clique em "Criar"
5. Escaneie o QR Code com seu WhatsApp

### Passo 4: Conectar o WhatsApp

1. **Obter QR Code:**
```bash
curl -X GET http://localhost:8080/instance/connect/minha-loja \
  -H "apikey: sua-chave-secreta-aqui"
```

2. **Escaneie o QR Code:**
   - Abra o WhatsApp no seu celular
   - Vá em Configurações > Aparelhos conectados > Conectar um aparelho
   - Escaneie o QR Code exibido

3. **Verificar Status:**
```bash
curl -X GET http://localhost:8080/instance/fetchInstances \
  -H "apikey: sua-chave-secreta-aqui"
```

A instância deve aparecer com status `open` quando conectada.

### Passo 5: Testar Envio de Mensagem

```bash
curl -X POST http://localhost:8080/message/sendText/minha-loja \
  -H "apikey: sua-chave-secreta-aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "text": "Teste de mensagem!"
  }'
```

Se receber uma resposta de sucesso, está tudo funcionando! ✅

---

## 🔧 Configuração no MontShop

### Passo 1: Editar arquivo .env

Abra o arquivo `.env` na raiz do projeto `api-lojas` e adicione:

```env
# Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua-chave-secreta-aqui
EVOLUTION_INSTANCE=minha-loja
```

**⚠️ IMPORTANTE:**
- `EVOLUTION_API_URL`: URL onde a Evolution API está rodando (sem barra no final)
- `EVOLUTION_API_KEY`: A mesma chave configurada no `AUTHENTICATION_API_KEY` do docker-compose
- `EVOLUTION_INSTANCE`: O nome da instância que você criou (ex: `minha-loja`)

### Passo 2: Reiniciar a API

```bash
# Se estiver rodando com npm
npm run start:dev

# Se estiver em produção
pm2 restart api-lojas
```

### Passo 3: Verificar Logs

Verifique se a Evolution API foi configurada corretamente nos logs:

```
[WhatsappService] Evolution API configurada: http://localhost:8080 (Instance: minha-loja)
```

---

## 🧪 Testando a Integração

### Teste 1: Enviar Mensagem Manual

Use o endpoint da API do MontShop:

```bash
curl -X POST http://localhost:3000/whatsapp/send-message \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "message": "Teste de mensagem do MontShop!"
  }'
```

### Teste 2: Enviar Cobrança de Parcela

```bash
curl -X POST http://localhost:3000/whatsapp/send-installment-billing \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "installmentId": "uuid-da-parcela"
  }'
```

### Teste 3: Via Interface Swagger

1. Acesse `http://localhost:3000/api` (Swagger do MontShop)
2. Faça login com suas credenciais
3. Navegue até a seção `whatsapp`
4. Teste os endpoints disponíveis

---

## 🔍 Troubleshooting

### Problema: "Evolution API não configurada"

**Solução:**
- Verifique se as variáveis `EVOLUTION_API_URL`, `EVOLUTION_API_KEY` e `EVOLUTION_INSTANCE` estão no `.env`
- Reinicie a API após adicionar as variáveis

### Problema: "Erro de conexão: Não foi possível conectar à Evolution API"

**Soluções:**
1. Verifique se a Evolution API está rodando:
   ```bash
   docker-compose ps
   # ou
   curl http://localhost:8080
   ```

2. Verifique se a URL está correta (sem barra no final):
   - ❌ `http://localhost:8080/`
   - ✅ `http://localhost:8080`

3. Se a Evolution API estiver em outro servidor, verifique:
   - Firewall permitindo conexões na porta 8080
   - URL acessível do servidor do MontShop

### Problema: "401 Unauthorized" ou "API Key inválida"

**Solução:**
- Verifique se a `EVOLUTION_API_KEY` no `.env` do MontShop é igual ao `AUTHENTICATION_API_KEY` do docker-compose da Evolution API
- Certifique-se de que não há espaços extras na chave

### Problema: "Instância não encontrada"

**Solução:**
1. Liste as instâncias disponíveis:
   ```bash
   curl -X GET http://localhost:8080/instance/fetchInstances \
     -H "apikey: sua-chave-secreta-aqui"
   ```

2. Verifique se o nome da instância em `EVOLUTION_INSTANCE` corresponde exatamente ao nome criado

3. Verifique se a instância está conectada (status: `open`)

### Problema: "Número de telefone inválido"

**Solução:**
- O número deve estar no formato internacional: `5511999999999`
- Sem espaços, parênteses ou hífens
- Incluir código do país (55 para Brasil)

### Problema: Mensagem não chega

**Soluções:**
1. Verifique se o WhatsApp está conectado na instância
2. Verifique os logs da Evolution API:
   ```bash
   docker-compose logs -f evolution-api
   ```
3. Verifique se o número de destino está correto e tem WhatsApp
4. Certifique-se de que não está enviando para números bloqueados

### Problema: QR Code não aparece

**Solução:**
1. Verifique se a porta 8080 está acessível
2. Tente gerar um novo QR Code:
   ```bash
   curl -X GET http://localhost:8080/instance/connect/minha-loja \
     -H "apikey: sua-chave-secreta-aqui"
   ```
3. Limpe o cache do navegador

---

## 📚 Recursos Adicionais

### Documentação Oficial da Evolution API

- **GitHub**: https://github.com/EvolutionAPI/evolution-api
- **Documentação**: https://doc.evolution-api.com/
- **Discord**: https://discord.gg/evolutionapi

### Comandos Úteis

```bash
# Listar todas as instâncias
curl -X GET http://localhost:8080/instance/fetchInstances \
  -H "apikey: sua-chave-secreta-aqui"

# Verificar status de uma instância
curl -X GET http://localhost:8080/instance/connectionState/minha-loja \
  -H "apikey: sua-chave-secreta-aqui"

# Desconectar uma instância
curl -X DELETE http://localhost:8080/instance/logout/minha-loja \
  -H "apikey: sua-chave-secreta-aqui"

# Deletar uma instância
curl -X DELETE http://localhost:8080/instance/delete/minha-loja \
  -H "apikey: sua-chave-secreta-aqui"

# Reiniciar uma instância
curl -X PUT http://localhost:8080/instance/restart/minha-loja \
  -H "apikey: sua-chave-secreta-aqui"
```

---

## ✅ Checklist de Configuração

- [ ] Evolution API instalada e rodando
- [ ] API Key configurada no docker-compose
- [ ] Instância criada na Evolution API
- [ ] WhatsApp conectado à instância (status: `open`)
- [ ] Variáveis de ambiente configuradas no `.env` do MontShop:
  - [ ] `EVOLUTION_API_URL`
  - [ ] `EVOLUTION_API_KEY`
  - [ ] `EVOLUTION_INSTANCE`
- [ ] API do MontShop reiniciada
- [ ] Teste de envio de mensagem realizado com sucesso

---

## 🎉 Pronto!

Após seguir todos os passos, você terá:
- ✅ Evolution API rodando e conectada ao WhatsApp
- ✅ MontShop configurado para enviar mensagens
- ✅ Sistema de cobrança funcionando via WhatsApp

Agora você pode usar os endpoints de cobrança do MontShop e as mensagens serão enviadas automaticamente via WhatsApp! 🚀

