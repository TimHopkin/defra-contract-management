import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line, Scatter } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// Energy Rating Distribution Chart
export const RatingDistributionChart = ({ summary }) => {
  const data = {
    labels: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    datasets: [
      {
        label: 'Number of Buildings',
        data: [
          summary.ratingDistribution.A,
          summary.ratingDistribution.B,
          summary.ratingDistribution.C,
          summary.ratingDistribution.D,
          summary.ratingDistribution.E,
          summary.ratingDistribution.F,
          summary.ratingDistribution.G
        ],
        backgroundColor: [
          '#00a651',
          '#19b459',
          '#8cc63f',
          '#ffd700',
          '#f57c00',
          '#e53e3e',
          '#c53030'
        ],
        borderWidth: 1
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Energy Rating Distribution'
      },
      tooltip: {
        callbacks: {
          title: (context) => `Rating ${context[0].label}`,
          label: (context) => `${context.parsed.y} buildings`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  return (
    <div className="h-64">
      <Bar data={data} options={options} />
    </div>
  );
};

// Property Type Distribution Chart
export const PropertyTypeChart = ({ summary }) => {
  const propertyTypes = Object.keys(summary.propertyTypes);
  const counts = Object.values(summary.propertyTypes);
  
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#f97316', '#06b6d4', '#84cc16'
  ];

  const data = {
    labels: propertyTypes,
    datasets: [
      {
        data: counts,
        backgroundColor: colors.slice(0, propertyTypes.length),
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right'
      },
      title: {
        display: true,
        text: 'Property Types'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const total = counts.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="h-64">
      <Doughnut data={data} options={options} />
    </div>
  );
};

// Coverage and Performance Metrics Chart
export const PerformanceMetricsChart = ({ summary }) => {
  const data = {
    labels: ['Coverage %', 'Avg Efficiency', 'Expiring Soon %'],
    datasets: [
      {
        label: 'Metrics',
        data: [
          summary.coveragePercent,
          summary.averageEfficiency,
          summary.totalBuildings > 0 ? Math.round((summary.expiringCertificates / summary.totalBuildings) * 100) : 0
        ],
        backgroundColor: [
          summary.coveragePercent >= 90 ? '#10b981' : summary.coveragePercent >= 70 ? '#f59e0b' : '#ef4444',
          summary.averageEfficiency >= 70 ? '#10b981' : summary.averageEfficiency >= 50 ? '#f59e0b' : '#ef4444',
          summary.expiringCertificates === 0 ? '#10b981' : '#f59e0b'
        ]
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Key Performance Indicators'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const labels = ['Coverage', 'Efficiency Score', 'Expiring Soon'];
            const units = ['%', '/100', '%'];
            return `${labels[context.dataIndex]}: ${context.parsed.x}${units[context.dataIndex]}`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 100
      }
    }
  };

  return (
    <div className="h-48">
      <Bar data={data} options={options} />
    </div>
  );
};

// Efficiency vs Floor Area Scatter Plot
export const EfficiencyScatterChart = ({ matches }) => {
  const validMatches = matches.filter(match => 
    match.epcData && 
    match.epcData['energy-efficiency-rating'] && 
    match.epcData['total-floor-area']
  );

  const data = {
    datasets: [
      {
        label: 'Buildings',
        data: validMatches.map(match => ({
          x: parseFloat(match.epcData['total-floor-area']),
          y: parseInt(match.epcData['energy-efficiency-rating']),
          building: match.building,
          epc: match.epcData
        })),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Energy Efficiency vs Floor Area'
      },
      tooltip: {
        callbacks: {
          title: () => '',
          label: (context) => {
            const point = context.raw;
            return [
              `Floor Area: ${point.x} m²`,
              `Efficiency: ${point.y}/100`,
              `Rating: ${point.epc['current-energy-rating'] || 'N/A'}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: {
          display: true,
          text: 'Floor Area (m²)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Energy Efficiency Score'
        },
        min: 0,
        max: 100
      }
    }
  };

  if (validMatches.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="mt-2">No efficiency data available for scatter plot</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <Scatter data={data} options={options} />
    </div>
  );
};

// CO2 Emissions by Property Type
export const CO2EmissionsChart = ({ matches }) => {
  // Group by property type and calculate average CO2
  const propertyTypeEmissions = {};
  
  matches.forEach(match => {
    if (match.epcData && match.epcData['co2-emissions-current']) {
      const propType = match.epcData['property-type'] || 'Unknown';
      const co2 = parseFloat(match.epcData['co2-emissions-current']);
      
      if (!isNaN(co2)) {
        if (!propertyTypeEmissions[propType]) {
          propertyTypeEmissions[propType] = { total: 0, count: 0 };
        }
        propertyTypeEmissions[propType].total += co2;
        propertyTypeEmissions[propType].count += 1;
      }
    }
  });

  const labels = Object.keys(propertyTypeEmissions);
  const averages = labels.map(type => 
    propertyTypeEmissions[type].total / propertyTypeEmissions[type].count
  );

  if (labels.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="mt-2">No CO2 emissions data available</p>
        </div>
      </div>
    );
  }

  const data = {
    labels,
    datasets: [
      {
        label: 'Average CO2 Emissions (tonnes/year)',
        data: averages,
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Average CO2 Emissions by Property Type'
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y.toFixed(2)} tonnes/year`
        }
      }
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'CO2 Emissions (tonnes/year)'
        }
      }
    }
  };

  return (
    <div className="h-64">
      <Bar data={data} options={options} />
    </div>
  );
};

// EPC Certificate Age Timeline
export const CertificateTimelineChart = ({ matches }) => {
  // Group certificates by year
  const yearGroups = {};
  const currentYear = new Date().getFullYear();
  
  // Initialize last 10 years
  for (let i = 9; i >= 0; i--) {
    yearGroups[currentYear - i] = 0;
  }

  matches.forEach(match => {
    if (match.epcData && match.epcData['lodgement-date']) {
      const lodgementYear = new Date(match.epcData['lodgement-date']).getFullYear();
      if (yearGroups.hasOwnProperty(lodgementYear)) {
        yearGroups[lodgementYear]++;
      }
    }
  });

  const years = Object.keys(yearGroups).sort();
  const counts = years.map(year => yearGroups[year]);

  const data = {
    labels: years,
    datasets: [
      {
        label: 'Certificates Issued',
        data: counts,
        fill: false,
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.1
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'EPC Certificates by Issue Year'
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y} certificates issued`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        },
        title: {
          display: true,
          text: 'Number of Certificates'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Year'
        }
      }
    }
  };

  return (
    <div className="h-64">
      <Line data={data} options={options} />
    </div>
  );
};