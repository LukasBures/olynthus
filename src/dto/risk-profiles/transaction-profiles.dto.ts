import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsHexadecimal,
  IsString,
  IsOptional,
  IsObject,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { MetadataDTO } from '../common/metadata.dto';
import 'reflect-metadata';
import { IsValidEthereumAddress } from '../../validators/custom.validators';

export class TransactionDTO {
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase())
  @IsValidEthereumAddress()
  from: string;

  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase())
  @IsValidEthereumAddress()
  to: string;

  @IsNotEmpty()
  @IsNumber()
  value: number;

  @IsOptional()
  @ValidateIf((o) => o.data !== '')
  @IsHexadecimal({ message: 'data should be a valid transaction data' })
  data: string;

  @IsString()
  @IsOptional()
  gas?: string;

  @IsString()
  @IsOptional()
  gas_price?: string;
}

export class TransactionProfilingRequestDTO {
  constructor(transaction, metadata) {
    this.transaction = transaction;
    this.metadata = metadata;
  }

  @IsNotEmpty()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => TransactionDTO)
  transaction: TransactionDTO;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => MetadataDTO)
  metadata?: MetadataDTO;
}
