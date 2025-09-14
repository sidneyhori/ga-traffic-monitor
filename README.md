# GA Traffic Monitor

A simple, clean dashboard to monitor Google Analytics traffic when the official GA dashboard is having issues. Built with React, TypeScript, and Express.js.

## Features

- 📊 **Real-time Analytics Dashboard** - View key metrics like users, sessions, pageviews, bounce rate, and session duration
- 📈 **Visual Charts** - Interactive charts showing traffic trends over time and device breakdowns
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile devices
- 🔄 **Auto-refresh** - Automatically updates every 5 minutes with manual refresh option
- 🚀 **Fast & Lightweight** - Built with modern web technologies for optimal performance
- 💾 **Mock Data Mode** - Works with demo data for development and testing

## Screenshots

The dashboard provides:
- Key performance metrics with trend indicators
- Traffic over time visualization
- Device breakdown pie chart
- Top pages performance table
- Traffic sources analysis
- Geographic user distribution

## Tech Stack

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS for styling
- Recharts for data visualization
- Lucide React for icons
- Vite for development and building

**Backend:**
- Express.js server
- Google Analytics API integration
- CORS enabled for development

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd ga-traffic-monitor
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your Google Analytics credentials:

```env
# Google Analytics Configuration
GA_VIEW_ID=your_ga_view_id_here
GA_PROPERTY_ID=your_ga_property_id_here

# Google Service Account
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 3. Run Development Mode

Start both frontend and backend:

```bash
# Terminal 1 - Start backend server
npm run start

# Terminal 2 - Start frontend development server
npm run dev
```

The app will be available at `http://localhost:3000`

## Google Analytics Setup

### Option 1: Service Account (Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Analytics Reporting API
4. Create a Service Account:
   - Go to IAM & Admin > Service Accounts
   - Click "Create Service Account"
   - Download the JSON key file
5. Add the service account email to your Google Analytics property:
   - Go to Google Analytics > Admin
   - Property > Property User Management
   - Add the service account email with "Read & Analyze" permissions
6. Get your View ID:
   - In Google Analytics, go to Admin > View > View Settings
   - Copy the View ID number

### Option 2: Demo Mode

If you don't have Google Analytics set up or want to test the dashboard, simply run the app without configuring the environment variables. It will automatically use mock data.

## Available Scripts

- `npm run dev` - Start development frontend server (port 3000)
- `npm run build` - Build production frontend bundle
- `npm run preview` - Preview production build
- `npm run start` - Start backend API server (port 3001)

## Project Structure

```
ga-traffic-monitor/
├── src/
│   ├── components/
│   │   └── Dashboard.tsx      # Main dashboard component
│   ├── types/
│   │   └── analytics.ts       # TypeScript type definitions
│   ├── App.tsx               # Main app component
│   ├── main.tsx              # React entry point
│   └── index.css             # Global styles
├── public/                   # Static assets
├── server.js                # Express.js backend server
├── package.json             # Dependencies and scripts
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── tsconfig.json            # TypeScript configuration
```

## API Endpoints

- `GET /api/analytics` - Fetch Google Analytics data
- `GET /api/health` - Server health check

## Deployment

### Development Deployment

The app is designed to work in development mode with mock data, making it easy to test and develop without requiring Google Analytics access.

### Production Deployment

For production deployment:

1. Set up Google Analytics service account (see setup section)
2. Configure environment variables
3. Build the frontend: `npm run build`
4. Deploy both the built frontend and the Express.js backend
5. Ensure the backend server is running and accessible to the frontend

### Deployment Options

- **Vercel/Netlify**: Deploy frontend as static site, backend as serverless function
- **Railway/Render**: Deploy as full-stack application
- **Docker**: Container deployment with both frontend and backend
- **Traditional VPS**: Run with PM2 or similar process manager

## Customization

### Styling

The app uses Tailwind CSS for styling. You can customize:
- Colors in `tailwind.config.js`
- Component styles in the React components
- Global styles in `src/index.css`

### Metrics and Charts

You can modify the dashboard by:
- Adding new metrics in `src/types/analytics.ts`
- Creating new chart components
- Modifying the existing Dashboard component
- Adding new API endpoints for additional data

### Data Refresh

Current refresh interval is 5 minutes. You can change this in `src/App.tsx`:

```tsx
// Change 5 * 60 * 1000 to your desired interval in milliseconds
const interval = setInterval(fetchAnalyticsData, 5 * 60 * 1000)
```

## Troubleshooting

### Common Issues

1. **"Failed to fetch analytics data"**
   - Check if backend server is running on port 3001
   - Verify Google Analytics credentials
   - Check browser developer console for detailed errors

2. **Blank dashboard**
   - Ensure the View ID is correct
   - Check that the service account has proper permissions
   - Try refreshing the page or checking network requests

3. **CORS errors**
   - Make sure backend server is running
   - Check that the frontend is making requests to the correct backend URL

### Development Mode

In development mode, the app automatically uses mock data if Google Analytics is not configured. This allows you to:
- Test the UI and functionality
- Develop new features
- Demo the application

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Look at the browser developer console for errors
3. Check the backend server logs
4. Create an issue with detailed information about your problem

---

Built with ❤️ to solve the problem of unreliable Google Analytics dashboards.