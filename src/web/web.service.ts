import { Injectable } from '@nestjs/common';
import * as path from 'path';

@Injectable()
export class WebService {
  getWithdrawPagePath(): string {
    return path.join(process.cwd(), 'src', 'common', 'public', 'withdraw.html');
  }

  getPrivacyPagePath(): string {
    return path.join(process.cwd(), 'src', 'common', 'public', 'privacy.html');
  }
}
