# Sistema de Email para Clientes

Este documento descreve o sistema de envio de emails implementado para notificar clientes sobre diferentes eventos no sistema.

## 📧 Funcionalidades Implementadas

### 1. Email de Boas-vindas
- **Quando é enviado**: Automaticamente quando um novo cliente é cadastrado com email
- **Conteúdo**: Mensagem de boas-vindas com informações sobre o que o cliente receberá

### 2. Email de Confirmação de Venda
- **Quando é enviado**: Automaticamente após uma venda ser realizada (se o cliente tiver email cadastrado)
- **Conteúdo**: Detalhes da compra, itens comprados, valores e informações da empresa

### 3. Email Promocional
- **Quando é enviado**: Manualmente através dos endpoints da API
- **Conteúdo**: Ofertas especiais, promoções e campanhas de marketing

## 🔧 Configuração

### Variáveis de Ambiente
Configure as seguintes variáveis no arquivo `.env`:

```env
# Email (para notificações)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-de-app"
```

### Configuração do Gmail
Para usar o Gmail como provedor SMTP:

1. Ative a verificação em duas etapas na sua conta Google
2. Gere uma "Senha de app" específica para esta aplicação
3. Use essa senha no campo `SMTP_PASS`

## 📋 Endpoints da API

### 1. Enviar Email Promocional para Cliente Específico
```http
POST /customer/{id}/send-promotional-email
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Oferta Especial - 20% OFF",
  "message": "Aproveite nossa oferta especial!",
  "description": "Desconto válido em todos os produtos",
  "discount": "20% de desconto",
  "validUntil": "2024-12-31"
}
```

### 2. Enviar Confirmação de Venda por Email
```http
POST /customer/{id}/send-sale-confirmation/{saleId}
Authorization: Bearer {token}
```

### 3. Enviar Email Promocional em Massa
```http
POST /customer/send-bulk-promotional-email
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Black Friday - 50% OFF",
  "message": "Não perca nossa Black Friday!",
  "description": "Ofertas imperdíveis em todos os produtos",
  "discount": "Até 50% de desconto",
  "validUntil": "2024-11-30"
}
```

## 🎨 Templates de Email

### Template de Boas-vindas
- Design responsivo com cores da empresa
- Lista de benefícios que o cliente receberá
- Mensagem personalizada com nome do cliente

### Template de Confirmação de Venda
- Tabela detalhada com itens comprados
- Informações da venda (número, data, total)
- Dados da empresa (nome, endereço, contato)

### Template Promocional
- Design chamativo com cores de destaque
- Informações da promoção (desconto, validade)
- Call-to-action para incentivar a compra

## 🔄 Integração Automática

### Cadastro de Cliente
Quando um cliente é cadastrado com email:
1. Cliente é salvo no banco de dados
2. Email de boas-vindas é enviado automaticamente
3. Log de sucesso/falha é registrado

### Realização de Venda
Quando uma venda é realizada:
1. Venda é processada normalmente
2. Sistema busca cliente pelo CPF/CNPJ
3. Se cliente tiver email, confirmação é enviada
4. Processo não falha se email não for enviado

## 🧪 Testando o Sistema

### Script de Teste
Execute o script de teste para verificar o funcionamento:

```bash
node scripts/test-email-system.js
```

**Importante**: Antes de executar, configure:
- Email válido no script
- IDs de empresa, vendedor e produto existentes
- Credenciais SMTP válidas

### Teste Manual via API
1. Cadastre um cliente com email
2. Realize uma venda para esse cliente
3. Verifique se os emails foram enviados
4. Teste os endpoints de email promocional

## 📊 Monitoramento

### Logs
O sistema registra logs detalhados:
- Sucesso no envio de emails
- Falhas no envio (com detalhes do erro)
- Tentativas de envio para clientes sem email

### Tratamento de Erros
- Falhas no envio de email não interrompem operações principais
- Emails são enviados de forma assíncrona
- Sistema continua funcionando mesmo se SMTP estiver indisponível

## 🔒 Segurança

### Validação de Email
- Validação de formato de email no cadastro
- Verificação de existência do cliente antes do envio
- Controle de acesso baseado em roles (COMPANY/ADMIN)

### Rate Limiting
- Sistema respeita limites de envio do provedor SMTP
- Emails em massa são enviados sequencialmente para evitar spam

## 🚀 Melhorias Futuras

### Funcionalidades Planejadas
- [ ] Templates personalizáveis por empresa
- [ ] Agendamento de emails promocionais
- [ ] Relatórios de entrega de emails
- [ ] Integração com outros provedores de email
- [ ] Sistema de unsubscribe
- [ ] Segmentação de clientes para campanhas

### Otimizações
- [ ] Queue de emails para melhor performance
- [ ] Templates em cache
- [ ] Métricas de abertura e cliques
- [ ] A/B testing de templates

## 📞 Suporte

Para dúvidas ou problemas com o sistema de email:
1. Verifique os logs da aplicação
2. Confirme as configurações SMTP
3. Teste com o script fornecido
4. Consulte a documentação da API

---

**Nota**: Este sistema foi implementado para melhorar a comunicação com os clientes e automatizar notificações importantes. Certifique-se de seguir as melhores práticas de email marketing e respeitar as leis de proteção de dados.
