import { HttpException, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ValidationService } from '../common/validation.service';
import { PrismaService } from '../common/prisma.service';
import { RegisterUserRequest, UserResponse } from '../model/user.model';
import { Logger } from 'winston';
import { UserValidation } from './user.validation';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    private validationService: ValidationService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private logger: Logger,
    private prismaService: PrismaService,
  ) {}
  async register(request: RegisterUserRequest): Promise<UserResponse> {
    this.logger.debug(`register new user ${JSON.stringify(request)}`);

    const registerRequest = this.validationService.validate(
      UserValidation.REGISTER,
      request,
    );

    const existingUser = await this.prismaService.user.findFirst({
      where: {
        username: registerRequest.username,
      },
    });

    if (existingUser) {
      throw new HttpException('username already registered', 400);
    }

    registerRequest.password = await bcrypt.hash(registerRequest.password, 10);

    const newUser = await this.prismaService.user.create({
      data: registerRequest,
    });

    return {
      name: newUser.name,
      username: newUser.username,
    };
  }
}
