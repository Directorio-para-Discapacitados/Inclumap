import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PayloadInterface } from '../payload/payload.interface';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): PayloadInterface => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as PayloadInterface;
  },
);
