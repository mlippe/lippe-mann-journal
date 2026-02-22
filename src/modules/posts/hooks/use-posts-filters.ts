import { DEFAULT_PAGE } from '@/constants';
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

export const usePostsFilters = () => {
  return useQueryStates({
    search: parseAsString.withDefault('').withOptions({ clearOnDefault: true }),
    page: parseAsInteger
      .withDefault(DEFAULT_PAGE)
      .withOptions({ clearOnDefault: true }),
    type: parseAsStringEnum(['ARTICLE', 'PHOTO', 'ALBUM']).withDefault('PHOTO').withOptions({ clearOnDefault: true }),
  });
};
