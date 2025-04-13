import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum FileStatusEnum {
    PENDING = 'pending',
    COMPLETE = 'complete',
    REJECTED = 'rejected',
}

export class FileStatusDto {
    @IsInt()
    @IsNotEmpty()
    fileId: number;

    @IsString()
    @IsNotEmpty()
    fileType: string;

    @IsInt()
    @IsNotEmpty()
    patientId: number;
}

export class UpdateFileStatusDto extends FileStatusDto {
    @IsEnum(FileStatusEnum)
    @IsNotEmpty()
    status: FileStatusEnum;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class FileStatusQueryDto {
    @IsInt()
    @IsNotEmpty()
    patient_id: number;
}

export class FileStatusResponseDto {
    success: boolean;
    data?: any;
    message?: string;
    count?: number;
}