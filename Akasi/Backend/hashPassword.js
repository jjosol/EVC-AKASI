const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function hashPasswords(tableName, idField) {
    try {
        // Retrieve users from the specified table
        const users = await prisma[tableName].findMany()

        // Loop through each user and hash their password
        for (const user of users) {
            // Check if the password is already hashed
            if (user.password && user.password.length === 60) {
                console.log(`Password for ${tableName} user with ID: ${user[idField]} is already hashed. Skipping...`)
                continue
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(user.password, 10)
            
            // Perform update
            await prisma[tableName].update({
                where: { [idField]: user[idField] },
                data: { password: hashedPassword },
            })

            console.log(`Updated password for ${tableName} user with ID: ${user[idField]}`)
        }
    } catch (error) {
        console.error(`Error hashing passwords for ${tableName}:`, error)
    }
}

// Example usage: Hash passwords for both Client and Admin tables
async function main() {
    try {
        await hashPasswords('client', 'client_id')
        await hashPasswords('admin', 'admin_id')
    } catch (error) {
        console.error("Error in main function:", error)
    } finally {
        await prisma.$disconnect()
    }
}

main()