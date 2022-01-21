import type { Json, JsonPointer } from '@fosfad/json-pointer';
import { createStringFromJsonPointer, getValueAtJsonPointer, parseJsonPointerFromString } from '@fosfad/json-pointer';
import type { RelativeJsonPointer } from './relativeJsonPointer';
import {
  convertIndexManipulationToInt,
  createStringFromRelativeJsonPointer,
  parseRelativeJsonPointerFromString,
} from './relativeJsonPointer';
import { valueExistsAtJsonPointer } from '@fosfad/json-pointer/dist/src/jsonPointerProcessor';

export class JsonPointerReferencesNonexistentValue extends Error {
  constructor(public readonly jsonPointer: JsonPointer) {
    super(`JSON Pointer ${createStringFromJsonPointer(jsonPointer)} references non-existent value.`);

    Object.setPrototypeOf(this, JsonPointerReferencesNonexistentValue.prototype);
  }
}

export class RelativeJsonPointerReferencesNonexistentValue extends Error {
  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, RelativeJsonPointerReferencesNonexistentValue.prototype);
  }
}

export class JsonDocumentOutOfBounds extends RelativeJsonPointerReferencesNonexistentValue {
  constructor(public readonly relativeJsonPointer: RelativeJsonPointer) {
    super(
      `Relative JSON Pointer ${createStringFromRelativeJsonPointer(
        relativeJsonPointer,
      )} references JSON document outside.`,
    );

    Object.setPrototypeOf(this, JsonDocumentOutOfBounds.prototype);
  }
}

export class IndexManipulationOnJsonDocumentRoot extends RelativeJsonPointerReferencesNonexistentValue {
  constructor(public readonly relativeJsonPointer: RelativeJsonPointer) {
    super(
      `Relative JSON Pointer ${createStringFromRelativeJsonPointer(
        relativeJsonPointer,
      )} performs index manipulation on JSON document root.`,
    );

    Object.setPrototypeOf(this, IndexManipulationOnJsonDocumentRoot.prototype);
  }
}

export class IndexManipulationNotOnArrayValue extends RelativeJsonPointerReferencesNonexistentValue {
  constructor(public readonly relativeJsonPointer: RelativeJsonPointer) {
    super(
      `Relative JSON Pointer ${createStringFromRelativeJsonPointer(
        relativeJsonPointer,
      )} performs index manipulation not on array.`,
    );

    Object.setPrototypeOf(this, IndexManipulationNotOnArrayValue.prototype);
  }
}

export class IndexManipulationOutOfBounds extends RelativeJsonPointerReferencesNonexistentValue {
  constructor(public readonly relativeJsonPointer: RelativeJsonPointer) {
    super(
      `Relative JSON Pointer ${createStringFromRelativeJsonPointer(
        relativeJsonPointer,
      )} index manipulation points outside array.`,
    );

    Object.setPrototypeOf(this, IndexManipulationOutOfBounds.prototype);
  }
}

export class ExtractNameOfJsonDocumentRoot extends RelativeJsonPointerReferencesNonexistentValue {
  constructor(public readonly relativeJsonPointer: RelativeJsonPointer) {
    super(
      `Relative JSON Pointer ${createStringFromRelativeJsonPointer(
        relativeJsonPointer,
      )} extracts name of JSON document root.`,
    );

    Object.setPrototypeOf(this, ExtractNameOfJsonDocumentRoot.prototype);
  }
}

const applyLevelsUp = (jsonPointer: JsonPointer, relativeJsonPointer: RelativeJsonPointer): JsonPointer => {
  const remainder = jsonPointer.referenceTokens.length - relativeJsonPointer.levelsUp;

  if (remainder < 0) {
    throw new JsonDocumentOutOfBounds(relativeJsonPointer);
  }

  return {
    referenceTokens: jsonPointer.referenceTokens.slice(0, remainder),
    uriFragmentIdentifierRepresentation: jsonPointer.uriFragmentIdentifierRepresentation,
  };
};

const applyIndexManipulation = (
  json: Json,
  jsonPointer: JsonPointer,
  relativeJsonPointer: RelativeJsonPointer,
): JsonPointer => {
  if (relativeJsonPointer.indexManipulation === undefined) {
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
    currentIndex + convertIndexManipulationToInt(relativeJsonPointer.indexManipulation) < 0 ||
    currentIndex + convertIndexManipulationToInt(relativeJsonPointer.indexManipulation) > array.length - 1
  ) {
    throw new IndexManipulationOutOfBounds(relativeJsonPointer);
  }

  return {
    referenceTokens: jsonPointerToArray.referenceTokens.concat(
      (currentIndex + convertIndexManipulationToInt(relativeJsonPointer.indexManipulation)).toString(10),
    ),
    uriFragmentIdentifierRepresentation: jsonPointerToArray.uriFragmentIdentifierRepresentation,
  };
};

const extractNameOrIndex = (
  json: Json,
  jsonPointer: JsonPointer,
  relativeJsonPointer: RelativeJsonPointer,
): number | string => {
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
};

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

  if (!valueExistsAtJsonPointer(json, jsonPointerObject)) {
    throw new JsonPointerReferencesNonexistentValue(jsonPointerObject);
  }

  jsonPointerObject = applyLevelsUp(jsonPointerObject, relativeJsonPointerObject);

  jsonPointerObject = applyIndexManipulation(json, jsonPointerObject, relativeJsonPointerObject);

  if (relativeJsonPointerObject.jsonPointer.uriFragmentIdentifierRepresentation) {
    return extractNameOrIndex(json, jsonPointerObject, relativeJsonPointerObject);
  } else {
    return getValueAtJsonPointer(json, {
      referenceTokens: jsonPointerObject.referenceTokens.concat(relativeJsonPointerObject.jsonPointer.referenceTokens),
      uriFragmentIdentifierRepresentation: jsonPointerObject.uriFragmentIdentifierRepresentation,
    });
  }
};
