import { Controller, Get, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import { WebService } from './web.service';

@Controller('web')
export class WebController {
  constructor(private readonly webService: WebService) {}

  @Get('withdrawal')
  getWithdrawPage(@Res() res: Response) {
    const html = this.webService.getWithdrawPageHtml();
    res.send(html);
  }
}
