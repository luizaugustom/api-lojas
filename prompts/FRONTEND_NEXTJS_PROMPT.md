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
- **Relatórios Contábeis** (Novo!)
  - Seleção de tipo de relatório (vendas, produtos, notas fiscais, completo)
  - Seleção de formato (JSON, XML, Excel)
  - Filtros de período (data inicial e final)
  - Filtro por vendedor (opcional)
  - Download automático do arquivo gerado
  - Preview dos dados antes do download
  - Histórico de relatórios gerados

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

#### Relatórios Contábeis (Novo!)
- `POST /reports/generate` - Gerar relatório
  - Body: `{ reportType: "sales" | "products" | "invoices" | "complete", format: "json" | "xml" | "excel", startDate?: string, endDate?: string, sellerId?: string }`
  - Retorna: Arquivo para download (JSON, XML ou Excel)

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
- **Gerar relatórios contábeis** (Novo!)

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

#### Accounting Reports Form (Novo!)
```tsx
interface ReportsFormProps {
  onGenerate: (params: GenerateReportDto) => void;
  loading?: boolean;
  sellers?: Seller[];
}

interface GenerateReportDto {
  reportType: 'sales' | 'products' | 'invoices' | 'complete';
  format: 'json' | 'xml' | 'excel';
  startDate?: string;
  endDate?: string;
  sellerId?: string;
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

### 5. Relatórios Contábeis (Novo!)
- Página dedicada para geração de relatórios
- Formulário com seleção de tipo (vendas, produtos, notas fiscais, completo)
- Seleção de formato (JSON, XML, Excel)
- Date picker para período
- Select para filtrar por vendedor
- Botão de download com loading state
- Preview dos dados antes do download (para JSON)
- Histórico de relatórios gerados com data e hora
- Indicador visual do tamanho do arquivo
- Mensagens de sucesso/erro com toast
- Validação de datas (data final não pode ser menor que inicial)

### 6. Notificações em Tempo Real
- WebSocket para atualizações
- Notificações push
- Alertas de estoque
- Lembretes de vencimento

Implemente essas funcionalidades com foco na usabilidade e performance.
```

## Exemplo de Página de Relatórios Contábeis

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import { Download, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Card } from '@/components/ui/card';

const reportSchema = z.object({
  reportType: z.enum(['sales', 'products', 'invoices', 'complete']),
  format: z.enum(['json', 'xml', 'excel']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sellerId: z.string().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'Data final deve ser maior que data inicial',
    path: ['endDate'],
  }
);

type ReportFormData = z.infer<typeof reportSchema>;

export default function AccountingReportsPage() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const { register, handleSubmit, formState: { errors } } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reportType: 'complete',
      format: 'excel',
    },
  });

  const onSubmit = async (data: ReportFormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Erro ao gerar relatório');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-${data.reportType}-${Date.now()}.${data.format === 'excel' ? 'xlsx' : data.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Add to history
      setHistory([
        {
          type: data.reportType,
          format: data.format,
          date: new Date().toISOString(),
          size: blob.size,
        },
        ...history,
      ]);

      toast.success('Relatório gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Relatórios Contábeis</h1>
        <p className="text-gray-600">
          Gere relatórios completos para envio à contabilidade
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Gerar Novo Relatório
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Tipo de Relatório
              </label>
              <Select {...register('reportType')}>
                <option value="sales">Relatório de Vendas</option>
                <option value="products">Relatório de Produtos</option>
                <option value="invoices">Relatório de Notas Fiscais</option>
                <option value="complete">Relatório Completo</option>
              </Select>
              {errors.reportType && (
                <p className="text-red-500 text-sm mt-1">{errors.reportType.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Formato
              </label>
              <Select {...register('format')}>
                <option value="excel">Excel (.xlsx)</option>
                <option value="xml">XML</option>
                <option value="json">JSON</option>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Data Inicial
                </label>
                <DatePicker {...register('startDate')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Data Final
                </label>
                <DatePicker {...register('endDate')} />
                {errors.endDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Gerar e Baixar Relatório
                </>
              )}
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Histórico
          </h2>

          <div className="space-y-3">
            {history.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum relatório gerado ainda</p>
            ) : (
              history.map((item, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm capitalize">
                      {item.type}
                    </span>
                    <span className="text-xs text-gray-500 uppercase">
                      {item.format}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(item.date).toLocaleString('pt-BR')}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {(item.size / 1024).toFixed(2)} KB
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">📊</div>
          <div className="mt-2 text-sm font-medium">Vendas</div>
          <div className="text-xs text-gray-500">Relatório detalhado</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-green-600">📦</div>
          <div className="mt-2 text-sm font-medium">Produtos</div>
          <div className="text-xs text-gray-500">Estoque e vendas</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-purple-600">📄</div>
          <div className="mt-2 text-sm font-medium">Notas Fiscais</div>
          <div className="text-xs text-gray-500">Documentos fiscais</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-orange-600">📋</div>
          <div className="mt-2 text-sm font-medium">Completo</div>
          <div className="text-xs text-gray-500">Todos os dados</div>
        </Card>
      </div>
    </div>
  );
}
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
