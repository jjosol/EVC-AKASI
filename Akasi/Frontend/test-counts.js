// Simple script to test the consultation record counts endpoints
// Run with: node test-counts.js

const baseUrl = 'http://localhost:3001'; // Replace with your actual API base URL

async function testCounts() {
  try {
    // Test parameters
    const year = 2025; 
    const month = 4; // May (0-indexed in JavaScript)

    console.log(`Testing count endpoints for ${month+1}/${year}...`);
    
    // Test confined count
    const confinedResponse = await fetch(`${baseUrl}/consultation-records/count?year=${year}&month=${month}&confined=true`);
    const confinedData = await confinedResponse.json();
    console.log('Confined count:', confinedData);
    
    // Test monthly consultation count
    const monthlyResponse = await fetch(`${baseUrl}/consultation-records/count?year=${year}&month=${month}`);
    const monthlyData = await monthlyResponse.json();
    console.log('Monthly consultation count:', monthlyData);
    
    // Test yearly consultation count
    const yearlyResponse = await fetch(`${baseUrl}/consultation-records/year-count?year=${year}`);
    const yearlyData = await yearlyResponse.json();
    console.log('Yearly consultation count:', yearlyData);
    
  } catch (error) {
    console.error('Error testing counts:', error);
  }
}

testCounts();
