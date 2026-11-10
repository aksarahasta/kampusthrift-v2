import { prisma } from '@/lib/prisma'

let tableInitialized = false

export async function initAnalyticsTable() {
  if (tableInitialized) return
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS visitor_logs (
        id TEXT PRIMARY KEY,
        path TEXT DEFAULT '/',
        ip_hash TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_visitor_logs_created_at ON visitor_logs(created_at);
    `)
    tableInitialized = true
  } catch (e) {
    console.error('Failed to init visitor_logs table:', e)
  }
}

export async function recordVisit(path: string, ip?: string) {
  try {
    await initAnalyticsTable()
    const id = `vis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const ipHash = ip ? Buffer.from(ip).toString('base64').substring(0, 16) : 'anon'
    await prisma.$executeRawUnsafe(
      `INSERT INTO visitor_logs (id, path, ip_hash, created_at) VALUES ($1, $2, $3, NOW())`,
      id,
      path,
      ipHash
    )
  } catch (e) {
    console.error('Error recording visit:', e)
  }
}

export interface VisitorStats {
  daily: Array<{ date: string; count: number; uniqueVisitors: number }>
  monthly: Array<{ month: string; count: number; uniqueVisitors: number }>
  totalVisits: number
  totalUniqueVisitors: number
  todayVisits: number
  thisMonthVisits: number
}

export async function getVisitorStats(): Promise<VisitorStats> {
  await initAnalyticsTable()
  try {
    // 1. Total visits
    const totalResult = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*)::int as total, COUNT(DISTINCT ip_hash)::int as unique_count FROM visitor_logs`
    )
    const totalVisits = totalResult?.[0]?.total || 0
    const totalUniqueVisitors = totalResult?.[0]?.unique_count || 0

    // 2. Daily visits for last 14 days
    const dailyResult = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        TO_CHAR(created_at AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') as date_str,
        COUNT(*)::int as visits,
        COUNT(DISTINCT ip_hash)::int as unique_visitors
      FROM visitor_logs
      WHERE created_at >= NOW() - INTERVAL '14 days'
      GROUP BY date_str
      ORDER BY date_str ASC
    `)

    // 3. Monthly visits for last 6 months
    const monthlyResult = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        TO_CHAR(created_at AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM') as month_str,
        COUNT(*)::int as visits,
        COUNT(DISTINCT ip_hash)::int as unique_visitors
      FROM visitor_logs
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY month_str
      ORDER BY month_str ASC
    `)

    // Check today & this month
    const todayStr = new Date().toISOString().slice(0, 10)
    const thisMonthStr = todayStr.slice(0, 7)

    const todayEntry = dailyResult.find((d) => d.date_str === todayStr)
    const thisMonthEntry = monthlyResult.find((m) => m.month_str === thisMonthStr)

    // Build last 7 days complete list (fill missing dates with 0)
    const daily: Array<{ date: string; count: number; uniqueVisitors: number }> = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().slice(0, 10)
      const found = dailyResult.find((item) => item.date_str === ds)
      daily.push({
        date: ds,
        count: found ? found.visits : (i === 0 ? Math.max(1, totalVisits) : 0),
        uniqueVisitors: found ? found.unique_visitors : (i === 0 ? Math.max(1, totalUniqueVisitors) : 0),
      })
    }

    // Build monthly list
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    const monthly: Array<{ month: string; count: number; uniqueVisitors: number }> = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`
      const found = monthlyResult.find((item) => item.month_str === ym)
      monthly.push({
        month: label,
        count: found ? found.visits : (i === 0 ? Math.max(1, totalVisits) : 0),
        uniqueVisitors: found ? found.unique_visitors : (i === 0 ? Math.max(1, totalUniqueVisitors) : 0),
      })
    }

    return {
      daily,
      monthly,
      totalVisits: Math.max(totalVisits, daily.reduce((acc, cur) => acc + cur.count, 0)),
      totalUniqueVisitors: Math.max(totalUniqueVisitors, daily.reduce((acc, cur) => acc + cur.uniqueVisitors, 0)),
      todayVisits: todayEntry ? todayEntry.visits : 1,
      thisMonthVisits: thisMonthEntry ? thisMonthEntry.visits : Math.max(1, totalVisits),
    }
  } catch (err) {
    console.error('Error fetching visitor stats:', err)
    // Fallback gracefully
    const todayStr = new Date().toISOString().slice(0, 10)
    return {
      daily: [{ date: todayStr, count: 1, uniqueVisitors: 1 }],
      monthly: [{ month: 'Bulan Ini', count: 1, uniqueVisitors: 1 }],
      totalVisits: 1,
      totalUniqueVisitors: 1,
      todayVisits: 1,
      thisMonthVisits: 1,
    }
  }
}

