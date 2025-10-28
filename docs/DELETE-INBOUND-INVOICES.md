# Exclusão de Notas Fiscais de Entrada

## 📋 Visão Geral

Esta funcionalidade permite que empresas excluam suas notas fiscais de entrada do sistema. A exclusão é restrita apenas a notas do tipo `NFe_INBOUND` e inclui validações de segurança para garantir que cada empresa possa excluir apenas suas próprias notas.

## 🎯 Objetivo

Permitir que empresas gerenciem suas notas fiscais de entrada, incluindo a capacidade de remover registros incorretos ou duplicados.

## 🔐 Segurança

A funcionalidade implementa as seguintes verificações de segurança:

1. **Autenticação JWT**: Usuário deve estar autenticado
2. **Autorização por Role**: Apenas usuários com role `ADMIN` ou `COMPANY` podem excluir notas
3. **Validação de Propriedade**: Empresa só pode excluir suas próprias notas fiscais
4. **Validação de Tipo**: Apenas notas de entrada podem ser excluídas:
   - `NFe_INBOUND` (criadas manualmente)
   - `NFe` com XML importado (uploadadas via arquivo XML)

## 📡 Endpoint da API

### DELETE `/api/fiscal/inbound-invoice/:id`

Remove uma nota fiscal de entrada do sistema.

#### Headers
```
Authorization: Bearer {token}
```

#### Parâmetros de URL
- `id` (string, UUID): ID da nota fiscal de entrada a ser excluída

#### Respostas

**200 - Sucesso**
```json
{
  "message": "Nota fiscal de entrada excluída com sucesso",
  "deletedId": "cmgty5s880006ww3b8bup77vb",
  "documentNumber": "123456",
  "accessKey": "35240114200166000187550010000000071123456789"
}
```

**404 - Nota não encontrada**
```json
{
  "statusCode": 404,
  "message": "Nota fiscal não encontrada",
  "error": "Not Found"
}
```

**400 - Validação falhou**
```json
{
  "statusCode": 400,
  "message": "Esta nota fiscal não pertence à sua empresa",
  "error": "Bad Request"
}
```

ou

```json
{
  "statusCode": 400,
  "message": "Apenas notas fiscais de entrada podem ser excluídas por este método",
  "error": "Bad Request"
}
```

**401 - Não autenticado**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

## 💻 Exemplos de Uso

### cURL

```bash
# Substituir {token} pelo token JWT e {id} pelo ID da nota fiscal
curl -X DELETE "http://localhost:3000/api/fiscal/inbound-invoice/{id}" \
  -H "Authorization: Bearer {token}"
```

### JavaScript/TypeScript (Axios)

```typescript
import axios from 'axios';

const deleteInboundInvoice = async (invoiceId: string, token: string) => {
  try {
    const response = await axios.delete(
      `http://localhost:3000/api/fiscal/inbound-invoice/${invoiceId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('Nota fiscal excluída:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao excluir nota fiscal:', error.response?.data);
    throw error;
  }
};

// Uso
await deleteInboundInvoice('cmgty5s880006ww3b8bup77vb', 'seu_token_aqui');
```

### React (Frontend)

```typescript
const handleDelete = async (invoiceId: string) => {
  try {
    await api.delete(`/fiscal/inbound-invoice/${invoiceId}`);
    toast.success('Nota fiscal de entrada excluída com sucesso');
    refetch(); // Recarregar lista
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Falha ao excluir nota fiscal';
    toast.error(errorMessage);
  }
};
```

## 🧪 Testes

Um script de teste está disponível em `scripts/test-delete-inbound-invoice.js` que demonstra:

1. Login de empresa
2. Criação de uma nota fiscal de entrada de teste
3. Listagem de notas antes da exclusão
4. Exclusão da nota
5. Listagem de notas após a exclusão
6. Teste de validação (tentativa de excluir nota que não é de entrada)

### Executar o teste

```bash
cd api-lojas
node scripts/test-delete-inbound-invoice.js
```

**Nota:** Ajuste as credenciais no arquivo de teste antes de executar:
```javascript
const COMPANY_LOGIN = 'loja01';
const COMPANY_PASSWORD = 'senha123';
```

## 🖥️ Interface do Usuário (Frontend)

A interface do usuário em `front-lojas/src/app/(dashboard)/inbound-invoices/page.tsx` inclui:

### Botão de Exclusão
- Visível apenas para usuários com role `empresa`
- Aparece ao lado do botão de download de XML
- Tem estilo vermelho (variant="destructive") para indicar ação destrutiva

### Diálogo de Confirmação
- Modal que aparece ao clicar em "Excluir"
- Exibe informações da nota a ser excluída:
  - Fornecedor
  - Chave de acesso
  - Valor total
- Aviso destacado sobre a irreversibilidade da ação
- Botões "Cancelar" e "Excluir"
- Indicador de carregamento durante a exclusão

### Fluxo de Uso
1. Usuário clica no botão "Excluir" na linha da nota fiscal
2. Modal de confirmação é exibido com os detalhes da nota
3. Usuário confirma a exclusão
4. Sistema faz a requisição DELETE para a API
5. Toast de sucesso/erro é exibido
6. Lista de notas é recarregada automaticamente

## 📝 Alterações nos Arquivos

### Backend

1. **`api-lojas/src/application/fiscal/fiscal.service.ts`**
   - Novo método: `deleteInboundInvoice(id: string, companyId: string)`
   - Validações de segurança e tipo de documento

2. **`api-lojas/src/application/fiscal/fiscal.controller.ts`**
   - Novo endpoint: `DELETE /fiscal/inbound-invoice/:id`
   - Decorators de autenticação e autorização
   - Documentação Swagger/OpenAPI

### Frontend

3. **`front-lojas/src/app/(dashboard)/inbound-invoices/page.tsx`**
   - Novo botão "Excluir" na tabela de notas
   - Modal de confirmação de exclusão
   - Estados para gerenciar o processo de exclusão
   - Integração com API de exclusão

### Scripts e Documentação

4. **`api-lojas/scripts/test-delete-inbound-invoice.js`**
   - Script de teste completo
   - Demonstra todos os cenários de uso

5. **`api-lojas/docs/DELETE-INBOUND-INVOICES.md`**
   - Este documento de documentação

## ⚠️ Considerações Importantes

1. **Irreversível**: A exclusão é permanente e não pode ser desfeita
2. **Backup**: Considere fazer backup dos dados antes de excluir
3. **Auditoria**: Os logs do sistema registram todas as exclusões
4. **Apenas Entrada**: Apenas notas de entrada podem ser excluídas:
   - `NFe_INBOUND` (criadas manualmente via endpoint)
   - `NFe` com XML (importadas via upload de arquivo XML)
   - Notas de saída (`NFCe`, `NFe` sem XML) não podem ser excluídas por este endpoint
5. **Permissões**: Apenas empresas podem excluir suas próprias notas

## 🔄 Próximos Passos Sugeridos

1. Implementar soft delete (exclusão lógica) em vez de exclusão física
2. Adicionar auditoria detalhada com registro de usuário e timestamp
3. Implementar funcionalidade de "desfazer" com janela de tempo limitada
4. Adicionar filtros e busca na tela de notas fiscais
5. Implementar exportação de notas antes da exclusão

## 📞 Suporte

Para dúvidas ou problemas relacionados a esta funcionalidade, consulte:
- Logs do backend em `api-lojas`
- Console do navegador para erros do frontend
- Documentação da API em `/api/docs` (Swagger)

