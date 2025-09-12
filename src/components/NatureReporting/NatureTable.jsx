import React, { useState, useMemo } from 'react';

const NatureTable = ({ metricsData, descriptionsData, onMetricClick }) => {
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedMetrics, setExpandedMetrics] = useState({});

  // Create descriptions lookup
  const descriptionsMap = useMemo(() => {
    const map = {};
    descriptionsData.forEach(desc => {
      map[desc.key] = desc;
    });
    return map;
  }, [descriptionsData]);

  // Get metric categories
  const metricCategories = useMemo(() => {
    const categories = new Set();
    Object.values(descriptionsMap).forEach(desc => {
      if (desc.key.includes('bng')) categories.add('Biodiversity Net Gain');
      else if (desc.key.includes('carbon')) categories.add('Carbon');
      else if (desc.key.includes('wfd') || desc.key.includes('water')) categories.add('Water Quality');
      else if (desc.key.includes('habitat') || desc.key.includes('connectedness')) categories.add('Habitat');
      else if (desc.key.includes('peat') || desc.key.includes('flood')) categories.add('Environmental Risk');
      else if (desc.key.includes('recreation') || desc.key.includes('timber') || desc.key.includes('air_quality')) categories.add('Ecosystem Services');
      else categories.add('Other');
    });
    return Array.from(categories).sort();
  }, [descriptionsMap]);

  // Transform data for table display
  const tableData = useMemo(() => {
    if (!metricsData || metricsData.length === 0) return [];

    const rows = [];
    
    metricsData.forEach(farm => {
      if (farm.metrics) {
        farm.metrics.forEach(metric => {
          const description = descriptionsMap[metric.key];
          
          // Filter by category
          let category = 'Other';
          if (metric.key.includes('bng')) category = 'Biodiversity Net Gain';
          else if (metric.key.includes('carbon')) category = 'Carbon';
          else if (metric.key.includes('wfd') || metric.key.includes('water')) category = 'Water Quality';
          else if (metric.key.includes('habitat') || metric.key.includes('connectedness')) category = 'Habitat';
          else if (metric.key.includes('peat') || metric.key.includes('flood')) category = 'Environmental Risk';
          else if (metric.key.includes('recreation') || metric.key.includes('timber') || metric.key.includes('air_quality')) category = 'Ecosystem Services';

          if (selectedCategory !== 'all' && category !== selectedCategory) return;

          // Filter by search term
          if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = (
              metric.key.toLowerCase().includes(searchLower) ||
              (description?.name || '').toLowerCase().includes(searchLower) ||
              (description?.description || '').toLowerCase().includes(searchLower) ||
              farm.mapName.toLowerCase().includes(searchLower) ||
              (farm.holding || '').toLowerCase().includes(searchLower)
            );
            if (!matchesSearch) return;
          }

          rows.push({
            id: `${farm.id}_${metric.key}`,
            mapName: farm.mapName,
            holding: farm.holding || '',
            leadFarmer: farm.leadFarmer || '',
            county: Array.isArray(farm.county) ? farm.county.join(', ') : (farm.county || ''),
            metricKey: metric.key,
            metricName: description?.name || metric.key,
            metricDescription: description?.description || '',
            metricType: description?.type || '',
            category: category,
            baseline: metric.baseline,
            future: metric.future,
            uplift: metric.uplift,
            hasVariants: description?.variants?.length > 1,
            variants: description?.variants || []
          });
        });
      }
    });

    return rows;
  }, [metricsData, descriptionsMap, selectedCategory, searchTerm]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortField) return tableData;

    return [...tableData].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle numeric values
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Handle string values
      aVal = String(aVal || '').toLowerCase();
      bVal = String(bVal || '').toLowerCase();
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tableData, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleMetricExpansion = (metricKey) => {
    setExpandedMetrics(prev => ({
      ...prev,
      [metricKey]: !prev[metricKey]
    }));
  };

  const formatValue = (value, type) => {
    if (value === null || value === undefined || value === '') return '-';
    
    if (typeof value === 'number') {
      if (type === 'PERCENTAGE') {
        return `${(value * 100).toFixed(2)}%`;
      } else if (type === 'FLOAT') {
        return value.toFixed(2);
      } else {
        return value.toLocaleString();
      }
    }
    
    return String(value);
  };

  const SortButton = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 text-left font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
    >
      <span>{children}</span>
      {sortField === field && (
        <svg className={`w-4 h-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      )}
    </button>
  );

  const getCategoryColor = (category) => {
    const colors = {
      'Biodiversity Net Gain': 'bg-green-100 text-green-800',
      'Carbon': 'bg-blue-100 text-blue-800',
      'Water Quality': 'bg-cyan-100 text-cyan-800',
      'Habitat': 'bg-emerald-100 text-emerald-800',
      'Environmental Risk': 'bg-red-100 text-red-800',
      'Ecosystem Services': 'bg-purple-100 text-purple-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors['Other'];
  };

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* Header with Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Nature Reporting Data Table</h3>
            <p className="text-sm text-gray-600">
              Showing {sortedData.length} metrics {searchTerm && `matching "${searchTerm}"`}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Categories</option>
              {metricCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search metrics..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-green-500 focus:border-green-500 w-full sm:w-64"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="mapName">Map</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="holding">Holding</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="category">Category</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="metricName">Metric</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="baseline">Baseline</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="future">Future</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="uplift">Uplift</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((row, index) => (
              <React.Fragment key={row.id}>
                <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{row.mapName}</div>
                      {row.county && (
                        <div className="text-sm text-gray-500">{row.county}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{row.holding}</div>
                      {row.leadFarmer && (
                        <div className="text-sm text-gray-500">{row.leadFarmer}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(row.category)}`}>
                      {row.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <div className="text-sm font-medium text-gray-900">{row.metricName}</div>
                      <div className="text-xs text-gray-500">{row.metricKey}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatValue(row.baseline, row.metricType)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatValue(row.future, row.metricType)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {row.uplift !== undefined && row.uplift !== null ? (
                      <span className={`text-sm font-medium ${
                        row.uplift > 0 ? 'text-green-600' : 
                        row.uplift < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {row.uplift > 0 ? '+' : ''}{formatValue(row.uplift, row.metricType)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {row.metricDescription && (
                      <button
                        onClick={() => toggleMetricExpansion(row.metricKey)}
                        className="text-green-600 hover:text-green-900 focus:outline-none"
                        title="Show description"
                      >
                        <svg className={`w-4 h-4 transform ${expandedMetrics[row.metricKey] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                    {onMetricClick && (
                      <button
                        onClick={() => onMetricClick(row)}
                        className="text-indigo-600 hover:text-indigo-900 focus:outline-none"
                        title="View details"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
                {expandedMetrics[row.metricKey] && row.metricDescription && (
                  <tr>
                    <td colSpan="8" className="px-6 py-3 bg-gray-50">
                      <div className="text-sm text-gray-700">
                        <strong>Description:</strong> {row.metricDescription}
                        {row.variants.length > 0 && (
                          <div className="mt-2">
                            <strong>Available variants:</strong> {row.variants.join(', ')}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {sortedData.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No metrics found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? `No metrics match "${searchTerm}"` : 'No metrics available for the selected filters'}
          </p>
        </div>
      )}
    </div>
  );
};

export default NatureTable;