import React, { useState, useEffect } from 'react'
import { BarChart3, Users, Eye, Clock, RefreshCw, AlertCircle, Calendar } from 'lucide-react'
import Dashboard from './components/Dashboard'
import { AnalyticsData } from './types/analytics'

function App() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [timeRange, setTimeRange] = useState<number>(30)

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/analytics?days=${timeRange}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const analyticsData: AnalyticsData = await response.json()
      setData(analyticsData)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data')
      console.error('Error fetching analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchAnalyticsData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [timeRange])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">GA Traffic Monitor</h1>
            </div>

            <div className="flex items-center space-x-4">
              {lastUpdated && (
                <div className="text-sm text-gray-500 flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
                </div>
              )}

              <button
                onClick={fetchAnalyticsData}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Time Range Filter */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Time Range:</span>
            </div>
            <div className="flex items-center space-x-2">
              {[1, 7, 30, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => setTimeRange(days)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    timeRange === days
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {days === 1 ? 'Today' : days === 7 ? 'Last 7 days' : days === 30 ? 'Last 30 days' : 'Last 90 days'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <h3 className="text-sm font-medium text-red-800">Error loading analytics data</h3>
            </div>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <button
              onClick={fetchAnalyticsData}
              className="mt-3 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded border border-red-300"
            >
              Try Again
            </button>
          </div>
        )}

        {loading && !data && (
          <div className="text-center py-12">
            <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary-600 mb-4" />
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        )}

        {data && !loading && (
          <Dashboard data={data} />
        )}

        {!data && !loading && !error && (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No analytics data available</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App