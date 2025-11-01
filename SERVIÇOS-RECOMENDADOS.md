# 🗄️ Serviços Recomendados para Produção

Guia rápido de serviços recomendados para hospedar a API MontShop e seu banco de dados.

---

## 🗄️ Banco de Dados PostgreSQL

### 🥇 1. Supabase (Mais Recomendado)
- **Custo**: Gratuito (Free) ou US$ 25/mês (Pro)
- **Plano Free**: 500MB storage, 2GB transfer
- **Vantagens**:
  - ✅ PostgreSQL gerenciado
  - ✅ Dashboard excelente
  - ✅ Row-level security
  - ✅ APIs auto-geradas
  - ✅ Auth built-in
  - ✅ Storage integrado
  - ✅ Realtime subscriptions
- **Link**: [supabase.com](https://supabase.com)
- **Quando usar**: Produção de qualquer tamanho

**Como configurar**:
1. Crie uma conta no Supabase
2. Crie um novo projeto
3. Copie a Connection String
4. Configure `DATABASE_URL` na sua API

---

### 🥈 2. Neon (Serverless PostgreSQL)
- **Custo**: Gratuito (Free) ou US$ 19/mês (Launch)
- **Plano Free**: 3GB storage, 5GB transfer
- **Vantagens**:
  - ✅ Serverless (scale-to-zero)
  - ✅ Branching (copiar banco instantaneamente)
  - ✅ Performance excelente
  - ✅ Autoscaling
- **Link**: [neon.tech](https://neon.tech)
- **Quando usar**: Ambientes que precisam escalar automaticamente

**Como configurar**:
1. Crie uma conta no Neon
2. Crie um projeto
3. Copie a Connection String
4. Configure `DATABASE_URL` na sua API

---

### 🥉 3. Render PostgreSQL
- **Custo**: Gratuito (testes) ou US$ 7/mês (Starter)
- **Plano Starter**: 1GB RAM, 10GB disco
- **Vantagens**:
  - ✅ Integração fácil com Render
  - ✅ Backup automático diário
  - ✅ SSL incluído
  - ✅ Preço acessível
- **Desvantagens**:
  - ⚠️ Free expira após 90 dias inativos
- **Link**: Já incluído no [render.com](https://render.com)
- **Quando usar**: Combinado com Render para hospedagem da API

---

### 4. DigitalOcean Managed Database
- **Custo**: US$ 15/mês (Starter)
- **Plano Starter**: 1GB RAM, 10GB SSD
- **Vantagens**:
  - ✅ SSD high-performance
  - ✅ Backups diários
  - ✅ Alta disponibilidade opcional
  - ✅ Integração com App Platform
- **Link**: [digitalocean.com](https://digitalocean.com)
- **Quando usar**: Produção com necessidade de performance

---

### 5. AWS RDS PostgreSQL
- **Custo**: ~US$ 25/mês (db.t3.micro)
- **Vantagens**:
  - ✅ AWS ecosystem completo
  - ✅ Alta disponibilidade
  - ✅ Multi-região
  - ✅ Enterprise-grade
- **Desvantagens**:
  - ❌ Preço mais alto
  - ❌ Curva de aprendizado
- **Link**: [aws.amazon.com](https://aws.amazon.com)
- **Quando usar**: Grandes empresas já usando AWS

---

## 🖥️ Hospedagem da API

### 🥇 1. Render (Mais Recomendado para Começar)
- **Custo**: Gratuito (testes) ou US$ 7/mês (Starter)
- **Plano Starter**: 512MB RAM, 1GB SSD
- **Vantagens**:
  - ✅ Deploy automático do GitHub
  - ✅ SSL grátis
  - ✅ Fácil configuração
  - ✅ Health checks automáticos
  - ✅ Logs em tempo real
- **Desvantagens**:
  - ⚠️ Free pode dormir após 15 min inativo
- **Link**: [render.com](https://render.com)
- **Quando usar**: Começar com produção simples

**Setup**: Veja `GUIA-DEPLOY-PRODUCAO.md`

---

### 🥈 2. Railway
- **Custo**: Gratuito (US$ 5 créditos/mês) ou US$ 20/mês (Pro)
- **Vantagens**:
  - ✅ Deploy super rápido
  - ✅ PostgreSQL incluído
  - ✅ Preview deploys
  - ✅ Logs excelentes
  - ✅ Serviços integrados
- **Link**: [railway.app](https://railway.app)
- **Quando usar**: Protótipos e MVPs rápidos

**Como configurar**:
1. Login com GitHub
2. New Project → Deploy from GitHub
3. Selecione o repositório
4. Adicione PostgreSQL database
5. Configure variáveis de ambiente

---

### 🥉 3. Fly.io
- **Custo**: Generous free tier
- **Vantagens**:
  - ✅ Edge computing
  - ✅ Multi-região
  - ✅ Global distribution
  - ✅ Containers Docker nativos
  - ✅ Free tier generoso
- **Link**: [fly.io](https://fly.io)
- **Quando usar**: Aplicações que precisam de baixa latência global

**Como configurar**:
```bash
# Instale Fly CLI
npm install -g flyctl

# Login
flyctl auth login

# Deploy
cd api-lojas
flyctl launch

# Configure secrets
flyctl secrets set DATABASE_URL="..."
```

---

### 4. DigitalOcean App Platform
- **Custo**: US$ 5/mês (Basic)
- **Plano Basic**: 512MB RAM, 1GB SSD
- **Vantagens**:
  - ✅ Escalável
  - ✅ Integração com managed databases
  - ✅ Spaces para storage
  - ✅ Certificates automáticos
- **Link**: [digitalocean.com](https://digitalocean.com)
- **Quando usar**: Produção com necessidade de escalar

---

### 5. AWS Elastic Beanstalk / ECS
- **Custo**: Pago por uso (complexo)
- **Vantagens**:
  - ✅ Integração com todo ecosystem AWS
  - ✅ Auto-scaling
  - ✅ Load balancing
  - ✅ Enterprise-grade
- **Desvantagens**:
  - ❌ Complexo de configurar
  - ❌ Precisa conhecimento AWS
- **Link**: [aws.amazon.com](https://aws.amazon.com)
- **Quando usar**: Grandes aplicações enterprise

---

## 🔐 Armazenamento de Imagens

### Firebase Storage (Atual)
- **Custo**: Free até 5GB, depois pago
- **Vantagens**: Já integrado na API
- **Status**: ✅ Configurado

### Alternativa: Cloudinary
- **Custo**: Free até 25GB/mês, depois pago
- **Vantagens**: Transformação de imagens automática
- **Link**: [cloudinary.com](https://cloudinary.com)

---

## 📧 Email (SMTP)

### Gmail (Atual)
- **Custo**: Gratuito
- **Limitações**: 500 emails/dia
- **Status**: ✅ Configurado

### Alternativa: SendGrid
- **Custo**: Free até 100 emails/dia
- **Link**: [sendgrid.com](https://sendgrid.com)

### Alternativa: Resend
- **Custo**: Free até 3.000 emails/mês
- **Vantagens**: API moderna, React Email
- **Link**: [resend.com](https://resend.com)

---

## 💰 Comparação de Custos

### Plano Básico (Testes)
| Serviço | Banco | API | Total/mês |
|---------|-------|-----|-----------|
| Render + Render DB | Free | Free | **Grátis** |
| Railway | Free | Free | **Grátis** |
| Fly.io + Supabase | Free | Free | **Grátis** |

### Plano Produção Pequeno
| Serviço | Banco | API | Total/mês |
|---------|-------|-----|-----------|
| Render + Render DB | US$ 7 | US$ 7 | **US$ 14** |
| Railway + Railway DB | US$ 5 | US$ 5 | **~US$ 10** |
| Fly.io + Supabase | Free | Free | **Grátis** |
| DigitalOcean | US$ 15 | US$ 5 | **US$ 20** |

### Plano Produção Médio
| Serviço | Banco | API | Total/mês |
|---------|-------|-----|-----------|
| Supabase + Render | US$ 25 | US$ 7 | **US$ 32** |
| Neon + Fly.io | US$ 19 | Free | **US$ 19** |
| DigitalOcean | US$ 15 | US$ 12 | **US$ 27** |

---

## 🎯 Recomendações por Caso de Uso

### 🚀 Começando Agora (Gratuito)
- **API**: Render Free
- **Banco**: Supabase Free
- **Total**: **US$ 0/mês**
- **Quando upgrade**: Quando tiver tráfego real

### 💼 Pequena Produção
- **API**: Render Starter (US$ 7/mês)
- **Banco**: Supabase Free ou Neon Free
- **Total**: **US$ 7/mês**
- **Quando upgrade**: Quando precisar de mais performance

### 🏢 Produção Média
- **API**: Render Starter (US$ 7/mês)
- **Banco**: Supabase Pro (US$ 25/mês)
- **Total**: **US$ 32/mês**
- **Vantagens**: Database dashboard excelente, auth integrado

### 🌍 Produção Global
- **API**: Fly.io (Free ou Pro)
- **Banco**: Neon (US$ 19/mês)
- **Total**: **US$ 19-39/mês**
- **Vantagens**: Edge computing, baixa latência

### 🏭 Enterprise
- **API**: AWS ECS
- **Banco**: AWS RDS
- **Total**: **Variável**
- **Vantagens**: Escala máxima, SLAs

---

## 📝 Checklist de Escolha

Use este checklist para escolher o melhor serviço:

### Para o Banco de Dados
- [ ] Preciso de dashboard amigável?
  - ✅ **Sim** → Supabase ou Neon
- [ ] Preciso de autoscaling?
  - ✅ **Sim** → Neon
- [ ] Preciso de auth integrado?
  - ✅ **Sim** → Supabase
- [ ] Quero grátis para começar?
  - ✅ **Sim** → Supabase Free ou Neon Free
- [ ] Preciso de baixa latência?
  - ✅ **Sim** → Neon ou DigitalOcean
- [ ] Preciso de AWS ecosystem?
  - ✅ **Sim** → AWS RDS

### Para a API
- [ ] Quero setup simples?
  - ✅ **Sim** → Render ou Railway
- [ ] Preciso de global edge?
  - ✅ **Sim** → Fly.io
- [ ] Preciso escalar muito?
  - ✅ **Sim** → DigitalOcean ou AWS
- [ ] Quero grátis para começar?
  - ✅ **Sim** → Render Free ou Railway Free
- [ ] Preciso de preview deploys?
  - ✅ **Sim** → Railway

---

## 🔗 Links Rápidos

### Bancos de Dados
- [Supabase](https://supabase.com)
- [Neon](https://neon.tech)
- [Render PostgreSQL](https://render.com)
- [DigitalOcean Databases](https://digitalocean.com)
- [AWS RDS](https://aws.amazon.com/rds)

### Hospedagem API
- [Render](https://render.com)
- [Railway](https://railway.app)
- [Fly.io](https://fly.io)
- [DigitalOcean App Platform](https://digitalocean.com)
- [AWS](https://aws.amazon.com)

---

**Última atualização**: Janeiro 2025

