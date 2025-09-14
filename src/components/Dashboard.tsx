import React from 'react'
import { Users, Eye, MousePointer, Clock, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { AnalyticsData } from '../types/analytics'

interface DashboardProps {
  data: AnalyticsData
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  const formatPercent = (num: number): string => {
    return `${num > 0 ? '+' : ''}${num.toFixed(1)}%`
  }

  const formatDuration = (seconds: number): string => {
    const totalSeconds = Math.round(seconds)
    const minutes = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const parseGA4Date = (dateStr: string): Date => {
    // GA4 returns dates in format YYYYMMDD like "20250914"
    if (dateStr.length === 8) {
      const year = parseInt(dateStr.substring(0, 4))
      const month = parseInt(dateStr.substring(4, 6)) - 1 // JS months are 0-indexed
      const day = parseInt(dateStr.substring(6, 8))
      return new Date(year, month, day)
    }
    // Fallback for other formats
    return new Date(dateStr)
  }

  const MetricCard = ({
    title,
    value,
    change,
    changePercent,
    icon: Icon,
    formatter = formatNumber,
    tooltip
  }: {
    title: string
    value: number
    change: number
    changePercent: number
    icon: any
    formatter?: (num: number) => string
    tooltip?: string
  }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {tooltip && (
              <div className="relative group">
                <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-4 py-3 text-xs text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-[800px] text-center z-10">
                  {tooltip}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
                </div>
              </div>
            )}
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{formatter(value)}</p>
        </div>
        <Icon className="h-8 w-8 text-primary-600 flex-shrink-0 ml-2" />
      </div>
      <div className="mt-4 flex items-center flex-wrap gap-1">
        {changePercent > 0 ? (
          <TrendingUp className="h-4 w-4 text-green-500" />
        ) : changePercent < 0 ? (
          <TrendingDown className="h-4 w-4 text-red-500" />
        ) : null}
        <span className={`text-sm font-medium ${
          changePercent === 100 && change > 0 ? 'text-blue-600' :
          changePercent > 0 ? 'text-green-600' :
          changePercent < 0 ? 'text-red-600' :
          'text-gray-600'
        }`}>
          {changePercent === 100 && change > 0 ? 'New data' : formatPercent(changePercent)}
        </span>
        <span className="text-sm text-gray-500">
          {changePercent === 100 && change > 0 ? 'first period' : 'vs previous'}
        </span>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Date Range */}
      <div className="bg-white rounded-lg shadow px-6 py-4">
        <p className="text-sm text-gray-600">
          Showing data from {new Date(data.dateRange.startDate).toLocaleDateString()} to{' '}
          {new Date(data.dateRange.endDate).toLocaleDateString()}
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard
          title="Users"
          value={data.metrics.users.value}
          change={data.metrics.users.change}
          changePercent={data.metrics.users.changePercent}
          icon={Users}
          tooltip="The number of unique visitors who visited your website during the selected period"
        />
        <MetricCard
          title="Sessions"
          value={data.metrics.sessions.value}
          change={data.metrics.sessions.change}
          changePercent={data.metrics.sessions.changePercent}
          icon={MousePointer}
          tooltip="The number of individual visits to your website. A session can include multiple page views"
        />
        <MetricCard
          title="Pageviews"
          value={data.metrics.pageviews.value}
          change={data.metrics.pageviews.change}
          changePercent={data.metrics.pageviews.changePercent}
          icon={Eye}
          tooltip="The total number of pages viewed on your website. Multiple views of the same page count separately"
        />
        <MetricCard
          title="Bounce Rate"
          value={data.metrics.bounceRate.value}
          change={data.metrics.bounceRate.change}
          changePercent={data.metrics.bounceRate.changePercent}
          icon={TrendingDown}
          formatter={(num) => `${num.toFixed(1)}%`}
          tooltip="The percentage of single-page sessions where visitors left without interacting further. Lower is generally better"
        />
        <MetricCard
          title="Avg Session Duration"
          value={data.metrics.avgSessionDuration.value}
          change={data.metrics.avgSessionDuration.change}
          changePercent={data.metrics.avgSessionDuration.changePercent}
          icon={Clock}
          formatter={formatDuration}
          tooltip="The average amount of time visitors spend on your website during a session. Longer duration indicates higher engagement"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Over Time */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Traffic Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => parseGA4Date(value).toLocaleDateString()}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                labelFormatter={(value) => parseGA4Date(value).toLocaleDateString()}
                formatter={(value, name) => [formatNumber(value as number), name]}
              />
              <Area
                type="monotone"
                dataKey="users"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
                name="Users"
              />
              <Area
                type="monotone"
                dataKey="sessions"
                stackId="2"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
                name="Sessions"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Device Breakdown</h3>
          {data.devices && data.devices.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.devices}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ device, percent }) => `${device}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="users"
                >
                  {data.devices.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatNumber(value as number), 'Users']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <p>No device breakdown data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Top Pages</h3>
          </div>
          {data.topPages && data.topPages.length > 0 ? (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bounce Rate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.topPages.slice(0, 5).map((page, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                        {page.page}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(page.pageviews)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {page.bounceRate.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <p>No top pages data available</p>
            </div>
          )}
        </div>

        {/* Traffic Sources */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Traffic Sources</h3>
          </div>
          {data.trafficSources && data.trafficSources.length > 0 ? (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.trafficSources.slice(0, 5).map((source, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {source.source}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(source.users)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(source.sessions)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <p>No traffic sources data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard