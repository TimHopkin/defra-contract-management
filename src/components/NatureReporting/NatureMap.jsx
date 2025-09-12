import React, { useState, useEffect, useRef } from 'react';

const NatureMap = ({ mapData, keyMetrics, onMetricClick }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedOverlay, setSelectedOverlay] = useState('biodiversity');
  const [showInfo, setShowInfo] = useState(true);

  // Initialize map when Leaflet is available
  useEffect(() => {
    const initializeMap = () => {
      if (window.L && mapContainerRef.current && !mapRef.current) {
        try {
          // Create map centered on UK
          mapRef.current = window.L.map(mapContainerRef.current, {
            center: [54.5, -2],
            zoom: 6,
            zoomControl: true
          });

          // Add tile layer
          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
          }).addTo(mapRef.current);

          setMapLoaded(true);

          // Add environmental data visualization
          if (mapData) {
            addEnvironmentalLayers();
          }
        } catch (error) {
          console.error('Error initializing map:', error);
        }
      }
    };

    // Check if Leaflet is already loaded
    if (window.L) {
      initializeMap();
    } else {
      // Wait for Leaflet to load
      const checkLeaflet = setInterval(() => {
        if (window.L) {
          clearInterval(checkLeaflet);
          initializeMap();
        }
      }, 100);

      return () => clearInterval(checkLeaflet);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Add environmental data layers to the map
  const addEnvironmentalLayers = () => {
    if (!mapRef.current || !mapData) return;

    // Clear existing layers except base map
    mapRef.current.eachLayer((layer) => {
      if (layer !== mapRef.current._layers[Object.keys(mapRef.current._layers)[0]]) {
        mapRef.current.removeLayer(layer);
      }
    });

    // Add marker for the farm location (approximated)
    const marker = window.L.marker([54.5, -2])
      .addTo(mapRef.current)
      .bindPopup(createPopupContent());

    // Fit map to show marker
    mapRef.current.setView([54.5, -2], 10);
  };

  const createPopupContent = () => {
    if (!mapData) return '';

    return `
      <div class="p-3 min-w-64">
        <h3 class="font-semibold text-lg mb-2">${mapData.mapName}</h3>
        <div class="space-y-2">
          <div><strong>Holding:</strong> ${mapData.holding}</div>
          <div><strong>Lead Farmer:</strong> ${mapData.leadFarmer}</div>
          <div><strong>County:</strong> ${Array.isArray(mapData.county) ? mapData.county.join(', ') : mapData.county}</div>
          <div><strong>Baseline Area:</strong> ${mapData.baseLineArea?.toFixed(1)} ha</div>
          <div><strong>Status:</strong> ${mapData.status}</div>
        </div>
      </div>
    `;
  };

  const overlayOptions = [
    { id: 'biodiversity', name: 'Biodiversity', color: 'green', icon: '🦋' },
    { id: 'carbon', name: 'Carbon Storage', color: 'blue', icon: '🌱' },
    { id: 'water', name: 'Water Quality', color: 'cyan', icon: '💧' },
    { id: 'habitat', name: 'Habitat Quality', color: 'emerald', icon: '🏞️' },
    { id: 'flood', name: 'Flood Risk', color: 'red', icon: '🌊' },
    { id: 'peat', name: 'Peat Areas', color: 'amber', icon: '🏔️' }
  ];

  const getOverlayData = (overlayType) => {
    if (!mapData || !mapData.metrics) return null;

    const metrics = {};
    mapData.metrics.forEach(metric => {
      metrics[metric.key] = metric.baseline;
    });

    switch (overlayType) {
      case 'biodiversity':
        return {
          title: 'Biodiversity Metrics',
          items: [
            { label: 'BNG Units', value: metrics['habitat_bng_units']?.toFixed(1) || '0' },
            { label: 'BNG Density', value: metrics['habitat_bng_density']?.toFixed(2) || '0' },
            { label: 'Habitat Cover', value: `${(metrics['habitat_cover_percentage'] * 100)?.toFixed(1) || '0'}%` },
            { label: 'No. of Habitats', value: metrics['number_of_habitats'] || '0' },
            { label: 'Connectedness', value: `${(metrics['connectedness_percentage'] * 100)?.toFixed(1) || '0'}%` }
          ]
        };
      case 'carbon':
        return {
          title: 'Carbon Storage & Sequestration',
          items: [
            { label: 'Carbon Sequestration', value: `${metrics['carbon_sequestration_tco2e']?.toFixed(1) || '0'} tCO2e/yr` },
            { label: 'Carbon Value', value: `£${((metrics['carbon_sequestration_asset_value'] || 0) * 1000).toLocaleString()}` },
            { label: 'Air Quality Value', value: `£${((metrics['air_quality_regulation_asset_value'] || 0) * 1000).toLocaleString()}` }
          ]
        };
      case 'water':
        return {
          title: 'Water Quality & Management',
          items: [
            { label: 'WFD Condition', value: metrics['wfd_minimum_ecological_condition'] || 'Unknown' },
            { label: 'Poor Quality', value: `${(metrics['wfd_poor_percentage'] * 100)?.toFixed(1) || '0'}%` },
            { label: 'Good Quality', value: `${(metrics['wfd_good_percentage'] * 100)?.toFixed(1) || '0'}%` },
            { label: 'Moderate Quality', value: `${(metrics['wfd_moderate_percentage'] * 100)?.toFixed(1) || '0'}%` },
            { label: 'Management Catchment', value: metrics['management_catchments'] || 'Unknown' }
          ]
        };
      case 'habitat':
        return {
          title: 'Habitat Quality & Management',
          items: [
            { label: 'Largest Connected Area', value: `${metrics['largest_connected_area']?.toFixed(1) || '0'} ha` },
            { label: 'Unconnected Components', value: metrics['unconnected_components'] || '0' },
            { label: 'Core to Edge Support', value: `${(metrics['core_to_edge_percentage'] * 100)?.toFixed(1) || '0'}%` },
            { label: 'Winter Cover', value: `${(metrics['winter_cover_percentage'] * 100)?.toFixed(1) || '0'}%` }
          ]
        };
      case 'flood':
        return {
          title: 'Flood Risk Management',
          items: [
            { label: 'Flood Zone Area', value: `${metrics['floodzone_area_ha']?.toFixed(1) || '0'} ha` },
            { label: 'Flood Zone %', value: `${(metrics['floodzone_area_percentage'] * 100)?.toFixed(1) || '0'}%` },
            { label: 'Productive in Flood Zone', value: `${metrics['productive_floodzone_area_ha']?.toFixed(1) || '0'} ha` },
            { label: 'Water Stressed Area', value: `${metrics['productive_land_water_stressed_area_ha']?.toFixed(1) || '0'} ha` }
          ]
        };
      case 'peat':
        return {
          title: 'Peat & Soil Management',
          items: [
            { label: 'Peat Area', value: `${metrics['peat_area_ha']?.toFixed(1) || '0'} ha` },
            { label: 'Peat %', value: `${(metrics['peat_area_percentage'] * 100)?.toFixed(1) || '0'}%` },
            { label: 'Productive on Peat', value: `${metrics['productive_peat_area_ha']?.toFixed(1) || '0'} ha` },
            { label: 'Total Productive Area', value: `${metrics['total_productive_area']?.toFixed(1) || '0'} ha` }
          ]
        };
      default:
        return null;
    }
  };

  const overlayData = getOverlayData(selectedOverlay);

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Environmental Map View</h3>
            <p className="text-sm text-gray-600">Interactive map showing environmental metrics and overlays</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Overlay Toggle */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Overlay:</label>
              <select
                value={selectedOverlay}
                onChange={(e) => setSelectedOverlay(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-green-500 focus:border-green-500"
              >
                {overlayOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.icon} {option.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Info Toggle */}
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                showInfo 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showInfo ? 'Hide Info' : 'Show Info'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Map Container */}
        <div className="flex-1 relative">
          <div
            ref={mapContainerRef}
            className="w-full h-96 lg:h-[600px] bg-gray-100 rounded-bl-xl lg:rounded-bl-none lg:rounded-l-xl"
          />
          
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-bl-xl lg:rounded-bl-none lg:rounded-l-xl">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
        </div>

        {/* Info Panel */}
        {showInfo && overlayData && (
          <div className="w-full lg:w-80 p-6 bg-gray-50 rounded-br-xl lg:rounded-br-none lg:rounded-r-xl border-l border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">
                {overlayOptions.find(o => o.id === selectedOverlay)?.icon}
              </span>
              {overlayData.title}
            </h4>
            
            <div className="space-y-3">
              {overlayData.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  <span className="text-sm text-gray-900 font-semibold">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Map Legend */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Legend</h5>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Farm Location</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-gray-600">High Environmental Value</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span className="text-xs text-gray-600">Moderate Environmental Value</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span className="text-xs text-gray-600">Environmental Risk Areas</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            {mapData && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Quick Stats</h5>
                <div className="bg-white p-3 rounded-lg space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Total Area:</span>
                    <span className="font-semibold">{mapData.baseLineArea?.toFixed(1)} ha</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Status:</span>
                    <span className={`font-semibold ${mapData.status === 'accepted' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {mapData.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Processing:</span>
                    <span className={`font-semibold ${mapData.processingStatus === 'finished' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {mapData.processingStatus}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NatureMap;