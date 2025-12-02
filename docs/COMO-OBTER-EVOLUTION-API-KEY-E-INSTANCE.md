# 🔑 Como Obter EVOLUTION_API_KEY e EVOLUTION_INSTANCE

## 📋 Resumo Rápido

- **EVOLUTION_API_KEY**: Você mesmo define essa chave no docker-compose da Evolution API
- **EVOLUTION_INSTANCE**: Você cria uma instância na Evolution API e escolhe o nome

---

## 🚀 Passo a Passo Completo

### Passo 1: Instalar a Evolution API

Primeiro, você precisa instalar a Evolution API. A forma mais fácil é usando Docker.

#### 1.1. Criar pasta para a Evolution API

```bash
mkdir evolution-api
cd evolution-api
```

#### 1.2. Criar arquivo `docker-compose.yml`

Crie um arquivo chamado `docker-compose.yml` com o seguinte conteúdo:

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
      SERVER_URL: http://localhost:8080
      PORT: 8080
      
      # Banco de dados
      DATABASE_ENABLED: true
      DATABASE_PROVIDER: sqlite
      DATABASE_NAME: evolution
      
      # 🔑 AQUI VOCÊ DEFINE SUA API KEY (escolha uma chave forte e segura)
      AUTHENTICATION_API_KEY: minha-chave-super-secreta-123456
      AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES: true
      
      # Configurações de QR Code
      QRCODE_LIMIT: 30
      QRCODE_COLOR: '#198754'
      
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

**⚠️ IMPORTANTE:** 
- Altere `AUTHENTICATION_API_KEY: minha-chave-super-secreta-123456` para uma chave forte e única
- Exemplo de chave segura: `EvoAPI-2024-ABC123-XYZ789-SECRET`
- Use uma chave com pelo menos 20 caracteres

#### 1.3. Iniciar a Evolution API

```bash
docker-compose up -d
```

Verificar se está rodando:
```bash
docker-compose ps
```

A Evolution API estará disponível em: `http://localhost:8080`

---

### Passo 2: Obter a EVOLUTION_API_KEY

A **EVOLUTION_API_KEY** é a mesma chave que você definiu no `docker-compose.yml` na variável `AUTHENTICATION_API_KEY`.

**Exemplo:**
- No `docker-compose.yml`: `AUTHENTICATION_API_KEY: minha-chave-super-secreta-123456`
- No `.env` do MontShop: `EVOLUTION_API_KEY=minha-chave-super-secreta-123456`

**⚠️ IMPORTANTE:** As duas chaves devem ser **exatamente iguais**!

---

### Passo 3: Criar uma Instância (EVOLUTION_INSTANCE)

Você precisa criar uma instância do WhatsApp na Evolution API. O nome que você escolher será o valor de `EVOLUTION_INSTANCE`.

#### Opção A: Via Interface Web (Mais Fácil)

1. Acesse `http://localhost:8080` no navegador
2. Você verá uma interface para criar instâncias
3. Digite um nome para a instância (ex: `minha-loja`, `loja-1`, `montshop`)
4. Clique em "Criar" ou "Create Instance"
5. Um QR Code aparecerá
6. Escaneie o QR Code com seu WhatsApp:
   - Abra o WhatsApp no celular
   - Vá em **Configurações > Aparelhos conectados > Conectar um aparelho**
   - Escaneie o QR Code

**O nome que você digitou é o valor de `EVOLUTION_INSTANCE`!**

#### Opção B: Via API (Linha de Comando)

```bash
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: minha-chave-super-secreta-123456" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "minha-loja",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

**Substitua:**
- `minha-chave-super-secreta-123456` pela sua API Key
- `minha-loja` pelo nome que você quer dar à instância

**Resposta:**
```json
{
  "instance": {
    "instanceName": "minha-loja",
    "status": "created"
  },
  "qrcode": {
    "code": "data:image/png;base64,..."
  }
}
```

---

### Passo 4: Verificar se a Instância Está Conectada

Após escanear o QR Code, verifique o status:

```bash
curl -X GET http://localhost:8080/instance/fetchInstances \
  -H "apikey: minha-chave-super-secreta-123456"
```

A instância deve aparecer com `status: "open"` quando conectada.

---

### Passo 5: Configurar no MontShop

Agora que você tem as informações, configure no arquivo `.env` do projeto `api-lojas`:

```env
# Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=minha-chave-super-secreta-123456
EVOLUTION_INSTANCE=minha-loja
```

**⚠️ LEMBRE-SE:**
- `EVOLUTION_API_KEY` deve ser **exatamente igual** ao `AUTHENTICATION_API_KEY` do docker-compose
- `EVOLUTION_INSTANCE` deve ser **exatamente igual** ao nome da instância que você criou
- `EVOLUTION_API_URL` deve ser a URL onde a Evolution API está rodando (sem barra no final)

---

## 📝 Exemplo Completo

### 1. No docker-compose.yml da Evolution API:
```yaml
AUTHENTICATION_API_KEY: EvoAPI-2024-ABC123-XYZ789-SECRET
```

### 2. Criar instância chamada "montshop":
```bash
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: EvoAPI-2024-ABC123-XYZ789-SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "montshop",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

### 3. No .env do MontShop:
```env
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=EvoAPI-2024-ABC123-XYZ789-SECRET
EVOLUTION_INSTANCE=montshop
```

---

## ✅ Verificar se Está Funcionando

Após configurar, teste o endpoint de status:

```bash
curl -X GET http://localhost:3000/whatsapp/status \
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

---

## 🔍 Troubleshooting

### Problema: "Evolution API não configurada"

**Solução:** Verifique se as 3 variáveis estão no `.env`:
- `EVOLUTION_API_URL`
- `EVOLUTION_API_KEY`
- `EVOLUTION_INSTANCE`

### Problema: "401 Unauthorized" ou "API Key inválida"

**Solução:** 
- Verifique se `EVOLUTION_API_KEY` é **exatamente igual** ao `AUTHENTICATION_API_KEY` do docker-compose
- Não pode ter espaços extras ou diferenças de maiúsculas/minúsculas

### Problema: "Instância não encontrada"

**Solução:**
1. Liste as instâncias disponíveis:
```bash
curl -X GET http://localhost:8080/instance/fetchInstances \
  -H "apikey: sua-api-key"
```

2. Verifique se o nome em `EVOLUTION_INSTANCE` corresponde **exatamente** ao nome da instância criada

### Problema: "Instância não está conectada"

**Solução:**
1. Verifique se escaneou o QR Code corretamente
2. Verifique o status da instância:
```bash
curl -X GET http://localhost:8080/instance/connectionState/minha-loja \
  -H "apikey: sua-api-key"
```

3. Se necessário, gere um novo QR Code:
```bash
curl -X GET http://localhost:8080/instance/connect/minha-loja \
  -H "apikey: sua-api-key"
```

---

## 🎉 Pronto!

Agora você tem:
- ✅ `EVOLUTION_API_KEY` - A chave que você definiu no docker-compose
- ✅ `EVOLUTION_INSTANCE` - O nome da instância que você criou

Configure essas variáveis no `.env` do MontShop e o sistema estará pronto para enviar mensagens! 🚀
