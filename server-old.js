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

// Google Analytics setup
const analytics = google.analytics('v3');
const analyticsReporting = google.analyticsreporting('v4');

// Service account authentication
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
});

// Helper function to format date
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// Helper function to get date range
const getDateRange = (days = 30) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
};

// Mock data generator for development/demo
const generateMockData = () => {
  const dateRange = getDateRange(30);
  const chartData = [];

  // Generate 30 days of mock data
  for (let i = 29; i >= 0; i--) {
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

// Analytics API endpoint
app.get('/api/analytics', async (req, res) => {
  try {
    // For development, return mock data
    if (process.env.NODE_ENV === 'development' || !process.env.GOOGLE_CLIENT_EMAIL) {
      console.log('Returning mock data for development');
      return res.json(generateMockData());
    }

    const viewId = process.env.GA_VIEW_ID;
    if (!viewId) {
      throw new Error('GA_VIEW_ID not configured');
    }

    const dateRange = getDateRange(30);
    const authClient = await auth.getClient();

    // Get basic metrics
    const metricsResponse = await analyticsReporting.reports.batchGet({
      auth: authClient,
      requestBody: {
        reportRequests: [{
          viewId,
          dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
          metrics: [
            { expression: 'ga:users' },
            { expression: 'ga:sessions' },
            { expression: 'ga:pageviews' },
            { expression: 'ga:bounceRate' },
            { expression: 'ga:avgSessionDuration' },
          ],
        }],
      },
    });

    // Get time series data
    const timeSeriesResponse = await analyticsReporting.reports.batchGet({
      auth: authClient,
      requestBody: {
        reportRequests: [{
          viewId,
          dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
          metrics: [
            { expression: 'ga:users' },
            { expression: 'ga:sessions' },
            { expression: 'ga:pageviews' },
            { expression: 'ga:bounceRate' },
          ],
          dimensions: [{ name: 'ga:date' }],
        }],
      },
    });

    // Get top pages
    const pagesResponse = await analyticsReporting.reports.batchGet({
      auth: authClient,
      requestBody: {
        reportRequests: [{
          viewId,
          dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
          metrics: [
            { expression: 'ga:pageviews' },
            { expression: 'ga:uniquePageviews' },
            { expression: 'ga:bounceRate' },
            { expression: 'ga:avgTimeOnPage' },
          ],
          dimensions: [{ name: 'ga:pagePath' }],
          orderBys: [{ fieldName: 'ga:pageviews', sortOrder: 'DESCENDING' }],
          pageSize: 10,
        }],
      },
    });

    // Process the data...
    const processedData = {
      metrics: {
        users: { value: 0, change: 0, changePercent: 0 },
        sessions: { value: 0, change: 0, changePercent: 0 },
        pageviews: { value: 0, change: 0, changePercent: 0 },
        bounceRate: { value: 0, change: 0, changePercent: 0 },
        avgSessionDuration: { value: 0, change: 0, changePercent: 0 },
      },
      chartData: [],
      topPages: [],
      trafficSources: [],
      devices: [],
      countries: [],
      dateRange,
    };

    // For now, return mock data even in production until real implementation is complete
    res.json(generateMockData());

  } catch (error) {
    console.error('Analytics API Error:', error);

    // In case of error, return mock data with error indication
    const mockData = generateMockData();
    mockData.error = 'Using mock data due to API error';

    res.status(200).json(mockData);
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 GA Traffic Monitor server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 API endpoints available at http://localhost:${PORT}/api`);
});