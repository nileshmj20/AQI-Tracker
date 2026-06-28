/**
 * Page metadata and visible block selectors used by the left rail navigation.
 */
export const pageConfig = {
    dashboard: {
      kicker: 'Globe',
      title: '4K pixel globe and solar system explorer',
      description: 'Use the satellite-style Earth for live AQI markers, then zoom to planets in the solar system explorer.',
      badge: 'Globe + Solar',
      blocks: ['.hero-layout', '.stat-grid', '#visitor-tools']
    },
    layers: {
      kicker: 'Layers',
      title: 'Dedicated map layer control room',
      description: 'This page is only for overlays: AQI, heatmap, stations, traffic, roads and terrain controls.',
      badge: 'Overlay Lab',
      blocks: ['#layer-control-page']
    },
    trends: {
      kicker: 'Analytics',
      title: 'Detailed AQI, pollutant and weather graphs',
      description: 'Clear chart cards with fixed heights, strong labels and square graph panels for analysis.',
      badge: 'Graphs',
      blocks: ['.chart-grid', '#advanced-analytics']
    },
    alerts: {
      kicker: 'Safety',
      title: 'Search, alerts and visitor decisions',
      description: 'Location tools and warning cards are grouped together for fast action.',
      badge: 'Safety',
      blocks: ['.search-report-row', '#visitor-tools']
    },
    'weather-intel': {
      kicker: 'Weather',
      title: 'Weather intelligence and outdoor planner',
      description: 'Weather metrics and outdoor planning now live on their own page for better readability.',
      badge: 'Weather',
      blocks: ['#weather-intel']
    },
    'disaster-watch': {
      kicker: 'Disaster watch',
      title: 'Hazards and live risk monitoring',
      description: 'Earthquake, natural event and risk summaries are separated from the core AQI cards.',
      badge: 'Hazards',
      blocks: ['.disaster-page-grid']
    },
    'live-news': {
      kicker: 'Live updates',
      title: 'Auto briefing and event signals',
      description: 'News-style AQI, weather and hazard updates grouped in a focused page.',
      badge: 'Briefing',
      blocks: ['.news-page-grid']
    },
    areas: {
      kicker: 'Area intelligence',
      title: 'Neighbourhood AQI breakdown',
      description: 'Nearby area cards now use the full page so the layout does not leave unused panels.',
      badge: 'Areas',
      blocks: ['#areas']
    },
    reports: {
      kicker: 'Reports',
      title: 'Insights and export tools',
      description: 'Recommendation cards, DOCX/PDF export and button explanations are grouped for project review.',
      badge: 'Reports',
      blocks: ['.insight-report-grid', '#button-guide']
    },
    'phase-lab': {
      kicker: 'Project lab',
      title: 'Comparison, forecast, health profile and saved cities',
      description: 'Advanced project features are placed on a separate page with compact square tiles.',
      badge: 'Lab',
      blocks: ['#phase-lab']
    },
    'live-radio': {
      kicker: 'Live radio',
      title: 'Modern radio player',
      description: 'Search, choose and instantly play stations from a focused music page.',
      badge: 'Radio',
      blocks: ['#live-radio']
    }
  };
