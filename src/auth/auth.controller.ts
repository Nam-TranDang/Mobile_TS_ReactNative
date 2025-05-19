// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Controller('auth') // This means routes will be /api/auth/... due to global prefix
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED) // Sets the status code to 201
  async register(@Body() registerUserDto: RegisterUserDto) {
    // ValidationPipe in main.ts handles DTO validation
    return this.authService.register(registerUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK) // Sets the status code to 200
  async login(@Body() loginUserDto: LoginUserDto) {
    // ValidationPipe in main.ts handles DTO validation
    return this.authService.login(loginUserDto);
  }
}