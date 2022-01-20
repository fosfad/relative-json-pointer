import type { Json } from '@fosfad/json-pointer';
import { parseJsonPointerFromString } from '@fosfad/json-pointer';
import { getValueAtRelativeJsonPointer, IndexManipulationOnJsonDocumentRoot } from '../src';
import {
  ExtractNameOfJsonDocumentRoot,
  IndexManipulationNotOnArrayValue,
  IndexManipulationOutOfBounds,
  JsonDocumentOutOfBounds,
} from '../src/relativeJsonPointerResolver';

/**
 * Following test cases were taken from {@link https://json-schema.org/draft/2020-12/relative-json-pointer.html | Relative JSON Pointers specification}.
 */
describe('Positive test cases from the specification', () => {
  const json: Json = {
    foo: ['bar', 'baz'],
    highly: {
      nested: {
        objects: true,
      },
    },
  };
  const secondOfFooPointer = parseJsonPointerFromString('/foo/1');
  test.each<[string, Json]>([
    ['0', 'baz'],
    ['1/0', 'bar'],
    ['0-1', 'bar'],
    ['2/highly/nested/objects', true],
    ['0#', 1],
    ['0-1#', 0],
    ['1#', 'foo'],
  ])('Relative pointer `%s`', (relativeJsonPointer, expectedValue) => {
    expect(getValueAtRelativeJsonPointer(json, secondOfFooPointer, relativeJsonPointer)).toEqual(expectedValue);
  });

  const highlyNestedObjectPointer = parseJsonPointerFromString('/highly/nested');
  test.each<[string, Json]>([
    ['0/objects', true],
    ['1/nested/objects', true],
    ['2/foo/0', 'bar'],
    ['0#', 'nested'],
    ['1#', 'highly'],
  ])('Relative pointer `%s`', (relativeJsonPointer, expectedValue) => {
    expect(getValueAtRelativeJsonPointer(json, highlyNestedObjectPointer, relativeJsonPointer)).toEqual(expectedValue);
  });
});

describe('Negative custom test cases', () => {
  const json: Json = {
    foo: [
      {
        bar: true,
      },
    ],
  };
  const deepJsonPointer = parseJsonPointerFromString('/foo/0/bar');
  test('JsonDocumentOutOfBounds', () => {
    expect(() => getValueAtRelativeJsonPointer(json, deepJsonPointer, '4')).toThrow(JsonDocumentOutOfBounds);
  });
  test('IndexManipulationOnJsonDocumentRoot', () => {
    expect(() => getValueAtRelativeJsonPointer(json, deepJsonPointer, '3-1')).toThrow(
      IndexManipulationOnJsonDocumentRoot,
    );
  });
  test('IndexManipulationNotOnArrayValue', () => {
    expect(() => getValueAtRelativeJsonPointer(json, deepJsonPointer, '0-1')).toThrow(IndexManipulationNotOnArrayValue);
  });
  test('IndexManipulationOutOfBounds', () => {
    expect(() => getValueAtRelativeJsonPointer(json, deepJsonPointer, '1+1')).toThrow(IndexManipulationOutOfBounds);
  });
  test('ExtractNameOfJsonDocumentRoot', () => {
    expect(() => getValueAtRelativeJsonPointer(json, deepJsonPointer, '3#')).toThrow(ExtractNameOfJsonDocumentRoot);
  });
});
