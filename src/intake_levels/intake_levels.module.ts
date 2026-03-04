import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntakeLevelsController } from './intake_levels.controller';
import { IntakeLevelsService } from './intake_levels.service';
import { IntakeLevelsEntity } from './intake_levels.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IntakeLevelsEntity])],
  controllers: [IntakeLevelsController],
  providers: [IntakeLevelsService],
})
export class IntakeLevelsModule {}
