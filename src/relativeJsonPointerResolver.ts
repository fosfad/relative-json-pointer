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

export const getValueAtRelativeJsonPointer = (
  json: Json,
  jsonPointer: JsonPointer | string,
  relativeJsonPointer: RelativeJsonPointer | string,
): Json => {
  if (typeof jsonPointer === 'string') {
    jsonPointer = parseJsonPointerFromString(jsonPointer);
  }

  if (typeof relativeJsonPointer === 'string') {
    relativeJsonPointer = parseRelativeJsonPointerFromString(relativeJsonPointer);
  }

  getValueAtJsonPointer(json, jsonPointer); // just to verify that JsonPointer references existing value

  const remainder = jsonPointer.referenceTokens.length - relativeJsonPointer.levelsUp;

  if (remainder < 0) {
    throw new JsonDocumentOutOfBounds(relativeJsonPointer);
  }

  if (relativeJsonPointer.indexManipulation !== null) {
    const currentIndexString = jsonPointer.referenceTokens.slice(0, remainder).pop();

    if (currentIndexString === undefined) {
      throw Error('Logic error. Smth went wrong.');
    }

    const currentIndex = parseInt(currentIndexString, 10);

    jsonPointer = {
      referenceTokens: jsonPointer.referenceTokens.slice(0, remainder - 1),
      uriFragmentIdentifierRepresentation: jsonPointer.uriFragmentIdentifierRepresentation,
    };

    const array = getValueAtJsonPointer(json, jsonPointer);

    if (!Array.isArray(array)) {
      throw new IndexManipulationNotOnArrayValue(relativeJsonPointer);
    }

    if (relativeJsonPointer.indexManipulation !== null) {
      if (
        currentIndex + relativeJsonPointer.indexManipulation < 0 ||
        currentIndex + relativeJsonPointer.indexManipulation > array.length - 1
      ) {
        throw new IndexManipulationOutOfBounds(relativeJsonPointer);
      }
    }

    jsonPointer = {
      referenceTokens: [
        ...jsonPointer.referenceTokens,
        (currentIndex + relativeJsonPointer.indexManipulation).toString(10),
      ],
      uriFragmentIdentifierRepresentation: jsonPointer.uriFragmentIdentifierRepresentation,
    };
  } else {
    jsonPointer = {
      referenceTokens: jsonPointer.referenceTokens.slice(0, remainder),
      uriFragmentIdentifierRepresentation: jsonPointer.uriFragmentIdentifierRepresentation,
    };
  }

  if (relativeJsonPointer.jsonPointer.uriFragmentIdentifierRepresentation) {
    const jsonElementNameString = jsonPointer.referenceTokens.pop();

    if (jsonElementNameString === undefined) {
      throw new ExtractNameOfJsonDocumentRoot(relativeJsonPointer);
    }

    if (Array.isArray(getValueAtJsonPointer(json, jsonPointer))) {
      return parseInt(jsonElementNameString, 10);
    } else {
      return jsonElementNameString;
    }
  } else {
    return getValueAtJsonPointer(getValueAtJsonPointer(json, jsonPointer), relativeJsonPointer.jsonPointer);
  }
};
