# 🚀 Guia de Instalação - Módulo de Relatórios

## ⚠️ Importante

Os erros de lint que você está vendo no VSCode são **normais** e **esperados** até que as dependências sejam instaladas.

## 📦 Instalação das Dependências

Execute o seguinte comando na raiz do projeto:

```bash
npm install
```

Este comando irá instalar as novas dependências adicionadas:
- `exceljs@^4.4.0` - Geração de arquivos Excel
- `xml2js@^0.6.2` - Conversão para XML
- `@types/xml2js@^0.4.14` - Tipos TypeScript para xml2js

## ✅ Verificação

Após a instalação, os erros de lint devem desaparecer automaticamente. Se ainda houver erros:

1. **Reinicie o VSCode** (Ctrl+Shift+P → "Reload Window")
2. **Limpe o cache do TypeScript** (Ctrl+Shift+P → "TypeScript: Restart TS Server")

## 🧪 Testando o Módulo

### 1. Inicie a aplicação

```bash
npm run start:dev
```

### 2. Acesse a documentação Swagger

```
http://localhost:3000/api/docs
```

### 3. Teste o endpoint de relatórios

Procure pela seção **"reports"** e teste o endpoint:

```
POST /reports/generate
```

**Body de exemplo:**

```json
{
  "reportType": "complete",
  "format": "excel",
  "startDate": "2025-01-01T00:00:00.000Z",
  "endDate": "2025-12-31T23:59:59.999Z"
}
```

### 4. Execute os testes

```bash
npm run test
```

## 🔧 Comandos Úteis

```bash
# Instalar dependências
npm install

# Gerar cliente Prisma (se necessário)
npm run db:generate

# Iniciar em modo desenvolvimento
npm run start:dev

# Executar testes
npm run test

# Executar linter
npm run lint

# Formatar código
npm run format
```

## 📊 Estrutura Criada

```
src/application/reports/
├── dto/
│   └── generate-report.dto.ts      ✅ Criado
├── reports.controller.ts            ✅ Criado
├── reports.service.ts               ✅ Criado
├── reports.module.ts                ✅ Criado
└── reports.service.spec.ts          ✅ Criado

docs/
├── REPORTS.md                       ✅ Criado
└── reports-example.html             ✅ Criado

prompts/
├── FRONTEND_NEXTJS_PROMPT.md        ✅ Atualizado
└── REACT_NATIVE_PROMPT.md           ✅ Atualizado

RELATORIOS_CONTABILIDADE.md         ✅ Criado
README.md                            ✅ Atualizado
package.json                         ✅ Atualizado
```

## ❓ Problemas Comuns

### Erro: "Cannot find module 'exceljs'"

**Solução:** Execute `npm install`

### Erro: "Cannot find module '@nestjs/common'"

**Solução:** 
1. Execute `npm install`
2. Reinicie o VSCode

### Erro: "Property 'company' does not exist on type 'PrismaService'"

**Solução:**
1. Execute `npm run db:generate`
2. Reinicie o TypeScript Server

### Porta 3000 já em uso

**Solução:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Ou altere a porta no .env
PORT=3001
```

## 🎉 Pronto!

Após executar `npm install` e reiniciar o VSCode, todos os erros devem desaparecer e o módulo estará pronto para uso!

## 📞 Suporte

- Documentação completa: `docs/REPORTS.md`
- Exemplo HTML: `docs/reports-example.html`
- Guia de implementação: `RELATORIOS_CONTABILIDADE.md`
