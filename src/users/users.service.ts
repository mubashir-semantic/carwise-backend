import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // 1. GET PROFILE LOGIC
  async getProfile(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select(
        '-password -otp -otpExpires -refreshToken -otpResendAttempts -otpInvalidAttempts -otpLockoutUntil',
      );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      message: 'Profile fetched successfully',
      user,
    };
  }

  // 2. UPDATE PROFILE LOGIC
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: updateProfileDto },
        { new: true, runValidators: true },
      )
      .select(
        '-password -otp -otpExpires -refreshToken -otpResendAttempts -otpInvalidAttempts -otpLockoutUntil',
      );

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    };
  }

  // 3. GET ALL USERS LOGIC (For Chat Contacts)
  async getAllUsers(currentUserId: string) {
    const users = await this.userModel
      .find({ _id: { $ne: currentUserId } })
      // YAHAN CHANGE HAI: 'username' aur 'avatar' lazmi add karein
      .select('name username email role avatar')
      .exec();

    return users;
  }
}
