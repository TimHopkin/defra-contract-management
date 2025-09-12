/**
 * Plan Detail Service
 * Fetches comprehensive plan data, features, and analytics for detailed plan analysis
 */

import axios from 'axios';
import geometryService from './geometryService';
import paymentRatesService from './paymentRatesService';
import landAnalysisService from './landAnalysisService';

class PlanDetailService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 15 * 60 * 1000; // 15 minutes cache
    this.baseURL = 'https://integration-api.thelandapp.com';
  }

  // Cache management
  getCached(key) {
    const item = this.cache.get(key);
    if (item && Date.now() - item.timestamp < this.cacheTTL) {
      return item.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCached(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }

  /**
   * Get comprehensive plan details including features, financial analysis, and recommendations
   */
  async getComprehensivePlanDetails(plan, apiKey) {
    const cacheKey = `plan_details_${plan.id}_${apiKey}`;
    const cached = this.getCached(cacheKey);
    
    if (cached) {
      console.log(`Using cached plan details for: ${plan.name}`);
      return cached;
    }

    console.log(`🔍 Fetching comprehensive details for plan: ${plan.name} (${plan.planType})`);

    const startTime = Date.now();
    
    try {
      // Fetch plan features and data in parallel
      const [features, additionalData] = await Promise.all([
        this.fetchPlanFeatures(plan.id, apiKey),
        this.fetchAdditionalPlanData(plan.id, apiKey)
      ]);

      // Process geometry and calculate areas
      const geometryAnalysis = await this.analyzeplanGeometry(plan, features);
      
      // Get payment rates and financial analysis
      const paymentAnalysis = this.analyzePaymentPotential(plan, geometryAnalysis);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(plan, geometryAnalysis, paymentAnalysis);
      
      // Compile comprehensive analysis
      const planDetails = {
        plan: {
          ...plan,
          fullName: this.getPlanFullName(plan.planType),
          statusBadge: this.getPlanStatusBadge(plan),
          colorScheme: this.getPlanColorScheme(plan.planType)
        },
        
        geometry: geometryAnalysis,
        
        financial: paymentAnalysis,
        
        recommendations,
        
        features: {
          total: features.length,
          byType: this.groupFeaturesByType(features),
          geoJson: {
            type: 'FeatureCollection',
            features: features
          }
        },
        
        // Technical metadata
        metadata: {
          processingTime: Date.now() - startTime,
          dataQuality: this.assessDataQuality(features, geometryAnalysis),
          lastUpdated: new Date().toISOString(),
          apiVersion: '1.0'
        },
        
        // Raw data for advanced use
        rawData: {
          originalPlan: plan,
          features: features,
          additionalData: additionalData
        }
      };

      // Cache the results
      this.setCached(cacheKey, planDetails);
      
      console.log(`✅ Plan analysis completed in ${Date.now() - startTime}ms`);
      return planDetails;
      
    } catch (error) {
      console.error('Error fetching comprehensive plan details:', error);
      throw new Error(`Failed to fetch plan details: ${error.message}`);
    }
  }

  /**
   * Fetch plan features from the Land App API
   */
  async fetchPlanFeatures(planId, apiKey) {
    try {
      const response = await axios.get(`${this.baseURL}/plan/${planId}/features`, {
        params: { apiKey: apiKey },
        timeout: 30000
      });
      
      console.log(`📍 Fetched ${response.data?.length || 0} features for plan ${planId}`);
      return response.data || [];
      
    } catch (error) {
      console.warn(`Failed to fetch features for plan ${planId}:`, error.message);
      return [];
    }
  }

  /**
   * Fetch additional plan metadata and details
   */
  async fetchAdditionalPlanData(planId, apiKey) {
    try {
      // Try to fetch additional plan details if available
      const response = await axios.get(`${this.baseURL}/plan/${planId}`, {
        params: { apiKey: apiKey },
        timeout: 15000
      });
      
      return response.data || {};
      
    } catch (error) {
      console.warn(`Could not fetch additional data for plan ${planId}:`, error.message);
      return {};
    }
  }

  /**
   * Analyze plan geometry and calculate areas
   */
  async analyzeplanGeometry(plan, features) {
    if (!features || features.length === 0) {
      return {
        totalArea: 0,
        totalAreaHa: 0,
        totalAreaAcres: 0,
        featureGroups: {},
        summary: {
          totalFeatures: 0,
          validFeatures: 0,
          areaCalculated: false
        }
      };
    }

    try {
      // Calculate basic area from features
      let totalArea = 0;
      let validFeatures = 0;
      
      features.forEach(feature => {
        if (feature.properties?.area && !isNaN(feature.properties.area)) {
          totalArea += feature.properties.area;
          validFeatures++;
        }
      });
      
      return {
        totalArea: totalArea,
        totalAreaHa: totalArea / 10000, // Convert to hectares
        totalAreaAcres: (totalArea / 10000) * 2.47105, // Convert to acres
        totalAreaFormatted: geometryService.formatArea(totalArea, 'hectares'),
        featureGroups: this.groupFeaturesByType(features),
        boundingBox: null, // Will be calculated if needed
        summary: {
          totalFeatures: features.length,
          validFeatures: validFeatures,
          areaCalculated: totalArea > 0,
          coordinateSystem: 'WGS84'
        }
      };
      
    } catch (error) {
      console.error('Error analyzing plan geometry:', error);
      return {
        totalArea: 0,
        totalAreaHa: 0,
        totalAreaAcres: 0,
        featureGroups: {},
        summary: {
          totalFeatures: features.length,
          validFeatures: 0,
          areaCalculated: false,
          error: error.message
        }
      };
    }
  }

  /**
   * Analyze payment potential for the plan
   */
  analyzePaymentPotential(plan, geometryAnalysis) {
    const scheme = paymentRatesService.getSchemeFromPlanType(plan.planType);
    const areaHa = geometryAnalysis?.totalAreaHa || 0;
    
    if (areaHa === 0 || scheme === 'UNKNOWN') {
      return {
        areaHa: 0,
        currentPayment: { total: 0, error: 'No area or unknown scheme' },
        potentialPayment: { total: 0, error: 'No area or unknown scheme' },
        availableActions: [],
        upscalePotential: 0,
        roi: null,
        scheme: paymentRatesService.getSchemeInfo(plan.planType)
      };
    }

    // Calculate current estimated payment (if actions were applied)
    const currentPayment = paymentRatesService.calculateAnnualPayment(
      plan.planType,
      areaHa,
      [] // No specific actions - base calculation
    );

    // Get available actions for this scheme
    const availableActions = paymentRatesService.getAvailableActions(plan.planType);
    
    // Calculate potential with high-value actions
    const topActions = availableActions
      .filter(action => action.priority === 'High')
      .slice(0, 5) // Top 5 high-value actions
      .map(action => ({
        code: action.code,
        area: Math.min(areaHa, areaHa * 0.25) // Assume 25% coverage for most actions
      }));

    const potentialPayment = paymentRatesService.calculateAnnualPayment(
      plan.planType,
      areaHa,
      topActions
    );

    // Calculate ROI assuming moderate implementation costs
    const estimatedImplementationCosts = areaHa * 200; // £200/ha estimated costs
    const roi = paymentRatesService.calculateROI(
      plan.planType,
      areaHa,
      topActions,
      estimatedImplementationCosts
    );

    return {
      areaHa,
      currentPayment,
      potentialPayment,
      availableActions: availableActions.slice(0, 10), // Top 10 actions
      upscalePotential: potentialPayment.total - currentPayment.total,
      roi,
      scheme: paymentRatesService.getSchemeInfo(plan.planType)
    };
  }

  /**
   * Generate actionable recommendations for the plan
   */
  generateRecommendations(plan, geometryAnalysis, paymentAnalysis) {
    const recommendations = [];
    const scheme = paymentRatesService.getSchemeFromPlanType(plan.planType);
    
    // Area-based recommendations
    if (geometryAnalysis.totalAreaHa > 0) {
      if (geometryAnalysis.totalAreaHa < 5) {
        recommendations.push({
          type: 'optimization',
          priority: 'medium',
          title: 'Small Holding Focus',
          description: `At ${geometryAnalysis.totalAreaHa.toFixed(1)}ha, focus on high-value actions like species-rich grassland or hedgerow management.`,
          actions: ['Prioritize premium rate actions', 'Consider intensive management options'],
          potentialValue: paymentRatesService.formatCurrency(geometryAnalysis.totalAreaHa * 500)
        });
      } else if (geometryAnalysis.totalAreaHa > 50) {
        recommendations.push({
          type: 'opportunity',
          priority: 'high',
          title: 'Large Area Advantage',
          description: `With ${geometryAnalysis.totalAreaHa.toFixed(1)}ha, you can maximize scheme diversity and management payments.`,
          actions: ['Mix of premium and standard actions', 'Consider Higher Tier applications'],
          potentialValue: paymentRatesService.formatCurrency(geometryAnalysis.totalAreaHa * 300)
        });
      }
    }

    // Scheme-specific recommendations
    switch (scheme) {
      case 'SFI':
        recommendations.push({
          type: 'scheme',
          priority: 'high',
          title: 'SFI Management Payment',
          description: 'Ensure you claim the £20/ha management payment for your first 50 hectares.',
          actions: ['Submit SFI application', 'Plan 3-year management cycle'],
          potentialValue: paymentRatesService.formatCurrency(Math.min(geometryAnalysis.totalAreaHa, 50) * 20)
        });
        
        if (paymentAnalysis.availableActions.some(a => a.rate > 500)) {
          recommendations.push({
            type: 'premium',
            priority: 'high',
            title: 'High-Value Actions Available',
            description: 'Premium actions like species-rich grassland (£646/ha) could significantly increase returns.',
            actions: ['Assess land suitability', 'Consider biodiversity potential'],
            potentialValue: paymentRatesService.formatCurrency(geometryAnalysis.totalAreaHa * 0.1 * 646)
          });
        }
        break;

      case 'CSS':
        recommendations.push({
          type: 'scheme',
          priority: 'high',
          title: 'CSS 10% Rate Increase',
          description: '2024 saw 10% average payment increases. Review your agreement for better rates.',
          actions: ['Check agreement renewal options', 'Consider additional options'],
          potentialValue: paymentRatesService.formatCurrency(paymentAnalysis.currentPayment.total * 0.1)
        });
        break;

      case 'BPS':
        recommendations.push({
          type: 'urgent',
          priority: 'high',
          title: 'BPS Phase-Out Planning',
          description: 'BPS payments are reducing each year. Plan transition to SFI/CSS immediately.',
          actions: ['Calculate BPS reduction impact', 'Apply for replacement schemes', 'Seek advice on transition'],
          potentialValue: paymentRatesService.formatCurrency(paymentAnalysis.currentPayment.total * 0.3)
        });
        break;
    }

    // Financial recommendations
    if (paymentAnalysis.upscalePotential > 1000) {
      recommendations.push({
        type: 'financial',
        priority: 'high',
        title: 'Significant Upscale Potential',
        description: `Implementing optimal actions could increase annual payments by ${paymentRatesService.formatCurrency(paymentAnalysis.upscalePotential)}.`,
        actions: ['Detailed feasibility assessment', 'Professional scheme advice', 'Phased implementation plan'],
        potentialValue: paymentRatesService.formatCurrency(paymentAnalysis.upscalePotential)
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { 'urgent': 3, 'high': 2, 'medium': 1, 'low': 0 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Get plan type color scheme for consistent UI
   */
  getPlanColorScheme(planType) {
    const colorSchemes = {
      'BPS': { primary: '#3b82f6', secondary: '#93c5fd', background: '#eff6ff' },
      'CSS': { primary: '#10b981', secondary: '#6ee7b7', background: '#ecfdf5' },
      'CSS_2025': { primary: '#10b981', secondary: '#6ee7b7', background: '#ecfdf5' },
      'SFI2022': { primary: '#8b5cf6', secondary: '#c4b5fd', background: '#f5f3ff' },
      'SFI2023': { primary: '#8b5cf6', secondary: '#c4b5fd', background: '#f5f3ff' },
      'SFI2024': { primary: '#8b5cf6', secondary: '#c4b5fd', background: '#f5f3ff' },
      'UKHAB': { primary: '#f59e0b', secondary: '#fbbf24', background: '#fffbeb' },
      'UKHAB_V2': { primary: '#f59e0b', secondary: '#fbbf24', background: '#fffbeb' },
      'LAND_MANAGEMENT': { primary: '#6366f1', secondary: '#a5b4fc', background: '#eef2ff' },
      'LAND_MANAGEMENT_V2': { primary: '#6366f1', secondary: '#a5b4fc', background: '#eef2ff' },
      'ESS': { primary: '#059669', secondary: '#6ee7b7', background: '#ecfdf5' },
      'OSMM': { primary: '#6b7280', secondary: '#d1d5db', background: '#f9fafb' }
    };
    
    return colorSchemes[planType] || { primary: '#6b7280', secondary: '#d1d5db', background: '#f9fafb' };
  }

  /**
   * Get plan status badge configuration
   */
  getPlanStatusBadge(plan) {
    const status = plan.status || 'Unknown';
    const badgeConfig = {
      'Active': { color: 'green', text: 'Active' },
      'Draft': { color: 'yellow', text: 'Draft' },
      'Submitted': { color: 'blue', text: 'Submitted' },
      'Approved': { color: 'green', text: 'Approved' },
      'Expired': { color: 'red', text: 'Expired' },
      'Unknown': { color: 'gray', text: 'Status Unknown' }
    };
    
    return badgeConfig[status] || badgeConfig['Unknown'];
  }

  /**
   * Get full descriptive name for plan type
   */
  getPlanFullName(planType) {
    const fullNames = {
      'BPS': 'Basic Payment Scheme',
      'CSS': 'Countryside Stewardship Scheme',
      'CSS_2025': 'Countryside Stewardship Scheme 2025',
      'SFI2022': 'Sustainable Farming Incentive 2022',
      'SFI2023': 'Sustainable Farming Incentive 2023',
      'SFI2024': 'Sustainable Farming Incentive 2024',
      'UKHAB': 'UK Habitat Classification',
      'UKHAB_V2': 'UK Habitat Classification V2',
      'LAND_MANAGEMENT': 'Land Management Plan',
      'LAND_MANAGEMENT_V2': 'Land Management Plan V2',
      'PEAT_ASSESSMENT': 'Peat Assessment',
      'OSMM': 'Ordnance Survey MasterMap',
      'USER': 'User Defined Plan',
      'ESS': 'Environmental Stewardship Scheme',
      'FER': 'Farm Environment Record',
      'HEALTHY_HEDGEROWS': 'Healthy Hedgerows'
    };
    
    return fullNames[planType] || planType;
  }

  /**
   * Group features by type for analysis
   */
  groupFeaturesByType(features) {
    const groups = {};
    
    features.forEach(feature => {
      const type = feature.properties?.descriptiveGroup || 
                   feature.properties?.theme || 
                   'Unknown';
                   
      if (!groups[type]) {
        groups[type] = {
          count: 0,
          features: [],
          totalArea: 0
        };
      }
      
      groups[type].count++;
      groups[type].features.push(feature);
      
      if (feature.properties?.area) {
        groups[type].totalArea += feature.properties.area;
      }
    });
    
    return groups;
  }

  /**
   * Assess data quality for the plan analysis
   */
  assessDataQuality(features, geometryAnalysis) {
    const totalFeatures = features.length;
    const validFeatures = geometryAnalysis.summary.validFeatures;
    const areaCalculated = geometryAnalysis.summary.areaCalculated;
    
    let score = 0;
    const issues = [];
    
    // Feature completeness
    if (totalFeatures > 0) {
      score += 25;
    } else {
      issues.push('No features found');
    }
    
    // Geometry validity
    const validityRatio = totalFeatures > 0 ? validFeatures / totalFeatures : 0;
    if (validityRatio > 0.9) {
      score += 25;
    } else if (validityRatio > 0.7) {
      score += 15;
      issues.push('Some invalid geometries');
    } else {
      issues.push('Many invalid geometries');
    }
    
    // Area calculation
    if (areaCalculated) {
      score += 25;
    } else {
      issues.push('Area calculation failed');
    }
    
    // Attribute completeness
    const attributeCompleteness = features.filter(f => 
      f.properties && 
      f.properties.theme && 
      f.properties.descriptiveGroup
    ).length / Math.max(totalFeatures, 1);
    
    if (attributeCompleteness > 0.8) {
      score += 25;
    } else if (attributeCompleteness > 0.5) {
      score += 15;
      issues.push('Some features lack detailed attributes');
    } else {
      issues.push('Many features lack attributes');
    }
    
    return {
      score,
      grade: score >= 80 ? 'High' : score >= 60 ? 'Medium' : 'Low',
      issues,
      summary: `${validFeatures}/${totalFeatures} valid features, ${(attributeCompleteness * 100).toFixed(0)}% attribute completeness`
    };
  }

  /**
   * Export plan details to different formats
   */
  exportPlanData(planDetails, format = 'json') {
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(planDetails, null, 2);
        
      case 'csv':
        return this.convertToCSV(planDetails);
        
      case 'summary':
        return this.generateTextSummary(planDetails);
        
      default:
        throw new Error('Unsupported export format');
    }
  }

  /**
   * Generate a text summary of the plan
   */
  generateTextSummary(planDetails) {
    const { plan, geometry, financial, recommendations } = planDetails;
    
    return `
PLAN ANALYSIS SUMMARY
=====================

Plan: ${plan.name}
Type: ${plan.fullName} (${plan.planType})
Status: ${plan.statusBadge.text}
Last Updated: ${new Date(planDetails.metadata.lastUpdated).toLocaleDateString()}

AREA ANALYSIS
-------------
Total Area: ${geometry.totalAreaFormatted}
Features: ${geometry.summary.totalFeatures} (${geometry.summary.validFeatures} valid)
Data Quality: ${planDetails.metadata.dataQuality.grade}

FINANCIAL ANALYSIS
------------------
Current Estimated Payment: ${paymentRatesService.formatCurrency(financial.currentPayment.total)}/year
Potential Payment: ${paymentRatesService.formatCurrency(financial.potentialPayment.total)}/year
Upscale Potential: ${paymentRatesService.formatCurrency(financial.upscalePotential)}/year
ROI: ${financial.roi?.roi.toFixed(1)}%

RECOMMENDATIONS (${recommendations.length})
------------------
${recommendations.map((rec, i) => `${i + 1}. ${rec.title} (${rec.priority})\n   ${rec.description}`).join('\n\n')}

Generated: ${new Date().toLocaleString()}
    `.trim();
  }
}

export default new PlanDetailService();