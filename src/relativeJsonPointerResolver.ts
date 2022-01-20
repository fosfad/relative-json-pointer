import type { Json, JsonPointer } from '@fosfad/json-pointer';
import { getValueAtJsonPointer, parseJsonPointerFromString } from '@fosfad/json-pointer';
import type { RelativeJsonPointer } from './relativeJsonPointer';
import { createStringFromRelativeJsonPointer, parseRelativeJsonPointerFromString } from './relativeJsonPointer';

export class JsonDocumentOutOfBounds extends Error {
  public readonly relativeJsonPointer: RelativeJsonPointer;

  constructor(relativeJsonPointer: RelativeJsonPointer) {
    const relativeJsonPointerString = createStringFromRelativeJsonPointer(relativeJsonPointer);

    super(`Relative JSON Pointer ${relativeJsonPointerString} points outside JSON document.`);

    this.relativeJsonPointer = relativeJsonPointer;

    Object.setPrototypeOf(this, JsonDocumentOutOfBounds.prototype);
  }
}

export class IndexManipulationOnJsonDocumentRoot extends Error {
  public readonly relativeJsonPointer: RelativeJsonPointer;

  constructor(relativeJsonPointer: RelativeJsonPointer) {
    const relativeJsonPointerString = createStringFromRelativeJsonPointer(relativeJsonPointer);

    super(`Relative JSON Pointer ${relativeJsonPointerString} performs index manipulation on JSON document root.`);

    this.relativeJsonPointer = relativeJsonPointer;

    Object.setPrototypeOf(this, IndexManipulationOnJsonDocumentRoot.prototype);
  }
}

export class IndexManipulationNotOnArrayValue extends Error {
  public readonly relativeJsonPointer: RelativeJsonPointer;

  constructor(relativeJsonPointer: RelativeJsonPointer) {
    const relativeJsonPointerString = createStringFromRelativeJsonPointer(relativeJsonPointer);

    super(`Relative JSON Pointer ${relativeJsonPointerString} performs index manipulation not on array value.`);

    this.relativeJsonPointer = relativeJsonPointer;

    Object.setPrototypeOf(this, IndexManipulationNotOnArrayValue.prototype);
  }
}

export class IndexManipulationOutOfBounds extends Error {
  public readonly relativeJsonPointer: RelativeJsonPointer;

  constructor(relativeJsonPointer: RelativeJsonPointer) {
    const relativeJsonPointerString = createStringFromRelativeJsonPointer(relativeJsonPointer);

    super(`Relative JSON Pointer ${relativeJsonPointerString} index manipulation points outside array value.`);

    this.relativeJsonPointer = relativeJsonPointer;

    Object.setPrototypeOf(this, IndexManipulationOutOfBounds.prototype);
  }
}

export class ExtractNameOfJsonDocumentRoot extends Error {
  public readonly relativeJsonPointer: RelativeJsonPointer;

  constructor(relativeJsonPointer: RelativeJsonPointer) {
    const relativeJsonPointerString = createStringFromRelativeJsonPointer(relativeJsonPointer);

    super(`Relative JSON Pointer ${relativeJsonPointerString} extracts name of JSON document root.`);

    this.relativeJsonPointer = relativeJsonPointer;

    Object.setPrototypeOf(this, ExtractNameOfJsonDocumentRoot.prototype);
  }
}

function applyLevelsUp(jsonPointer: JsonPointer, relativeJsonPointer: RelativeJsonPointer): JsonPointer {
  const remainder = jsonPointer.referenceTokens.length - relativeJsonPointer.levelsUp;

  if (remainder < 0) {
    throw new JsonDocumentOutOfBounds(relativeJsonPointer);
  }

  return {
    referenceTokens: jsonPointer.referenceTokens.slice(0, remainder),
    uriFragmentIdentifierRepresentation: jsonPointer.uriFragmentIdentifierRepresentation,
  };
}

function applyArrayShift(json: Json, jsonPointer: JsonPointer, relativeJsonPointer: RelativeJsonPointer): JsonPointer {
  if (relativeJsonPointer.indexShift === null) {
    return jsonPointer;
  }

  const currentIndexString = jsonPointer.referenceTokens.slice(-1)[0];

  if (currentIndexString === undefined) {
    throw new IndexManipulationOnJsonDocumentRoot(relativeJsonPointer);
  }

  const currentIndex = parseInt(currentIndexString, 10);

  const jsonPointerToArray: JsonPointer = {
    referenceTokens: jsonPointer.referenceTokens.slice(0, -1),
    uriFragmentIdentifierRepresentation: jsonPointer.uriFragmentIdentifierRepresentation,
  };

  const array = getValueAtJsonPointer(json, jsonPointerToArray);

  if (!Array.isArray(array)) {
    throw new IndexManipulationNotOnArrayValue(relativeJsonPointer);
  }

  if (
    currentIndex + relativeJsonPointer.indexShift < 0 ||
    currentIndex + relativeJsonPointer.indexShift > array.length - 1
  ) {
    throw new IndexManipulationOutOfBounds(relativeJsonPointer);
  }

  return {
    referenceTokens: jsonPointerToArray.referenceTokens.concat(
      (currentIndex + relativeJsonPointer.indexShift).toString(10),
    ),
    uriFragmentIdentifierRepresentation: jsonPointerToArray.uriFragmentIdentifierRepresentation,
  };
}

function extractNameOrIndex(
  json: Json,
  jsonPointer: JsonPointer,
  relativeJsonPointer: RelativeJsonPointer,
): number | string {
  const jsonElementNameOrIndexString = jsonPointer.referenceTokens.slice(-1)[0];

  if (jsonElementNameOrIndexString === undefined) {
    throw new ExtractNameOfJsonDocumentRoot(relativeJsonPointer);
  }

  if (
    Array.isArray(
      getValueAtJsonPointer(json, {
        referenceTokens: jsonPointer.referenceTokens.slice(0, -1),
        uriFragmentIdentifierRepresentation: jsonPointer.uriFragmentIdentifierRepresentation,
      }),
    )
  ) {
    return parseInt(jsonElementNameOrIndexString, 10);
  } else {
    return jsonElementNameOrIndexString;
  }
}

export const getValueAtRelativeJsonPointer = (
  json: Json,
  jsonPointer: JsonPointer | string,
  relativeJsonPointer: RelativeJsonPointer | string,
): Json => {
  let jsonPointerObject = typeof jsonPointer === 'string' ? parseJsonPointerFromString(jsonPointer) : jsonPointer;

  const relativeJsonPointerObject =
    typeof relativeJsonPointer === 'string'
      ? parseRelativeJsonPointerFromString(relativeJsonPointer)
      : relativeJsonPointer;

  getValueAtJsonPointer(json, jsonPointerObject); // just to verify that JsonPointer references existing value

  jsonPointerObject = applyLevelsUp(jsonPointerObject, relativeJsonPointerObject);

  jsonPointerObject = applyArrayShift(json, jsonPointerObject, relativeJsonPointerObject);

  if (relativeJsonPointerObject.jsonPointer.uriFragmentIdentifierRepresentation) {
    return extractNameOrIndex(json, jsonPointerObject, relativeJsonPointerObject);
  } else {
    return getValueAtJsonPointer(json, {
      referenceTokens: jsonPointerObject.referenceTokens.concat(relativeJsonPointerObject.jsonPointer.referenceTokens),
      uriFragmentIdentifierRepresentation: jsonPointerObject.uriFragmentIdentifierRepresentation,
    });
  }
};
