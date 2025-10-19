import { Module } from '@nestjs/common';
import { PeopleService } from './people.service';
import { PeopleController } from './people.controller';
import { PeopleEntity } from './entity/people.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/entity/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PeopleEntity, UserEntity])],
  providers: [PeopleService],
  controllers: [PeopleController]
})
export class PeopleModule {}