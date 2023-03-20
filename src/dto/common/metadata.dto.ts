import { IsOptional, ValidateIf } from 'class-validator';
import { IsValidURL } from '../../validators/custom.validators';

export class MetadataDTO {
  @IsOptional()
  @ValidateIf((o) => o.url !== '')
  @IsValidURL()
  url: string;
}
