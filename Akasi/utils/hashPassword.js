import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPasswords(tableName, idField) {
    try {
        // Retrieve users from the specified table
        const users = await prisma[tableName].findMany();

        // Loop through each user and hash their password
        for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await prisma[tableName].update({
                where: { [idField]: user[idField] }, // Use the correct ID field (e.g., client_id or admin_id)
                data: { password: hashedPassword },
            });
            console.log(`Updated password for ${tableName} user with ID: ${user[idField]}`);
        }
    } catch (error) {
        console.error(`Error hashing passwords for ${tableName}:`, error);
    } finally {
        await prisma.$disconnect();
    }
}

// Example usage: Hash passwords for both Client and Admin tables
async function main() {
    await hashPasswords('client', 'client_id'); // Update with the correct unique ID field
    await hashPasswords('admin', 'admin_id');   // Update with the correct unique ID field
}

main().catch((error) => {
    console.error("Error in main function:", error);
});
