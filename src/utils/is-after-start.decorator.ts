import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isAfterStart', async: false })
export class IsAfterStartConstraint implements ValidatorConstraintInterface {
  validate(value: string | Date, args: ValidationArguments) {
    const [startField] = args.constraints;
    const startValue = (args.object as any)[startField];

    if (!startValue || !value) {
      return false;
    }

    const start = this.parseDateTime(startValue);
    const end = this.parseDateTime(value);

    return end > start;
  }

  private parseDateTime(value: string | Date): Date {
    if (value instanceof Date) {
      return value;
    }

    // Check if the string contains a date
    if (value.includes('-') || value.includes('/')) {
      return new Date(value);
    }

    // Assume it's a time string
    const [hours, minutes] = value.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  defaultMessage(args: ValidationArguments) {
    const [startField] = args.constraints;
    return `${args.property} must be after ${startField}`;
  }
}

export function IsAfterStart(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isAfterStart',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: IsAfterStartConstraint,
    });
  };
}
