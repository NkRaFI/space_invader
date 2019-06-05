
export const colorFunctions = {
  xray: {
    useProperty: false,
    usePalette: false,
    // no color function is defined, default one will be used
  },

  // color by hash of entire
  hash: {
    useProperty: false,
    usePalette: false,
    color: colorHash
  },

  // color by hash of specific property
  property: {
    useProperty: true,
    usePalette: false,
    color: colorHash,
  },

  // color by value of specific property, in provided min/max range
  range: {
    useProperty: true,
    usePalette: true,
    limitRange: true,
    color: function (value, colorState) {
      var palette = colorState.featurePropPalette;
      var min = colorState.featurePropMinFilter;
      var max = colorState.featurePropMaxFilter;
      var delta = max - min;
      var number = colorState.colorHelpers.parseNumber(value);

      if (min == null || max == null || typeof number !== 'number' || isNaN(number)) {
        return 'rgba(128, 128, 128, 0.5)'; // handle null/undefined values
      }

      var ratio = (delta === 0 ? 1 : Math.max(Math.min(1 - ((max - number) / delta), 1), 0));
      return colorState.colorHelpers.getPaletteColor(palette, ratio, 0.75, colorState.featurePropPaletteFlip);
    }
  },

  // color by value of specific property, based on frequency of values
  rank: {
    useProperty: true,
    usePalette: true,
    color: function (value, colorState) {
      var palette = colorState.featurePropPalette;
      var counts = (colorState.featurePropValueCounts || []).filter(c => c[0] != null); // exclude nulls
      var rank = counts.findIndex(c => c[0] === value);

      if (rank === -1) {
        return 'rgba(128, 128, 128, 0.5)'; // handle null/undefined values
      }

      var ratio = (counts.length <= 1 ? 1 : Math.max(Math.min(1 - (rank / (counts.length-1)), 1), 0));
      return colorState.colorHelpers.getPaletteColor(palette, ratio, 0.75, colorState.featurePropPaletteFlip);
    }
  }

};

// These functions are included in the Tangram global scene state, and therefore can be
// called by the color functions above (references to any non-global functions get lost when the
// scene is serialized and sent to the worker -- the functions must be self-contained and only
// reference Tangram globals, feature properties, and other predefined variables).
export const colorHelpers = {
  parseNumber, // referenced here to provide access to Tangram

  getPaletteColor: function getPaletteColor (palette, value, alpha = 1, flip = false) {
    try {
      value = Math.max(Math.min(value, 1), 0); // clamp to 0-1

      if (flip) {
        value = 1 - value; // optionally flip palette
      }

      // function-based palette
      if (typeof palette === 'function') {
        return palette(value, alpha);
      }
      // array-based palette
      else {
        const index = Math.round(value * (palette.length-1));
        const color = palette[index];
        return `rgba(${color.map(c => c * 255).join(', ')}, ${alpha})`;
      }
    }
    catch (e) {
      return 'rgba(128, 128, 128, 0.5)';
    }
  }
};

// Compute a color by hashing a value
function colorHash (value) {
  if (typeof value !== 'string') {
    value = (value === undefined ? 'undefined' : JSON.stringify(value));
  }

  if (['null', 'undefined'].indexOf(value) > -1) {
    return 'rgba(128, 128, 128, 0.5)'; // handle null/undefined values
  }

  let hash = 0, i, chr;
  if (value === 0) { hash = 0 };
  for (i = 0; i < value.length; i++) {
    chr = value.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  var color = 'hsla(' + hash + ', 100%, 50%, 0.75)';
  return color;
}

// More robust number parsing, try to get a floating point or integer value from a string
export function parseNumber (value) {
  if (value == null || typeof value === 'number') { // don't bother parsing these
    return value;
  }

  const m = value.match(/[-+]?([0-9]+,?)*\.?[0-9]+/); // get floating point or integer via regex
  const num = parseFloat(m && m[0].replace(/,/g, '')); // strip commas, e.g. '1,500' => '1500' (NB only works for US-style numbers)
  if (typeof num === 'number' && !isNaN(num)) {
    return num;
  }
}
