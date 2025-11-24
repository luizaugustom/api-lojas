# Como Cadastrar Empresa no Focus NFe

## Problema
Ao tentar enviar o certificado digital pela página de configurações, você recebe o erro:
```
Empresa não cadastrada no Focus NFe. 
Por favor, cadastre a empresa manualmente no Painel API do Focus NFe.
```

## Por Que Isso Acontece?
A API do Focus NFe **não permite criar empresas programaticamente**. Cada empresa precisa ser cadastrada manualmente no Painel API do Focus NFe primeiro.

## Solução: Cadastrar Empresa no Painel Focus NFe

### Passo 1: Acessar o Painel Focus NFe
1. Acesse: **https://focusnfe.com.br** ou **https://homologacao.focusnfe.com.br** (para testes)
2. Faça login com suas credenciais de administrador
   - Use o mesmo login configurado no sistema MontShop

### Passo 2: Cadastrar a Empresa
1. No painel, vá em **"Empresas"** ou **"Cadastro de Empresas"**
2. Clique em **"Nova Empresa"** ou **"Adicionar Empresa"**
3. Preencha os dados da empresa:
   - **CNPJ** (obrigatório) - mesmo CNPJ cadastrado no MontShop
   - **Razão Social** (obrigatório)
   - **Nome Fantasia** (opcional)
   - **Endereço Completo** (obrigatório para NFe/NFCe)
     * Logradouro, Número, Complemento
     * Bairro, Cidade, UF, CEP
   - **Inscrição Estadual** (obrigatório para NFe/NFCe)
   - **Inscrição Municipal** (obrigatório para NFSe, se aplicável)
   - **Regime Tributário** (obrigatório)
     * 1 - Simples Nacional
     * 2 - Simples Nacional - Excesso
     * 3 - Regime Normal
     * 4 - MEI
   - **Email** (opcional, mas recomendado)
   - **Telefone** (opcional)

4. **Habilite os documentos fiscais** que a empresa vai emitir:
   - ✅ **Habilitar NFe** (Nota Fiscal Eletrônica)
   - ✅ **Habilitar NFCe** (Nota Fiscal de Consumidor Eletrônica)
   - ⚠️ **Não envie o certificado ainda** - faremos isso pelo sistema

5. Clique em **"Salvar"** ou **"Criar Empresa"**

### Passo 3: Anotar o ID da Empresa (Opcional)
- Após salvar, anote o **ID da empresa** gerado pelo Focus NFe
- Este ID será usado automaticamente pelo sistema quando você enviar o certificado

### Passo 4: Enviar Certificado pelo Sistema MontShop
Agora que a empresa está cadastrada no Focus NFe:

1. Acesse as **Configurações da Empresa** no sistema MontShop
2. Na seção **"Configuração Focus NFe"**:
   - ✅ Verifique se aparece o alerta VERDE confirmando que a API Key está configurada
   - Se aparecer alerta VERMELHO, peça ao administrador para configurar a API Key
3. Na seção **"Certificado Digital"**:
   - Informe a **senha do certificado**
   - Clique em **"Salvar Senha"**
   - Aguarde confirmação: "Senha salva com sucesso"
4. Clique em **"Escolher Arquivo"**
5. Selecione o arquivo `.pfx` ou `.p12` do certificado
6. Clique em **"Enviar Certificado"**
7. Aguarde a confirmação: **"Certificado enviado com sucesso!"**

## Verificação Final

### Como Confirmar que Deu Certo?
Após enviar o certificado, você pode verificar no Painel Focus NFe:

1. Acesse novamente: https://focusnfe.com.br
2. Entre na lista de **Empresas**
3. Localize a empresa pelo CNPJ
4. Veja a coluna **"Certificado"**:
   - ✅ **Verde com data de validade** = Certificado enviado com sucesso
   - ❌ **Vermelho ou vazio** = Certificado não enviado ou inválido

### O Que Fazer se Continuar Dando Erro?

#### Erro: "Empresa não cadastrada no Focus NFe"
**Causa:** A empresa ainda não foi criada no painel Focus NFe
**Solução:** Siga os passos 1 e 2 acima

#### Erro: "Certificado não pertence ao CNPJ informado"
**Causa:** O certificado .pfx/.p12 é de outro CNPJ
**Solução:** Verifique se o certificado é realmente da empresa correta

#### Erro: "Senha do certificado incorreta"
**Causa:** A senha informada está errada
**Solução:** 
1. Digite a senha correta
2. Clique em "Salvar Senha" primeiro
3. Depois envie o certificado

#### Erro: "Certificado vencido"
**Causa:** A validade do certificado expirou
**Solução:** Renove o certificado digital (A1) e envie o novo

#### Erro: "API Key do Focus NFe não configurada"
**Causa:** O administrador não configurou a API Key do Focus NFe
**Solução:** Solicite ao administrador para:
1. Acessar Configurações Globais
2. Preencher "API Key do Focus NFe"
3. Selecionar o ambiente (Produção ou Homologação)
4. Salvar

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
