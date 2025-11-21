# Verificação Frontend e Desktop - Emissão de Notas Fiscais

## Resumo da Verificação

Realizada verificação completa das páginas de emissão de NFC-e e NFe no frontend (front-lojas) e desktop (montshop-desktop) para garantir que estão funcionais e sem erros em produção.

## ✅ Correções Realizadas

### 1. Validações de NCM e CFOP

**Problema identificado:**
- Validações não removiam formatação antes de verificar tamanho
- Permitia caracteres não numéricos

**Correção aplicada:**
- Remoção de formatação (apenas dígitos) antes de validar
- Validação estrita de tamanho:
  - CFOP: exatamente 4 dígitos numéricos (obrigatório)
  - NCM: exatamente 8 dígitos numéricos (opcional, mas se informado deve ser válido)

**Arquivos corrigidos:**
- `front-lojas/src/app/(dashboard)/invoices/page.tsx`
- `montshop-desktop/src/components/pages/InvoicesPage.tsx`

### 2. Validações de CPF/CNPJ

**Problema identificado:**
- Validação básica apenas verificava se estava preenchido
- Não removia formatação antes de validar
- Não verificava tamanho correto (11 para CPF, 14 para CNPJ)

**Correção aplicada:**
- Remoção de formatação antes de validar
- Validação de tamanho:
  - CPF: exatamente 11 dígitos
  - CNPJ: exatamente 14 dígitos
- Mensagens de erro específicas por tipo de documento

**Arquivos corrigidos:**
- `front-lojas/src/app/(dashboard)/invoices/page.tsx`
- `montshop-desktop/src/components/pages/InvoicesPage.tsx`

### 3. Limpeza de Dados antes de Enviar para API

**Problema identificado:**
- Dados enviados com formatação (pontos, traços, espaços)
- API pode rejeitar dados formatados incorretamente

**Correção aplicada:**
- Remoção de formatação de todos os campos antes de enviar:
  - CPF/CNPJ: apenas dígitos
  - Telefone: apenas dígitos
  - CEP: apenas dígitos
  - NCM: apenas dígitos (se informado)
  - CFOP: apenas dígitos
- Trim em campos de texto (remover espaços no início/fim)
- Conversão de estado para maiúsculas

**Arquivos corrigidos:**
- `front-lojas/src/app/(dashboard)/invoices/page.tsx`
- `montshop-desktop/src/components/pages/InvoicesPage.tsx`

### 4. Validações de Endereço Obrigatório para NF-e

**Status:** ✅ Já estava implementado corretamente
- Validação de logradouro (obrigatório)
- Validação de cidade (obrigatório)
- Validação de estado/UF (obrigatório, exatamente 2 caracteres)

## ✅ Validações Já Implementadas

### Frontend e Desktop

1. **Validação de Modo de Emissão**
   - Modo "Venda": valida se saleId foi informado
   - Modo "Manual": valida todos os campos obrigatórios

2. **Validação de Itens**
   - Descrição obrigatória e não vazia
   - Quantidade maior que zero
   - Valor unitário maior que zero
   - CFOP obrigatório e válido (4 dígitos)
   - NCM opcional, mas se informado deve ser válido (8 dígitos)

3. **Validação de Endereço (obrigatório para NF-e)**
   - Logradouro obrigatório
   - Cidade obrigatória
   - Estado/UF obrigatório (exatamente 2 caracteres)

4. **Tratamento de Erros**
   - Mensagens específicas para cada tipo de erro
   - Tratamento especial para erros de dados fiscais incompletos da empresa
   - Feedback visual com toast notifications

## ✅ Rotas e Endpoints Verificados

### Frontend (front-lojas)

**Rota de emissão de NF-e:**
- Endpoint: `POST /fiscal/nfe`
- Arquivo: `front-lojas/src/lib/api-endpoints.ts`
- Status: ✅ Correto

**Rota de listagem:**
- Endpoint: `GET /fiscal?documentType=outbound`
- Status: ✅ Correto

**Rota de download:**
- Endpoint: `GET /fiscal/{id}/download?format=pdf|xml`
- Status: ✅ Correto

### Desktop (montshop-desktop)

**Rota de emissão de NF-e:**
- Endpoint: `POST /fiscal/nfe`
- Arquivo: `montshop-desktop/src/lib/api-endpoints.ts`
- Status: ✅ Correto

**Rota de listagem:**
- Endpoint: `GET /fiscal?documentType=outbound`
- Status: ✅ Correto

**Rota de download:**
- Endpoint: `GET /fiscal/{id}/download?format=pdf|xml`
- Status: ✅ Correto

### Backend (api-lojas)

**Controller:**
- Arquivo: `api-lojas/src/application/fiscal/fiscal.controller.ts`
- Rota: `POST /fiscal/nfe`
- Validações: ✅ DTOs validam corretamente
- Status: ✅ Funcional

## ✅ Estrutura de Dados

### Payload de Emissão Manual

```typescript
{
  recipient: {
    document: string;        // CPF/CNPJ sem formatação
    name: string;
    email?: string;
    phone?: string;          // Apenas dígitos
    address: {
      zipCode?: string;      // Apenas dígitos
      street?: string;
      number?: string;
      complement?: string;
      district?: string;
      city?: string;
      state?: string;        // 2 caracteres maiúsculas
    }
  },
  items: [{
    description: string;
    quantity: number;
    unitPrice: number;
    ncm?: string;           // 8 dígitos ou undefined
    cfop: string;           // 4 dígitos
    unitOfMeasure: string;
  }],
  payment: {
    method: string;         // Código SEFAZ (01, 02, etc.)
  },
  additionalInfo?: string;
}
```

### Payload de Emissão Vinculada a Venda

```typescript
{
  saleId: string;           // UUID da venda
}
```

## 📋 Checklist de Produção

### Validações de Frontend/Desktop

- ✅ Validação de CPF/CNPJ (tamanho e formato)
- ✅ Validação de NCM (8 dígitos se informado)
- ✅ Validação de CFOP (4 dígitos obrigatório)
- ✅ Validação de endereço completo para NF-e
- ✅ Validação de itens (descrição, quantidade, valor)
- ✅ Limpeza de dados antes de enviar
- ✅ Tratamento de erros com mensagens claras
- ✅ Feedback visual para o usuário

### Rotas e Endpoints

- ✅ Endpoint de emissão de NF-e configurado corretamente
- ✅ Endpoint de listagem de documentos fiscais
- ✅ Endpoint de download de PDF/XML
- ✅ Tratamento de erros de autenticação
- ✅ Tratamento de erros de validação

### Integração com Backend

- ✅ DTOs validam corretamente os dados recebidos
- ✅ Cálculo de tributos automático via IBPT
- ✅ Validações de campos obrigatórios no backend
- ✅ Mensagens de erro claras e informativas

## 🔍 Pontos de Atenção

### 1. Máscaras nos Inputs (Melhoria Futura)

**Status:** Pendente (não crítico)

Embora não seja crítico para produção (a validação e limpeza funcionam corretamente), seria uma melhoria de UX adicionar máscaras nos inputs:

- CPF: `000.000.000-00`
- CNPJ: `00.000.000/0000-00`
- CEP: `00000-000`
- NCM: `00000000`
- CFOP: `0000`

**Impacto:** Baixo - não afeta funcionalidade, apenas UX

### 2. Validação de CPF/CNPJ com Dígito Verificador

**Status:** Implementado no backend

O backend já valida dígitos verificadores de CPF/CNPJ através do `ValidationService`. O frontend valida apenas o tamanho para melhor UX (mostra erro imediatamente).

**Impacto:** Nenhum - backend valida corretamente

### 3. Tratamento de Erros da API

**Status:** ✅ Implementado

O frontend e desktop já tratam corretamente:
- Erros de validação do backend
- Erros de dados fiscais incompletos
- Erros de autenticação
- Erros genéricos com mensagens claras

## ✅ Conclusão

Todas as validações e rotas estão funcionais e corretas para produção. As correções aplicadas garantem que:

1. **Dados são validados corretamente** antes de serem enviados
2. **Formatação é removida** antes de enviar para a API
3. **Mensagens de erro são claras** e ajudam o usuário a corrigir problemas
4. **Rotas e endpoints estão corretos** e funcionando
5. **Integração com backend está completa** e funcional

O sistema está **pronto para produção** sem erros na emissão de notas fiscais.

