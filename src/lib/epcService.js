import axios from 'axios';

// EPC API Configuration
const EPC_CONFIG = {
  baseUrl: 'https://epc.opendatacommunities.org/api/v1',
  username: 'tim@thelandapp.com',
  apiKey: 'a5d949347cbd1536e2cd32df63d2192be45e19c0',
  endpoints: {
    domestic: '/domestic/search',
    nonDomestic: '/non-domestic/search',
    info: '/info'
  }
};

// Create axios instance with auth
const epcApi = axios.create({
  baseURL: EPC_CONFIG.baseUrl,
  timeout: 30000,
  auth: {
    username: EPC_CONFIG.username,
    password: EPC_CONFIG.apiKey
  }
});

// Cache for EPC data to avoid repeated API calls
class EPCCache {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 24 * 60 * 60 * 1000; // 24 hours
  }

  get(key) {
    const item = this.cache.get(key);
    if (item && Date.now() - item.timestamp < this.cacheTTL) {
      return item.data;
    }
    this.cache.delete(key);
    return null;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear() {
    this.cache.clear();
  }
}

const epcCache = new EPCCache();

// Utility functions
export const extractBuildingIdentifiers = (osmBuildings) => {
  const identifiers = [];
  
  osmBuildings.forEach(building => {
    const props = building.properties || {};
    
    // Extract enhanced UPRNs from OS Linked Identifiers API (highest priority)
    if (props.primaryUPRN) {
      identifiers.push({
        type: 'uprn',
        value: props.primaryUPRN,
        building: building,
        confidence: 1.0,
        source: 'OS Linked Identifiers API (primary)'
      });
    }
    
    // Extract additional UPRNs from OS Linked Identifiers API
    if (props.uprns && Array.isArray(props.uprns)) {
      props.uprns.forEach(uprn => {
        if (uprn && uprn !== props.primaryUPRN) {
          identifiers.push({
            type: 'uprn',
            value: uprn,
            building: building,
            confidence: 0.95,
            source: 'OS Linked Identifiers API (secondary)'
          });
        }
      });
    }
    
    // Extract original UPRN if available (fallback)
    if (props.uprn && props.uprn !== props.primaryUPRN) {
      identifiers.push({
        type: 'uprn',
        value: props.uprn,
        building: building,
        confidence: 1.0,
        source: 'OSMasterMap'
      });
    }
    
    // Only use postcode/address if no UPRNs are available
    const hasUPRN = props.primaryUPRN || props.uprn || (props.uprns && props.uprns.length > 0);
    
    if (!hasUPRN) {
      // Extract postcode
      if (props.postcode) {
        identifiers.push({
          type: 'postcode',
          value: props.postcode,
          building: building,
          confidence: 0.8,
          source: 'OSMasterMap'
        });
      }
      
      // Extract address components
      if (props.address || props.full_address) {
        const address = props.address || props.full_address;
        identifiers.push({
          type: 'address',
          value: address,
          building: building,
          confidence: 0.6,
          source: 'OSMasterMap'
        });
      }
    }

    // Check for alternative OSMM properties
    // OSMM data often lacks UPRN/address data but may have other identifiers
    if (props.fid && (props.theme === 'Buildings' || props.descriptivegroup === 'Building')) {
      // Log the OSMM building for debugging
      const hasEnhancement = props.osLinkedIdentifiers;
      console.log(`OSMM Building found (${hasEnhancement ? 'enhanced' : 'original'}):`, {
        fid: props.fid,
        theme: props.theme,
        descriptivegroup: props.descriptivegroup,
        primaryUPRN: props.primaryUPRN,
        uprnCount: props.uprns?.length || 0,
        hasOriginalUPRN: !!props.uprn,
        hasPostcode: !!props.postcode,
        hasAddress: !!(props.address || props.full_address)
      });
    }
  });
  
  return identifiers;
};

// Fetch EPC data for a single identifier
export const fetchEPCByIdentifier = async (identifier, propertyType = 'both') => {
  const cacheKey = `${identifier.type}-${identifier.value}-${propertyType}`;
  
  // Check cache first
  const cached = epcCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  try {
    const results = [];
    
    // Search domestic properties
    if (propertyType === 'domestic' || propertyType === 'both') {
      try {
        const domesticResponse = await epcApi.get(EPC_CONFIG.endpoints.domestic, {
          params: {
            [identifier.type]: identifier.value,
            'size': 100
          }
        });
        
        if (domesticResponse.data && domesticResponse.data.rows) {
          results.push(...domesticResponse.data.rows.map(row => ({
            ...row,
            property_type: 'domestic'
          })));
        }
      } catch (error) {
        console.warn(`Domestic EPC search failed for ${identifier.value}:`, error.message);
      }
    }
    
    // Search non-domestic properties
    if (propertyType === 'non-domestic' || propertyType === 'both') {
      try {
        const nonDomesticResponse = await epcApi.get(EPC_CONFIG.endpoints.nonDomestic, {
          params: {
            [identifier.type]: identifier.value,
            'size': 100
          }
        });
        
        if (nonDomesticResponse.data && nonDomesticResponse.data.rows) {
          results.push(...nonDomesticResponse.data.rows.map(row => ({
            ...row,
            property_type: 'non-domestic'
          })));
        }
      } catch (error) {
        console.warn(`Non-domestic EPC search failed for ${identifier.value}:`, error.message);
      }
    }
    
    // Cache the results
    epcCache.set(cacheKey, results);
    
    return results;
  } catch (error) {
    console.error(`EPC API error for ${identifier.value}:`, error);
    return [];
  }
};

// Batch fetch EPC data for multiple identifiers
export const fetchEPCBatch = async (identifiers, onProgress = null) => {
  const results = [];
  const batchSize = 10; // Process in smaller batches to avoid overwhelming the API
  
  for (let i = 0; i < identifiers.length; i += batchSize) {
    const batch = identifiers.slice(i, i + batchSize);
    
    const batchPromises = batch.map(identifier => 
      fetchEPCByIdentifier(identifier)
        .then(epcData => ({
          identifier,
          epcData,
          success: true
        }))
        .catch(error => ({
          identifier,
          error: error.message,
          success: false
        }))
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Report progress
    if (onProgress) {
      onProgress({
        completed: Math.min(i + batchSize, identifiers.length),
        total: identifiers.length,
        percentage: Math.round((Math.min(i + batchSize, identifiers.length) / identifiers.length) * 100)
      });
    }
    
    // Add delay between batches to be respectful to the API
    if (i + batchSize < identifiers.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
};

// Match EPC data to OSMM buildings
export const matchBuildingsToEPC = (batchResults) => {
  const matches = [];
  
  batchResults.forEach(result => {
    if (!result.success || !result.epcData.length) {
      // No EPC data found
      matches.push({
        building: result.identifier.building,
        epcData: null,
        matchConfidence: 0,
        matchMethod: 'none',
        status: 'no_epc_found'
      });
      return;
    }
    
    // Find best EPC match
    let bestMatch = null;
    let bestConfidence = 0;
    
    result.epcData.forEach(epc => {
      let confidence = result.identifier.confidence;
      
      // Boost confidence for exact UPRN matches
      if (result.identifier.type === 'uprn' && 
          epc.uprn === result.identifier.value) {
        confidence = 1.0;
      }
      
      // Boost confidence for recent certificates
      if (epc['inspection-date']) {
        const inspectionDate = new Date(epc['inspection-date']);
        const yearsSinceInspection = (Date.now() - inspectionDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        if (yearsSinceInspection < 5) {
          confidence += 0.1;
        }
      }
      
      if (confidence > bestConfidence) {
        bestMatch = epc;
        bestConfidence = confidence;
      }
    });
    
    matches.push({
      building: result.identifier.building,
      epcData: bestMatch,
      matchConfidence: bestConfidence,
      matchMethod: result.identifier.type,
      status: bestMatch ? 'matched' : 'no_match',
      allMatches: result.epcData // Store all matches for review
    });
  });
  
  return matches;
};

// Process complete estate EPC data
export const processEstateEPC = async (osmBuildings, onProgress = null) => {
  try {
    // Extract identifiers
    const identifiers = extractBuildingIdentifiers(osmBuildings);
    
    if (identifiers.length === 0) {
      // Count OSMM buildings found for better error message
      const osmmBuildingsCount = osmBuildings.filter(building => {
        const props = building.properties || {};
        return props.fid && (props.theme === 'Buildings' || props.descriptivegroup === 'Building');
      }).length;
      
      return {
        success: false,
        error: `Found ${osmmBuildingsCount} building features in OSMasterMap data, but none contain the address identifiers (UPRN, postcode, or address) needed for EPC lookup. OSMM data typically contains building outlines but not address information. Consider using a different data source that includes property identifiers.`,
        matches: [],
        osmmBuildingsFound: osmmBuildingsCount,
        totalFeatures: osmBuildings.length
      };
    }
    
    // Fetch EPC data in batches
    const batchResults = await fetchEPCBatch(identifiers, onProgress);
    
    // Match buildings to EPC data
    const matches = matchBuildingsToEPC(batchResults);
    
    // Generate summary statistics
    const summary = generateEPCSummary(matches);
    
    return {
      success: true,
      matches,
      summary,
      totalBuildings: osmBuildings.length,
      processedIdentifiers: identifiers.length
    };
    
  } catch (error) {
    console.error('Estate EPC processing error:', error);
    return {
      success: false,
      error: error.message,
      matches: []
    };
  }
};

// Generate summary statistics
export const generateEPCSummary = (matches) => {
  const summary = {
    totalBuildings: matches.length,
    withEPC: 0,
    coveragePercent: 0,
    ratingDistribution: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0 },
    averageEfficiency: 0,
    averageCO2: 0,
    expiringCertificates: 0,
    propertyTypes: {},
    matchMethods: {}
  };
  
  let totalEfficiency = 0;
  let totalCO2 = 0;
  let efficiencyCount = 0;
  let co2Count = 0;
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  
  matches.forEach(match => {
    // Count match methods
    summary.matchMethods[match.matchMethod] = (summary.matchMethods[match.matchMethod] || 0) + 1;
    
    if (match.epcData && match.status === 'matched') {
      summary.withEPC++;
      
      const epc = match.epcData;
      
      // Rating distribution
      const rating = epc['current-energy-rating'] || epc['asset-rating'];
      if (rating && summary.ratingDistribution.hasOwnProperty(rating)) {
        summary.ratingDistribution[rating]++;
      }
      
      // Efficiency
      const efficiency = parseInt(epc['energy-efficiency-rating'] || epc['asset-rating-numeric']);
      if (efficiency && !isNaN(efficiency)) {
        totalEfficiency += efficiency;
        efficiencyCount++;
      }
      
      // CO2 emissions
      const co2 = parseFloat(epc['co2-emissions-current'] || epc['co2-emiss-curr-per-floor-area']);
      if (co2 && !isNaN(co2)) {
        totalCO2 += co2;
        co2Count++;
      }
      
      // Property types
      const propType = epc['property-type'] || epc['building-category'] || 'Unknown';
      summary.propertyTypes[propType] = (summary.propertyTypes[propType] || 0) + 1;
      
      // Expiring certificates
      if (epc['lodgement-date']) {
        const lodgementDate = new Date(epc['lodgement-date']);
        const expiryDate = new Date(lodgementDate);
        expiryDate.setFullYear(expiryDate.getFullYear() + 10); // EPC certificates valid for 10 years
        
        if (expiryDate <= sixMonthsFromNow) {
          summary.expiringCertificates++;
        }
      }
    }
  });
  
  summary.coveragePercent = summary.totalBuildings > 0 
    ? Math.round((summary.withEPC / summary.totalBuildings) * 100) 
    : 0;
    
  summary.averageEfficiency = efficiencyCount > 0 
    ? Math.round(totalEfficiency / efficiencyCount) 
    : 0;
    
  summary.averageCO2 = co2Count > 0 
    ? Math.round((totalCO2 / co2Count) * 100) / 100 
    : 0;
  
  return summary;
};

// Utility function to get energy rating color
export const getEnergyRatingColor = (rating) => {
  const colors = {
    'A': '#00a651',
    'B': '#19b459',
    'C': '#8cc63f',
    'D': '#ffd700',
    'E': '#f57c00',
    'F': '#e53e3e',
    'G': '#c53030'
  };
  return colors[rating] || '#9ca3af';
};

// Export EPC data to CSV
export const exportEPCToCSV = (matches) => {
  const headers = [
    'Building ID',
    'Address',
    'UPRN', 
    'Current Energy Rating',
    'Energy Efficiency Score',
    'Potential Rating',
    'CO2 Emissions',
    'Property Type',
    'Floor Area',
    'Inspection Date',
    'Certificate Status',
    'Match Confidence',
    'Match Method'
  ];
  
  const rows = matches.map(match => {
    const epc = match.epcData;
    const building = match.building;
    
    return [
      building.properties?.id || building.id || '',
      epc?.address || building.properties?.address || '',
      epc?.uprn || building.properties?.uprn || '',
      epc?.['current-energy-rating'] || epc?.['asset-rating'] || 'N/A',
      epc?.['energy-efficiency-rating'] || epc?.['asset-rating-numeric'] || 'N/A',
      epc?.['potential-energy-rating'] || 'N/A',
      epc?.['co2-emissions-current'] || epc?.['co2-emiss-curr-per-floor-area'] || 'N/A',
      epc?.['property-type'] || epc?.['building-category'] || 'N/A',
      epc?.['total-floor-area'] || 'N/A',
      epc?.['inspection-date'] || epc?.['lodgement-date'] || 'N/A',
      match.status,
      match.matchConfidence,
      match.matchMethod
    ];
  });
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
    
  return csvContent;
};

export default {
  processEstateEPC,
  fetchEPCBatch,
  matchBuildingsToEPC,
  generateEPCSummary,
  getEnergyRatingColor,
  exportEPCToCSV,
  clearCache: () => epcCache.clear()
};