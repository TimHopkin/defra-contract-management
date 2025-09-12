import axios from 'axios';
import natureReportingService from './natureReportingService';
import landAnalysisService from './landAnalysisService';
import epcService from './epcService';
import osLinkedIdentifiersService from './osLinkedIdentifiersService';

const MAP_PROFILE_CONFIG = {
  landAppBaseUrl: 'https://integration-api.thelandapp.com',
  endpoints: {
    plansByMap: '/plan'
  }
};

class MapProfileService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 10 * 60 * 1000; // 10 minutes
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

  async fetchAllPlansAndFilter(mapId, apiKey) {
    const cacheKey = `all_plans_filtered_${mapId}_${apiKey}`;
    
    const cached = this.get(cacheKey);
    if (cached) {
      console.log(`Using cached filtered plans for Map ID: ${mapId}`);
      return cached;
    }

    console.log(`🔍 Using proven approach: Fetch all plans then filter by Map ID: ${mapId}`);
    
    try {
      // Use the same approach as the main app - fetch by plan types
      const planTypes = ['BPS', 'CSS', 'CSS_2025', 'SFI2023', 'SFI2022', 'SFI2024', 'UKHAB', 'UKHAB_V2', 'LAND_MANAGEMENT', 'LAND_MANAGEMENT_V2', 'PEAT_ASSESSMENT', 'OSMM', 'USER', 'ESS', 'FER', 'HEALTHY_HEDGEROWS'];
      let allPlans = [];

      // Fetch plans for each plan type (mirroring the main app approach)
      for (const planType of planTypes) {
        let currentPage = 0;
        let hasNext = true;
        const pageSize = 1000; // Large page size for efficiency

        console.log(`📊 Fetching ${planType} plans...`);

        while (hasNext) {
          try {
            // Use the same URL format as the main app
            const fromDate = new Date('2020-01-01T00:00:00.000Z').toISOString();
            let url = `https://integration-api.thelandapp.com/projects?apiKey=${apiKey}&type=${planType}&page=${currentPage}&size=${pageSize}&from=${encodeURIComponent(fromDate)}&excludeArchived=true`;
            
            console.log(`🌐 Fetching page ${currentPage} for ${planType}:`, url);
            
            const response = await fetch(url);

            if (!response.ok) {
              console.warn(`❌ Failed to fetch ${planType} page ${currentPage}: ${response.status} ${response.statusText}`);
              break; // Move to next plan type
            }

            const data = await response.json();
            
            if (data && data.data && Array.isArray(data.data)) {
              const plansFromPage = data.data;
              console.log(`✅ Got ${plansFromPage.length} ${planType} plans from page ${currentPage}`);
              
              // Add planType to each plan object since the API doesn't include it
              const plansWithType = plansFromPage.map(plan => ({
                ...plan,
                planType: planType // Critical: Add the planType we used to fetch this plan
              }));
              
              allPlans.push(...plansWithType);
              
              // Check if there are more pages
              hasNext = data.hasNext === true;
              currentPage++;
              
              // Safety limit
              if (currentPage >= 10) {
                console.log(`⚠️ Reached page limit for ${planType}`);
                break;
              }
            } else {
              console.log(`❌ No data returned for ${planType} page ${currentPage}`);
              break;
            }
          } catch (fetchError) {
            console.error(`❌ Error fetching ${planType} page ${currentPage}:`, fetchError.message);
            break; // Move to next plan type
          }
        }
      }

      console.log(`📋 Total plans fetched: ${allPlans.length}`);
      
      if (allPlans.length === 0) {
        throw new Error('No plans were fetched from any plan type');
      }

      // Now filter by Map ID
      console.log(`🔍 Filtering ${allPlans.length} plans for Map ID: ${mapId}`);
      
      // Log first few plans to understand data structure
      if (allPlans.length > 0) {
        console.log(`📄 Sample plan structures:`, 
          allPlans.slice(0, 3).map(plan => ({
            id: plan.id,
            name: plan.name,
            mapName: plan.mapName,
            mapId: plan.mapId,
            type: plan.planType || plan.type,
            keys: Object.keys(plan).slice(0, 10) // First 10 keys
          }))
        );
      }

      // Comprehensive filtering with enhanced matching
      const matchingPlans = allPlans.filter(plan => {
        const matches = 
          plan.mapId === mapId || 
          plan.id === mapId ||
          plan.name === mapId ||
          plan.name?.includes(mapId) ||
          plan.mapName === mapId ||
          plan.mapName?.includes(mapId) ||
          // Additional fields to check
          plan._id === mapId ||
          plan.externalId === mapId ||
          plan.identifier === mapId ||
          // Also check if any field contains the mapId as a substring
          Object.values(plan).some(value => 
            typeof value === 'string' && value.includes(mapId)
          );
        
        if (matches) {
          console.log(`🎯 Found matching plan:`, {
            id: plan.id,
            name: plan.name,
            mapName: plan.mapName,
            mapId: plan.mapId,
            matchedOn: Object.entries(plan)
              .filter(([key, value]) => 
                value === mapId || (typeof value === 'string' && value.includes(mapId))
              )
              .map(([key]) => key)
          });
        }
        
        return matches;
      });

      console.log(`🏆 Found ${matchingPlans.length} plans matching Map ID: ${mapId}`);

      if (matchingPlans.length === 0) {
        console.log(`⚠️ No matches found. Sampling available data:`, {
          totalPlans: allPlans.length,
          sampleMapIds: allPlans.slice(0, 10).map(plan => plan.mapId).filter(Boolean),
          sampleMapNames: allPlans.slice(0, 10).map(plan => plan.mapName).filter(Boolean),
          sampleNames: allPlans.slice(0, 5).map(plan => plan.name)
        });
      }

      // Cache the results
      this.set(cacheKey, matchingPlans);
      return matchingPlans;

    } catch (error) {
      console.error('🚨 Critical error in fetchAllPlansAndFilter:', {
        message: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to fetch and filter plans for map ${mapId}: ${error.message}`);
    }
  }

  async fetchPlansByMapId(mapId, apiKey) {
    console.log(`🔍 Fetching plans for Map ID: ${mapId} using proven approach`);
    
    try {
      return await this.fetchAllPlansAndFilter(mapId, apiKey);
    } catch (error) {
      console.error('🚨 Error in fetchPlansByMapId:', error);
      throw error;
    }
  }

  async fetchMapFeatures(plans, apiKey) {
    if (!plans || plans.length === 0) return [];

    try {
      const featurePromises = plans.map(async (plan) => {
        try {
          const response = await axios.get(`${MAP_PROFILE_CONFIG.landAppBaseUrl}/plan/${plan.id}/features`, {
            params: { apiKey: apiKey },
            timeout: 30000
          });
          return {
            planId: plan.id,
            planName: plan.name,
            features: response.data || []
          };
        } catch (error) {
          console.warn(`Failed to fetch features for plan ${plan.id}:`, error.message);
          return {
            planId: plan.id,
            planName: plan.name,
            features: []
          };
        }
      });

      return await Promise.all(featurePromises);
    } catch (error) {
      console.error('Error fetching map features:', error);
      return [];
    }
  }

  async getComprehensiveMapProfile(mapId, landAppApiKey, natureReportingApiKey, onProgress = null) {
    console.log(`🚀 Starting comprehensive map profile analysis for Map ID: ${mapId}`);
    
    if (onProgress) onProgress({ step: 'init', message: 'Initializing comprehensive analysis... (This process may take 2-3 minutes)', progress: 5 });
    
    const profile = {
      mapId,
      timestamp: new Date().toISOString(),
      plans: [],
      planFeatures: [],
      natureReporting: null,
      landAnalysis: null,
      epcData: null,
      summary: {
        totalPlans: 0,
        totalArea: 0,
        estimatedValue: 0,
        hasNatureReporting: false,
        hasLandAnalysis: false,
        hasEpcData: false
      },
      errors: [],
      warnings: [],
      apiAttempts: []
    };

    try {
      // Step 1: Fetch plans for the map with enhanced error handling
      if (onProgress) onProgress({ step: 'plans', message: 'Fetching all plans from API then filtering by Map ID... (this may take 1-2 minutes)', progress: 10 });
      
      console.log(`📋 Step 1: Fetching plans for Map ID: ${mapId}`);
      try {
        profile.plans = await this.fetchPlansByMapId(mapId, landAppApiKey);
        profile.summary.totalPlans = profile.plans.length;
        
        if (profile.plans.length === 0) {
          console.log(`⚠️ No plans found for Map ID: ${mapId}`);
          profile.warnings.push(`No plans found for Map ID: ${mapId}`);
          profile.warnings.push(`Continuing with alternative data sources...`);
        } else {
          console.log(`✅ Found ${profile.plans.length} plans for Map ID: ${mapId}`);
          profile.plans.forEach((plan, index) => {
            console.log(`📄 Plan ${index + 1}:`, {
              id: plan.id,
              name: plan.name,
              mapName: plan.mapName,
              type: plan.planType || plan.type
            });
          });
        }
      } catch (error) {
        console.error(`❌ Plans fetch failed:`, error.message);
        profile.errors.push(`Plans fetch failed: ${error.message}`);
        profile.warnings.push(`Continuing without plans data - checking alternative sources...`);
      }

      // Step 2: Fetch plan features/geometry
      if (onProgress) onProgress({ step: 'features', message: 'Fetching plan features...', progress: 25 });
      
      try {
        profile.planFeatures = await this.fetchMapFeatures(profile.plans, landAppApiKey);
        
        // Calculate total area from features
        let totalArea = 0;
        profile.planFeatures.forEach(planFeature => {
          planFeature.features.forEach(feature => {
            if (feature.area) {
              totalArea += feature.area;
            }
          });
        });
        profile.summary.totalArea = totalArea;
      } catch (error) {
        profile.errors.push(`Failed to fetch plan features: ${error.message}`);
      }

      // Step 3: Check for Nature Reporting data (Enhanced approach)
      if (onProgress) onProgress({ step: 'nature', message: 'Checking Nature Reporting data...', progress: 40 });
      
      console.log(`🌿 Step 3: Checking Nature Reporting data...`);
      if (natureReportingApiKey) {
        try {
          // Strategy 1: If we have plans, try using their map names
          if (profile.plans.length > 0) {
            const mapNames = [...new Set(profile.plans.map(plan => plan.mapName || plan.name))];
            console.log(`🗺️ Trying nature reporting with plan-derived map names:`, mapNames);
            
            for (const mapName of mapNames) {
              if (mapName) {
                try {
                  const natureData = await natureReportingService.fetchAllMetricsForMap(natureReportingApiKey, mapName);
                  if (natureData && natureData.length > 0) {
                    console.log(`✅ Found nature reporting data via map name: ${mapName}`);
                    profile.natureReporting = {
                      mapName,
                      data: natureData,
                      keyMetrics: natureReportingService.getKeyMetricsForMap(natureData[0]),
                      processedData: natureReportingService.processMetricsForDashboard(natureData)
                    };
                    profile.summary.hasNatureReporting = true;
                    break;
                  }
                } catch (error) {
                  console.warn(`❌ No nature reporting data for map name ${mapName}:`, error.message);
                }
              }
            }
          }
          
          // Strategy 2: If no plans or no nature data found via plans, try direct search with mapId
          if (!profile.summary.hasNatureReporting) {
            console.log(`🔄 Trying direct nature reporting search with Map ID: ${mapId}`);
            try {
              const natureData = await natureReportingService.fetchAllMetricsForMap(natureReportingApiKey, mapId);
              if (natureData && natureData.length > 0) {
                console.log(`✅ Found nature reporting data via direct Map ID search`);
                profile.natureReporting = {
                  mapName: mapId,
                  data: natureData,
                  keyMetrics: natureReportingService.getKeyMetricsForMap(natureData[0]),
                  processedData: natureReportingService.processMetricsForDashboard(natureData)
                };
                profile.summary.hasNatureReporting = true;
              }
            } catch (error) {
              console.warn(`❌ Direct nature reporting search failed:`, error.message);
            }
          }
          
          // Strategy 3: If still no data, try getting available maps and fuzzy matching
          if (!profile.summary.hasNatureReporting) {
            console.log(`🔍 Trying fuzzy matching with available nature maps...`);
            try {
              const availableMaps = await natureReportingService.fetchAvailableMapNames(natureReportingApiKey);
              console.log(`📊 Found ${availableMaps.length} available nature maps`);
              
              // Find potential matches
              const potentialMatches = availableMaps.filter(mapName => 
                mapName.toLowerCase().includes(mapId.toLowerCase()) ||
                mapId.toLowerCase().includes(mapName.toLowerCase())
              );
              
              if (potentialMatches.length > 0) {
                console.log(`🎯 Found potential nature map matches:`, potentialMatches);
                // Try the first potential match
                const natureData = await natureReportingService.fetchAllMetricsForMap(natureReportingApiKey, potentialMatches[0]);
                if (natureData && natureData.length > 0) {
                  console.log(`✅ Found nature reporting data via fuzzy matching: ${potentialMatches[0]}`);
                  profile.natureReporting = {
                    mapName: potentialMatches[0],
                    data: natureData,
                    keyMetrics: natureReportingService.getKeyMetricsForMap(natureData[0]),
                    processedData: natureReportingService.processMetricsForDashboard(natureData)
                  };
                  profile.summary.hasNatureReporting = true;
                  profile.warnings.push(`Found nature data using similar map name: ${potentialMatches[0]}`);
                }
              } else {
                console.log(`⚠️ No fuzzy matches found in available nature maps`);
                profile.warnings.push(`No nature reporting data found for this map`);
              }
            } catch (error) {
              console.warn(`❌ Fuzzy matching attempt failed:`, error.message);
              profile.warnings.push(`Could not search available nature maps: ${error.message}`);
            }
          }
          
          if (profile.summary.hasNatureReporting) {
            console.log(`🌿 Nature reporting data successfully loaded!`);
          } else {
            console.log(`⚠️ No nature reporting data found after trying all strategies`);
          }
          
        } catch (error) {
          console.error(`❌ Nature reporting check failed:`, error.message);
          profile.errors.push(`Failed to fetch nature reporting data: ${error.message}`);
        }
      } else {
        console.log(`⚠️ No nature reporting API key provided`);
        profile.warnings.push(`Nature Reporting API key not provided`);
      }

      // Step 4: Run land analysis if we have features
      if (onProgress) onProgress({ step: 'analysis', message: 'Running land analysis...', progress: 60 });
      
      if (profile.planFeatures.length > 0) {
        try {
          // Flatten all features for analysis
          const allFeatures = [];
          profile.planFeatures.forEach(planFeature => {
            allFeatures.push(...planFeature.features);
          });

          if (allFeatures.length > 0) {
            profile.landAnalysis = await landAnalysisService.analyzeHolding(
              mapId, 
              profile.plans, 
              profile.planFeatures
            );
            profile.summary.hasLandAnalysis = true;
            profile.summary.estimatedValue = profile.landAnalysis?.executive?.totalValue?.total || 0;
          }
        } catch (error) {
          profile.errors.push(`Failed to run land analysis: ${error.message}`);
        }
      }

      // Step 5: Check for EPC data if we have buildings
      if (onProgress) onProgress({ step: 'epc', message: 'Checking energy performance data...', progress: 80 });
      
      if (profile.landAnalysis?.rawData?.geometryAnalysis) {
        try {
          // Extract building features for EPC lookup
          const geometryData = profile.landAnalysis.rawData.geometryAnalysis;
          const buildingFeatures = [];
          
          Object.values(geometryData.planAnalysis || {}).forEach(planData => {
            Object.entries(planData.featureGroups || {}).forEach(([type, group]) => {
              if (type.includes('building')) {
                buildingFeatures.push(...group.features);
              }
            });
          });

          if (buildingFeatures.length > 0) {
            // Try to enhance buildings with UPRNs first
            const enhancementResult = await osLinkedIdentifiersService.prepareEnhancedBuildingsForEPC(buildingFeatures);
            
            if (enhancementResult.success && enhancementResult.identifiers.length > 0) {
              profile.epcData = await epcService.processEstateEPC(enhancementResult.enhancedBuildings);
              profile.summary.hasEpcData = profile.epcData?.success || false;
            }
          }
        } catch (error) {
          profile.errors.push(`Failed to fetch EPC data: ${error.message}`);
        }
      }

      if (onProgress) onProgress({ step: 'complete', message: 'Profile complete!', progress: 100 });

      // Final summary
      console.log(`🏆 Map Profile Summary for ${mapId}:`, {
        plans: profile.summary.totalPlans,
        features: profile.planFeatures.length,
        natureReporting: profile.summary.hasNatureReporting,
        landAnalysis: profile.summary.hasLandAnalysis,
        epcData: profile.summary.hasEpcData,
        errors: profile.errors.length,
        warnings: profile.warnings.length
      });

      // Even if we have no plans, we might have nature reporting data - make sure it's accessible
      if (profile.summary.totalPlans === 0 && profile.summary.hasNatureReporting) {
        profile.warnings.push(`Found environmental data via Nature Reporting even though no plans were located`);
        profile.warnings.push(`This may indicate the map exists but uses a different naming convention in the Land App API`);
      }

      return profile;

    } catch (error) {
      console.error('🚨 Critical error creating comprehensive map profile:', error);
      profile.errors.push(`Failed to create map profile: ${error.message}`);
      
      // Don't throw the error - return partial results
      console.log(`⚠️ Returning partial results despite error`);
      return profile;
    }
  }

  extractMapIdFromInput(input) {
    if (!input || typeof input !== 'string') {
      return { success: false, error: 'Input is required', mapId: null };
    }

    const trimmedInput = input.trim();
    
    // Check if it's a URL
    if (trimmedInput.startsWith('http://') || trimmedInput.startsWith('https://')) {
      try {
        const url = new URL(trimmedInput);
        
        // Handle Land App URLs like https://go.thelandapp.com/map/5e99633806bf1a001983c881
        if (url.hostname === 'go.thelandapp.com' || url.hostname === 'thelandapp.com') {
          const pathParts = url.pathname.split('/');
          const mapIndex = pathParts.indexOf('map');
          
          if (mapIndex !== -1 && pathParts.length > mapIndex + 1) {
            const mapId = pathParts[mapIndex + 1];
            return { success: true, mapId, extractedFrom: 'URL', originalInput: trimmedInput };
          }
        }
        
        // Handle other URL formats - try to extract from the end of the path
        const pathParts = url.pathname.split('/').filter(part => part.length > 0);
        if (pathParts.length > 0) {
          const potentialMapId = pathParts[pathParts.length - 1];
          const validation = this.validateMapId(potentialMapId);
          if (validation.valid) {
            return { success: true, mapId: potentialMapId, extractedFrom: 'URL path', originalInput: trimmedInput };
          }
        }
        
        return { success: false, error: 'Could not extract Map ID from URL', mapId: null };
        
      } catch (urlError) {
        return { success: false, error: 'Invalid URL format', mapId: null };
      }
    }
    
    // If it's not a URL, treat it as a direct Map ID
    const validation = this.validateMapId(trimmedInput);
    if (validation.valid) {
      return { success: true, mapId: trimmedInput, extractedFrom: 'direct', originalInput: trimmedInput };
    } else {
      return { success: false, error: validation.error, mapId: null };
    }
  }

  validateMapId(mapId) {
    if (!mapId || typeof mapId !== 'string') {
      return { valid: false, error: 'Map ID is required' };
    }

    // Basic validation - should be a valid ObjectId format or alphanumeric
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    const alphanumericRegex = /^[a-zA-Z0-9_-]+$/;
    
    if (!objectIdRegex.test(mapId) && !alphanumericRegex.test(mapId)) {
      return { valid: false, error: 'Invalid Map ID format' };
    }

    return { valid: true };
  }

  formatProfileSummary(profile) {
    return {
      mapId: profile.mapId,
      totalPlans: profile.summary.totalPlans,
      totalAreaFormatted: this.formatArea(profile.summary.totalArea),
      estimatedValueFormatted: this.formatCurrency(profile.summary.estimatedValue),
      dataAvailability: {
        plans: profile.plans.length > 0,
        features: profile.planFeatures.length > 0,
        natureReporting: profile.summary.hasNatureReporting,
        landAnalysis: profile.summary.hasLandAnalysis,
        epcData: profile.summary.hasEpcData
      },
      errors: profile.errors
    };
  }

  formatArea(area) {
    if (!area) return '0 m²';
    
    if (area >= 10000) {
      return `${(area / 10000).toFixed(2)} ha`;
    } else {
      return `${area.toFixed(0)} m²`;
    }
  }

  formatCurrency(value) {
    if (!value) return '£0';
    
    if (value >= 1000000) {
      return `£${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `£${(value / 1000).toFixed(0)}k`;
    } else {
      return `£${value.toFixed(0)}`;
    }
  }
}

export default new MapProfileService();