import React from 'react'
import { TrendingDown, Users, ArrowDown } from 'lucide-react'

interface FunnelStep {
  step: string
  eventName: string
  users: number
  dropoffRate: number
  conversionRate: number
}

interface FunnelData {
  funnel: FunnelStep[]
  totalUsers: number
  overallConversionRate: number
  dateRange: {
    startDate: string
    endDate: string
  }
}

interface FunnelChartProps {
  data: FunnelData
}

const FunnelChart: React.FC<FunnelChartProps> = ({ data }) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  const getStepWidth = (users: number): number => {
    if (data.totalUsers === 0) return 0
    return Math.max((users / data.totalUsers) * 100, 10) // Minimum 10% width for visibility
  }

  const getStepColor = (index: number): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-orange-500',
      'bg-red-500',
      'bg-purple-500'
    ]
    return colors[index % colors.length]
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Conversion Funnel</h3>
          <p className="text-sm text-gray-500 mt-1">
            User journey from {new Date(data.dateRange.startDate).toLocaleDateString()} to{' '}
            {new Date(data.dateRange.endDate).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {data.overallConversionRate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500">Overall Conversion</div>
        </div>
      </div>

      {/* Funnel Steps */}
      <div className="space-y-4">
        {data.funnel.map((step, index) => {
          const width = getStepWidth(step.users)
          const colorClass = getStepColor(index)

          return (
            <div key={step.eventName} className="relative">
              {/* Step Bar */}
              <div className="relative">
                <div
                  className={`${colorClass} rounded-lg py-4 px-6 text-white transition-all duration-300 hover:opacity-90`}
                  style={{ width: `${width}%`, minWidth: '200px' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5" />
                      <div>
                        <div className="font-semibold">{step.step}</div>
                        <div className="text-sm opacity-90">{step.eventName}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{formatNumber(step.users)}</div>
                      <div className="text-sm opacity-90">{step.conversionRate.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>

                {/* Dropoff indicator */}
                {index > 0 && step.dropoffRate > 0 && (
                  <div className="absolute -top-8 right-0 flex items-center space-x-1 text-sm text-red-600">
                    <TrendingDown className="h-4 w-4" />
                    <span>{step.dropoffRate.toFixed(1)}% dropoff</span>
                  </div>
                )}
              </div>

              {/* Arrow between steps */}
              {index < data.funnel.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowDown className="h-5 w-5 text-gray-400" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(data.totalUsers)}</div>
            <div className="text-sm text-gray-500">Total Users</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{data.funnel.length}</div>
            <div className="text-sm text-gray-500">Funnel Steps</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {data.funnel.length > 1 ? formatNumber(data.funnel[data.funnel.length - 1].users) : '0'}
            </div>
            <div className="text-sm text-gray-500">Final Conversions</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FunnelChart