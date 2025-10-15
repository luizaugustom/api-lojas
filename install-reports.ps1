# Script de Instalação do Módulo de Relatórios
# Execute este script para instalar as dependências necessárias

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Instalação do Módulo de Relatórios" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está na pasta correta
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: package.json não encontrado!" -ForegroundColor Red
    Write-Host "Execute este script na raiz do projeto." -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
Write-Host ""

# Instalar dependências
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Dependências instaladas com sucesso!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "📋 Dependências adicionadas:" -ForegroundColor Cyan
    Write-Host "  - exceljs@^4.4.0" -ForegroundColor White
    Write-Host "  - xml2js@^0.6.2" -ForegroundColor White
    Write-Host "  - @types/xml2js@^0.4.14" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🔧 Próximos passos:" -ForegroundColor Cyan
    Write-Host "  1. Reinicie o VSCode (Ctrl+Shift+P → 'Reload Window')" -ForegroundColor White
    Write-Host "  2. Execute: npm run start:dev" -ForegroundColor White
    Write-Host "  3. Acesse: http://localhost:3000/api/docs" -ForegroundColor White
    Write-Host "  4. Teste o endpoint POST /reports/generate" -ForegroundColor White
    Write-Host ""
    
    Write-Host "📖 Documentação:" -ForegroundColor Cyan
    Write-Host "  - docs/REPORTS.md" -ForegroundColor White
    Write-Host "  - RELATORIOS_CONTABILIDADE.md" -ForegroundColor White
    Write-Host "  - docs/reports-example.html" -ForegroundColor White
    Write-Host ""
    
    Write-Host "✨ Instalação concluída!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Erro ao instalar dependências!" -ForegroundColor Red
    Write-Host "Verifique sua conexão com a internet e tente novamente." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Pressione qualquer tecla para sair..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
