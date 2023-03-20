import { Type, Transform } from 'class-transformer';
import { IsNotEmpty, IsObject, ValidateIf, ValidateNested } from 'class-validator';
import { IsValidEthereumAddress, isValidENS } from '../../validators/custom.validators';

export class UserDTO {
  @ValidateIf((o) => !o.ens)
  @IsNotEmpty()
  @IsValidEthereumAddress()
  @Transform(({ value }) => value.toLowerCase())
  address?: string;

  @ValidateIf((o) => !o.address)
  @IsNotEmpty()
  @isValidENS()
  @Transform(({ value }) => value.toLowerCase())
  ens?: string;
}

export class UserProfilingRequestDTO {
  @IsNotEmpty()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => UserDTO)
  user: UserDTO;
}
