# 🚀 Configuração WhatsApp para Produção

## Visão Geral

O sistema de envio de mensagens WhatsApp está configurado para produção com suporte a múltiplas APIs. A **Z-API** é recomendada como principal provider por oferecer o melhor custo-benefício para mensagens automáticas de cobrança.

## 📋 API Utilizada

### Z-API ⭐

**Vantagens:**
- ✅ Melhor custo-benefício
- ✅ API estável e confiável
- ✅ Suporte oficial no Brasil
- ✅ Ideal para mensagens automáticas de cobrança
- ✅ Fácil integração
- ✅ Pronta para produção

**Custo:** Consulte em https://developer.z-api.io/

## 🔧 Configuração

### Configurar Z-API

1. **Criar conta na Z-API**
   - Acesse: https://developer.z-api.io/
   - Crie uma conta e obtenha suas credenciais

2. **Criar instância**
   - Crie uma nova instância na plataforma Z-API
   - Anote o `INSTANCE_ID` e o `TOKEN`

3. **Configurar variáveis de ambiente**

   Adicione no arquivo `.env` do projeto `api-lojas`:

   ```env
   # Z-API
   Z_API_URL=https://api.z-api.io
   Z_API_INSTANCE_ID=seu-instance-id-aqui
   Z_API_TOKEN=seu-token-aqui
   ```

4. **Conectar WhatsApp**
   - Siga as instruções da Z-API para conectar seu número de WhatsApp
   - Geralmente envolve escanear um QR Code

## ✅ Verificação

Após configurar, reinicie a aplicação e verifique os logs:

```
✅ Z-API configurada como provider de WhatsApp
Z-API configurada: https://api.z-api.io (Instance: seu-instance-id)
```

## 📨 Mensagens Automáticas de Cobrança

O sistema envia automaticamente mensagens de cobrança para:

1. **Parcelas vencendo hoje** - Envia mensagem no dia do vencimento
2. **Parcelas atrasadas** - Envia mensagem a cada 3 dias para parcelas vencidas

### Configuração do Cron Job

O envio automático é executado diariamente às **7h (horário de Brasília)**.

Para alterar o horário, edite o arquivo:
`api-lojas/src/application/installment/installment-messaging.service.ts`

```typescript
@Cron('0 7 * * *', {
  timeZone: 'America/Sao_Paulo',
})
```

### Rate Limiting

O sistema possui rate limiting configurado:
- **Máximo de 50 mensagens por empresa por hora**
- Protege contra bloqueios do WhatsApp
- Respeita limites da API

## 🔍 Monitoramento

### Verificar Status da Conexão

O sistema verifica automaticamente se a instância está conectada antes de enviar mensagens. Os logs mostram:

```
✅ Instância WhatsApp conectada. Status: connected
```

### Logs de Envio

Cada mensagem enviada gera um log:

```
✅ Mensagem WhatsApp enviada com sucesso via Z-API | Destino: 5511999999999 | Tempo: 234ms
```

### Logs de Erro

Erros são registrados com detalhes:

```
❌ Erro ao enviar mensagem WhatsApp via Z-API | Destino: 5511999999999
📊 Detalhes do erro | Status: 400 | Resposta: {...}
```

## 🛠️ Troubleshooting

### Problema: "Instância não está conectada"

**Solução:**
1. Verifique se o WhatsApp está conectado na plataforma Z-API
2. Verifique as credenciais no `.env` (`Z_API_INSTANCE_ID` e `Z_API_TOKEN`)
3. Reinicie a aplicação

### Problema: "Mensagens não estão sendo enviadas"

**Solução:**
1. Verifique os logs para identificar o erro específico
2. Verifique se a empresa tem `autoMessageEnabled: true` e `autoMessageAllowed: true`
3. Verifique se há parcelas não pagas para enviar
4. Verifique o rate limiting (máximo 50 mensagens/hora por empresa)

### Problema: "Número de telefone inválido"

**Solução:**
1. Verifique se o número está no formato correto (DDD + número)
2. O sistema aceita formatos: `(11) 99999-9999`, `11999999999`, `+5511999999999`
3. O número será formatado automaticamente para `5511999999999`

## 📊 Estatísticas

O sistema registra estatísticas após cada execução do cron job:

```
✅ Verificação de parcelas concluída com sucesso
📈 Estatísticas: 15 mensagens enviadas, 2 falhas, 3 empresas processadas em 1234ms
```

## 🔒 Segurança

- ✅ Credenciais armazenadas em variáveis de ambiente
- ✅ Rate limiting para evitar spam
- ✅ Validação de números de telefone
- ✅ Retry logic para erros temporários
- ✅ Logs detalhados para auditoria

## 📚 Documentação Adicional

- [WHATSAPP-BILLING.md](./WHATSAPP-BILLING.md) - Endpoints de cobrança
- [MENSAGENS-AUTOMATICAS.md](./MENSAGENS-AUTOMATICAS.md) - Sistema de mensagens automáticas

## 💡 Dicas

1. **Para produção, use Z-API** - Melhor custo-benefício e estabilidade
2. **Monitore os logs regularmente** - Identifique problemas rapidamente
3. **Configure alertas** - Para quando a instância desconectar
4. **Teste antes de produção** - Use o endpoint de teste para validar
5. **Mantenha backups** - Das configurações e credenciais

## 🆘 Suporte

Em caso de problemas:
1. Verifique os logs da aplicação
2. Verifique a documentação da Z-API: https://developer.z-api.io/
3. Verifique se o WhatsApp está conectado na plataforma Z-API

