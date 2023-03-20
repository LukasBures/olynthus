import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  IsValidChainId,
  IsValidEthereumAddress as IsValidEthereumAddress,
  IsValidNonce,
  isValidDeadline,
} from '../../validators/custom.validators';
import { MetadataDTO } from '../common/metadata.dto';
import 'reflect-metadata';

export class MessageDomainDTO {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsNotEmpty()
  @IsValidChainId()
  @Transform(({ value }) => Number.parseInt(value).toString())
  chainId: string | number;

  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase())
  @IsValidEthereumAddress()
  verifyingContract: string;
}

export class ERC20PermitMessageDTO {
  @IsNotEmpty()
  @IsValidEthereumAddress()
  @Transform(({ value }) => value.toLowerCase())
  owner: string;

  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase())
  @IsValidEthereumAddress()
  spender: string;

  @IsNotEmpty()
  @IsString()
  value: string;

  @IsNotEmpty()
  @IsValidNonce()
  @Transform(({ value }) => Number.parseInt(value).toString())
  nonce: string | number;

  @IsNotEmpty()
  @isValidDeadline()
  deadline: string;
}

export class ERC721PermitMessageDTO {
  @IsNotEmpty()
  @IsValidEthereumAddress()
  @Transform(({ value }) => value.toLowerCase())
  owner: string;

  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase())
  @IsValidEthereumAddress()
  spender: string;

  @IsNotEmpty()
  @IsString()
  tokenId: string;

  @IsNotEmpty()
  @isValidDeadline()
  deadline: string;

  @IsNotEmpty()
  @IsValidNonce()
  @Transform(({ value }) => Number.parseInt(value).toString())
  nonce: string | number;
}

export class DAIPermitMessageDTO {
  @IsNotEmpty()
  @IsValidEthereumAddress()
  @Transform(({ value }) => value.toLowerCase())
  holder: string;

  @IsNotEmpty()
  @IsValidEthereumAddress()
  @Transform(({ value }) => value.toLowerCase())
  spender: string;

  @IsNotEmpty()
  @IsValidNonce()
  @Transform(({ value }) => Number.parseInt(value).toString())
  nonce: string | number;

  @IsNotEmpty()
  @isValidDeadline()
  expiry: string;

  @IsNotEmpty()
  @IsBoolean()
  allowed: boolean;
}

export class SeaportOfferItemDTO {
  @IsNotEmpty()
  @IsString()
  itemType: string;

  @IsNotEmpty()
  @IsValidEthereumAddress()
  @Transform(({ value }) => value.toLowerCase())
  token: string;

  @IsNotEmpty()
  @IsString()
  identifierOrCriteria: string;

  @IsNotEmpty()
  @IsString()
  startAmount: string;

  @IsNotEmpty()
  @IsString()
  endAmount: string;
}

export class SeaportConsiderationItemDTO {
  @IsNotEmpty()
  @IsString()
  itemType: string;

  @IsNotEmpty()
  @IsValidEthereumAddress()
  @Transform(({ value }) => value.toLowerCase())
  token: string;

  @IsNotEmpty()
  @IsString()
  identifierOrCriteria: string;

  @IsNotEmpty()
  @IsString()
  startAmount: string;

  @IsNotEmpty()
  @IsString()
  endAmount: string;

  @IsNotEmpty()
  @IsValidEthereumAddress()
  @Transform(({ value }) => value.toLowerCase())
  recipient: string;
}
export class SeaportMessageDTO {
  @IsNotEmpty()
  @IsValidEthereumAddress()
  @Transform(({ value }) => value.toLowerCase())
  offerer: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeaportOfferItemDTO)
  offer: SeaportOfferItemDTO[];

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeaportConsiderationItemDTO)
  consideration: SeaportConsiderationItemDTO[];

  @IsNotEmpty()
  @IsString()
  startTime: string;

  @IsNotEmpty()
  @IsString()
  endTime: string;

  @IsNotEmpty()
  @IsString()
  orderType: string;

  @IsNotEmpty()
  @IsString()
  zone: string;

  @IsNotEmpty()
  @IsString()
  zoneHash: string;

  @IsNotEmpty()
  @IsString()
  salt: string;

  @IsNotEmpty()
  @IsString()
  conduitKey: string;

  @IsNotEmpty()
  @IsString()
  counter: string;
}

export class PermitDetailsDTO {
  @IsNotEmpty()
  @IsValidEthereumAddress()
  @Transform(({ value }) => value.toLowerCase())
  token: string;

  @IsNotEmpty()
  @IsString()
  amount: string;

  @IsNotEmpty()
  @isValidDeadline()
  expiration: string;

  @IsNotEmpty()
  @IsValidNonce()
  @Transform(({ value }) => Number.parseInt(value).toString())
  nonce: string | number;
}

export class PermitSingleMessageDTO {
  @IsNotEmpty()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => PermitDetailsDTO)
  details: PermitDetailsDTO;

  @IsNotEmpty()
  @IsValidEthereumAddress()
  @Transform(({ value }) => value.toLowerCase())
  spender: string;

  @IsNotEmpty()
  @isValidDeadline()
  sigDeadline: string;
}

export class PermitBatchMessageDTO {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermitDetailsDTO)
  details: PermitDetailsDTO[];

  @IsNotEmpty()
  @IsValidEthereumAddress()
  @Transform(({ value }) => value.toLowerCase())
  spender: string;

  @IsNotEmpty()
  @isValidDeadline()
  sigDeadline: string;
}

export class TokenPermissionDTO {
  @IsNotEmpty()
  @IsValidEthereumAddress()
  @Transform(({ value }) => value.toLowerCase())
  token: string;

  @IsNotEmpty()
  @IsString()
  amount: string;
}

export class PermitTransferFromMessageDTO {
  @IsNotEmpty()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => TokenPermissionDTO)
  permitted: TokenPermissionDTO;

  @IsNotEmpty()
  @IsValidEthereumAddress()
  @Transform(({ value }) => value.toLowerCase())
  spender: string;

  @IsNotEmpty()
  @IsValidNonce()
  @Transform(({ value }) => Number.parseInt(value).toString())
  nonce: string | number;

  @IsNotEmpty()
  @isValidDeadline()
  deadline: string;
}

export class PermitBatchTransferFromMessageDTO {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TokenPermissionDTO)
  permitted: TokenPermissionDTO[];

  @IsNotEmpty()
  @IsValidEthereumAddress()
  @Transform(({ value }) => value.toLowerCase())
  spender: string;

  @IsNotEmpty()
  @IsValidNonce()
  @Transform(({ value }) => Number.parseInt(value).toString())
  nonce: string | number;

  @IsNotEmpty()
  @isValidDeadline()
  deadline: string;
}

export class PermitWitnessTransferFromMessageDTO {
  @IsNotEmpty()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => TokenPermissionDTO)
  permitted: TokenPermissionDTO;

  @IsNotEmpty()
  @IsValidEthereumAddress()
  @Transform(({ value }) => value.toLowerCase())
  spender: string;

  @IsNotEmpty()
  @IsValidNonce()
  @Transform(({ value }) => Number.parseInt(value).toString())
  nonce: string | number;

  @IsNotEmpty()
  @isValidDeadline()
  deadline: string;

  @IsNotEmpty()
  witness: any;
}

export class PermitBatchWitnessTransferFromMessageDTO {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TokenPermissionDTO)
  permitted: TokenPermissionDTO[];

  @IsNotEmpty()
  @IsValidEthereumAddress()
  @Transform(({ value }) => value.toLowerCase())
  spender: string;

  @IsNotEmpty()
  @IsValidNonce()
  @Transform(({ value }) => Number.parseInt(value).toString())
  nonce: string | number;

  @IsNotEmpty()
  @isValidDeadline()
  deadline: string;

  @IsNotEmpty()
  witness: any;
}

export class GeneralMessageDTO {
  @IsNotEmpty()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => MessageDomainDTO)
  domain: MessageDomainDTO;

  @IsNotEmpty()
  @IsString()
  primaryType: string;

  /**
   * TODO: Check and use alternate automated DTO validation solution when possible.
   * ! Note: message validation is done in main.ts
   * * Since message can be of different type, using @ValidateNested({each: true}) or Custom Validator to validate the DTO doesn't work as expected.
   * * @ValidateNested works only for the first DTO type in the type union (ERC20PermitMessageDTO | ERC721PermitMessageDTO | DAIPermitMessageDTO)
   * *    and doesn't support validation for multiple different types.
   * * Custom Validators work but nuanced error messages are not possible with that approach. Hence for now, validating the inputs manually.
   * * Validation Groups might help with this case. Have to check later if required. Ref: https://github.com/typestack/class-validator#validation-groups
   */
  @IsNotEmpty()
  @IsObject()
  message: any;
}

export class MessageProfilingRequestDTO {
  @IsNotEmpty()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => GeneralMessageDTO)
  message: GeneralMessageDTO;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => MetadataDTO)
  metadata?: MetadataDTO;
}
