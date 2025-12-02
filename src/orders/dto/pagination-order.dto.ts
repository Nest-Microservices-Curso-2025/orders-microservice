import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { OrderStatus } from 'src/generated/prisma/enums';
import { OrderStatusList } from '../enum/order.enum';

export class PaginationOrderDto extends PaginationDto {
  @IsEnum(OrderStatus, {
    message: `Possible status values are ${OrderStatusList.join(', ')}`,
  })
  @IsOptional()
  status: OrderStatus;
}
