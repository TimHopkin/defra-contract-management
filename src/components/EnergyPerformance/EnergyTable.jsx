import React, { useState, useMemo } from 'react';
import { getEnergyRatingColor, exportEPCToCSV } from '../../lib/epcService';

const EnergyTable = ({ epcData, onRowClick, selectedBuilding, loading }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filterConfig, setFilterConfig] = useState({
    rating: '',
    propertyType: '',
    status: '',
    searchTerm: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Get unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    if (!epcData?.matches) return { ratings: [], propertyTypes: [], statuses: [] };
    
    const ratings = new Set();
    const propertyTypes = new Set();
    const statuses = new Set();
    
    epcData.matches.forEach(match => {
      if (match.epcData) {
        const rating = match.epcData['current-energy-rating'] || match.epcData['asset-rating'];
        if (rating) ratings.add(rating);
        
        const propType = match.epcData['property-type'] || match.epcData['building-category'];
        if (propType) propertyTypes.add(propType);
      }
      statuses.add(match.status);
    });
    
    return {
      ratings: Array.from(ratings).sort(),
      propertyTypes: Array.from(propertyTypes).sort(),
      statuses: Array.from(statuses).sort()
    };
  }, [epcData]);

  // Filter and sort data
  const processedData = useMemo(() => {
    if (!epcData?.matches) return [];
    
    let filtered = epcData.matches.filter(match => {
      // Text search
      if (filterConfig.searchTerm) {
        const searchLower = filterConfig.searchTerm.toLowerCase();
        const address = (match.epcData?.address || match.building.properties?.address || '').toLowerCase();
        const uprn = (match.epcData?.uprn || match.building.properties?.uprn || '').toLowerCase();
        
        if (!address.includes(searchLower) && !uprn.includes(searchLower)) {
          return false;
        }
      }
      
      // Rating filter
      if (filterConfig.rating) {
        const rating = match.epcData?.['current-energy-rating'] || match.epcData?.['asset-rating'];
        if (rating !== filterConfig.rating) return false;
      }
      
      // Property type filter
      if (filterConfig.propertyType) {
        const propType = match.epcData?.['property-type'] || match.epcData?.['building-category'];
        if (propType !== filterConfig.propertyType) return false;
      }
      
      // Status filter
      if (filterConfig.status && match.status !== filterConfig.status) {
        return false;
      }
      
      return true;
    });
    
    // Sort data
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal, bVal;
        
        switch (sortConfig.key) {
          case 'address':
            aVal = a.epcData?.address || a.building.properties?.address || '';
            bVal = b.epcData?.address || b.building.properties?.address || '';
            break;
          case 'uprn':
            aVal = a.epcData?.uprn || a.building.properties?.uprn || '';
            bVal = b.epcData?.uprn || b.building.properties?.uprn || '';
            break;
          case 'rating':
            aVal = a.epcData?.['current-energy-rating'] || a.epcData?.['asset-rating'] || 'Z';
            bVal = b.epcData?.['current-energy-rating'] || b.epcData?.['asset-rating'] || 'Z';
            break;
          case 'efficiency':
            aVal = parseInt(a.epcData?.['energy-efficiency-rating'] || a.epcData?.['asset-rating-numeric']) || 0;
            bVal = parseInt(b.epcData?.['energy-efficiency-rating'] || b.epcData?.['asset-rating-numeric']) || 0;
            break;
          case 'co2':
            aVal = parseFloat(a.epcData?.['co2-emissions-current']) || 0;
            bVal = parseFloat(b.epcData?.['co2-emissions-current']) || 0;
            break;
          case 'propertyType':
            aVal = a.epcData?.['property-type'] || a.epcData?.['building-category'] || '';
            bVal = b.epcData?.['property-type'] || b.epcData?.['building-category'] || '';
            break;
          case 'floorArea':
            aVal = parseFloat(a.epcData?.['total-floor-area']) || 0;
            bVal = parseFloat(b.epcData?.['total-floor-area']) || 0;
            break;
          case 'inspectionDate':
            aVal = new Date(a.epcData?.['inspection-date'] || a.epcData?.['lodgement-date'] || 0);
            bVal = new Date(b.epcData?.['inspection-date'] || b.epcData?.['lodgement-date'] || 0);
            break;
          case 'confidence':
            aVal = a.matchConfidence || 0;
            bVal = b.matchConfidence || 0;
            break;
          default:
            aVal = '';
            bVal = '';
        }
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return filtered;
  }, [epcData, sortConfig, filterConfig]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilterConfig(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilterConfig({
      rating: '',
      propertyType: '',
      status: '',
      searchTerm: ''
    });
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    const csvContent = exportEPCToCSV(processedData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `epc-data-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const SortableHeader = ({ children, sortKey }) => (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortConfig.key === sortKey && (
          <svg className={`w-4 h-4 ${sortConfig.direction === 'desc' ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        )}
      </div>
    </th>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!epcData?.matches || epcData.matches.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No EPC data available</h3>
        <p className="mt-1 text-sm text-gray-500">Please load building data to see energy performance information.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Filters and Controls */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by address or UPRN..."
                value={filterConfig.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Rating Filter */}
            <select
              value={filterConfig.rating}
              onChange={(e) => handleFilterChange('rating', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">All Ratings</option>
              {filterOptions.ratings.map(rating => (
                <option key={rating} value={rating}>Rating {rating}</option>
              ))}
            </select>

            {/* Property Type Filter */}
            <select
              value={filterConfig.propertyType}
              onChange={(e) => handleFilterChange('propertyType', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">All Property Types</option>
              {filterOptions.propertyTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterConfig.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">All Statuses</option>
              {filterOptions.statuses.map(status => (
                <option key={status} value={status}>{status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
              ))}
            </select>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Clear Filters
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {paginatedData.length} of {processedData.length} buildings
          {processedData.length !== epcData.matches.length && ` (filtered from ${epcData.matches.length} total)`}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader sortKey="address">Address</SortableHeader>
              <SortableHeader sortKey="uprn">UPRN</SortableHeader>
              <SortableHeader sortKey="rating">Energy Rating</SortableHeader>
              <SortableHeader sortKey="efficiency">Efficiency Score</SortableHeader>
              <SortableHeader sortKey="co2">CO2 Emissions</SortableHeader>
              <SortableHeader sortKey="propertyType">Property Type</SortableHeader>
              <SortableHeader sortKey="floorArea">Floor Area</SortableHeader>
              <SortableHeader sortKey="inspectionDate">Inspection Date</SortableHeader>
              <SortableHeader sortKey="confidence">Match Confidence</SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((match, index) => {
              const epc = match.epcData;
              const building = match.building;
              const isSelected = selectedBuilding && selectedBuilding.building.properties?.id === building.properties?.id;
              
              return (
                <tr
                  key={index}
                  onClick={() => onRowClick && onRowClick(match, index)}
                  className={`hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-indigo-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="max-w-xs truncate">
                      {epc?.address || building.properties?.address || 'N/A'}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {epc?.uprn || building.properties?.uprn || 'N/A'}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {epc ? (
                      <span 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: getEnergyRatingColor(epc['current-energy-rating'] || epc['asset-rating']) }}
                      >
                        {epc['current-energy-rating'] || epc['asset-rating'] || 'N/A'}
                      </span>
                    ) : (
                      <span className="text-gray-400">No Data</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {epc?.['energy-efficiency-rating'] || epc?.['asset-rating-numeric'] || 'N/A'}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {epc?.['co2-emissions-current'] ? `${epc['co2-emissions-current']} t/yr` : 'N/A'}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="max-w-xs truncate">
                      {epc?.['property-type'] || epc?.['building-category'] || 'N/A'}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {epc?.['total-floor-area'] ? `${epc['total-floor-area']} m²` : 'N/A'}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {epc?.['inspection-date'] || epc?.['lodgement-date'] ? 
                      new Date(epc['inspection-date'] || epc['lodgement-date']).toLocaleDateString() : 'N/A'}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {match.matchConfidence ? `${Math.round(match.matchConfidence * 100)}%` : 'N/A'}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      match.status === 'matched' 
                        ? 'bg-green-100 text-green-800'
                        : match.status === 'no_epc_found'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {match.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded text-sm px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>;
                  }
                  return null;
                })}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnergyTable;