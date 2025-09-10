# Energy Performance Certificate (EPC) Integration

This document describes the new EPC functionality added to the DEFRA Contract Management Database application.

## Overview

The EPC integration allows users to:
1. Load building data from existing Land App API plans
2. Automatically fetch Energy Performance Certificate data from the UK EPC database
3. Match buildings to EPC certificates using UPRNs, postcodes, and addresses
4. Visualize energy performance data through dashboards, maps, and tables
5. Export comprehensive energy performance reports

## Features

### 🔋 Energy Performance Dashboard
- **Key Metrics Cards**: Total buildings, EPC coverage percentage, average efficiency, expiring certificates
- **Interactive Charts**: Energy rating distribution, property type breakdown, efficiency analysis
- **Performance Indicators**: Visual KPIs with color-coded status indicators
- **Timeline Analysis**: Certificate age and expiry tracking

### 🗺️ Interactive Energy Map
- **Building Visualization**: Color-coded building polygons based on energy ratings
- **Layer Controls**: Switch between rating, efficiency, CO2 emissions, and certificate age views
- **Building Details**: Click on buildings for detailed EPC information
- **Legend**: Dynamic legend showing current visualization layer

### 📊 Comprehensive Data Table
- **Sortable Columns**: All data columns can be sorted ascending/descending
- **Advanced Filtering**: Filter by energy rating, property type, match status
- **Search Functionality**: Full-text search across addresses and UPRNs
- **Pagination**: Configurable page sizes for large datasets
- **CSV Export**: Export filtered data for further analysis

### 🏢 Building Detail Modal
- **Complete EPC Information**: Current and potential ratings, efficiency scores, CO2 emissions
- **Certificate Details**: Issue dates, expiry dates, assessor information
- **Match Quality**: Confidence scoring and match method transparency
- **Improvement Recommendations**: Official EPC improvement suggestions

### 📈 Export & Reporting
- **CSV Data Export**: Complete building data with all EPC fields
- **Summary Reports**: Text-based executive summaries
- **Progress Tracking**: Real-time processing progress indicators

## Technical Implementation

### Data Flow
1. **Estate Selection**: User selects plans containing building features
2. **Building Extraction**: System extracts OSMM building polygons from plans
3. **Identifier Matching**: UPRNs, postcodes, and addresses extracted for EPC lookup
4. **Batch Processing**: EPC API queried in batches with rate limiting
5. **Confidence Scoring**: Buildings matched to EPC data with quality metrics
6. **Visualization**: Results presented through multiple interactive views

### API Integration
- **EPC Database**: Integration with UK Open Data Communities EPC API
- **Authentication**: Uses provided API credentials for secure access
- **Rate Limiting**: Respectful API usage with built-in delays and batch processing
- **Caching**: 24-hour cache for EPC data to avoid redundant API calls
- **Error Handling**: Comprehensive error handling with user feedback

### Data Matching Algorithm
1. **Primary Match**: Exact UPRN matching (highest confidence: 1.0)
2. **Secondary Match**: Postcode + address matching (confidence: 0.8)
3. **Tertiary Match**: Fuzzy address matching using Levenshtein distance (confidence: 0.6)
4. **Quality Scoring**: All matches scored for transparency and manual review

### Components Architecture
```
src/components/EnergyPerformance/
├── EnergyDashboard.jsx    # Main dashboard with metrics and charts
├── EnergyMap.jsx          # Interactive Leaflet map with building overlays
├── EnergyTable.jsx        # Sortable/filterable data table
├── EnergyCharts.jsx       # Chart.js visualization components
├── BuildingDetail.jsx     # Individual building modal
└── ExportControls.jsx     # PDF/CSV export functionality
```

### Service Layer
```
src/lib/epcService.js      # Core EPC API integration and processing logic
```

## Database Schema (Supabase)

The application includes a comprehensive database schema for storing EPC data:

- **epc_certificates**: Core EPC certificate data with full indexing
- **osmm_epc_links**: Building-to-EPC relationships with confidence scoring
- **epc_processing_jobs**: Job tracking for large estate processing

See `supabase_epc_schema.sql` for complete schema definition.

## Usage Workflow

### Getting Started
1. **Load Plans**: Use existing Land App API functionality to load environmental plans
2. **View Features**: Load building features for selected plans using "View Features" functionality
3. **Switch to Energy View**: Click the "Energy" tab in the view toggle
4. **Process EPC Data**: Click "Load EPC Data" to begin processing
5. **Explore Results**: Use Dashboard, Map, and Table views to analyze data

### Best Practices
- **Feature Loading**: Always load plan features before processing EPC data
- **Large Estates**: For estates with >1000 buildings, expect 10-15 minutes processing time
- **Data Quality**: Review match confidence scores for data validation
- **Regular Updates**: Refresh EPC data periodically as certificates are updated

### Performance Considerations
- **Batch Processing**: Buildings processed in batches of 10 to respect API limits
- **Progress Tracking**: Real-time progress indicators for long-running operations
- **Caching Strategy**: 24-hour cache reduces API calls and improves performance
- **Error Recovery**: Robust error handling with retry mechanisms

## Configuration

### Environment Variables
```bash
# EPC API credentials (already configured)
EPC_API_USERNAME=tim@thelandapp.com
EPC_API_KEY=a5d949347cbd1536e2cd32df63d2192be45e19c0
EPC_API_BASE_URL=https://epc.opendatacommunities.org/api/v1
```

### Application Settings
- **Cache TTL**: 24 hours for EPC data
- **Batch Size**: 10 buildings per API request
- **Request Timeout**: 30 seconds per API call
- **Progress Updates**: Real-time progress reporting

## Troubleshooting

### Common Issues
1. **No EPC Data Found**: Check that buildings have valid UPRNs or postcodes
2. **API Rate Limiting**: System handles rate limits automatically with delays
3. **Large Estate Processing**: Be patient - processing 500+ buildings takes time
4. **Map Not Loading**: Ensure Leaflet CDN resources are accessible

### Data Quality
- **High Confidence Matches**: UPRN matches (confidence = 1.0) are most reliable
- **Medium Confidence**: Postcode matches (confidence = 0.8) are generally good
- **Lower Confidence**: Address matches (confidence = 0.6) may need manual review
- **No Matches**: Buildings without EPC certificates are clearly identified

## Future Enhancements

### Planned Features
- **Predictive Analytics**: ML models for energy upgrade ROI prediction
- **Benchmarking**: Compare estate performance to regional/national averages
- **Asset Integration**: Link EPC data to maintenance and upgrade scheduling
- **Mobile Support**: Field officer capabilities for data updates
- **API Extensions**: Third-party system integration capabilities

### Performance Improvements
- **Background Processing**: Queue system for large estate processing
- **Progressive Loading**: Stream results as they become available
- **Data Persistence**: Store processed results in Supabase for faster access
- **Advanced Caching**: Redis integration for enterprise deployments

## Support

For technical issues or feature requests related to the EPC functionality, please refer to the main application documentation or contact the development team.

---

**Note**: This EPC integration demonstrates a production-ready approach to combining geospatial building data with government energy performance datasets, providing comprehensive analytics for estate management and sustainability planning.