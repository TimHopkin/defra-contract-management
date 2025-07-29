import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';

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
  if (!window.proj4) {
    console.warn("Proj4js not loaded, coordinates may not display correctly");
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
    return geojsonFeatures;
  }

  console.log("Transforming", geojsonFeatures.length, "features from BNG to WGS84");
  
  let successCount = 0;
  let errorCount = 0;

  const transformedFeatures = geojsonFeatures.map((feature, index) => {
    if (!feature.geometry || !feature.geometry.coordinates) {
      console.warn(`Feature ${index} has no geometry or coordinates:`, feature);
      return feature;
    }

    try {
      const originalSample = feature.geometry.coordinates[0] || feature.geometry.coordinates;
      
      const transformedCoordinates = transformCoordinates(
        feature.geometry.coordinates,
        feature.geometry.type
      );

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
      return feature; // Return original feature if transformation fails
    }
  });

  console.log(`Coordinate transformation complete: ${successCount} successful, ${errorCount} errors`);
  return transformedFeatures;
};

// Map Display Component
const MapDisplay = ({ geojsonFeatures }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (typeof window.L === 'undefined' || !mapContainerRef.current) {
      console.warn("Leaflet not loaded or map container not ready.");
      return;
    }

    // Initialize projections if proj4 is available
    if (typeof window.proj4 !== 'undefined') {
      initializeProjections();
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

    // Remove existing GeoJSON layers
    map.eachLayer((layer) => {
      if (layer instanceof window.L.GeoJSON) {
        map.removeLayer(layer);
      }
    });

    if (geojsonFeatures && geojsonFeatures.length > 0) {
      // Transform coordinates from British National Grid to WGS84
      const transformedFeatures = transformGeoJSON(geojsonFeatures);
      
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

      // Fit map to transformed bounds
      try {
        map.fitBounds(geoJsonLayer.getBounds());
        console.log("Map fitted to transformed feature bounds");
      } catch (error) {
        console.error("Error fitting map bounds:", error);
        map.setView([51.505, -0.09], 6); // Fallback to UK center
      }
    } else {
      map.setView([51.505, -0.09], 6);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [geojsonFeatures]);

  return <div ref={mapContainerRef} className="w-full h-[500px] rounded-md shadow-inner" style={{ minHeight: '300px' }}></div>;
};

// Main App component
const App = () => {
  // State for Land App API interaction
  const [landAppApiKey, setLandAppApiKey] = useState('');
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

  // State for Modals
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedPlanForContract, setSelectedPlanForContract] = useState(null);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
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
          {user && (
            <p className="text-sm text-gray-500">
              User: <span className="font-mono bg-gray-200 px-2 py-1 rounded text-xs">{user.email || user.id}</span>
            </p>
          )}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${databaseMode === 'supabase' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-sm text-gray-600">
              {databaseMode === 'supabase' ? 'Supabase Connected' : 'Local Storage Mode'}
            </span>
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
                      const allPlanTypes = ['BPS', 'CSS', 'FRM', 'RLE1', 'OWNERSHIP', 'FR1', 'SALES_PLAN', 'VALUATION_PLAN', 
                        'ESS', 'UKHAB', 'UKHAB_V2', 'USER', 'LAND_MANAGEMENT', 'LAND_MANAGEMENT_V2', 'SFI2022', 
                        'SFI2023', 'SFI2024', 'PEAT_ASSESSMENT', 'OSMM', 'FER', 'WCT', 'BLANK_SURVEY', 'SOIL_SURVEY', 
                        'AGROFORESTRY', 'CSS_2025', 'HEALTHY_HEDGEROWS', 'SAF'];
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
              <div className="bg-white border border-gray-300 rounded-lg p-3 max-h-64 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {[
                    { value: 'BPS', label: 'Basic Payment Scheme' },
                    { value: 'CSS', label: 'Countryside Stewardship' },
                    { value: 'FRM', label: 'Field Risk Map' },
                    { value: 'RLE1', label: 'RLE1 form' },
                    { value: 'OWNERSHIP', label: 'Ownership Boundary' },
                    { value: 'FR1', label: 'Land Registration (FR1)' },
                    { value: 'SALES_PLAN', label: 'Sales Plan' },
                    { value: 'VALUATION_PLAN', label: 'Valuation Plan' },
                    { value: 'ESS', label: 'Environmental Stewardship' },
                    { value: 'UKHAB', label: 'Baseline Habitat Assessment' },
                    { value: 'UKHAB_V2', label: 'Baseline Habitat Assessment (UKHab 2.0)' },
                    { value: 'USER', label: 'Blank user plan' },
                    { value: 'LAND_MANAGEMENT', label: 'Land Management Plan' },
                    { value: 'LAND_MANAGEMENT_V2', label: 'Land Management Plan (UKHab 2.0)' },
                    { value: 'SFI2022', label: 'Sustainable Farm Incentive 22' },
                    { value: 'SFI2023', label: 'Sustainable Farm Incentive 23' },
                    { value: 'SFI2024', label: 'Sustainable Farm Incentive 24' },
                    { value: 'PEAT_ASSESSMENT', label: 'Peat Condition Assessment' },
                    { value: 'OSMM', label: 'Ordnance Survey MasterMap' },
                    { value: 'FER', label: 'Farm Environment Record' },
                    { value: 'WCT', label: 'Woodland Creation Template' },
                    { value: 'BLANK_SURVEY', label: 'General Data Collection (Mobile Survey)' },
                    { value: 'SOIL_SURVEY', label: 'Soil Sampling' },
                    { value: 'AGROFORESTRY', label: 'Agroforestry Design' },
                    { value: 'CSS_2025', label: 'Countryside Stewardship Higher-Tier (2025)' },
                    { value: 'HEALTHY_HEDGEROWS', label: 'Healthy Hedgerows Survey' },
                    { value: 'SAF', label: 'Single Application Form' }
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
                {filters.planTypes.length} of 25 plan types selected
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

        <button
          onClick={fetchPlans}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out transform hover:scale-105"
          disabled={loading || !isAuthReady}
        >
          {loading ? 'Fetching Plans...' : 'Fetch Plans from Land App'}
        </button>

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
          <h2 className="text-2xl font-bold text-indigo-700 mb-4">
            Your Plans ({filteredPlans.length} of {plans.length})
            {filteredPlans.length !== plans.length && (
              <span className="text-sm font-normal text-gray-600 ml-2">filtered</span>
            )}
          </h2>
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

      {/* Enhanced Features Display Modal */}
      {showFeaturesModal && selectedPlanForFeatures && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-indigo-700 mb-6">Plan Details & Features: {selectedPlanForFeatures.name}</h2>
            
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

export default App;