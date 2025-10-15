# Prompt para Desenvolvimento de App React Native - API Lojas SaaS

Use este prompt com o ChatGPT-5 para desenvolver um aplicativo móvel completo em React Native para a API Lojas SaaS.

## Prompt Principal

```
Crie um aplicativo móvel completo em React Native para a API Lojas SaaS. O app deve ser um sistema PDV (Ponto de Venda) móvel para vendedores e um painel administrativo para empresas.

### Funcionalidades Obrigatórias:

#### 1. Autenticação e Autorização
- Login para Vendedor e Empresa
- Biometria (Touch ID / Face ID)
- Diferentes interfaces baseadas no tipo de usuário
- Gerenciamento de sessão seguro
- Logout automático por inatividade

#### 2. Dashboard Vendedor
- Métricas de vendas do dia
- Produtos mais vendidos
- Meta de vendas
- Status do caixa
- Notificações importantes

#### 3. Sistema de Vendas (PDV)
- Interface otimizada para vendas rápidas
- Busca de produtos por código de barras
- Carrinho de compras
- Cálculo automático de troco
- Múltiplas formas de pagamento
- Impressão de cupom
- Histórico de vendas

#### 4. Gerenciamento de Produtos
- Lista de produtos com busca
- Filtros por categoria
- Detalhes do produto
- Controle de estoque
- Alertas de estoque baixo

#### 5. Clientes
- Lista de clientes
- Busca por nome/CPF
- Cadastro de novos clientes
- Histórico de compras
- Vendas a prazo

#### 6. Relatórios
- Vendas por período
- Produtos mais vendidos
- Comissões do vendedor
- Relatórios de fechamento

#### 7. Configurações
- Perfil do usuário
- Configurações da impressora
- Sincronização offline
- Backup de dados

### Tecnologias e Bibliotecas:

- **Framework**: React Native 0.72+
- **Navigation**: React Navigation v6
- **State Management**: Zustand ou Redux Toolkit
- **HTTP Client**: Axios
- **Database Local**: SQLite com react-native-sqlite-storage
- **UI Components**: React Native Elements ou NativeBase
- **Icons**: React Native Vector Icons
- **Charts**: Victory Native
- **Forms**: React Hook Form + Yup
- **Camera**: React Native Vision Camera
- **Barcode**: React Native Vision Camera + ML Kit
- **Biometrics**: React Native Touch ID / Face ID
- **Storage**: AsyncStorage
- **Networking**: NetInfo
- **Permissions**: React Native Permissions
- **Printing**: React Native Printer
- **QR Code**: React Native QR Code Generator
- **Date Picker**: React Native Date Picker
- **Image Picker**: React Native Image Picker
- **Push Notifications**: React Native Push Notification
- **Splash Screen**: React Native Splash Screen

### Estrutura de Pastas:

```
src/
├── components/
│   ├── common/
│   ├── forms/
│   ├── charts/
│   └── sales/
├── screens/
│   ├── auth/
│   ├── dashboard/
│   ├── sales/
│   ├── products/
│   ├── customers/
│   ├── reports/
│   └── settings/
├── navigation/
├── services/
│   ├── api.ts
│   ├── auth.ts
│   ├── database.ts
│   └── sync.ts
├── store/
├── hooks/
├── utils/
├── constants/
└── types/
```

### API Endpoints (mesmos da API):

Base URL: `https://your-api-domain.com/api`

#### Autenticação
- `POST /auth/login` - Login
- `GET /auth/me` - Dados do usuário

#### Vendas
- `GET /sale/my-sales` - Vendas do vendedor
- `POST /sale` - Criar venda
- `GET /sale/:id` - Buscar venda

#### Produtos
- `GET /product` - Listar produtos
- `GET /product/barcode/:barcode` - Buscar por código

#### Clientes
- `GET /customer` - Listar clientes
- `POST /customer` - Criar cliente

### Funcionalidades Específicas Mobile:

#### 1. Sistema PDV Otimizado
```tsx
interface PDVScreenProps {
  onProductAdd: (product: Product) => void;
  onSaleComplete: (sale: Sale) => void;
  cart: CartItem[];
}

// Interface com botões grandes, fácil navegação
// Carrinho sempre visível na parte inferior
// Botões de pagamento destacados
```

#### 2. Scanner de Código de Barras
```tsx
interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  onClose: () => void;
}

// Usar câmera nativa
// Detecção em tempo real
// Feedback visual e sonoro
// Suporte a múltiplos formatos
```

#### 3. Sincronização Offline
```tsx
interface SyncService {
  syncSales: () => Promise<void>;
  syncProducts: () => Promise<void>;
  syncCustomers: () => Promise<void>;
  getPendingSync: () => Promise<SyncItem[]>;
}

// SQLite local para dados offline
// Sincronização automática quando online
// Queue de operações pendentes
// Resolução de conflitos
```

#### 4. Impressão Mobile
```tsx
interface PrinterService {
  connect: (printer: Printer) => Promise<void>;
  printReceipt: (receipt: Receipt) => Promise<void>;
  testConnection: () => Promise<boolean>;
}

// Conectividade Bluetooth
// Impressão térmica
// Formatação de cupons
// Configurações de impressora
```

### Componentes Principais:

#### 1. Dashboard Vendedor
```tsx
const SellerDashboard = () => {
  const [metrics, setMetrics] = useState<SellerMetrics>();
  const [recentSales, setRecentSales] = useState<Sale[]>([]);

  return (
    <ScrollView>
      <MetricCards metrics={metrics} />
      <RecentSales sales={recentSales} />
      <QuickActions />
    </ScrollView>
  );
};
```

#### 2. PDV Interface
```tsx
const PDVScreen = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [scannerVisible, setScannerVisible] = useState(false);

  return (
    <View style={styles.container}>
      <ProductSearch onProductSelect={addToCart} />
      <CartDisplay cart={cart} />
      <PaymentSection onComplete={completeSale} />
      <BarcodeScanner 
        visible={scannerVisible}
        onDetect={handleBarcodeDetected}
      />
    </View>
  );
};
```

#### 3. Product List
```tsx
const ProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <FlatList
      data={filteredProducts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ProductCard product={item} />}
      ListHeaderComponent={<SearchBar />}
      refreshControl={<RefreshControl onRefresh={loadProducts} />}
    />
  );
};
```

### Estado Global:

```tsx
interface AppState {
  auth: {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    biometricEnabled: boolean;
  };
  sales: {
    cart: CartItem[];
    currentSale: Sale | null;
    salesHistory: Sale[];
  };
  products: {
    products: Product[];
    categories: Category[];
    lowStock: Product[];
  };
  customers: {
    customers: Customer[];
    searchResults: Customer[];
  };
  sync: {
    isOnline: boolean;
    lastSync: Date | null;
    pendingSync: SyncItem[];
  };
  settings: {
    printer: PrinterConfig | null;
    theme: 'light' | 'dark';
    language: string;
  };
}
```

### Navegação:

```tsx
// Stack Navigator principal
const AppNavigator = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <Tab.Navigator>
          <Tab.Screen 
            name="Dashboard" 
            component={DashboardScreen}
            options={{ tabBarIcon: DashboardIcon }}
          />
          <Tab.Screen 
            name="PDV" 
            component={PDVScreen}
            options={{ tabBarIcon: SalesIcon }}
          />
          <Tab.Screen 
            name="Produtos" 
            component={ProductsScreen}
            options={{ tabBarIcon: ProductsIcon }}
          />
          <Tab.Screen 
            name="Clientes" 
            component={CustomersScreen}
            options={{ tabBarIcon: CustomersIcon }}
          />
          <Tab.Screen 
            name="Relatórios" 
            component={ReportsScreen}
            options={{ tabBarIcon: ReportsIcon }}
          />
        </Tab.Navigator>
      ) : (
        <Stack.Navigator>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Biometric" component={BiometricScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};
```

### Serviços:

#### 1. API Service
```tsx
class ApiService {
  private baseURL = 'https://your-api-domain.com/api';
  private token: string | null = null;

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await axios.post(`${this.baseURL}/auth/login`, credentials);
    this.token = response.data.access_token;
    return response.data;
  }

  async getProducts(): Promise<Product[]> {
    const response = await axios.get(`${this.baseURL}/product`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    return response.data.products;
  }

  async createSale(sale: CreateSaleDto): Promise<Sale> {
    const response = await axios.post(`${this.baseURL}/sale`, sale, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    return response.data;
  }
}
```

#### 2. Database Service
```tsx
class DatabaseService {
  private db: SQLiteDatabase;

  async initDatabase() {
    this.db = await SQLite.openDatabase('lojas_saas.db');
    await this.createTables();
  }

  async createTables() {
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        barcode TEXT UNIQUE,
        price REAL NOT NULL,
        stock_quantity INTEGER NOT NULL,
        category TEXT,
        last_sync DATETIME
      )
    `);
  }

  async saveProduct(product: Product) {
    await this.db.executeSql(
      'INSERT OR REPLACE INTO products VALUES (?, ?, ?, ?, ?, ?, ?)',
      [product.id, product.name, product.barcode, product.price, 
       product.stockQuantity, product.category, new Date()]
    );
  }

  async getProducts(): Promise<Product[]> {
    const [results] = await this.db.executeSql('SELECT * FROM products');
    return this.parseProducts(results);
  }
}
```

#### 3. Sync Service
```tsx
class SyncService {
  async syncOfflineData() {
    if (!NetInfo.isConnected) return;

    await this.syncPendingSales();
    await this.syncProducts();
    await this.syncCustomers();
  }

  async syncPendingSales() {
    const pendingSales = await DatabaseService.getPendingSales();
    
    for (const sale of pendingSales) {
      try {
        await ApiService.createSale(sale);
        await DatabaseService.markSaleAsSynced(sale.id);
      } catch (error) {
        console.error('Erro ao sincronizar venda:', error);
      }
    }
  }
}
```

### Funcionalidades Específicas:

#### 1. Scanner de Código de Barras
```tsx
const BarcodeScanner = ({ onDetect, onClose }: BarcodeScannerProps) => {
  const { hasPermission, requestPermission } = useCameraPermission();

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, []);

  const handleBarcodeDetected = (barcodes: Barcode[]) => {
    if (barcodes.length > 0) {
      const barcode = barcodes[0];
      onDetect(barcode.data);
      // Feedback sonoro
      Vibration.vibrate(100);
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <Camera
        onBarcodeDetected={handleBarcodeDetected}
        barcodeTypes={[BarcodeType.EAN13, BarcodeType.EAN8, BarcodeType.CODE128]}
      />
    </Modal>
  );
};
```

#### 2. Impressão Bluetooth
```tsx
const PrinterService = {
  async connectPrinter(macAddress: string) {
    await BluetoothEscposPrinter.connect(macAddress);
  },

  async printReceipt(receipt: Receipt) {
    await BluetoothEscposPrinter.printText(receipt.toString());
    await BluetoothEscposPrinter.cutPaper();
  },

  async testPrint() {
    await BluetoothEscposPrinter.printText('TESTE DE IMPRESSÃO\n');
    await BluetoothEscposPrinter.cutPaper();
  }
};
```

#### 3. Autenticação Biométrica
```tsx
const useBiometricAuth = () => {
  const authenticate = async () => {
    const result = await TouchID.authenticate('Use sua biometria para acessar');
    return result;
  };

  const isAvailable = async () => {
    const biometryType = await TouchID.getBiometryType();
    return biometryType !== null;
  };

  return { authenticate, isAvailable };
};
```

### Configuração do Projeto:

#### package.json
```json
{
  "name": "lojas-saas-mobile",
  "version": "1.0.0",
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "jest",
    "lint": "eslint ."
  },
  "dependencies": {
    "react-native": "0.72.6",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "react-native-sqlite-storage": "^6.0.1",
    "react-native-vision-camera": "^3.6.17",
    "react-native-bluetooth-escpos-printer": "^0.1.4",
    "react-native-touch-id": "^4.4.1",
    "@react-native-async-storage/async-storage": "^1.19.5",
    "axios": "^1.6.2",
    "zustand": "^4.4.7"
  }
}
```

#### android/app/src/main/AndroidManifest.xml
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.VIBRATE" />
```

### Funcionalidades de Venda:

#### 1. Carrinho de Compras
```tsx
const Cart = ({ items, onUpdate, onRemove }: CartProps) => {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <View style={styles.cart}>
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <CartItem 
            item={item}
            onUpdate={(quantity) => onUpdate(item.id, quantity)}
            onRemove={() => onRemove(item.id)}
          />
        )}
      />
      <View style={styles.total}>
        <Text style={styles.totalText}>Total: R$ {total.toFixed(2)}</Text>
      </View>
    </View>
  );
};
```

#### 2. Seleção de Pagamento
```tsx
const PaymentSelection = ({ total, onPayment }: PaymentProps) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountPaid, setAmountPaid] = useState(total);

  const change = amountPaid - total;

  return (
    <View style={styles.payment}>
      <Text style={styles.total}>Total: R$ {total.toFixed(2)}</Text>
      
      <Picker
        selectedValue={paymentMethod}
        onValueChange={setPaymentMethod}
      >
        <Picker.Item label="Dinheiro" value="cash" />
        <Picker.Item label="Cartão de Crédito" value="credit_card" />
        <Picker.Item label="Cartão de Débito" value="debit_card" />
        <Picker.Item label="PIX" value="pix" />
        <Picker.Item label="A Prazo" value="installment" />
      </Picker>

      {paymentMethod === 'cash' && (
        <TextInput
          value={amountPaid.toString()}
          onChangeText={(text) => setAmountPaid(parseFloat(text) || 0)}
          placeholder="Valor pago"
          keyboardType="numeric"
        />
      )}

      {change > 0 && (
        <Text style={styles.change}>Troco: R$ {change.toFixed(2)}</Text>
      )}

      <TouchableOpacity 
        style={styles.payButton}
        onPress={() => onPayment({ method: paymentMethod, amount: amountPaid })}
      >
        <Text style={styles.payButtonText}>Finalizar Venda</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### Offline Functionality:

```tsx
const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    return unsubscribe;
  }, []);

  if (isOnline) return null;

  return (
    <View style={styles.offlineBanner}>
      <Text style={styles.offlineText}>
        Modo offline - Dados serão sincronizados quando online
      </Text>
    </View>
  );
};
```

### Requisitos Técnicos:

1. **React Native 0.72+** com TypeScript
2. **Android 6.0+** (API 23+)
3. **iOS 12.0+**
4. **Câmera** para scanner de código de barras
5. **Bluetooth** para impressora térmica
6. **Biometria** para autenticação
7. **SQLite** para dados offline
8. **Push Notifications** para alertas

### Entregáveis:

1. Código fonte completo
2. APK para Android
3. IPA para iOS
4. Documentação de instalação
5. Guia de configuração
6. Testes automatizados

### Exemplo de Tela Principal:

```tsx
const MainScreen = () => {
  const { user } = useAuth();
  const { syncOfflineData } = useSync();

  useEffect(() => {
    syncOfflineData();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <OfflineIndicator />
      
      <View style={styles.header}>
        <Text style={styles.greeting}>Olá, {user?.name}</Text>
        <Text style={styles.role}>{user?.role}</Text>
      </View>

      <ScrollView style={styles.content}>
        <MetricCards />
        <QuickActions />
        <RecentSales />
      </ScrollView>

      <FloatingActionButton onPress={openPDV} />
    </SafeAreaView>
  );
};
```

Crie um aplicativo móvel completo, otimizado para vendas e com funcionalidades offline robustas. O foco deve ser na usabilidade, performance e confiabilidade para operações comerciais.
```

## Prompt Adicional para Funcionalidades Avançadas

```
Agora implemente as seguintes funcionalidades avançadas:

### 1. Sistema de Comissões
- Cálculo automático de comissões
- Relatórios de comissões
- Metas de vendas
- Ranking de vendedores

### 2. Gestão de Estoque Avançada
- Alertas de estoque baixo
- Previsão de demanda
- Controle de vencimento
- Movimentação de estoque

### 3. Relatórios Avançados
- Gráficos interativos
- Exportação de dados
- Relatórios personalizados
- Dashboards em tempo real

### 4. Integração com E-commerce
- Sincronização de produtos
- Atualização de preços
- Gestão de estoque centralizada
- Pedidos online

### 5. Sistema de Fidelidade
- Programa de pontos
- Cupons de desconto
- Cashback
- Histórico de benefícios

Implemente essas funcionalidades mantendo a performance e usabilidade.
```

---

Use estes prompts sequencialmente para desenvolver um aplicativo móvel completo e profissional para a API Lojas SaaS.
