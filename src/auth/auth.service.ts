import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  // Configuration Limits
  private readonly MAX_INVALID_ATTEMPTS = 3;
  private readonly MAX_RESEND_ATTEMPTS = 3;
  private readonly LOCKOUT_DURATION_MINS = 15;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  // --- HELPER FUNCTION: Check Lockout ---
  private checkLockout(user: UserDocument) {
    if (user.otpLockoutUntil) {
      if (user.otpLockoutUntil > new Date()) {
        const timeStr = user.otpLockoutUntil.toLocaleTimeString();
        throw new UnauthorizedException(
          `Too many attempts. Please try again after ${timeStr}`,
        );
      } else {
        user.otpInvalidAttempts = 0;
        user.otpResendAttempts = 0;
        user.otpLockoutUntil = undefined as any;
      }
    }
  }

  // --- SIGNUP FUNCTION ---
  async signup(signupDto: SignupDto) {
    const { username, email, password, mobile } = signupDto;

    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

    const newUser = await this.userModel.create({
      username,
      email,
      password: hashedPassword,
      mobile,
      otp: otpCode,
      otpExpires: otpExpiry,
    });

    this.emailService.sendOtpEmail(email, otpCode).catch(console.error);

    return {
      success: true,
      message: 'User registered successfully. Please check email for OTP.',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        mobile: newUser.mobile,
      },
    };
  }

  // --- LOGIN FUNCTION (UPDATED FOR REFRESH TOKEN) ---
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Please verify your email address first. Check your inbox for the OTP.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { userId: user._id, email: user.email, role: user.role };

    // 1. Access Token (15 mins) aur Refresh Token (7 days) banayen
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // 2. Refresh token ko database mein save karein taake baad mein verify kar sakein
    user.refreshToken = refreshToken;
    await user.save();

    return {
      success: true,
      message: 'Logged in successfully',
      accessToken,
      refreshToken, // Frontend ko dono tokens bhejein
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  // --- REFRESH TOKEN FUNCTION (NEW) ---
  async refreshTokens(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    try {
      // 1. Token ko mathematically verify karein
      const payload = this.jwtService.verify(refreshToken);

      // 2. Database mein check karein ke kya yeh token valid hai aur exist karta hai
      const user = await this.userModel.findById(payload.userId);
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // 3. Naye tokens banayen
      const newPayload = {
        userId: user._id,
        email: user.email,
        role: user.role,
      };
      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: '15m',
      });
      const newRefreshToken = this.jwtService.sign(newPayload, {
        expiresIn: '7d',
      });

      // 4. Naya refresh token DB mein update karein
      user.refreshToken = newRefreshToken;
      await user.save();

      return {
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // --- LOGOUT FUNCTION (NEW) ---
  async logout(userId: string) {
    const user = await this.userModel.findById(userId);
    if (user) {
      // User ka refresh token delete kar dein taake session khatam ho jaye
      user.refreshToken = undefined as any;
      await user.save();
    }
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  // --- VERIFY OTP FUNCTION ---
  async verifyOtp(email: string, otp: string) {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (user.isEmailVerified) {
      throw new ConflictException('Email is already verified');
    }

    this.checkLockout(user);

    if (user.otp !== otp) {
      user.otpInvalidAttempts += 1;

      if (user.otpInvalidAttempts >= this.MAX_INVALID_ATTEMPTS) {
        user.otpLockoutUntil = new Date(
          Date.now() + this.LOCKOUT_DURATION_MINS * 60000,
        );
        await user.save();
        throw new UnauthorizedException(
          'Maximum attempts reached. Account locked for 15 minutes.',
        );
      }

      await user.save();
      const attemptsLeft = this.MAX_INVALID_ATTEMPTS - user.otpInvalidAttempts;
      throw new UnauthorizedException(
        `Invalid OTP code. You have ${attemptsLeft} attempts left.`,
      );
    }

    if (user.otpExpires && new Date() > user.otpExpires) {
      throw new UnauthorizedException('OTP has expired');
    }

    user.isEmailVerified = true;
    user.otp = undefined as any;
    user.otpExpires = undefined as any;
    user.otpInvalidAttempts = 0;
    user.otpResendAttempts = 0;
    user.otpLockoutUntil = undefined as any;

    await user.save();

    return {
      success: true,
      message: 'Email verified successfully',
    };
  }

  // --- RESEND OTP FUNCTION ---
  async resendOtp(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (user.isEmailVerified) {
      throw new ConflictException('Email is already verified');
    }

    this.checkLockout(user);

    user.otpResendAttempts += 1;
    if (user.otpResendAttempts > this.MAX_RESEND_ATTEMPTS) {
      user.otpLockoutUntil = new Date(
        Date.now() + this.LOCKOUT_DURATION_MINS * 60000,
      );
      await user.save();
      throw new UnauthorizedException(
        'Maximum resend limit reached. Try again after 15 minutes.',
      );
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

    user.otp = otpCode;
    user.otpExpires = otpExpiry;
    await user.save();

    this.emailService.sendOtpEmail(email, otpCode).catch(console.error);

    return {
      success: true,
      message: 'A new OTP has been sent to your email',
    };
  }

  // --- FORGOT PASSWORD ---
  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('No account found with this email address');
    }

    this.checkLockout(user);

    user.otpResendAttempts += 1;
    if (user.otpResendAttempts > this.MAX_RESEND_ATTEMPTS) {
      user.otpLockoutUntil = new Date(
        Date.now() + this.LOCKOUT_DURATION_MINS * 60000,
      );
      await user.save();
      throw new UnauthorizedException(
        'Too many requests. Please try again after 15 minutes.',
      );
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

    user.otp = otpCode;
    user.otpExpires = otpExpiry;
    await user.save();

    this.emailService.sendOtpEmail(email, otpCode).catch(console.error);

    return {
      success: true,
      message: 'A password reset OTP has been sent to your email',
    };
  }

  // --- RESET PASSWORD ---
  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.checkLockout(user);

    if (user.otp !== otp) {
      user.otpInvalidAttempts += 1;

      if (user.otpInvalidAttempts >= this.MAX_INVALID_ATTEMPTS) {
        user.otpLockoutUntil = new Date(
          Date.now() + this.LOCKOUT_DURATION_MINS * 60000,
        );
        await user.save();
        throw new UnauthorizedException(
          'Maximum attempts reached. Account locked for 15 minutes.',
        );
      }

      await user.save();
      const attemptsLeft = this.MAX_INVALID_ATTEMPTS - user.otpInvalidAttempts;
      throw new UnauthorizedException(
        `Invalid OTP code. You have ${attemptsLeft} attempts left.`,
      );
    }

    if (user.otpExpires && new Date() > user.otpExpires) {
      throw new UnauthorizedException('OTP has expired');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    user.otp = undefined as any;
    user.otpExpires = undefined as any;
    user.otpInvalidAttempts = 0;
    user.otpResendAttempts = 0;
    user.otpLockoutUntil = undefined as any;

    await user.save();

    return {
      success: true,
      message: 'Your password has been reset successfully',
    };
  }

  // --- CHANGE PASSWORD ---
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Incorrect old password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    return {
      success: true,
      message: 'Your password has been changed successfully',
    };
  }
}
