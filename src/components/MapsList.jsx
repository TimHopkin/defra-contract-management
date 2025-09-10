import React, { useState, useMemo } from 'react';

const MapsList = ({ 
  allPlans, 
  onMapClick 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Extract unique maps with plan counts
  const uniqueMaps = useMemo(() => {
    const mapGroups = {};
    
    allPlans.forEach(plan => {
      if (plan.mapName) {
        if (!mapGroups[plan.mapName]) {
          mapGroups[plan.mapName] = {
            mapName: plan.mapName,
            planCount: 0,
            plans: []
          };
        }
        mapGroups[plan.mapName].planCount++;
        mapGroups[plan.mapName].plans.push(plan);
      }
    });

    return Object.values(mapGroups).sort((a, b) => a.mapName.localeCompare(b.mapName));
  }, [allPlans]);

  // Filter maps based on search term
  const filteredMaps = useMemo(() => {
    if (!searchTerm) return uniqueMaps;
    
    const searchLower = searchTerm.toLowerCase();
    return uniqueMaps.filter(map => 
      map.mapName.toLowerCase().includes(searchLower)
    );
  }, [uniqueMaps, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Maps Overview</h2>
          <p className="text-sm text-gray-600 mt-1">
            {uniqueMaps.length} unique map{uniqueMaps.length !== 1 ? 's' : ''} containing {allPlans.length} total plans
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Search map names..."
            className="block w-full pl-10 pr-10 py-3 text-base border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Maps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMaps.map((map) => (
          <div
            key={map.mapName}
            onClick={() => onMapClick(map.mapName)}
            className="bg-white rounded-xl border border-gray-200 hover:border-indigo-300 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group"
          >
            <div className="p-6">
              {/* Map Icon */}
              <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 group-hover:bg-indigo-200 rounded-lg mb-4 transition-colors duration-200">
                <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>

              {/* Map Name */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-700 transition-colors duration-200">
                {map.mapName}
              </h3>

              {/* Plan Count Badge */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 group-hover:bg-indigo-100 group-hover:text-indigo-800 transition-colors duration-200">
                  {map.planCount} plan{map.planCount !== 1 ? 's' : ''}
                </span>

                {/* Click indicator */}
                <svg className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No results message */}
      {filteredMaps.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 0a4 4 0 014-4h2a4 4 0 014 4v6a4 4 0 01-4 4h-2a4 4 0 01-4-4v-6z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No maps found</h3>
          <p className="mt-2 text-gray-500">No maps match your search term "{searchTerm}"</p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Clear search
          </button>
        </div>
      )}

      {/* No maps message */}
      {uniqueMaps.length === 0 && !searchTerm && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No maps available</h3>
          <p className="mt-2 text-gray-500">There are no maps with associated plans to display</p>
        </div>
      )}
    </div>
  );
};

export default MapsList;