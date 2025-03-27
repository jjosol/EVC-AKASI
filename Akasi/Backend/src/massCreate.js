import XLSX from 'xlsx'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

async function main() {
  // Read the Excel file
  const workbook = XLSX.readFile('./massCreateExcel.xlsx');
  // Assuming data is in the first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert the sheet to JSON
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`Found ${data.length} records to import`);
  
  // Iterate through each row and insert into the DB
  for (const row of data) {
    try {
      // Convert data types to match Prisma schema
      await prisma.client.create({
        data: {
          username: String(row.username),
          password: String(row.password), // Convert number to string
          name: String(row.name),
          gmail: String(row.gmail),             
          age: typeof row.age === 'number' ? row.age : parseInt(row.age) || null,
          gender: String(row.gender),
          category: String(row.category),
          type: String(row.type),
          grade: typeof row.grade === 'number' ? row.grade : parseInt(row.grade) || null,
          section: String(row.section),
        },
      });
      console.log(`Created client: ${row.name}`);
    } catch (error) {
      console.error(`Error creating client: ${row.name}`, error);
    }
  }
  
  console.log("Import complete. You'll need to hash passwords separately.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });