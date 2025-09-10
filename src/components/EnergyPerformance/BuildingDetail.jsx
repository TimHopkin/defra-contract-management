import React from 'react';
import { getEnergyRatingColor } from '../../lib/epcService';

const BuildingDetail = ({ match, onClose, isOpen }) => {
  if (!isOpen || !match) return null;

  const building = match.building;
  const epc = match.epcData;

  const DetailRow = ({ label, value, className = '' }) => (
    <div className={`flex justify-between py-2 ${className}`}>
      <span className="text-sm font-medium text-gray-600">{label}:</span>
      <span className="text-sm text-gray-900">{value || 'N/A'}</span>
    </div>
  );

  const SectionHeader = ({ children }) => (
    <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
      {children}
    </h3>
  );

  const getExpiryDate = (lodgementDate) => {
    if (!lodgementDate) return null;
    const expiry = new Date(lodgementDate);
    expiry.setFullYear(expiry.getFullYear() + 10);
    return expiry;
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    return expiryDate <= sixMonthsFromNow;
  };

  const getCertificateStatus = () => {
    if (!epc?.['lodgement-date']) return 'Unknown';
    
    const expiryDate = getExpiryDate(epc['lodgement-date']);
    const now = new Date();
    
    if (expiryDate < now) return 'Expired';
    if (isExpiringSoon(expiryDate)) return 'Expiring Soon';
    return 'Valid';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Valid': return 'text-green-600 bg-green-100';
      case 'Expiring Soon': return 'text-yellow-600 bg-yellow-100';
      case 'Expired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Building Energy Performance</h2>
              <p className="text-gray-600 mt-1">Detailed EPC information</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <SectionHeader>Property Information</SectionHeader>
              <div className="bg-gray-50 rounded-lg p-4">
                <DetailRow label="Address" value={epc?.address || building.properties?.address} />
                <DetailRow label="UPRN" value={epc?.uprn || building.properties?.uprn} />
                <DetailRow label="Postcode" value={epc?.postcode || building.properties?.postcode} />
                <DetailRow label="Property Type" value={epc?.['property-type'] || epc?.['building-category']} />
                <DetailRow label="Built Form" value={epc?.['built-form']} />
                <DetailRow 
                  label="Total Floor Area" 
                  value={epc?.['total-floor-area'] ? `${epc['total-floor-area']} m²` : null} 
                />
              </div>
            </div>

            {/* Energy Performance */}
            {epc ? (
              <div>
                <SectionHeader>Energy Performance</SectionHeader>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Current Rating */}
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-600 mb-2">Current Rating</div>
                      <div 
                        className="inline-flex items-center justify-center w-16 h-16 rounded-full text-white text-2xl font-bold"
                        style={{ backgroundColor: getEnergyRatingColor(epc['current-energy-rating'] || epc['asset-rating']) }}
                      >
                        {epc['current-energy-rating'] || epc['asset-rating'] || 'N/A'}
                      </div>
                    </div>

                    {/* Potential Rating */}
                    {epc['potential-energy-rating'] && (
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-600 mb-2">Potential Rating</div>
                        <div 
                          className="inline-flex items-center justify-center w-16 h-16 rounded-full text-white text-2xl font-bold"
                          style={{ backgroundColor: getEnergyRatingColor(epc['potential-energy-rating']) }}
                        >
                          {epc['potential-energy-rating']}
                        </div>
                      </div>
                    )}
                  </div>

                  <DetailRow 
                    label="Energy Efficiency Score" 
                    value={epc['energy-efficiency-rating'] || epc['asset-rating-numeric'] ? `${epc['energy-efficiency-rating'] || epc['asset-rating-numeric']}/100` : null} 
                  />
                  <DetailRow 
                    label="Potential Efficiency Score" 
                    value={epc['potential-energy-efficiency'] ? `${epc['potential-energy-efficiency']}/100` : null} 
                  />
                  <DetailRow 
                    label="CO2 Emissions" 
                    value={epc['co2-emissions-current'] ? `${epc['co2-emissions-current']} tonnes/year` : null} 
                  />
                  <DetailRow 
                    label="Potential CO2 Emissions" 
                    value={epc['co2-emiss-curr-per-floor-area'] ? `${epc['co2-emiss-curr-per-floor-area']} tonnes/year` : null} 
                  />
                  <DetailRow 
                    label="Energy Consumption" 
                    value={epc['energy-consumption-current'] ? `${epc['energy-consumption-current']} kWh/m²/year` : null} 
                  />
                </div>
              </div>
            ) : (
              <div>
                <SectionHeader>Energy Performance</SectionHeader>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-yellow-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-yellow-800">No EPC data available for this building</span>
                  </div>
                </div>
              </div>
            )}

            {/* Certificate Details */}
            {epc && (
              <div>
                <SectionHeader>Certificate Details</SectionHeader>
                <div className="bg-gray-50 rounded-lg p-4">
                  <DetailRow 
                    label="Certificate Status" 
                    value={
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getCertificateStatus())}`}>
                        {getCertificateStatus()}
                      </span>
                    } 
                  />
                  <DetailRow 
                    label="Issue Date" 
                    value={epc['lodgement-date'] ? new Date(epc['lodgement-date']).toLocaleDateString() : null} 
                  />
                  <DetailRow 
                    label="Inspection Date" 
                    value={epc['inspection-date'] ? new Date(epc['inspection-date']).toLocaleDateString() : null} 
                  />
                  <DetailRow 
                    label="Expiry Date" 
                    value={epc['lodgement-date'] ? getExpiryDate(epc['lodgement-date']).toLocaleDateString() : null} 
                  />
                  <DetailRow label="Certificate Number" value={epc['lmk-key'] || epc['building-reference-number']} />
                  <DetailRow label="Assessor Name" value={epc['assessor-name']} />
                  <DetailRow label="Assessment Company" value={epc['assessment-company']} />
                </div>
              </div>
            )}

            {/* Match Quality */}
            <div>
              <SectionHeader>Data Match Quality</SectionHeader>
              <div className="bg-gray-50 rounded-lg p-4">
                <DetailRow 
                  label="Match Confidence" 
                  value={match.matchConfidence ? `${Math.round(match.matchConfidence * 100)}%` : 'N/A'} 
                />
                <DetailRow 
                  label="Match Method" 
                  value={match.matchMethod?.toUpperCase().replace('_', ' ')} 
                />
                <DetailRow 
                  label="Match Status" 
                  value={
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      match.status === 'matched' 
                        ? 'bg-green-100 text-green-800'
                        : match.status === 'no_epc_found'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {match.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  } 
                />
                {match.allMatches && match.allMatches.length > 1 && (
                  <DetailRow 
                    label="Alternative Matches" 
                    value={`${match.allMatches.length - 1} other possible matches found`} 
                  />
                )}
              </div>
            </div>

            {/* Recommendations */}
            {epc && epc['improvement-summary-text'] && (
              <div>
                <SectionHeader>Improvement Recommendations</SectionHeader>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">{epc['improvement-summary-text']}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end space-x-3">
            {epc?.['lodgement-datetime'] && (
              <a
                href={`https://find-energy-certificate.service.gov.uk/energy-certificate/${epc['lmk-key'] || epc['building-reference-number']}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Official Certificate
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildingDetail;