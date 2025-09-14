export interface MetricData {
  value: number
  change: number
  changePercent: number
}

export interface ChartDataPoint {
  date: string
  users: number
  sessions: number
  pageviews: number
  bounceRate: number
}

export interface PageData {
  page: string
  pageviews: number
  uniquePageviews: number
  bounceRate: number
  avgTimeOnPage: number
}

export interface SourceData {
  source: string
  users: number
  sessions: number
  bounceRate: number
}

export interface DeviceData {
  device: string
  users: number
  sessions: number
  bounceRate: number
}

export interface CountryData {
  country: string
  users: number
  sessions: number
}

export interface AnalyticsData {
  metrics: {
    users: MetricData
    sessions: MetricData
    pageviews: MetricData
    bounceRate: MetricData
    avgSessionDuration: MetricData
  }
  chartData: ChartDataPoint[]
  topPages: PageData[]
  trafficSources: SourceData[]
  devices: DeviceData[]
  countries: CountryData[]
  dateRange: {
    startDate: string
    endDate: string
  }
}