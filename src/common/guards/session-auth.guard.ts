import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class SessionAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

        if (!req.session || !req.session.email) {
            throw new UnauthorizedException('로그인이 필요합니다.');
        }

        return true;
    }
}
