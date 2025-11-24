# Configuração do Focus NFe - Guia Completo

## Problema Identificado

Ao tentar fazer upload do certificado digital pela página de configurações da empresa, o sistema retornava o erro:

```
API Key do Focus NFe não configurada. Solicite ao administrador.
```

## Causa Raiz

O sistema possui uma arquitetura centralizada onde:

1. **Administrador (Admin)**: Configura UMA única API Key do Focus NFe que será usada por TODAS as empresas
2. **Empresas**: Cada empresa configura seus próprios dados fiscais (certificado, CSC, CNAE, etc)

O erro ocorria porque o **administrador não havia configurado a API Key global** do Focus NFe antes da empresa tentar fazer upload do certificado.

## Arquitetura do Sistema

### Modelo de Dados

```
Admin (1)
  ├─ focusNfeApiKey (String) - API Key global do Focus NFe
  ├─ focusNfeEnvironment (String) - "sandbox" ou "production"
  └─ ibptToken (String) - Token IBPT (opcional)
  
Company (N)
  ├─ adminId (String) - Referência ao Admin
  ├─ certificatePassword (String - criptografado)
  ├─ csc (String - criptografado)
  ├─ municipioIbge (String)
  ├─ taxRegime (Enum)
  ├─ cnae (String)
  └─ ... outros dados fiscais
```

### Fluxo de Configuração Correto

1. **Admin acessa Configurações** (role: 'admin')
   - Seção "Focus NFe - Configuração Global"
   - Configura API Key do Focus NFe
   - Define ambiente (sandbox/production)
   - Opcionalmente configura Token IBPT

2. **Empresa acessa Configurações** (role: 'empresa')
   - Seção "Configurações Fiscais"
   - Preenche dados fiscais (regime tributário, CNAE, município IBGE, etc)
   - Configura senha do certificado digital
   - Configura CSC (Código de Segurança do Contribuinte)
   - Faz upload do certificado digital (.pfx)

3. **Sistema combina** API Key global + dados da empresa para emitir NFC-e

## Solução Implementada

### 1. Backend - API

**Arquivo**: `api-lojas/src/application/company/company.service.ts`

Modificado o endpoint `getFiscalConfig()` para retornar informações sobre a configuração do admin:

```typescript
async getFiscalConfig(companyId: string) {
  const company = await this.prisma.company.findUnique({
    where: { id: companyId },
    select: {
      // ... campos da empresa
      admin: {
        select: {
          focusNfeApiKey: true,
          focusNfeEnvironment: true,
        },
      },
    },
  });

  return {
    // ... dados da empresa
    // Novas informações adicionadas:
    adminHasFocusNfeApiKey: !!company.admin.focusNfeApiKey,
    focusNfeEnvironment: company.admin.focusNfeEnvironment || 'sandbox',
  };
}
```

### 2. Frontend - Desktop (Electron)

**Arquivo**: `montshop-desktop/src/components/pages/SettingsPage.tsx`

#### 2.1. Validação antes do upload

```typescript
const handleUploadCertificate = async () => {
  // Verificar se o admin configurou a API Key
  if (!fiscalConfig?.adminHasFocusNfeApiKey) {
    toast.error('API Key do Focus NFe não configurada pelo administrador...');
    return;
  }
  // ... restante do código
};
```

#### 2.2. Avisos visuais na interface

Adicionado alertas condicionais:

**Quando API Key NÃO está configurada** (vermelho):
```tsx
{!fiscalConfig?.adminHasFocusNfeApiKey && (
  <div className="bg-red-50 ...">
    ⚠️ API Key do Focus NFe não configurada
    O administrador precisa configurar...
  </div>
)}
```

**Quando API Key ESTÁ configurada** (verde):
```tsx
{fiscalConfig?.adminHasFocusNfeApiKey && (
  <div className="bg-green-50 ...">
    ✓ API Key do Focus NFe configurada
    O sistema está pronto para emitir notas fiscais...
  </div>
)}
```

### 3. Frontend - Web (Next.js)

**Arquivo**: `front-lojas/src/app/(dashboard)/settings/page.tsx`

Aplicadas as mesmas modificações do frontend desktop.

## Como Usar

### Para Administradores

1. Faça login com credenciais de administrador
2. Acesse **Configurações**
3. Localize a seção **"Focus NFe - Configuração Global"**
4. Preencha:
   - **API Key Focus NFe**: Obtenha em https://focusnfe.com.br (R$ 39,90/mês)
   - **Ambiente**: Escolha "Homologação (Testes)" ou "Produção"
   - **Token IBPT** (opcional): Para cálculo de tributos
5. Clique em **"Salvar Configuração Global"**

### Para Empresas

1. Faça login com credenciais da empresa
2. Acesse **Configurações**
3. Localize a seção **"Configurações Fiscais"**
4. Verifique se aparece o alerta verde: **"✓ API Key do Focus NFe configurada"**
   - ❌ Se aparecer alerta vermelho, solicite ao administrador que configure a API Key
5. Preencha os dados fiscais:
   - Regime Tributário
   - CNAE (opcional)
   - Código IBGE do Município
   - Série NFC-e
   - Senha do Certificado Digital
   - ID Token CSC e CSC
6. Faça upload do certificado digital (.pfx ou .p12)

## Benefícios da Arquitetura

✅ **Economia**: Uma assinatura Focus NFe serve para múltiplas empresas  
✅ **Centralização**: Admin controla o ambiente (sandbox/production) de todas as empresas  
✅ **Segurança**: Dados sensíveis são criptografados antes de serem armazenados  
✅ **Isolamento**: Cada empresa mantém seus próprios dados fiscais independentes  

## Pré-requisitos Técnicos

### Para o Administrador:
- [ ] Conta no Focus NFe (https://focusnfe.com.br)
- [ ] API Key do Focus NFe

### Para cada Empresa:
- [ ] Credenciamento na SEFAZ do estado
- [ ] Certificado Digital e-CNPJ (arquivo .pfx)
- [ ] CSC (Código de Segurança do Contribuinte) - obtido na SEFAZ
- [ ] Código IBGE do município
- [ ] Definição do regime tributário

## Links Úteis

- **Focus NFe**: https://focusnfe.com.br
- **Portal SEFAZ-SC (Credenciamento)**: https://nfce.svrs.rs.gov.br
- **Consulta Código IBGE**: https://www.ibge.gov.br/explica/codigos-dos-municipios.php
- **Token IBPT (Opcional)**: https://deolhonoimposto.ibpt.org.br

## Mensagens de Erro Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| "API Key do Focus NFe não configurada. Solicite ao administrador." | Admin não configurou API Key global | Admin deve acessar Configurações > Focus NFe e configurar a API Key |
| "Configure a senha do certificado antes de fazer upload" | Empresa não preencheu a senha do certificado | Preencher o campo "Senha do Certificado Digital" |
| Alerta vermelho na tela | API Key não configurada | Aguardar admin configurar ou solicitar a configuração |

## Changelog

### 2025-01-24
- ✅ Adicionado campo `adminHasFocusNfeApiKey` no retorno de `getFiscalConfig()`
- ✅ Adicionado campo `focusNfeEnvironment` no retorno de `getFiscalConfig()`
- ✅ Implementada validação no frontend antes do upload do certificado
- ✅ Adicionados alertas visuais (vermelho/verde) sobre status da API Key
- ✅ Melhorada mensagem de erro para orientar o usuário
- ✅ Documentação completa criada
