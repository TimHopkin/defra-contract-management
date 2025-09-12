/**
 * Payment Rates Service
 * Government scheme payment rates and financial calculations for agricultural schemes
 */

class PaymentRatesService {
  constructor() {
    // 2024 Government Scheme Payment Rates
    this.paymentRates = {
      // Sustainable Farming Incentive (SFI) 2024
      SFI: {
        managementPayment: {
          rate: 20, // £20/ha for first 50ha after first year
          firstYearRate: 40, // £40/ha for first year
          maxArea: 50, // Maximum area eligible for management payment
          description: 'SFI Management Payment'
        },
        
        // High Priority Premium Actions 2024
        premiumActions: {
          'SAM3': { rate: 646, name: 'Species-rich grassland management', unit: '£/ha' },
          'WBD1': { rate: 765, name: 'Lapwing nesting plots', unit: '£/ha' },
          'WBD2': { rate: 1242, name: 'Connecting river and floodplain habitats', unit: '£/ha' },
          'NUM3': { rate: 58, name: 'Legume fallow', unit: '£/ha' },
          'IPM4': { rate: 55, name: 'Flower-rich grass margins, blocks or in-field strips', unit: '£/ha' },
          'AHL3': { rate: 590, name: 'Maintain woodland', unit: '£/ha' },
          'SCR1': { rate: 129, name: 'Take archaeological features out of cultivation', unit: '£/ha' }
        },
        
        // Standard Actions
        standardActions: {
          'AHL1': { rate: 58, name: 'Hedgerow management', unit: '£/100m' },
          'AHL2': { rate: 372, name: 'Hedgerow tree management', unit: '£/100m' },
          'BFS1': { rate: 22, name: 'Beetle banks', unit: '£/100m' },
          'GS6': { rate: 646, name: 'Management of species-rich grassland', unit: '£/ha' },
          'GS15': { rate: 353, name: 'Grassland with areas of rush pasture', unit: '£/ha' },
          'IPM1': { rate: 45, name: 'Pollen and nectar plots', unit: '£/ha' },
          'IPM2': { rate: 614, name: 'Winter bird food on improved grassland', unit: '£/ha' },
          'LIG1': { rate: 382, name: 'Permanent grassland with very low inputs', unit: '£/ha' },
          'LIG2': { rate: 151, name: 'Permanent grassland with low inputs', unit: '£/ha' },
          'NUM1': { rate: 108, name: 'Herbal leys', unit: '£/ha' },
          'NUM2': { rate: 515, name: 'Multi-species winter cover crops', unit: '£/ha' },
          'SAM1': { rate: 28, name: 'Assess soil, test soil organic matter and pH', unit: '£/ha' },
          'SAM2': { rate: 40, name: 'Minimise soil disturbance on arable land', unit: '£/ha' },
          'UP1': { rate: 30, name: 'Varied seed application rates to reduce wind erosion', unit: '£/ha' },
          'UP2': { rate: 58, name: 'Reduced height, varied seed application or buffer strips on slopes', unit: '£/ha' }
        },

        landRestrictions: {
          restrictedToPercent: 25, // Many actions restricted to 25% of farm area
          description: 'Several actions are restricted to maximum 25% of total farm area to protect food security'
        }
      },

      // Countryside Stewardship Scheme (CSS) 2024
      CSS: {
        // Mid Tier Revenue Rates (10% average increase in 2024)
        midTier: {
          'AB1': { rate: 522, name: 'Nectar flower mix', unit: '£/ha' },
          'AB4': { rate: 539, name: 'Nectar flower mix on cultivated land', unit: '£/ha' },
          'AB8': { rate: 596, name: 'Flower rich margins and plots', unit: '£/ha' },
          'AB15': { rate: 853, name: 'Two year sown legume fallow', unit: '£/ha' },
          'BE3': { rate: 58, name: 'Management of field corners', unit: '£/ha' },
          'GS2': { rate: 76, name: 'Permanent grassland with low inputs', unit: '£/ha' },
          'GS4': { rate: 129, name: 'Legume and herb rich swards', unit: '£/ha' },
          'GS6': { rate: 646, name: 'Management of species-rich grassland', unit: '£/ha' },
          'GS10': { rate: 640, name: 'Rough grazing', unit: '£/ha' },
          'GS13': { rate: 170, name: 'Coastal saltmarsh', unit: '£/ha' },
          'OT3': { rate: 640, name: 'Management of lowland heath', unit: '£/ha' },
          'SW1': { rate: 77, name: 'Permanent grassland with very low inputs', unit: '£/ha' },
          'SW2': { rate: 151, name: 'Permanent grassland with low inputs (outside SDAs)', unit: '£/ha' },
          'SW3': { rate: 215, name: 'Management of moorland', unit: '£/ha' },
          'UP1': { rate: 22, name: 'Undersowing spring cereals', unit: '£/ha' },
          'UP2': { rate: 114, name: 'Winter cover crops', unit: '£/ha' }
        },
        
        // Higher Tier Capital Items
        higherTier: {
          'BE1': { rate: 640, name: 'Management of hedgerows', unit: '£/100m' },
          'BE2': { rate: 372, name: 'Hedgerow tree management', unit: '£/100m' },
          'FG1': { rate: 353, name: 'Bracken control', unit: '£/ha' },
          'OT1': { rate: 255, name: 'Upland livestock exclusion supplement', unit: '£/ha' },
          'WD1': { rate: 590, name: 'Maintenance of woodland', unit: '£/ha' },
          'WT1': { rate: 518, name: 'Buffering in-field ponds and ditches', unit: '£/ha' },
          'WT2': { rate: 474, name: 'Buffering watercourses', unit: '£/ha' },
          'WT3': { rate: 640, name: 'Buffering of sensitive water features', unit: '£/ha' }
        }
      },

      // Basic Payment Scheme (BPS) - Legacy rates
      BPS: {
        baseRate: {
          rate: 255.73, // £255.73/ha average 2023 rate
          description: 'Basic Payment Scheme - being phased out',
          phaseOut: {
            2021: 1.0,
            2022: 0.95,
            2023: 0.85,
            2024: 0.70,
            2025: 0.50,
            2026: 0.25,
            2027: 0.0
          }
        },
        greeningPayment: {
          rate: 89.84, // £89.84/ha average 2023 rate
          description: 'Greening payment component'
        }
      },

      // Environmental Stewardship Scheme (ESS) - Legacy rates
      ESS: {
        description: 'Environmental Stewardship Scheme - closed to new applications',
        entryLevel: {
          rate: 30, // £30/ha
          points: 30 // 30 points per hectare required
        },
        higherLevel: {
          rate: 60, // £60/ha average
          description: 'Higher Level Stewardship supplement'
        }
      }
    };

    // Regional multipliers for land values
    this.regionalMultipliers = {
      'London': 2.2,
      'South East': 1.8,
      'South West': 1.4,
      'East of England': 1.5,
      'West Midlands': 1.1,
      'East Midlands': 1.0,
      'Yorkshire and The Humber': 0.9,
      'North West': 0.85,
      'North East': 0.75,
      'Wales': 0.9,
      'Scotland': 0.7,
      'Northern Ireland': 0.6
    };
  }

  /**
   * Get payment rates for a specific scheme
   */
  getSchemeRates(planType) {
    const scheme = this.getSchemeFromPlanType(planType);
    return this.paymentRates[scheme] || {};
  }

  /**
   * Map plan types to payment schemes
   */
  getSchemeFromPlanType(planType) {
    const schemeMap = {
      'SFI2022': 'SFI',
      'SFI2023': 'SFI', 
      'SFI2024': 'SFI',
      'CSS': 'CSS',
      'CSS_2025': 'CSS',
      'BPS': 'BPS',
      'ESS': 'ESS'
    };
    return schemeMap[planType] || 'UNKNOWN';
  }

  /**
   * Calculate potential annual payment for a plan
   */
  calculateAnnualPayment(planType, areaHectares, actions = [], region = null) {
    const scheme = this.getSchemeFromPlanType(planType);
    const rates = this.paymentRates[scheme];
    let totalPayment = 0;
    const breakdown = {
      basePayment: 0,
      actionPayments: [],
      managementPayment: 0,
      total: 0,
      currency: 'GBP'
    };

    if (!rates) {
      return { ...breakdown, error: 'Unknown scheme type' };
    }

    // Calculate based on scheme type
    switch (scheme) {
      case 'SFI':
        // Management payment (first 50ha)
        const eligibleArea = Math.min(areaHectares, rates.managementPayment.maxArea);
        breakdown.managementPayment = eligibleArea * rates.managementPayment.rate;
        totalPayment += breakdown.managementPayment;

        // Action payments
        actions.forEach(action => {
          const actionRate = rates.premiumActions[action.code] || rates.standardActions[action.code];
          if (actionRate && action.area) {
            const payment = action.area * actionRate.rate;
            breakdown.actionPayments.push({
              code: action.code,
              name: actionRate.name,
              area: action.area,
              rate: actionRate.rate,
              payment: payment
            });
            totalPayment += payment;
          }
        });
        break;

      case 'CSS':
        // CSS payments based on selected options
        actions.forEach(action => {
          const actionRate = rates.midTier[action.code] || rates.higherTier[action.code];
          if (actionRate && action.area) {
            const payment = action.area * actionRate.rate;
            breakdown.actionPayments.push({
              code: action.code,
              name: actionRate.name,
              area: action.area,
              rate: actionRate.rate,
              payment: payment
            });
            totalPayment += payment;
          }
        });
        break;

      case 'BPS':
        // BPS base payment with phase-out
        const currentYear = new Date().getFullYear();
        const phaseOutMultiplier = rates.baseRate.phaseOut[currentYear] || 0;
        breakdown.basePayment = areaHectares * rates.baseRate.rate * phaseOutMultiplier;
        
        // Greening payment
        const greeningPayment = areaHectares * rates.greeningPayment.rate * phaseOutMultiplier;
        breakdown.actionPayments.push({
          code: 'GREENING',
          name: 'Greening Payment',
          area: areaHectares,
          rate: rates.greeningPayment.rate * phaseOutMultiplier,
          payment: greeningPayment
        });
        
        totalPayment = breakdown.basePayment + greeningPayment;
        break;

      case 'ESS':
        // ESS entry level payment
        breakdown.basePayment = areaHectares * rates.entryLevel.rate;
        totalPayment = breakdown.basePayment;
        break;
    }

    // Apply regional multiplier if specified
    if (region && this.regionalMultipliers[region]) {
      totalPayment *= this.regionalMultipliers[region];
      breakdown.regionalMultiplier = this.regionalMultipliers[region];
      breakdown.region = region;
    }

    breakdown.total = totalPayment;
    return breakdown;
  }

  /**
   * Get available actions for a scheme
   */
  getAvailableActions(planType) {
    const scheme = this.getSchemeFromPlanType(planType);
    const rates = this.paymentRates[scheme];
    
    if (!rates) return [];

    const actions = [];

    // Combine all action types
    if (rates.premiumActions) {
      Object.entries(rates.premiumActions).forEach(([code, action]) => {
        actions.push({
          code,
          ...action,
          category: 'Premium Actions',
          priority: 'High'
        });
      });
    }

    if (rates.standardActions) {
      Object.entries(rates.standardActions).forEach(([code, action]) => {
        actions.push({
          code,
          ...action,
          category: 'Standard Actions',
          priority: 'Medium'
        });
      });
    }

    if (rates.midTier) {
      Object.entries(rates.midTier).forEach(([code, action]) => {
        actions.push({
          code,
          ...action,
          category: 'Mid Tier',
          priority: 'Medium'
        });
      });
    }

    if (rates.higherTier) {
      Object.entries(rates.higherTier).forEach(([code, action]) => {
        actions.push({
          code,
          ...action,
          category: 'Higher Tier',
          priority: 'High'
        });
      });
    }

    return actions.sort((a, b) => b.rate - a.rate); // Sort by rate descending
  }

  /**
   * Format currency values
   */
  formatCurrency(value, showPounds = true) {
    if (value >= 1000000) {
      return `${showPounds ? '£' : ''}${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `${showPounds ? '£' : ''}${(value / 1000).toFixed(1)}k`;
    } else {
      return `${showPounds ? '£' : ''}${Math.round(value).toLocaleString()}`;
    }
  }

  /**
   * Get scheme information and description
   */
  getSchemeInfo(planType) {
    const scheme = this.getSchemeFromPlanType(planType);
    
    const schemeInfo = {
      'SFI': {
        fullName: 'Sustainable Farming Incentive',
        description: 'Payment for sustainable farming practices that benefit the environment',
        status: 'Active',
        applicationStatus: 'Limited reopening for eligible applicants',
        keyFeatures: [
          'Management payment for first 50 hectares',
          'Premium rates for high-priority environmental actions',
          'Focus on water quality and biodiversity',
          'Flexible 3-year agreements'
        ]
      },
      'CSS': {
        fullName: 'Countryside Stewardship Scheme',
        description: 'Environmental land management scheme with Mid Tier and Higher Tier options',
        status: 'Active',
        applicationStatus: 'Open for applications',
        keyFeatures: [
          'Mid Tier: 5-year agreements for wildlife habitats',
          'Higher Tier: tailored agreements for complex environmental outcomes',
          '10% average payment increase in 2024',
          'Capital grants available for infrastructure'
        ]
      },
      'BPS': {
        fullName: 'Basic Payment Scheme',
        description: 'Area-based payment scheme being phased out by 2027',
        status: 'Phasing out',
        applicationStatus: 'Closed to new applications',
        keyFeatures: [
          'Payment reduction each year until 2027',
          'Based on eligible hectares and entitlements',
          'Includes greening payment requirements',
          'Being replaced by SFI and CSS'
        ]
      },
      'ESS': {
        fullName: 'Environmental Stewardship Scheme',
        description: 'Legacy environmental scheme closed to new applications',
        status: 'Legacy',
        applicationStatus: 'Closed',
        keyFeatures: [
          'Entry Level and Higher Level options',
          'Point-based system for environmental management',
          'Existing agreements continue until expiry',
          'Being replaced by CSS and SFI'
        ]
      }
    };

    return schemeInfo[scheme] || {
      fullName: 'Unknown Scheme',
      description: 'Scheme information not available',
      status: 'Unknown',
      keyFeatures: []
    };
  }

  /**
   * Calculate return on investment for scheme participation
   */
  calculateROI(planType, areaHectares, actions = [], implementationCosts = 0) {
    const annualPayment = this.calculateAnnualPayment(planType, areaHectares, actions);
    const scheme = this.getSchemeFromPlanType(planType);
    
    // Typical agreement lengths
    const agreementLengths = {
      'SFI': 3,
      'CSS': 5,
      'BPS': 1,
      'ESS': 5
    };

    const agreementLength = agreementLengths[scheme] || 5;
    const totalPayments = annualPayment.total * agreementLength;
    const netReturn = totalPayments - implementationCosts;
    const roi = implementationCosts > 0 ? (netReturn / implementationCosts) * 100 : 0;

    return {
      annualPayment: annualPayment.total,
      agreementLength,
      totalPayments,
      implementationCosts,
      netReturn,
      roi,
      formattedAnnualPayment: this.formatCurrency(annualPayment.total),
      formattedTotalPayments: this.formatCurrency(totalPayments),
      formattedNetReturn: this.formatCurrency(netReturn)
    };
  }
}

export default new PaymentRatesService();