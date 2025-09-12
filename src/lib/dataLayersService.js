import * as XLSX from 'xlsx';

/**
 * Data Layers Service
 * Parses Land App Excel report files into structured format for dashboard display
 */

class DataLayersService {
  /**
   * Parse Land App Excel report file into structured data
   * @param {File} file - Excel file from Land App report
   * @returns {Promise<Object>} Parsed report data
   */
  async parseExcelFile(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
      throw new Error('File must be an Excel file (.xlsx or .xls)');
    }

    try {
      // Read the file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Parse the Excel file
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Get the first worksheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON with headers
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, // Use array of arrays format
        defval: '', // Default value for empty cells
        blankrows: false // Skip blank rows
      });
      
      const result = {
        metadata: {},
        categories: [],
        summary: {},
        errors: [],
        warnings: [],
        rawData: jsonData // Store raw data for debugging
      };

      // Debug: Log the raw Excel data
      console.log('📊 Raw Excel Data (first 10 rows):', jsonData.slice(0, 10));
      
      // Parse the Excel data
      this.parseExcelData(jsonData, result);
      
      // Debug: Log parsed result
      console.log('🔍 Parsed Data Result:', {
        metadata: result.metadata,
        categoriesCount: result.categories.length,
        categories: result.categories.map(cat => ({
          name: cat.name,
          layersCount: cat.layers.length,
          totalArea: cat.totalArea,
          totalCount: cat.totalCount
        })),
        warnings: result.warnings,
        errors: result.errors
      });
      
      // Generate summary statistics
      this.generateSummary(result);
      
      return result;
    } catch (error) {
      throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
  }

  /**
   * Parse Excel data array into structured format
   */
  parseExcelData(data, result) {
    if (!data || data.length === 0) {
      result.warnings.push('Excel file appears to be empty');
      return;
    }

    // Look for metadata in the first few rows
    this.parseExcelMetadata(data, result);
    
    // Find the data table header
    const headerRowIndex = this.findHeaderRow(data);
    if (headerRowIndex === -1) {
      result.warnings.push('Could not find data table header');
      return;
    }

    // Parse the data rows
    this.parseExcelDataRows(data, headerRowIndex, result);
  }

  /**
   * Parse metadata from Excel data
   */
  parseExcelMetadata(data, result) {
    const metadata = {};
    
    console.log('🔍 Parsing metadata from Excel data');
    
    // Look for metadata in the first 15 rows
    for (let i = 0; i < Math.min(data.length, 15); i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      // Convert entire row to string for easier searching
      const rowText = row.join(' ').toLowerCase();
      const firstCell = String(row[0] || '').trim();
      const secondCell = String(row[1] || '').trim();
      
      console.log(`Metadata Row ${i}:`, row.slice(0, 3)); // Log first 3 cells
      
      // Extract report title - look for various patterns
      if (i < 3 && (firstCell.toLowerCase().includes('test report') || 
                    firstCell.toLowerCase().includes('norney') || 
                    rowText.includes('test report'))) {
        metadata.title = firstCell;
        console.log('📋 Found title:', firstCell);
        continue;
      }
      
      // Extract total area - be more flexible with the search
      if (rowText.includes('total area') && rowText.includes('ha')) {
        // Look through all cells in the row for the area value
        for (let j = 0; j < row.length; j++) {
          const cellValue = String(row[j] || '').trim();
          const areaMatch = cellValue.match(/([0-9.]+)\s*ha/);
          if (areaMatch) {
            metadata.totalArea = parseFloat(areaMatch[1]);
            metadata.totalAreaFormatted = `${areaMatch[1]} ha`;
            console.log('📏 Found total area:', metadata.totalAreaFormatted);
            break;
          }
        }
        continue;
      }
      
      // Extract centroid grid reference
      if (rowText.includes('centroid') && rowText.includes('grid')) {
        // Look for grid reference pattern
        for (let j = 1; j < row.length; j++) {
          const cellValue = String(row[j] || '').trim();
          if (cellValue.length > 5 && cellValue.match(/[A-Z0-9]/)) {
            metadata.centroidGridRef = cellValue;
            console.log('📍 Found grid reference:', cellValue);
            break;
          }
        }
        continue;
      }
      
      // Extract number of data layers
      if (rowText.includes('number of data layers') || rowText.includes('data layers')) {
        // Look through all cells for a number
        for (let j = 1; j < row.length; j++) {
          const cellValue = String(row[j] || '').trim();
          const layersMatch = cellValue.match(/([0-9]+)/);
          if (layersMatch && parseInt(layersMatch[1]) > 10) { // Should be a reasonable number
            metadata.numberOfDataLayers = parseInt(layersMatch[1]);
            console.log('🔢 Found data layers count:', metadata.numberOfDataLayers);
            break;
          }
        }
        continue;
      }
    }
    
    console.log('📊 Final metadata:', metadata);
    result.metadata = metadata;
  }

  /**
   * Find the header row in the Excel data
   */
  findHeaderRow(data) {
    console.log('🔍 Looking for header row in', data.length, 'rows');
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (row && row.length >= 4) {
        const rowStr = row.join(' ').toLowerCase();
        console.log(`Row ${i}:`, rowStr);
        
        if (rowStr.includes('category') && 
            rowStr.includes('data layer') && 
            (rowStr.includes('count') || rowStr.includes('area'))) {
          console.log('✅ Found header row at index:', i, 'Content:', row);
          return i;
        }
      }
    }
    console.log('❌ Header row not found');
    return -1;
  }

  /**
   * Parse data rows from Excel
   */
  parseExcelDataRows(data, headerRowIndex, result) {
    if (headerRowIndex === -1 || headerRowIndex >= data.length - 1) {
      console.log('❌ Cannot parse data rows: invalid header index', headerRowIndex);
      return;
    }

    const headerRow = data[headerRowIndex];
    const columnMap = this.createColumnMap(headerRow);
    
    let currentCategory = null;
    let processedRows = 0;
    
    console.log('📊 Starting to parse data rows from index', headerRowIndex + 1);
    
    // Parse each data row
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) {
        console.log(`Row ${i}: Empty, skipping`);
        continue;
      }
      
      const categoryName = String(row[columnMap.category] || '').trim();
      const dataLayerName = String(row[columnMap.dataLayer] || '').trim();
      
      console.log(`Row ${i}: Category="${categoryName}", DataLayer="${dataLayerName}"`);
      
      // Skip empty rows or rows without category/data layer
      if (!categoryName && !dataLayerName) {
        console.log(`Row ${i}: No category or data layer, skipping`);
        continue;
      }
      
      // Check if this is a "No results" section
      if (categoryName.toLowerCase() === 'no results' || 
          dataLayerName.toLowerCase() === 'no results') {
        console.log('📍 Found "No results" section at row', i);
        this.parseNoResultsExcel(data, i, result, columnMap);
        break;
      }
      
      // If we have a new category, update current category
      if (categoryName && categoryName !== currentCategory && categoryName !== '') {
        currentCategory = categoryName;
        console.log('🏷️ New category:', currentCategory);
      }
      
      // Create or find the category group
      if (currentCategory) {
        let categoryGroup = result.categories.find(cat => cat.name === currentCategory);
        if (!categoryGroup) {
          categoryGroup = {
            name: currentCategory,
            layers: [],
            totalCount: 0,
            totalArea: 0,
            hasData: true
          };
          result.categories.push(categoryGroup);
          console.log('➕ Created new category group:', currentCategory);
        }
        
        // Add the layer if it has a name (or use category name if dataLayer is empty)
        const layerName = dataLayerName || categoryName;
        if (layerName && layerName !== 'Sub-Total') {
          const layerEntry = this.parseExcelRow(row, columnMap, layerName);
          categoryGroup.layers.push(layerEntry);
          
          categoryGroup.totalCount += layerEntry.count || 0;
          categoryGroup.totalArea += layerEntry.area || 0;
          
          console.log(`✅ Added layer "${layerName}" to category "${currentCategory}":`, {
            count: layerEntry.count,
            area: layerEntry.area,
            percentage: layerEntry.percentage
          });
          
          processedRows++;
        }
      }
    }
    
    console.log(`🎯 Processed ${processedRows} data rows, created ${result.categories.length} categories`);
  }

  /**
   * Create a column mapping from the header row
   */
  createColumnMap(headerRow) {
    const map = {};
    
    console.log('📋 Creating column map from header:', headerRow);
    
    for (let i = 0; i < headerRow.length; i++) {
      const header = String(headerRow[i] || '').toLowerCase().trim();
      console.log(`Column ${i}: "${header}"`);
      
      if (header.includes('category')) {
        map.category = i;
        console.log(`  → Mapped as 'category'`);
      } else if (header.includes('data layer')) {
        map.dataLayer = i;
        console.log(`  → Mapped as 'dataLayer'`);
      } else if (header.includes('sub-category')) {
        map.subCategory = i;
        console.log(`  → Mapped as 'subCategory'`);
      } else if (header.includes('count')) {
        map.count = i;
        console.log(`  → Mapped as 'count'`);
      } else if (header.includes('area') && header.includes('ha')) {
        map.area = i;
        console.log(`  → Mapped as 'area'`);
      } else if (header.includes('% of area') || header.includes('area %')) {
        map.percentage = i;
        console.log(`  → Mapped as 'percentage'`);
      } else if (header.includes('length')) {
        map.length = i;
        console.log(`  → Mapped as 'length'`);
      } else if (header.includes('source')) {
        map.source = i;
        console.log(`  → Mapped as 'source'`);
      }
    }
    
    console.log('🗺️ Final column map:', map);
    return map;
  }

  /**
   * Parse a single Excel row into a layer entry
   */
  parseExcelRow(row, columnMap, dataLayerName) {
    const entry = {
      name: dataLayerName,
      count: null,
      area: null,
      areaFormatted: null,
      percentage: null,
      length: null,
      lengthFormatted: null,
      source: null
    };
    
    // Extract count
    if (columnMap.count !== undefined) {
      const countValue = row[columnMap.count];
      if (countValue && !isNaN(countValue)) {
        entry.count = parseInt(countValue);
      }
    }
    
    // Extract area
    if (columnMap.area !== undefined) {
      const areaValue = row[columnMap.area];
      if (areaValue && areaValue !== '' && areaValue !== 'N/A' && areaValue !== 'n/a') {
        const areaStr = String(areaValue).trim();
        // Look for numbers with optional decimal places
        const areaMatch = areaStr.match(/([0-9]+\.?[0-9]*)/);
        if (areaMatch) {
          entry.area = parseFloat(areaMatch[1]);
          entry.areaFormatted = areaStr.includes('ha') ? areaStr : `${areaMatch[1]} ha`;
          console.log(`  📊 Parsed area: ${entry.area} ha from "${areaStr}"`);
        }
      }
    }
    
    // Extract percentage
    if (columnMap.percentage !== undefined) {
      const percentValue = row[columnMap.percentage];
      if (percentValue && percentValue !== '' && percentValue !== 'N/A' && percentValue !== 'n/a') {
        const percentStr = String(percentValue).trim();
        // Handle both numeric values and percentage strings
        const percentMatch = percentStr.match(/([0-9]+\.?[0-9]*)/);
        if (percentMatch) {
          entry.percentage = parseFloat(percentMatch[1]);
          console.log(`  📊 Parsed percentage: ${entry.percentage}% from "${percentStr}"`);
        }
      }
    }
    
    // Extract length
    if (columnMap.length !== undefined) {
      const lengthValue = row[columnMap.length];
      if (lengthValue) {
        const lengthStr = String(lengthValue);
        const lengthMatch = lengthStr.match(/([0-9.]+)/);
        if (lengthMatch) {
          entry.length = parseFloat(lengthMatch[1]);
          entry.lengthFormatted = lengthStr.includes('m') ? lengthStr : `${lengthMatch[1]} m`;
        }
      }
    }
    
    // Extract source
    if (columnMap.source !== undefined) {
      const sourceValue = row[columnMap.source];
      if (sourceValue) {
        entry.source = String(sourceValue).trim();
      }
    }
    
    return entry;
  }

  /**
   * Parse "No results" section from Excel
   */
  parseNoResultsExcel(data, startIndex, result, columnMap) {
    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      const categoryName = String(row[columnMap.category] || '').trim();
      const dataLayerName = String(row[columnMap.dataLayer] || '').trim();
      const source = String(row[columnMap.source] || '').trim();
      
      if (categoryName && dataLayerName) {
        // Find or create category
        let categoryGroup = result.categories.find(cat => cat.name === categoryName);
        if (!categoryGroup) {
          categoryGroup = {
            name: categoryName,
            layers: [],
            totalCount: 0,
            totalArea: 0,
            hasData: false
          };
          result.categories.push(categoryGroup);
        }
        
        // Add as no-data layer
        categoryGroup.layers.push({
          name: dataLayerName,
          hasData: false,
          source: source || 'Unknown'
        });
      }
    }
  }

  /**
   * Check if line looks like a source
   */
  isSourceLine(line) {
    const sourceIndicators = ['England', 'Wales', 'Scotland', 'Agency', 'Commission', 'Survey', 
                             'Office', 'Ministry', 'Government', 'Authority', 'Registry', 'RSPB', 
                             'Natural', 'Historic', 'Rural', 'Payments', 'Ordnance', 'British'];
    return sourceIndicators.some(indicator => line.includes(indicator));
  }

  /**
   * Generate summary statistics
   */
  generateSummary(result) {
    const summary = {
      totalCategories: result.categories.length,
      categoriesWithData: result.categories.filter(cat => cat.hasData).length,
      totalDataLayers: 0,
      totalAreaCovered: 0,
      coveragePercentage: 0
    };
    
    result.categories.forEach(category => {
      summary.totalDataLayers += category.layers.length;
      summary.totalAreaCovered += category.totalArea || 0;
    });
    
    // Calculate coverage percentage
    if (result.metadata.totalArea && summary.totalAreaCovered > 0) {
      summary.coveragePercentage = Math.min(100, (summary.totalAreaCovered / result.metadata.totalArea) * 100);
    }
    
    result.summary = summary;
  }

  /**
   * Format area value for display
   */
  formatArea(area) {
    if (area === null || area === undefined) return 'N/A';
    if (area < 1) {
      return `${(area * 10000).toFixed(0)} m²`;
    }
    return `${area.toFixed(2)} ha`;
  }

  /**
   * Format percentage value for display
   */
  formatPercentage(percentage) {
    if (percentage === null || percentage === undefined) return 'N/A';
    return `${percentage.toFixed(1)}%`;
  }

  /**
   * Get category color for visualization
   */
  getCategoryColor(categoryName, index = 0) {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-red-100 text-red-800',
      'bg-orange-100 text-orange-800'
    ];
    
    // Try to assign consistent colors based on category name
    const categoryColorMap = {
      'Access': 'bg-blue-100 text-blue-800',
      'Administrative': 'bg-gray-100 text-gray-800',
      'Designations': 'bg-green-100 text-green-800',
      'Geology': 'bg-yellow-100 text-yellow-800',
      'Habitat': 'bg-emerald-100 text-emerald-800',
      'Historic': 'bg-amber-100 text-amber-800',
      'Landscape': 'bg-lime-100 text-lime-800',
      'Ownership': 'bg-purple-100 text-purple-800',
      'Schemes': 'bg-cyan-100 text-cyan-800',
      'Water': 'bg-blue-100 text-blue-800',
      'Utilities': 'bg-orange-100 text-orange-800'
    };
    
    return categoryColorMap[categoryName] || colors[index % colors.length];
  }

  /**
   * Validate parsed data
   */
  validateParsedData(data) {
    const errors = [];
    
    if (!data.metadata.totalArea) {
      errors.push('Total area not found in report');
    }
    
    if (!data.metadata.numberOfDataLayers) {
      errors.push('Number of data layers not found in report');
    }
    
    if (data.categories.length === 0) {
      errors.push('No data categories found in report');
    }
    
    return errors;
  }
}

export default new DataLayersService();