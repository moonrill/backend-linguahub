import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isAfterStartTime', async: false })
export class IsAfterStartTimeConstraint
  implements ValidatorConstraintInterface
{
  validate(endAt: string, args: ValidationArguments) {
    const [startAtField] = args.constraints;
    const startAt = (args.object as any)[startAtField];

    if (!startAt || !endAt) {
      return false;
    }

    const startTime = this.convertToMinutes(startAt);
    const endTime = this.convertToMinutes(endAt);

    return endTime > startTime;
  }

  private convertToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  defaultMessage(args: ValidationArguments) {
    const [startAtField] = args.constraints;
    return `${args.property} must be after ${startAtField}`;
  }
}

export function IsAfterStartTime(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isAfterStartTime',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: IsAfterStartTimeConstraint,
    });
  };
}
