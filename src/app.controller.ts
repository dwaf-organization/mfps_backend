import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import type { Response } from 'express';
import { join } from 'path';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/web/privacy')
  getPrivacy(@Res() res: Response) {
    const filePath = join(
      process.cwd(),
      'dist',
      'common',
      'public',
      'privacy.html',
    );

    return res.sendFile(filePath);
  }

  @Get('/web/withdraw')
  getwithDraw(@Res() res: Response) {
    const filePath = join(
      process.cwd(),
      'dist',
      'common',
      'public',
      'withdraw.html',
    );

    return res.sendFile(filePath);
  }
}
