# Prompt para ChatGPT - Página de Vendedores (Frontend)

## Contexto
Você precisa implementar uma página completa de gerenciamento de vendedores para um sistema de PDV (Ponto de Venda). A API já está implementada e funcionando. Implemente usando Next.js 14+ com TypeScript, Tailwind CSS e seguindo as melhores práticas de UX/UI.

## Estrutura da API - Endpoints Disponíveis

### Base URL: `http://localhost:3000/api`

### Autenticação
- Todos os endpoints requerem Bearer Token no header `Authorization`
- Token obtido via login: `POST /auth/login`

### Endpoints de Vendedores

#### 1. Criar Vendedor
```
POST /seller
Headers: Authorization: Bearer {token}
Body: {
  "login": "vendedor@empresa.com", // obrigatório, email válido
  "password": "password123", // obrigatório, min 6 caracteres
  "name": "João Silva", // obrigatório, min 2 caracteres
  "cpf": "123.456.789-00", // opcional, formato XXX.XXX.XXX-XX
  "birthDate": "1990-01-01", // opcional, formato YYYY-MM-DD
  "email": "joao@example.com", // opcional, email válido
  "phone": "(11) 99999-9999" // opcional, formato (XX) XXXXX-XXXX
}
```

#### 2. Listar Vendedores
```
GET /seller
Headers: Authorization: Bearer {token}
Response: Array de vendedores com informações básicas e contagem de vendas
```

#### 3. Buscar Vendedor por ID
```
GET /seller/{id}
Headers: Authorization: Bearer {token}
```

#### 4. Atualizar Vendedor
```
PATCH /seller/{id}
Headers: Authorization: Bearer {token}
Body: Mesmos campos do create (todos opcionais)
```

#### 5. Deletar Vendedor
```
DELETE /seller/{id}
Headers: Authorization: Bearer {token}
```

#### 6. Estatísticas do Vendedor
```
GET /seller/{id}/stats
Headers: Authorization: Bearer {token}
Response: Estatísticas de vendas do vendedor
```

#### 7. Vendas do Vendedor
```
GET /seller/{id}/sales?page=1&limit=10
Headers: Authorization: Bearer {token}
Response: Lista paginada de vendas do vendedor
```

### Endpoints Especiais para Vendedores (quando logado como vendedor)

#### 8. Meu Perfil
```
GET /seller/my-profile
Headers: Authorization: Bearer {token}
```

#### 9. Minhas Estatísticas
```
GET /seller/my-stats
Headers: Authorization: Bearer {token}
```

#### 10. Minhas Vendas
```
GET /seller/my-sales?page=1&limit=10
Headers: Authorization: Bearer {token}
```

#### 11. Atualizar Meu Perfil
```
PATCH /seller/my-profile
Headers: Authorization: Bearer {token}
Body: Campos opcionais para atualização
```

## Requisitos da Implementação

### 1. Página Principal de Vendedores (`/vendedores`)
- **Lista de vendedores** com cards informativos
- **Botão "Adicionar Vendedor"** que abre modal/formulário
- **Filtros e busca** por nome, email, CPF
- **Paginação** se necessário
- **Ações**: Visualizar, Editar, Deletar para cada vendedor
- **Estatísticas gerais**: Total de vendedores, vendas do mês, etc.

### 2. Modal/Formulário de Criação/Edição
- **Campos obrigatórios**:
  - Login (email) - com validação de email
  - Senha - min 6 caracteres (apenas na criação)
  - Nome completo
- **Campos opcionais**:
  - CPF - com máscara e validação
  - Data de nascimento - date picker
  - Email - com validação
  - Telefone - com máscara (XX) XXXXX-XXXX
- **Validação em tempo real** com feedback visual
- **Botões**: Salvar, Cancelar
- **Loading states** durante requisições

### 3. Modal de Detalhes do Vendedor
- **Informações pessoais** completas
- **Estatísticas**: Total de vendas, valor vendido, média por venda
- **Gráfico de vendas** (últimos 30 dias)
- **Lista de vendas recentes** com paginação
- **Botões**: Editar, Fechar

### 4. Modal de Confirmação de Exclusão
- **Aviso de confirmação** com nome do vendedor
- **Informação sobre impacto**: "Este vendedor possui X vendas"
- **Botões**: Confirmar Exclusão, Cancelar

### 5. Página de Perfil do Vendedor (`/vendedor/perfil`)
- **Formulário de edição** do próprio perfil
- **Campos editáveis**: Nome, CPF, Data nascimento, Email, Telefone
- **Não permitir edição**: Login (email)
- **Seção de estatísticas pessoais**
- **Histórico de vendas** com filtros por período

## Especificações Técnicas

### Tecnologias
- **Next.js 14+** com App Router
- **TypeScript** com tipagem completa
- **Tailwind CSS** para estilização
- **React Hook Form** para formulários
- **Zod** para validação
- **Axios** ou **fetch** para requisições
- **React Query** ou **SWR** para cache e estado
- **Lucide React** para ícones
- **Recharts** para gráficos

### Estrutura de Pastas Sugerida
```
src/
├── app/
│   ├── vendedores/
│   │   ├── page.tsx (lista principal)
│   │   ├── [id]/
│   │   │   └── page.tsx (detalhes)
│   │   └── perfil/
│   │       └── page.tsx (perfil próprio)
│   └── components/
│       ├── vendedores/
│       │   ├── VendedorCard.tsx
│       │   ├── VendedorForm.tsx
│       │   ├── VendedorDetails.tsx
│       │   ├── VendedorStats.tsx
│       │   └── DeleteConfirmModal.tsx
│       └── ui/ (componentes base)
├── lib/
│   ├── api.ts (configuração axios)
│   ├── validations.ts (schemas Zod)
│   └── utils.ts
└── types/
    └── vendedor.ts
```

### Validações Zod Sugeridas
```typescript
export const createVendedorSchema = z.object({
  login: z.string().email("Email inválido").min(3, "Mínimo 3 caracteres"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  name: z.string().min(2, "Mínimo 2 caracteres").max(255, "Máximo 255 caracteres"),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido").optional(),
  birthDate: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  phone: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, "Telefone inválido").optional(),
});
```

### Tipos TypeScript Sugeridos
```typescript
export interface Vendedor {
  id: string;
  login: string;
  name: string;
  cpf?: string;
  birthDate?: string;
  email?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
  };
  _count?: {
    sales: number;
  };
}

export interface VendedorStats {
  totalVendas: number;
  valorTotalVendido: number;
  mediaPorVenda: number;
  vendasUltimos30Dias: number;
}
```

## Funcionalidades Especiais

### 1. Máscaras de Input
- **CPF**: `XXX.XXX.XXX-XX`
- **Telefone**: `(XX) XXXXX-XXXX`
- **Data**: `DD/MM/YYYY`

### 2. Estados de Loading
- **Skeleton** para lista de vendedores
- **Spinner** em botões durante requisições
- **Loading overlay** em modais

### 3. Tratamento de Erros
- **Toast notifications** para sucesso/erro
- **Validação de campos** em tempo real
- **Mensagens específicas** para cada tipo de erro

### 4. Responsividade
- **Mobile-first** design
- **Grid responsivo** para cards
- **Modal fullscreen** em mobile
- **Tabela scrollável** horizontalmente

### 5. Acessibilidade
- **Labels** adequados
- **ARIA attributes**
- **Navegação por teclado**
- **Contraste** adequado

## Exemplo de Uso da API

```typescript
// Criar vendedor
const createVendedor = async (data: CreateVendedorDto) => {
  const response = await fetch('/api/seller', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return response.json();
};

// Listar vendedores
const getVendedores = async () => {
  const response = await fetch('/api/seller', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

## Design Sugerido

### Cores
- **Primary**: Azul (#3B82F6)
- **Success**: Verde (#10B981)
- **Error**: Vermelho (#EF4444)
- **Warning**: Amarelo (#F59E0B)
- **Background**: Cinza claro (#F9FAFB)

### Componentes UI
- **Cards** com sombra sutil
- **Botões** com hover effects
- **Inputs** com focus states
- **Modais** com backdrop blur
- **Gráficos** com cores consistentes

## Observações Importantes

1. **Autenticação**: Sempre incluir o token Bearer nas requisições
2. **Validação**: Implementar validação tanto no frontend quanto confiar na API
3. **Loading States**: Sempre mostrar feedback visual durante operações
4. **Error Handling**: Tratar todos os possíveis erros da API
5. **Responsividade**: Testar em diferentes tamanhos de tela
6. **Performance**: Usar React.memo e useMemo quando necessário
7. **SEO**: Implementar meta tags adequadas
8. **Testes**: Considerar testes unitários para componentes críticos

Implemente uma interface moderna, intuitiva e funcional que permita o gerenciamento completo de vendedores com excelente experiência do usuário.

