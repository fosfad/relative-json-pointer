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

export type IndexManipulation = {
  direction: '-' | '+';

  indexShift: number;
};

export const convertIndexManipulationToInt = (indexManipulation: IndexManipulation): number => {
  return parseInt(indexManipulation.direction + indexManipulation.indexShift);
};

/**
 * Relative JSON Pointer representation as object.
 *
 * @see {@link https://json-schema.org/draft/2020-12/relative-json-pointer.html|Relative JSON Pointers}
 */
export type RelativeJsonPointer = {
  indexManipulation: IndexManipulation | undefined;

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
    /^(?<levelsUp>0|[1-9][0-9]*)(?<indexManipulationString>[+-](?:0|[1-9][0-9]*))?(?<jsonPointerString>#|(?:\/.*)*)?$/,
  );

  if (match === null || match.groups === undefined) {
    throw new InvalidRelativePointerSyntax(relativeJsonPointerString);
  }

  const { levelsUp, indexManipulationString, jsonPointerString } = match.groups;

  if (levelsUp === undefined) {
    throw new InvalidRelativePointerSyntax(relativeJsonPointerString);
  }

  const jsonPointer = parseJsonPointerFromString(jsonPointerString === undefined ? '' : jsonPointerString);

  if (jsonPointer.uriFragmentIdentifierRepresentation && jsonPointer.referenceTokens.length > 0) {
    throw new UriFragmentIdentifierRepresentationNotSupported(jsonPointer);
  }

  let indexManipulation: IndexManipulation | undefined = undefined;
  if (indexManipulationString !== undefined) {
    const indexShift = parseInt(indexManipulationString.substring(1), 10);
    let direction: '-' | '+';
    switch (indexManipulationString.substring(0, 1)) {
      case '+':
        direction = '+';
        break;
      case '-':
        direction = '-';
        break;
      default:
        throw Error('Logic exception');
    }
    indexManipulation = {
      indexShift,
      direction,
    };
  }

  return {
    levelsUp: parseInt(levelsUp, 10),
    indexManipulation,
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
    relativeJsonPointer.indexManipulation?.direction +
    relativeJsonPointer.indexManipulation?.indexShift.toString() +
    createStringFromJsonPointer(relativeJsonPointer.jsonPointer)
  );
};
