import React, { useState, useEffect } from 'react';
import mapProfileService from '../lib/mapProfileService';
import NatureDashboard from './NatureReporting/NatureDashboard';
import LandAnalysisDialog from './LandAnalysisDialog';
import PlanDetailModal from './PlanDetailModal';
import DataLayersDashboard from './DataLayersDashboard';

const MapDashboard = ({ landAppApiKey, natureReportingApiKey, onBack }) => {
  const [mapInput, setMapInput] = useState('');
  const [extractedMapId, setExtractedMapId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ step: '', message: '', progress: 0 });
  const [currentView, setCurrentView] = useState('overview');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showLandAnalysis, setShowLandAnalysis] = useState(false);
  const [showPlanDetail, setShowPlanDetail] = useState(false);

  const handleMapIdSubmit = async (e) => {
    e.preventDefault();
    
    // Extract Map ID from input (could be URL or direct ID)
    const extraction = mapProfileService.extractMapIdFromInput(mapInput);
    if (!extraction.success) {
      setError(extraction.error);
      return;
    }

    if (!landAppApiKey) {
      setError('Land App API Key is required');
      return;
    }

    setError(null);
    setLoading(true);
    setProfile(null);
    setExtractedMapId(extraction);
    setProgress({ step: '', message: 'Starting analysis...', progress: 0 });

    try {
      const mapProfile = await mapProfileService.getComprehensiveMapProfile(
        extraction.mapId,
        landAppApiKey,
        natureReportingApiKey,
        setProgress
      );

      console.log('🏗️ === MAP PROFILE LOADED ===');
      console.log('📊 Map Profile Structure:', {
        hasProfile: !!mapProfile,
        keys: mapProfile ? Object.keys(mapProfile) : [],
        plansCount: mapProfile?.plans?.length || 0,
        planFeaturesCount: mapProfile?.planFeatures?.length || 0,
        planFeaturesStructure: mapProfile?.planFeatures ? mapProfile.planFeatures.map((pf, index) => ({
          index,
          planId: pf.planId,
          featuresCount: pf.features?.length || 0,
          keys: Object.keys(pf)
        })) : 'No plan features',
        firstPlan: mapProfile?.plans?.[0] ? {
          id: mapProfile.plans[0].id,
          name: mapProfile.plans[0].name,
          keys: Object.keys(mapProfile.plans[0])
        } : 'No plans'
      });
      console.log('🏗️ === MAP PROFILE LOADED END ===');

      setProfile(mapProfile);
      setCurrentView('overview');
    } catch (error) {
      console.error('Error fetching map profile:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanClick = (plan) => {
    console.log('🎯 === PLAN CLICK DEBUG START ===');
    console.log('📋 Plan clicked:', {
      id: plan.id,
      name: plan.name,
      planType: plan.planType,
      status: plan.status,
      allKeys: Object.keys(plan)
    });
    
    console.log('🗃️ Available profile data:', {
      hasProfile: !!profile,
      profileKeys: profile ? Object.keys(profile) : [],
      planFeaturesExists: !!profile?.planFeatures,
      planFeaturesCount: profile?.planFeatures?.length || 0,
      planFeaturesType: Array.isArray(profile?.planFeatures) ? 'array' : typeof profile?.planFeatures
    });
    
    if (profile?.planFeatures && profile.planFeatures.length > 0) {
      console.log('📊 Plan Features Structure Analysis:', {
        totalPlanFeatures: profile.planFeatures.length,
        firstFewStructures: profile.planFeatures.slice(0, 3).map((pf, index) => ({
          index,
          planId: pf.planId,
          featuresCount: pf.features?.length || 0,
          allKeys: Object.keys(pf),
          sampleFeature: pf.features?.[0] ? {
            hasArea: !!pf.features[0].area,
            hasProperties: !!pf.features[0].properties,
            keys: Object.keys(pf.features[0])
          } : 'No features'
        })),
        allPlanIds: profile.planFeatures.map(pf => pf.planId)
      });
    }
    
    console.log('🔍 Searching for plan features with ID:', plan.id);
    
    // Find existing features for this plan from the map profile data
    const planFeatures = profile?.planFeatures?.find(pf => pf.planId === plan.id);
    
    console.log('🎯 Plan Features Search Result:', {
      found: !!planFeatures,
      planFeaturesData: planFeatures ? {
        planId: planFeatures.planId,
        featuresCount: planFeatures.features?.length || 0,
        firstFeatureKeys: planFeatures.features?.[0] ? Object.keys(planFeatures.features[0]) : 'No features',
        sampleFeatureProperties: planFeatures.features?.[0]?.properties,
        sampleFeatureArea: planFeatures.features?.[0]?.area
      } : null,
      searchedId: plan.id,
      availableIds: profile?.planFeatures?.map(pf => pf.planId) || []
    });
    
    const enhancedPlan = {
      ...plan,
      existingFeatures: planFeatures?.features || [],
      hasExistingFeatures: planFeatures?.features?.length > 0 || false,
      mapProfile: profile // Pass the entire profile for additional context
    };
    
    console.log('✨ Enhanced Plan Final Data:', {
      originalPlanId: plan.id,
      planName: plan.name,
      planType: plan.planType,
      existingFeaturesCount: enhancedPlan.existingFeatures.length,
      hasExistingFeatures: enhancedPlan.hasExistingFeatures,
      firstExistingFeature: enhancedPlan.existingFeatures[0] ? {
        hasArea: !!enhancedPlan.existingFeatures[0].area,
        area: enhancedPlan.existingFeatures[0].area,
        hasProperties: !!enhancedPlan.existingFeatures[0].properties,
        keys: Object.keys(enhancedPlan.existingFeatures[0])
      } : 'No features found'
    });
    
    console.log('🎯 === PLAN CLICK DEBUG END ===');
    
    setSelectedPlan(enhancedPlan);
    setShowPlanDetail(true);
  };

  const handleClosePlanDetail = () => {
    setShowPlanDetail(false);
    setSelectedPlan(null);
  };

  const QuickStatsCard = ({ title, value, subtitle, color, icon, onClick }) => (
    <div 
      className={`bg-white rounded-xl shadow-sm p-6 border border-gray-200 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  const PlansOverview = ({ plans, onPlanClick }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Plans ({plans.length})</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {plans.map((plan, index) => (
          <div
            key={`overview-plan-${plan.id}-${index}`}
            onClick={() => onPlanClick(plan)}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{plan.name}</h4>
              <p className="text-sm text-gray-600">
                Plan Type: {plan.planType || 'Unknown'} | 
                Status: {plan.status || 'Unknown'}
              </p>
              {plan.mapName && (
                <p className="text-sm text-gray-500">Map: {plan.mapName}</p>
              )}
            </div>
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );

  const ProgressDisplay = ({ progress }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Map Profile</h3>
        <p className="text-gray-600 mb-4">{progress.message}</p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">{progress.progress}% complete</p>
      </div>
    </div>
  );

  const ViewToggle = () => {
    const views = [
      { id: 'overview', label: 'Overview', icon: '📊' },
      ...(profile?.summary.hasNatureReporting ? [{ id: 'nature', label: 'Nature Reporting', icon: '🌿' }] : []),
      ...(profile?.summary.hasLandAnalysis ? [{ id: 'analysis', label: 'Land Analysis', icon: '📈' }] : []),
      { id: 'data-layers', label: 'Data Layers', icon: '📋' }
    ];

    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg p-1 shadow-sm">
        {views.map(view => (
          <button
            key={view.id}
            onClick={() => setCurrentView(view.id)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-all duration-200 ${
              currentView === view.id
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <span>{view.icon}</span>
            <span className="hidden sm:inline">{view.label}</span>
          </button>
        ))}
      </div>
    );
  };

  const DataAvailabilityIndicator = ({ profile }) => {
    const indicators = [
      { key: 'plans', label: 'Plans', available: profile.summary.totalPlans > 0 },
      { key: 'features', label: 'Features', available: profile.planFeatures.length > 0 },
      { key: 'nature', label: 'Nature Reporting', available: profile.summary.hasNatureReporting },
      { key: 'analysis', label: 'Land Analysis', available: profile.summary.hasLandAnalysis },
      { key: 'epc', label: 'Energy Data', available: profile.summary.hasEpcData }
    ];

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Availability</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {indicators.map(indicator => (
            <div key={indicator.key} className="text-center">
              <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                indicator.available ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {indicator.available ? '✓' : '✗'}
              </div>
              <p className="text-sm text-gray-600">{indicator.label}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <button
              onClick={onBack}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div>
          <ProgressDisplay progress={progress} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={onBack}
                  className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Map Dashboard</h1>
                  <p className="text-gray-600">Comprehensive map profile and analysis</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {profile && <ViewToggle />}
                {!profile && (
                  <button
                    onClick={() => setCurrentView('data-layers')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                      currentView === 'data-layers'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    <span>📋</span>
                    <span>Data Layers</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Map ID Input Form */}
        {!profile && currentView !== 'data-layers' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Enter Map ID or URL</h2>
              <p className="text-gray-600 mb-6">
                Paste a Map ID or full Land App URL to get a complete profile with all available data, plans, and analysis.
              </p>
              
              <form onSubmit={handleMapIdSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={mapInput}
                    onChange={(e) => setMapInput(e.target.value)}
                    placeholder="e.g., 5e99633806bf1a001983c881 or https://go.thelandapp.com/map/5e99633806bf1a001983c881"
                    className="w-full px-4 py-3 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                  />
                </div>
                
                <div className="text-sm text-gray-500 space-y-1">
                  <p><strong>Supported formats:</strong></p>
                  <p>• Direct ID: <code className="bg-gray-100 px-2 py-1 rounded">5e99633806bf1a001983c881</code></p>
                  <p>• Full URL: <code className="bg-gray-100 px-2 py-1 rounded">https://go.thelandapp.com/map/5e99633806bf1a001983c881</code></p>
                </div>
                
                <button
                  type="submit"
                  disabled={!mapInput.trim() || !landAppApiKey}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
                >
                  Analyze Map
                </button>
              </form>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600">{error}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Standalone Data Layers View */}
        {!profile && currentView === 'data-layers' && (
          <DataLayersDashboard
            onBack={() => setCurrentView('overview')}
          />
        )}

        {/* Map Profile Display */}
        {profile && (
          <>
            {/* Map Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Map: {profile.mapId}</h2>
                  {extractedMapId && extractedMapId.extractedFrom !== 'direct' && (
                    <p className="text-sm text-blue-600 mb-1">
                      Extracted from {extractedMapId.extractedFrom}: <code className="bg-blue-50 px-2 py-1 rounded text-xs">{extractedMapId.originalInput}</code>
                    </p>
                  )}
                  {profile.plans[0]?.mapName && (
                    <p className="text-gray-600">Name: {profile.plans[0].mapName}</p>
                  )}
                  <p className="text-sm text-gray-500">Last updated: {new Date(profile.timestamp).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => {
                    setProfile(null);
                    setMapInput('');
                    setExtractedMapId(null);
                    setCurrentView('overview');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  New Search
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            {currentView === 'overview' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <QuickStatsCard
                    title="Total Plans"
                    value={profile.summary.totalPlans}
                    subtitle="Associated plans"
                    color="bg-blue-100"
                    icon={
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    }
                    onClick={() => setCurrentView('plans')}
                  />

                  <QuickStatsCard
                    title="Total Area"
                    value={mapProfileService.formatArea(profile.summary.totalArea)}
                    subtitle="Combined area"
                    color="bg-green-100"
                    icon={
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                      </svg>
                    }
                  />

                  <QuickStatsCard
                    title="Estimated Value"
                    value={mapProfileService.formatCurrency(profile.summary.estimatedValue)}
                    subtitle={profile.summary.hasLandAnalysis ? "Land analysis" : "Not available"}
                    color="bg-yellow-100"
                    icon={
                      <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    }
                    onClick={profile.summary.hasLandAnalysis ? () => setCurrentView('analysis') : undefined}
                  />

                  <QuickStatsCard
                    title="Nature Score"
                    value={profile.natureReporting?.keyMetrics?.biodiversity?.bngUnits?.toFixed(1) || 'N/A'}
                    subtitle={profile.summary.hasNatureReporting ? "BNG Units" : "Not available"}
                    color="bg-purple-100"
                    icon={
                      <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    }
                    onClick={profile.summary.hasNatureReporting ? () => setCurrentView('nature') : undefined}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <PlansOverview plans={profile.plans} onPlanClick={handlePlanClick} />
                  <DataAvailabilityIndicator profile={profile} />
                </div>
              </>
            )}


            {/* Nature Reporting View */}
            {currentView === 'nature' && profile.summary.hasNatureReporting && (
              <NatureDashboard
                apiKey={natureReportingApiKey}
                selectedMap={profile.natureReporting.mapName}
                onBack={() => setCurrentView('overview')}
                loading={false}
                error={null}
              />
            )}

            {/* Land Analysis View */}
            {currentView === 'analysis' && profile.summary.hasLandAnalysis && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Land Analysis Report</h3>
                  <button
                    onClick={() => setShowLandAnalysis(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    View Full Report
                  </button>
                </div>
                
                {profile.landAnalysis?.executive && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <h4 className="text-lg font-semibold text-gray-900">Total Value</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {profile.landAnalysis.executive.totalValue.formatted}
                      </p>
                    </div>
                    <div className="text-center">
                      <h4 className="text-lg font-semibold text-gray-900">Total Area</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {profile.landAnalysis.executive.totalArea.formatted}
                      </p>
                    </div>
                    <div className="text-center">
                      <h4 className="text-lg font-semibold text-gray-900">Features</h4>
                      <p className="text-2xl font-bold text-purple-600">
                        {profile.landAnalysis.executive.totalFeatures}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Data Layers View */}
            {currentView === 'data-layers' && (
              <DataLayersDashboard
                onBack={() => setCurrentView('overview')}
              />
            )}

            {/* Warnings Display */}
            {profile.warnings && profile.warnings.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
                <h4 className="font-semibold text-blue-800 mb-2">Information:</h4>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  {profile.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Errors Display */}
            {profile.errors.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-8">
                <h4 className="font-semibold text-yellow-800 mb-2">Issues Encountered:</h4>
                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                  {profile.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {/* Land Analysis Modal */}
      {showLandAnalysis && profile?.landAnalysis && (
        <LandAnalysisDialog
          analysis={profile.landAnalysis}
          onClose={() => setShowLandAnalysis(false)}
        />
      )}

      {/* Plan Detail Modal */}
      {showPlanDetail && selectedPlan && (
        <PlanDetailModal
          plan={selectedPlan}
          apiKey={landAppApiKey}
          onClose={handleClosePlanDetail}
        />
      )}
    </div>
  );
};

export default MapDashboard;