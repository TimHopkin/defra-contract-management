import React, { useState, useEffect } from 'react';
import NatureMetricsCharts from './NatureMetricsCharts';
import NatureTable from './NatureTable';
import NatureMap from './NatureMap';
import MetricDetailModal from './MetricDetailModal';
import natureReportingService from '../../lib/natureReportingService';

const NatureDashboard = ({ 
  apiKey, 
  selectedMap, 
  onBack, 
  loading: parentLoading, 
  error: parentError 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [metricsData, setMetricsData] = useState([]);
  const [descriptionsData, setDescriptionsData] = useState([]);
  const [processedData, setProcessedData] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState(null);

  // Load data when component mounts or selectedMap changes
  useEffect(() => {
    if (apiKey && selectedMap) {
      loadNatureReportingData();
    }
  }, [apiKey, selectedMap]);

  const loadNatureReportingData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load metrics descriptions and map-specific data in parallel
      const [descriptions, mapMetrics] = await Promise.all([
        natureReportingService.fetchMetricsDescriptions(apiKey),
        natureReportingService.fetchAllMetricsForMap(apiKey, selectedMap)
      ]);

      setDescriptionsData(descriptions);
      setMetricsData(mapMetrics);

      // Process data for dashboard display
      const processed = natureReportingService.processMetricsForDashboard(mapMetrics, descriptions);
      setProcessedData(processed);

    } catch (err) {
      console.error('Error loading nature reporting data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    natureReportingService.clearCache();
    loadNatureReportingData();
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  const handleMetricClick = (metric) => {
    setSelectedMetric(metric);
  };

  if (parentLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <h2 className="text-xl font-semibold text-gray-900 mt-4">Loading Nature Reporting Data</h2>
          <p className="text-gray-600 mt-2">Fetching environmental metrics and analysis...</p>
        </div>
      </div>
    );
  }

  if (parentError || error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Nature Data</h2>
          <p className="text-gray-600 mb-6">{parentError || error}</p>
          <div className="space-x-3">
            <button
              onClick={handleRefresh}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
            >
              Try Again
            </button>
            <button
              onClick={onBack}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg transition duration-300"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!metricsData || metricsData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Nature Reporting Data</h2>
          <p className="text-gray-600 mb-6">
            No environmental metrics found for map: <strong>{selectedMap}</strong>
          </p>
          <button
            onClick={onBack}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
          >
            Select Different Map
          </button>
        </div>
      </div>
    );
  }

  const mapData = metricsData[0]; // Take first (and likely only) result
  const keyMetrics = natureReportingService.getKeyMetricsForMap(mapData);

  const MetricCard = ({ title, value, subtitle, color, icon, trend, onClick }) => (
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
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {trend && (
              <p className={`ml-2 flex items-baseline text-sm font-semibold ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? '+' : ''}{trend}%
              </p>
            )}
          </div>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  const ViewToggle = ({ currentView, onViewChange }) => {
    const views = [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      { id: 'map', label: 'Map View', icon: '🗺️' },
      { id: 'table', label: 'Data Table', icon: '📋' }
    ];

    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg p-1 shadow-sm">
        {views.map(view => (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-all duration-200 ${
              currentView === view.id
                ? 'bg-white text-green-700 shadow-sm'
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

  return (
    <div className="min-h-screen bg-gray-50">
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
                  <h1 className="text-3xl font-bold text-gray-900">Nature Reporting Dashboard</h1>
                  <p className="text-gray-600">Environmental metrics for: <strong>{selectedMap}</strong></p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <ViewToggle currentView={currentView} onViewChange={handleViewChange} />
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && (
          <>
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Biodiversity (BNG Units)"
                value={keyMetrics.biodiversity?.bngUnits?.toFixed(1) || '0'}
                subtitle={`${keyMetrics.biodiversity?.numberOfHabitats || 0} habitats`}
                color="bg-green-100"
                icon={
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                }
              />
              
              <MetricCard
                title="Carbon Sequestration"
                value={`${keyMetrics.carbon?.sequestration?.toFixed(1) || '0'}`}
                subtitle="tCO2e/year"
                color="bg-blue-100"
                icon={
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                  </svg>
                }
              />
              
              <MetricCard
                title="Habitat Coverage"
                value={`${(keyMetrics.biodiversity?.habitatCover * 100)?.toFixed(1) || '0'}%`}
                subtitle="of total area"
                color="bg-yellow-100"
                icon={
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              />
              
              <MetricCard
                title="Water Quality"
                value={keyMetrics.waterQuality?.condition || 'Unknown'}
                subtitle="Ecological condition"
                color={keyMetrics.waterQuality?.condition === 'Good' ? 'bg-green-100' : 
                       keyMetrics.waterQuality?.condition === 'Poor' ? 'bg-red-100' : 'bg-gray-100'}
                icon={
                  <svg className={`h-6 w-6 ${keyMetrics.waterQuality?.condition === 'Good' ? 'text-green-600' : 
                                    keyMetrics.waterQuality?.condition === 'Poor' ? 'text-red-600' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                }
              />
            </div>

            {/* Charts Section */}
            <NatureMetricsCharts 
              processedData={processedData}
              keyMetrics={keyMetrics}
              onMetricClick={handleMetricClick}
            />
          </>
        )}

        {currentView === 'map' && (
          <NatureMap
            mapData={mapData}
            keyMetrics={keyMetrics}
            onMetricClick={handleMetricClick}
          />
        )}

        {currentView === 'table' && (
          <NatureTable
            metricsData={metricsData}
            descriptionsData={descriptionsData}
            onMetricClick={handleMetricClick}
          />
        )}
      </div>

      {/* Metric Detail Modal */}
      {selectedMetric && (
        <MetricDetailModal
          metric={selectedMetric}
          onClose={() => setSelectedMetric(null)}
        />
      )}
    </div>
  );
};

export default NatureDashboard;