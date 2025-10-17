// src/shared/repositories/baseRepository.ts
import { PaginatedResponse } from '@src/shared/types'

type ExtractModelType<T> = T extends {
  findMany: (...args: any[]) => Promise<infer U>
}
  ? U extends Array<infer V>
    ? V
    : never
  : never

type ExtractFindManyArgs<T> = T extends { findMany: (args?: infer U) => any }
  ? U
  : never
type ExtractFindUniqueArgs<T> = T extends { findUnique: (args: infer U) => any }
  ? U
  : never
type ExtractCreateArgs<T> = T extends { create: (args: infer U) => any }
  ? U
  : never
type ExtractUpdateArgs<T> = T extends { update: (args: infer U) => any }
  ? U
  : never
type ExtractDeleteArgs<T> = T extends { delete: (args: infer U) => any }
  ? U
  : never
type ExtractCountArgs<T> = T extends { count: (args?: infer U) => any }
  ? U
  : never

// Extract where clause type
type ExtractWhereInput<T> =
  ExtractFindManyArgs<T> extends { where?: infer W } ? W : never
type ExtractWhereUniqueInput<T> =
  ExtractFindUniqueArgs<T> extends { where: infer W } ? W : never
type ExtractCreateData<T> =
  ExtractCreateArgs<T> extends { data: infer D } ? D : never
type ExtractUpdateData<T> =
  ExtractUpdateArgs<T> extends { data: infer D } ? D : never

// Base Repository Class
export abstract class BaseRepository<TModel extends Record<string, any>> {
  constructor(protected readonly model: TModel) {}

  // Create with full args support
  async create(
    args: ExtractCreateArgs<TModel>
  ): Promise<ExtractModelType<TModel>> {
    return this.model.create(args)
  }

  // Update with full args support
  async update(
    args: ExtractUpdateArgs<TModel>
  ): Promise<ExtractModelType<TModel>> {
    return this.model.update(args)
  }

  // Delete with full args support
  async delete(
    args: ExtractDeleteArgs<TModel>
  ): Promise<ExtractModelType<TModel>> {
    return this.model.delete(args)
  }

  // Find Many with Cursor (for pagination)
  async findManyWithCursor(
    args: ExtractFindManyArgs<TModel> & {
      cursor?: any
      take?: number
      skip?: number
    }
  ): Promise<ExtractModelType<TModel>[]> {
    return this.model.findMany(args)
  }

  // Helper: Check if record exists
  async exists(where: ExtractWhereUniqueInput<TModel>): Promise<boolean> {
    const result = await this.model.findFirst({
      where,
      select: { id: true },
    })
    return result !== null
  }

  // Helper: Find with pagination info
  async paginate(args: {
    where?: ExtractWhereInput<TModel>
    orderBy?: ExtractFindManyArgs<TModel> extends { orderBy?: infer O }
      ? O
      : never
    include?: ExtractFindManyArgs<TModel> extends { include?: infer I }
      ? I
      : never
    select?: ExtractFindManyArgs<TModel> extends { select?: infer S }
      ? S
      : never
    page: number
    limit: number
  }): Promise<PaginatedResponse> {
    const { page, limit, where, orderBy, include, select } = args
    const skip = (page - 1) * limit

    const findArgs: ExtractFindManyArgs<TModel> = {
      where,
      orderBy,
      include,
      select,
      skip,
      take: limit,
    } as ExtractFindManyArgs<TModel>

    const countArgs: ExtractCountArgs<TModel> = where
      ? ({ where } as ExtractCountArgs<TModel>)
      : ({} as ExtractCountArgs<TModel>)

    const [data, total] = await Promise.all([
      this.model.findMany(findArgs),
      this.model.count(countArgs),
    ])

    return {
      data,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        page,
        limit,
        count: data.length,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    }
  }

  // Helper: Find or create
  async findOrCreate(
    where: ExtractWhereUniqueInput<TModel>,
    create: ExtractCreateData<TModel>
  ): Promise<ExtractModelType<TModel>> {
    const existing = await this.model.findUnique({
      where,
    } as ExtractFindUniqueArgs<TModel>)
    if (existing) {
      return existing
    }
    return this.create({ data: create } as ExtractCreateArgs<TModel>)
  }

  // Helper: Update or create (upsert alternative)
  async updateOrCreate(
    where: ExtractWhereUniqueInput<TModel>,
    update: ExtractUpdateData<TModel>,
    create: ExtractCreateData<TModel>
  ): Promise<ExtractModelType<TModel>> {
    return this.model.upsert({
      where,
      update,
      create,
    } as Parameters<TModel['upsert']>[0])
  }
}
