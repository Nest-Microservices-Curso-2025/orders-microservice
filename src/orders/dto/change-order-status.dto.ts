import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { OrderStatus } from 'src/generated/prisma/enums';
import { OrderStatusList } from '../enum/order.enum';

export class ChangeOrderStatusDto {
  @IsUUID(4)
  id: string;

  @IsEnum(OrderStatus, {
    message: `Possible status values are ${OrderStatusList.join(', ')}`,
  })
  @IsOptional()
  status: OrderStatus;
}
