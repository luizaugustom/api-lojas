# Reforma Tributária e Emissão de Notas Fiscais

## Status Atual da Implementação

### ✅ Implementado

1. **Cálculo de Tributos via IBPT**
   - Integração com API IBPT para cálculo preciso de tributos
   - Fallback para cálculo estimado quando IBPT não está disponível
   - Cálculo automático de tributos por item antes da emissão de NFC-e e NFe

2. **Preenchimento Correto de Campos Obrigatórios**
   - `valor_total_tributos` agora é calculado e preenchido corretamente
   - Tributos são calculados por item e somados para o total da nota
   - Campos de ICMS, PIS, COFINS são preenchidos conforme o regime tributário

3. **Validações Implementadas**
   - Validação de NCM (8 dígitos)
   - Validação de CFOP (4 dígitos)
   - Validação de CPF/CNPJ do cliente
   - Verificação de campos obrigatórios da empresa

### 📋 Cronograma da Reforma Tributária (PEC 45/2023)

A reforma tributária está sendo implementada em fases:

#### Fase 1: Validação em Homologação (desde 01/07/2025)
- SEFAZ disponibiliza ambiente de homologação com novos campos
- Empresas podem testar emissão de notas com novos campos
- **Status:** Aguardando implementação pela SEFAZ/Focus NFe

#### Fase 2: Emissão em Produção (desde 01/10/2025)
- Emissão em produção com novos campos será permitida (opcional)
- **Status:** Aguardando implementação pela SEFAZ/Focus NFe

#### Fase 3: Obrigatoriedade (a partir de 01/01/2026)
- Uso obrigatório dos novos campos
- Notas sem os novos campos serão rejeitadas
- **Status:** Implementação necessária até dezembro de 2025

### 🔄 Novos Campos da Reforma Tributária

#### Campos que Substituirão os Atuais:

1. **IBS - Imposto sobre Bens e Serviços**
   - Substitui: ICMS, ISS
   - Tipo: Imposto estadual/municipal unificado

2. **CBS - Contribuição sobre Bens e Serviços**
   - Substitui: PIS, COFINS
   - Tipo: Contribuição federal unificada

3. **IS - Imposto Seletivo**
   - Substitui: IPI
   - Tipo: Imposto seletivo sobre produtos específicos

### 📝 Preparação para Implementação Futura

O código já está preparado para incluir os novos campos:

- Interfaces TypeScript podem ser estendidas facilmente
- Cálculo de tributos via IBPT já fornece base para novos cálculos
- Estrutura modular permite adicionar novos campos sem quebrar código existente

### 🔧 Como Adicionar Suporte aos Novos Campos

Quando a SEFAZ/Focus NFe disponibilizar o novo layout:

1. **Atualizar Interfaces** (`fiscal-api.service.ts`):
   ```typescript
   // Adicionar campos aos itens e ao request
   valor_ibs?: number;
   valor_cbs?: number;
   valor_is?: number;
   ```

2. **Atualizar Cálculo de Tributos**:
   - IBPT já fornece dados por origem (federal, estadual, municipal)
   - Adaptar cálculo para distribuir entre IBS, CBS, IS

3. **Atualizar Payload das Notas**:
   - Adicionar novos campos no payload enviado ao Focus NFe
   - Manter compatibilidade com notas antigas durante período de transição

4. **Atualizar Validações**:
   - Adicionar validações para novos campos obrigatórios
   - Verificar regras específicas da reforma tributária

### 📚 Referências

- [Sindratarpe - Reforma Tributária](https://www.sindratarpe.org.br/2025/06/16/nota-fiscal-eletronica-nf-e-novas-regras-da-reforma-tributaria-comecam-a-ser-testadas-em-julho/)
- [Documentação Senior - Reforma Tributária](https://documentacao.senior.com.br/exigenciaslegais/noticias/federal/2025/2025-07-31-empresas-podem-testar-documentos-fiscais-eletronicos-que-serao-usados-com-implantacao-reforma-tributaria/)
- [Focus NFe - Documentação](https://focusnfe.com.br)

### ⚠️ Importante

- **Valor Total de Tributos**: Agora é calculado automaticamente via IBPT
- **Campos ICMS/PIS/COFINS**: Mantidos para compatibilidade até 2026
- **Novos Campos IBS/CBS/IS**: Serão implementados quando a SEFAZ disponibilizar

### 🔍 Verificações Implementadas

✅ Cálculo automático de tributos por item  
✅ Soma correta de tributos na nota  
✅ Preenchimento de `valor_total_tributos`  
✅ Validação de campos obrigatórios  
✅ Tratamento de erros no cálculo de tributos  
✅ Fallback para cálculo estimado quando IBPT indisponível  

### 📞 Suporte

Em caso de dúvidas sobre a implementação ou preparação para a reforma tributária, consulte:
- Documentação do Focus NFe
- Suporte técnico do IBPT
- Contador ou consultor tributário

