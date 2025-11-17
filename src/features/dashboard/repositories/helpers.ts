// src/features/dashboard/repositories/helpers.ts

/**
 * Helper function to create date range for a specific month
 */
export function getMonthDateRange(year: number, month: number) {
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
  return { startDate, endDate }
}

/**
 * Helper function to safely sum numbers
 */
export function safeSum(items: any[], field: string): number {
  return items.reduce((sum, item) => sum + Number(item[field] || 0), 0)
}

