/**
 * Geometry Service for Land Analysis
 * Handles OSMasterMap geometry processing, area calculations, and deduplication
 */

// Utility functions for coordinate transformations and calculations
class GeometryService {
  constructor() {
    // Earth's radius in meters (for area calculations)
    this.EARTH_RADIUS = 6378137;
    
    // Conversion factors
    this.SQUARE_METERS_TO_HECTARES = 10000;
    this.SQUARE_METERS_TO_ACRES = 4046.86;
    this.HECTARES_TO_ACRES = 2.47105;
  }

  /**
   * Calculate area of a polygon using the shoelace formula
   * Assumes coordinates are in [longitude, latitude] format
   */
  calculatePolygonArea(coordinates) {
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 3) {
      return 0;
    }

    // Convert to Web Mercator for more accurate area calculation
    const projectedCoords = coordinates.map(coord => this.toWebMercator(coord[0], coord[1]));
    
    let area = 0;
    const n = projectedCoords.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += projectedCoords[i][0] * projectedCoords[j][1];
      area -= projectedCoords[j][0] * projectedCoords[i][1];
    }
    
    return Math.abs(area) / 2;
  }

  /**
   * Convert WGS84 coordinates to Web Mercator projection
   */
  toWebMercator(lon, lat) {
    const x = lon * 20037508.34 / 180;
    let y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
    y = y * 20037508.34 / 180;
    return [x, y];
  }

  /**
   * Process GeoJSON feature to extract area information
   */
  processFeature(feature) {
    if (!feature || !feature.geometry) {
      return {
        area: 0,
        areaHectares: 0,
        areaAcres: 0,
        type: 'unknown',
        geometry: null
      };
    }

    const { geometry, properties = {} } = feature;
    let totalArea = 0;
    let processedGeometry = null;
    let areaSource = 'calculated';

    // First check if Land App API provides pre-calculated area data
    if (properties.area_m2) {
      totalArea = parseFloat(properties.area_m2);
      areaSource = 'Land App API (area_m2)';
      console.log(`Using Land App API area: ${totalArea} m² for feature ${properties.fid || 'unknown'}`);
    } else if (properties.area) {
      // Check if area is in square meters or needs conversion
      const areaValue = parseFloat(properties.area);
      if (!isNaN(areaValue)) {
        // Assume it's in square meters if no unit specified
        totalArea = areaValue;
        areaSource = 'Land App API (area)';
        console.log(`Using Land App API area: ${totalArea} m² for feature ${properties.fid || 'unknown'}`);
      }
    } else if (properties.calculatedArea) {
      totalArea = parseFloat(properties.calculatedArea);
      areaSource = 'Land App API (calculatedArea)';
      console.log(`Using Land App API calculated area: ${totalArea} m² for feature ${properties.fid || 'unknown'}`);
    }

    // Only calculate area from geometry if not provided by API
    if (totalArea === 0) {
      areaSource = 'calculated from geometry';
      try {
        switch (geometry.type) {
          case 'Polygon':
            // Handle single polygon
            if (geometry.coordinates && geometry.coordinates[0]) {
              totalArea = this.calculatePolygonArea(geometry.coordinates[0]);
              processedGeometry = {
                type: 'Polygon',
                coordinates: geometry.coordinates
              };
            }
            break;

          case 'MultiPolygon':
            // Handle multiple polygons - sum their areas
            if (geometry.coordinates && Array.isArray(geometry.coordinates)) {
              geometry.coordinates.forEach(polygon => {
                if (polygon[0]) {
                  totalArea += this.calculatePolygonArea(polygon[0]);
                }
              });
              processedGeometry = {
                type: 'MultiPolygon',
                coordinates: geometry.coordinates
              };
            }
            break;

          default:
            // For other geometry types, return 0 area but preserve geometry
            processedGeometry = geometry;
            break;
        }
      } catch (error) {
        console.warn('Error calculating area from geometry:', error);
        totalArea = 0;
      }
    } else {
      // Area provided by API, just preserve geometry
      processedGeometry = geometry;
    }

    const result = {
      area: totalArea, // square meters
      areaHectares: totalArea / this.SQUARE_METERS_TO_HECTARES,
      areaAcres: totalArea / this.SQUARE_METERS_TO_ACRES,
      areaSource: areaSource,
      type: this.classifyFeatureType(properties),
      geometry: processedGeometry,
      properties: properties,
      originalFeature: feature
    };

    // Log area information for debugging
    console.log(`📐 Feature ${properties.fid || 'unknown'} area: ${totalArea.toFixed(2)} m² (${areaSource})`);
    
    return result;
  }

  /**
   * Classify feature type based on OSMasterMap properties
   */
  classifyFeatureType(properties) {
    if (!properties) return 'unknown';

    // Helper function to clean OSMasterMap values (removes braces and converts to lowercase)
    const cleanValue = (value) => {
      if (!value) return '';
      return String(value).replace(/[{}]/g, '').toLowerCase();
    };

    // OSMasterMap classification logic
    const theme = cleanValue(properties.theme);
    const descriptiveGroup = cleanValue(properties.descriptiveGroup);
    const descriptiveTerm = cleanValue(properties.descriptiveTerm);

    console.log('Classifying feature:', { 
      originalTheme: properties.theme,
      cleanTheme: theme,
      originalDescriptiveGroup: properties.descriptiveGroup,
      cleanDescriptiveGroup: descriptiveGroup,
      originalDescriptiveTerm: properties.descriptiveTerm,
      cleanDescriptiveTerm: descriptiveTerm
    });

    // Buildings
    if (theme === 'buildings' || theme === 'building' || descriptiveGroup.includes('building')) {
      if (descriptiveTerm.includes('house') || descriptiveTerm.includes('residential') || descriptiveTerm.includes('dwelling')) {
        return 'residential_building';
      } else if (descriptiveTerm.includes('commercial') || descriptiveTerm.includes('office') || descriptiveTerm.includes('shop') || descriptiveTerm.includes('retail')) {
        return 'commercial_building';
      } else if (descriptiveTerm.includes('agricultural') || descriptiveTerm.includes('farm') || descriptiveTerm.includes('barn')) {
        return 'agricultural_building';
      }
      return 'building';
    }

    // Land features
    if (theme === 'land') {
      if (descriptiveGroup.includes('agricultural')) {
        return 'agricultural_land';
      } else if (descriptiveGroup.includes('garden') || descriptiveGroup.includes('recreation')) {
        return 'garden_recreation';
      } else if (descriptiveGroup.includes('natural')) {
        return 'natural_land';
      }
      return 'land';
    }

    // Water features
    if (theme === 'water' || descriptiveGroup.includes('water')) {
      return 'water';
    }

    // Transport/Infrastructure
    if (theme === 'transport' || descriptiveGroup.includes('road') || descriptiveGroup.includes('path')) {
      return 'transport';
    }

    // Default classification
    return properties.theme || 'unknown';
  }

  /**
   * Remove overlapping areas between multiple geometries
   * This is a simplified version - for production, consider using a proper GIS library
   */
  deduplicateGeometries(processedFeatures) {
    if (!processedFeatures || processedFeatures.length <= 1) {
      return processedFeatures;
    }

    // Simple approach: group by type and sum areas
    // In production, you'd use actual spatial intersection algorithms
    const featureGroups = {};
    let totalUniqueArea = 0;

    processedFeatures.forEach(feature => {
      const key = `${feature.type}`;
      if (!featureGroups[key]) {
        featureGroups[key] = {
          type: feature.type,
          features: [],
          totalArea: 0,
          totalAreaHectares: 0,
          totalAreaAcres: 0
        };
      }

      featureGroups[key].features.push(feature);
      featureGroups[key].totalArea += feature.area;
      featureGroups[key].totalAreaHectares += feature.areaHectares;
      featureGroups[key].totalAreaAcres += feature.areaAcres;
    });

    // Calculate total area (simplified - assumes no overlaps within types)
    Object.values(featureGroups).forEach(group => {
      totalUniqueArea += group.totalArea;
    });

    return {
      featureGroups,
      totalArea: totalUniqueArea,
      totalAreaHectares: totalUniqueArea / this.SQUARE_METERS_TO_HECTARES,
      totalAreaAcres: totalUniqueArea / this.SQUARE_METERS_TO_ACRES,
      featureCount: processedFeatures.length
    };
  }

  /**
   * Process multiple plans and return deduplicated analysis
   */
  async analyzePlansGeometry(plans, planFeatures) {
    if (!plans || plans.length === 0) {
      console.warn('No plans provided for geometry analysis');
      return this.getEmptyGeometryAnalysis();
    }

    if (!planFeatures) {
      console.warn('No plan features provided for geometry analysis');
      return this.getEmptyGeometryAnalysis();
    }

    console.log('Analyzing geometry for plans:', plans.map(p => p.id));
    
    const allProcessedFeatures = [];
    const planAnalysis = {};

    // Process each plan's features
    for (const plan of plans) {
      if (!plan || !plan.id) {
        console.warn('Invalid plan object:', plan);
        continue;
      }

      const planData = planFeatures[plan.id];
      const features = planData?.features || [];
      console.log(`Processing ${features.length} features for plan ${plan.id} (${plan.name})`);
      
      if (features.length === 0) {
        console.warn(`No features found for plan ${plan.id}. You may need to load features first.`);
      }
      
      const processedFeatures = features.map(feature => this.processFeature(feature));
      allProcessedFeatures.push(...processedFeatures);
      
      // Store individual plan analysis
      const planDeduplication = this.deduplicateGeometries(processedFeatures);
      planAnalysis[plan.id] = {
        plan,
        ...planDeduplication,
        featureCount: features.length
      };
    }

    // Global deduplication across all plans
    const globalAnalysis = this.deduplicateGeometries(allProcessedFeatures);

    const result = {
      globalAnalysis,
      planAnalysis,
      totalFeatures: allProcessedFeatures.length,
      planCount: plans.length
    };

    console.log('Geometry analysis completed:', {
      totalFeatures: result.totalFeatures,
      planCount: result.planCount,
      totalArea: result.globalAnalysis?.totalArea || 0
    });

    return result;
  }

  /**
   * Return empty geometry analysis for error cases
   */
  getEmptyGeometryAnalysis() {
    return {
      globalAnalysis: {
        featureGroups: {},
        totalArea: 0,
        totalAreaHectares: 0,
        totalAreaAcres: 0,
        featureCount: 0
      },
      planAnalysis: {},
      totalFeatures: 0,
      planCount: 0
    };
  }

  /**
   * Generate area summary for reporting
   */
  generateAreaSummary(analysisResult) {
    if (!analysisResult) {
      console.warn('Analysis result is null or undefined');
      return this.getEmptyAreaSummary();
    }

    const { globalAnalysis, planAnalysis } = analysisResult;
    
    if (!globalAnalysis) {
      console.warn('Global analysis is null or undefined');
      return this.getEmptyAreaSummary();
    }

    // Ensure featureGroups exists
    const featureGroups = globalAnalysis.featureGroups || {};
    
    return {
      total: {
        area: globalAnalysis.totalArea || 0,
        hectares: globalAnalysis.totalAreaHectares || 0,
        acres: globalAnalysis.totalAreaAcres || 0,
        features: globalAnalysis.featureCount || 0
      },
      byType: Object.entries(featureGroups).map(([type, group]) => ({
        type,
        displayName: this.getDisplayName(type),
        area: group.totalArea || 0,
        hectares: group.totalAreaHectares || 0,
        acres: group.totalAreaAcres || 0,
        features: (group.features && group.features.length) || 0,
        percentage: globalAnalysis.totalArea > 0 
          ? ((group.totalArea / globalAnalysis.totalArea) * 100).toFixed(1)
          : '0.0'
      })),
      byPlan: planAnalysis ? Object.values(planAnalysis).map(plan => ({
        planId: plan.plan?.id || 'unknown',
        planName: plan.plan?.name || 'Unknown Plan',
        planType: plan.plan?.planType || 'Unknown',
        area: plan.totalArea || 0,
        hectares: plan.totalAreaHectares || 0,
        acres: plan.totalAreaAcres || 0,
        features: plan.featureCount || 0
      })) : []
    };
  }

  /**
   * Return empty area summary for error cases
   */
  getEmptyAreaSummary() {
    return {
      total: {
        area: 0,
        hectares: 0,
        acres: 0,
        features: 0
      },
      byType: [],
      byPlan: []
    };
  }

  /**
   * Get display name for feature types
   */
  getDisplayName(type) {
    const displayNames = {
      'residential_building': 'Residential Buildings',
      'commercial_building': 'Commercial Buildings',
      'agricultural_building': 'Agricultural Buildings',
      'building': 'Other Buildings',
      'agricultural_land': 'Agricultural Land',
      'garden_recreation': 'Gardens & Recreation',
      'natural_land': 'Natural Areas',
      'land': 'Other Land',
      'water': 'Water Features',
      'transport': 'Roads & Paths',
      'unknown': 'Unclassified Features'
    };
    return displayNames[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Format area for display
   */
  formatArea(areaInSquareMeters, unit = 'hectares') {
    switch (unit) {
      case 'hectares':
        return `${(areaInSquareMeters / this.SQUARE_METERS_TO_HECTARES).toFixed(2)} ha`;
      case 'acres':
        return `${(areaInSquareMeters / this.SQUARE_METERS_TO_ACRES).toFixed(2)} acres`;
      case 'sqm':
        return `${areaInSquareMeters.toFixed(0)} m²`;
      default:
        return `${areaInSquareMeters.toFixed(0)} m²`;
    }
  }
}

// Export singleton instance
export default new GeometryService();