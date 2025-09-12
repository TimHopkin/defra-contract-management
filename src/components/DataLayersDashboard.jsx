import React, { useState, useEffect } from 'react';
import dataLayersService from '../lib/dataLayersService';

const DataLayersDashboard = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState('input');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError('Please select an Excel file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await dataLayersService.parseExcelFile(selectedFile);
      const validationErrors = dataLayersService.validateParsedData(data);
      
      if (validationErrors.length > 0) {
        data.warnings = [...(data.warnings || []), ...validationErrors];
      }
      
      setParsedData(data);
      setCurrentView('dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = () => {
    setSelectedFile(null);
    setParsedData(null);
    setError(null);
    setCurrentView('input');
    
    // Clear the file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const MetricCard = ({ title, value, subtitle, color, icon, onClick }) => (
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
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  const CategoryCard = ({ category, index }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`w-4 h-4 rounded mr-3 ${dataLayersService.getCategoryColor(category.name, index).split(' ')[0]}`}></div>
          <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${dataLayersService.getCategoryColor(category.name, index)}`}>
          {category.layers.length} layers
        </span>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Count:</span>
          <span className="font-medium">{category.totalCount || 'N/A'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Area:</span>
          <span className="font-medium">{dataLayersService.formatArea(category.totalArea)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Data Available:</span>
          <span className={`font-medium ${category.hasData ? 'text-green-600' : 'text-red-600'}`}>
            {category.hasData ? 'Yes' : 'No'}
          </span>
        </div>
      </div>
      
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Layers:</h4>
        <div className="max-h-32 overflow-y-auto">
          {category.layers.slice(0, 5).map((layer, layerIndex) => (
            <div key={layerIndex} className="text-xs text-gray-600 py-1 border-b border-gray-100 last:border-b-0">
              <div className="flex justify-between">
                <span className="truncate pr-2">{layer.name}</span>
                {layer.areaFormatted && (
                  <span className="text-gray-500">{layer.areaFormatted}</span>
                )}
              </div>
            </div>
          ))}
          {category.layers.length > 5 && (
            <div className="text-xs text-gray-500 pt-1">
              +{category.layers.length - 5} more layers
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const DetailedCategoryView = ({ category }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">{category.name}</h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data Layer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Count
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Area
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Coverage %
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {category.layers.map((layer, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {layer.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {layer.count || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {layer.areaFormatted || (layer.lengthFormatted ? layer.lengthFormatted : '-')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {layer.percentage ? `${layer.percentage}%` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {layer.source || 'Unknown'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const ViewToggle = () => {
    const views = [
      { id: 'dashboard', label: 'Overview', icon: '📊' },
      { id: 'categories', label: 'Categories', icon: '📋' },
      { id: 'details', label: 'Detailed View', icon: '🔍' }
    ];

    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg p-1 shadow-sm">
        {views.map(view => (
          <button
            key={view.id}
            onClick={() => setCurrentView(view.id)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-all duration-200 ${
              currentView === view.id
                ? 'bg-white text-indigo-700 shadow-sm'
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Excel File</h3>
          <p className="text-gray-600">Reading and analyzing data layers...</p>
          {selectedFile && (
            <p className="text-sm text-gray-500 mt-2">File: {selectedFile.name}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
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
                  <h1 className="text-3xl font-bold text-gray-900">Data Layers Dashboard</h1>
                  <p className="text-gray-600">Analyze Land App intersection reports</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {parsedData && <ViewToggle />}
                {parsedData && (
                  <button
                    onClick={handleClearData}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    New Report
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        {/* Input View */}
        {currentView === 'input' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <div className="p-4 bg-indigo-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Land App Data Layers Analysis</h2>
                <p className="text-gray-600 mb-6">
                  Upload your Land App intersection report Excel file to generate a comprehensive analysis dashboard.
                </p>
              </div>

              <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    
                    <div>
                      <label htmlFor="excel-file" className="cursor-pointer">
                        <span className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                          Click to select file
                        </span>
                        <input
                          id="excel-file"
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleFileSelect}
                          className="sr-only"
                        />
                      </label>
                      <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
                    </div>
                    
                    <p className="text-xs text-gray-400">
                      Excel files only (.xlsx, .xls)
                    </p>
                  </div>
                </div>
                
                {selectedFile && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded">
                        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          document.querySelector('input[type="file"]').value = '';
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-center">
                  <button
                    onClick={handleFileUpload}
                    disabled={!selectedFile}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
                  >
                    Analyze Excel File
                  </button>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex">
                    <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dashboard Overview */}
        {parsedData && currentView === 'dashboard' && (
          <>
            {/* Report Metadata */}
            {parsedData.metadata.title && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-2">{parsedData.metadata.title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  {parsedData.metadata.totalAreaFormatted && (
                    <div>
                      <span className="font-medium">Total Area:</span> {parsedData.metadata.totalAreaFormatted}
                    </div>
                  )}
                  {parsedData.metadata.centroidGridRef && (
                    <div>
                      <span className="font-medium">Grid Reference:</span> {parsedData.metadata.centroidGridRef}
                    </div>
                  )}
                  {parsedData.metadata.numberOfDataLayers && (
                    <div>
                      <span className="font-medium">Data Layers:</span> {parsedData.metadata.numberOfDataLayers}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Summary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Total Categories"
                value={parsedData.summary.totalCategories}
                subtitle="Data categories found"
                color="bg-blue-100"
                icon={
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                }
              />

              <MetricCard
                title="Data Layers"
                value={parsedData.summary.totalDataLayers}
                subtitle={`${parsedData.summary.categoriesWithData} with data`}
                color="bg-green-100"
                icon={
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              />

              <MetricCard
                title="Area Covered"
                value={dataLayersService.formatArea(parsedData.summary.totalAreaCovered)}
                subtitle="Total coverage"
                color="bg-yellow-100"
                icon={
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                  </svg>
                }
              />

              <MetricCard
                title="Coverage"
                value={dataLayersService.formatPercentage(parsedData.summary.coveragePercentage)}
                subtitle="Of total area"
                color="bg-purple-100"
                icon={
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
              />
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {parsedData.categories.map((category, index) => (
                <CategoryCard key={category.name} category={category} index={index} />
              ))}
            </div>
          </>
        )}

        {/* Categories View */}
        {parsedData && currentView === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parsedData.categories.map((category, index) => (
              <CategoryCard key={category.name} category={category} index={index} />
            ))}
          </div>
        )}

        {/* Detailed View */}
        {parsedData && currentView === 'details' && (
          <div>
            {parsedData.categories.map((category, index) => (
              <DetailedCategoryView key={category.name} category={category} />
            ))}
          </div>
        )}

        {/* Warnings and Errors */}
        {parsedData && (parsedData.warnings?.length > 0 || parsedData.errors?.length > 0) && (
          <div className="mt-8 space-y-4">
            {parsedData.warnings?.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Warnings:</h4>
                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                  {parsedData.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {parsedData.errors?.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">Errors:</h4>
                <ul className="list-disc list-inside space-y-1 text-red-700">
                  {parsedData.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataLayersDashboard;