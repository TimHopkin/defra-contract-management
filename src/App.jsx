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

// Map Display Component
const MapDisplay = ({ geojsonFeatures }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (typeof window.L === 'undefined' || !mapContainerRef.current) {
      console.warn("Leaflet not loaded or map container not ready.");
      return;
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

    map.eachLayer((layer) => {
      if (layer instanceof window.L.GeoJSON) {
        map.removeLayer(layer);
      }
    });

    if (geojsonFeatures && geojsonFeatures.length > 0) {
      const geoJsonLayer = window.L.geoJSON(geojsonFeatures, {
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
            for (const key in feature.properties) {
              popupContent += `<strong>${key}:</strong> ${feature.properties[key]}<br/>`;
            }
            layer.bindPopup(popupContent);
          }
        }
      }).addTo(map);

      map.fitBounds(geoJsonLayer.getBounds());
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
  const [selectedPlanFeatures, setSelectedPlanFeatures] = useState(null);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [featuresError, setFeaturesError] = useState(null);
  const [showGeoJsonData, setShowGeoJsonData] = useState(false);

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

          // Add publication filter
          if (filters.publicationStatus === 'published') {
            url += `&filter=published`;
          } else {
            // For unpublished or all, we need to provide a 'from' date
            // Use the earliest created date filter if available, otherwise use a default
            let fromDate;
            if (filters.dateFilters.createdFrom) {
              fromDate = new Date(filters.dateFilters.createdFrom).toISOString();
            } else {
              // Default to 2020-01-01 as a reasonable start date
              fromDate = new Date('2020-01-01T00:00:00.000Z').toISOString();
            }
            url += `&from=${encodeURIComponent(fromDate)}`;
          }

          // Add archive filter
          if (filters.archiveStatus === 'active') {
            url += `&excludeArchived=true`;
          }

          console.log(`Fetching ${planType} plans from:`, url);

          const response = await fetch(url);
          if (!response.ok) {
            const errorData = await response.json();
            console.error("Land App API Error Response:", errorData);
            throw new Error(`API Error: ${response.status} - ${errorData.message || 'Unknown error'}`);
          }
          const data = await response.json();

          allPlans = allPlans.concat(data.data);
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
        plan.id.toLowerCase().includes(searchTerm)
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
  const handleViewFeatures = async (planId) => {
    if (!landAppApiKey) {
      setFeaturesError("Please enter your Land App API Key to view features.");
      return;
    }
    setFeaturesLoading(true);
    setFeaturesError(null);
    setSelectedPlanFeatures(null);

    try {
      const url = `https://integration-api.thelandapp.com/projects/${planId}/features?apiKey=${landAppApiKey}&page=0&size=100000`;

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
          Defra Environmental Contract Management Platform POC
        </h1>

        <p className="text-sm text-gray-600 mb-4">
          This tool demonstrates how an external application can consume data from the Land App API and manage contract details for plans using Supabase, simulating a Defra-like system.
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
          
          {/* Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Plan Types Multi-Select */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Plan Types:</label>
              <div className="relative">
                <select
                  multiple
                  value={filters.planTypes}
                  onChange={(e) => {
                    const selectedTypes = Array.from(e.target.selectedOptions, option => option.value);
                    setFilters(prev => ({ ...prev, planTypes: selectedTypes }));
                  }}
                  className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm bg-white h-20"
                >
                  <option value="BPS">Basic Payment Scheme (BPS)</option>
                  <option value="CSS">Countryside Stewardship (CSS)</option>
                  <option value="SFI2023">Sustainable Farm Incentive 23 (SFI2023)</option>
                  <option value="UKHAB">Baseline Habitat Assessment (UKHAB)</option>
                  <option value="USER">Blank User Plan</option>
                  <option value="OSMM">Ordnance Survey MasterMap</option>
                  <option value="LAND_MANAGEMENT">Land Management Plan</option>
                  <option value="PEAT_ASSESSMENT">Peat Condition Assessment</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
              </div>
            </div>

            {/* Publication Status */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Publication Status:</label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'All Plans' },
                  { value: 'published', label: 'Published Only' },
                  { value: 'unpublished', label: 'Unpublished Only' }
                ].map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="publicationStatus"
                      value={option.value}
                      checked={filters.publicationStatus === option.value}
                      onChange={(e) => setFilters(prev => ({ ...prev, publicationStatus: e.target.value }))}
                      className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Archive Status */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Archive Status:</label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'All Plans' },
                  { value: 'active', label: 'Active Only' },
                  { value: 'archived', label: 'Archived Only' }
                ].map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="archiveStatus"
                      value={option.value}
                      checked={filters.archiveStatus === option.value}
                      onChange={(e) => setFilters(prev => ({ ...prev, archiveStatus: e.target.value }))}
                      className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
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
                {/* Date Filters */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-2">Created Date Range:</label>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={filters.dateFilters.createdFrom}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        dateFilters: { ...prev.dateFilters, createdFrom: e.target.value }
                      }))}
                      className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm"
                      placeholder="From"
                    />
                    <input
                      type="date"
                      value={filters.dateFilters.createdTo}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        dateFilters: { ...prev.dateFilters, createdTo: e.target.value }
                      }))}
                      className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm"
                      placeholder="To"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-2">Updated Date Range:</label>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={filters.dateFilters.updatedFrom}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        dateFilters: { ...prev.dateFilters, updatedFrom: e.target.value }
                      }))}
                      className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm"
                      placeholder="From"
                    />
                    <input
                      type="date"
                      value={filters.dateFilters.updatedTo}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        dateFilters: { ...prev.dateFilters, updatedTo: e.target.value }
                      }))}
                      className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm"
                      placeholder="To"
                    />
                  </div>
                </div>

                {/* Search and Controls */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-2">Search & Controls:</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={filters.searchTerm}
                      onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                      placeholder="Search plan names..."
                      className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm"
                    />
                    <div className="flex space-x-2">
                      <select
                        value={filters.sortBy}
                        onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                        className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm bg-white"
                      >
                        <option value="updatedAt">Sort by Updated</option>
                        <option value="createdAt">Sort by Created</option>
                        <option value="name">Sort by Name</option>
                      </select>
                      <select
                        value={filters.sortOrder}
                        onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
                        className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm bg-white"
                      >
                        <option value="desc">Desc</option>
                        <option value="asc">Asc</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex space-x-3">
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
                  className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors duration-200"
                >
                  Clear All Filters
                </button>
                <div className="text-sm text-gray-600 flex items-center">
                  <span className="font-medium">Active filters:</span>
                  <span className="ml-1">
                    {filters.planTypes.length} plan type{filters.planTypes.length !== 1 ? 's' : ''}
                    {filters.publicationStatus !== 'all' && ', publication status'}
                    {filters.archiveStatus !== 'all' && ', archive status'}
                    {filters.searchTerm && ', search term'}
                    {Object.values(filters.dateFilters).some(date => date) && ', date ranges'}
                  </span>
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
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated (Land App)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contract Status
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {plan.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(plan.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(plan.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          contractStatus === 'Approved' ? 'bg-green-100 text-green-800' :
                          contractStatus === 'Submitted' ? 'bg-blue-100 text-blue-800' :
                          contractStatus === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                          contractStatus === 'Active' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {contractStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleOpenContractModal(plan)}
                          className="py-1 px-3 rounded-md text-white text-xs font-semibold bg-blue-600 hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105"
                          disabled={loading}
                        >
                          {contractData ? 'Edit Contract' : 'Create Contract'}
                        </button>
                        <button
                          onClick={() => handleViewFeatures(plan.id)}
                          className="py-1 px-3 rounded-md text-white text-xs font-semibold bg-green-600 hover:bg-green-700 transition duration-300 ease-in-out transform hover:scale-105"
                          disabled={featuresLoading || loading}
                        >
                          {featuresLoading ? 'Loading...' : 'View Features'}
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

      {/* Features Display Modal */}
      {showFeaturesModal && selectedPlanFeatures && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-indigo-700 mb-4">Features for Plan: {selectedPlanForContract?.name}</h2>
            {featuresError && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm" role="alert">
                {featuresError}
              </div>
            )}
            {selectedPlanFeatures.length > 0 ? (
              <>
                <div className="mb-4 text-sm text-gray-700">
                  Below is an aerial view of the plan's features. You can zoom and pan the map.
                  <br/>
                  <small className="text-gray-500">Note: The map will automatically zoom to fit the features. If no features are visible, it will default to a view over London.</small>
                </div>
                <MapDisplay geojsonFeatures={selectedPlanFeatures} />
                <div className="mt-4 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Raw GeoJSON Data:</p>
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
                  {showGeoJsonData && (
                    <div className="overflow-hidden transition-all duration-300 ease-in-out">
                      <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-x-auto whitespace-pre-wrap break-words mt-2">
                        <code>{JSON.stringify(selectedPlanFeatures, null, 2)}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-gray-600">No features found for this plan to display on the map.</p>
            )}
            <div className="flex justify-end mt-4">
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