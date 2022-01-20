import { parseJsonPointerFromString } from '@fosfad/json-pointer';
import type { RelativeJsonPointer } from '../src';
import { parseRelativeJsonPointerFromString } from '../src';

/**
 * Following test cases were taken from {@link https://json-schema.org/draft/2020-12/relative-json-pointer.html | Relative JSON Pointers specification}.
 */
describe('parseJsonPointerFromString function', () => {
  describe('Positive test cases from the specification', () => {
    test.each<[string, number, number | null, string]>([
      ['0', 0, null, ''],
      ['1/0', 1, null, '/0'],
      ['0-1', 0, -1, ''],
      ['2/highly/nested/objects', 2, null, '/highly/nested/objects'],
      ['0#', 0, null, '#'],
      ['0-1#', 0, -1, '#'],
      ['1#', 1, null, '#'],
      ['0/objects', 0, null, '/objects'],
      ['1/nested/objects', 1, null, '/nested/objects'],
      ['2/foo/0', 2, null, '/foo/0'],
      ['0#', 0, null, '#'],
      ['1#', 1, null, '#'],
    ])('Relative pointer `%s`', (relativeJsonPointer, levelsUp, indexShift, jsonPointerString) => {
      expect(parseRelativeJsonPointerFromString(relativeJsonPointer)).toEqual<RelativeJsonPointer>({
        levelsUp: levelsUp,
        indexShift: indexShift,
        jsonPointer: parseJsonPointerFromString(jsonPointerString),
      });
    });
  });
});
