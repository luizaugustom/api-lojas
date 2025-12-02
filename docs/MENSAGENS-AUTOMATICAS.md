# Sistema de Mensagens Automáticas de Cobrança

## Visão Geral

Sistema implementado para enviar mensagens automáticas via WhatsApp para clientes com parcelas a vencer ou vencidas.

## Funcionalidades

### 1. Envio Automático de Mensagens

- **No dia do vencimento**: Sistema envia mensagem lembrando o cliente sobre o pagamento
- **Parcelas atrasadas**: Mensagens são enviadas a cada 3 dias após o vencimento
- **Horário**: Mensagens são enviadas automaticamente às 7h da manhã (horário de Brasília)
- **Requisito**: Cliente deve ter telefone válido cadastrado

### 2. Controle por Empresa

Cada empresa pode:
- ✅ Ativar/desativar o envio automático de mensagens
- 📊 Visualizar estatísticas:
  - Número de parcelas não pagas
  - Total de mensagens enviadas
- 🔧 Gerenciar a configuração através da página de Configurações

## Estrutura Técnica

### Backend (NestJS)

#### 1. Schema do Prisma (`prisma/schema.prisma`)

**Tabela `companies`**:
```prisma
autoMessageEnabled  Boolean  @default(false) // Ativa/desativa envio automático
```

**Tabela `installments`**:
```prisma
lastMessageSentAt DateTime? // Data do último envio
messageCount      Int       @default(0) // Contador de mensagens
```

#### 2. Migration
- Arquivo: `prisma/migrations/20250128000001_add_auto_message_support/migration.sql`
- Adiciona os campos necessários nas tabelas

#### 3. Serviço de Mensagens
- Arquivo: `src/application/installment/installment-messaging.service.ts`
- **Principais funcionalidades**:
  - Cron job que executa diariamente às 7h (horário de Brasília)
  - Verifica parcelas não pagas de empresas ativas
  - Envia mensagens conforme regras definidas
  - Registra histórico de envios

#### 4. Endpoints da API

**Ativar mensagens automáticas**:
```
PATCH /company/my-company/auto-message/enable
```

**Desativar mensagens automáticas**:
```
PATCH /company/my-company/auto-message/disable
```

**Verificar status**:
```
GET /company/my-company/auto-message/status
```

Retorna:
```json
{
  "autoMessageEnabled": true,
  "totalUnpaidInstallments": 15,
  "totalMessagesSent": 45
}
```

### Frontend (Next.js)

#### Página de Configurações
- Arquivo: `front-lojas/src/app/(dashboard)/settings/page.tsx`
- Nova seção: "Mensagens Automáticas de Cobrança"
- **Recursos**:
  - Toggle para ativar/desativar
  - Visualização de estatísticas em tempo real
  - Informações sobre funcionamento
  - Exemplo visual da mensagem enviada

## Exemplos de Mensagens

### Vencimento Hoje
```
🔔 LEMBRETE DE PAGAMENTO

Olá, João Silva!

📅 HOJE É O VENCIMENTO da sua parcela 1/3 na loja Loja Exemplo.

💰 Valor: R$ 150,00

Por favor, dirija-se à loja para efetuar o pagamento e manter seu crédito em dia.

Agradecemos a sua preferência! 🙏
```

### Parcela Atrasada
```
⚠️ PAGAMENTO EM ATRASO

Olá, João Silva!

Sua parcela 1/3 na loja Loja Exemplo está 5 dia(s) atrasada.

📅 Vencimento: 23/01/2025
💰 Valor: R$ 150,00

Por favor, dirija-se à loja o quanto antes para regularizar sua situação e evitar transtornos.

Contamos com você! 🙏
```

## Lógica de Envio

### Condições para Envio

1. **Empresa tem o envio automático ativado**
2. **Empresa está ativa** (`isActive = true`)
3. **Parcela não está paga** (`isPaid = false`)
4. **Cliente tem telefone cadastrado** e válido
5. **Uma das condições abaixo é atendida**:
   - É o dia do vencimento E ainda não enviou mensagem hoje
   - É após o vencimento E passaram 3+ dias desde a última mensagem

### Rastreamento

- `lastMessageSentAt`: Data/hora do último envio
- `messageCount`: Contador incremental de mensagens enviadas
- Evita envios duplicados no mesmo dia
- Controla intervalo de 3 dias para parcelas atrasadas

## Configuração

### Requisitos

1. **Z-API** configurada
2. **Variáveis de ambiente** (`.env`):
```env
Z_API_URL=https://api.z-api.io
Z_API_INSTANCE_ID=seu-instance-id
Z_API_TOKEN=seu-token
```

Para mais detalhes, consulte: [WHATSAPP-PRODUCAO.md](./WHATSAPP-PRODUCAO.md)

### Ativação

1. Acesse: **Dashboard** → **Configurações**
2. Localize seção: **Mensagens Automáticas de Cobrança**
3. Clique em **Ativar**
4. Pronto! O sistema começará a enviar mensagens automaticamente

## Módulos Atualizados

### Backend
- ✅ `app.module.ts` - Adicionado `ScheduleModule`
- ✅ `installment.module.ts` - Adicionado `InstallmentMessagingService`
- ✅ `company.controller.ts` - Novos endpoints
- ✅ `company.service.ts` - Métodos de controle
- ✅ `whatsapp.service.ts` - Reutilizado para envio

### Frontend
- ✅ `settings/page.tsx` - Nova seção de controle

## Próximos Passos

- [x] Integrar com Z-API (WhatsApp Business API)
- [ ] Adicionar templates personalizáveis de mensagens
- [ ] Criar dashboard de análise de envios
- [ ] Permitir configurar horário de envio
- [ ] Adicionar envio manual para parcelas específicas
- [ ] Implementar relatório de efetividade das mensagens

## Suporte

Para dúvidas ou problemas, consulte:
- Documentação do NestJS Schedule: https://docs.nestjs.com/techniques/task-scheduling
- Documentação da Z-API: https://developer.z-api.io/
- [WHATSAPP-PRODUCAO.md](./WHATSAPP-PRODUCAO.md) - Guia completo de configuração

