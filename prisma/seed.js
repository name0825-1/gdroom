const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
    await prisma.level.deleteMany();

    const levels = [];
    for (let i = 1; i <= 200; i++) {
        levels.push({
            rank: i,
            name: "--",
            creator: "--",
            verifier: "--",
            imageUrl: null,
        });
    }

    await prisma.level.createMany({ data: levels });
    console.log("✅ Seeded 200 levels successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
