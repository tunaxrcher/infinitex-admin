// src/app/api/maps/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@src/shared/lib/db';
import { MapProperty, ProvinceStats, PropertySource } from '@src/features/maps/types';

// ============================================
// Helper Functions
// ============================================

/**
 * Format price for display
 */
function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `฿${(price / 1000000).toFixed(2)}M`;
  } else if (price >= 1000) {
    return `฿${(price / 1000).toFixed(0)}K`;
  }
  return `฿${price.toLocaleString()}`;
}

/**
 * Format land area for display
 */
function formatLandArea(rai: number, ngan: number, sqWa: number): string {
  const parts = [];
  if (rai > 0) parts.push(`${rai} ไร่`);
  if (ngan > 0) parts.push(`${ngan} งาน`);
  if (sqWa > 0) parts.push(`${sqWa} ตร.ว.`);
  return parts.join(' ') || '-';
}

/**
 * Transform internal title deed to MapProperty
 */
function transformTitleDeed(deed: any): MapProperty | null {
  // Need valid coordinates
  const lat = parseFloat(deed.latitude || '0');
  const lng = parseFloat(deed.longitude || '0');
  
  // Skip if no valid coordinates
  if (lat === 0 && lng === 0) return null;

  const price = Number(deed.application?.approvedAmount || deed.application?.requestedAmount || 0);
  
  return {
    id: `internal-${deed.id}`,
    title: deed.application?.ownerName 
      ? `ที่ดิน ${deed.application.ownerName}`
      : `ที่ดิน ${deed.provinceName || ''} ${deed.amphurName || ''}`.trim(),
    location: [deed.amphurName, deed.provinceName].filter(Boolean).join(', ') || '-',
    province: deed.provinceName || '',
    amphur: deed.amphurName || '',
    price: price,
    formattedPrice: formatPrice(price),
    size: deed.landAreaText || '-',
    type: 'เจ้าของ/นายหน้า',
    status: deed.application?.loan?.status === 'COMPLETED' ? 'ขายแล้ว' : 'ขาย',
    source: 'INTERNAL' as PropertySource,
    images: deed.imageUrl ? [deed.imageUrl] : [],
    lat,
    lng,
    deedNumber: deed.deedNumber || deed.parcelNo || undefined,
    ownerName: deed.ownerName || deed.application?.ownerName || undefined,
    createdAt: deed.createdAt?.toISOString() || new Date().toISOString(),
  };
}

/**
 * Transform LED Asset to MapProperty
 */
function transformAsset(asset: any): MapProperty | null {
  // Need valid coordinates from LandDeedInfo
  const lat = asset.landDeedInfo?.latitude ? parseFloat(asset.landDeedInfo.latitude) : 0;
  const lng = asset.landDeedInfo?.longitude ? parseFloat(asset.landDeedInfo.longitude) : 0;
  
  // Skip if no valid coordinates
  if (lat === 0 && lng === 0) return null;

  const price = Number(asset.appraisalPrice || 0);
  const rai = Number(asset.rai || 0);
  const ngan = Number(asset.ngan || 0);
  const sqWa = Number(asset.sqWa || 0);
  const landArea = formatLandArea(rai, ngan, sqWa);
  
  return {
    id: `led-${asset.id}`,
    title: `${asset.assetType || 'ทรัพย์'} ${landArea !== '-' ? landArea : ''}`.trim(),
    location: [asset.ampur, asset.province].filter(Boolean).join(', ') || '-',
    province: asset.province || '',
    amphur: asset.ampur || '',
    price: price,
    formattedPrice: formatPrice(price),
    size: formatLandArea(rai, ngan, sqWa),
    type: 'กรมบังคับคดี',
    status: asset.status === 'SOLD' ? 'ขายแล้ว' : 'ขาย',
    source: 'LED' as PropertySource,
    images: asset.detail?.landPicture 
      ? [asset.detail.landPicture] 
      : [],
    lat,
    lng,
    deedNumber: asset.deedNo || undefined,
    ownerName: asset.detail?.ownerName || undefined,
    createdAt: asset.createdAt?.toISOString() || new Date().toISOString(),
    // LED specific
    auctionLot: asset.auctionLot || undefined,
    bidNumber: asset.bidNumber || undefined,
    caseNumber: asset.caseNumber || undefined,
    appraisalPrice: price,
    reserveFund: Number(asset.reserveFund || 0),
  };
}

/**
 * Calculate province statistics
 */
function calculateProvinceStats(properties: MapProperty[]): ProvinceStats[] {
  const statsMap = new Map<string, { count: number; prices: number[] }>();
  
  for (const prop of properties) {
    if (!prop.province) continue;
    
    const existing = statsMap.get(prop.province) || { count: 0, prices: [] };
    existing.count++;
    if (prop.price > 0) {
      existing.prices.push(prop.price);
    }
    statsMap.set(prop.province, existing);
  }
  
  const stats: ProvinceStats[] = [];
  for (const [province, data] of statsMap) {
    const avgPrice = data.prices.length > 0 
      ? data.prices.reduce((a, b) => a + b, 0) / data.prices.length 
      : 0;
    const minPrice = data.prices.length > 0 ? Math.min(...data.prices) : 0;
    const maxPrice = data.prices.length > 0 ? Math.max(...data.prices) : 0;
    
    stats.push({
      province,
      count: data.count,
      avgPrice,
      minPrice,
      maxPrice,
    });
  }
  
  return stats.sort((a, b) => b.count - a.count);
}

// ============================================
// API Route Handler
// ============================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse filters
    const province = searchParams.get('province') || undefined;
    const amphur = searchParams.get('amphur') || undefined;
    const source = searchParams.get('source') as PropertySource | 'ALL' | undefined || 'ALL';
    const priceMin = searchParams.get('priceMin') ? parseFloat(searchParams.get('priceMin')!) : undefined;
    const priceMax = searchParams.get('priceMax') ? parseFloat(searchParams.get('priceMax')!) : undefined;
    const status = searchParams.get('status') as 'ขาย' | 'ขายแล้ว' | 'ALL' | undefined || 'ALL';
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    // limit=0 means fetch all, default increased to 1000
    const limitParam = searchParams.get('limit');
    const limit = limitParam === '0' ? 0 : parseInt(limitParam || '1000');

    let allProperties: MapProperty[] = [];
    let totalInternal = 0;
    let totalLED = 0;

    // ============================================
    // 1. Fetch from Internal (title_deeds)
    // ============================================
    if (source === 'ALL' || source === 'INTERNAL') {
      try {
        // First, get valid applicationIds (to avoid orphaned title_deeds)
        const validApplicationIds = await prisma.loanApplication.findMany({
          select: { id: true },
        });
        const validIds = new Set(validApplicationIds.map(a => a.id));

        // Build where clause
        const internalWhere: any = {
          // Only get title_deeds with valid applications
          applicationId: { in: Array.from(validIds) },
        };

        // Filter by province
        if (province) {
          internalWhere.provinceName = { contains: province };
        }
        
        // Filter by amphur
        if (amphur) {
          internalWhere.amphurName = { contains: amphur };
        }

        // Search filter
        if (search) {
          internalWhere.OR = [
            { provinceName: { contains: search } },
            { amphurName: { contains: search } },
            { deedNumber: { contains: search } },
            { ownerName: { contains: search } },
          ];
        }

        const titleDeeds = await prisma.titleDeed.findMany({
          where: internalWhere,
          include: {
            application: {
              include: {
                loan: true,
                customer: {
                  include: {
                    profile: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        for (const deed of titleDeeds) {
          // Skip if no valid coordinates
          if (!deed.latitude || !deed.longitude) continue;
          
          const property = transformTitleDeed(deed);
          if (property) {
            allProperties.push(property);
            totalInternal++;
          }
        }
      } catch (internalError) {
        console.error('[API] Error fetching internal properties:', internalError);
        // Continue with LED data even if internal fails
      }
    }

    // ============================================
    // 2. Fetch from LED (Asset)
    // ============================================
    if (source === 'ALL' || source === 'LED') {
      const assetWhere: any = {
        landDeedInfo: {
          AND: [
            { latitude: { not: null } },
            { longitude: { not: null } },
          ],
        },
      };

      // Filter by province
      if (province) {
        assetWhere.province = { contains: province };
      }
      
      // Filter by amphur
      if (amphur) {
        assetWhere.ampur = { contains: amphur };
      }

      // Filter by status
      if (status && status !== 'ALL') {
        assetWhere.status = status === 'ขายแล้ว' ? 'SOLD' : 'ACTIVE';
      }

      // Search filter
      if (search) {
        assetWhere.OR = [
          { province: { contains: search } },
          { ampur: { contains: search } },
          { deedNo: { contains: search } },
          { auctionLot: { contains: search } },
        ];
      }

      const assets = await prisma.asset.findMany({
        where: assetWhere,
        include: {
          detail: true,
          landDeedInfo: true,
        },
        orderBy: { scrapedAt: 'desc' },
      });

      for (const asset of assets) {
        const property = transformAsset(asset);
        if (property) {
          allProperties.push(property);
          totalLED++;
        }
      }
    }

    // ============================================
    // 3. Apply additional filters
    // ============================================
    
    // Price filter
    if (priceMin !== undefined) {
      allProperties = allProperties.filter(p => p.price >= priceMin);
    }
    if (priceMax !== undefined) {
      allProperties = allProperties.filter(p => p.price <= priceMax);
    }

    // Status filter (for combined results)
    if (status && status !== 'ALL') {
      allProperties = allProperties.filter(p => p.status === status);
    }

    // ============================================
    // 4. Calculate stats and paginate
    // ============================================
    const provinceStats = calculateProvinceStats(allProperties);
    const total = allProperties.length;
    
    // If limit=0, return all results without pagination
    let paginatedProperties: MapProperty[];
    let totalPages: number;
    
    if (limit === 0) {
      paginatedProperties = allProperties;
      totalPages = 1;
    } else {
      totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      paginatedProperties = allProperties.slice(startIndex, startIndex + limit);
    }

    return NextResponse.json({
      success: true,
      message: 'สำเร็จ',
      data: paginatedProperties,
      meta: {
        total,
        page,
        limit: limit === 0 ? total : limit,
        totalPages,
      },
      stats: {
        totalInternal,
        totalLED,
        provinceStats,
      },
    });
  } catch (error: any) {
    console.error('[API Error] GET /api/maps:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'เกิดข้อผิดพลาด',
        errors: error,
      },
      { status: 500 },
    );
  }
}
