import axios from 'axios';

// Nature Reporting API Configuration
const NATURE_REPORTING_CONFIG = {
  baseUrl: 'https://integration-api.thelandapp.com/nature-reporting',
  endpoints: {
    metrics: '/metrics',
    description: '/metrics/description'
  }
};

// Create axios instance
const natureApi = axios.create({
  baseURL: NATURE_REPORTING_CONFIG.baseUrl,
  timeout: 30000,
});

// Cache for Nature Reporting data to avoid repeated API calls
class NatureReportingCache {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 30 * 60 * 1000; // 30 minutes
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

  size() {
    return this.cache.size;
  }
}

const cache = new NatureReportingCache();

// Fetch metrics descriptions
export const fetchMetricsDescriptions = async (apiKey) => {
  const cacheKey = `descriptions_${apiKey}`;
  
  // Check cache first
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await natureApi.get(NATURE_REPORTING_CONFIG.endpoints.description, {
      params: { apiKey }
    });

    // Cache the result
    cache.set(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching metrics descriptions:', error);
    throw new Error(`Failed to fetch metrics descriptions: ${error.message}`);
  }
};

// Fetch nature reporting metrics data
export const fetchNatureReportingMetrics = async (apiKey, options = {}) => {
  const {
    page = 0,
    size = 50,
    asOfDate,
    search,
    mapName
  } = options;

  const cacheKey = `metrics_${apiKey}_${page}_${size}_${asOfDate || ''}_${search || ''}_${mapName || ''}`;
  
  // Check cache first
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const params = { apiKey, page, size };
    if (asOfDate) params.asOfDate = asOfDate;
    if (search) params.search = search;
    
    // If mapName is provided, use it as search term
    if (mapName) params.search = mapName;

    const response = await natureApi.get(NATURE_REPORTING_CONFIG.endpoints.metrics, {
      params
    });

    // Cache the result
    cache.set(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching nature reporting metrics:', error);
    throw new Error(`Failed to fetch nature reporting metrics: ${error.message}`);
  }
};

// Fetch all metrics for a specific map (handles pagination)
export const fetchAllMetricsForMap = async (apiKey, mapName) => {
  const cacheKey = `all_metrics_${apiKey}_${mapName}`;
  
  // Check cache first
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    let allData = [];
    let page = 0;
    let hasNext = true;
    const size = 100; // Larger page size for efficiency

    while (hasNext && page < 10) { // Safety limit of 10 pages
      const response = await fetchNatureReportingMetrics(apiKey, {
        search: mapName,
        page,
        size
      });

      if (response.data && response.data.length > 0) {
        allData.push(...response.data);
      }

      hasNext = response.hasNext;
      page++;
    }

    // Filter to exact map name matches (in case search returned partial matches)
    const exactMatches = allData.filter(item => 
      item.mapName && item.mapName.toLowerCase() === mapName.toLowerCase()
    );

    // Cache the result
    cache.set(cacheKey, exactMatches);
    return exactMatches;
  } catch (error) {
    console.error('Error fetching all metrics for map:', error);
    throw new Error(`Failed to fetch metrics for map "${mapName}": ${error.message}`);
  }
};

// Process metrics data for dashboard display
export const processMetricsForDashboard = (metricsData, descriptionsData = []) => {
  if (!metricsData || metricsData.length === 0) {
    return {
      summary: {
        totalFarms: 0,
        totalMaps: 0,
        avgBiodiversityScore: 0,
        avgCarbonSequestration: 0,
        coverageByCounty: {},
        ratingDistribution: {}
      },
      chartData: {
        biodiversity: [],
        carbon: [],
        waterQuality: [],
        habitat: []
      },
      tableData: []
    };
  }

  // Create descriptions lookup
  const descriptionsMap = {};
  descriptionsData.forEach(desc => {
    descriptionsMap[desc.key] = desc;
  });

  // Calculate summary statistics
  const totalFarms = metricsData.length;
  const uniqueMaps = new Set(metricsData.map(item => item.mapName)).size;
  const uniqueCounties = {};
  
  let totalBiodiversityScore = 0;
  let totalCarbonSequestration = 0;
  let biodiversityCount = 0;
  let carbonCount = 0;

  // Process each farm's data
  const processedData = metricsData.map(farm => {
    // Count by county
    if (farm.county && Array.isArray(farm.county)) {
      farm.county.forEach(county => {
        uniqueCounties[county] = (uniqueCounties[county] || 0) + 1;
      });
    }

    // Calculate biodiversity score (using habitat BNG units as proxy)
    const biodiversityMetric = farm.metrics?.find(m => m.key === 'habitat_bng_units');
    if (biodiversityMetric && biodiversityMetric.baseline !== undefined) {
      totalBiodiversityScore += Number(biodiversityMetric.baseline) || 0;
      biodiversityCount++;
    }

    // Calculate carbon sequestration
    const carbonMetric = farm.metrics?.find(m => m.key === 'carbon_sequestration_tco2e');
    if (carbonMetric && carbonMetric.baseline !== undefined) {
      totalCarbonSequestration += Number(carbonMetric.baseline) || 0;
      carbonCount++;
    }

    return {
      ...farm,
      processedMetrics: farm.metrics?.map(metric => ({
        ...metric,
        description: descriptionsMap[metric.key]
      }))
    };
  });

  // Chart data processing
  const chartData = {
    biodiversity: processedData.map(farm => ({
      mapName: farm.mapName,
      bngUnits: farm.metrics?.find(m => m.key === 'habitat_bng_units')?.baseline || 0,
      bngDensity: farm.metrics?.find(m => m.key === 'habitat_bng_density')?.baseline || 0,
      habitatCover: farm.metrics?.find(m => m.key === 'habitat_cover_percentage')?.baseline || 0
    })),
    carbon: processedData.map(farm => ({
      mapName: farm.mapName,
      carbonSequestration: farm.metrics?.find(m => m.key === 'carbon_sequestration_tco2e')?.baseline || 0,
      carbonValue: farm.metrics?.find(m => m.key === 'carbon_sequestration_asset_value')?.baseline || 0
    })),
    waterQuality: processedData.map(farm => ({
      mapName: farm.mapName,
      wfdCondition: farm.metrics?.find(m => m.key === 'wfd_minimum_ecological_condition')?.baseline || 'Unknown',
      poorPercentage: farm.metrics?.find(m => m.key === 'wfd_poor_percentage')?.baseline || 0,
      goodPercentage: farm.metrics?.find(m => m.key === 'wfd_good_percentage')?.baseline || 0
    })),
    habitat: processedData.map(farm => ({
      mapName: farm.mapName,
      numberOfHabitats: farm.metrics?.find(m => m.key === 'number_of_habitats')?.baseline || 0,
      connectedness: farm.metrics?.find(m => m.key === 'connectedness_percentage')?.baseline || 0,
      largestConnectedArea: farm.metrics?.find(m => m.key === 'largest_connected_area')?.baseline || 0
    }))
  };

  return {
    summary: {
      totalFarms,
      totalMaps: uniqueMaps,
      avgBiodiversityScore: biodiversityCount > 0 ? (totalBiodiversityScore / biodiversityCount).toFixed(2) : 0,
      avgCarbonSequestration: carbonCount > 0 ? (totalCarbonSequestration / carbonCount).toFixed(2) : 0,
      coverageByCounty: uniqueCounties,
      uniqueCounties: Object.keys(uniqueCounties).length
    },
    chartData,
    tableData: processedData,
    descriptionsMap
  };
};

// Get key metrics for a specific map
export const getKeyMetricsForMap = (mapData) => {
  if (!mapData || !mapData.metrics) {
    return {};
  }

  const keyMetrics = {
    biodiversity: {
      bngUnits: mapData.metrics.find(m => m.key === 'habitat_bng_units')?.baseline || 0,
      bngDensity: mapData.metrics.find(m => m.key === 'habitat_bng_density')?.baseline || 0,
      habitatCover: mapData.metrics.find(m => m.key === 'habitat_cover_percentage')?.baseline || 0,
      numberOfHabitats: mapData.metrics.find(m => m.key === 'number_of_habitats')?.baseline || 0,
      connectedness: mapData.metrics.find(m => m.key === 'connectedness_percentage')?.baseline || 0
    },
    carbon: {
      sequestration: mapData.metrics.find(m => m.key === 'carbon_sequestration_tco2e')?.baseline || 0,
      value: mapData.metrics.find(m => m.key === 'carbon_sequestration_asset_value')?.baseline || 0
    },
    waterQuality: {
      condition: mapData.metrics.find(m => m.key === 'wfd_minimum_ecological_condition')?.baseline || 'Unknown',
      poorPercentage: mapData.metrics.find(m => m.key === 'wfd_poor_percentage')?.baseline || 0,
      goodPercentage: mapData.metrics.find(m => m.key === 'wfd_good_percentage')?.baseline || 0
    },
    landUse: {
      productiveArea: mapData.metrics.find(m => m.key === 'total_productive_area')?.baseline || 0,
      croppedArea: mapData.metrics.find(m => m.key === 'total_cropped_area')?.baseline || 0,
      baselineArea: mapData.baseLineArea || 0
    },
    ecosystem: {
      airQualityValue: mapData.metrics.find(m => m.key === 'air_quality_regulation_asset_value')?.baseline || 0,
      recreationValue: mapData.metrics.find(m => m.key === 'recreation_welfare_asset_value')?.baseline || 0,
      timberValue: mapData.metrics.find(m => m.key === 'timber_asset_value')?.baseline || 0
    }
  };

  return keyMetrics;
};

// Fetch all available Nature Reporting map names
export const fetchAvailableMapNames = async (apiKey) => {
  const cacheKey = `available_maps_${apiKey}`;
  
  // Check cache first
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    let allMapNames = new Set();
    let page = 0;
    let hasNext = true;
    const size = 100; // Larger page size for efficiency

    while (hasNext && page < 20) { // Safety limit of 20 pages
      const response = await fetchNatureReportingMetrics(apiKey, {
        page,
        size
      });

      if (response.data && response.data.length > 0) {
        response.data.forEach(item => {
          if (item.mapName) {
            allMapNames.add(item.mapName);
          }
        });
      }

      hasNext = response.hasNext;
      page++;
    }

    const mapNamesArray = Array.from(allMapNames).sort();
    
    // Cache the result
    cache.set(cacheKey, mapNamesArray);
    return mapNamesArray;
  } catch (error) {
    console.error('Error fetching available Nature Reporting map names:', error);
    throw new Error(`Failed to fetch available map names: ${error.message}`);
  }
};

// Filter Land App plans to only include those with Nature Reporting data
export const filterPlansWithNatureReporting = (plans, availableMapNames) => {
  if (!plans || !availableMapNames) return [];
  
  return plans.filter(plan => {
    return plan.mapName && availableMapNames.includes(plan.mapName);
  });
};

// Clear cache
export const clearCache = () => {
  cache.clear();
};

// Get cache statistics
export const getCacheStats = () => {
  return {
    size: cache.size(),
    ttl: cache.cacheTTL
  };
};

const natureReportingService = {
  fetchMetricsDescriptions,
  fetchNatureReportingMetrics,
  fetchAllMetricsForMap,
  fetchAvailableMapNames,
  filterPlansWithNatureReporting,
  processMetricsForDashboard,
  getKeyMetricsForMap,
  clearCache,
  getCacheStats
};

export default natureReportingService;