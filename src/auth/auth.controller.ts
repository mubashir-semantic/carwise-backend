import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import {
  GoogleLoginDto,
  VerifyOtpDto,
  ResendOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  RefreshTokenDto,
} from './dto/auth-extra.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created.' })
  @ApiResponse({ status: 409, description: 'Email already exists.' })
  signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user and get JWT token' })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully with token.',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // --- GOOGLE OAUTH ENDPOINT ---
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login or signup using Google access token' })
  @ApiResponse({
    status: 200,
    description: 'User authenticated successfully with JWT tokens.',
  })
  @ApiResponse({ status: 401, description: 'Invalid Google access token.' })
  googleLogin(@Body() body: GoogleLoginDto) {
    return this.authService.googleLogin(body.accessToken);
  }

  // --- OTP ENDPOINTS ---
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify user email using OTP' })
  @ApiResponse({ status: 200, description: 'Email verified successfully.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP.' })
  verifyOtp(@Body() body: VerifyOtpDto) {
    return this.authService.verifyOtp(body.email, body.otp);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP to user email' })
  @ApiResponse({ status: 200, description: 'OTP resent successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  resendOtp(@Body() body: ResendOtpDto) {
    return this.authService.resendOtp(body.email);
  }

  // --- FORGOT & RESET PASSWORD ENDPOINTS ---
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to email for password reset' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and set new password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP.' })
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(
      body.email,
      body.otp,
      body.newPassword,
    );
  }

  // --- CHANGE PASSWORD ENDPOINT (FOR LOGGED-IN USERS) ---
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Change password for logged-in user' })
  @ApiResponse({ status: 200, description: 'Password changed successfully.' })
  @ApiResponse({
    status: 401,
    description: 'Incorrect old password or Unauthorized.',
  })
  changePassword(@Req() req: any, @Body() body: ChangePasswordDto) {
    return this.authService.changePassword(
      req.user.userId,
      body.oldPassword,
      body.newPassword,
    );
  }

  // --- REFRESH TOKEN & LOGOUT ENDPOINTS ---
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a new access token using a refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens generated successfully.' })
  @ApiResponse({
    status: 401,
    description: 'Invalid or missing refresh token.',
  })
  refreshTokens(@Body() body: RefreshTokenDto) {
    return this.authService.refreshTokens(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Logout user and revoke refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully.' })
  logout(@Req() req: any) {
    return this.authService.logout(req.user.userId);
  }
}
