// src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dashboardService } from '@src/features/dashboard/services/server'
import { dashboardFiltersSchema } from '@src/features/dashboard/validations'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filters = Object.fromEntries(searchParams.entries())

    // Validate filters
    const validatedFilters = dashboardFiltersSchema.parse(filters)

    const result = await dashboardService.getDashboardSummary(validatedFilters)
    return NextResponse.json({
      success: true,
      message: 'สำเร็จ',
      data: result,
    })
  } catch (error: any) {
    console.error('[API Error] GET /api/dashboard:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'เกิดข้อผิดพลาด',
        errors: error,
      },
      { status: 500 },
    )
  }
}

