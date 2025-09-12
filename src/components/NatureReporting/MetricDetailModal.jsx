import React from 'react';

const MetricDetailModal = ({ metric, onClose }) => {
  if (!metric) return null;

  const formatValue = (value, type) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    
    if (typeof value === 'number') {
      if (type === 'PERCENTAGE') {
        return `${(value * 100).toFixed(2)}%`;
      } else if (type === 'FLOAT') {
        return value.toFixed(3);
      } else if (type === 'INTEGER') {
        return value.toLocaleString();
      } else {
        return value.toLocaleString();
      }
    }
    
    return String(value);
  };

  const getMetricCategory = (key) => {
    if (key.includes('bng')) return 'Biodiversity Net Gain';
    if (key.includes('carbon')) return 'Carbon Management';
    if (key.includes('wfd') || key.includes('water')) return 'Water Quality';
    if (key.includes('habitat') || key.includes('connectedness')) return 'Habitat Management';
    if (key.includes('peat') || key.includes('flood')) return 'Environmental Risk';
    if (key.includes('recreation') || key.includes('timber') || key.includes('air_quality')) return 'Ecosystem Services';
    return 'General';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Biodiversity Net Gain': 'bg-green-100 text-green-800 border-green-200',
      'Carbon Management': 'bg-blue-100 text-blue-800 border-blue-200',
      'Water Quality': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'Habitat Management': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Environmental Risk': 'bg-red-100 text-red-800 border-red-200',
      'Ecosystem Services': 'bg-purple-100 text-purple-800 border-purple-200',
      'General': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[category] || colors['General'];
  };

  const category = getMetricCategory(metric.metricKey);
  const hasVariants = metric.variants && metric.variants.length > 1;
  const hasUplift = metric.uplift !== undefined && metric.uplift !== null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getCategoryColor(category)}`}>
                  {category}
                </span>
                {metric.metricType && (
                  <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                    {metric.metricType}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {metric.metricName || metric.metricKey}
              </h2>
              <p className="text-sm text-gray-600">
                <strong>Map:</strong> {metric.mapName} • <strong>Holding:</strong> {metric.holding}
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Description */}
          {metric.metricDescription && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">{metric.metricDescription}</p>
            </div>
          )}

          {/* Values Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Baseline Value */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600 mb-1">Baseline Value</h4>
              <div className="text-2xl font-bold text-gray-900">
                {formatValue(metric.baseline, metric.metricType)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Current/historical value</p>
            </div>

            {/* Future Value */}
            {metric.future !== undefined && metric.future !== null && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-600 mb-1">Future Value</h4>
                <div className="text-2xl font-bold text-blue-900">
                  {formatValue(metric.future, metric.metricType)}
                </div>
                <p className="text-xs text-blue-600 mt-1">Projected value</p>
              </div>
            )}

            {/* Uplift Value */}
            {hasUplift && (
              <div className={`p-4 rounded-lg ${
                metric.uplift > 0 ? 'bg-green-50' : 
                metric.uplift < 0 ? 'bg-red-50' : 'bg-gray-50'
              }`}>
                <h4 className={`text-sm font-medium mb-1 ${
                  metric.uplift > 0 ? 'text-green-600' : 
                  metric.uplift < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  Net Change (Uplift)
                </h4>
                <div className={`text-2xl font-bold ${
                  metric.uplift > 0 ? 'text-green-900' : 
                  metric.uplift < 0 ? 'text-red-900' : 'text-gray-900'
                }`}>
                  {metric.uplift > 0 ? '+' : ''}{formatValue(metric.uplift, metric.metricType)}
                </div>
                <p className={`text-xs mt-1 ${
                  metric.uplift > 0 ? 'text-green-600' : 
                  metric.uplift < 0 ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {metric.uplift > 0 ? 'Improvement' : metric.uplift < 0 ? 'Decline' : 'No change'}
                </p>
              </div>
            )}
          </div>

          {/* Variants */}
          {hasVariants && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Available Variants</h3>
              <div className="flex flex-wrap gap-2">
                {metric.variants.map((variant, index) => (
                  <span
                    key={index}
                    className="inline-flex px-3 py-1 text-sm bg-indigo-100 text-indigo-800 rounded-full"
                  >
                    {variant}
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                This metric can be measured in different ways or time periods.
              </p>
            </div>
          )}

          {/* Technical Details */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Technical Details</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <dt className="text-sm font-medium text-gray-600">Metric Key</dt>
                <dd className="text-sm text-gray-900 font-mono bg-white px-2 py-1 rounded mt-1">
                  {metric.metricKey}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600">Data Type</dt>
                <dd className="text-sm text-gray-900 mt-1">{metric.metricType || 'Not specified'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600">County</dt>
                <dd className="text-sm text-gray-900 mt-1">{metric.county || 'Not specified'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600">Lead Farmer</dt>
                <dd className="text-sm text-gray-900 mt-1">{metric.leadFarmer || 'Not specified'}</dd>
              </div>
            </dl>
          </div>

          {/* Interpretation Guide */}
          <div className="border border-gray-200 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">How to Interpret This Metric</h3>
            <div className="space-y-2 text-sm text-gray-700">
              {metric.metricType === 'PERCENTAGE' && (
                <p>• This metric is expressed as a percentage (0-100% range)</p>
              )}
              {metric.metricType === 'FLOAT' && (
                <p>• This metric uses decimal values for precise measurements</p>
              )}
              {metric.metricType === 'INTEGER' && (
                <p>• This metric represents whole number counts or quantities</p>
              )}
              {hasUplift && metric.uplift > 0 && (
                <p>• A positive uplift indicates improvement or beneficial change</p>
              )}
              {hasUplift && metric.uplift < 0 && (
                <p>• A negative uplift indicates decline or concerning change</p>
              )}
              {category === 'Biodiversity Net Gain' && (
                <p>• Higher BNG values generally indicate greater biodiversity value</p>
              )}
              {category === 'Carbon Management' && (
                <p>• Higher carbon sequestration values indicate better climate benefits</p>
              )}
              {category === 'Water Quality' && (
                <p>• Water quality conditions range from Poor to Good, with Good being optimal</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricDetailModal;