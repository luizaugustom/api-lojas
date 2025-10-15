# Prompt para Desenvolvimento de Frontend Next.js - API Lojas SaaS

Use este prompt com o ChatGPT-5 para desenvolver um frontend completo em Next.js para a API Lojas SaaS.

## Prompt Principal

```
Crie um frontend completo em Next.js 14 com App Router para a API Lojas SaaS. O sistema deve ser um painel administrativo moderno e responsivo para gerenciamento de lojas.

### Funcionalidades Obrigatórias:

#### 1. Autenticação e Autorização
- Login para Admin, Empresa e Vendedor
- Diferentes dashboards baseados no tipo de usuário
- Proteção de rotas
- Gerenciamento de sessão com JWT
- Logout seguro

#### 2. Dashboard Principal
- Cards com métricas principais (vendas, produtos, clientes)
- Gráficos de vendas por período
- Gráficos de produtos mais vendidos
- Alertas de estoque baixo
- Contas próximas do vencimento

#### 3. Gerenciamento de Produtos
- Listagem com paginação e filtros
- CRUD completo de produtos
- Upload de múltiplas fotos
- Código de barras (leitura e geração)
- Controle de estoque
- Alertas de vencimento
- Categorias

#### 4. Sistema de Vendas
- Interface de venda rápida
- Carrinho de compras
- Múltiplas formas de pagamento
- Cálculo automático de troco
- Busca de produtos por código de barras
- Impressão de cupom
- Histórico de vendas

#### 5. Gerenciamento de Clientes
- CRUD de clientes
- Busca por CPF/CNPJ
- Histórico de compras
- Vendas a prazo
- Endereços completos

#### 6. Contas a Pagar
- Listagem com filtros
- Alertas de vencimento
- Marcar como pago
- Códigos de barras para pagamento

#### 7. Fechamento de Caixa
- Abertura de caixa
- Relatório de vendas
- Fechamento com impressão
- Histórico de fechamentos

#### 8. Relatórios
- Vendas por período
- Produtos mais vendidos
- Vendedores
- Formas de pagamento
- Exportação em PDF/Excel

#### 9. Integrações
- WhatsApp (envio de mensagens)
- N8N (webhooks)
- Impressora térmica
- Leitor de código de barras

### Tecnologias e Bibliotecas:

- **Framework**: Next.js 14 com App Router
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand ou Redux Toolkit
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Charts**: Recharts ou Chart.js
- **Tables**: TanStack Table
- **Notifications**: React Hot Toast
- **Icons**: Lucide React
- **Date Picker**: React DatePicker
- **File Upload**: React Dropzone
- **QR Code**: qrcode.js
- **Barcode**: JsBarcode

### Estrutura de Pastas:

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── sales/
│   │   ├── customers/
│   │   ├── bills/
│   │   ├── cash-closure/
│   │   ├── reports/
│   │   ├── settings/
│   │   └── layout.tsx
│   ├── api/
│   └── layout.tsx
├── components/
│   ├── ui/
│   ├── forms/
│   ├── charts/
│   ├── tables/
│   └── layout/
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   ├── utils.ts
│   └── validations.ts
├── hooks/
├── store/
└── types/
```

### API Endpoints Disponíveis:

Base URL: `https://your-api-domain.com/api`

#### Autenticação
- `POST /auth/login` - Login
- `GET /auth/me` - Dados do usuário logado

#### Produtos
- `GET /product` - Listar produtos
- `POST /product` - Criar produto
- `GET /product/:id` - Buscar produto
- `PATCH /product/:id` - Atualizar produto
- `DELETE /product/:id` - Excluir produto
- `GET /product/barcode/:barcode` - Buscar por código de barras

#### Vendas
- `GET /sale` - Listar vendas
- `POST /sale` - Criar venda
- `GET /sale/:id` - Buscar venda
- `POST /sale/exchange` - Processar troca

#### Clientes
- `GET /customer` - Listar clientes
- `POST /customer` - Criar cliente
- `GET /customer/:id` - Buscar cliente
- `PATCH /customer/:id` - Atualizar cliente
- `DELETE /customer/:id` - Excluir cliente

#### Contas a Pagar
- `GET /bill-to-pay` - Listar contas
- `POST /bill-to-pay` - Criar conta
- `PATCH /bill-to-pay/:id/mark-paid` - Marcar como pago

#### Fechamento de Caixa
- `POST /cash-closure` - Abrir caixa
- `GET /cash-closure/current` - Caixa atual
- `PATCH /cash-closure/close` - Fechar caixa

#### Upload
- `POST /upload/single` - Upload de arquivo único
- `POST /upload/multiple` - Upload múltiplos arquivos

### Tipos de Usuário e Permissões:

#### Admin
- Acesso total ao sistema
- Gerenciar empresas
- Ver todas as vendas
- Relatórios globais

#### Empresa
- Gerenciar próprios dados
- Gerenciar vendedores
- Gerenciar produtos
- Ver vendas da empresa
- Relatórios da empresa

#### Vendedor
- Criar vendas
- Ver próprias vendas
- Ver produtos
- Não pode gerenciar dados

### Design e UX:

- **Tema**: Dark/Light mode
- **Cores**: Azul principal, verde para sucesso, vermelho para erro
- **Layout**: Sidebar responsiva
- **Cards**: Informações organizadas
- **Gráficos**: Interativos e responsivos
- **Tabelas**: Paginação, filtros, ordenação
- **Forms**: Validação em tempo real
- **Loading**: Skeletons e spinners
- **Notifications**: Toast notifications

### Funcionalidades Especiais:

#### Sistema de Vendas
- Interface tipo PDV (Ponto de Venda)
- Busca rápida por código de barras
- Carrinho lateral
- Cálculo automático de troco
- Impressão via API

#### Leitor de Código de Barras
- Integração com câmera
- Suporte a diferentes formatos
- Busca automática de produtos

#### Impressão
- Cupons de venda
- Relatórios de fechamento
- Configuração de impressoras

### Responsividade:
- Mobile-first design
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Sidebar colapsável em mobile
- Tabelas com scroll horizontal em mobile

### Performance:
- Lazy loading de componentes
- Paginação em todas as listagens
- Cache de dados
- Otimização de imagens
- Bundle splitting

### Segurança:
- Validação de formulários
- Sanitização de dados
- Proteção de rotas
- Tokens JWT seguros
- HTTPS obrigatório

### Testes:
- Testes unitários com Jest
- Testes de integração
- Testes E2E com Playwright

### Deploy:
- Configuração para Vercel
- Variáveis de ambiente
- Build otimizado
- PWA ready

### Exemplos de Componentes:

#### Dashboard Cards
```tsx
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType;
  trend?: 'up' | 'down' | 'neutral';
}
```

#### Data Table
```tsx
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchKey?: string;
  pagination?: boolean;
  filters?: FilterOption[];
}
```

#### Sale Form
```tsx
interface SaleFormProps {
  products: Product[];
  onSubmit: (sale: CreateSaleDto) => void;
  loading?: boolean;
}
```

### Estado Global:
```tsx
interface AppState {
  auth: {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
  };
  ui: {
    sidebarOpen: boolean;
    theme: 'light' | 'dark';
  };
  sales: {
    cart: CartItem[];
    currentSale: Sale | null;
  };
}
```

### Validações:
```tsx
// Zod schemas para validação
const productSchema = z.object({
  name: z.string().min(2).max(255),
  barcode: z.string().min(8).max(20),
  price: z.number().positive(),
  stockQuantity: z.number().min(0),
  category: z.string().optional(),
});

const saleSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().positive(),
  })).min(1),
  paymentMethods: z.array(z.enum(['cash', 'credit_card', 'debit_card', 'pix', 'installment'])),
  clientName: z.string().optional(),
  totalPaid: z.number().min(0).optional(),
});
```

### Configuração do Projeto:

```json
{
  "name": "api-lojas-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:e2e": "playwright test"
  }
}
```

### Variáveis de Ambiente:

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
NEXT_PUBLIC_APP_NAME=API Lojas SaaS
NEXT_PUBLIC_VERSION=1.0.0
```

### Requisitos Técnicos:

1. **TypeScript**: Tipagem completa
2. **ESLint + Prettier**: Código limpo
3. **Husky**: Git hooks
4. **Conventional Commits**: Padrão de commits
5. **Storybook**: Documentação de componentes
6. **Testing**: Cobertura de testes > 80%

### Entregáveis:

1. Código fonte completo
2. Documentação de componentes
3. Guia de instalação
4. Guia de deploy
5. Testes automatizados
6. Storybook configurado

### Exemplo de Página de Vendas:

```tsx
'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { useProducts } from '@/hooks/useProducts';
import { Cart } from '@/components/sales/Cart';
import { ProductGrid } from '@/components/sales/ProductGrid';
import { BarcodeScanner } from '@/components/sales/BarcodeScanner';

export default function SalesPage() {
  const { cart, addToCart, removeFromCart, clearCart } = useCart();
  const { products, searchByBarcode } = useProducts();
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleBarcodeScanned = (barcode: string) => {
    const product = searchByBarcode(barcode);
    if (product) {
      addToCart(product);
    }
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1 p-4">
        <div className="mb-4">
          <button
            onClick={() => setScannerOpen(true)}
            className="btn btn-primary"
          >
            Escanear Código
          </button>
        </div>
        <ProductGrid products={products} onAddToCart={addToCart} />
      </div>
      
      <div className="w-96 border-l">
        <Cart 
          items={cart.items}
          onRemove={removeFromCart}
          onClear={clearCart}
        />
      </div>

      {scannerOpen && (
        <BarcodeScanner
          onScanned={handleBarcodeScanned}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  );
}
```

Crie um sistema completo, moderno e profissional seguindo as melhores práticas do Next.js 14 e React. O foco deve ser na experiência do usuário e na produtividade das operações de venda.
```

## Prompt Adicional para Funcionalidades Específicas

```
Agora implemente as seguintes funcionalidades específicas para o sistema de lojas:

### 1. Sistema PDV (Ponto de Venda)
- Interface otimizada para tablets
- Botões grandes para produtos
- Carrinho sempre visível
- Cálculo automático de troco
- Múltiplas formas de pagamento
- Impressão automática de cupom

### 2. Integração com Impressora
- Configuração de impressoras
- Teste de impressão
- Formatação de cupons
- Impressão de relatórios

### 3. Sistema de Código de Barras
- Leitura via câmera
- Geração de códigos
- Validação de formatos
- Integração com produtos

### 4. Relatórios Avançados
- Gráficos interativos
- Filtros por período
- Exportação em PDF
- Compartilhamento

### 5. Notificações em Tempo Real
- WebSocket para atualizações
- Notificações push
- Alertas de estoque
- Lembretes de vencimento

Implemente essas funcionalidades com foco na usabilidade e performance.
```

## Prompt para Melhorias e Otimizações

```
Agora otimize o sistema com as seguintes melhorias:

### 1. Performance
- Implementar React.memo onde necessário
- Usar useMemo e useCallback
- Lazy loading de páginas
- Otimização de imagens
- Service Worker para cache

### 2. Acessibilidade
- ARIA labels
- Navegação por teclado
- Contraste adequado
- Screen reader support
- Focus management

### 3. PWA (Progressive Web App)
- Manifest.json
- Service Worker
- Offline functionality
- Install prompt
- Push notifications

### 4. Internacionalização
- i18n setup
- Múltiplos idiomas
- Formatação de números
- Formatação de datas

### 5. Testes
- Unit tests para componentes
- Integration tests
- E2E tests
- Visual regression tests

Implemente essas otimizações mantendo a funcionalidade existente.
```

---

Use estes prompts sequencialmente para desenvolver um frontend completo e profissional para a API Lojas SaaS.
