import React, { useState, useEffect } from 'react';

const MapPlansDialog = ({ 
  isOpen, 
  onClose, 
  mapName, 
  allPlans,
  onPlanToggle,
  selectedPlans = [],
  onLandAnalysis,
  onPlanClick
}) => {
  const [localSelectedPlans, setLocalSelectedPlans] = useState(selectedPlans);

  // Filter plans that belong to this map
  const mapPlans = allPlans.filter(plan => plan.mapName === mapName);

  useEffect(() => {
    setLocalSelectedPlans(selectedPlans);
  }, [selectedPlans]);

  const handlePlanToggle = (planId) => {
    const updatedPlans = localSelectedPlans.includes(planId)
      ? localSelectedPlans.filter(id => id !== planId)
      : [...localSelectedPlans, planId];
    
    setLocalSelectedPlans(updatedPlans);
    if (onPlanToggle) {
      onPlanToggle(planId, updatedPlans);
    }
  };

  const getPlanTypeLabel = (planType) => {
    const typeLabels = {
      'BPS': 'Basic Payment Scheme',
      'CSS': 'Countryside Stewardship Scheme',
      'CSS_2025': 'Countryside Stewardship Scheme 2025',
      'SFI2023': 'Sustainable Farming Incentive 2023',
      'SFI2022': 'Sustainable Farming Incentive 2022',
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
    return typeLabels[planType] || 'Unknown Plan Type';
  };

  const getPlanTypeColor = (planType) => {
    const colorMap = {
      'BPS': 'bg-blue-100 text-blue-800',
      'CSS': 'bg-green-100 text-green-800',
      'CSS_2025': 'bg-green-100 text-green-800',
      'SFI2023': 'bg-purple-100 text-purple-800',
      'SFI2022': 'bg-purple-100 text-purple-800',
      'SFI2024': 'bg-purple-100 text-purple-800',
      'UKHAB': 'bg-yellow-100 text-yellow-800',
      'UKHAB_V2': 'bg-yellow-100 text-yellow-800',
      'LAND_MANAGEMENT': 'bg-indigo-100 text-indigo-800',
      'LAND_MANAGEMENT_V2': 'bg-indigo-100 text-indigo-800',
      'PEAT_ASSESSMENT': 'bg-orange-100 text-orange-800',
      'OSMM': 'bg-gray-100 text-gray-800',
      'USER': 'bg-slate-100 text-slate-800',
      'ESS': 'bg-emerald-100 text-emerald-800',
      'FER': 'bg-lime-100 text-lime-800',
      'HEALTHY_HEDGEROWS': 'bg-teal-100 text-teal-800'
    };
    return colorMap[planType] || 'bg-cyan-100 text-cyan-800';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-indigo-700">Map Plans: {mapName}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {mapPlans.length} plan{mapPlans.length !== 1 ? 's' : ''} found for this map
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Land Analysis Button - Show when plans are selected */}
            {localSelectedPlans.length > 0 && onLandAnalysis && (
              <button
                onClick={() => onLandAnalysis(mapName, localSelectedPlans)}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out transform hover:scale-105 flex items-center space-x-2"
                title="Analyze land data across selected plans"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-sm">Land Analysis</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              title="Close dialog"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {mapPlans.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No plans found for this map.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Toggle plans on/off</strong> to show them on the map. Selected plans will be visible with their features and can be analyzed collectively.
              </p>
            </div>

            {mapPlans.map((plan) => (
              <div
                key={plan.id}
                className={`border rounded-lg p-4 transition-colors duration-200 ${
                  localSelectedPlans.includes(plan.id) 
                    ? 'border-indigo-300 bg-indigo-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSelectedPlans.includes(plan.id)}
                        onChange={() => handlePlanToggle(plan.id)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200 ${
                        localSelectedPlans.includes(plan.id)
                          ? 'bg-indigo-600 border-indigo-600'
                          : 'border-gray-300 hover:border-indigo-400'
                      }`}>
                        {localSelectedPlans.includes(plan.id) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </label>
                  </div>

                  <div 
                    className="flex-grow cursor-pointer hover:bg-gray-50 rounded p-2 -m-2 transition-colors duration-200"
                    onClick={() => onPlanClick && onPlanClick(plan)}
                    title="Click to view plan details and features"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                      <span 
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getPlanTypeColor(plan.planType)}`}
                        title={getPlanTypeLabel(plan.planType)}
                      >
                        {plan.planType}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{getPlanTypeLabel(plan.planType)}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>ID: {plan.id}</span>
                      {plan.created_at && (
                        <span>Created: {new Date(plan.created_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {localSelectedPlans.includes(plan.id) && (
                      <div className="flex items-center space-x-1 text-indigo-600">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">Active</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Section */}
        {localSelectedPlans.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">Selected Plans Summary</h4>
                <p className="text-sm text-gray-600">
                  {localSelectedPlans.length} of {mapPlans.length} plans selected for map display
                </p>
              </div>
              <div className="text-right">
                <button
                  onClick={() => {
                    setLocalSelectedPlans([]);
                    if (onPlanToggle) {
                      onPlanToggle(null, []);
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-800 transition-colors duration-200"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapPlansDialog;