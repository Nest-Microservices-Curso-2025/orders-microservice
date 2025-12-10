import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, firstValueFrom } from 'rxjs';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationOrderDto } from './dto/pagination-order.dto';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { NATS_SERVICES } from './../config/services';
import { Product } from './interfaces/product.interface';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(NATS_SERVICES) private readonly client: ClientProxy,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const productsIds = createOrderDto.items.map((item) => item.productId);

    const products: Product[] = await firstValueFrom(
      this.client
        .send<Product[]>({ cmd: 'validate_products' }, productsIds)
        .pipe(
          catchError((err: string | object) => {
            throw new RpcException(err);
          }),
        ),
    );

    const totalAmount: number = createOrderDto.items.reduce(
      (acc, orderItem) => {
        const price: number =
          products.find((product) => product.id === orderItem.productId)
            ?.price ?? 0;

        return acc + price * orderItem.quantity;
      },
      0,
    );

    const totalItems: number = createOrderDto.items.reduce((acc, orderItem) => {
      return acc + orderItem.quantity;
    }, 0);

    const order = await this.prismaService.order.create({
      data: {
        totalAmount,
        totalItems,
        OrderItem: {
          createMany: {
            data: createOrderDto.items.map((orderItem) => ({
              price:
                products.find((product) => product.id === orderItem.productId)
                  ?.price ?? 0,
              productId: orderItem.productId,
              quantity: orderItem.quantity,
            })),
          },
        },
      },
      include: {
        OrderItem: {
          select: { price: true, quantity: true, productId: true },
        },
      },
    });

    return {
      ...order,
      OrderItem: order.OrderItem.map((orderItem) => ({
        ...orderItem,
        name: products.find((product) => product.id === orderItem.productId)
          ?.name,
      })),
    };
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
    const order = await this.prismaService.order.findUnique({
      where: { id },
      include: {
        OrderItem: {
          select: {
            price: true,
            quantity: true,
            productId: true,
          },
        },
      },
    });

    if (!order)
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`,
      });

    const productIds = order.OrderItem.map((orderItem) => orderItem.productId);

    const products: Product[] = await firstValueFrom(
      this.client
        .send<Product[]>({ cmd: 'validate_products' }, productIds)
        .pipe(
          catchError((err: string | object) => {
            throw new RpcException(err);
          }),
        ),
    );

    return {
      ...order,
      OrderItem: order.OrderItem.map((orderItem) => ({
        ...orderItem,
        name: products.find((product) => product.id === orderItem.productId)
          ?.name,
      })),
    };
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
