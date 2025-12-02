import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { RpcException } from '@nestjs/microservices';
import { PaginationOrderDto } from './dto/pagination-order.dto';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createOrderDto: CreateOrderDto) {
    const product = await this.prismaService.order.create({
      data: createOrderDto,
    });

    return product;
  }

  async findAll(paginationDto: PaginationOrderDto) {
    const { limit: perPage, page: currentPage, status } = paginationDto;
    const where = {
      ...(status && { status }),
    };

    const totalPages = await this.prismaService.order.count({ where });

    return {
      data: await this.prismaService.order.findMany({
        skip: (currentPage - 1) * perPage,
        take: Number(perPage),
        where,
      }),
      meta: {
        total: totalPages,
        page: Number(currentPage),
        lastPage: Math.ceil(totalPages / perPage),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prismaService.order.findUnique({
      where: { id },
    });

    if (!product)
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`,
      });

    return product;
  }

  async changeStatus(changeOrderStatusDto: ChangeOrderStatusDto) {
    const { id, status } = changeOrderStatusDto;

    const order = await this.findOne(id);

    if (order.status === status) return order;

    return this.prismaService.order.update({
      where: { id },
      data: { status },
    });
  }
}
