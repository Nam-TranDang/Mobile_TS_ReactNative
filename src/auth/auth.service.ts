// src/auth/auth.service.ts
import { Injectable, BadRequestException, ConflictException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  private generateToken(userId: string): string {
    const payload = { userId };
    return this.jwtService.sign(payload);
  }

  async register(registerUserDto: RegisterUserDto) {
    const { email, username, password } = registerUserDto;

    // DTO validation handles length checks and required fields at the controller level
    // However, we still need to check for existing users.

    const existingEmail = await this.userModel.findOne({ email }).exec();
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    const existingUsername = await this.userModel.findOne({ username }).exec();
    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    const profileImage = `https://api.dicebear.com/6.x/initials/svg?seed=${username}`;

    try {
      const user = new this.userModel({
        email,
        username,
        password, // Hashing is handled by the pre-save hook in user.schema.ts
        profileImage,
      });
      await user.save();

      const token = this.generateToken(user._id.toString());

      return {
        token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          profileImage: user.profileImage,
        },
      };
    } catch (error) {
      // Log the detailed error for server-side debugging
      console.error("Error in register service:", error);
      // Check if it's a duplicate key error from MongoDB (just in case, though checks above should catch it)
      if (error.code === 11000) {
         throw new ConflictException('User with this email or username already exists.');
      }
      throw new InternalServerErrorException('An error occurred during registration.');
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid credentials'); // More generic message for security
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user._id.toString());

    return {
      token,
      user: {
        _id: user._id, // Use _id consistent with register
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
      },
    };
  }
}