import { google } from 'googleapis';

// Initialize Google Analytics Data API
const analyticsData = google.analyticsdata('v1beta');

// Create auth instance
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

// Mock funnel data generator
const generateMockFunnelData = (days = 30) => {
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

// Main handler function for Vercel
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const propertyId = process.env.GA_PROPERTY_ID;

    // Get days parameter from query, default to 30
    const days = parseInt(req.query.days) || 30;

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
    const mockData = generateMockFunnelData(parseInt(req.query.days) || 30);
    mockData.error = `API Error: ${error.message}`;
    mockData.isRealData = false;

    res.status(200).json(mockData);
  }
}