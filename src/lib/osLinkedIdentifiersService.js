import axios from 'axios';

/**
 * OS Linked Identifiers API Service
 * Links OSMasterMap features to UPRNs for EPC integration
 * Documentation: https://www.ordnancesurvey.co.uk/business-government/tools-support/open-mastermap-programme
 */

// OS Linked Identifiers API Configuration
const OS_CONFIG = {
  baseUrl: 'https://api.os.uk/search/links/v1',
  apiKey: import.meta.env.VITE_OS_LINKED_IDENTIFIERS_API_KEY,
  endpoints: {
    uprn: '/uprn' // Search for UPRNs linked to TOIDs
  }
};

// Check if OS API is properly configured
export const isOSApiConfigured = () => {
  if (!OS_CONFIG.apiKey) {
    return false;
  }
  
  // Check for undefined string values
  if (OS_CONFIG.apiKey === 'undefined' || OS_CONFIG.apiKey === 'your_os_linked_identifiers_api_key_here') {
    return false;
  }
  
  return true;
};

// Create axios instance with API key
const osApi = axios.create({
  baseURL: OS_CONFIG.baseUrl,
  timeout: 30000,
  params: {
    key: OS_CONFIG.apiKey
  }
});

// Cache for OS API data to avoid repeated API calls
class OSCache {
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

const osCache = new OSCache();

/**
 * Get UPRN for OSMasterMap building feature using TOID
 */
export const getUPRNFromTOID = async (toid) => {
  if (!isOSApiConfigured()) {
    throw new Error('OS Linked Identifiers API key not configured. Please set VITE_OS_LINKED_IDENTIFIERS_API_KEY in your .env.local file.');
  }

  const cacheKey = `toid-${toid}`;
  
  // Check cache first
  const cached = osCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Use the correct OS Linked Identifiers API endpoint
    const response = await osApi.get(OS_CONFIG.endpoints.uprn, {
      params: {
        toid: toid
      }
    });
    
    const result = {
      toid,
      uprns: response.data?.results?.map(item => ({
        uprn: item.LPI?.UPRN || item.uprn,
        confidence: 1.0,
        source: 'OS Linked Identifiers API',
        address: item.LPI?.ADDRESS || item.address,
        geometry: item.geometry
      })) || [],
      success: true
    };

    // Cache the result
    osCache.set(cacheKey, result);
    
    return result;
    
  } catch (error) {
    console.error(`OS API error for TOID ${toid}:`, error);
    
    const result = {
      toid,
      uprns: [],
      success: false,
      error: error.response?.data?.message || error.message
    };
    
    return result;
  }
};

/**
 * Enhance OSMasterMap buildings with UPRNs
 */
export const enhanceBuildingsWithUPRNs = async (osmBuildings, onProgress = null) => {
  if (!isOSApiConfigured()) {
    return {
      success: false,
      error: 'OS Linked Identifiers API key not configured. Please set VITE_OS_LINKED_IDENTIFIERS_API_KEY in your .env.local file.',
      enhancedBuildings: osmBuildings
    };
  }

  const enhancedBuildings = [];
  const batchSize = 5; // Conservative batch size for API limits
  
  // Filter buildings that have TOIDs (check multiple possible fields)
  const buildingsWithTOIDs = osmBuildings.filter(building => {
    const toid = building.properties?.ogc_fid || building.properties?.fid || building.properties?.toid;
    return toid && (typeof toid === 'string' || typeof toid === 'number');
  });

  if (buildingsWithTOIDs.length === 0) {
    return {
      success: true,
      message: 'No buildings with TOIDs found for UPRN enhancement',
      enhancedBuildings: osmBuildings,
      stats: {
        total: osmBuildings.length,
        withTOIDs: 0,
        enhanced: 0,
        withUPRNs: 0
      }
    };
  }

  console.log(`Enhancing ${buildingsWithTOIDs.length} buildings with UPRNs...`);

  for (let i = 0; i < buildingsWithTOIDs.length; i += batchSize) {
    const batch = buildingsWithTOIDs.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (building) => {
      const toid = building.properties?.ogc_fid || building.properties?.fid || building.properties?.toid;
      
      try {
        console.log(`🔍 Trying TOID: ${toid} for building ${building.properties?.name || 'unnamed'}`);
        const uprnResult = await getUPRNFromTOID(toid);
        
        // Create enhanced building with UPRN data
        const enhancedBuilding = {
          ...building,
          properties: {
            ...building.properties,
            osLinkedIdentifiers: uprnResult,
            uprns: uprnResult.uprns?.map(u => u.uprn) || [],
            primaryUPRN: uprnResult.uprns?.[0]?.uprn || null
          }
        };

        if (uprnResult.uprns && uprnResult.uprns.length > 0) {
          console.log(`✅ Found ${uprnResult.uprns.length} UPRNs for TOID ${toid}`);
        } else {
          console.log(`❌ No UPRNs found for TOID ${toid}`);
        }

        return enhancedBuilding;
        
      } catch (error) {
        console.warn(`Failed to enhance building ${toid}:`, error.message);
        return building; // Return original building if enhancement fails
      }
    });

    const batchResults = await Promise.all(batchPromises);
    enhancedBuildings.push(...batchResults);
    
    // Report progress
    if (onProgress) {
      onProgress({
        completed: Math.min(i + batchSize, buildingsWithTOIDs.length),
        total: buildingsWithTOIDs.length,
        percentage: Math.round((Math.min(i + batchSize, buildingsWithTOIDs.length) / buildingsWithTOIDs.length) * 100)
      });
    }
    
    // Add delay between batches to respect API rate limits
    if (i + batchSize < buildingsWithTOIDs.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Add buildings without TOIDs unchanged
  const buildingsWithoutTOIDs = osmBuildings.filter(building => {
    const toid = building.properties?.fid || building.properties?.toid;
    return !toid || typeof toid !== 'string';
  });
  
  enhancedBuildings.push(...buildingsWithoutTOIDs);

  // Generate statistics
  const stats = {
    total: osmBuildings.length,
    withTOIDs: buildingsWithTOIDs.length,
    enhanced: enhancedBuildings.length,
    withUPRNs: enhancedBuildings.filter(b => b.properties?.primaryUPRN).length
  };

  console.log('UPRN enhancement completed:', stats);

  return {
    success: true,
    enhancedBuildings,
    stats
  };
};

/**
 * Extract UPRNs from enhanced buildings for EPC lookup
 */
export const extractUPRNsFromEnhancedBuildings = (enhancedBuildings) => {
  const identifiers = [];
  
  enhancedBuildings.forEach(building => {
    const props = building.properties || {};
    
    // Primary UPRN from OS Linked Identifiers
    if (props.primaryUPRN) {
      identifiers.push({
        type: 'uprn',
        value: props.primaryUPRN,
        building: building,
        confidence: 1.0,
        source: 'OS Linked Identifiers API'
      });
    }
    
    // Multiple UPRNs (e.g., for multi-unit buildings)
    if (props.uprns && Array.isArray(props.uprns)) {
      props.uprns.forEach(uprn => {
        if (uprn && uprn !== props.primaryUPRN) {
          identifiers.push({
            type: 'uprn',
            value: uprn,
            building: building,
            confidence: 0.9,
            source: 'OS Linked Identifiers API (secondary)'
          });
        }
      });
    }
    
    // Fallback to existing identifiers for buildings without UPRN enhancement
    if (!props.primaryUPRN) {
      // Original UPRN if available
      if (props.uprn) {
        identifiers.push({
          type: 'uprn',
          value: props.uprn,
          building: building,
          confidence: 1.0,
          source: 'OSMasterMap'
        });
      }
      
      // Postcode fallback
      if (props.postcode) {
        identifiers.push({
          type: 'postcode',
          value: props.postcode,
          building: building,
          confidence: 0.8,
          source: 'OSMasterMap'
        });
      }
      
      // Address fallback
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
  });
  
  return identifiers;
};

/**
 * Complete workflow: Enhance buildings with UPRNs and prepare for EPC lookup
 */
export const prepareEnhancedBuildingsForEPC = async (osmBuildings, onProgress = null) => {
  try {
    // Step 1: Enhance buildings with UPRNs
    const enhancementResult = await enhanceBuildingsWithUPRNs(osmBuildings, onProgress);
    
    if (!enhancementResult.success) {
      return enhancementResult;
    }

    // Step 2: Extract identifiers for EPC lookup
    const identifiers = extractUPRNsFromEnhancedBuildings(enhancementResult.enhancedBuildings);

    return {
      success: true,
      enhancedBuildings: enhancementResult.enhancedBuildings,
      identifiers,
      stats: {
        ...enhancementResult.stats,
        identifiersExtracted: identifiers.length
      }
    };

  } catch (error) {
    console.error('Error in enhanced EPC preparation:', error);
    return {
      success: false,
      error: error.message,
      enhancedBuildings: osmBuildings,
      identifiers: []
    };
  }
};

export default {
  getUPRNFromTOID,
  enhanceBuildingsWithUPRNs,
  extractUPRNsFromEnhancedBuildings,
  prepareEnhancedBuildingsForEPC,
  isOSApiConfigured,
  clearCache: () => osCache.clear()
};