import type { ValidationOptions, ValidationArguments } from 'class-validator';
import { registerDecorator } from 'class-validator';
import { ethers } from 'ethers';

export function IsNonPrimitiveArray(validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      name: 'IsNonPrimitiveArray',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          return (
            Array.isArray(value) &&
            value.reduce((a, b) => a && typeof b === 'object' && !Array.isArray(b), true)
          );
        },
      },
    });
  };
}

export function IsValidEthereumAddress(validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      name: 'IsValidEthereumAddress',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: string) {
          return ethers.utils.isAddress(value);
        },
        defaultMessage: (validationArguments?: ValidationArguments) =>
          `${validationArguments.property} should be valid ethereum address`,
      },
    });
  };
}

export function isValidENS(validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      name: 'isValidEthereumAddressOrENS',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: string) {
          return /^[A-Za-z0-9]{3,251}\.eth$/.test(value);
        },
        defaultMessage: (validationArguments?: ValidationArguments) =>
          `${validationArguments.property} should be valid a ENS name`,
      },
    });
  };
}

export function isValidDeadline(validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      name: 'isValidDeadline',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: string) {
          return parseInt(value) > Date.now();
        },
        defaultMessage: (validationArguments?: ValidationArguments) =>
          `${validationArguments.property} should be a valid future unix epoch time`,
      },
    });
  };
}

export function IsValidTimeStamp(validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      name: 'isValidTimeStamp',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: string) {
          try {
            parseInt(value);
            return true;
          } catch (err) {
            return false;
          }
        },
        defaultMessage: (validationArguments?: ValidationArguments) =>
          `${validationArguments.property} should be a valid unix epoch time`,
      },
    });
  };
}

export function IsValidURL(validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      name: 'isValidURL',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: string) {
          try {
            new URL(value);
            return true;
          } catch (err) {
            return false;
          }
        },
        defaultMessage: (validationArguments?: ValidationArguments) =>
          `${validationArguments.property} should be a valid URL`,
      },
    });
  };
}

export function IsValidChainId(validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      name: 'isValidChainId',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value) {
          try {
            Number.parseInt(value);
            return true;
          } catch (err) {
            return false;
          }
        },
        defaultMessage: (validationArguments?: ValidationArguments) =>
          `${validationArguments.property} should be a valid Chain ID`,
      },
    });
  };
}

export function IsValidNonce(validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      name: 'isValidNonce',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value) {
          try {
            Number.parseInt(value);
            return true;
          } catch (err) {
            return false;
          }
        },
        defaultMessage: (validationArguments?: ValidationArguments) =>
          `${validationArguments.property} should be a valid nonce`,
      },
    });
  };
}
