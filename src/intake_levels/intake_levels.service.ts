import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntakeLevelsEntity } from './intake_levels.entity';

@Injectable()
export class IntakeLevelsService {
  constructor(
    @InjectRepository(IntakeLevelsEntity)
    private readonly intakeLevelsRepository: Repository<IntakeLevelsEntity>,
  ) {}

  // GET /intake-levels (현재 사용하는 3가지만)
  async findUsedLevels() {
    const usedLevelNames = ['전량섭취', '식사전', '결식'];

    const levels = await this.intakeLevelsRepository
      .createQueryBuilder('level')
      .where('level.level_name IN (:...names)', { names: usedLevelNames })
      .orderBy('level.level_order', 'ASC')
      .getMany();

    return levels.map((level) => ({
      level_code: level.level_code,
      level_name: level.level_name,
      percentage_value: level.percentage_value,
      level_order: level.level_order,
    }));
  }
}
