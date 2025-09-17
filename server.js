import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Google Analytics 4 Data API setup
const analyticsData = google.analyticsdata('v1beta');

// Service account authentication
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
});

// Helper function to format date for GA4
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

const DEFAULT_DAYS = 30;

const parseDays = (value, fallback = DEFAULT_DAYS) => {
  const parsed = parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

// Helper function to get date range
const getDateRange = (days = DEFAULT_DAYS) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
};

// Helper function to get comparison period
const getComparisonDateRange = (days = DEFAULT_DAYS) => {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - days);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days * 2));

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
};

// Mock data generator for development/demo
const generateMockData = (days = DEFAULT_DAYS) => {
  const totalDays = parseDays(days);
  const dateRange = getDateRange(totalDays);
  const chartData = [];

  // Generate mock data matching requested range
  for (let i = totalDays - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    chartData.push({
      date: formatDate(date),
      users: Math.floor(Math.random() * 1000) + 500,
      sessions: Math.floor(Math.random() * 1200) + 600,
      pageviews: Math.floor(Math.random() * 2000) + 1000,
      bounceRate: Math.random() * 40 + 30,
    });
  }

  const mockMetrics = {
    users: {
      value: 15420,
      change: 1234,
      changePercent: 8.7,
    },
    sessions: {
      value: 18650,
      change: 1456,
      changePercent: 8.5,
    },
    pageviews: {
      value: 42380,
      change: 3210,
      changePercent: 8.2,
    },
    bounceRate: {
      value: 34.5,
      change: -2.1,
      changePercent: -5.7,
    },
    avgSessionDuration: {
      value: 142,
      change: 12,
      changePercent: 9.2,
    },
  };

  const mockPages = [
    { page: '/', pageviews: 8542, uniquePageviews: 7123, bounceRate: 32.1, avgTimeOnPage: 95 },
    { page: '/about', pageviews: 4321, uniquePageviews: 3876, bounceRate: 45.2, avgTimeOnPage: 120 },
    { page: '/contact', pageviews: 2876, uniquePageviews: 2543, bounceRate: 38.7, avgTimeOnPage: 85 },
    { page: '/services', pageviews: 2234, uniquePageviews: 2010, bounceRate: 41.3, avgTimeOnPage: 110 },
    { page: '/blog', pageviews: 1987, uniquePageviews: 1754, bounceRate: 29.8, avgTimeOnPage: 180 },
  ];

  const mockSources = [
    { source: 'google', users: 6543, sessions: 7234, bounceRate: 32.1 },
    { source: 'direct', users: 4321, sessions: 4876, bounceRate: 28.7 },
    { source: 'facebook', users: 2134, sessions: 2543, bounceRate: 45.2 },
    { source: 'twitter', users: 1234, sessions: 1456, bounceRate: 38.9 },
    { source: 'linkedin', users: 876, sessions: 987, bounceRate: 42.1 },
  ];

  const mockDevices = [
    { device: 'Desktop', users: 8765, sessions: 9876, bounceRate: 31.2 },
    { device: 'Mobile', users: 5432, sessions: 6543, bounceRate: 35.8 },
    { device: 'Tablet', users: 1223, sessions: 1431, bounceRate: 39.4 },
  ];

  const mockCountries = [
    { country: 'United States', users: 7654, sessions: 8765 },
    { country: 'United Kingdom', users: 2345, sessions: 2876 },
    { country: 'Canada', users: 1876, sessions: 2234 },
    { country: 'Germany', users: 1543, sessions: 1876 },
    { country: 'France', users: 1234, sessions: 1456 },
  ];

  return {
    metrics: mockMetrics,
    chartData,
    topPages: mockPages,
    trafficSources: mockSources,
    devices: mockDevices,
    countries: mockCountries,
    dateRange,
  };
};

// GA4 Data fetching functions
async function fetchGA4Metrics(authClient, propertyId, dateRange, comparisonDateRange) {
  try {
    // Main period metrics
    const mainResponse = await analyticsData.properties.runReport({
      auth: authClient,
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
        ],
      },
    });

    // Comparison period metrics
    const comparisonResponse = await analyticsData.properties.runReport({
      auth: authClient,
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: comparisonDateRange.startDate, endDate: comparisonDateRange.endDate }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
        ],
      },
    });

    const mainMetrics = mainResponse.data.rows?.[0]?.metricValues || [];
    const comparisonMetrics = comparisonResponse.data.rows?.[0]?.metricValues || [];

    // Calculate changes
    const calculateChange = (current, previous) => {
      const currentVal = parseFloat(current || 0);
      const previousVal = parseFloat(previous || 0);
      const change = currentVal - previousVal;
      let changePercent = 0;

      if (previousVal > 0) {
        changePercent = (change / previousVal) * 100;
      } else if (currentVal > 0) {
        // If there's no previous data but current data exists, show as new data
        changePercent = 100; // Could be interpreted as "new" or "100% increase from 0"
      }

      return {
        value: currentVal,
        change: change,
        changePercent: changePercent,
      };
    };

    return {
      users: calculateChange(mainMetrics[0]?.value, comparisonMetrics[0]?.value),
      sessions: calculateChange(mainMetrics[1]?.value, comparisonMetrics[1]?.value),
      pageviews: calculateChange(mainMetrics[2]?.value, comparisonMetrics[2]?.value),
      bounceRate: calculateChange(
        parseFloat(mainMetrics[3]?.value || 0) * 100,
        parseFloat(comparisonMetrics[3]?.value || 0) * 100
      ),
      avgSessionDuration: calculateChange(mainMetrics[4]?.value, comparisonMetrics[4]?.value),
    };
  } catch (error) {
    console.error('Error fetching GA4 metrics:', error);
    throw error;
  }
}

async function fetchGA4TimeSeries(authClient, propertyId, dateRange) {
  try {
    const response = await analyticsData.properties.runReport({
      auth: authClient,
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
        ],
        dimensions: [{ name: 'date' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      },
    });

    const chartData = response.data.rows?.map(row => ({
      date: row.dimensionValues[0].value,
      users: parseInt(row.metricValues[0].value || 0),
      sessions: parseInt(row.metricValues[1].value || 0),
      pageviews: parseInt(row.metricValues[2].value || 0),
      bounceRate: parseFloat(row.metricValues[3].value || 0) * 100,
    })) || [];

    return chartData;
  } catch (error) {
    console.error('Error fetching GA4 time series:', error);
    throw error;
  }
}

async function fetchGA4Pages(authClient, propertyId, dateRange) {
  try {
    const response = await analyticsData.properties.runReport({
      auth: authClient,
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
        ],
        dimensions: [{ name: 'pagePath' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      },
    });

    const topPages = response.data.rows?.map(row => ({
      page: row.dimensionValues[0].value,
      pageviews: parseInt(row.metricValues[0].value || 0),
      uniquePageviews: parseInt(row.metricValues[0].value || 0), // GA4 doesn't have unique pageviews
      bounceRate: parseFloat(row.metricValues[1].value || 0) * 100,
      avgTimeOnPage: parseFloat(row.metricValues[2].value || 0),
    })) || [];

    return topPages;
  } catch (error) {
    console.error('Error fetching GA4 pages:', error);
    throw error;
  }
}

async function fetchGA4Sources(authClient, propertyId, dateRange) {
  try {
    const response = await analyticsData.properties.runReport({
      auth: authClient,
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'bounceRate' },
        ],
        dimensions: [{ name: 'sessionDefaultChannelGrouping' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 10,
      },
    });

    const trafficSources = response.data.rows?.map(row => ({
      source: row.dimensionValues[0].value,
      users: parseInt(row.metricValues[0].value || 0),
      sessions: parseInt(row.metricValues[1].value || 0),
      bounceRate: parseFloat(row.metricValues[2].value || 0) * 100,
    })) || [];

    return trafficSources;
  } catch (error) {
    console.error('Error fetching GA4 sources:', error);
    throw error;
  }
}

async function fetchGA4Devices(authClient, propertyId, dateRange) {
  try {
    const response = await analyticsData.properties.runReport({
      auth: authClient,
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'bounceRate' },
        ],
        dimensions: [{ name: 'deviceCategory' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      },
    });

    const devices = response.data.rows?.map(row => ({
      device: row.dimensionValues[0].value,
      users: parseInt(row.metricValues[0].value || 0),
      sessions: parseInt(row.metricValues[1].value || 0),
      bounceRate: parseFloat(row.metricValues[2].value || 0) * 100,
    })) || [];

    return devices;
  } catch (error) {
    console.error('Error fetching GA4 devices:', error);
    throw error;
  }
}

async function fetchGA4Countries(authClient, propertyId, dateRange) {
  try {
    const response = await analyticsData.properties.runReport({
      auth: authClient,
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
        ],
        dimensions: [{ name: 'country' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 10,
      },
    });

    const countries = response.data.rows?.map(row => ({
      country: row.dimensionValues[0].value,
      users: parseInt(row.metricValues[0].value || 0),
      sessions: parseInt(row.metricValues[1].value || 0),
    })) || [];

    return countries;
  } catch (error) {
    console.error('Error fetching GA4 countries:', error);
    throw error;
  }
}

// Analytics API endpoint
app.get('/api/analytics', async (req, res) => {
  const days = parseDays(req.query.days);
  try {
    const propertyId = process.env.GA_PROPERTY_ID;

    // For development or if no credentials, return mock data
    if (process.env.NODE_ENV === 'development' && !propertyId) {
      console.log('Returning mock data for development (no property ID configured)');
      return res.json(generateMockData(days));
    }

    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.log('Returning mock data (no Google credentials configured)');
      return res.json(generateMockData(days));
    }

    if (!propertyId) {
      throw new Error('GA_PROPERTY_ID not configured');
    }

    const dateRange = getDateRange(days);
    const comparisonDateRange = getComparisonDateRange(days);
    const authClient = await auth.getClient();

    console.log(`Fetching real GA4 data for property: ${propertyId}`);

    // Fetch all data in parallel
    const [metrics, chartData, topPages, trafficSources, devices, countries] = await Promise.all([
      fetchGA4Metrics(authClient, propertyId, dateRange, comparisonDateRange),
      fetchGA4TimeSeries(authClient, propertyId, dateRange),
      fetchGA4Pages(authClient, propertyId, dateRange),
      fetchGA4Sources(authClient, propertyId, dateRange),
      fetchGA4Devices(authClient, propertyId, dateRange),
      fetchGA4Countries(authClient, propertyId, dateRange),
    ]);

    const analyticsData = {
      metrics,
      chartData,
      topPages,
      trafficSources,
      devices,
      countries,
      dateRange,
    };

    res.json(analyticsData);

  } catch (error) {
    console.error('Analytics API Error:', error.message);
    console.error('Full error:', error);

    // Return mock data with error indication in development
    const mockData = generateMockData(days);
    mockData.error = `API Error: ${error.message}`;
    mockData.isRealData = false;

    res.status(200).json(mockData);
  }
});

// Mock funnel data generator
const generateMockFunnelData = (days = DEFAULT_DAYS) => {
  const baseUsers = Math.floor(Math.random() * 5000) + 10000;

  return {
    funnel: [
      {
        step: 'Page Views',
        eventName: 'page_view',
        users: baseUsers,
        dropoffRate: 0,
        conversionRate: 100
      },
      {
        step: 'Engagement',
        eventName: 'user_engagement',
        users: Math.floor(baseUsers * 0.65),
        dropoffRate: 35,
        conversionRate: 65
      },
      {
        step: 'Sign Up Started',
        eventName: 'sign_up_start',
        users: Math.floor(baseUsers * 0.25),
        dropoffRate: 61.5,
        conversionRate: 25
      },
      {
        step: 'Account Created',
        eventName: 'sign_up',
        users: Math.floor(baseUsers * 0.15),
        dropoffRate: 40,
        conversionRate: 15
      },
      {
        step: 'First Purchase',
        eventName: 'purchase',
        users: Math.floor(baseUsers * 0.08),
        dropoffRate: 46.7,
        conversionRate: 8
      }
    ],
    dateRange: getDateRange(days),
    totalUsers: baseUsers,
    overallConversionRate: 8
  };
};

// GA4 Events fetching function
async function fetchGA4Events(authClient, propertyId, dateRange) {
  try {
    // Common e-commerce/SaaS events to track in funnel
    const events = [
      'page_view',
      'user_engagement',
      'sign_up_start',
      'sign_up',
      'purchase',
      'subscribe'
    ];

    // Fetch event counts
    const eventResponse = await analyticsData.properties.runReport({
      auth: authClient,
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'eventCount' }
        ],
        dimensions: [{ name: 'eventName' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            inListFilter: {
              values: events
            }
          }
        },
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      },
    });

    const rows = eventResponse.data.rows || [];

    // Process the events data into funnel format
    const eventData = {};
    rows.forEach(row => {
      const eventName = row.dimensionValues[0].value;
      const users = parseInt(row.metricValues[0].value || 0);
      eventData[eventName] = users;
    });

    // Create funnel steps from the data
    const totalUsers = eventData['page_view'] || 0;
    const funnel = [];

    // Define funnel steps with friendly names
    const funnelSteps = [
      { step: 'Page Views', eventName: 'page_view' },
      { step: 'Engagement', eventName: 'user_engagement' },
      { step: 'Sign Up Started', eventName: 'sign_up_start' },
      { step: 'Account Created', eventName: 'sign_up' },
      { step: 'Purchase', eventName: 'purchase' },
      { step: 'Subscription', eventName: 'subscribe' }
    ];

    let previousUsers = totalUsers;
    funnelSteps.forEach((step, index) => {
      const users = eventData[step.eventName] || 0;
      const conversionRate = totalUsers > 0 ? (users / totalUsers) * 100 : 0;
      const dropoffRate = index > 0 ? ((previousUsers - users) / previousUsers) * 100 : 0;

      if (users > 0 || index === 0) { // Include step if it has data or is the first step
        funnel.push({
          step: step.step,
          eventName: step.eventName,
          users,
          dropoffRate: Math.round(dropoffRate * 10) / 10,
          conversionRate: Math.round(conversionRate * 10) / 10
        });
        previousUsers = users;
      }
    });

    const overallConversionRate = funnel.length > 1 ? funnel[funnel.length - 1].conversionRate : 0;

    return {
      funnel,
      dateRange,
      totalUsers,
      overallConversionRate
    };

  } catch (error) {
    console.error('Error fetching GA4 events:', error);
    throw error;
  }
}

// Events/Funnel endpoint
app.get('/api/events', async (req, res) => {
  const days = parseDays(req.query.days);
  try {
    const propertyId = process.env.GA_PROPERTY_ID;

    // Return mock data if no credentials or property ID
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !propertyId) {
      console.log('Using mock funnel data - no GA credentials configured');
      return res.json(generateMockFunnelData(days));
    }

    const dateRange = getDateRange(days);
    const authClient = await auth.getClient();

    console.log(`Fetching real GA4 events data for property: ${propertyId}`);

    const eventsData = await fetchGA4Events(authClient, propertyId, dateRange);
    res.json(eventsData);

  } catch (error) {
    console.error('Events API Error:', error.message);

    // Return mock data with error indication
    const mockData = generateMockFunnelData(days);
    mockData.error = `API Error: ${error.message}`;
    mockData.isRealData = false;

    res.status(200).json(mockData);
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    hasCredentials: !!(process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY),
    hasPropertyId: !!process.env.GA_PROPERTY_ID,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 GA Traffic Monitor server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`🔑 Has credentials: ${!!(process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY)}`);
  console.log(`📈 Property ID: ${process.env.GA_PROPERTY_ID || 'Not configured'}`);
});