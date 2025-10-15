# API Lojas SaaS 🏪

Uma API completa para sistema SaaS de lojas com arquitetura DDD, Clean Code e todas as funcionalidades necessárias para um sistema de gestão comercial completo.

## 🚀 Funcionalidades

### 👥 Gestão de Usuários
- **Admin**: Gerenciamento completo do sistema e empresas
- **Empresa**: Gestão de vendedores, produtos, vendas e relatórios
- **Vendedor**: Criação de vendas e consulta de produtos

### 🛍️ Sistema de Vendas
- Vendas com múltiplas formas de pagamento
- Cálculo automático de troco
- Impressão automática de cupons
- Sistema de trocas e devoluções
- Histórico completo de vendas

### 📦 Gestão de Produtos
- CRUD completo de produtos
- Controle de estoque em tempo real
- Alertas de estoque baixo
- Categorização de produtos
- Upload de múltiplas fotos
- Códigos de barras únicos

### 👥 Gestão de Clientes
- Cadastro completo de clientes
- Histórico de compras
- Vendas a prazo
- Endereços completos

### 💰 Contas a Pagar
- Cadastro de contas
- Alertas de vencimento
- Códigos de barras para pagamento
- Controle de pagamentos

### 🏦 Fechamento de Caixa
- Abertura e fechamento de caixa
- Relatórios detalhados
- Impressão de relatórios
- Controle de saques

### 📊 Relatórios e Analytics
- Vendas por período
- Produtos mais vendidos
- Performance de vendedores
- Análise de formas de pagamento
- Exportação em PDF

### 🖨️ Integrações
- **Impressora Térmica**: USB, Network e Bluetooth
- **Leitor de Código de Barras**: Integração completa
- **Notas Fiscais**: NFe e NFSe (conforme legislação)
- **WhatsApp**: Notificações e comunicação
- **N8N**: Automação de workflows

## 🏗️ Arquitetura

### Domain-Driven Design (DDD)
- **Domain**: Entidades e regras de negócio
- **Application**: Casos de uso e serviços
- **Infrastructure**: Implementações técnicas
- **Presentation**: Controllers e DTOs

### Tecnologias
- **Backend**: NestJS 10.x
- **Database**: PostgreSQL com Prisma ORM
- **Authentication**: JWT com Passport
- **Validation**: Class Validator
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Security**: Helmet, CORS, Rate Limiting

## 📁 Estrutura do Projeto

```
src/
├── application/           # Camada de Aplicação
│   ├── auth/             # Autenticação
│   ├── admin/            # Gestão de administradores
│   ├── company/          # Gestão de empresas
│   ├── seller/           # Gestão de vendedores
│   ├── product/          # Gestão de produtos
│   ├── sale/             # Sistema de vendas
│   ├── customer/         # Gestão de clientes
│   ├── bill-to-pay/      # Contas a pagar
│   ├── cash-closure/     # Fechamento de caixa
│   ├── printer/          # Integração com impressoras
│   ├── fiscal/           # Notas fiscais
│   ├── upload/           # Upload de arquivos
│   ├── whatsapp/         # Integração WhatsApp
│   └── n8n/              # Integração N8N
├── infrastructure/       # Camada de Infraestrutura
│   └── database/         # Configuração do banco
├── shared/               # Recursos compartilhados
│   ├── decorators/       # Decorators personalizados
│   ├── guards/           # Guards de autenticação
│   └── pipes/            # Pipes de validação
└── main.ts               # Arquivo principal
```

## 🛠️ Instalação e Configuração

### Pré-requisitos
- Node.js 18.x ou superior
- PostgreSQL 13 ou superior
- npm ou yarn

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/api-lojas-saas.git
cd api-lojas-saas
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/api_lojas?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3000
```

### 4. Configure o banco de dados
```bash
# Gerar cliente Prisma
npx prisma generate

# Executar migrações
npx prisma migrate dev

# Popular banco com dados de exemplo
npx prisma db seed
```

### 5. Execute a aplicação
```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

## 📚 Documentação da API

A documentação completa da API está disponível via Swagger:

- **Desenvolvimento**: http://localhost:3000/api/docs
- **Produção**: https://your-domain.com/api/docs

### Endpoints Principais

#### Autenticação
- `POST /api/auth/login` - Login de usuários

#### Produtos
- `GET /api/product` - Listar produtos
- `POST /api/product` - Criar produto
- `GET /api/product/barcode/:barcode` - Buscar por código de barras

#### Vendas
- `GET /api/sale` - Listar vendas
- `POST /api/sale` - Criar venda
- `POST /api/sale/exchange` - Processar troca

#### Clientes
- `GET /api/customer` - Listar clientes
- `POST /api/customer` - Criar cliente

## 🧪 Testes

### Executar testes
```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Cobertura de testes
npm run test:cov
```

### Estrutura de testes
```
test/
├── unit/                 # Testes unitários
├── integration/          # Testes de integração
└── e2e/                 # Testes end-to-end
```

## 🚀 Deploy

### Desenvolvimento
```bash
npm run start:dev
```

### Produção
Consulte o [Guia de Deploy](DEPLOYMENT_GUIDE.md) para instruções detalhadas de deploy em produção.

### Docker
```bash
# Build da imagem
docker build -t api-lojas-saas .

# Executar container
docker run -p 3000:3000 api-lojas-saas
```

## 🔧 Scripts Disponíveis

```bash
npm run build              # Build da aplicação
npm run start              # Iniciar aplicação
npm run start:dev          # Iniciar em modo desenvolvimento
npm run start:debug        # Iniciar em modo debug
npm run start:prod         # Iniciar em modo produção
npm run lint               # Executar linter
npm run lint:fix           # Corrigir problemas do linter
npm run format             # Formatar código
npm run test               # Executar testes
npm run test:watch         # Executar testes em modo watch
npm run test:cov           # Executar testes com cobertura
npm run test:e2e           # Executar testes E2E
npm run db:generate        # Gerar cliente Prisma
npm run db:push            # Push do schema para o banco
npm run db:migrate         # Executar migrações
npm run db:studio          # Abrir Prisma Studio
npm run db:seed            # Popular banco com dados
```

## 🔐 Segurança

### Implementações de Segurança
- **JWT Authentication**: Tokens seguros com expiração
- **Role-based Access Control**: Controle de acesso por funções
- **Rate Limiting**: Proteção contra ataques de força bruta
- **CORS**: Configuração adequada de CORS
- **Helmet**: Headers de segurança
- **Input Validation**: Validação rigorosa de dados
- **SQL Injection Protection**: Proteção via Prisma ORM

### Boas Práticas
- Senhas hasheadas com bcrypt
- Tokens JWT com chaves seguras
- Validação de dados em todas as entradas
- Logs de auditoria
- Backup automático de dados

## 📊 Monitoramento

### Logs
- Logs estruturados com Winston
- Logs de auditoria para operações críticas
- Logs de performance
- Logs de erros com stack trace

### Métricas
- Tempo de resposta das APIs
- Uso de memória e CPU
- Número de requisições
- Taxa de erro

## 🔄 Integrações

### WhatsApp
- Envio de notificações de vendas
- Alertas de estoque baixo
- Lembretes de pagamento
- Relatórios de fechamento

### N8N
- Webhooks para automação
- Eventos em tempo real
- Workflows personalizados
- Integração com outros sistemas

### Impressoras Térmicas
- Suporte USB, Network e Bluetooth
- Impressão de cupons
- Relatórios de fechamento
- Teste de conectividade

### Notas Fiscais
- Emissão de NFe
- Emissão de NFSe
- Cancelamento de documentos
- Download de PDFs

## 📱 Frontend

### Next.js
Use o prompt em [prompts/FRONTEND_NEXTJS_PROMPT.md](prompts/FRONTEND_NEXTJS_PROMPT.md) para desenvolver o frontend web.

### React Native
Use o prompt em [prompts/REACT_NATIVE_PROMPT.md](prompts/REACT_NATIVE_PROMPT.md) para desenvolver o aplicativo móvel.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código
- Use TypeScript
- Siga as convenções do ESLint
- Escreva testes para novas funcionalidades
- Documente APIs com Swagger
- Use Conventional Commits

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

- **Documentação**: [Wiki do Projeto](docs/)
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/api-lojas-saas/issues)
- **Email**: suporte@api-lojas-saas.com

## 🎯 Roadmap

### Versão 2.0
- [ ] Integração com marketplaces
- [ ] Sistema de comissões avançado
- [ ] IA para previsão de demanda
- [ ] App mobile nativo
- [ ] Integração com contabilidade

### Versão 2.1
- [ ] Sistema de fidelidade
- [ ] Cupons e promoções
- [ ] Relatórios avançados
- [ ] Dashboard em tempo real
- [ ] Integração com ERPs

## 🙏 Agradecimentos

- NestJS Team pelo framework incrível
- Prisma Team pela ORM poderosa
- Comunidade open source pelas bibliotecas
- Todos os contribuidores do projeto

---

**Desenvolvido com ❤️ para revolucionar a gestão de lojas**
