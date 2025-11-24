# ✅ Cadastro Manual de Empresa no Focus NFe

## ⚠️ IMPORTANTE: Cadastro é MANUAL

A **API do Focus NFe NÃO permite cadastro automático de empresas emitentes**.

O cadastro de empresas deve ser feito **MANUALMENTE** através do painel administrativo do Focus NFe.

## 📋 Passo a Passo - Cadastro Manual

### 1. Acessar o Painel Focus NFe

1. Acesse: [https://app.focusnfe.com.br](https://app.focusnfe.com.br)
2. Faça login com suas credenciais (usuário e senha do Focus NFe)
3. Ou utilize a API Key de produção: `sZpZRkLG1uzJk7ge73fkBdSlXLMD4ZUi`

### 2. Criar Nova Empresa

1. No menu lateral, clique em **"Empresas"**
2. Clique em **"Nova Empresa"** ou **"Adicionar Empresa"**
3. Preencha o formulário com os dados da empresa:

### 3. Dados Obrigatórios

**📌 Dados Cadastrais:**
- ✅ **CNPJ**: Ex: `63.117.232/0001-44`
- ✅ **Razão Social**: Ex: `LUIZ AUGUSTO MONTEIRO TECNOLOGIA DA INFORMACAO LTDA`
- ✅ **Nome Fantasia**: Ex: `MontShop`
- ✅ **Inscrição Estadual**: Número da IE (se isento, marcar "Isento")
- ⚪ **Inscrição Municipal**: Opcional (obrigatório para NFSe)

**📍 Endereço Completo:**
- ✅ **CEP**: Ex: `88301-600`
- ✅ **Logradouro**: Ex: `Rua João da Silva`
- ✅ **Número**: Ex: `123`
- ⚪ **Complemento**: Ex: `Sala 1` (opcional)
- ✅ **Bairro**: Ex: `Centro`
- ✅ **Município**: Ex: `Itajaí` (selecione da lista)
- ✅ **UF**: Ex: `SC`

**💼 Informações Tributárias:**
- ✅ **Regime Tributário**: Selecione:
  - Simples Nacional
  - Simples Nacional - Excesso de sublimite
  - Regime Normal
  - MEI

**📧 Contato:**
- ✅ **E-mail**: Ex: `contato@montshop.com`
- ✅ **Telefone**: Ex: `(47) 3333-4444`

**⚙️ Habilitações (IMPORTANTE!):**
- ☑️ **Habilita NFe**: Marcar para emitir Notas Fiscais Eletrônicas
- ☑️ **Habilita NFCe**: Marcar para emitir NFC-e (Nota ao Consumidor)
- ⚪ **Habilita NFSe**: Marcar para emitir Notas de Serviço
- ⚪ **Habilita MDFe**: Marcar para transportadoras
- ⚪ **Habilita CTe**: Marcar para transportadoras

### 4. Salvar Empresa

1. Revise todos os dados preenchidos
2. Clique em **"Salvar"** ou **"Criar Empresa"**
3. Aguarde confirmação do cadastro
4. ✅ Empresa cadastrada com sucesso!

### 5. Após Cadastrar no Focus NFe

Agora você pode **fazer upload do certificado** pelo MontShop:

1. Acesse as **Configurações** da empresa no MontShop
2. Vá na seção **"Configurações Fiscais"**
3. Verifique se aparece o alerta **verde**: ✅ "API Key do Focus NFe configurada"
4. Preencha a **senha do certificado digital**
5. Clique em **"Escolher Arquivo"** e selecione o certificado `.pfx` ou `.p12`
6. Clique em **"Enviar Certificado"**

### 6. Configurar CSC para NFCe (Obrigatório)

Para emitir **NFCe**, você precisa configurar o **CSC (Código de Segurança do Contribuinte)**:

1. Acesse o portal da SEFAZ do seu estado
2. Gere o CSC e ID Token (consulte documentação da SEFAZ)
3. Volte ao painel Focus NFe
4. Edite a empresa cadastrada
5. Preencha os campos:
   - **CSC Produção**: Código gerado na SEFAZ
   - **ID Token Produção**: ID gerado na SEFAZ
6. Salve as alterações

## 🔍 Verificação do Cadastro

### Como confirmar que a empresa está cadastrada?

1. Acesse o painel Focus NFe
2. Vá em **"Empresas"**
3. Procure pela empresa com o CNPJ: `63.117.232/0001-44`
4. Verifique se está listada
5. Clique para editar e confirme:
   - ✅ CNPJ correto
   - ✅ "Habilita NFe" marcado
   - ✅ "Habilita NFCe" marcado
   - ✅ Endereço completo
   - ✅ Regime tributário configurado

### No MontShop:

1. Após cadastrar manualmente no Focus NFe
2. Tente fazer upload do certificado novamente
3. Agora **NÃO** deve aparecer o erro:
   ❌ "Empresa não cadastrada no Focus NFe"
4. ✅ Certificado enviado com sucesso!

## 📞 Suporte

Se tiver dúvidas sobre o cadastro:

- **E-mail Focus NFe**: suporte@focusnfe.com.br
- **Documentação**: https://focusnfe.com.br/doc/#empresas
- **Telefone**: Consulte o site do Focus NFe

---

## ⚙️ Resumo Técnico

### Por que o cadastro é manual?

A API do Focus NFe é voltada para **emissão de documentos fiscais** (NFe, NFCe, NFSe, CTe, MDFe, etc).

O cadastro de empresas emitentes é feito através do:
- ✅ **Painel Administrativo** (interface web)
- ❌ **NÃO via API** (endpoint não existe)

### O que a API MontShop faz?

1. ✅ Envia o **certificado digital** (.pfx) para uma empresa **já cadastrada**
2. ✅ Atualiza configurações fiscais (CSC, senhas, etc)
3. ✅ Emite notas fiscais (NFe, NFCe)
4. ❌ **NÃO cadastra novas empresas** (deve ser manual)

---

**Última Atualização**: 24/11/2025  
**Versão**: 1.0 - Processo Manual
