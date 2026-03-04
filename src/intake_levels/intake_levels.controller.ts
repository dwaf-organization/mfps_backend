import { Controller, Get } from '@nestjs/common';
import { IntakeLevelsService } from './intake_levels.service';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@Controller('intake-levels')
export class IntakeLevelsController {
  constructor(private readonly intakeLevelsService: IntakeLevelsService) {}

  @ResponseMessage('섭취량 레벨 조회 성공')
  @Get()
  async findUsedLevels() {
    return this.intakeLevelsService.findUsedLevels();
  }
}
