import { User } from '#/users/entities/user.entity';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EntityNotFoundError, Repository } from 'typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    try {
      const user = await this.userRepository.findOneOrFail({
        where: { id: payload.id },
        relations: {
          role: true,
        },
      });

      return user;
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new UnauthorizedException('Unauthorized user');
      } else {
        throw error;
      }
    }
  }
}
