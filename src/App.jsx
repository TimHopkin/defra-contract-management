import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Map Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong with the map</h1>
              <p className="text-gray-600 mb-6">
                There was an error displaying the map. This might be due to invalid geographic data or a map rendering issue.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
                >
                  Reload Page
                </button>
                <button
                  onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                  className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg transition duration-300"
                >
                  Try Again
                </button>
              </div>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Show Error Details (Development)
                  </summary>
                  <div className="mt-2 p-4 bg-gray-100 rounded-md text-xs font-mono text-red-600 overflow-auto">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error && this.state.error.toString()}
                    </div>
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                    </div>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Import Leaflet CSS and JS via CDN for direct use in the environment
const leafletCss = document.createElement('link');
leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
leafletCss.rel = 'stylesheet';
document.head.appendChild(leafletCss);

const leafletJs = document.createElement('script');
leafletJs.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
leafletJs.async = true;
document.head.appendChild(leafletJs);

// Load Proj4js for coordinate transformations
const proj4Js = document.createElement('script');
proj4Js.src = 'https://unpkg.com/proj4@2.9.2/dist/proj4.js';
proj4Js.async = true;
document.head.appendChild(proj4Js);

// Load Leaflet MarkerCluster for better performance with loading detection
const clusterCss = document.createElement('link');
clusterCss.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
clusterCss.rel = 'stylesheet';
clusterCss.onerror = () => console.warn('Failed to load MarkerCluster CSS');
document.head.appendChild(clusterCss);

const clusterDefaultCss = document.createElement('link');
clusterDefaultCss.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
clusterDefaultCss.rel = 'stylesheet';
clusterDefaultCss.onerror = () => console.warn('Failed to load MarkerCluster Default CSS');
document.head.appendChild(clusterDefaultCss);

const clusterJs = document.createElement('script');
clusterJs.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
clusterJs.async = true;
clusterJs.onerror = () => {
  console.warn('Failed to load MarkerCluster JS - clustering will be disabled');
  window.leafletClusteringAvailable = false;
};
clusterJs.onload = () => {
  console.log('MarkerCluster loaded successfully');
  window.leafletClusteringAvailable = true;
};
document.head.appendChild(clusterJs);

// Add loading detection for Leaflet itself
leafletJs.onerror = () => {
  console.error('Failed to load Leaflet JS');
  window.leafletAvailable = false;
};
leafletJs.onload = () => {
  console.log('Leaflet loaded successfully');
  window.leafletAvailable = true;
};

// Add loading detection for Proj4
proj4Js.onerror = () => {
  console.warn('Failed to load Proj4 JS - coordinate transformation may not work correctly');
  window.proj4Available = false;
};
proj4Js.onload = () => {
  console.log('Proj4 loaded successfully');
  window.proj4Available = true;
};

// Load Leaflet Control Geocoder for address search
const geocoderCss = document.createElement('link');
geocoderCss.href = 'https://unpkg.com/leaflet-control-geocoder@2.4.0/dist/Control.Geocoder.css';
geocoderCss.rel = 'stylesheet';
geocoderCss.onerror = () => console.warn('Failed to load Geocoder CSS');
document.head.appendChild(geocoderCss);

const geocoderJs = document.createElement('script');
geocoderJs.src = 'https://unpkg.com/leaflet-control-geocoder@2.4.0/dist/Control.Geocoder.js';
geocoderJs.async = true;
geocoderJs.onerror = () => {
  console.warn('Failed to load Geocoder JS - address search will be disabled');
  window.leafletGeocoderAvailable = false;
};
geocoderJs.onload = () => {
  console.log('Leaflet Control Geocoder loaded successfully');
  window.leafletGeocoderAvailable = true;
};
document.head.appendChild(geocoderJs);

// Contract Management Modal Component
const ContractModal = ({ plan, initialContractData, userId, onSave, onClose, loading }) => {
  const [contractDetails, setContractDetails] = useState(initialContractData || {
    status: 'Draft',
    contract_start_date: '',
    contract_end_date: '',
    public_funding: '',
    private_funding: '',
    environmental_actions: '',
    targeted_outcomes: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setContractDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(plan.id, {
      ...contractDetails,
      plan_name: plan.name,
      land_app_plan_id: plan.id,
      updated_at: new Date().toISOString(),
      updated_by: userId,
      // Only set created_at if it's a new contract
      created_at: initialContractData?.created_at || new Date().toISOString(),
      created_by: initialContractData?.created_by || userId,
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-indigo-700 mb-4">Manage Contract for: {plan.name}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="contractStatus" className="block text-sm font-medium text-gray-700 mb-1">Status:</label>
            <select
              id="contractStatus"
              name="status"
              value={contractDetails.status}
              onChange={handleChange}
              className="p-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
          <div>
            <label htmlFor="contractStartDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date:</label>
            <input
              type="date"
              id="contractStartDate"
              name="contract_start_date"
              value={contractDetails.contract_start_date}
              onChange={handleChange}
              className="p-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="contractEndDate" className="block text-sm font-medium text-gray-700 mb-1">End Date:</label>
            <input
              type="date"
              id="contractEndDate"
              name="contract_end_date"
              value={contractDetails.contract_end_date}
              onChange={handleChange}
              className="p-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="publicFunding" className="block text-sm font-medium text-gray-700 mb-1">Public Funding (£):</label>
            <input
              type="number"
              id="publicFunding"
              name="public_funding"
              value={contractDetails.public_funding}
              onChange={handleChange}
              className="p-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="privateFunding" className="block text-sm font-medium text-gray-700 mb-1">Private Funding (£):</label>
            <input
              type="number"
              id="privateFunding"
              name="private_funding"
              value={contractDetails.private_funding}
              onChange={handleChange}
              className="p-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="environmentalActions" className="block text-sm font-medium text-gray-700 mb-1">Agreed Environmental Actions:</label>
          <textarea
            id="environmentalActions"
            name="environmental_actions"
            value={contractDetails.environmental_actions}
            onChange={handleChange}
            rows="3"
            className="p-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Create 5ha of wildflower meadow, restore 1km of hedgerow."
          ></textarea>
        </div>

        <div className="mb-6">
          <label htmlFor="targetedOutcomes" className="block text-sm font-medium text-gray-700 mb-1">Targeted Environmental Outcomes:</label>
          <textarea
            id="targetedOutcomes"
            name="targeted_outcomes"
            value={contractDetails.targeted_outcomes}
            onChange={handleChange}
            rows="3"
            className="p-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Increase biodiversity by 20%, sequester 100 tonnes of carbon."
          ></textarea>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out transform hover:scale-105"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Contract Details'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Initialize coordinate transformations when proj4 is available
const initializeProjections = () => {
  if (typeof window.proj4 !== 'undefined') {
    // Define British National Grid projection (EPSG:27700)
    window.proj4.defs("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs");
    
    console.log("Coordinate transformations initialized: BNG (EPSG:27700) to WGS84 (EPSG:4326)");
    return true;
  }
  return false;
};

// Transform coordinates from British National Grid to WGS84
const transformCoordinates = (coordinates, geometryType) => {
  if (!window.proj4Available || !window.proj4) {
    console.warn("Proj4js not loaded or not available, coordinates may not display correctly");
    return coordinates;
  }

  const transformPoint = (coord) => {
    try {
      // coord is [easting, northing] in BNG, need to transform to [lng, lat] in WGS84
      const [easting, northing] = coord;
      
      // Validate BNG coordinates (rough bounds check)
      if (easting < 0 || easting > 800000 || northing < 0 || northing > 1400000) {
        console.warn("Coordinates may not be in British National Grid format:", coord);
      }
      
      const transformed = window.proj4("EPSG:27700", "EPSG:4326", [easting, northing]);
      
      // Validate transformed coordinates (should be within UK bounds roughly)
      const [lng, lat] = transformed;
      if (lng < -8 || lng > 2 || lat < 49 || lat > 61) {
        console.warn("Transformed coordinates outside expected UK bounds:", transformed);
      }
      
      return [lng, lat]; // [lng, lat]
    } catch (error) {
      console.error("Error transforming coordinates:", error, coord);
      return coord; // Return original if transformation fails
    }
  };

  const transformCoordinateArray = (coords, depth) => {
    if (depth === 0) {
      // This is a coordinate pair [x, y]
      return transformPoint(coords);
    } else {
      // This is an array of coordinates or coordinate arrays
      return coords.map(coord => transformCoordinateArray(coord, depth - 1));
    }
  };

  // Determine the depth of coordinate nesting based on geometry type
  let depth;
  switch (geometryType) {
    case 'Point':
      depth = 0; // [[x, y]]
      break;
    case 'LineString':
    case 'MultiPoint':
      depth = 1; // [[[x, y], [x, y], ...]]
      break;
    case 'Polygon':
    case 'MultiLineString':
      depth = 2; // [[[[x, y], [x, y], ...]], ...]
      break;
    case 'MultiPolygon':
      depth = 3; // [[[[[x, y], [x, y], ...]], ...], ...]
      break;
    default:
      console.warn("Unknown geometry type:", geometryType);
      return coordinates;
  }

  return transformCoordinateArray(coordinates, depth);
};

// Transform GeoJSON from British National Grid to WGS84
const transformGeoJSON = (geojsonFeatures) => {
  if (!geojsonFeatures || !Array.isArray(geojsonFeatures)) {
    console.warn("Invalid GeoJSON features provided:", geojsonFeatures);
    return [];
  }

  console.log("Transforming", geojsonFeatures.length, "features from BNG to WGS84");
  
  let successCount = 0;
  let errorCount = 0;

  const transformedFeatures = geojsonFeatures.filter(feature => {
    // Filter out completely invalid features
    return feature && feature.geometry && feature.geometry.coordinates;
  }).map((feature, index) => {
    try {
      // Validate geometry type
      if (!feature.geometry.type) {
        console.warn(`Feature ${index} has no geometry type:`, feature);
        errorCount++;
        return null;
      }

      const originalSample = feature.geometry.coordinates[0] || feature.geometry.coordinates;
      
      const transformedCoordinates = transformCoordinates(
        feature.geometry.coordinates,
        feature.geometry.type
      );

      // Validate transformed coordinates
      if (!transformedCoordinates || (Array.isArray(transformedCoordinates) && transformedCoordinates.length === 0)) {
        console.warn(`Feature ${index} transformation resulted in empty coordinates`);
        errorCount++;
        return null;
      }

      const transformedSample = transformedCoordinates[0] || transformedCoordinates;
      
      console.log(`Feature ${index} (${feature.geometry.type}): [${originalSample}] → [${transformedSample}]`);

      successCount++;
      return {
        ...feature,
        geometry: {
          ...feature.geometry,
          coordinates: transformedCoordinates
        }
      };
    } catch (error) {
      console.error(`Error transforming GeoJSON feature ${index}:`, error, feature);
      errorCount++;
      return null; // Return null for failed transformations
    }
  }).filter(feature => feature !== null); // Remove null features

  console.log(`Coordinate transformation complete: ${successCount} successful, ${errorCount} errors`);
  return transformedFeatures;
};

// Map Display Component
const MapDisplay = ({ geojsonFeatures }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef([]);

  useEffect(() => {
    if (!window.leafletAvailable || typeof window.L === 'undefined' || !mapContainerRef.current) {
      console.warn("Leaflet not loaded or map container not ready.");
      return;
    }

    // Initialize projections if proj4 is available
    if (window.proj4Available && typeof window.proj4 !== 'undefined') {
      initializeProjections();
    } else {
      console.warn("Proj4 not available - coordinate transformation may not work correctly");
    }

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = window.L.map(mapContainerRef.current, {
        center: [51.505, -0.09],
        zoom: 6,
        zoomControl: false
      });

      window.L.control.zoom({
        position: 'topright'
      }).addTo(mapInstanceRef.current);

      window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing layers safely
    try {
      layersRef.current.forEach(layer => {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
      layersRef.current = [];
    } catch (error) {
      console.warn('Error removing layers:', error);
    }

    if (geojsonFeatures && geojsonFeatures.length > 0) {
      try {
        // Transform coordinates from British National Grid to WGS84
        const transformedFeatures = transformGeoJSON(geojsonFeatures);
        
        if (!transformedFeatures || transformedFeatures.length === 0) {
          console.warn('No valid features after transformation');
          map.setView([51.505, -0.09], 6);
          return;
        }
        
        console.log("Original features sample:", geojsonFeatures[0]?.geometry?.coordinates?.slice(0, 2));
        console.log("Transformed features sample:", transformedFeatures[0]?.geometry?.coordinates?.slice(0, 2));

        const geoJsonLayer = window.L.geoJSON(transformedFeatures, {
        style: function (feature) {
          return {
            color: '#3b82f6',
            weight: 3,
            opacity: 0.8,
            fillColor: '#60a5fa',
            fillOpacity: 0.3
          };
        },
        onEachFeature: function (feature, layer) {
          if (feature.properties) {
            let popupContent = `<strong>Feature ID:</strong> ${feature.id || 'N/A'}<br/>`;
            // Add coordinate system info
            popupContent += `<strong>Coordinate System:</strong> WGS84 (transformed from BNG)<br/>`;
            for (const key in feature.properties) {
              popupContent += `<strong>${key}:</strong> ${feature.properties[key]}<br/>`;
            }
            layer.bindPopup(popupContent);
          }
        }
      }).addTo(map);
      
      // Track the layer for safe removal
      layersRef.current.push(geoJsonLayer);

        // Fit map to transformed bounds
        try {
          const bounds = geoJsonLayer.getBounds();
          if (bounds && bounds.isValid()) {
            map.fitBounds(bounds);
            console.log("Map fitted to transformed feature bounds");
          } else {
            console.warn("Invalid bounds from GeoJSON layer");
            map.setView([51.505, -0.09], 6);
          }
        } catch (error) {
          console.error("Error fitting map bounds:", error);
          map.setView([51.505, -0.09], 6); // Fallback to UK center
        }
      } catch (error) {
        console.error("Error creating GeoJSON layer:", error);
        map.setView([51.505, -0.09], 6);
      }
    } else {
      map.setView([51.505, -0.09], 6);
    }

    return () => {
      try {
        if (mapInstanceRef.current) {
          // Clean up layers first
          layersRef.current.forEach(layer => {
            if (mapInstanceRef.current.hasLayer(layer)) {
              mapInstanceRef.current.removeLayer(layer);
            }
          });
          layersRef.current = [];
          
          // Remove the map
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      } catch (error) {
        console.warn('Error cleaning up map:', error);
      }
    };
  }, [geojsonFeatures]);

  return <div ref={mapContainerRef} className="w-full h-[500px] rounded-md shadow-inner" style={{ minHeight: '300px' }}></div>;
};

// Helper function to get color for plan types
const getPlanTypeColor = (planType) => {
  const colors = {
    'BPS': { color: '#3b82f6', fillColor: '#60a5fa' },
    'CSS': { color: '#10b981', fillColor: '#34d399' },
    'CSS_2025': { color: '#10b981', fillColor: '#34d399' },
    'SFI2022': { color: '#8b5cf6', fillColor: '#a78bfa' },
    'SFI2023': { color: '#8b5cf6', fillColor: '#a78bfa' },
    'SFI2024': { color: '#8b5cf6', fillColor: '#a78bfa' },
    'UKHAB': { color: '#f59e0b', fillColor: '#fbbf24' },
    'UKHAB_V2': { color: '#f59e0b', fillColor: '#fbbf24' },
    'LAND_MANAGEMENT': { color: '#6366f1', fillColor: '#818cf8' },
    'LAND_MANAGEMENT_V2': { color: '#6366f1', fillColor: '#818cf8' },
    'PEAT_ASSESSMENT': { color: '#f97316', fillColor: '#fb923c' },
    'OSMM': { color: '#6b7280', fillColor: '#9ca3af' },
    'USER': { color: '#64748b', fillColor: '#94a3b8' },
    'ESS': { color: '#059669', fillColor: '#10b981' },
    'FER': { color: '#65a30d', fillColor: '#84cc16' },
    'HEALTHY_HEDGEROWS': { color: '#0d9488', fillColor: '#14b8a6' },
  };
  return colors[planType] || { color: '#06b6d4', fillColor: '#22d3ee' };
};

// Multi-Plan Map Display Component
const MultiPlanMapDisplay = ({ plans, onPlanClick, onViewFeatures, apiKey, loading }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef([]);
  const clusterGroupRef = useRef(null);
  const baseLayers = useRef({});
  const [planFeatures, setPlanFeatures] = useState({});
  const [loadingFeatures, setLoadingFeatures] = useState(false);

  useEffect(() => {
    if (!window.leafletAvailable || typeof window.L === 'undefined' || !mapContainerRef.current) {
      console.warn("Leaflet not loaded or map container not ready.");
      return;
    }

    // Initialize projections if proj4 is available
    if (window.proj4Available && typeof window.proj4 !== 'undefined') {
      initializeProjections();
    } else {
      console.warn("Proj4 not available - coordinate transformation may not work correctly");
    }

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = window.L.map(mapContainerRef.current, {
        center: [51.505, -0.09],
        zoom: 6,
        zoomControl: false
      });

      // Create base layers
      const satelliteLayer = window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      });

      const osmLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      });

      const osmHumanitarianLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a>'
      });

      // Add default layer
      satelliteLayer.addTo(mapInstanceRef.current);

      // Store layers for layer control
      baseLayers.current = {
        "Satellite": satelliteLayer,
        "OpenStreetMap": osmLayer,
        "Humanitarian": osmHumanitarianLayer
      };

      // Add layer control
      window.L.control.layers(baseLayers.current, null, {
        position: 'topright'
      }).addTo(mapInstanceRef.current);

      // Add zoom control below layer control
      window.L.control.zoom({
        position: 'topright'
      }).addTo(mapInstanceRef.current);

      // Add scale control
      window.L.control.scale({
        position: 'bottomleft',
        imperial: false
      }).addTo(mapInstanceRef.current);

      // Add geocoder search control if available
      if (window.leafletGeocoderAvailable && window.L.Control && window.L.Control.Geocoder) {
        try {
          const geocoder = window.L.Control.geocoder({
            defaultMarkGeocode: false,
            position: 'topleft',
            placeholder: 'Search for places...',
            errorMessage: 'No results found',
            geocoder: window.L.Control.Geocoder.nominatim({
              geocodingQueryParams: {
                countrycodes: 'gb', // Limit to UK
                bounded: 1,
                viewbox: '-8.5,49.5,2.0,61.0' // UK bounding box
              }
            })
          })
          .on('markgeocode', function(e) {
            const latlng = e.geocode.center;
            mapInstanceRef.current.setView(latlng, 15);
            
            // Add a temporary marker
            const marker = window.L.marker(latlng)
              .addTo(mapInstanceRef.current)
              .bindPopup(`<strong>${e.geocode.name}</strong><br/><small>Search result</small>`)
              .openPopup();
            
            // Remove marker after 5 seconds
            setTimeout(() => {
              if (mapInstanceRef.current && mapInstanceRef.current.hasLayer(marker)) {
                mapInstanceRef.current.removeLayer(marker);
              }
            }, 5000);
          })
          .addTo(mapInstanceRef.current);
          
          console.log('✅ Geocoder search control added to map');
        } catch (error) {
          console.warn('Failed to add geocoder control:', error);
        }
      } else {
        console.log('Geocoder not available, skipping search control');
      }
    }

    return () => {
      try {
        if (mapInstanceRef.current) {
          // Clean up all layers and cluster groups
          if (clusterGroupRef.current && mapInstanceRef.current.hasLayer(clusterGroupRef.current)) {
            mapInstanceRef.current.removeLayer(clusterGroupRef.current);
            clusterGroupRef.current = null;
          }
          
          layersRef.current.forEach(layer => {
            if (mapInstanceRef.current.hasLayer(layer)) {
              mapInstanceRef.current.removeLayer(layer);
            }
          });
          layersRef.current = [];
          
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      } catch (error) {
        console.warn('Error cleaning up multi-plan map:', error);
      }
    };
  }, []);

  // Load features for all plans when plans change
  useEffect(() => {
    if (plans.length === 0 || !apiKey) {
      console.log('Map features loading skipped:', { plansCount: plans.length, hasApiKey: !!apiKey });
      return;
    }

    const loadAllPlanFeatures = async () => {
      console.log(`Starting to load features for ${plans.length} plans`);
      setLoadingFeatures(true);
      const newPlanFeatures = {};
      let totalFeatures = 0;
      let successfulPlans = 0;
      let failedPlans = 0;
      
      try {
        // Load features for each plan (limit to avoid API overload - more plans for better map experience)
        const maxPlansToLoad = 50;
        const plansToLoad = plans.slice(0, maxPlansToLoad);
        console.log(`Loading features for ${plansToLoad.length} plans (limited from ${plans.length})`);
        
        const planPromises = plansToLoad.map(async (plan) => {
          try {
            const url = `https://integration-api.thelandapp.com/projects/${plan.id}/features?apiKey=${apiKey}&page=0&size=1000`;
            console.log(`Fetching features for plan ${plan.id} (${plan.name}):`, url);
            
            const response = await fetch(url);
            if (response.ok) {
              const data = await response.json();
              console.log(`Plan ${plan.id} API response:`, {
                hasData: !!data.data,
                featureCount: data.data ? data.data.length : 0,
                dataKeys: data ? Object.keys(data) : [],
                sampleFeature: data.data && data.data.length > 0 ? data.data[0] : null
              });
              
              if (data.data && data.data.length > 0) {
                newPlanFeatures[plan.id] = {
                  plan: plan,
                  features: data.data
                };
                totalFeatures += data.data.length;
                successfulPlans++;
                console.log(`✅ Plan ${plan.id}: loaded ${data.data.length} features`);
              } else {
                console.log(`⚠️ Plan ${plan.id}: no features found`);
              }
            } else {
              console.error(`❌ Plan ${plan.id}: HTTP ${response.status} - ${response.statusText}`);
              failedPlans++;
            }
          } catch (error) {
            console.error(`❌ Plan ${plan.id}: Failed to load features:`, error);
            failedPlans++;
          }
        });

        await Promise.all(planPromises);
        
        console.log('Feature loading complete:', {
          totalPlans: plansToLoad.length,
          successfulPlans,
          failedPlans,
          totalFeatures,
          plansWithFeatures: Object.keys(newPlanFeatures).length
        });
        
        setPlanFeatures(newPlanFeatures);
      } catch (error) {
        console.error('Error loading plan features:', error);
      } finally {
        setLoadingFeatures(false);
      }
    };

    loadAllPlanFeatures();
  }, [plans, apiKey]);

  // Update map display when features change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) {
      console.log('Map update skipped: no map instance');
      return;
    }

    console.log('Updating map display with features:', {
      planFeaturesKeys: Object.keys(planFeatures),
      totalPlansWithFeatures: Object.keys(planFeatures).length,
      mapExists: !!map
    });

    // Remove existing layers safely
    try {
      // Remove cluster group if it exists
      if (clusterGroupRef.current && map.hasLayer(clusterGroupRef.current)) {
        console.log('Removing existing cluster group');
        map.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current = null;
      }
      
      // Remove all tracked layers
      console.log(`Removing ${layersRef.current.length} existing layers`);
      layersRef.current.forEach(layer => {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
      layersRef.current = [];
    } catch (error) {
      console.warn('Error removing layers:', error);
    }

    if (Object.keys(planFeatures).length === 0) {
      console.log('No plan features to display, setting default map view');
      map.setView([51.505, -0.09], 6);
      return;
    }

    const allLayers = [];

    // Create cluster group if MarkerCluster is available and we have many plans
    if (window.leafletClusteringAvailable && typeof window.L.MarkerClusterGroup !== 'undefined' && Object.keys(planFeatures).length > 5) {
      try {
        clusterGroupRef.current = window.L.markerClusterGroup({
          chunkedLoading: true,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          maxClusterRadius: 80
        });
        console.log('Cluster group created for', Object.keys(planFeatures).length, 'plans');
      } catch (error) {
        console.warn('Failed to create cluster group:', error);
        clusterGroupRef.current = null;
      }
    } else if (Object.keys(planFeatures).length > 5) {
      console.log('Clustering disabled: MarkerCluster not available or not loaded');
    }

    // Add features for each plan
    console.log(`Processing ${Object.values(planFeatures).length} plans with features`);
    Object.values(planFeatures).forEach(({ plan, features }) => {
      if (features && features.length > 0) {
        console.log(`Processing plan ${plan.id} (${plan.name}) with ${features.length} features`);
        console.log('Sample feature geometry:', features[0]?.geometry);
        
        try {
          const transformedFeatures = transformGeoJSON(features);
          
          if (!transformedFeatures || transformedFeatures.length === 0) {
            console.warn(`No valid features for plan ${plan.id} after transformation`);
            return;
          }
          
          console.log(`Plan ${plan.id}: ${features.length} original → ${transformedFeatures.length} transformed features`);
          console.log('Sample transformed feature:', transformedFeatures[0]?.geometry);
          
          const planColors = getPlanTypeColor(plan.planType);
          console.log(`Plan ${plan.id} colors:`, planColors);
          
          const geoJsonLayer = window.L.geoJSON(transformedFeatures, {
          style: function (feature) {
            return {
              color: planColors.color,
              weight: 2,
              opacity: 0.8,
              fillColor: planColors.fillColor,
              fillOpacity: 0.3
            };
          },
          onEachFeature: function (feature, layer) {
            let popupContent = `
              <div class="p-2">
                <h4 class="font-bold text-sm text-indigo-700 mb-2">${plan.name}</h4>
                <div class="text-xs space-y-1">
                  <div><strong>Plan Type:</strong> ${plan.planType}</div>
                  <div><strong>Plan ID:</strong> ${plan.id}</div>
                  <div><strong>Created:</strong> ${new Date(plan.createdAt).toLocaleDateString()}</div>
                  <div><strong>Updated:</strong> ${new Date(plan.updatedAt).toLocaleDateString()}</div>
                </div>
                <div class="mt-2">
                  <button onclick="window.handleViewPlanFeatures('${plan.id}')" 
                    class="px-3 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors">
                    View Features
                  </button>
                </div>
              </div>
            `;
            layer.bindPopup(popupContent, { maxWidth: 300 });
          }
        }).addTo(map);

        console.log(`✅ Plan ${plan.id}: GeoJSON layer created and added to map`);
        console.log('Layer bounds:', {
          hasBounds: !!geoJsonLayer.getBounds,
          bounds: geoJsonLayer.getBounds ? geoJsonLayer.getBounds() : null
        });

        allLayers.push(geoJsonLayer);
        layersRef.current.push(geoJsonLayer);

          // If clustering is enabled, also add a centroid marker for clustering
          if (clusterGroupRef.current) {
            try {
              const bounds = geoJsonLayer.getBounds();
              
              if (!bounds || !bounds.isValid()) {
                console.warn(`Invalid bounds for plan ${plan.id}, skipping centroid marker`);
                return;
              }
              
              const center = bounds.getCenter();
            
            // Create a custom icon for plan markers
            const isMobile = window.innerWidth < 640;
            const iconSize = isMobile ? 20 : 24;
            const fontSize = isMobile ? 8 : 10;
            
            const planIcon = window.L.divIcon({
              className: 'plan-marker',
              html: `<div style="background-color: ${planColors.fillColor}; border: 2px solid ${planColors.color}; width: ${iconSize}px; height: ${iconSize}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: ${fontSize}px; font-weight: bold; color: white; text-shadow: 1px 1px 1px rgba(0,0,0,0.5);">${plan.planType.charAt(0)}</div>`,
              iconSize: [iconSize, iconSize],
              iconAnchor: [iconSize/2, iconSize/2]
            });

              const marker = window.L.marker(center, { icon: planIcon });
              marker.bindPopup(popupContent, { maxWidth: 300 });
              clusterGroupRef.current.addLayer(marker);
            } catch (error) {
              console.warn('Failed to create centroid marker for plan:', plan.id, error);
            }
          }
        } catch (error) {
          console.error(`Error creating GeoJSON layer for plan ${plan.id}:`, error);
        }
      }
    });

    // Add cluster group to map if created
    if (clusterGroupRef.current) {
      try {
        map.addLayer(clusterGroupRef.current);
      } catch (error) {
        console.warn('Failed to add cluster group to map:', error);
      }
    }

    // Fit map to all features
    console.log(`Final step: fitting map to ${allLayers.length} layers`);
    if (allLayers.length > 0) {
      try {
        const group = new window.L.featureGroup(allLayers);
        const bounds = group.getBounds();
        
        console.log('Combined bounds:', {
          bounds: bounds,
          isValid: bounds ? bounds.isValid() : false,
          southwest: bounds ? bounds.getSouthWest() : null,
          northeast: bounds ? bounds.getNorthEast() : null
        });
        
        if (bounds && bounds.isValid()) {
          map.fitBounds(bounds.pad(0.1));
          console.log('✅ Map fitted to feature bounds');
        } else {
          console.warn("Invalid bounds from feature group, using default view");
          map.setView([51.505, -0.09], 6);
        }
      } catch (error) {
        console.error("Error fitting map bounds:", error);
        map.setView([51.505, -0.09], 6);
      }
    } else {
      console.log('No layers to fit map bounds to, using default view');
      map.setView([51.505, -0.09], 6);
    }
  }, [planFeatures]);

  // Set up global handlers for popup buttons
  useEffect(() => {
    window.handleViewPlanFeatures = (planId) => {
      const plan = plans.find(p => p.id === planId);
      if (plan && onViewFeatures) {
        onViewFeatures(plan);
      }
    };

    return () => {
      delete window.handleViewPlanFeatures;
    };
  }, [plans, onViewFeatures]);

  // Create refresh function for the map
  const refreshMapFeatures = async () => {
    if (plans.length === 0 || !apiKey) {
      return;
    }

    console.log('Refreshing map features...');
    setLoadingFeatures(true);
    const newPlanFeatures = {};
    let totalFeatures = 0;
    let successfulPlans = 0;
    let failedPlans = 0;
    
    try {
      // Load features for each plan (limit to avoid API overload - more plans for better map experience)
      const maxPlansToLoad = 50;
      const plansToLoad = plans.slice(0, maxPlansToLoad);
      console.log(`Refreshing features for ${plansToLoad.length} plans (limited from ${plans.length})`);
      
      const planPromises = plansToLoad.map(async (plan) => {
        try {
          const url = `https://integration-api.thelandapp.com/projects/${plan.id}/features?apiKey=${apiKey}&page=0&size=1000`;
          console.log(`Refreshing features for plan ${plan.id} (${plan.name}):`, url);
          
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            console.log(`Plan ${plan.id} API response:`, {
              hasData: !!data.data,
              featuresCount: data.data ? data.data.length : 0,
              planName: plan.name
            });
            
            if (data.data && Array.isArray(data.data) && data.data.length > 0) {
              newPlanFeatures[plan.id] = {
                plan: plan,
                features: data.data
              };
              totalFeatures += data.data.length;
              successfulPlans++;
              console.log(`✅ Plan ${plan.id}: Loaded ${data.data.length} features`);
            } else {
              console.log(`⚠️ Plan ${plan.id}: No features in response`);
            }
          } else {
            console.error(`Failed to fetch features for plan ${plan.id}:`, response.status, response.statusText);
            failedPlans++;
          }
        } catch (error) {
          console.error(`Error fetching features for plan ${plan.id}:`, error);
          failedPlans++;
        }
      });
      
      await Promise.all(planPromises);
      
      console.log('Map features refresh summary:', {
        totalPlans: plansToLoad.length,
        successfulPlans,
        failedPlans,
        totalFeatures,
        plansWithFeatures: Object.keys(newPlanFeatures).length
      });
      
      setPlanFeatures(newPlanFeatures);
    } catch (error) {
      console.error('Error refreshing map features:', error);
    } finally {
      setLoadingFeatures(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Map Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {Object.keys(planFeatures).length > 0 && (
            <>Showing {Object.keys(planFeatures).length} plans with geographic features</>
          )}
        </div>
        <button
          onClick={refreshMapFeatures}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out transform hover:scale-105 flex items-center space-x-2"
          disabled={loadingFeatures || plans.length === 0}
          title="Refresh map data with latest features from Land App"
        >
          <span>🔄</span>
          <span className="text-sm">{loadingFeatures ? 'Refreshing...' : 'Refresh Map'}</span>
        </button>
      </div>

      {loadingFeatures && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-md text-sm">
          Loading map features for {Math.min(plans.length, 50)} of {plans.length} plans...
          {plans.length > 50 && (
            <div className="text-xs mt-1 text-blue-600">
              Showing first 50 plans for optimal performance. Use filters to narrow down your selection.
            </div>
          )}
        </div>
      )}
      
      {!loadingFeatures && plans.length > 0 && Object.keys(planFeatures).length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-md text-sm">
          <div className="font-medium">No geographic features found</div>
          <div className="text-xs mt-1">
            The selected plans don't have geographic data or features couldn't be loaded. 
            Check the browser console for detailed information.
          </div>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-[400px] sm:h-[500px] lg:h-[600px] rounded-md shadow-inner border border-gray-200" style={{ minHeight: '300px' }}></div>
      {Object.keys(planFeatures).length > 0 && (
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            Showing {Object.keys(planFeatures).length} plans with geographic features on the map.
            {plans.length > Object.keys(planFeatures).length && (
              <span> ({plans.length - Object.keys(planFeatures).length} plans have no geographic features)</span>
            )}
          </div>
          
          {/* Plan Type Legend */}
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Plan Type Legend</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
              {Array.from(new Set(Object.values(planFeatures).map(pf => pf.plan.planType))).sort().map(planType => {
                const colors = getPlanTypeColor(planType);
                return (
                  <div key={planType} className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded border-2" 
                      style={{ 
                        backgroundColor: colors.fillColor, 
                        borderColor: colors.color 
                      }}
                    ></div>
                    <span className="text-gray-700">{planType}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// View Toggle Component
const ViewToggle = ({ currentView, onViewChange }) => {
  return (
    <div className="flex items-center justify-center bg-gray-100 rounded-lg p-1 shadow-sm">
      <button
        onClick={() => onViewChange('table')}
        className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-md font-medium transition-all duration-200 ${
          currentView === 'table'
            ? 'bg-white text-indigo-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
        }`}
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18m-9 8h9m-9 4h9m-9-8h9m-9 4h9" />
        </svg>
        <span className="text-sm sm:text-base">Table</span>
      </button>
      <button
        onClick={() => onViewChange('map')}
        className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-md font-medium transition-all duration-200 ${
          currentView === 'map'
            ? 'bg-white text-indigo-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
        }`}
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <span className="text-sm sm:text-base">Map</span>
      </button>
    </div>
  );
};

// Help Guide Modal Component
const HelpGuideModal = ({ isOpen, onClose }) => {
  const [expandedSection, setExpandedSection] = useState('getting-started');

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const Section = ({ id, title, children }) => {
    const isExpanded = expandedSection === id;
    return (
      <div className="border border-gray-200 rounded-lg mb-4">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset transition-colors duration-200"
        >
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <svg
            className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="pt-4">
              {children}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-indigo-700">
              Land App API Analysis Tool - Help Guide
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Complete guide to using the Defra Environmental Contract Management Platform
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
            title="Close Help Guide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">

      <Section id="getting-started" title="🚀 Getting Started">
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800">What is this tool?</h4>
          <p className="text-gray-700">
            The Land App API Analysis Tool is designed to help you manage environmental contracts and land management plans. 
            It integrates with the Land App API to fetch and display your environmental plans, allowing you to view them in 
            both table and map formats, manage associated contracts, and export data.
          </p>
          
          <h4 className="font-semibold text-gray-800">Database Modes</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">
              <strong>🟢 Supabase Mode:</strong> Full cloud database functionality with data persistence and sync
            </p>
            <p className="text-sm text-gray-700">
              <strong>🟡 Local Storage Mode:</strong> Fallback mode that stores data locally in your browser
            </p>
          </div>

          <h4 className="font-semibold text-gray-800">First Steps</h4>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Enter your Land App API key in the input field at the top</li>
            <li>Click "Load Plans" to fetch your environmental plans</li>
            <li>Use the Table/Map tabs to switch between different views</li>
            <li>Start exploring your data!</li>
          </ol>
        </div>
      </Section>

      <Section id="land-app-api" title="🔗 Land App API Integration">
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800">Setting up API Access</h4>
          <p className="text-gray-700">
            To connect to the Land App API, you'll need a valid API key:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Obtain your API key from your Land App account</li>
            <li>Enter the key in the "Land App API Key" field</li>
            <li>Your key will be saved locally for future sessions</li>
            <li>Click "Load Plans" to fetch your data</li>
          </ol>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> Your API key is stored securely in your browser's local storage and is never sent to external servers.
            </p>
          </div>

          <h4 className="font-semibold text-gray-800">What Data is Fetched?</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>Environmental plans and their details</li>
            <li>Geographic boundaries and coordinates</li>
            <li>Plan types (BPS, CS, ELS, etc.)</li>
            <li>Creation and modification dates</li>
            <li>Associated map references</li>
          </ul>
        </div>
      </Section>

      <Section id="table-view" title="📊 Table View">
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800">Understanding the Table</h4>
          <p className="text-gray-700">
            The table view displays all your environmental plans in a structured format with the following columns:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li><strong>Plan Name:</strong> The name/identifier of your environmental plan</li>
            <li><strong>Plan Type:</strong> Type of scheme (BPS, CS, ELS, HLS, RDPE, SFI)</li>
            <li><strong>Created:</strong> When the plan was first created</li>
            <li><strong>Updated:</strong> When the plan was last modified</li>
            <li><strong>Actions:</strong> Available operations (View Details, Manage Contract)</li>
          </ul>

          <h4 className="font-semibold text-gray-800">Plan Type Colors</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span>BPS - Basic Payment Scheme</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span>CS - Countryside Stewardship</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span>ELS - Entry Level Stewardship</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-purple-500"></div>
              <span>HLS - Higher Level Stewardship</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span>RDPE - Rural Development</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-cyan-500"></div>
              <span>SFI - Sustainable Farming Incentive</span>
            </div>
          </div>

          <h4 className="font-semibold text-gray-800">Available Actions</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li><strong>View Details:</strong> Opens detailed plan information with features and geographic data</li>
            <li><strong>Manage Contract:</strong> Create or edit contracts associated with the plan</li>
            <li><strong>Download GeoJSON:</strong> Export plan boundaries as geographic data files</li>
          </ul>
        </div>
      </Section>

      <Section id="map-view" title="🗺️ Map View">
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800">Interactive Map Features</h4>
          <p className="text-gray-700">
            The map view provides a visual representation of your environmental plans with the following features:
          </p>
          
          <h4 className="font-semibold text-gray-800">Map Controls</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li><strong>Zoom:</strong> Use mouse wheel or +/- buttons to zoom in/out</li>
            <li><strong>Pan:</strong> Click and drag to move around the map</li>
            <li><strong>Reset View:</strong> Click the refresh button to return to default view</li>
            <li><strong>Geocoder:</strong> Search for specific locations using the search box</li>
          </ul>

          <h4 className="font-semibold text-gray-800">Plan Markers</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>Each plan is represented by a colored marker matching its type</li>
            <li>Click on markers to view plan details in a popup</li>
            <li>Markers are clustered when zoomed out for better performance</li>
            <li>Plan boundaries are drawn as colored polygons when available</li>
          </ul>

          <h4 className="font-semibold text-gray-800">Map Layers</h4>
          <p className="text-gray-700">
            The map uses OpenStreetMap tiles by default and includes:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>Satellite/street view base layer</li>
            <li>Plan boundary overlays</li>
            <li>Marker clustering for performance</li>
            <li>Interactive popups with plan information</li>
          </ul>
        </div>
      </Section>

      <Section id="filtering" title="🔍 Filtering & Search">
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800">Available Filters</h4>
          <p className="text-gray-700">
            Use the filter section to narrow down your plans based on various criteria:
          </p>
          
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li><strong>Plan Name:</strong> Search by plan name or partial text</li>
            <li><strong>Plan Type:</strong> Filter by scheme type (BPS, CS, ELS, etc.)</li>
            <li><strong>Date Range:</strong> Filter by creation or modification date</li>
            <li><strong>Contract Status:</strong> Show only plans with or without contracts</li>
          </ul>

          <h4 className="font-semibold text-gray-800">Using Filters</h4>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Expand the "Filters" section by clicking on it</li>
            <li>Set your desired filter criteria</li>
            <li>Filters are applied automatically as you type/select</li>
            <li>Use "Clear All Filters" to reset all filters at once</li>
          </ol>

          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>✅ Pro Tip:</strong> Filters work in both Table and Map views, and your filter settings are remembered between sessions.
            </p>
          </div>
        </div>
      </Section>

      <Section id="contracts" title="📋 Contract Management">
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800">What are Contracts?</h4>
          <p className="text-gray-700">
            Contracts are additional details you can associate with your environmental plans, such as:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>Contract reference numbers</li>
            <li>Payment amounts and schedules</li>
            <li>Start and end dates</li>
            <li>Special conditions or notes</li>
            <li>Contact information</li>
          </ul>

          <h4 className="font-semibold text-gray-800">Managing Contracts</h4>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Click "Manage Contract" next to any plan in the table view</li>
            <li>Fill in the contract details in the modal form</li>
            <li>Click "Save Contract" to store the information</li>
            <li>Contracts are linked to your user account and saved persistently</li>
          </ol>

          <h4 className="font-semibold text-gray-800">Contract Fields</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li><strong>Contract Reference:</strong> Unique identifier for the contract</li>
            <li><strong>Payment Amount:</strong> Financial value of the contract</li>
            <li><strong>Start Date:</strong> When the contract becomes active</li>
            <li><strong>End Date:</strong> Contract expiration date</li>
            <li><strong>Notes:</strong> Additional information or special conditions</li>
          </ul>
        </div>
      </Section>

      <Section id="data-export" title="📤 Data Export">
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800">Exporting Plan Data</h4>
          <p className="text-gray-700">
            You can export your environmental plan data in various formats:
          </p>

          <h4 className="font-semibold text-gray-800">GeoJSON Export</h4>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Click "View Details" for any plan</li>
            <li>In the details modal, click "Download GeoJSON"</li>
            <li>The file will download with all geographic boundary data</li>
            <li>Use this data in GIS software or other mapping applications</li>
          </ol>

          <h4 className="font-semibold text-gray-800">What's Included in Exports</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>Plan boundaries and geographic coordinates</li>
            <li>Plan metadata (name, type, dates)</li>
            <li>Feature properties and attributes</li>
            <li>Coordinate reference system information</li>
          </ul>

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Note:</strong> Contract data is stored separately and is not included in GeoJSON exports for privacy reasons.
            </p>
          </div>
        </div>
      </Section>

      <Section id="troubleshooting" title="🔧 Troubleshooting">
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800">Common Issues</h4>
          
          <div className="space-y-4">
            <div className="border-l-4 border-red-400 pl-4">
              <h5 className="font-medium text-gray-800">API Connection Failed</h5>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                <li>Check your API key is correct and has not expired</li>
                <li>Ensure you have internet connectivity</li>
                <li>Try refreshing the page and re-entering your API key</li>
              </ul>
            </div>

            <div className="border-l-4 border-yellow-400 pl-4">
              <h5 className="font-medium text-gray-800">Map Not Loading</h5>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                <li>Check your internet connection</li>
                <li>Try refreshing the page</li>
                <li>Disable browser extensions that might block map tiles</li>
                <li>Clear your browser cache and cookies</li>
              </ul>
            </div>

            <div className="border-l-4 border-blue-400 pl-4">
              <h5 className="font-medium text-gray-800">Plans Not Displaying</h5>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                <li>Ensure you've clicked "Load Plans" after entering your API key</li>
                <li>Check that your filters aren't hiding all plans</li>
                <li>Verify your API key has access to plan data</li>
              </ul>
            </div>

            <div className="border-l-4 border-green-400 pl-4">
              <h5 className="font-medium text-gray-800">Contracts Not Saving</h5>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                <li>Check you're in the correct database mode</li>
                <li>Ensure all required fields are filled</li>
                <li>Try refreshing and logging in again</li>
              </ul>
            </div>
          </div>

          <h4 className="font-semibold text-gray-800">Performance Tips</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>Use filters to reduce the number of plans displayed</li>
            <li>Close detail modals when not needed</li>
            <li>Regularly clear your browser cache</li>
            <li>Use the latest version of your browser</li>
          </ul>
        </div>
      </Section>

      <Section id="technical-info" title="⚙️ Technical Information">
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800">System Requirements</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li><strong>Browser:</strong> Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)</li>
            <li><strong>JavaScript:</strong> Must be enabled</li>
            <li><strong>Internet:</strong> Required for API access and map tiles</li>
            <li><strong>Storage:</strong> ~5MB browser storage for caching</li>
          </ul>

          <h4 className="font-semibold text-gray-800">Supported Data Formats</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li><strong>Input:</strong> Land App API JSON format</li>
            <li><strong>Export:</strong> GeoJSON (RFC 7946 compliant)</li>
            <li><strong>Coordinates:</strong> British National Grid (EPSG:27700) converted to WGS84 (EPSG:4326)</li>
          </ul>

          <h4 className="font-semibold text-gray-800">Privacy & Security</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>API keys are stored locally in your browser only</li>
            <li>No personal data is transmitted to third parties</li>
            <li>Map tiles are loaded from OpenStreetMap</li>
            <li>Contract data is encrypted and stored securely</li>
          </ul>

          <h4 className="font-semibold text-gray-800">Version Information</h4>
          <div className="bg-gray-50 p-3 rounded text-sm font-mono">
            <p>Application: Land App API Analysis Tool v1.0.0</p>
            <p>Framework: React 18.2.0</p>
            <p>Maps: Leaflet 1.9.4</p>
            <p>Database: Supabase 2.52.1</p>
          </div>
        </div>
      </Section>

          <div className="mt-8 p-6 bg-indigo-50 border border-indigo-200 rounded-lg text-center">
            <h3 className="text-lg font-semibold text-indigo-900 mb-2">Need More Help?</h3>
            <p className="text-indigo-700">
              If you're still having issues or need additional assistance, please contact your system administrator 
              or refer to the Land App API documentation for more technical details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App component
const App = () => {
  // State for Land App API interaction
  const [landAppApiKey, setLandAppApiKey] = useState(() => {
    return localStorage.getItem('defra-app-land-api-key') || '';
  });
  const [plans, setPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter state management with persistence
  const [filters, setFilters] = useState(() => {
    const savedFilters = localStorage.getItem('defra-app-filters');
    if (savedFilters) {
      try {
        return JSON.parse(savedFilters);
      } catch (e) {
        console.error('Error loading saved filters:', e);
      }
    }
    return {
      planTypes: ['BPS'], // Array for multi-select
      publicationStatus: 'all', // 'all', 'published', 'unpublished'
      archiveStatus: 'active', // 'all', 'active', 'archived'
      dateFilters: {
        createdFrom: '',
        createdTo: '',
        updatedFrom: '',
        updatedTo: '',
        archivedFrom: '',
        archivedTo: '',
      },
      searchTerm: '',
      pageSize: 1000,
      sortBy: 'updatedAt', // 'createdAt', 'updatedAt', 'name'
      sortOrder: 'desc' // 'asc', 'desc'
    };
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // State for Supabase
  const [user, setUser] = useState(null);
  const [contracts, setContracts] = useState({});
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [databaseMode, setDatabaseMode] = useState('local'); // 'supabase' or 'local'

  // State for View Toggle
  const [currentView, setCurrentView] = useState(() => {
    const savedView = localStorage.getItem('defra-app-view');
    return savedView || 'table';
  });

  // State for Modals
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedPlanForContract, setSelectedPlanForContract] = useState(null);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [selectedPlanForFeatures, setSelectedPlanForFeatures] = useState(null);
  const [selectedPlanFeatures, setSelectedPlanFeatures] = useState(null);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [featuresError, setFeaturesError] = useState(null);
  const [showGeoJsonData, setShowGeoJsonData] = useState(false);
  const [showPlanDetails, setShowPlanDetails] = useState(true);

  // --- Supabase Initialization and Authentication ---
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.log("Supabase not configured, using local storage mode");
      setDatabaseMode('local');
      setUser({ id: 'local-user', email: 'demo@local.dev' });
      setIsAuthReady(true);
      
      // Load contracts from localStorage
      const savedContracts = localStorage.getItem('defra-contracts');
      if (savedContracts) {
        try {
          setContracts(JSON.parse(savedContracts));
        } catch (e) {
          console.error('Error loading contracts from localStorage:', e);
        }
      }
      return;
    }

    setDatabaseMode('supabase');

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsAuthReady(true);
        loadContracts(session.user.id);
      } else {
        // Sign in anonymously
        signInAnonymously();
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsAuthReady(true);
        loadContracts(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('defra-app-filters', JSON.stringify(filters));
  }, [filters]);

  // Save view preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('defra-app-view', currentView);
  }, [currentView]);

  // Save Land App API key to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('defra-app-land-api-key', landAppApiKey);
  }, [landAppApiKey]);

  // Apply client-side filters whenever filters change (but not when plans are empty)
  useEffect(() => {
    if (plans.length > 0) {
      const filtered = applyClientSideFilters(plans);
      setFilteredPlans(filtered);
    }
  }, [filters, plans]);

  const signInAnonymously = async () => {
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.error('Error signing in anonymously:', error);
        // Fallback to local mode
        setDatabaseMode('local');
        setUser({ id: 'local-user', email: 'demo@local.dev' });
        setIsAuthReady(true);
      }
    } catch (err) {
      console.error('Supabase auth error:', err);
      // Fallback to local mode
      setDatabaseMode('local');
      setUser({ id: 'local-user', email: 'demo@local.dev' });
      setIsAuthReady(true);
    }
  };

  const loadContracts = async (userId) => {
    if (databaseMode === 'local') return;

    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error loading contracts:', error);
        return;
      }

      // Convert array to object keyed by land_app_plan_id
      const contractsObj = {};
      data.forEach(contract => {
        contractsObj[contract.land_app_plan_id] = contract;
      });
      setContracts(contractsObj);
    } catch (err) {
      console.error('Error loading contracts:', err);
    }
  };

  // --- Fetch Plans from Land App API ---
  const fetchPlans = async () => {
    if (!landAppApiKey) {
      setError("Please enter your Land App API Key.");
      return;
    }

    if (filters.planTypes.length === 0) {
      setError("Please select at least one plan type.");
      return;
    }

    setLoading(true);
    setError(null);
    setPlans([]);

    let allPlans = [];

    try {
      // Fetch plans for each selected plan type
      for (const planType of filters.planTypes) {
        let currentPage = 0;
        let hasNext = true;
        const pageSize = filters.pageSize;

        while (hasNext) {
          let url = `https://integration-api.thelandapp.com/projects?apiKey=${landAppApiKey}&type=${planType}&page=${currentPage}&size=${pageSize}`;

          // Always add 'from' parameter as the API requires it
          let fromDate;
          if (filters.dateFilters.createdFrom) {
            fromDate = new Date(filters.dateFilters.createdFrom).toISOString();
          } else {
            // Default to 2020-01-01 as a reasonable start date
            fromDate = new Date('2020-01-01T00:00:00.000Z').toISOString();
          }
          url += `&from=${encodeURIComponent(fromDate)}`;

          // Add publication filter in addition to the 'from' parameter
          if (filters.publicationStatus === 'published') {
            url += `&filter=published`;
          }

          // Add archive filter
          if (filters.archiveStatus === 'active') {
            url += `&excludeArchived=true`;
          }

          console.log(`Fetching ${planType} plans from:`, url);
          console.log(`Applied filters - Publication: ${filters.publicationStatus}, Archive: ${filters.archiveStatus}, From Date: ${fromDate}`);

          const response = await fetch(url);
          if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;
            try {
              const errorData = await response.json();
              console.error("Land App API Error Response:", {
                status: response.status,
                statusText: response.statusText,
                url: url,
                errorData: errorData,
                appliedFilters: {
                  publicationStatus: filters.publicationStatus,
                  archiveStatus: filters.archiveStatus,
                  fromDate: fromDate,
                  planType: planType
                }
              });
              errorMessage = `API Error: ${response.status} - ${errorData.message || errorData.error || 'Unknown error'}`;
            } catch (parseError) {
              console.error("Failed to parse error response:", parseError);
              errorMessage = `API Error: ${response.status} - ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }
          const data = await response.json();

          // Add planType to each plan object
          const plansWithType = data.data.map(plan => ({
            ...plan,
            planType: planType
          }));

          allPlans = allPlans.concat(plansWithType);
          hasNext = data.hasNext;
          currentPage++;

          if (currentPage > 10 && hasNext) {
            console.warn(`Stopped fetching ${planType} after 10 pages for demo purposes. More data might exist.`);
            break;
          }
        }
      }

      // Apply client-side filtering
      let filteredResults = applyClientSideFilters(allPlans);

      setPlans(filteredResults);
      setFilteredPlans(filteredResults);
    } catch (err) {
      console.error("Error fetching plans:", err);
      setError(`Failed to fetch plans: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get readable plan type labels
  const getPlanTypeLabel = (planType) => {
    const planTypeLabels = {
      'BPS': 'Basic Payment Scheme',
      'CSS': 'Countryside Stewardship',
      'FRM': 'Field Risk Map',
      'RLE1': 'RLE1 Form',
      'OWNERSHIP': 'Ownership Boundary',
      'FR1': 'Land Registration (FR1)',
      'SALES_PLAN': 'Sales Plan',
      'VALUATION_PLAN': 'Valuation Plan',
      'ESS': 'Environmental Stewardship',
      'UKHAB': 'Baseline Habitat Assessment',
      'UKHAB_V2': 'Baseline Habitat Assessment (v2)',
      'USER': 'Blank User Plan',
      'LAND_MANAGEMENT': 'Land Management Plan',
      'LAND_MANAGEMENT_V2': 'Land Management Plan (v2)',
      'SFI2022': 'Sustainable Farm Incentive 22',
      'SFI2023': 'Sustainable Farm Incentive 23',
      'SFI2024': 'Sustainable Farm Incentive 24',
      'PEAT_ASSESSMENT': 'Peat Condition Assessment',
      'OSMM': 'Ordnance Survey MasterMap',
      'FER': 'Farm Environment Record',
      'WCT': 'Woodland Creation Template',
      'BLANK_SURVEY': 'General Data Collection',
      'SOIL_SURVEY': 'Soil Sampling',
      'AGROFORESTRY': 'Agroforestry Design',
      'CSS_2025': 'Countryside Stewardship Higher-Tier (2025)',
      'HEALTHY_HEDGEROWS': 'Healthy Hedgerows Survey',
      'SAF': 'Single Application Form'
    };
    return planTypeLabels[planType] || planType;
  };

  // Client-side filtering and sorting
  const applyClientSideFilters = (plans) => {
    let filtered = [...plans];

    // Filter by publication status (for unpublished filter)
    if (filters.publicationStatus === 'unpublished') {
      // This would need to be based on a field in the response - for now, we'll assume all fetched are valid
      // In a real implementation, you'd check a 'published' field on each plan
    }

    // Filter by archive status (for archived only)
    if (filters.archiveStatus === 'archived') {
      filtered = filtered.filter(plan => plan.archivedAt);
    }

    // Filter by date ranges
    if (filters.dateFilters.createdFrom) {
      const fromDate = new Date(filters.dateFilters.createdFrom);
      filtered = filtered.filter(plan => new Date(plan.createdAt) >= fromDate);
    }
    if (filters.dateFilters.createdTo) {
      const toDate = new Date(filters.dateFilters.createdTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(plan => new Date(plan.createdAt) <= toDate);
    }
    if (filters.dateFilters.updatedFrom) {
      const fromDate = new Date(filters.dateFilters.updatedFrom);
      filtered = filtered.filter(plan => new Date(plan.updatedAt) >= fromDate);
    }
    if (filters.dateFilters.updatedTo) {
      const toDate = new Date(filters.dateFilters.updatedTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(plan => new Date(plan.updatedAt) <= toDate);
    }

    // Filter by search term
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(plan => 
        plan.name.toLowerCase().includes(searchTerm) ||
        plan.id.toLowerCase().includes(searchTerm) ||
        plan.planType.toLowerCase().includes(searchTerm) ||
        getPlanTypeLabel(plan.planType).toLowerCase().includes(searchTerm)
      );
    }

    // Sort results
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'planType':
          aValue = a.planType.toLowerCase();
          bValue = b.planType.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'updatedAt':
        default:
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
      }

      if (filters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  };

  // --- Handle opening the Contract Modal ---
  const handleOpenContractModal = (plan) => {
    setSelectedPlanForContract(plan);
    setShowContractModal(true);
  };

  // --- Handle saving contract details ---
  const handleSaveContract = async (planId, contractData) => {
    if (!user) {
      setError("User not authenticated.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (databaseMode === 'supabase') {
        // Save to Supabase
        const { data, error } = await supabase
          .from('contracts')
          .upsert({
            ...contractData,
            user_id: user.id,
            land_app_plan_id: planId,
          }, {
            onConflict: 'user_id,land_app_plan_id'
          });

        if (error) {
          console.error("Error saving contract:", error);
          setError(`Failed to save contract: ${error.message}`);
          return;
        }

        // Reload contracts
        await loadContracts(user.id);
      } else {
        // Save to localStorage
        const updatedContracts = {
          ...contracts,
          [planId]: {
            ...contractData,
            user_id: user.id,
            land_app_plan_id: planId,
          }
        };
        setContracts(updatedContracts);
        localStorage.setItem('defra-contracts', JSON.stringify(updatedContracts));
      }

      setShowContractModal(false);
    } catch (err) {
      console.error("Error saving contract:", err);
      setError(`Failed to save contract: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Handle fetching and displaying features for a plan ---
  const handleViewFeatures = async (plan) => {
    if (!landAppApiKey) {
      setFeaturesError("Please enter your Land App API Key to view features.");
      return;
    }
    setFeaturesLoading(true);
    setFeaturesError(null);
    setSelectedPlanFeatures(null);
    setSelectedPlanForFeatures(plan);

    // Log the complete plan object to see all available fields
    console.log("Complete Plan Object:", plan);

    try {
      const url = `https://integration-api.thelandapp.com/projects/${plan.id}/features?apiKey=${landAppApiKey}&page=0&size=100000`;

      console.log("Fetching Features URL:", url);

      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }
      const data = await response.json();
      setSelectedPlanFeatures(data.data);
      setShowFeaturesModal(true);
    } catch (err) {
      console.error("Error fetching features:", err);
      setFeaturesError(`Failed to fetch features: ${err.message}`);
    } finally {
      setFeaturesLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans text-gray-800">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full mx-4 mb-6">
        <h1 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          Land App API Analysis Tool
        </h1>

        <p className="text-sm text-gray-600 mb-4">
          This tool demonstrates how an external application can consume data from the Land App API and manage for and process for multiple purposes.
        </p>

        <div className="flex justify-between items-center mb-4">
          <div>
            {user && (
              <p className="text-sm text-gray-500">
                User: <span className="font-mono bg-gray-200 px-2 py-1 rounded text-xs">{user.email || user.id}</span>
              </p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowHelpModal(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors duration-200 text-sm font-medium"
              title="Open Help Guide"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Help Guide</span>
            </button>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${databaseMode === 'supabase' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-sm text-gray-600">
                {databaseMode === 'supabase' ? 'Supabase Connected' : 'Local Storage Mode'}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex flex-col">
            <label htmlFor="apiKey" className="text-sm font-medium text-gray-700 mb-1">
              Land App API Key:
            </label>
            <input
              type="text"
              id="apiKey"
              value={landAppApiKey}
              onChange={(e) => setLandAppApiKey(e.target.value)}
              placeholder="Enter your Land App API Key"
              className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            />
          </div>
        </div>

        {/* Filter Panel */}
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter Plans</h3>
          
          {/* Search Bar - Prominent Position */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                placeholder="🔍 Search plan names, IDs, or plan types..."
                className="block w-full pl-10 pr-10 py-3 text-base border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              />
              {filters.searchTerm && (
                <button
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, searchTerm: '' }))}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Basic Filters */}
          <div className="space-y-4 mb-4">
            {/* Plan Types Checkboxes */}
            <div className="flex flex-col col-span-full">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">Plan Types:</label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allPlanTypes = ['AGROFORESTRY', 'BPS', 'UKHAB', 'UKHAB_V2', 'USER', 'CSS', 'CSS_2025', 
                        'ESS', 'FER', 'FRM', 'BLANK_SURVEY', 'HEALTHY_HEDGEROWS', 'LAND_MANAGEMENT', 'LAND_MANAGEMENT_V2', 
                        'FR1', 'OSMM', 'OWNERSHIP', 'PEAT_ASSESSMENT', 'RLE1', 'SALES_PLAN', 'SAF', 'SOIL_SURVEY', 
                        'SFI2022', 'SFI2023', 'SFI2024', 'VALUATION_PLAN', 'WCT'];
                      setFilters(prev => ({ ...prev, planTypes: allPlanTypes }));
                    }}
                    className="px-2 py-1 text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded transition-colors duration-200"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, planTypes: [] }))}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors duration-200"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="bg-white border border-gray-300 rounded-lg p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1 text-xs">
                  {[
                    { value: 'AGROFORESTRY', label: 'Agroforestry Design' },
                    { value: 'BPS', label: 'Basic Payment Scheme' },
                    { value: 'UKHAB', label: 'Baseline Habitat Assessment' },
                    { value: 'UKHAB_V2', label: 'Baseline Habitat Assessment (UKHab 2.0)' },
                    { value: 'USER', label: 'Blank User Plan' },
                    { value: 'CSS', label: 'Countryside Stewardship' },
                    { value: 'CSS_2025', label: 'Countryside Stewardship Higher-Tier (2025)' },
                    { value: 'ESS', label: 'Environmental Stewardship' },
                    { value: 'FER', label: 'Farm Environment Record' },
                    { value: 'FRM', label: 'Field Risk Map' },
                    { value: 'BLANK_SURVEY', label: 'General Data Collection (Mobile Survey)' },
                    { value: 'HEALTHY_HEDGEROWS', label: 'Healthy Hedgerows Survey' },
                    { value: 'LAND_MANAGEMENT', label: 'Land Management Plan' },
                    { value: 'LAND_MANAGEMENT_V2', label: 'Land Management Plan (UKHab 2.0)' },
                    { value: 'FR1', label: 'Land Registration (FR1)' },
                    { value: 'OSMM', label: 'Ordnance Survey MasterMap' },
                    { value: 'OWNERSHIP', label: 'Ownership Boundary' },
                    { value: 'PEAT_ASSESSMENT', label: 'Peat Condition Assessment' },
                    { value: 'RLE1', label: 'RLE1 Form' },
                    { value: 'SALES_PLAN', label: 'Sales Plan' },
                    { value: 'SAF', label: 'Single Application Form' },
                    { value: 'SOIL_SURVEY', label: 'Soil Sampling' },
                    { value: 'SFI2022', label: 'Sustainable Farm Incentive 22' },
                    { value: 'SFI2023', label: 'Sustainable Farm Incentive 23' },
                    { value: 'SFI2024', label: 'Sustainable Farm Incentive 24' },
                    { value: 'VALUATION_PLAN', label: 'Valuation Plan' },
                    { value: 'WCT', label: 'Woodland Creation Template' }
                  ].map(planType => (
                    <label key={planType.value} className="flex items-start space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded text-sm">
                      <input
                        type="checkbox"
                        checked={filters.planTypes.includes(planType.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({ 
                              ...prev, 
                              planTypes: [...prev.planTypes, planType.value] 
                            }));
                          } else {
                            setFilters(prev => ({ 
                              ...prev, 
                              planTypes: prev.planTypes.filter(type => type !== planType.value) 
                            }));
                          }
                        }}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-0.5"
                      />
                      <span className="text-gray-700 leading-tight">{planType.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {filters.planTypes.length} of 27 plan types selected
              </p>
            </div>
            
            {/* Status Filters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Publication Status */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">Publication Status:</label>
              <div className="bg-white border border-gray-300 rounded-lg p-1 flex">
                {[
                  { value: 'all', label: 'All', icon: '📄' },
                  { value: 'published', label: 'Published', icon: '✅' },
                  { value: 'unpublished', label: 'Draft', icon: '📝' }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, publicationStatus: option.value }))}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 flex items-center justify-center space-x-1 ${
                      filters.publicationStatus === option.value
                        ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Archive Status */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">Archive Status:</label>
              <div className="bg-white border border-gray-300 rounded-lg p-1 flex">
                {[
                  { value: 'all', label: 'All', icon: '📋' },
                  { value: 'active', label: 'Active', icon: '🟢' },
                  { value: 'archived', label: 'Archived', icon: '📦' }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, archiveStatus: option.value }))}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 flex items-center justify-center space-x-1 ${
                      filters.archiveStatus === option.value
                        ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
          >
            <span>{showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${showAdvancedFilters ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Advanced Filters Section */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {/* Created Date Filters */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">📅 Created Date Range:</label>
                    <button
                      type="button"
                      onClick={() => setFilters(prev => ({
                        ...prev,
                        dateFilters: { ...prev.dateFilters, createdFrom: '', createdTo: '' }
                      }))}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors duration-200"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <label className="block text-xs text-gray-500 mb-1">From:</label>
                      <input
                        type="date"
                        value={filters.dateFilters.createdFrom}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          dateFilters: { ...prev.dateFilters, createdFrom: e.target.value }
                        }))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm"
                      />
                    </div>
                    <div className="relative">
                      <label className="block text-xs text-gray-500 mb-1">To:</label>
                      <input
                        type="date"
                        value={filters.dateFilters.createdTo}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          dateFilters: { ...prev.dateFilters, createdTo: e.target.value }
                        }))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const today = new Date();
                        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                        setFilters(prev => ({
                          ...prev,
                          dateFilters: { 
                            ...prev.dateFilters, 
                            createdFrom: thirtyDaysAgo.toISOString().split('T')[0],
                            createdTo: today.toISOString().split('T')[0]
                          }
                        }));
                      }}
                      className="px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 rounded transition-colors duration-200"
                    >
                      Last 30 days
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const today = new Date();
                        const threeMonthsAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
                        setFilters(prev => ({
                          ...prev,
                          dateFilters: { 
                            ...prev.dateFilters, 
                            createdFrom: threeMonthsAgo.toISOString().split('T')[0],
                            createdTo: today.toISOString().split('T')[0]
                          }
                        }));
                      }}
                      className="px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 rounded transition-colors duration-200"
                    >
                      Last 3 months
                    </button>
                  </div>
                </div>

                {/* Updated Date Filters */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">🔄 Updated Date Range:</label>
                    <button
                      type="button"
                      onClick={() => setFilters(prev => ({
                        ...prev,
                        dateFilters: { ...prev.dateFilters, updatedFrom: '', updatedTo: '' }
                      }))}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors duration-200"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <label className="block text-xs text-gray-500 mb-1">From:</label>
                      <input
                        type="date"
                        value={filters.dateFilters.updatedFrom}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          dateFilters: { ...prev.dateFilters, updatedFrom: e.target.value }
                        }))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm"
                      />
                    </div>
                    <div className="relative">
                      <label className="block text-xs text-gray-500 mb-1">To:</label>
                      <input
                        type="date"
                        value={filters.dateFilters.updatedTo}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          dateFilters: { ...prev.dateFilters, updatedTo: e.target.value }
                        }))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const today = new Date();
                        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                        setFilters(prev => ({
                          ...prev,
                          dateFilters: { 
                            ...prev.dateFilters, 
                            updatedFrom: sevenDaysAgo.toISOString().split('T')[0],
                            updatedTo: today.toISOString().split('T')[0]
                          }
                        }));
                      }}
                      className="px-2 py-1 text-xs bg-green-50 hover:bg-green-100 text-green-600 rounded transition-colors duration-200"
                    >
                      Last 7 days
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const today = new Date();
                        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                        setFilters(prev => ({
                          ...prev,
                          dateFilters: { 
                            ...prev.dateFilters, 
                            updatedFrom: thirtyDaysAgo.toISOString().split('T')[0],
                            updatedTo: today.toISOString().split('T')[0]
                          }
                        }));
                      }}
                      className="px-2 py-1 text-xs bg-green-50 hover:bg-green-100 text-green-600 rounded transition-colors duration-200"
                    >
                      Last 30 days
                    </button>
                  </div>
                </div>

                {/* Sort Controls */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-2">📊 Sort Options:</label>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="block text-xs text-gray-500">Sort by:</label>
                      <div className="flex space-x-1">
                        {[
                          { value: 'updatedAt', label: 'Updated', icon: '🔄' },
                          { value: 'createdAt', label: 'Created', icon: '📅' },
                          { value: 'name', label: 'Name', icon: '📝' },
                          { value: 'planType', label: 'Type', icon: '📋' }
                        ].map(sortOption => (
                          <button
                            key={sortOption.value}
                            type="button"
                            onClick={() => setFilters(prev => ({ ...prev, sortBy: sortOption.value }))}
                            className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-all duration-200 flex items-center justify-center space-x-1 ${
                              filters.sortBy === sortOption.value
                                ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <span>{sortOption.icon}</span>
                            <span>{sortOption.label}</span>
                          </button>
                        ))}
                      </div>
                      
                      <div className="flex space-x-1">
                        {[
                          { value: 'desc', label: 'Newest First', icon: '⬇️' },
                          { value: 'asc', label: 'Oldest First', icon: '⬆️' }
                        ].map(orderOption => (
                          <button
                            key={orderOption.value}
                            type="button"
                            onClick={() => setFilters(prev => ({ ...prev, sortOrder: orderOption.value }))}
                            className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-all duration-200 flex items-center justify-center space-x-1 ${
                              filters.sortOrder === orderOption.value
                                ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <span>{orderOption.icon}</span>
                            <span>{orderOption.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Filter Summary and Actions */}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">🔍 Active Filters:</span>
                    
                    {/* Plan Types Summary */}
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {filters.planTypes.length} plan type{filters.planTypes.length !== 1 ? 's' : ''}
                    </span>
                    
                    {/* Publication Status */}
                    {filters.publicationStatus !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        📄 {filters.publicationStatus}
                      </span>
                    )}
                    
                    {/* Archive Status */}
                    {filters.archiveStatus !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        📋 {filters.archiveStatus}
                      </span>
                    )}
                    
                    {/* Search Term */}
                    {filters.searchTerm && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        🔍 "{filters.searchTerm}"
                      </span>
                    )}
                    
                    {/* Date Filters */}
                    {Object.values(filters.dateFilters).some(date => date) && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        📅 date range{Object.values(filters.dateFilters).filter(date => date).length > 2 ? 's' : ''}
                      </span>
                    )}
                    
                    {/* Sort Info */}
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      📊 {filters.sortBy === 'updatedAt' ? 'Updated' : filters.sortBy === 'createdAt' ? 'Created' : 'Name'} - {filters.sortOrder === 'desc' ? 'Newest' : 'Oldest'} first
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        const defaultFilters = {
                          planTypes: ['BPS'],
                          publicationStatus: 'all',
                          archiveStatus: 'active',
                          dateFilters: {
                            createdFrom: '',
                            createdTo: '',
                            updatedFrom: '',
                            updatedTo: '',
                            archivedFrom: '',
                            archivedTo: '',
                          },
                          searchTerm: '',
                          pageSize: 1000,
                          sortBy: 'updatedAt',
                          sortOrder: 'desc'
                        };
                        setFilters(defaultFilters);
                        localStorage.setItem('defra-app-filters', JSON.stringify(defaultFilters));
                      }}
                      className="inline-flex items-center px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors duration-200"
                    >
                      🔄 Reset All
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={fetchPlans}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out transform hover:scale-105"
            disabled={loading || !isAuthReady}
          >
            {loading ? 'Fetching Plans...' : 'Fetch Plans from Land App'}
          </button>
          
          {plans.length > 0 && (
            <button
              onClick={fetchPlans}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out transform hover:scale-105"
              disabled={loading || !isAuthReady}
              title="Refresh plans with latest data from Land App"
            >
              🔄
            </button>
          )}
        </div>

        {!isAuthReady && (
          <div className="mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-md text-sm" role="status">
            Initializing database connection... Please wait.
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm" role="alert">
            {error}
          </div>
        )}
      </div>

      {plans.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-lg w-full mx-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-2xl font-bold text-indigo-700 mb-4 sm:mb-0">
              Your Plans ({filteredPlans.length} of {plans.length})
              {filteredPlans.length !== plans.length && (
                <span className="text-sm font-normal text-gray-600 ml-2">filtered</span>
              )}
            </h2>
            <ViewToggle 
              currentView={currentView} 
              onViewChange={setCurrentView}
            />
          </div>
          {filteredPlans.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium text-gray-900">No plans match your current filters</p>
                <p className="text-sm text-gray-600 mt-2">
                  Try adjusting your filter criteria or clearing all filters to see more results.
                </p>
              </div>
              <button
                onClick={() => {
                  const defaultFilters = {
                    planTypes: ['BPS'],
                    publicationStatus: 'all',
                    archiveStatus: 'active',
                    dateFilters: {
                      createdFrom: '',
                      createdTo: '',
                      updatedFrom: '',
                      updatedTo: '',
                      archivedFrom: '',
                      archivedTo: '',
                    },
                    searchTerm: '',
                    pageSize: 1000,
                    sortBy: 'updatedAt',
                    sortOrder: 'desc'
                  };
                  setFilters(defaultFilters);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors duration-200"
              >
                Clear All Filters
              </button>
            </div>
          ) : currentView === 'map' ? (
            <MultiPlanMapDisplay 
              plans={filteredPlans}
              apiKey={landAppApiKey}
              onPlanClick={(plan) => {
                // Could open a modal or navigate to plan details
                console.log('Clicked plan:', plan);
              }}
              onViewFeatures={handleViewFeatures}
              loading={loading}
            />
          ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-md">
                    Plan Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated (Land App)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-md">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPlans.map((plan) => {
                  const contractData = contracts[plan.id];
                  const contractStatus = contractData?.status || 'No Contract';
                  return (
                    <tr key={plan.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {plan.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span 
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${
                            plan.planType === 'BPS' ? 'bg-blue-100 text-blue-800' :
                            plan.planType === 'CSS' || plan.planType === 'CSS_2025' ? 'bg-green-100 text-green-800' :
                            plan.planType === 'SFI2023' || plan.planType === 'SFI2022' || plan.planType === 'SFI2024' ? 'bg-purple-100 text-purple-800' :
                            plan.planType === 'UKHAB' || plan.planType === 'UKHAB_V2' ? 'bg-yellow-100 text-yellow-800' :
                            plan.planType === 'LAND_MANAGEMENT' || plan.planType === 'LAND_MANAGEMENT_V2' ? 'bg-indigo-100 text-indigo-800' :
                            plan.planType === 'PEAT_ASSESSMENT' ? 'bg-orange-100 text-orange-800' :
                            plan.planType === 'OSMM' ? 'bg-gray-100 text-gray-800' :
                            plan.planType === 'USER' ? 'bg-slate-100 text-slate-800' :
                            plan.planType === 'ESS' ? 'bg-emerald-100 text-emerald-800' :
                            plan.planType === 'FER' ? 'bg-lime-100 text-lime-800' :
                            plan.planType === 'HEALTHY_HEDGEROWS' ? 'bg-teal-100 text-teal-800' :
                            'bg-cyan-100 text-cyan-800'
                          }`}
                          title={`${getPlanTypeLabel(plan.planType)} (${plan.planType})`}
                        >
                          {plan.planType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {plan.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(plan.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(plan.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleViewFeatures(plan)}
                          className="py-1 px-3 rounded-md text-white text-xs font-semibold bg-green-600 hover:bg-green-700 transition duration-300 ease-in-out transform hover:scale-105"
                          disabled={featuresLoading || loading}
                        >
                          {featuresLoading ? 'Loading...' : 'View Features'}
                        </button>
                        <button
                          onClick={() => {
                            // Placeholder for future functionality
                            console.log('Process button clicked for plan:', plan.id);
                          }}
                          className="py-1 px-3 rounded-md text-white text-xs font-semibold bg-purple-600 hover:bg-purple-700 transition duration-300 ease-in-out transform hover:scale-105"
                          disabled={loading}
                        >
                          Process
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {/* Contract Management Modal */}
      {showContractModal && selectedPlanForContract && (
        <ContractModal
          plan={selectedPlanForContract}
          initialContractData={contracts[selectedPlanForContract.id]}
          userId={user?.id}
          onSave={handleSaveContract}
          onClose={() => setShowContractModal(false)}
          loading={loading}
        />
      )}

      {/* Help Guide Modal */}
      <HelpGuideModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

      {/* Enhanced Features Display Modal */}
      {showFeaturesModal && selectedPlanForFeatures && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-indigo-700">Plan Details & Features: {selectedPlanForFeatures.name}</h2>
              <button
                onClick={() => handleViewFeatures(selectedPlanForFeatures)}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out transform hover:scale-105 flex items-center space-x-2"
                disabled={featuresLoading}
                title="Refresh features with latest data from Land App"
              >
                <span>🔄</span>
                <span className="text-sm">{featuresLoading ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
            
            {featuresError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm" role="alert">
                {featuresError}
              </div>
            )}

            {/* Plan Details Section */}
            <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                onClick={() => setShowPlanDetails(!showPlanDetails)}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">📋</span>
                  <h3 className="text-lg font-semibold text-gray-800">Plan Details</h3>
                </div>
                <svg
                  className={`w-5 h-5 transition-transform duration-200 ${showPlanDetails ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {showPlanDetails && (
                <div className="px-4 pb-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {/* Plan Name */}
                    <div className="flex flex-col">
                      <label className="text-xs font-medium text-gray-500 uppercase mb-1">Plan Name</label>
                      <p className="text-sm font-medium text-gray-900">{selectedPlanForFeatures.name}</p>
                    </div>
                    
                    {/* Plan Type */}
                    <div className="flex flex-col">
                      <label className="text-xs font-medium text-gray-500 uppercase mb-1">Plan Type</label>
                      <span 
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer w-fit ${
                          selectedPlanForFeatures.planType === 'BPS' ? 'bg-blue-100 text-blue-800' :
                          selectedPlanForFeatures.planType === 'CSS' || selectedPlanForFeatures.planType === 'CSS_2025' ? 'bg-green-100 text-green-800' :
                          selectedPlanForFeatures.planType === 'SFI2023' || selectedPlanForFeatures.planType === 'SFI2022' || selectedPlanForFeatures.planType === 'SFI2024' ? 'bg-purple-100 text-purple-800' :
                          selectedPlanForFeatures.planType === 'UKHAB' || selectedPlanForFeatures.planType === 'UKHAB_V2' ? 'bg-yellow-100 text-yellow-800' :
                          selectedPlanForFeatures.planType === 'LAND_MANAGEMENT' || selectedPlanForFeatures.planType === 'LAND_MANAGEMENT_V2' ? 'bg-indigo-100 text-indigo-800' :
                          selectedPlanForFeatures.planType === 'PEAT_ASSESSMENT' ? 'bg-orange-100 text-orange-800' :
                          selectedPlanForFeatures.planType === 'OSMM' ? 'bg-gray-100 text-gray-800' :
                          selectedPlanForFeatures.planType === 'USER' ? 'bg-slate-100 text-slate-800' :
                          selectedPlanForFeatures.planType === 'ESS' ? 'bg-emerald-100 text-emerald-800' :
                          selectedPlanForFeatures.planType === 'FER' ? 'bg-lime-100 text-lime-800' :
                          selectedPlanForFeatures.planType === 'HEALTHY_HEDGEROWS' ? 'bg-teal-100 text-teal-800' :
                          'bg-cyan-100 text-cyan-800'
                        }`}
                        title={`${getPlanTypeLabel(selectedPlanForFeatures.planType)} (${selectedPlanForFeatures.planType})`}
                      >
                        {selectedPlanForFeatures.planType}
                      </span>
                      <p className="text-xs text-gray-600 mt-1">{getPlanTypeLabel(selectedPlanForFeatures.planType)}</p>
                    </div>
                    
                    {/* Plan ID */}
                    <div className="flex flex-col">
                      <label className="text-xs font-medium text-gray-500 uppercase mb-1">Plan ID</label>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-mono text-gray-700">{selectedPlanForFeatures.id}</p>
                        <button
                          onClick={() => navigator.clipboard.writeText(selectedPlanForFeatures.id)}
                          className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-600 rounded transition-colors duration-200"
                          title="Copy Plan ID"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                    
                    {/* Created Date */}
                    <div className="flex flex-col">
                      <label className="text-xs font-medium text-gray-500 uppercase mb-1">Created</label>
                      <p className="text-sm text-gray-700" title={new Date(selectedPlanForFeatures.createdAt).toISOString()}>
                        {new Date(selectedPlanForFeatures.createdAt).toLocaleDateString('en-GB', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    
                    {/* Updated Date */}
                    <div className="flex flex-col">
                      <label className="text-xs font-medium text-gray-500 uppercase mb-1">Last Updated</label>
                      <p className="text-sm text-gray-700" title={new Date(selectedPlanForFeatures.updatedAt).toISOString()}>
                        {new Date(selectedPlanForFeatures.updatedAt).toLocaleDateString('en-GB', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',   
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    
                    {/* Features Count */}
                    <div className="flex flex-col">
                      <label className="text-xs font-medium text-gray-500 uppercase mb-1">Features Count</label>
                      <p className="text-sm text-gray-700">
                        {selectedPlanFeatures ? selectedPlanFeatures.length : 'Loading...'}
                      </p>
                    </div>
                    
                    {/* Map Name */}
                    {selectedPlanForFeatures.mapName && (
                      <div className="flex flex-col">
                        <label className="text-xs font-medium text-gray-500 uppercase mb-1">Map Name</label>
                        <p className="text-sm font-medium text-gray-900">{selectedPlanForFeatures.mapName}</p>
                      </div>
                    )}
                    
                    {/* Map ID */}
                    {selectedPlanForFeatures.map && (
                      <div className="flex flex-col">
                        <label className="text-xs font-medium text-gray-500 uppercase mb-1">Map ID</label>
                        <div className="flex items-center space-x-2">
                          <a 
                            href={`https://go.thelandapp.com/map/${selectedPlanForFeatures.map}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-mono text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
                            title="Open in Land App"
                          >
                            {selectedPlanForFeatures.map}
                          </a>
                          <button
                            onClick={() => navigator.clipboard.writeText(selectedPlanForFeatures.map)}
                            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-600 rounded transition-colors duration-200"
                            title="Copy Map ID"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Map Section */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-lg">🗺️</span>
                <h3 className="text-lg font-semibold text-gray-800">Interactive Map</h3>
              </div>
              {selectedPlanFeatures && selectedPlanFeatures.length > 0 ? (
                <>
                  <div className="mb-4 text-sm text-gray-700">
                    Below is an aerial view of the plan's features. You can zoom and pan the map.
                    <br/>
                    <small className="text-gray-500">Note: The map will automatically zoom to fit the features. If no features are visible, it will default to a view over London.</small>
                  </div>
                  <MapDisplay geojsonFeatures={selectedPlanFeatures} />
                </>
              ) : (
                <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <p className="text-gray-600">
                    {featuresLoading ? 'Loading map features...' : 'No features found for this plan to display on the map.'}
                  </p>
                </div>
              )}
            </div>

            {/* GeoJSON Data Section */}
            {selectedPlanFeatures && selectedPlanFeatures.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">📄</span>
                    <h3 className="text-lg font-semibold text-gray-800">GeoJSON Data</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const dataStr = JSON.stringify(selectedPlanFeatures, null, 2);
                        const dataBlob = new Blob([dataStr], { type: 'application/json' });
                        const url = URL.createObjectURL(dataBlob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `${selectedPlanForFeatures.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_features.json`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center space-x-1 px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors duration-200"
                      title="Download GeoJSON data as file"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Download JSON</span>
                    </button>
                    <button
                      onClick={() => setShowGeoJsonData(!showGeoJsonData)}
                      className="flex items-center space-x-1 px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded-md transition-colors duration-200"
                    >
                      <span>{showGeoJsonData ? 'Hide' : 'Show'} JSON</span>
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${showGeoJsonData ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
                {showGeoJsonData && (
                  <div className="overflow-hidden transition-all duration-300 ease-in-out mt-4">
                    <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-x-auto whitespace-pre-wrap break-words">
                      <code>{JSON.stringify(selectedPlanFeatures, null, 2)}</code>
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowFeaturesModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Wrap App with Error Boundary
const AppWithErrorBoundary = () => {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
};

export default AppWithErrorBoundary;