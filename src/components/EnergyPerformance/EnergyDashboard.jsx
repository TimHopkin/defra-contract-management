import React, { useState, useEffect } from 'react';
import {
  RatingDistributionChart,
  PropertyTypeChart,
  PerformanceMetricsChart,
  EfficiencyScatterChart,
  CO2EmissionsChart,
  CertificateTimelineChart
} from './EnergyCharts';

const EnergyDashboard = ({ epcData, summary, loading, error, onRefresh }) => {
  const [selectedMetric, setSelectedMetric] = useState('overview');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <h2 className="text-xl font-semibold text-gray-900 mt-4">Loading Energy Performance Data</h2>
          <p className="text-gray-600 mt-2">Fetching EPC certificates and analyzing buildings...</p>
          {epcData && epcData.progress && (
            <div className="mt-4">
              <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${epcData.progress.percentage}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {epcData.progress.completed} of {epcData.progress.total} buildings processed
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Energy Data</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={onRefresh}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!epcData || !summary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Energy Performance Data</h2>
          <p className="text-gray-600">Please select an estate and load plans to view energy performance analysis.</p>
        </div>
      </div>
    );
  }

  const MetricCard = ({ title, value, subtitle, color, icon, trend }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
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

  const getEfficiencyColor = (score) => {
    if (score >= 81) return 'text-green-600';
    if (score >= 69) return 'text-green-500';
    if (score >= 55) return 'text-yellow-600';
    if (score >= 39) return 'text-orange-600';
    if (score >= 21) return 'text-red-500';
    return 'text-red-600';
  };

  const getEfficiencyRating = (score) => {
    if (score >= 92) return 'A';
    if (score >= 81) return 'B';
    if (score >= 69) return 'C';
    if (score >= 55) return 'D';
    if (score >= 39) return 'E';
    if (score >= 21) return 'F';
    return 'G';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Energy Performance Dashboard</h1>
                <p className="text-gray-600">Comprehensive analysis of estate energy efficiency</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onRefresh}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Buildings"
            value={summary.totalBuildings?.toLocaleString() || '0'}
            subtitle="In selected estate"
            color="bg-blue-100"
            icon={
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
          
          <MetricCard
            title="EPC Coverage"
            value={`${summary.coveragePercent || 0}%`}
            subtitle={`${summary.withEPC || 0} buildings with certificates`}
            color={summary.coveragePercent >= 90 ? 'bg-green-100' : summary.coveragePercent >= 70 ? 'bg-yellow-100' : 'bg-red-100'}
            icon={
              <svg className={`h-6 w-6 ${summary.coveragePercent >= 90 ? 'text-green-600' : summary.coveragePercent >= 70 ? 'text-yellow-600' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          
          <MetricCard
            title="Average Efficiency"
            value={summary.averageEfficiency || 0}
            subtitle={`Rating ${getEfficiencyRating(summary.averageEfficiency || 0)}`}
            color="bg-green-100"
            icon={
              <svg className={`h-6 w-6 ${getEfficiencyColor(summary.averageEfficiency || 0)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
          
          <MetricCard
            title="Expiring Soon"
            value={summary.expiringCertificates || 0}
            subtitle="Certificates expire within 6 months"
            color={summary.expiringCertificates === 0 ? 'bg-green-100' : 'bg-yellow-100'}
            icon={
              <svg className={`h-6 w-6 ${summary.expiringCertificates === 0 ? 'text-green-600' : 'text-yellow-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Chart Selection Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'ratings', label: 'Energy Ratings', icon: '⚡' },
                { id: 'property-types', label: 'Property Types', icon: '🏢' },
                { id: 'efficiency', label: 'Efficiency Analysis', icon: '📈' },
                { id: 'emissions', label: 'CO2 Emissions', icon: '🌱' },
                { id: 'timeline', label: 'Certificate Timeline', icon: '📅' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedMetric(tab.id)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedMetric === tab.id
                      ? 'bg-indigo-100 text-indigo-700'
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
            {selectedMetric === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Performance Indicators</h3>
                  <PerformanceMetricsChart summary={summary} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Energy Rating Distribution</h3>
                  <RatingDistributionChart summary={summary} />
                </div>
              </div>
            )}
            
            {selectedMetric === 'ratings' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Energy Rating Distribution</h3>
                <RatingDistributionChart summary={summary} />
              </div>
            )}
            
            {selectedMetric === 'property-types' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Property Type Distribution</h3>
                <PropertyTypeChart summary={summary} />
              </div>
            )}
            
            {selectedMetric === 'efficiency' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Energy Efficiency vs Floor Area</h3>
                <EfficiencyScatterChart matches={epcData.matches || []} />
              </div>
            )}
            
            {selectedMetric === 'emissions' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">CO2 Emissions by Property Type</h3>
                <CO2EmissionsChart matches={epcData.matches || []} />
              </div>
            )}
            
            {selectedMetric === 'timeline' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">EPC Certificate Timeline</h3>
                <CertificateTimelineChart matches={epcData.matches || []} />
              </div>
            )}
          </div>
        </div>

        {/* Additional Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Rating Breakdown</h3>
            <div className="space-y-3">
              {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(rating => (
                <div key={rating} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded mr-3"
                      style={{
                        backgroundColor: {
                          'A': '#00a651', 'B': '#19b459', 'C': '#8cc63f', 'D': '#ffd700',
                          'E': '#f57c00', 'F': '#e53e3e', 'G': '#c53030'
                        }[rating]
                      }}
                    />
                    <span className="font-medium">Rating {rating}</span>
                  </div>
                  <span className="text-gray-600">{summary.ratingDistribution[rating] || 0}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Data Quality</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">UPRN Matches</span>
                <span className="font-medium">{summary.matchMethods?.uprn || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Postcode Matches</span>
                <span className="font-medium">{summary.matchMethods?.postcode || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Address Matches</span>
                <span className="font-medium">{summary.matchMethods?.address || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">No Match Found</span>
                <span className="font-medium">{summary.matchMethods?.none || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Environmental Impact</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Avg CO2 Emissions</span>
                <span className="font-medium">{summary.averageCO2 || 0} tonnes/year</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Properties</span>
                <span className="font-medium">{Object.keys(summary.propertyTypes || {}).length} types</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Data Coverage</span>
                <span className={`font-medium ${summary.coveragePercent >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {summary.coveragePercent}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnergyDashboard;