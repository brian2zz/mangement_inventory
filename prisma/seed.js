const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const adminPassword = await bcrypt.hash('admin123', 10);
    const staffPassword = await bcrypt.hash('staff123', 10);
    const viewerPassword = await bcrypt.hash('viewer123', 10);

    const users = [
        { name: 'Admin', email: 'admin@inventory.com', role: 'admin', password: adminPassword, status: 'active' },
        { name: 'Staff', email: 'staff@inventory.com', role: 'staff', password: staffPassword, status: 'active' },
        { name: 'Viewer', email: 'viewer@inventory.com', role: 'viewer', password: viewerPassword, status: 'active' },
    ];

    for (const user of users) {
        await prisma.user.upsert({
            where: { email: user.email },
            update: {},
            create: user,
        });
    }

    console.log('✅ Default users created!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
