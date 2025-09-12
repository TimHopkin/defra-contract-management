// Quick test of the Data Layers parsing functionality
import dataLayersService from './src/lib/dataLayersService.js';

const sampleReport = `Access    Public Rights of Way    
Surrey
Administrative    Counties and Unitary Authorities    
Surrey Hills
Designations    Area of Outstanding Natural Beauty    
Buglife`;

try {
  console.log('Testing Data Layers Service with basic data...');
  const result = dataLayersService.parseReport(sampleReport);
  console.log('Result:', JSON.stringify(result, null, 2));
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
}