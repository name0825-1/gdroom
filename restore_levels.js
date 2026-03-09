const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const levelsData = [
    { rank: 1, name: "CellaEonna", creator: "roboingamer", verifier: "133014633" },
    { rank: 2, name: "kimchi challenge III", creator: "Zodive", verifier: "132878101" },
    { rank: 3, name: "eok ka", creator: "Zodive", verifier: "121499262" },
    { rank: 4, name: "aenouement", creator: "vwjeve7772", verifier: "132488613" },
    { rank: 5, name: "gaty gay ty fly", creator: "JustGia12", verifier: "133618870" },
    { rank: 6, name: "zlgim but uwu ig ay", creator: "JustGia12", verifier: "132969703" },
    { rank: 7, name: "hyper cube 1", creator: "vwjeve7772", verifier: "118815709" },
    { rank: 8, name: "wave ship wave cube", creator: "vwjeve7772", verifier: "vwjeve7772" },
    { rank: 9, name: "zodive challenge 3", creator: "vwjeve7772", verifier: "127600563" },
    { rank: 10, name: "challengescapes", creator: "vwjeve7772", verifier: "114204827" },
    { rank: 11, name: "not shard", creator: "vwjeve7772", verifier: "122345787" },
    { rank: 12, name: "wave challenge but", creator: "vwjeve7772", verifier: "115026422" },
    { rank: 13, name: "jimbo", creator: "vwjeve7772", verifier: "114155347" },
    { rank: 14, name: "AOD Fp x2", creator: "vwjeve7772", verifier: "125199682" },
    { rank: 15, name: "buzori", creator: "vwjeve7772", verifier: "114207036" },
    { rank: 16, name: "mulKALtiming NIGHT", creator: "Zodive", verifier: "112598313" },
    { rank: 17, name: "love", creator: "vwjeve7772", verifier: "123818382" },
    { rank: 18, name: "jzstep", creator: "JustGia12", verifier: "" },
    { rank: 19, name: "ez kaka 2", creator: "Zodive", verifier: "115291172" },
    { rank: 20, name: "is ez", creator: "vwjeve7772", verifier: "111356809" },
    { rank: 21, name: "Zre amgi ga mo tam", creator: "vwjeve7772", verifier: "123427885" },
    { rank: 22, name: "tico chall rm", creator: "vwjeve7772", verifier: "110524912" },
    { rank: 23, name: "ship challenge 2", creator: "vwjeve7772", verifier: "120454776" },
    { rank: 24, name: "zodive challenge", creator: "vwjeve7772", verifier: "126920241" },
    { rank: 25, name: "jk chall rm", creator: "vwjeve7772", verifier: "117995228" },
    { rank: 26, name: "kimchi challenge", creator: "Zodive", verifier: "126919798" },
    { rank: 27, name: "yoojoon chall rm 2", creator: "vwjeve7772", verifier: "110546621" },
    { rank: 28, name: "butterfox chall rm", creator: "vwjeve7772", verifier: "110546795" },
    { rank: 29, name: "lowing chall", creator: "vwjeve7772", verifier: "11052105" },
];

async function main() {
    console.log('--- Restoring Levels (1-29) ---');
    for (const data of levelsData) {
        await prisma.level.update({
            where: { rank: data.rank },
            data: {
                name: data.name,
                creator: data.creator,
                verifier: data.verifier,
                imageUrl: null // Images need to be re-uploaded by admin
            }
        });
        console.log(`Restored Rank ${data.rank}: ${data.name}`);
    }
    console.log('--- Successfully Restored 29 Levels! ---');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
