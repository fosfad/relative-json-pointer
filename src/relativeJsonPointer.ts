import type { JsonPointer } from '@fosfad/json-pointer';
import { createStringFromJsonPointer, parseJsonPointerFromString } from '@fosfad/json-pointer';

export class InvalidRelativePointerSyntax extends Error {
  constructor(public readonly invalidRelativeJsonPointer: string) {
    super(`Relative JSON Pointer ${invalidRelativeJsonPointer} has invalid pointer syntax`);

    Object.setPrototypeOf(this, InvalidRelativePointerSyntax.prototype);
  }
}

export class UriFragmentIdentifierRepresentationNotSupported extends Error {
  public readonly jsonPointer: JsonPointer;

  constructor(jsonPointer: JsonPointer) {
    const jsonPointerString = createStringFromJsonPointer(jsonPointer);

    super(
      `URI Fragment Identifier Representation of JSON Pointer ${jsonPointerString} is not supported in Relative JSON Pointers.`,
    );

    this.jsonPointer = jsonPointer;

    Object.setPrototypeOf(this, UriFragmentIdentifierRepresentationNotSupported.prototype);
  }
}

/**
 * Relative JSON Pointer representation as object.
 *
 * @see {@link https://json-schema.org/draft/2020-12/relative-json-pointer.html|Relative JSON Pointers}
 */
export type RelativeJsonPointer = {
  indexShift: number | null;

  jsonPointer: JsonPointer;

  levelsUp: number;
};

/**
 * Parses input string into `RelativeJsonPointer` object.
 *
 * @param relativeJsonPointerString - Relative JSON Pointer string.
 * @returns Parsed Relative JSON Pointer.
 *
 * @throws InvalidRelativePointerSyntax
 * If string contains JSON Pointer in invalid format.
 */
export const parseRelativeJsonPointerFromString = (relativeJsonPointerString: string): RelativeJsonPointer => {
  /**
   * first group -- how many levels we need to go up
   * second group -- index manipulation (optional) -- offset from current array element
   * third group -- JSON Pointer
   */
  const match = relativeJsonPointerString.match(
    /^(?<levelsUp>0|[1-9][0-9]*)(?<indexManipulation>[+-](?:0|[1-9][0-9]*))?(?<jsonPointerString>#|(?:\/.*)*)?$/,
  );

  if (match === null || match.groups === undefined) {
    throw new InvalidRelativePointerSyntax(relativeJsonPointerString);
  }

  const { levelsUp, indexManipulation, jsonPointerString } = match.groups;

  if (levelsUp === undefined) {
    throw new InvalidRelativePointerSyntax(relativeJsonPointerString);
  }

  const jsonPointer = parseJsonPointerFromString(jsonPointerString === undefined ? '' : jsonPointerString);

  if (jsonPointer.uriFragmentIdentifierRepresentation && jsonPointer.referenceTokens.length > 0) {
    throw new UriFragmentIdentifierRepresentationNotSupported(jsonPointer);
  }

  return {
    levelsUp: parseInt(levelsUp, 10),
    indexShift: indexManipulation === undefined ? null : parseInt(indexManipulation, 10),
    jsonPointer,
  };
};

/**
 * Creates a string from `RelativeJsonPointer` object.
 *
 * @param relativeJsonPointer - Relative JSON Pointer object.
 * @returns Relative JSON Pointer string.
 */
export const createStringFromRelativeJsonPointer = (relativeJsonPointer: RelativeJsonPointer): string => {
  return (
    relativeJsonPointer.levelsUp.toString() +
    relativeJsonPointer.indexShift?.toString() +
    createStringFromJsonPointer(relativeJsonPointer.jsonPointer)
  );
};
