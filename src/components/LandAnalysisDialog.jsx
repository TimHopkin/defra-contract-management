import React, { useState, useEffect } from 'react';
import landAnalysisService from '../lib/landAnalysisService';
import geometryService from '../lib/geometryService';

const LandAnalysisDialog = ({ 
  isOpen, 
  onClose, 
  onBack,
  mapName, 
  selectedPlans,
  allPlans,
  planFeatures,
  epcData
}) => {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('summary');

  // Get plan objects from IDs
  const plans = selectedPlans.map(planId => 
    allPlans.find(plan => plan.id === planId)
  ).filter(Boolean);

  useEffect(() => {
    if (isOpen && plans.length > 0) {
      performAnalysis();
    }
  }, [isOpen, selectedPlans]);

  const performAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Starting land analysis for:', mapName, 'with plans:', selectedPlans);
      console.log('Plans data:', plans);
      console.log('Plan features data:', planFeatures);
      
      // Check if we have the necessary data
      if (!plans || plans.length === 0) {
        throw new Error('No plans selected for analysis');
      }

      if (!planFeatures || Object.keys(planFeatures).length === 0) {
        setError('No plan features loaded. Please load plan features first by clicking "View Features" on individual plans or using the map view to automatically load features.');
        setLoading(false);
        return;
      }

      // Debug: Show which plans have features loaded
      const planFeaturesStatus = plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        hasFeatures: !!planFeatures[plan.id]?.features?.length,
        featureCount: planFeatures[plan.id]?.features?.length || 0
      }));
      console.log('Plan features status:', planFeaturesStatus);

      // Check if selected plans have features loaded
      const plansWithFeatures = plans.filter(plan => planFeatures[plan.id]?.features?.length > 0);
      if (plansWithFeatures.length === 0) {
        setError(`None of the selected plans have features loaded. Please load features first by clicking "View Features" on the plans: ${plans.map(p => p.name).join(', ')}`);
        setLoading(false);
        return;
      }

      if (plansWithFeatures.length < plans.length) {
        console.warn(`Only ${plansWithFeatures.length} of ${plans.length} plans have features loaded`);
      }
      
      const analysis = await landAnalysisService.analyzeHolding(
        mapName,
        plansWithFeatures, // Use only plans that have features
        planFeatures,
        epcData
      );
      
      setAnalysisData(analysis);
    } catch (err) {
      console.error('Land analysis error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `£${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `£${(value / 1000).toFixed(0)}k`;
    } else {
      return `£${Math.round(value).toLocaleString()}`;
    }
  };

  const formatArea = (area, unit = 'hectares') => {
    return geometryService.formatArea(area, unit);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="text-white hover:text-gray-300 transition-colors duration-200 flex items-center space-x-2"
                  title="Back to map plans"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-sm font-medium">Back to Plans</span>
                </button>
              )}
              <div>
                <h2 className="text-2xl font-bold">Land Analysis Report</h2>
                <p className="text-green-100 mt-1">{mapName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-green-100">Plans Analyzed</p>
                <p className="text-xl font-semibold">{plans.length}</p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-300 transition-colors duration-200"
                title="Close analysis"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Quick Stats */}
          {analysisData && !loading && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                <p className="text-sm text-green-100">Total Area</p>
                <p className="text-lg font-semibold">{analysisData.executive.totalArea.formatted}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                <p className="text-sm text-green-100">Features</p>
                <p className="text-lg font-semibold">{analysisData.executive.totalFeatures}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                <p className="text-sm text-green-100">Total Value</p>
                <p className="text-lg font-semibold">{analysisData.executive.totalValue.formatted}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                <p className="text-sm text-green-100">Value/Hectare</p>
                <p className="text-lg font-semibold">{formatCurrency(analysisData.executive.averageValuePerHectare)}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Navigation Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <nav className="space-y-2">
              {[
                { id: 'summary', label: 'Executive Summary', icon: '📊' },
                { id: 'landuse', label: 'Land Use Analysis', icon: '🌾' },
                { id: 'buildings', label: 'Building Portfolio', icon: '🏢' },
                { id: 'valuation', label: 'Valuation Details', icon: '💰' },
                { id: 'plans', label: 'Plan Breakdown', icon: '📋' },
                { id: 'technical', label: 'Technical Details', icon: '⚙️' }
              ].map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2 ${
                    activeSection === section.id 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{section.icon}</span>
                  <span className="text-sm">{section.label}</span>
                </button>
              ))}
            </nav>

            {/* Refresh Analysis Button */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={performAnalysis}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className="text-sm">Analyzing...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-sm">Refresh</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                  <h3 className="text-lg font-semibold text-gray-900 mt-4">Analyzing Land Data</h3>
                  <p className="text-gray-600 mt-2">Processing OSMasterMap features and calculating valuations...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Analysis Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {analysisData && !loading && (
              <div className="space-y-6">
                {/* Executive Summary */}
                {activeSection === 'summary' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Executive Summary</h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Key Metrics</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Area:</span>
                            <span className="font-medium">{analysisData.executive.totalArea.formatted}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Features:</span>
                            <span className="font-medium">{analysisData.executive.totalFeatures.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Land Value:</span>
                            <span className="font-medium">{formatCurrency(analysisData.executive.totalValue.land)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Building Value:</span>
                            <span className="font-medium">{formatCurrency(analysisData.executive.totalValue.buildings)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-3">
                            <span className="font-semibold">Total Value:</span>
                            <span className="font-bold text-green-600">{analysisData.executive.totalValue.formatted}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Key Insights</h4>
                        <ul className="space-y-2">
                          {analysisData.executive.keyInsights.map((insight, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-sm text-gray-700">{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Land Use Analysis */}
                {activeSection === 'landuse' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Land Use Analysis</h3>
                    
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Land Use Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Features</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value/Ha</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {analysisData.landUseBreakdown.map((landUse, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {landUse.displayName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {landUse.hectares.toFixed(2)} ha
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {landUse.percentage}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {landUse.features}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {landUse.formattedValue}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {formatCurrency(landUse.valuePerHa)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Building Portfolio */}
                {activeSection === 'buildings' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Building Portfolio Analysis</h3>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h4 className="font-semibold text-gray-900 mb-3">Building Summary</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Buildings:</span>
                              <span className="font-medium">{analysisData.buildingPortfolio.summary.totalBuildings}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Building Area:</span>
                              <span className="font-medium">{formatArea(analysisData.buildingPortfolio.summary.totalBuildingArea, 'sqm')}</span>
                            </div>
                            {analysisData.buildingPortfolio.summary.energyPerformance && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Average Energy Rating:</span>
                                  <span className="font-medium">{analysisData.buildingPortfolio.summary.energyPerformance.averageEfficiency}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Total CO2 Emissions:</span>
                                  <span className="font-medium">{analysisData.buildingPortfolio.summary.energyPerformance.totalCO2Emissions} kg/year</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h4 className="font-semibold text-gray-900 mb-3">Building Types</h4>
                          <div className="space-y-3">
                            {Object.entries(analysisData.buildingPortfolio.summary.buildingTypes || {}).map(([type, data]) => (
                              <div key={type} className="flex justify-between">
                                <span className="text-gray-600">{geometryService.getDisplayName(type)}:</span>
                                <span className="font-medium">{data.count} buildings</span>
                              </div>
                            ))}
                            {Object.keys(analysisData.buildingPortfolio.summary.buildingTypes || {}).length === 0 && (
                              <p className="text-sm text-gray-500">No building types detected</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Detailed Building List */}
                      {analysisData.buildingPortfolio.summary.buildingDetails && analysisData.buildingPortfolio.summary.buildingDetails.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <div className="px-6 py-4 border-b border-gray-200">
                            <h4 className="font-semibold text-gray-900">Individual Building Details</h4>
                            <p className="text-sm text-gray-600 mt-1">OSMasterMap building features with classification</p>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature ID</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classification</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Theme</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descriptive Group</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descriptive Term</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {analysisData.buildingPortfolio.summary.buildingDetails.slice(0, 20).map((building, index) => (
                                  <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                      {building.fid}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        building.type === 'residential_building' ? 'bg-blue-100 text-blue-800' :
                                        building.type === 'commercial_building' ? 'bg-green-100 text-green-800' :
                                        building.type === 'agricultural_building' ? 'bg-yellow-100 text-yellow-800' :
                                        building.type === 'building' ? 'bg-gray-100 text-gray-800' :
                                        'bg-purple-100 text-purple-800'
                                      }`}>
                                        {geometryService.getDisplayName(building.type)}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {building.areaFormatted}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                      {building.theme}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                      {building.descriptiveGroup}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                      {building.descriptiveTerm || 'N/A'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {analysisData.buildingPortfolio.summary.buildingDetails.length > 20 && (
                              <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600">
                                Showing first 20 of {analysisData.buildingPortfolio.summary.buildingDetails.length} buildings
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Valuation Details */}
                {activeSection === 'valuation' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Comprehensive Valuation System</h3>
                    
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex">
                          <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">{analysisData.valuationDetails.methodology}</h3>
                            <p className="text-sm text-blue-700 mt-1">
                              {analysisData.valuationDetails.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Data Elements */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">ACTIVE</span>
                            Current Data Sources
                          </h4>
                          <ul className="space-y-2">
                            {analysisData.valuationDetails.dataElements.coreData.map((item, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <svg className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm text-gray-700">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">PLANNED</span>
                            Future Integrations
                          </h4>
                          <ul className="space-y-2 max-h-48 overflow-y-auto">
                            {analysisData.valuationDetails.dataElements.futureIntegrations.map((item, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <svg className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <span className="text-sm text-gray-600">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Valuation Algorithms */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Valuation Algorithms & Formulas</h4>
                        
                        <div className="space-y-6">
                          {Object.entries(analysisData.valuationDetails.valuationAlgorithms).map(([algorithmName, algorithm]) => (
                            <div key={algorithmName} className="border-l-4 border-indigo-400 pl-4">
                              <h5 className="font-medium text-gray-900 capitalize mb-2">{algorithmName.replace(/([A-Z])/g, ' $1').trim()}</h5>
                              
                              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                <p className="text-sm font-mono text-gray-800">{algorithm.formula}</p>
                              </div>

                              {algorithm.components && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {Object.entries(algorithm.components).map(([component, description]) => (
                                    <div key={component} className="text-sm">
                                      <span className="font-medium text-gray-700">{component}:</span>
                                      <span className="text-gray-600 ml-1">{description}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {algorithm.weighting && (
                                <p className="text-sm text-gray-600 mt-2">
                                  <span className="font-medium">Weighting:</span> {algorithm.weighting}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Current Implementation Status */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">CURRENT</span>
                            Implementation Status
                          </h4>
                          <p className="text-sm text-gray-600 mb-3">{analysisData.valuationDetails.currentImplementation.phase1}</p>
                          
                          <h5 className="font-medium text-gray-900 mb-2">Current Limitations:</h5>
                          <ul className="space-y-1">
                            {analysisData.valuationDetails.currentImplementation.limitations.map((limitation, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-sm text-gray-600">{limitation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h4 className="font-semibold text-gray-900 mb-3">Development Roadmap</h4>
                          <div className="space-y-3">
                            {Object.entries(analysisData.valuationDetails.futureEnhancements).map(([phase, description]) => (
                              <div key={phase} className="flex items-start space-x-3">
                                <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded uppercase">
                                  {phase}
                                </span>
                                <span className="text-sm text-gray-700 mt-0.5">{description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Quality Indicators */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Quality Assurance Framework</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(analysisData.valuationDetails.qualityIndicators).map(([indicator, description]) => (
                            <div key={indicator} className="text-sm">
                              <h5 className="font-medium text-gray-700 capitalize mb-1">{indicator.replace(/([A-Z])/g, ' $1').trim()}</h5>
                              <p className="text-gray-600">{description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Confidence Level */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Current Analysis Confidence</h4>
                        <div className="flex items-center space-x-4">
                          <div className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${
                            analysisData.valuationDetails.confidenceLevel === 'High' ? 'bg-green-100 text-green-800' :
                            analysisData.valuationDetails.confidenceLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {analysisData.valuationDetails.confidenceLevel} Confidence
                          </div>
                          <p className="text-sm text-gray-600">
                            Based on feature classification accuracy and data completeness
                          </p>
                        </div>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex">
                          <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-amber-800">Professional Disclaimer</h3>
                            <p className="text-sm text-amber-700 mt-1">
                              This system demonstrates algorithmic land valuation methodology. Current valuations are indicative only. 
                              Full implementation with live market data, planning intelligence, and professional oversight will provide 
                              RICS-compliant valuations suitable for commercial use.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Plan Breakdown */}
                {activeSection === 'plans' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Plan Breakdown</h3>
                    
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Features</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {analysisData.planBreakdown.map((plan, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {plan.planName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                  {plan.planType}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {plan.hectares.toFixed(2)} ha
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {plan.features}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Technical Details */}
                {activeSection === 'technical' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Technical Details</h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Processing Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Processing Time:</span>
                            <span className="font-mono">{analysisData.metadata.processingTime}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Geometry Service:</span>
                            <span className="font-mono text-xs">{analysisData.metadata.geometryService}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Coordinate System:</span>
                            <span className="font-mono text-xs">{analysisData.metadata.coordinateSystem}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Analysis Methods</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-600">Area Calculation:</span>
                            <p className="text-xs text-gray-500">{analysisData.metadata.areaCalculationMethod}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Deduplication:</span>
                            <p className="text-xs text-gray-500">{analysisData.metadata.deduplicationMethod}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {analysisData && `Generated ${new Date(analysisData.valuationDetails.lastUpdated).toLocaleString()}`}
          </div>
          <div className="flex space-x-3">
            {onBack && (
              <button
                onClick={onBack}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Plans</span>
              </button>
            )}
            <button
              onClick={() => {
                // TODO: Implement export functionality
                console.log('Export analysis data:', analysisData);
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              disabled={!analysisData}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export Report</span>
            </button>
            <button
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandAnalysisDialog;