const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const updated = await prisma.level.update({
            where: { rank: 1 },
            data: { verifier: '11223344' }
        });
        console.log('Updated rank 1 with sample ID:', updated);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
