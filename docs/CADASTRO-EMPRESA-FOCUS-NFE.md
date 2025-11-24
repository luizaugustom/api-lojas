# ✅ Cadastro Automático de Empresa no Focus NFe

## Boa Notícia! 🎉
**O cadastro da empresa no Focus NFe agora é AUTOMÁTICO!**

Quando você envia o certificado digital pela primeira vez, o sistema:
1. ✅ Verifica se a empresa já existe no Focus NFe
2. ✅ Se não existir, cria automaticamente com todos os dados
3. ✅ Envia o certificado junto com o cadastro
4. ✅ Habilita NFe e NFCe automaticamente

## Como Funciona o Processo Automático

### Passo 1: Configure a API Key (Administrador - Uma Vez)
O administrador do sistema precisa configurar a API Key do Focus NFe:
1. Acesse **Configurações Globais** do sistema
2. Preencha **"API Key do Focus NFe"** com: `sZpZRkLG1uzJk7ge73fkBdSlXLMD4ZUi`
3. Selecione o **Ambiente**: 
   - `sandbox` para testes
   - `production` para emissão real
4. Clique em **Salvar**

### Passo 2: Envie o Certificado (Primeira Vez)
Quando você enviar o certificado pela primeira vez:

1. Acesse **Configurações da Empresa** no sistema
2. Na seção **"Certificado Digital"**:
   - Digite a **senha do certificado**
   - Clique em **"Salvar Senha"**
   - Aguarde: "Senha salva com sucesso"
3. Clique em **"Escolher Arquivo"**
4. Selecione o arquivo `.pfx` ou `.p12`
5. Clique em **"Enviar Certificado"**

**O que acontece automaticamente:**
```
✅ Sistema verifica se empresa existe no Focus NFe
❌ Empresa não encontrada (primeira vez)
✅ Sistema cria empresa automaticamente com:
   • CNPJ
   • Razão Social
   • Endereço completo
   • Inscrição Estadual
   • Regime Tributário
   • Email e Telefone
✅ Sistema habilita NFe e NFCe
✅ Sistema envia o certificado
✅ Tudo pronto para emitir notas!
```

### Passo 3: Próximas Vezes
Nas próximas vezes que você enviar um certificado (renovação):
- O sistema detecta que a empresa já existe
- Apenas atualiza o certificado
- Mantém todas as configurações anteriores

## Dados Enviados Automaticamente

Quando o sistema cria a empresa no Focus NFe, envia:

### Dados Obrigatórios
- ✅ **CNPJ** (da empresa cadastrada no MontShop)
- ✅ **Razão Social** (nome da empresa)
- ✅ **Certificado Digital** (arquivo .pfx/.p12 convertido para base64)
- ✅ **Senha do Certificado**
- ✅ **Habilita NFe**: true
- ✅ **Habilita NFCe**: true

### Dados Opcionais (se cadastrados no MontShop)
- 📧 **Email** da empresa
- 📞 **Telefone** da empresa
- 🏢 **Inscrição Estadual**
- 🏢 **Inscrição Municipal**
- 💼 **Regime Tributário**:
  - 1 = Simples Nacional
  - 2 = Simples Nacional - Excesso
  - 3 = Regime Normal
  - 4 = MEI
- 🏠 **Endereço Completo**:
  - Logradouro (rua/avenida)
  - Número
  - Complemento
  - Bairro
  - Cidade
  - Estado (UF)
  - CEP

**💡 Dica:** Quanto mais dados você cadastrar no MontShop, mais completo será o cadastro no Focus NFe!

## Verificação do Cadastro

### Como Confirmar que Funcionou?

#### Pelos Logs do Servidor
Procure por estas mensagens nos logs:
```
✅ "Buscando ID da empresa no Focus NFe - CNPJ: 63117232000144"
✅ "Empresa não encontrada no Focus NFe, será criada automaticamente"
✅ "Criando empresa no Focus NFe - CNPJ: 63117232000144, Nome: Empresa Teste"
✅ "Empresa criada com sucesso no Focus NFe"
✅ "Certificado enviado ao Focus NFe para empresa: {id}"
```

#### Pelo Painel Focus NFe (Opcional)
Você pode confirmar acessando: https://focusnfe.com.br
1. Faça login com a API Key como token
2. Entre na lista de **Empresas**
3. Localize a empresa pelo CNPJ
4. Verifique:
   - ✅ Empresa cadastrada
   - ✅ Certificado válido (com data de validade)
   - ✅ NFe e NFCe habilitados

## Solução de Problemas (Troubleshooting)

### ❌ Erro: "API Key do Focus NFe não configurada"
**Causa:** O administrador não configurou a API Key
**Solução:**
1. Peça ao administrador para acessar **Configurações Globais**
2. Preencher **"API Key do Focus NFe"**: `sZpZRkLG1uzJk7ge73fkBdSlXLMD4ZUi`
3. Selecionar **Ambiente** (sandbox ou production)
4. Clicar em **Salvar**

### ❌ Erro: "Senha do certificado não informada"
**Causa:** A senha do certificado não foi salva antes
**Solução:**
1. Digite a senha do certificado
2. Clique em **"Salvar Senha"** PRIMEIRO
3. Aguarde a confirmação
4. Depois envie o certificado

### ❌ Erro: "Certificado não pertence ao CNPJ informado"
**Causa:** O certificado .pfx/.p12 é de outro CNPJ
**Solução:**
- Verifique se o arquivo do certificado é realmente da empresa correta
- O CNPJ do certificado deve ser igual ao CNPJ cadastrado no MontShop

### ❌ Erro: "Senha do certificado incorreta"
**Causa:** A senha digitada está errada
**Solução:**
1. Digite a senha correta do certificado
2. Clique em **"Salvar Senha"**
3. Tente enviar novamente

### ❌ Erro: "Certificado vencido"
**Causa:** A validade do certificado expirou
**Solução:**
- Renove o certificado digital (A1) com uma Autoridade Certificadora
- Envie o novo certificado

### ❌ Erro: "Arquivo muito grande. Tamanho máximo: 10MB"
**Causa:** O arquivo do certificado está maior que 10MB
**Solução:**
- Certificados A1 normalmente têm menos de 10KB
- Verifique se o arquivo selecionado é realmente um certificado
- Formatos aceitos: `.pfx` ou `.p12`

### ❌ Erro: "Arquivo deve ser .pfx ou .p12"
**Causa:** Extensão do arquivo incorreta
**Solução:**
- Use apenas certificados no formato `.pfx` ou `.p12`
- Certificados `.cer` ou `.crt` não são aceitos (são apenas chaves públicas)

### ❌ Erro ao criar empresa: "Campo obrigatório não informado"
**Causa:** Falta preencher dados cadastrais da empresa no MontShop
**Solução:**
1. Acesse **Cadastro da Empresa** no MontShop
2. Preencha TODOS os campos obrigatórios:
   - ✅ Razão Social
   - ✅ CNPJ
   - ✅ Endereço completo (Rua, Número, Bairro, Cidade, UF, CEP)
   - ✅ Inscrição Estadual
   - ✅ Regime Tributário
3. Salve as alterações
4. Tente enviar o certificado novamente

### ⚠️ Erro de conexão ou timeout
**Causa:** Problema de rede ou servidor Focus NFe indisponível
**Solução:**
1. Verifique sua conexão com a internet
2. Aguarde alguns minutos e tente novamente
3. Verifique o status do Focus NFe: https://status.focusnfe.com.br

## Ambientes Focus NFe

### Homologação (Testes)
- URL: https://homologacao.focusnfe.com.br
- Use para testar antes de emitir notas fiscais reais
- Não tem valor fiscal
- Grátis

### Produção
- URL: https://focusnfe.com.br
- Ambiente oficial para emissão de notas fiscais
- Tem valor fiscal e jurídico
- Requer contrato com Focus NFe

## Suporte

Se ainda tiver problemas:
1. Entre em contato com o suporte Focus NFe: **suporte@focusnfe.com.br**
2. Informe:
   - CNPJ da empresa
   - Tipo de erro
   - Prints de tela (sem mostrar senhas)

## Observações Importantes

⚠️ **Segurança**
- Nunca compartilhe a senha do certificado
- Nunca compartilhe a API Key do Focus NFe
- O certificado A1 é válido por 1 ano - renove antes do vencimento

✅ **Boas Práticas**
- Mantenha backup do certificado .pfx em local seguro
- Anote a senha do certificado em local protegido
- Configure alerta de vencimento do certificado
- Teste primeiro em homologação antes de produção
