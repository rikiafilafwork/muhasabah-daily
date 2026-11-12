import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Menandai endpoint yang tidak butuh access token. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
