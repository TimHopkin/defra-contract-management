import React, { useState, useEffect, useRef } from 'react';
import { getEnergyRatingColor } from '../../lib/epcService';

const EnergyMap = ({ epcData, onBuildingClick, selectedBuilding, loading }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [buildingLayers, setBuildingLayers] = useState(null);
  const [selectedLayer, setSelectedLayer] = useState('rating');
  const [showLegend, setShowLegend] = useState(true);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || map) return;

    // Wait for Leaflet to be available
    const initMap = () => {
      if (typeof window.L === 'undefined') {
        setTimeout(initMap, 100);
        return;
      }

      const mapInstance = window.L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        dragging: true
      }).setView([52.5, -1.5], 6);

      // Add base layer
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance);

      setMap(mapInstance);
    };

    initMap();

    // Cleanup
    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []);

  // Add building layers when data changes
  useEffect(() => {
    if (!map || !epcData?.matches) return;

    // Clear existing layers
    if (buildingLayers) {
      map.removeLayer(buildingLayers);
    }

    const layerGroup = window.L.layerGroup();
    const bounds = window.L.latLngBounds();

    epcData.matches.forEach((match, index) => {
      if (!match.building?.geometry) return;

      const building = match.building;
      const epc = match.epcData;
      
      // Convert coordinates if needed (assuming they're in the right format)
      let coordinates;
      if (building.geometry.type === 'Polygon') {
        coordinates = building.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
      } else if (building.geometry.type === 'MultiPolygon') {
        coordinates = building.geometry.coordinates[0][0].map(coord => [coord[1], coord[0]]);
      } else {
        return; // Skip non-polygon geometries
      }

      bounds.extend(coordinates);

      // Determine color based on selected layer
      let color, fillColor, opacity = 0.7;
      
      switch (selectedLayer) {
        case 'rating':
          const rating = epc?.['current-energy-rating'] || epc?.['asset-rating'];
          color = getEnergyRatingColor(rating);
          fillColor = color;
          opacity = rating ? 0.7 : 0.3;
          break;
          
        case 'efficiency':
          const efficiency = parseInt(epc?.['energy-efficiency-rating'] || epc?.['asset-rating-numeric']);
          if (efficiency) {
            const hue = (efficiency / 100) * 120; // 0 = red, 120 = green
            color = `hsl(${hue}, 80%, 45%)`;
            fillColor = `hsl(${hue}, 80%, 60%)`;
          } else {
            color = '#9ca3af';
            fillColor = '#e5e7eb';
            opacity = 0.3;
          }
          break;
          
        case 'co2':
          const co2 = parseFloat(epc?.['co2-emissions-current']);
          if (co2) {
            // Scale CO2 emissions to color (lower is better = green)
            const maxCo2 = 50; // Assume max 50 tonnes/year for scaling
            const normalized = Math.min(co2 / maxCo2, 1);
            const hue = (1 - normalized) * 120; // Invert so lower CO2 = green
            color = `hsl(${hue}, 80%, 45%)`;
            fillColor = `hsl(${hue}, 80%, 60%)`;
          } else {
            color = '#9ca3af';
            fillColor = '#e5e7eb';
            opacity = 0.3;
          }
          break;
          
        case 'age':
          if (epc?.['lodgement-date']) {
            const lodgementDate = new Date(epc['lodgement-date']);
            const years = (Date.now() - lodgementDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
            const normalized = Math.min(years / 10, 1); // 10 years = full red
            const hue = (1 - normalized) * 120;
            color = `hsl(${hue}, 80%, 45%)`;
            fillColor = `hsl(${hue}, 80%, 60%)`;
          } else {
            color = '#9ca3af';
            fillColor = '#e5e7eb';
            opacity = 0.3;
          }
          break;
          
        default:
          color = '#3b82f6';
          fillColor = '#93c5fd';
      }

      // Create polygon
      const polygon = window.L.polygon(coordinates, {
        color: color,
        fillColor: fillColor,
        weight: 2,
        opacity: 1,
        fillOpacity: opacity
      });

      // Create popup content
      const popupContent = createPopupContent(match);
      polygon.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
      });

      // Add click handler
      polygon.on('click', () => {
        if (onBuildingClick) {
          onBuildingClick(match, index);
        }
      });

      // Highlight selected building
      if (selectedBuilding && selectedBuilding.building.properties?.id === building.properties?.id) {
        polygon.setStyle({
          weight: 4,
          opacity: 1,
          color: '#4f46e5'
        });
      }

      layerGroup.addLayer(polygon);
    });

    setBuildingLayers(layerGroup);
    layerGroup.addTo(map);

    // Fit map to buildings
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }

  }, [map, epcData, selectedLayer, selectedBuilding, onBuildingClick]);

  const createPopupContent = (match) => {
    const building = match.building;
    const epc = match.epcData;
    
    if (!epc) {
      return `
        <div class="p-3">
          <h3 class="font-semibold text-gray-900 mb-2">Building Information</h3>
          <p class="text-sm text-gray-600 mb-2">${building.properties?.address || 'Address not available'}</p>
          <div class="bg-yellow-50 border border-yellow-200 rounded p-2">
            <p class="text-sm text-yellow-800">No EPC data available</p>
          </div>
        </div>
      `;
    }

    const rating = epc['current-energy-rating'] || epc['asset-rating'] || 'N/A';
    const efficiency = epc['energy-efficiency-rating'] || epc['asset-rating-numeric'] || 'N/A';
    const co2 = epc['co2-emissions-current'] || 'N/A';
    const propertyType = epc['property-type'] || epc['building-category'] || 'N/A';
    
    return `
      <div class="p-3">
        <h3 class="font-semibold text-gray-900 mb-2">Energy Performance</h3>
        <p class="text-sm text-gray-600 mb-3">${epc.address || building.properties?.address || 'Address not available'}</p>
        
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">Energy Rating:</span>
            <span class="font-medium px-2 py-1 rounded text-white" style="background-color: ${getEnergyRatingColor(rating)}">${rating}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Efficiency Score:</span>
            <span class="font-medium">${efficiency}/100</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">CO2 Emissions:</span>
            <span class="font-medium">${co2} ${co2 !== 'N/A' ? 'tonnes/year' : ''}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Property Type:</span>
            <span class="font-medium">${propertyType}</span>
          </div>
        </div>
        
        <div class="mt-3 pt-2 border-t border-gray-200">
          <p class="text-xs text-gray-500">
            Match: ${match.matchConfidence ? Math.round(match.matchConfidence * 100) + '%' : 'N/A'} confidence via ${match.matchMethod}
          </p>
        </div>
      </div>
    `;
  };

  const LayerControl = () => (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
      <h4 className="font-semibold mb-3">Display Layer</h4>
      <div className="space-y-2">
        {[
          { id: 'rating', label: 'Energy Rating', icon: '⚡' },
          { id: 'efficiency', label: 'Efficiency Score', icon: '📊' },
          { id: 'co2', label: 'CO2 Emissions', icon: '🌱' },
          { id: 'age', label: 'Certificate Age', icon: '📅' }
        ].map(layer => (
          <label key={layer.id} className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="mapLayer"
              value={layer.id}
              checked={selectedLayer === layer.id}
              onChange={(e) => setSelectedLayer(e.target.value)}
              className="mr-2"
            />
            <span className="mr-2">{layer.icon}</span>
            <span className="text-sm">{layer.label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const Legend = () => {
    if (!showLegend) return null;

    const getLegendItems = () => {
      switch (selectedLayer) {
        case 'rating':
          return [
            { label: 'A (Very Efficient)', color: '#00a651' },
            { label: 'B (Efficient)', color: '#19b459' },
            { label: 'C (Fairly Efficient)', color: '#8cc63f' },
            { label: 'D (Standard)', color: '#ffd700' },
            { label: 'E (Below Standard)', color: '#f57c00' },
            { label: 'F (Poor)', color: '#e53e3e' },
            { label: 'G (Very Poor)', color: '#c53030' },
            { label: 'No Data', color: '#9ca3af' }
          ];
        case 'efficiency':
          return [
            { label: '81-100 (Excellent)', color: 'hsl(120, 80%, 45%)' },
            { label: '61-80 (Good)', color: 'hsl(96, 80%, 45%)' },
            { label: '41-60 (Average)', color: 'hsl(60, 80%, 45%)' },
            { label: '21-40 (Poor)', color: 'hsl(24, 80%, 45%)' },
            { label: '1-20 (Very Poor)', color: 'hsl(0, 80%, 45%)' },
            { label: 'No Data', color: '#9ca3af' }
          ];
        case 'co2':
          return [
            { label: '< 10 tonnes/year', color: 'hsl(120, 80%, 45%)' },
            { label: '10-20 tonnes/year', color: 'hsl(96, 80%, 45%)' },
            { label: '20-30 tonnes/year', color: 'hsl(60, 80%, 45%)' },
            { label: '30-40 tonnes/year', color: 'hsl(24, 80%, 45%)' },
            { label: '> 40 tonnes/year', color: 'hsl(0, 80%, 45%)' },
            { label: 'No Data', color: '#9ca3af' }
          ];
        case 'age':
          return [
            { label: '< 2 years old', color: 'hsl(120, 80%, 45%)' },
            { label: '2-5 years old', color: 'hsl(96, 80%, 45%)' },
            { label: '5-7 years old', color: 'hsl(60, 80%, 45%)' },
            { label: '7-9 years old', color: 'hsl(24, 80%, 45%)' },
            { label: '> 9 years old', color: 'hsl(0, 80%, 45%)' },
            { label: 'No Data', color: '#9ca3af' }
          ];
        default:
          return [];
      }
    };

    return (
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Legend</h4>
          <button
            onClick={() => setShowLegend(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-2">
          {getLegendItems().map((item, index) => (
            <div key={index} className="flex items-center text-sm">
              <div 
                className="w-4 h-4 rounded mr-2 border"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading energy performance map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-10 space-y-4">
        <LayerControl />
        {!showLegend && (
          <button
            onClick={() => setShowLegend(true)}
            className="bg-white rounded-lg shadow-lg p-3 hover:bg-gray-50"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-10">
        <Legend />
      </div>

      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-96 rounded-lg"
        style={{ minHeight: '400px' }}
      />
      
      {/* Map Info */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="h-5 w-5 text-blue-400 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p><strong>Map Guide:</strong> Click on buildings to see detailed energy performance data. Use the layer controls to switch between different visualizations. Buildings are colored according to the selected metric.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnergyMap;