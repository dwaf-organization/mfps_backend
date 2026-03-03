import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BodyPartsController } from './body_parts.controller';
import { BodyPartsService } from './body_parts.service';
import { BodyPartsEntity } from './body_parts.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BodyPartsEntity])],
  controllers: [BodyPartsController],
  providers: [BodyPartsService],
})
export class BodyPartsModule {}
