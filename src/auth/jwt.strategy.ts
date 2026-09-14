import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      // Request ke header se token uthane ka tareeqa
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Expired token ko reject karega
      secretOrKey: configService.get<string>('JWT_SECRET'), // .env se secret key
    });
  }

  // Agar token theek hoga, toh yeh function user ka data wapis karega
  async validate(payload: any) {
    return { userId: payload.userId, email: payload.email, role: payload.role };
  }
}