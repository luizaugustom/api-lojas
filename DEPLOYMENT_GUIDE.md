# Guia de Deploy e Produção - API Lojas SaaS

Este guia contém todas as instruções necessárias para colocar a API Lojas SaaS em produção de forma segura e eficiente.

## 📋 Pré-requisitos

### Servidor
- Ubuntu 20.04 LTS ou superior
- Mínimo 4GB RAM
- Mínimo 2 CPU cores
- Mínimo 50GB SSD
- Node.js 18.x ou superior
- PostgreSQL 13 ou superior
- Nginx (opcional, mas recomendado)

### Domínio e SSL
- Domínio configurado
- Certificado SSL (Let's Encrypt recomendado)
- DNS configurado

## 🚀 Passo a Passo para Deploy

### 1. Preparação do Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
sudo apt install -y curl wget git build-essential

# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Instalar Nginx
sudo apt install -y nginx

# Instalar PM2 (Process Manager)
sudo npm install -g pm2

# Instalar Certbot (para SSL)
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Configuração do PostgreSQL

```bash
# Acessar PostgreSQL
sudo -u postgres psql

# Criar banco de dados
CREATE DATABASE api_lojas_production;

# Criar usuário
CREATE USER api_lojas_user WITH PASSWORD 'sua_senha_segura';

# Conceder privilégios
GRANT ALL PRIVILEGES ON DATABASE api_lojas_production TO api_lojas_user;

# Sair do PostgreSQL
\q
```

### 3. Deploy da Aplicação

```bash
# Criar usuário para a aplicação
sudo useradd -m -s /bin/bash api-lojas
sudo usermod -aG sudo api-lojas

# Mudar para o usuário da aplicação
sudo su - api-lojas

# Criar diretório da aplicação
mkdir -p /home/api-lojas/app
cd /home/api-lojas/app

# Clonar repositório (substitua pela URL do seu repositório)
git clone https://github.com/seu-usuario/api-lojas-saas.git .

# Instalar dependências
npm ci --only=production

# Gerar cliente Prisma
npx prisma generate

# Executar migrações
npx prisma migrate deploy

# Executar seed (opcional)
npx prisma db seed
```

### 4. Configuração de Variáveis de Ambiente

```bash
# Criar arquivo .env
nano .env
```

```env
# Database
DATABASE_URL="postgresql://api_lojas_user:sua_senha_segura@localhost:5432/api_lojas_production?schema=public"

# JWT
JWT_SECRET="sua_chave_jwt_super_secreta_aqui"
JWT_EXPIRES_IN="24h"

# App
PORT=3000
NODE_ENV="production"

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH="/home/api-lojas/app/uploads"

# Email (para notificações)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-de-app"

# WhatsApp Integration
WHATSAPP_API_URL="https://api.whatsapp.com"
WHATSAPP_TOKEN="seu-token-whatsapp"

# N8N Integration
N8N_WEBHOOK_URL="https://seu-n8n-instance.com/webhook"

# Printer Settings
PRINTER_TIMEOUT=5000
PRINTER_RETRY_ATTEMPTS=3

# Fiscal Integration
FISCAL_API_URL="https://api.fiscal.com.br"
FISCAL_API_KEY="sua-chave-fiscal"
FISCAL_CERTIFICATE_PATH="/home/api-lojas/app/certificates/cert.p12"
FISCAL_CERTIFICATE_PASSWORD="sua-senha-certificado"

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Security
CORS_ORIGIN="https://seu-dominio.com"
BCRYPT_ROUNDS=12
```

### 5. Configuração do PM2

```bash
# Criar arquivo de configuração do PM2
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'api-lojas-saas',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/api-lojas/logs/err.log',
    out_file: '/home/api-lojas/logs/out.log',
    log_file: '/home/api-lojas/logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

```bash
# Criar diretório de logs
mkdir -p /home/api-lojas/logs

# Iniciar aplicação com PM2
pm2 start ecosystem.config.js

# Configurar PM2 para iniciar automaticamente
pm2 startup
pm2 save
```

### 6. Configuração do Nginx

```bash
# Criar configuração do Nginx
sudo nano /etc/nginx/sites-available/api-lojas-saas
```

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com www.seu-dominio.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    # API Routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static Files
    location /uploads/ {
        alias /home/api-lojas/app/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # File Upload Size
    client_max_body_size 10M;
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/api-lojas-saas /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### 7. Configuração do SSL

```bash
# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Configurar renovação automática
sudo crontab -e
# Adicionar linha:
0 12 * * * /usr/bin/certbot renew --quiet
```

### 8. Configuração do Firewall

```bash
# Configurar UFW
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 5432  # PostgreSQL (apenas se necessário acesso externo)
sudo ufw --force enable
```

### 9. Configuração de Backup

```bash
# Criar script de backup
nano /home/api-lojas/backup.sh
```

```bash
#!/bin/bash

# Configurações
DB_NAME="api_lojas_production"
DB_USER="api_lojas_user"
BACKUP_DIR="/home/api-lojas/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup do banco de dados
pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Backup dos uploads
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz /home/api-lojas/app/uploads

# Remover backups antigos (manter últimos 7 dias)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup concluído em $(date)"
```

```bash
# Tornar executável
chmod +x /home/api-lojas/backup.sh

# Configurar cron para backup diário
crontab -e
# Adicionar linha:
0 2 * * * /home/api-lojas/backup.sh
```

### 10. Configuração de Monitoramento

```bash
# Instalar ferramentas de monitoramento
sudo apt install -y htop iotop nethogs

# Configurar logrotate
sudo nano /etc/logrotate.d/api-lojas-saas
```

```
/home/api-lojas/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 api-lojas api-lojas
    postrotate
        pm2 reloadLogs
    endscript
}
```

## 🔧 Comandos Úteis para Produção

### Gerenciamento da Aplicação

```bash
# Ver status da aplicação
pm2 status

# Ver logs em tempo real
pm2 logs api-lojas-saas

# Reiniciar aplicação
pm2 restart api-lojas-saas

# Parar aplicação
pm2 stop api-lojas-saas

# Verificar uso de recursos
pm2 monit
```

### Gerenciamento do Banco de Dados

```bash
# Executar migrações
npx prisma migrate deploy

# Gerar novo cliente Prisma
npx prisma generate

# Abrir Prisma Studio (apenas para desenvolvimento)
npx prisma studio
```

### Gerenciamento de Logs

```bash
# Ver logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Ver logs da aplicação
tail -f /home/api-lojas/logs/combined.log
```

## 🚨 Troubleshooting

### Aplicação não inicia

1. Verificar logs: `pm2 logs api-lojas-saas`
2. Verificar variáveis de ambiente
3. Verificar conexão com banco de dados
4. Verificar portas disponíveis

### Problemas de SSL

1. Verificar certificados: `sudo certbot certificates`
2. Renovar certificados: `sudo certbot renew`
3. Verificar configuração do Nginx

### Problemas de Performance

1. Verificar uso de CPU/RAM: `htop`
2. Verificar logs de erro
3. Verificar configuração do PM2
4. Considerar escalonamento horizontal

### Problemas de Banco de Dados

1. Verificar conexão: `sudo -u postgres psql -d api_lojas_production`
2. Verificar logs: `sudo tail -f /var/log/postgresql/postgresql-13-main.log`
3. Verificar espaço em disco

## 📊 Monitoramento e Métricas

### Configurar Uptime Monitoring

Use serviços como:
- UptimeRobot
- Pingdom
- StatusCake

### Configurar Logs Centralizados

Considere usar:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Grafana + Loki
- CloudWatch (AWS)

### Configurar Alertas

Configure alertas para:
- Uso de CPU > 80%
- Uso de RAM > 90%
- Espaço em disco < 10%
- Aplicação offline
- Erros 5xx

## 🔒 Segurança em Produção

### 1. Atualizações de Segurança

```bash
# Script para atualizações automáticas
nano /home/api-lojas/update.sh
```

```bash
#!/bin/bash

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Atualizar dependências Node.js
cd /home/api-lojas/app
npm audit fix
npm update

# Reiniciar aplicação
pm2 restart api-lojas-saas

echo "Atualizações concluídas em $(date)"
```

### 2. Configuração de Firewall Avançada

```bash
# Configurar fail2ban
sudo apt install -y fail2ban

# Configurar fail2ban para Nginx
sudo nano /etc/fail2ban/jail.local
```

```
[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
```

### 3. Backup Seguro

Configure backup para:
- Serviço de cloud (AWS S3, Google Cloud Storage)
- Servidor remoto
- Mídia física (opcional)

## 📈 Escalonamento

### Escalonamento Vertical

Aumente recursos do servidor:
- Mais RAM
- Mais CPU
- SSD mais rápido

### Escalonamento Horizontal

Configure load balancer com múltiplas instâncias:
- Nginx como load balancer
- Múltiplas instâncias da aplicação
- Banco de dados em cluster (PostgreSQL)

### Escalonamento de Banco de Dados

- Read replicas
- Connection pooling (PgBouncer)
- Sharding (se necessário)

## 🎯 Otimizações de Performance

### 1. Otimização do Node.js

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'api-lojas-saas',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    node_args: '--max-old-space-size=2048 --optimize-for-size',
    // ... outras configurações
  }]
};
```

### 2. Otimização do Nginx

```nginx
# Adicionar ao server block
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}

# Enable HTTP/2
listen 443 ssl http2;

# Enable gzip
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### 3. Otimização do PostgreSQL

```sql
-- Configurações recomendadas para produção
-- /etc/postgresql/13/main/postgresql.conf

shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

## 📞 Suporte e Manutenção

### Contatos de Emergência

- Administrador do Sistema: [seu-contato]
- Desenvolvedor: [contato-dev]
- Suporte Técnico: [contato-suporte]

### Procedimentos de Emergência

1. **Aplicação offline**: Verificar PM2, Nginx, logs
2. **Banco de dados**: Verificar PostgreSQL, conexões, espaço
3. **Alto uso de recursos**: Verificar processos, otimizar
4. **Ataques**: Verificar logs, bloquear IPs, fail2ban

### Manutenção Preventiva

- Backup diário
- Atualizações de segurança semanais
- Monitoramento contínuo
- Testes de performance mensais
- Auditoria de segurança trimestral

---

## ✅ Checklist de Deploy

- [ ] Servidor configurado
- [ ] PostgreSQL instalado e configurado
- [ ] Aplicação deployada
- [ ] Variáveis de ambiente configuradas
- [ ] PM2 configurado
- [ ] Nginx configurado
- [ ] SSL configurado
- [ ] Firewall configurado
- [ ] Backup configurado
- [ ] Monitoramento configurado
- [ ] Testes realizados
- [ ] Documentação atualizada

---

**🎉 Parabéns! Sua API Lojas SaaS está em produção!**

Para dúvidas ou problemas, consulte esta documentação ou entre em contato com o suporte técnico.
