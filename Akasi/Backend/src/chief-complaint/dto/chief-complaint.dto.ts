import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class CreateChiefComplaintDto {
  @IsNumber()
  @IsNotEmpty()
  consultation_id: number;

  @IsString()
  @IsNotEmpty()
  complaint: string;
}

export class UpdateChiefComplaintDto {
  @IsString()
  @IsNotEmpty()
  complaint: string;
}