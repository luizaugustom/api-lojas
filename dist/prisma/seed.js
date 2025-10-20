"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Iniciando seed do banco de dados...');
    const hashedAdminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.admin.upsert({
        where: { login: 'admin@example.com' },
        update: {},
        create: {
            login: 'admin@example.com',
            password: hashedAdminPassword,
        },
    });
    console.log('✅ Admin criado:', admin.login);
    const hashedCompanyPassword = await bcrypt.hash('company123', 12);
    const company = await prisma.company.upsert({
        where: { cnpj: '12.345.678/0001-90' },
        update: {},
        create: {
            name: 'Loja Exemplo LTDA',
            login: 'empresa@example.com',
            password: hashedCompanyPassword,
            phone: '(11) 99999-9999',
            cnpj: '12.345.678/0001-90',
            stateRegistration: '123456789',
            municipalRegistration: '12345678',
            email: 'contato@lojaexemplo.com',
            brandColor: '#FF0000',
            isActive: true,
            zipCode: '01234-567',
            state: 'SP',
            city: 'São Paulo',
            district: 'Centro',
            street: 'Rua das Flores',
            number: '123',
            complement: 'Sala 1',
            adminId: admin.id,
        },
    });
    console.log('✅ Empresa criada:', company.name);
    const hashedSellerPassword = await bcrypt.hash('seller123', 12);
    const seller = await prisma.seller.upsert({
        where: { login: 'vendedor@example.com' },
        update: {},
        create: {
            login: 'vendedor@example.com',
            password: hashedSellerPassword,
            name: 'João Silva',
            cpf: '123.456.789-00',
            email: 'joao@example.com',
            phone: '(11) 88888-8888',
            companyId: company.id,
        },
    });
    console.log('✅ Vendedor criado:', seller.name);
    const products = [
        {
            name: 'Smartphone Samsung Galaxy',
            barcode: '7891234567890',
            size: '128GB',
            stockQuantity: 50,
            price: 1299.99,
            category: 'Eletrônicos',
            companyId: company.id,
        },
        {
            name: 'Notebook Dell Inspiron',
            barcode: '7891234567891',
            size: '15"',
            stockQuantity: 25,
            price: 2499.99,
            category: 'Eletrônicos',
            companyId: company.id,
        },
        {
            name: 'Tênis Nike Air Max',
            barcode: '7891234567892',
            size: '42',
            stockQuantity: 100,
            price: 399.99,
            category: 'Calçados',
            companyId: company.id,
        },
        {
            name: 'Camiseta Polo',
            barcode: '7891234567893',
            size: 'M',
            stockQuantity: 75,
            price: 89.99,
            category: 'Roupas',
            companyId: company.id,
        },
        {
            name: 'Cafeteira Elétrica',
            barcode: '7891234567894',
            size: '1.5L',
            stockQuantity: 30,
            price: 199.99,
            category: 'Eletrodomésticos',
            companyId: company.id,
        },
    ];
    for (const productData of products) {
        const product = await prisma.product.upsert({
            where: { barcode: productData.barcode },
            update: {},
            create: productData,
        });
        console.log('✅ Produto criado:', product.name);
    }
    const customer = await prisma.customer.upsert({
        where: { id: 'customer-1' },
        update: {},
        create: {
            id: 'customer-1',
            name: 'Maria Santos',
            phone: '(11) 77777-7777',
            cpfCnpj: '987.654.321-00',
            zipCode: '04567-890',
            state: 'SP',
            city: 'São Paulo',
            district: 'Vila Madalena',
            street: 'Rua Augusta',
            number: '456',
            complement: 'Apto 12',
            companyId: company.id,
        },
    });
    console.log('✅ Cliente criado:', customer.name);
    const bill = await prisma.billToPay.create({
        data: {
            title: 'Conta de luz - Janeiro 2024',
            barcode: '12345678901234567890',
            paymentInfo: 'Pagar na agência do banco',
            dueDate: new Date('2024-02-15'),
            amount: 150.75,
            companyId: company.id,
        },
    });
    console.log('✅ Conta a pagar criada:', bill.title);
    const cashClosure = await prisma.cashClosure.create({
        data: {
            openingAmount: 100.00,
            companyId: company.id,
        },
    });
    console.log('✅ Fechamento de caixa criado:', cashClosure.id);
    console.log('🎉 Seed concluído com sucesso!');
    console.log('\n📋 Credenciais de acesso:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Empresa: empresa@example.com / company123');
    console.log('Vendedor: vendedor@example.com / seller123');
}
main()
    .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map