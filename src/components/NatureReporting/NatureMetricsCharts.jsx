import React, { useState } from 'react';

// Simple chart components using HTML/CSS (similar to EnergyCharts pattern)
const BiodiversityChart = ({ keyMetrics }) => {
  const bngUnits = keyMetrics.biodiversity?.bngUnits || 0;
  const bngDensity = keyMetrics.biodiversity?.bngDensity || 0;
  const habitatCover = keyMetrics.biodiversity?.habitatCover || 0;
  const numberOfHabitats = keyMetrics.biodiversity?.numberOfHabitats || 0;
  const connectedness = keyMetrics.biodiversity?.connectedness || 0;

  const metrics = [
    { label: 'BNG Units', value: bngUnits.toFixed(1), color: 'bg-green-500' },
    { label: 'BNG Density', value: bngDensity.toFixed(2), color: 'bg-green-400' },
    { label: 'Habitat Cover %', value: (habitatCover * 100).toFixed(1), color: 'bg-green-300' },
    { label: 'No. of Habitats', value: numberOfHabitats, color: 'bg-green-600' },
    { label: 'Connectedness %', value: (connectedness * 100).toFixed(1), color: 'bg-green-200' }
  ];

  return (
    <div className="space-y-4">
      {metrics.map((metric, index) => (
        <div key={index} className="flex items-center justify-between py-2">
          <span className="text-sm font-medium text-gray-700">{metric.label}</span>
          <div className="flex items-center space-x-3">
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${metric.color}`}
                style={{ 
                  width: `${Math.min((parseFloat(metric.value) / (metric.label.includes('%') ? 100 : 
                           metric.label === 'BNG Units' ? Math.max(bngUnits, 100) : 
                           metric.label === 'No. of Habitats' ? 20 : 10)) * 100, 100)}%` 
                }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-900 w-16 text-right">{metric.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const CarbonChart = ({ keyMetrics }) => {
  const sequestration = keyMetrics.carbon?.sequestration || 0;
  const value = keyMetrics.carbon?.value || 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-4xl font-bold text-blue-600 mb-2">{sequestration.toFixed(1)}</div>
        <div className="text-sm text-gray-600 mb-4">tCO2e/year sequestered</div>
        
        <div className="relative w-32 h-32 mx-auto mb-4">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="60"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-200"
            />
            <circle
              cx="64"
              cy="64"
              r="60"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 60}`}
              strokeDashoffset={`${2 * Math.PI * 60 * (1 - Math.min(sequestration / 5000, 1))}`}
              className="text-blue-600"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-gray-500">Carbon</span>
          </div>
        </div>
        
        <div className="text-lg font-semibold text-gray-800">£{(value * 1000).toLocaleString()}</div>
        <div className="text-xs text-gray-500">Asset Value (30yr PV)</div>
      </div>
    </div>
  );
};

const WaterQualityChart = ({ keyMetrics }) => {
  const condition = keyMetrics.waterQuality?.condition || 'Unknown';
  const poorPercentage = keyMetrics.waterQuality?.poorPercentage || 0;
  const goodPercentage = keyMetrics.waterQuality?.goodPercentage || 0;
  const moderatePercentage = Math.max(0, 100 - (poorPercentage * 100) - (goodPercentage * 100));

  const getConditionColor = (cond) => {
    switch (cond?.toLowerCase()) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      case 'bad': return 'text-red-800 bg-red-200';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className={`inline-block px-4 py-2 rounded-lg font-semibold ${getConditionColor(condition)}`}>
          {condition}
        </div>
        <div className="text-sm text-gray-500 mt-2">Overall Ecological Condition</div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-red-600">Poor Quality</span>
          <span className="text-sm font-semibold">{(poorPercentage * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-red-500 h-2 rounded-full" 
            style={{ width: `${poorPercentage * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-yellow-600">Moderate Quality</span>
          <span className="text-sm font-semibold">{moderatePercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-yellow-500 h-2 rounded-full" 
            style={{ width: `${moderatePercentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-green-600">Good Quality</span>
          <span className="text-sm font-semibold">{(goodPercentage * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full" 
            style={{ width: `${goodPercentage * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const LandUseChart = ({ keyMetrics }) => {
  const productiveArea = keyMetrics.landUse?.productiveArea || 0;
  const croppedArea = keyMetrics.landUse?.croppedArea || 0;
  const baselineArea = keyMetrics.landUse?.baselineArea || 0;
  const nonProductiveArea = Math.max(0, baselineArea - productiveArea);

  const total = baselineArea || 1; // Prevent division by zero

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="text-2xl font-bold text-gray-800">{baselineArea.toFixed(1)} ha</div>
        <div className="text-sm text-gray-600">Total Baseline Area</div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-green-600">Productive Land</span>
            <span className="text-sm font-semibold">{productiveArea.toFixed(1)} ha</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${(productiveArea / total) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-yellow-600">Cropped Area</span>
            <span className="text-sm font-semibold">{croppedArea.toFixed(1)} ha</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-yellow-500 h-2 rounded-full" 
              style={{ width: `${(croppedArea / total) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-600">Other Areas</span>
            <span className="text-sm font-semibold">{nonProductiveArea.toFixed(1)} ha</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gray-400 h-2 rounded-full" 
              style={{ width: `${(nonProductiveArea / total) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const EcosystemServicesChart = ({ keyMetrics }) => {
  const airQualityValue = keyMetrics.ecosystem?.airQualityValue || 0;
  const recreationValue = keyMetrics.ecosystem?.recreationValue || 0;
  const timberValue = keyMetrics.ecosystem?.timberValue || 0;

  const services = [
    { 
      label: 'Air Quality Regulation', 
      value: airQualityValue * 1000, // Convert to £
      color: 'bg-purple-500',
      icon: '🌬️'
    },
    { 
      label: 'Recreation Welfare', 
      value: recreationValue * 1000,
      color: 'bg-blue-500',
      icon: '🏃‍♂️'
    },
    { 
      label: 'Timber Production', 
      value: timberValue * 1000,
      color: 'bg-amber-600',
      icon: '🌲'
    }
  ];

  const maxValue = Math.max(...services.map(s => s.value), 1);

  return (
    <div className="space-y-4">
      {services.map((service, index) => (
        <div key={index} className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{service.icon}</span>
              <span className="text-sm font-medium text-gray-700">{service.label}</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              £{service.value.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${service.color}`}
              style={{ width: `${(service.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const NatureMetricsCharts = ({ processedData, keyMetrics, onMetricClick }) => {
  const [selectedChart, setSelectedChart] = useState('overview');

  const chartTabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'biodiversity', label: 'Biodiversity', icon: '🦋' },
    { id: 'carbon', label: 'Carbon', icon: '🌱' },
    { id: 'water', label: 'Water Quality', icon: '💧' },
    { id: 'landuse', label: 'Land Use', icon: '🏞️' },
    { id: 'ecosystem', label: 'Ecosystem Services', icon: '🌍' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm mb-8">
      {/* Chart Selection Tabs */}
      <div className="px-6 py-4 border-b border-gray-200">
        <nav className="flex space-x-8 overflow-x-auto">
          {chartTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedChart(tab.id)}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedChart === tab.id
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Chart Content */}
      <div className="p-6">
        {selectedChart === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">🦋</span>
                Biodiversity Metrics
              </h3>
              <BiodiversityChart keyMetrics={keyMetrics} />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">🌱</span>
                Carbon Sequestration
              </h3>
              <CarbonChart keyMetrics={keyMetrics} />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">💧</span>
                Water Quality
              </h3>
              <WaterQualityChart keyMetrics={keyMetrics} />
            </div>
          </div>
        )}
        
        {selectedChart === 'biodiversity' && (
          <div>
            <h3 className="text-lg font-semibold mb-6">Biodiversity & Habitat Analysis</h3>
            <BiodiversityChart keyMetrics={keyMetrics} />
          </div>
        )}
        
        {selectedChart === 'carbon' && (
          <div>
            <h3 className="text-lg font-semibold mb-6">Carbon Sequestration & Storage</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <CarbonChart keyMetrics={keyMetrics} />
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-2">Annual Carbon Benefits</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    This map sequesters approximately <strong>{keyMetrics.carbon?.sequestration?.toFixed(1) || 0} tonnes of CO2</strong> per year through natural processes.
                  </p>
                  <div className="text-2xl font-bold text-green-600">
                    £{((keyMetrics.carbon?.value || 0) * 1000).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">30-year present value</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {selectedChart === 'water' && (
          <div>
            <h3 className="text-lg font-semibold mb-6">Water Quality & Catchment Health</h3>
            <WaterQualityChart keyMetrics={keyMetrics} />
          </div>
        )}
        
        {selectedChart === 'landuse' && (
          <div>
            <h3 className="text-lg font-semibold mb-6">Land Use Distribution</h3>
            <LandUseChart keyMetrics={keyMetrics} />
          </div>
        )}
        
        {selectedChart === 'ecosystem' && (
          <div>
            <h3 className="text-lg font-semibold mb-6">Ecosystem Services Valuation</h3>
            <EcosystemServicesChart keyMetrics={keyMetrics} />
          </div>
        )}
      </div>
    </div>
  );
};

export default NatureMetricsCharts;