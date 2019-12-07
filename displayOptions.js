import _ from 'lodash';
import { colorFunctions } from './colorFunctions';

export const displayOptions = {

  // Buildings on/off
  buildings: {
    parse: parseInt,
    values: [1, 0],
    apply: (scene, value) => {
      if (_.get(scene, 'layers.buildings')) {
        _.set(scene, 'layers.buildings.enabled', (value === 1));
      }
    }
  },

  // Feature label property
  label: {
    values: [],
    apply: (scene, value, { featureLabelPropStack }) => {
      let showLabels;
      if (featureLabelPropStack) {
        // custom JS tangram function to access nested properties efficiently
        _.set(scene, 'global.lookupFeatureLabelProp',
          `function(feature) {
              try {
                return feature${featureLabelPropStack.map(k => `['${k}']`).join('')};
              }
              catch(e) { return null; } // catches cases where some features lack nested property, or other errors
            }`);

        showLabels = true;
      }
      else {
        showLabels = false;
      }

      // show/hide labels
      _.set(scene, 'layers._xyz_dots.draw.points.text.visible', showLabels);
      _.set(scene, 'layers._xyz_dots.draw.donut_points.text.visible', showLabels);
      _.set(scene, 'layers._xyz_polygons.draw.text.visible', showLabels);
      _.set(scene, 'layers._xyz_lines.draw.text.visible', showLabels);
    }
  },

  // Feature colors
  colors: {
    values: ['xray', 'property', 'hash', 'range', 'rank'],

    apply: (scene, value, { featurePropStack, featurePropMinFilter, featurePropMaxFilter, featurePropPalette, featurePropPaletteFlip, featurePropValueCounts, featurePropHideOutliers, featurePropValue, colorHelpers }) => {
      _.set(scene, 'global.colorMode', value);
      _.set(scene, 'global.colorState', {
        featurePropStack, featurePropMinFilter, featurePropMaxFilter, featurePropPalette, featurePropPaletteFlip, featurePropValueCounts, featurePropHideOutliers, featurePropValue,
        colorHelpers // include color helper functions in Tangram global state
      });

      if (featurePropStack) {
        // custom JS tangram function to access nested properties efficiently
        _.set(scene, 'global.lookupFeatureProp',
          `function(feature) {
            try {
              return feature${featurePropStack.map(k => `['${k}']`).join('')};
            }
            catch(e) { return null; } // catches cases where some features lack nested property, or other errors
          }`);
      }

      // Use color mode color calc function if one exists, and a feature property is selected if required.
      // We need to wrap the global function in another function, because these scene settings may be applied
      // before the global being referenced has been created yet (e.g. these changes may be merged on top of
      // the scene with the global feature color functions). Wrapping them ensures they only need to be
      // created by the time the scene is built (once all merging is complete).
      let featureColorVal;
      if (colorFunctions[value] && colorFunctions[value].color &&
          (featurePropStack || !colorFunctions[value].useProperty)) {
        featureColorVal = 'featureColorDynamic';
      }
      else {
        featureColorVal = 'featureColorDefault';
      }

      _.set(scene, 'global.featureColorType', featureColorVal);
    }
  },

  // Point sizes
  points: {
    parse: parseInt,
    values: [0, 1, 2, 3, 4],
    apply: (scene, value, { featurePointSizePropStack, featurePointSizeRange }) => {
      let size;

      // ignore explicit point size setting when a feature property is selected
      if (featurePointSizePropStack) {
        // custom JS tangram function to access nested properties efficiently
        _.set(scene, 'global.lookupFeaturePointSizeProp',
          `function(feature) {
              try {
                return feature${featurePointSizePropStack.map(k => `['${k}']`).join('')};
              }
              catch(e) { return null; } // catches cases where some features lack nested property, or other errors
            }`);

        _.set(scene, 'global.featurePointSizeRange', featurePointSizeRange);

        if (featurePointSizeRange[0] != null && featurePointSizeRange[1] != null) {
          size = `function(){ return global.featurePointSizeDynamic(feature, global); }`;
        }
        else {
          // TODO: use rank or quantiles for non-numeric properties
          size = '6px'; // use fixed point size for non-numeric properties
        }
      }
      else if (value === 0) { // small
        size = '6px';
      }
      else if (value === 1) { // smaller
        size = '3px';
      }
      else if (value === 2) { // bigger
        size = '15px';
      }
    else if (value === 3) { // big
        size = '12px';
      }
      else if (value === 4) { // medium
        size = '9px';
      }

      _.set(scene, 'global.featurePointSize', size);
    }
  },

  // optional feature property to tie point sizes to
  pointSizeProp: {
    // feature property-driven point sizes are applied by the 'points' option above, but we need an entry
    // for it here so that it gets recognized as a display option during query string parameter on page load
  },

  // Line widths
  lines: {
    parse: parseInt,
    values: [0, 1, 2],
    apply: (scene, value) => {
      let width;

      if (value === 0) {
        width = '4px';
      }
      else if (value === 1) {
        width = '2px';
      }
      else if (value === 2) {
        width = '1px';
      }

      _.set(scene, 'layers._xyz_lines.draw.overlay_lines.width', width);
    }
  },

  // Outlines
  outlines: {
    parse: parseInt,
    values: [0, 1, 2, 3, 4, 5, 6],
    apply: (scene, value) => {
      let donutOutline = false;

      if (value === 0) { // no outline
        _.set(scene, 'layers._xyz_polygons._outlines.draw.overlay_lines.width', '0px');
        _.set(scene, 'layers._xyz_lines.draw.overlay_lines.outline.width', '0px');
        _.set(scene, 'layers._xyz_dots.draw.points.outline.width', '0px');
        _.set(scene, 'layers._xyz_dots.draw.donut_points.outline.width', '0px');
      }
      else if (value === 1) { // subtle grey polygons
        _.set(scene, 'layers._xyz_polygons._outlines.draw.overlay_lines.width', '1px'); // polygons have a default aqua outlin)e
        _.set(scene, 'layers._xyz_polygons._outlines.draw.overlay_lines.color', [.5,.5,.5,.5]);
        _.set(scene, 'layers._xyz_lines.draw.overlay_lines.outline.width', '1px');
        _.set(scene, 'layers._xyz_lines.draw.overlay_lines.outline.color', [.5,.5,.5,.5]);
        _.set(scene, 'layers._xyz_dots.draw.points.outline.width', '1px');
        _.set(scene, 'layers._xyz_dots.draw.donut_points.outline.width', '1px');
        _.set(scene, 'layers._xyz_dots.draw.points.outline.color', [.5,.5,.5,.5]);
      }
      else if (value === 2) { // white outlines
        _.set(scene, 'layers._xyz_polygons._outlines.draw.overlay_lines.width', '1px');
        _.set(scene, 'layers._xyz_polygons._outlines.draw.overlay_lines.color', [1,1,1,0.75]);
        _.set(scene, 'layers._xyz_lines.draw.overlay_lines.outline.width', '1px');
        _.set(scene, 'layers._xyz_lines.draw.overlay_lines.outline.color', [1,1,1,.75]);
        _.set(scene, 'layers._xyz_dots.draw.points.outline.width', '1px');
        _.set(scene, 'layers._xyz_dots.draw.donut_points.outline.width', '1px');
        _.set(scene, 'layers._xyz_dots.draw.points.outline.color', [1,1,1,0.75]);
      }
      else if (value === 3) { // black outlines
        _.set(scene, 'layers._xyz_polygons._outlines.draw.overlay_lines.width', '1px');
        _.set(scene, 'layers._xyz_polygons._outlines.draw.overlay_lines.color', [0,0,0,0.75]);
        _.set(scene, 'layers._xyz_lines.draw.overlay_lines.outline.width', '1px');
        _.set(scene, 'layers._xyz_lines.draw.overlay_lines.outline.color', [0,0,0,0.75]);
        _.set(scene, 'layers._xyz_dots.draw.points.outline.width', '1px');
        _.set(scene, 'layers._xyz_dots.draw.donut_points.outline.width', '1px');
        _.set(scene, 'layers._xyz_dots.draw.points.outline.color', [0,0,0,0.75]);
      }
      else if (value === 4) { // donut outlines
        _.set(scene, 'layers._xyz_polygons._outlines.draw.overlay_lines.width', '2px');
        _.set(scene, 'layers._xyz_lines.draw.overlay_lines.outline.width', '2px');
        _.set(scene, 'layers._xyz_dots.draw.points.outline.width', '2px');
        _.set(scene, 'layers._xyz_dots.draw.donut_points.outline.width', '2px');
        donutOutline = true;
      }
      else if (value === 5) { // donut outlines
        _.set(scene, 'layers._xyz_polygons._outlines.draw.overlay_lines.width', '1px');
        _.set(scene, 'layers._xyz_lines.draw.overlay_lines.outline.width', '1px');
        _.set(scene, 'layers._xyz_dots.draw.points.outline.width', '1px');
        _.set(scene, 'layers._xyz_dots.draw.donut_points.outline.width', '1px');
        donutOutline = true;
      }
       else if (value === 6) { // donut outlines
        _.set(scene, 'layers._xyz_polygons._outlines.draw.overlay_lines.width', '.5px');
        _.set(scene, 'layers._xyz_lines.draw.overlay_lines.outline.width', '.5px');
        _.set(scene, 'layers._xyz_dots.draw.points.outline.width', '.5px');
        _.set(scene, 'layers._xyz_dots.draw.donut_points.outline.width', '.5px');
        donutOutline = true; 
      }     

      _.set(scene, 'layers._xyz_dots.draw.points.visible', !donutOutline);
      _.set(scene, 'layers._xyz_dots.draw.donut_points.visible', donutOutline);
    }
  },

  // places on/off
  places: {
    parse: parseInt,
    values: [1, 0],
    apply: (scene, value) => {
      if (_.get(scene, 'layers.places')) {
        _.set(scene, 'layers.places.enabled', (value === 1));
      }
    }
  },

  roads: {
    parse: parseInt,
    values: [1, 0, 2], // 1 = on, 0 = off, 2 = just road labels, no lines
    apply: (scene, value) => {
      if (value === 0) {
        if (_.get(scene, 'layers.roads')) {
          _.set(scene, 'layers.roads.enabled', false);
        }

        if (_.get(scene, 'layers.pois')) {
          _.set(scene, 'layers.pois.enabled', (value === 1)); // to handle road exit numbers
        }
      }
      else if (value === 1) {
        if (_.get(scene, 'layers.roads')) {
          _.set(scene, 'layers.roads.enabled', true);
          _.set(scene, 'layers.roads.draw.lines.visible', true);
        }
      }
      else if (value === 2) {
        if (_.get(scene, 'layers.roads')) {
          _.set(scene, 'layers.roads.enabled', 'true');
          _.set(scene, 'layers.roads.draw.lines.visible', false); // just labels, no geometry
        }

        if (_.get(scene, 'layers.pois')) {
          _.set(scene, 'layers.pois.enabled', (value === 1)); // to handle road exit numbers
        }
      }
    }
  },

  // toggle hexbins
  hexbins: {
    parse: parseInt,
    values: [0, 1, 2], // 0 = source, 1 = hexbins, 2 = centroids
    // we're using displayOptions for storing and parsing values, but they get applied when creating
    // the Tangram data source in index.js, so there's no `apply()` function here
  },

  // Water under/over
  water: {
    parse: parseInt,
    values: [0, 1],
    apply: (scene, value) => {
      if (value === 0) {
        _.set(scene, 'layers._xyz_polygons.draw.inlay_polygons.order', 200);
      }
      else if (value === 1) {
        _.set(scene, 'layers._xyz_polygons.draw.inlay_polygons.order', 300);
      }
    }
  }
}
