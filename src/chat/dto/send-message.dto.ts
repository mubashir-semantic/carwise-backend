import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  receiverId: string;

  @IsString()
  @IsOptional()
  text?: string;

  // NAYA: Image ko optional string define kiya
  @IsString()
  @IsOptional()
  image?: string;

  // NAYA: tempId ko optional string define kiya
  @IsString()
  @IsOptional()
  tempId?: string;
}
