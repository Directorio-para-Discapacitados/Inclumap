import { Module } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { BusinessEntity } from './entity/business.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessEntity])],
  providers: [BusinessService],
  controllers: [BusinessController]
})
export class BusinessModule {}
