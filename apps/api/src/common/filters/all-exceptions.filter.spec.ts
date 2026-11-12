import { HttpStatus, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@muhasabah/shared';
import { AppException } from '../app.exception';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  it('memakai code dari AppException', () => {
    expect(
      filter.toBody(new AppException(ErrorCode.EMAIL_TAKEN, 'x', HttpStatus.CONFLICT)),
    ).toEqual({ statusCode: 409, code: 'EMAIL_TAKEN', message: 'x' });
  });

  it('memetakan HttpException bawaan', () => {
    expect(filter.toBody(new NotFoundException('hilang'))).toMatchObject({
      statusCode: 404,
      code: ErrorCode.NOT_FOUND,
    });
  });

  it('error tak dikenal menjadi 500 tanpa membocorkan pesan', () => {
    expect(filter.toBody(new Error('rahasia internal'))).toEqual({
      statusCode: 500,
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Terjadi kesalahan pada server',
    });
  });
});
