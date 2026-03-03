import { Controller, Get } from '@nestjs/common';
import { BodyPartsService } from './body_parts.service';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@Controller('body-parts')
export class BodyPartsController {
  constructor(private readonly bodyPartsService: BodyPartsService) {}

  @ResponseMessage('신체 부위 조회 성공')
  @Get()
  async findAll() {
    try {
      return this.bodyPartsService.findAll();
    } catch (error) {
      throw error;
    }
  }
}
