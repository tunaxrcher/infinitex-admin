// src/features/documents/repositories/documentTitleListRepository.ts
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/db';

export class DocumentTitleListRepository {
  async findMany(options: {
    where?: Prisma.DocumentTitleListWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.DocumentTitleListOrderByWithRelationInput;
  }) {
    return prisma.documentTitleList.findMany(options);
  }

  async findById(id: string) {
    return prisma.documentTitleList.findUnique({
      where: { id },
    });
  }

  async count(where?: Prisma.DocumentTitleListWhereInput) {
    return prisma.documentTitleList.count({ where });
  }

  async create(data: Prisma.DocumentTitleListCreateInput) {
    return prisma.documentTitleList.create({ data });
  }

  async update(id: string, data: Prisma.DocumentTitleListUpdateInput) {
    return prisma.documentTitleList.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    // Soft delete
    return prisma.documentTitleList.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async paginate(options: {
    where?: Prisma.DocumentTitleListWhereInput;
    page: number;
    limit: number;
    orderBy?: Prisma.DocumentTitleListOrderByWithRelationInput;
  }) {
    const { where, page, limit, orderBy } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.count(where),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const documentTitleListRepository = new DocumentTitleListRepository();
