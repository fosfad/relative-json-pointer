import { parseJsonPointerFromString } from '@fosfad/json-pointer';
import type { RelativeJsonPointer } from '../src';
import { parseRelativeJsonPointerFromString } from '../src';
import type { IndexManipulation } from '../src/relativeJsonPointer';

/**
 * Following test cases were taken from {@link https://json-schema.org/draft/2020-12/relative-json-pointer.html | Relative JSON Pointers specification}.
 */
describe('parseJsonPointerFromString function', () => {
  describe('Positive test cases from the specification', () => {
    test.each<[string, number, IndexManipulation | undefined, string]>([
      ['0', 0, undefined, ''],
      ['1/0', 1, undefined, '/0'],
      ['0-1', 0, { direction: '-', indexShift: 1 }, ''],
      ['2/highly/nested/objects', 2, undefined, '/highly/nested/objects'],
      ['0#', 0, undefined, '#'],
      ['0-1#', 0, { direction: '-', indexShift: 1 }, '#'],
      ['1#', 1, undefined, '#'],
      ['0/objects', 0, undefined, '/objects'],
      ['1/nested/objects', 1, undefined, '/nested/objects'],
      ['2/foo/0', 2, undefined, '/foo/0'],
      ['0#', 0, undefined, '#'],
      ['1#', 1, undefined, '#'],
    ])('Relative pointer `%s`', (relativeJsonPointer, levelsUp, indexManipulation, jsonPointerString) => {
      expect(parseRelativeJsonPointerFromString(relativeJsonPointer)).toEqual<RelativeJsonPointer>({
        levelsUp,
        indexManipulation,
        jsonPointer: parseJsonPointerFromString(jsonPointerString),
      });
    });
  });
});
