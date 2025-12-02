// src/features/documents/repositories/documentRepository.ts
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/db';

export class DocumentRepository {
  async findMany(options: {
    where?: Prisma.DocumentWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.DocumentOrderByWithRelationInput;
    include?: Prisma.DocumentInclude;
  }) {
    return prisma.document.findMany(options);
  }

  async findById(id: string, include?: Prisma.DocumentInclude) {
    return prisma.document.findUnique({
      where: { id },
      include,
    });
  }

  async count(where?: Prisma.DocumentWhereInput) {
    return prisma.document.count({ where });
  }

  async create(data: Prisma.DocumentCreateInput) {
    return prisma.document.create({ data });
  }

  async update(id: string, data: Prisma.DocumentUpdateInput) {
    return prisma.document.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    // Soft delete
    return prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async paginate(options: {
    where?: Prisma.DocumentWhereInput;
    page: number;
    limit: number;
    orderBy?: Prisma.DocumentOrderByWithRelationInput;
    include?: Prisma.DocumentInclude;
  }) {
    const { where, page, limit, orderBy, include } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include,
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

  // Get the latest document number for a specific type and month
  async getLatestDocNumber(docType: string, yearMonth: string) {
    const prefix = docType === 'RECEIPT' ? 'RV' : 'PV';
    const pattern = `${prefix}-${yearMonth}%`;

    const latestDoc = await prisma.document.findFirst({
      where: {
        docNumber: {
          startsWith: `${prefix}-${yearMonth}`,
        },
        deletedAt: null,
      },
      orderBy: {
        docNumber: 'desc',
      },
      select: {
        docNumber: true,
      },
    });

    return latestDoc?.docNumber;
  }
}

export const documentRepository = new DocumentRepository();

