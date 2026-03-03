import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { WebService } from './web.service';

@Controller('web')
export class WebController {
    constructor(private readonly webService: WebService) {}

    @Get('withdraw')
    getWithdrawPage(@Res() res: Response) {
        const htmlPath = this.webService.getWithdrawPagePath();
        res.sendFile(htmlPath);
    }

    @Get('privacy')
    getPrivacyPage(@Res() res: Response) {
        const htmlPath = this.webService.getPrivacyPagePath();
        res.sendFile(htmlPath);
    }
}