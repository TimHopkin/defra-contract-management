import React, { useState, useEffect } from 'react';
import planDetailService from '../lib/planDetailService';
import paymentRatesService from '../lib/paymentRatesService';

const PlanDetailModal = ({ plan, apiKey, onClose }) => {
  const [planDetails, setPlanDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (plan && apiKey) {
      loadPlanDetails();
    }
  }, [plan, apiKey]);

  const loadPlanDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const details = await planDetailService.getComprehensivePlanDetails(plan, apiKey);
      setPlanDetails(details);
    } catch (err) {
      console.error('Error loading plan details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'financial', label: 'Financial', icon: '💰' },
    { id: 'map', label: 'Map View', icon: '🗺️' },
    { id: 'features', label: 'Features', icon: '📋' },
    { id: 'recommendations', label: 'Actions', icon: '🎯' }
  ];

  if (loading || !planDetails || !planDetails.plan || !planDetails.geometry || !planDetails.financial) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Plan Details</h3>
          <p className="text-gray-600">Analyzing {plan?.name}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Plan</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-3">
            <button
              onClick={loadPlanDetails}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition duration-300"
            >
              Try Again
            </button>
            <button
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-full max-h-[95vh] mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200" style={{ backgroundColor: planDetails.plan.colorScheme.background }}>
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{planDetails.plan.name}</h2>
              <div className="flex items-center space-x-3 mt-1">
                <span 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: planDetails.plan.colorScheme.primary }}
                >
                  {planDetails.plan.planType}
                </span>
                <span 
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    planDetails.plan.statusBadge.color === 'green' ? 'bg-green-100 text-green-800' :
                    planDetails.plan.statusBadge.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                    planDetails.plan.statusBadge.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                    planDetails.plan.statusBadge.color === 'red' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}
                >
                  {planDetails.plan.statusBadge.text}
                </span>
                <span className="text-sm text-gray-600">{planDetails.plan.fullName}</span>
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center space-x-6 text-sm">
            <div className="text-center">
              <div className="font-semibold text-gray-900">{planDetails.geometry.totalAreaFormatted}</div>
              <div className="text-gray-600">Total Area</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">{planDetails.features.total}</div>
              <div className="text-gray-600">Features</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                {planDetails?.financial?.potentialPayment?.total ? 
                  paymentRatesService.formatCurrency(planDetails.financial.potentialPayment.total) : 
                  'N/A'
                }
              </div>
              <div className="text-gray-600">Potential Annual</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-indigo-500 text-indigo-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'overview' && <OverviewTab planDetails={planDetails} />}
          {activeTab === 'financial' && <FinancialTab planDetails={planDetails} />}
          {activeTab === 'map' && <MapTab planDetails={planDetails} />}
          {activeTab === 'features' && <FeaturesTab planDetails={planDetails} />}
          {activeTab === 'recommendations' && <RecommendationsTab planDetails={planDetails} />}
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ planDetails }) => {
  const { plan, geometry, financial, metadata } = planDetails;

  return (
    <div className="p-6 space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Area"
          value={geometry.totalAreaFormatted}
          subtitle={`${geometry.totalAreaAcres.toFixed(1)} acres`}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
            </svg>
          }
          color="bg-blue-100 text-blue-600"
        />
        
        <MetricCard
          title="Features"
          value={planDetails.features.total.toString()}
          subtitle={`${geometry.summary.validFeatures} valid`}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          }
          color="bg-green-100 text-green-600"
        />
        
        <MetricCard
          title="Potential Payment"
          value={paymentRatesService.formatCurrency(financial.potentialPayment.total)}
          subtitle="Annual estimate"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
          color="bg-yellow-100 text-yellow-600"
        />
        
        <MetricCard
          title="Data Quality"
          value={metadata.dataQuality.grade}
          subtitle={`${metadata.dataQuality.score}/100`}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color={`${metadata.dataQuality.grade === 'High' ? 'bg-green-100 text-green-600' : 
                    metadata.dataQuality.grade === 'Medium' ? 'bg-yellow-100 text-yellow-600' : 
                    'bg-red-100 text-red-600'}`}
        />
      </div>

      {/* Scheme Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheme Information</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">{financial.scheme.fullName}</h4>
            <p className="text-gray-600 mb-4">{financial.scheme.description}</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${
                  financial.scheme.status === 'Active' ? 'text-green-600' :
                  financial.scheme.status === 'Phasing out' ? 'text-red-600' :
                  'text-gray-600'
                }`}>{financial.scheme.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Applications:</span>
                <span className="font-medium">{financial.scheme.applicationStatus}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Key Features</h4>
            <ul className="space-y-1">
              {financial.scheme.keyFeatures.map((feature, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-1">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Feature Types Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(planDetails.features.byType).map(([type, data]) => (
            <div key={type} className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900">{type}</h4>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-600">{data.count} features</span>
                <span className="text-sm font-medium">{(data.totalArea / 10000).toFixed(2)} ha</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Financial Tab Component  
const FinancialTab = ({ planDetails }) => {
  const { financial } = planDetails;

  return (
    <div className="p-6 space-y-6">
      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Current Estimate</h3>
          <div className="text-3xl font-bold text-blue-700">
            {paymentRatesService.formatCurrency(financial?.currentPayment?.total || 0)}
          </div>
          <p className="text-blue-600 text-sm mt-1">Annual payment</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Potential Payment</h3>
          <div className="text-3xl font-bold text-green-700">
            {paymentRatesService.formatCurrency(financial?.potentialPayment?.total || 0)}
          </div>
          <p className="text-green-600 text-sm mt-1">With optimization</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">Upscale Potential</h3>
          <div className="text-3xl font-bold text-purple-700">
            {paymentRatesService.formatCurrency(financial?.upscalePotential || 0)}
          </div>
          <p className="text-purple-600 text-sm mt-1">Additional annual income</p>
        </div>
      </div>

      {/* ROI Analysis */}
      {financial.roi && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Return on Investment Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{financial.roi.formattedAnnualPayment}</div>
              <div className="text-sm text-gray-600">Annual Payment</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{financial.roi.agreementLength} years</div>
              <div className="text-sm text-gray-600">Agreement Length</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{financial.roi.formattedTotalPayments}</div>
              <div className="text-sm text-gray-600">Total Payments</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${financial.roi.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {financial.roi.roi.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">ROI</div>
            </div>
          </div>
        </div>
      )}

      {/* Available Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">High-Value Actions Available</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {(financial?.availableActions || []).map((action, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{action.name}</h4>
                <p className="text-sm text-gray-600">{action.code} • {action.category}</p>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">{paymentRatesService.formatCurrency(action.rate)}</div>
                <div className="text-sm text-gray-600">{action.unit}</div>
              </div>
              <div className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                action.priority === 'High' ? 'bg-red-100 text-red-800' :
                action.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {action.priority}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Map Tab Component
const MapTab = ({ planDetails }) => {
  return (
    <div className="p-6 h-full">
      <div className="bg-white rounded-lg border border-gray-200 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Interactive Map</h3>
          <p className="text-gray-600 mb-4">Map view will display plan boundaries and features</p>
          <div className="text-sm text-gray-500">
            Features: {planDetails.features.total} | Area: {planDetails.geometry.totalAreaFormatted}
          </div>
        </div>
      </div>
    </div>
  );
};

// Features Tab Component
const FeaturesTab = ({ planDetails }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredFeatures = planDetails.features.geoJson.features.filter(feature =>
    !searchTerm || 
    feature.properties?.descriptiveGroup?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feature.properties?.descriptiveTerm?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feature.properties?.theme?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search features..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="text-sm text-gray-600">
          {filteredFeatures.length} of {planDetails.features.total} features
        </div>
      </div>

      {/* Features Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Theme</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FID</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFeatures.map((feature, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {feature.properties?.descriptiveTerm || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {feature.properties?.descriptiveGroup || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {feature.properties?.theme || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {feature.properties?.area ? `${(feature.properties.area / 10000).toFixed(3)} ha` : 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-400">
                    {feature.properties?.fid || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Recommendations Tab Component
const RecommendationsTab = ({ planDetails }) => {
  return (
    <div className="p-6 space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Recommendations</h3>
        <p className="text-gray-600">AI-powered suggestions to optimize your scheme participation</p>
      </div>

      <div className="space-y-4">
        {planDetails.recommendations.map((rec, index) => (
          <div key={index} className={`border-l-4 rounded-lg p-6 ${
            rec.priority === 'urgent' ? 'border-red-500 bg-red-50' :
            rec.priority === 'high' ? 'border-orange-500 bg-orange-50' :
            rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
            'border-blue-500 bg-blue-50'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="text-lg font-semibold text-gray-900">{rec.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${
                    rec.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    rec.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
                <p className="text-gray-700 mb-4">{rec.description}</p>
                <div className="space-y-2">
                  <h5 className="font-medium text-gray-900">Recommended Actions:</h5>
                  <ul className="space-y-1">
                    {rec.actions.map((action, actionIndex) => (
                      <li key={actionIndex} className="flex items-start space-x-2 text-sm text-gray-600">
                        <span className="text-green-500 mt-1">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="text-right ml-6">
                <div className="text-lg font-bold text-gray-900">{rec.potentialValue}</div>
                <div className="text-sm text-gray-600">Potential Value</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {planDetails.recommendations.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recommendations Available</h3>
          <p className="text-gray-600">Unable to generate recommendations for this plan type.</p>
        </div>
      )}
    </div>
  );
};

// Reusable Metric Card Component
const MetricCard = ({ title, value, subtitle, icon, color, onClick }) => (
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

export default PlanDetailModal;