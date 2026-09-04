/* Generated browser-local evaluator. Frozen BAC engine a46456f028cd3dd1d386111b1faab890a26ae5e9; Inspector presentation 07325dd1304cc3fe1acd86ce50596161581a1cdb; schema validator precompiled at build time. */
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // .tmp/bac-engine/node_modules/ajv/dist/runtime/ucs2length.js
  var require_ucs2length = __commonJS({
    ".tmp/bac-engine/node_modules/ajv/dist/runtime/ucs2length.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      function ucs2length(str) {
        const len = str.length;
        let length = 0;
        let pos = 0;
        let value;
        while (pos < len) {
          length++;
          value = str.charCodeAt(pos++);
          if (value >= 55296 && value <= 56319 && pos < len) {
            value = str.charCodeAt(pos);
            if ((value & 64512) === 56320)
              pos++;
          }
        }
        return length;
      }
      exports.default = ucs2length;
      ucs2length.code = 'require("ajv/dist/runtime/ucs2length").default';
    }
  });

  // .tmp/bac-engine/node_modules/fast-deep-equal/index.js
  var require_fast_deep_equal = __commonJS({
    ".tmp/bac-engine/node_modules/fast-deep-equal/index.js"(exports, module) {
      "use strict";
      module.exports = function equal(a, b) {
        if (a === b) return true;
        if (a && b && typeof a == "object" && typeof b == "object") {
          if (a.constructor !== b.constructor) return false;
          var length, i, keys;
          if (Array.isArray(a)) {
            length = a.length;
            if (length != b.length) return false;
            for (i = length; i-- !== 0; )
              if (!equal(a[i], b[i])) return false;
            return true;
          }
          if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
          if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
          if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();
          keys = Object.keys(a);
          length = keys.length;
          if (length !== Object.keys(b).length) return false;
          for (i = length; i-- !== 0; )
            if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
          for (i = length; i-- !== 0; ) {
            var key = keys[i];
            if (!equal(a[key], b[key])) return false;
          }
          return true;
        }
        return a !== a && b !== b;
      };
    }
  });

  // .tmp/bac-engine/node_modules/ajv/dist/runtime/equal.js
  var require_equal = __commonJS({
    ".tmp/bac-engine/node_modules/ajv/dist/runtime/equal.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var equal = require_fast_deep_equal();
      equal.code = 'require("ajv/dist/runtime/equal").default';
      exports.default = equal;
    }
  });

  // .tmp/bac-engine/src/validate-schema.browser.mjs
  var validate_schema_browser_default = validate20;
  var schema32 = { "type": "object", "additionalProperties": false, "required": ["id", "new_business_authority", "quiesced_at_ms", "quiescence_evidence_ref"], "properties": { "id": { "$ref": "#/$defs/nonEmptyString" }, "new_business_authority": { "enum": ["BLOCKED", "ACTIVE", "UNKNOWN"] }, "quiesced_at_ms": { "$ref": "#/$defs/nonNegativeSafeInteger" }, "quiescence_evidence_ref": { "$ref": "#/$defs/nonEmptyString" } } };
  var func1 = require_ucs2length().default;
  function validate21(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
    let vErrors = null;
    let errors = 0;
    const evaluated0 = validate21.evaluated;
    if (evaluated0.dynamicProps) {
      evaluated0.props = void 0;
    }
    if (evaluated0.dynamicItems) {
      evaluated0.items = void 0;
    }
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.id === void 0) {
        const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
        if (vErrors === null) {
          vErrors = [err0];
        } else {
          vErrors.push(err0);
        }
        errors++;
      }
      if (data.new_business_authority === void 0) {
        const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "new_business_authority" }, message: "must have required property 'new_business_authority'" };
        if (vErrors === null) {
          vErrors = [err1];
        } else {
          vErrors.push(err1);
        }
        errors++;
      }
      if (data.quiesced_at_ms === void 0) {
        const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "quiesced_at_ms" }, message: "must have required property 'quiesced_at_ms'" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
      if (data.quiescence_evidence_ref === void 0) {
        const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "quiescence_evidence_ref" }, message: "must have required property 'quiescence_evidence_ref'" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
      for (const key0 in data) {
        if (!(key0 === "id" || key0 === "new_business_authority" || key0 === "quiesced_at_ms" || key0 === "quiescence_evidence_ref")) {
          const err4 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
      }
      if (data.id !== void 0) {
        let data0 = data.id;
        if (typeof data0 === "string") {
          if (func1(data0) < 1) {
            const err5 = { instancePath: instancePath + "/id", schemaPath: "#/$defs/nonEmptyString/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
            if (vErrors === null) {
              vErrors = [err5];
            } else {
              vErrors.push(err5);
            }
            errors++;
          }
        } else {
          const err6 = { instancePath: instancePath + "/id", schemaPath: "#/$defs/nonEmptyString/type", keyword: "type", params: { type: "string" }, message: "must be string" };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
      }
      if (data.new_business_authority !== void 0) {
        let data1 = data.new_business_authority;
        if (!(data1 === "BLOCKED" || data1 === "ACTIVE" || data1 === "UNKNOWN")) {
          const err7 = { instancePath: instancePath + "/new_business_authority", schemaPath: "#/properties/new_business_authority/enum", keyword: "enum", params: { allowedValues: schema32.properties.new_business_authority.enum }, message: "must be equal to one of the allowed values" };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
      }
      if (data.quiesced_at_ms !== void 0) {
        let data2 = data.quiesced_at_ms;
        if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)) && isFinite(data2))) {
          const err8 = { instancePath: instancePath + "/quiesced_at_ms", schemaPath: "#/$defs/nonNegativeSafeInteger/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
        if (typeof data2 == "number" && isFinite(data2)) {
          if (data2 > 9007199254740991 || isNaN(data2)) {
            const err9 = { instancePath: instancePath + "/quiesced_at_ms", schemaPath: "#/$defs/nonNegativeSafeInteger/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" };
            if (vErrors === null) {
              vErrors = [err9];
            } else {
              vErrors.push(err9);
            }
            errors++;
          }
          if (data2 < 0 || isNaN(data2)) {
            const err10 = { instancePath: instancePath + "/quiesced_at_ms", schemaPath: "#/$defs/nonNegativeSafeInteger/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
            if (vErrors === null) {
              vErrors = [err10];
            } else {
              vErrors.push(err10);
            }
            errors++;
          }
        }
      }
      if (data.quiescence_evidence_ref !== void 0) {
        let data3 = data.quiescence_evidence_ref;
        if (typeof data3 === "string") {
          if (func1(data3) < 1) {
            const err11 = { instancePath: instancePath + "/quiescence_evidence_ref", schemaPath: "#/$defs/nonEmptyString/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
            if (vErrors === null) {
              vErrors = [err11];
            } else {
              vErrors.push(err11);
            }
            errors++;
          }
        } else {
          const err12 = { instancePath: instancePath + "/quiescence_evidence_ref", schemaPath: "#/$defs/nonEmptyString/type", keyword: "type", params: { type: "string" }, message: "must be string" };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
      }
    } else {
      const err13 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
      if (vErrors === null) {
        vErrors = [err13];
      } else {
        vErrors.push(err13);
      }
      errors++;
    }
    validate21.errors = vErrors;
    return errors === 0;
  }
  validate21.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
  var schema36 = { "type": "object", "additionalProperties": false, "required": ["domain", "status", "source_ids", "evidence_ref"], "properties": { "domain": { "$ref": "#/$defs/domain" }, "status": { "enum": ["COVERED", "NOT_APPLICABLE"] }, "source_ids": { "type": "array", "items": { "$ref": "#/$defs/nonEmptyString" }, "uniqueItems": true }, "evidence_ref": { "oneOf": [{ "$ref": "#/$defs/nonEmptyString" }, { "type": "null" }] } }, "allOf": [{ "if": { "properties": { "status": { "const": "COVERED" } }, "required": ["status"] }, "then": { "properties": { "source_ids": { "type": "array", "minItems": 1 } } } }, { "if": { "properties": { "status": { "const": "NOT_APPLICABLE" } }, "required": ["status"] }, "then": { "properties": { "source_ids": { "type": "array", "maxItems": 0 }, "evidence_ref": { "$ref": "#/$defs/nonEmptyString" } } } }] };
  var schema38 = { "enum": ["AUTHORITY", "EXECUTION", "COMMITMENT", "OPERATIONAL_STATE"] };
  var func0 = require_equal().default;
  function validate23(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
    let vErrors = null;
    let errors = 0;
    const evaluated0 = validate23.evaluated;
    if (evaluated0.dynamicProps) {
      evaluated0.props = void 0;
    }
    if (evaluated0.dynamicItems) {
      evaluated0.items = void 0;
    }
    const _errs2 = errors;
    let valid1 = true;
    const _errs3 = errors;
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.status === void 0 && (missing0 = "status")) {
        const err0 = {};
        if (vErrors === null) {
          vErrors = [err0];
        } else {
          vErrors.push(err0);
        }
        errors++;
      } else {
        if (data.status !== void 0) {
          if ("COVERED" !== data.status) {
            const err1 = {};
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
        }
      }
    }
    var _valid0 = _errs3 === errors;
    errors = _errs2;
    if (vErrors !== null) {
      if (_errs2) {
        vErrors.length = _errs2;
      } else {
        vErrors = null;
      }
    }
    if (_valid0) {
      const _errs5 = errors;
      if (data && typeof data == "object" && !Array.isArray(data)) {
        if (data.source_ids !== void 0) {
          let data1 = data.source_ids;
          if (Array.isArray(data1)) {
            if (data1.length < 1) {
              const err2 = { instancePath: instancePath + "/source_ids", schemaPath: "#/allOf/0/then/properties/source_ids/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
              if (vErrors === null) {
                vErrors = [err2];
              } else {
                vErrors.push(err2);
              }
              errors++;
            }
          } else {
            const err3 = { instancePath: instancePath + "/source_ids", schemaPath: "#/allOf/0/then/properties/source_ids/type", keyword: "type", params: { type: "array" }, message: "must be array" };
            if (vErrors === null) {
              vErrors = [err3];
            } else {
              vErrors.push(err3);
            }
            errors++;
          }
        }
      }
      var _valid0 = _errs5 === errors;
      valid1 = _valid0;
      if (valid1) {
        var props0 = {};
        props0.source_ids = true;
        props0.status = true;
      }
    }
    if (!valid1) {
      const err4 = { instancePath, schemaPath: "#/allOf/0/if", keyword: "if", params: { failingKeyword: "then" }, message: 'must match "then" schema' };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    const _errs9 = errors;
    let valid4 = true;
    const _errs10 = errors;
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing1;
      if (data.status === void 0 && (missing1 = "status")) {
        const err5 = {};
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      } else {
        if (data.status !== void 0) {
          if ("NOT_APPLICABLE" !== data.status) {
            const err6 = {};
            if (vErrors === null) {
              vErrors = [err6];
            } else {
              vErrors.push(err6);
            }
            errors++;
          }
        }
      }
    }
    var _valid1 = _errs10 === errors;
    errors = _errs9;
    if (vErrors !== null) {
      if (_errs9) {
        vErrors.length = _errs9;
      } else {
        vErrors = null;
      }
    }
    if (_valid1) {
      const _errs12 = errors;
      if (data && typeof data == "object" && !Array.isArray(data)) {
        if (data.source_ids !== void 0) {
          let data3 = data.source_ids;
          if (Array.isArray(data3)) {
            if (data3.length > 0) {
              const err7 = { instancePath: instancePath + "/source_ids", schemaPath: "#/allOf/1/then/properties/source_ids/maxItems", keyword: "maxItems", params: { limit: 0 }, message: "must NOT have more than 0 items" };
              if (vErrors === null) {
                vErrors = [err7];
              } else {
                vErrors.push(err7);
              }
              errors++;
            }
          } else {
            const err8 = { instancePath: instancePath + "/source_ids", schemaPath: "#/allOf/1/then/properties/source_ids/type", keyword: "type", params: { type: "array" }, message: "must be array" };
            if (vErrors === null) {
              vErrors = [err8];
            } else {
              vErrors.push(err8);
            }
            errors++;
          }
        }
        if (data.evidence_ref !== void 0) {
          let data4 = data.evidence_ref;
          if (typeof data4 === "string") {
            if (func1(data4) < 1) {
              const err9 = { instancePath: instancePath + "/evidence_ref", schemaPath: "#/$defs/nonEmptyString/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
              if (vErrors === null) {
                vErrors = [err9];
              } else {
                vErrors.push(err9);
              }
              errors++;
            }
          } else {
            const err10 = { instancePath: instancePath + "/evidence_ref", schemaPath: "#/$defs/nonEmptyString/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err10];
            } else {
              vErrors.push(err10);
            }
            errors++;
          }
        }
      }
      var _valid1 = _errs12 === errors;
      valid4 = _valid1;
      if (valid4) {
        var props1 = {};
        props1.source_ids = true;
        props1.evidence_ref = true;
        props1.status = true;
      }
    }
    if (!valid4) {
      const err11 = { instancePath, schemaPath: "#/allOf/1/if", keyword: "if", params: { failingKeyword: "then" }, message: 'must match "then" schema' };
      if (vErrors === null) {
        vErrors = [err11];
      } else {
        vErrors.push(err11);
      }
      errors++;
    }
    if (props0 !== true && props1 !== void 0) {
      if (props1 === true) {
        props0 = true;
      } else {
        props0 = props0 || {};
        Object.assign(props0, props1);
      }
    }
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.domain === void 0) {
        const err12 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "domain" }, message: "must have required property 'domain'" };
        if (vErrors === null) {
          vErrors = [err12];
        } else {
          vErrors.push(err12);
        }
        errors++;
      }
      if (data.status === void 0) {
        const err13 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "status" }, message: "must have required property 'status'" };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
      if (data.source_ids === void 0) {
        const err14 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "source_ids" }, message: "must have required property 'source_ids'" };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
      if (data.evidence_ref === void 0) {
        const err15 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "evidence_ref" }, message: "must have required property 'evidence_ref'" };
        if (vErrors === null) {
          vErrors = [err15];
        } else {
          vErrors.push(err15);
        }
        errors++;
      }
      for (const key0 in data) {
        if (!(key0 === "domain" || key0 === "status" || key0 === "source_ids" || key0 === "evidence_ref")) {
          const err16 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
          if (vErrors === null) {
            vErrors = [err16];
          } else {
            vErrors.push(err16);
          }
          errors++;
        }
      }
      if (data.domain !== void 0) {
        let data5 = data.domain;
        if (!(data5 === "AUTHORITY" || data5 === "EXECUTION" || data5 === "COMMITMENT" || data5 === "OPERATIONAL_STATE")) {
          const err17 = { instancePath: instancePath + "/domain", schemaPath: "#/$defs/domain/enum", keyword: "enum", params: { allowedValues: schema38.enum }, message: "must be equal to one of the allowed values" };
          if (vErrors === null) {
            vErrors = [err17];
          } else {
            vErrors.push(err17);
          }
          errors++;
        }
      }
      if (data.status !== void 0) {
        let data6 = data.status;
        if (!(data6 === "COVERED" || data6 === "NOT_APPLICABLE")) {
          const err18 = { instancePath: instancePath + "/status", schemaPath: "#/properties/status/enum", keyword: "enum", params: { allowedValues: schema36.properties.status.enum }, message: "must be equal to one of the allowed values" };
          if (vErrors === null) {
            vErrors = [err18];
          } else {
            vErrors.push(err18);
          }
          errors++;
        }
      }
      if (data.source_ids !== void 0) {
        let data7 = data.source_ids;
        if (Array.isArray(data7)) {
          const len0 = data7.length;
          for (let i0 = 0; i0 < len0; i0++) {
            let data8 = data7[i0];
            if (typeof data8 === "string") {
              if (func1(data8) < 1) {
                const err19 = { instancePath: instancePath + "/source_ids/" + i0, schemaPath: "#/$defs/nonEmptyString/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                if (vErrors === null) {
                  vErrors = [err19];
                } else {
                  vErrors.push(err19);
                }
                errors++;
              }
            } else {
              const err20 = { instancePath: instancePath + "/source_ids/" + i0, schemaPath: "#/$defs/nonEmptyString/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err20];
              } else {
                vErrors.push(err20);
              }
              errors++;
            }
          }
          let i1 = data7.length;
          let j0;
          if (i1 > 1) {
            outer0: for (; i1--; ) {
              for (j0 = i1; j0--; ) {
                if (func0(data7[i1], data7[j0])) {
                  const err21 = { instancePath: instancePath + "/source_ids", schemaPath: "#/properties/source_ids/uniqueItems", keyword: "uniqueItems", params: { i: i1, j: j0 }, message: "must NOT have duplicate items (items ## " + j0 + " and " + i1 + " are identical)" };
                  if (vErrors === null) {
                    vErrors = [err21];
                  } else {
                    vErrors.push(err21);
                  }
                  errors++;
                  break outer0;
                }
              }
            }
          }
        } else {
          const err22 = { instancePath: instancePath + "/source_ids", schemaPath: "#/properties/source_ids/type", keyword: "type", params: { type: "array" }, message: "must be array" };
          if (vErrors === null) {
            vErrors = [err22];
          } else {
            vErrors.push(err22);
          }
          errors++;
        }
      }
      if (data.evidence_ref !== void 0) {
        let data9 = data.evidence_ref;
        const _errs28 = errors;
        let valid14 = false;
        let passing0 = null;
        const _errs29 = errors;
        if (typeof data9 === "string") {
          if (func1(data9) < 1) {
            const err23 = { instancePath: instancePath + "/evidence_ref", schemaPath: "#/$defs/nonEmptyString/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
            if (vErrors === null) {
              vErrors = [err23];
            } else {
              vErrors.push(err23);
            }
            errors++;
          }
        } else {
          const err24 = { instancePath: instancePath + "/evidence_ref", schemaPath: "#/$defs/nonEmptyString/type", keyword: "type", params: { type: "string" }, message: "must be string" };
          if (vErrors === null) {
            vErrors = [err24];
          } else {
            vErrors.push(err24);
          }
          errors++;
        }
        var _valid2 = _errs29 === errors;
        if (_valid2) {
          valid14 = true;
          passing0 = 0;
        }
        const _errs32 = errors;
        if (data9 !== null) {
          const err25 = { instancePath: instancePath + "/evidence_ref", schemaPath: "#/properties/evidence_ref/oneOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
          if (vErrors === null) {
            vErrors = [err25];
          } else {
            vErrors.push(err25);
          }
          errors++;
        }
        var _valid2 = _errs32 === errors;
        if (_valid2 && valid14) {
          valid14 = false;
          passing0 = [passing0, 1];
        } else {
          if (_valid2) {
            valid14 = true;
            passing0 = 1;
          }
        }
        if (!valid14) {
          const err26 = { instancePath: instancePath + "/evidence_ref", schemaPath: "#/properties/evidence_ref/oneOf", keyword: "oneOf", params: { passingSchemas: passing0 }, message: "must match exactly one schema in oneOf" };
          if (vErrors === null) {
            vErrors = [err26];
          } else {
            vErrors.push(err26);
          }
          errors++;
        } else {
          errors = _errs28;
          if (vErrors !== null) {
            if (_errs28) {
              vErrors.length = _errs28;
            } else {
              vErrors = null;
            }
          }
        }
      }
    } else {
      const err27 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
      if (vErrors === null) {
        vErrors = [err27];
      } else {
        vErrors.push(err27);
      }
      errors++;
    }
    validate23.errors = vErrors;
    return errors === 0;
  }
  validate23.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
  function validate25(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
    let vErrors = null;
    let errors = 0;
    const evaluated0 = validate25.evaluated;
    if (evaluated0.dynamicProps) {
      evaluated0.props = void 0;
    }
    if (evaluated0.dynamicItems) {
      evaluated0.items = void 0;
    }
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.id === void 0) {
        const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
        if (vErrors === null) {
          vErrors = [err0];
        } else {
          vErrors.push(err0);
        }
        errors++;
      }
      if (data.domains === void 0) {
        const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "domains" }, message: "must have required property 'domains'" };
        if (vErrors === null) {
          vErrors = [err1];
        } else {
          vErrors.push(err1);
        }
        errors++;
      }
      if (data.stability_contract === void 0) {
        const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "stability_contract" }, message: "must have required property 'stability_contract'" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
      for (const key0 in data) {
        if (!(key0 === "id" || key0 === "domains" || key0 === "stability_contract")) {
          const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
      }
      if (data.id !== void 0) {
        let data0 = data.id;
        if (typeof data0 === "string") {
          if (func1(data0) < 1) {
            const err4 = { instancePath: instancePath + "/id", schemaPath: "#/$defs/nonEmptyString/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        } else {
          const err5 = { instancePath: instancePath + "/id", schemaPath: "#/$defs/nonEmptyString/type", keyword: "type", params: { type: "string" }, message: "must be string" };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      }
      if (data.domains !== void 0) {
        let data1 = data.domains;
        if (Array.isArray(data1)) {
          if (data1.length < 1) {
            const err6 = { instancePath: instancePath + "/domains", schemaPath: "#/properties/domains/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
            if (vErrors === null) {
              vErrors = [err6];
            } else {
              vErrors.push(err6);
            }
            errors++;
          }
          const len0 = data1.length;
          for (let i0 = 0; i0 < len0; i0++) {
            let data2 = data1[i0];
            if (!(data2 === "AUTHORITY" || data2 === "EXECUTION" || data2 === "COMMITMENT" || data2 === "OPERATIONAL_STATE")) {
              const err7 = { instancePath: instancePath + "/domains/" + i0, schemaPath: "#/$defs/domain/enum", keyword: "enum", params: { allowedValues: schema38.enum }, message: "must be equal to one of the allowed values" };
              if (vErrors === null) {
                vErrors = [err7];
              } else {
                vErrors.push(err7);
              }
              errors++;
            }
          }
          let i1 = data1.length;
          let j0;
          if (i1 > 1) {
            outer0: for (; i1--; ) {
              for (j0 = i1; j0--; ) {
                if (func0(data1[i1], data1[j0])) {
                  const err8 = { instancePath: instancePath + "/domains", schemaPath: "#/properties/domains/uniqueItems", keyword: "uniqueItems", params: { i: i1, j: j0 }, message: "must NOT have duplicate items (items ## " + j0 + " and " + i1 + " are identical)" };
                  if (vErrors === null) {
                    vErrors = [err8];
                  } else {
                    vErrors.push(err8);
                  }
                  errors++;
                  break outer0;
                }
              }
            }
          }
        } else {
          const err9 = { instancePath: instancePath + "/domains", schemaPath: "#/properties/domains/type", keyword: "type", params: { type: "array" }, message: "must be array" };
          if (vErrors === null) {
            vErrors = [err9];
          } else {
            vErrors.push(err9);
          }
          errors++;
        }
      }
      if (data.stability_contract !== void 0) {
        let data3 = data.stability_contract;
        const _errs10 = errors;
        let valid6 = false;
        let passing0 = null;
        const _errs11 = errors;
        if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
          if (data3.type === void 0) {
            const err10 = { instancePath: instancePath + "/stability_contract", schemaPath: "#/properties/stability_contract/oneOf/0/required", keyword: "required", params: { missingProperty: "type" }, message: "must have required property 'type'" };
            if (vErrors === null) {
              vErrors = [err10];
            } else {
              vErrors.push(err10);
            }
            errors++;
          }
          for (const key1 in data3) {
            if (!(key1 === "type")) {
              const err11 = { instancePath: instancePath + "/stability_contract", schemaPath: "#/properties/stability_contract/oneOf/0/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
              if (vErrors === null) {
                vErrors = [err11];
              } else {
                vErrors.push(err11);
              }
              errors++;
            }
          }
          if (data3.type !== void 0) {
            if ("MONOTONIC_BARRIER" !== data3.type) {
              const err12 = { instancePath: instancePath + "/stability_contract/type", schemaPath: "#/properties/stability_contract/oneOf/0/properties/type/const", keyword: "const", params: { allowedValue: "MONOTONIC_BARRIER" }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err12];
              } else {
                vErrors.push(err12);
              }
              errors++;
            }
          }
        } else {
          const err13 = { instancePath: instancePath + "/stability_contract", schemaPath: "#/properties/stability_contract/oneOf/0/type", keyword: "type", params: { type: "object" }, message: "must be object" };
          if (vErrors === null) {
            vErrors = [err13];
          } else {
            vErrors.push(err13);
          }
          errors++;
        }
        var _valid0 = _errs11 === errors;
        if (_valid0) {
          valid6 = true;
          passing0 = 0;
          var props0 = true;
        }
        const _errs15 = errors;
        if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
          if (data3.type === void 0) {
            const err14 = { instancePath: instancePath + "/stability_contract", schemaPath: "#/properties/stability_contract/oneOf/1/required", keyword: "required", params: { missingProperty: "type" }, message: "must have required property 'type'" };
            if (vErrors === null) {
              vErrors = [err14];
            } else {
              vErrors.push(err14);
            }
            errors++;
          }
          if (data3.max_visibility_lag_ms === void 0) {
            const err15 = { instancePath: instancePath + "/stability_contract", schemaPath: "#/properties/stability_contract/oneOf/1/required", keyword: "required", params: { missingProperty: "max_visibility_lag_ms" }, message: "must have required property 'max_visibility_lag_ms'" };
            if (vErrors === null) {
              vErrors = [err15];
            } else {
              vErrors.push(err15);
            }
            errors++;
          }
          for (const key2 in data3) {
            if (!(key2 === "type" || key2 === "max_visibility_lag_ms")) {
              const err16 = { instancePath: instancePath + "/stability_contract", schemaPath: "#/properties/stability_contract/oneOf/1/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" };
              if (vErrors === null) {
                vErrors = [err16];
              } else {
                vErrors.push(err16);
              }
              errors++;
            }
          }
          if (data3.type !== void 0) {
            if ("BOUNDED_LAG" !== data3.type) {
              const err17 = { instancePath: instancePath + "/stability_contract/type", schemaPath: "#/properties/stability_contract/oneOf/1/properties/type/const", keyword: "const", params: { allowedValue: "BOUNDED_LAG" }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err17];
              } else {
                vErrors.push(err17);
              }
              errors++;
            }
          }
          if (data3.max_visibility_lag_ms !== void 0) {
            let data6 = data3.max_visibility_lag_ms;
            if (!(typeof data6 == "number" && (!(data6 % 1) && !isNaN(data6)) && isFinite(data6))) {
              const err18 = { instancePath: instancePath + "/stability_contract/max_visibility_lag_ms", schemaPath: "#/$defs/nonNegativeSafeInteger/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
              if (vErrors === null) {
                vErrors = [err18];
              } else {
                vErrors.push(err18);
              }
              errors++;
            }
            if (typeof data6 == "number" && isFinite(data6)) {
              if (data6 > 9007199254740991 || isNaN(data6)) {
                const err19 = { instancePath: instancePath + "/stability_contract/max_visibility_lag_ms", schemaPath: "#/$defs/nonNegativeSafeInteger/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" };
                if (vErrors === null) {
                  vErrors = [err19];
                } else {
                  vErrors.push(err19);
                }
                errors++;
              }
              if (data6 < 0 || isNaN(data6)) {
                const err20 = { instancePath: instancePath + "/stability_contract/max_visibility_lag_ms", schemaPath: "#/$defs/nonNegativeSafeInteger/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                if (vErrors === null) {
                  vErrors = [err20];
                } else {
                  vErrors.push(err20);
                }
                errors++;
              }
            }
          }
        } else {
          const err21 = { instancePath: instancePath + "/stability_contract", schemaPath: "#/properties/stability_contract/oneOf/1/type", keyword: "type", params: { type: "object" }, message: "must be object" };
          if (vErrors === null) {
            vErrors = [err21];
          } else {
            vErrors.push(err21);
          }
          errors++;
        }
        var _valid0 = _errs15 === errors;
        if (_valid0 && valid6) {
          valid6 = false;
          passing0 = [passing0, 1];
        } else {
          if (_valid0) {
            valid6 = true;
            passing0 = 1;
            if (props0 !== true) {
              props0 = true;
            }
          }
          const _errs22 = errors;
          if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
            if (data3.type === void 0) {
              const err22 = { instancePath: instancePath + "/stability_contract", schemaPath: "#/properties/stability_contract/oneOf/2/required", keyword: "required", params: { missingProperty: "type" }, message: "must have required property 'type'" };
              if (vErrors === null) {
                vErrors = [err22];
              } else {
                vErrors.push(err22);
              }
              errors++;
            }
            for (const key3 in data3) {
              if (!(key3 === "type")) {
                const err23 = { instancePath: instancePath + "/stability_contract", schemaPath: "#/properties/stability_contract/oneOf/2/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key3 }, message: "must NOT have additional properties" };
                if (vErrors === null) {
                  vErrors = [err23];
                } else {
                  vErrors.push(err23);
                }
                errors++;
              }
            }
            if (data3.type !== void 0) {
              if ("UNBOUNDED" !== data3.type) {
                const err24 = { instancePath: instancePath + "/stability_contract/type", schemaPath: "#/properties/stability_contract/oneOf/2/properties/type/const", keyword: "const", params: { allowedValue: "UNBOUNDED" }, message: "must be equal to constant" };
                if (vErrors === null) {
                  vErrors = [err24];
                } else {
                  vErrors.push(err24);
                }
                errors++;
              }
            }
          } else {
            const err25 = { instancePath: instancePath + "/stability_contract", schemaPath: "#/properties/stability_contract/oneOf/2/type", keyword: "type", params: { type: "object" }, message: "must be object" };
            if (vErrors === null) {
              vErrors = [err25];
            } else {
              vErrors.push(err25);
            }
            errors++;
          }
          var _valid0 = _errs22 === errors;
          if (_valid0 && valid6) {
            valid6 = false;
            passing0 = [passing0, 2];
          } else {
            if (_valid0) {
              valid6 = true;
              passing0 = 2;
              if (props0 !== true) {
                props0 = true;
              }
            }
          }
        }
        if (!valid6) {
          const err26 = { instancePath: instancePath + "/stability_contract", schemaPath: "#/properties/stability_contract/oneOf", keyword: "oneOf", params: { passingSchemas: passing0 }, message: "must match exactly one schema in oneOf" };
          if (vErrors === null) {
            vErrors = [err26];
          } else {
            vErrors.push(err26);
          }
          errors++;
        } else {
          errors = _errs10;
          if (vErrors !== null) {
            if (_errs10) {
              vErrors.length = _errs10;
            } else {
              vErrors = null;
            }
          }
        }
      }
    } else {
      const err27 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
      if (vErrors === null) {
        vErrors = [err27];
      } else {
        vErrors.push(err27);
      }
      errors++;
    }
    validate25.errors = vErrors;
    return errors === 0;
  }
  validate25.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
  var schema48 = { "type": "object", "additionalProperties": false, "required": ["source_id", "coverage", "attribution_coverage", "stability_witness", "evidence_refs", "residuals", "lineage_edges"], "properties": { "source_id": { "$ref": "#/$defs/nonEmptyString" }, "coverage": { "enum": ["COMPLETE", "PARTIAL", "UNAVAILABLE"] }, "attribution_coverage": { "enum": ["COMPLETE", "PARTIAL", "UNAVAILABLE"] }, "stability_witness": { "oneOf": [{ "type": "object", "additionalProperties": false, "required": ["barrier", "barrier_captured_at_ms", "observed_through", "evidence_ref"], "properties": { "barrier": { "$ref": "#/$defs/nonNegativeSafeInteger" }, "barrier_captured_at_ms": { "$ref": "#/$defs/nonNegativeSafeInteger" }, "observed_through": { "$ref": "#/$defs/nonNegativeSafeInteger" }, "evidence_ref": { "$ref": "#/$defs/nonEmptyString" } } }, { "type": "null" }] }, "evidence_refs": { "type": "array", "minItems": 1, "items": { "$ref": "#/$defs/nonEmptyString" } }, "residuals": { "type": "array", "items": { "$ref": "#/$defs/residual" } }, "lineage_edges": { "type": "array", "items": { "$ref": "#/$defs/lineageEdge" } } } };
  var schema55 = { "type": "object", "additionalProperties": false, "required": ["id", "class", "disposition", "presence", "effect", "root_linkage", "settlement", "successor_id", "transfer_acceptance", "evidence_refs"], "properties": { "id": { "$ref": "#/$defs/nonEmptyString" }, "class": { "$ref": "#/$defs/domain" }, "disposition": { "enum": ["NONE", "EXTINGUISH", "SETTLE", "TRANSFER", "RETAIN"] }, "presence": { "enum": ["PRESENT", "ABSENT", "UNKNOWN"] }, "effect": { "enum": ["ACTIVE", "INERT", "UNKNOWN"] }, "root_linkage": { "enum": ["LIVE", "ENDED", "UNKNOWN"] }, "settlement": { "enum": ["PENDING", "SETTLED", "NOT_APPLICABLE", "UNKNOWN"] }, "successor_id": { "oneOf": [{ "$ref": "#/$defs/nonEmptyString" }, { "type": "null" }] }, "transfer_acceptance": { "enum": ["ACCEPTED", "REJECTED", "NOT_APPLICABLE", "UNKNOWN"] }, "evidence_refs": { "type": "array", "minItems": 1, "items": { "$ref": "#/$defs/nonEmptyString" } }, "action_report": { "type": "object", "additionalProperties": false, "required": ["operation", "reported", "evidence_ref"], "properties": { "operation": { "$ref": "#/$defs/nonEmptyString" }, "reported": { "enum": ["SUCCESS", "FAILURE", "UNKNOWN"] }, "evidence_ref": { "$ref": "#/$defs/nonEmptyString" } } } } };
  var func13 = Object.prototype.hasOwnProperty;
  function validate29(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
    let vErrors = null;
    let errors = 0;
    const evaluated0 = validate29.evaluated;
    if (evaluated0.dynamicProps) {
      evaluated0.props = void 0;
    }
    if (evaluated0.dynamicItems) {
      evaluated0.items = void 0;
    }
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.id === void 0) {
        const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
        if (vErrors === null) {
          vErrors = [err0];
        } else {
          vErrors.push(err0);
        }
        errors++;
      }
      if (data.class === void 0) {
        const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "class" }, message: "must have required property 'class'" };
        if (vErrors === null) {
          vErrors = [err1];
        } else {
          vErrors.push(err1);
        }
        errors++;
      }
      if (data.disposition === void 0) {
        const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "disposition" }, message: "must have required property 'disposition'" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
      if (data.presence === void 0) {
        const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "presence" }, message: "must have required property 'presence'" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
      if (data.effect === void 0) {
        const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "effect" }, message: "must have required property 'effect'" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
      if (data.root_linkage === void 0) {
        const err5 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "root_linkage" }, message: "must have required property 'root_linkage'" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
      if (data.settlement === void 0) {
        const err6 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "settlement" }, message: "must have required property 'settlement'" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
      if (data.successor_id === void 0) {
        const err7 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "successor_id" }, message: "must have required property 'successor_id'" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
      if (data.transfer_acceptance === void 0) {
        const err8 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "transfer_acceptance" }, message: "must have required property 'transfer_acceptance'" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
      if (data.evidence_refs === void 0) {
        const err9 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "evidence_refs" }, message: "must have required property 'evidence_refs'" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
      for (const key0 in data) {
        if (!func13.call(schema55.properties, key0)) {
          const err10 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
      }
      if (data.id !== void 0) {
        let data0 = data.id;
        if (typeof data0 === "string") {
          if (func1(data0) < 1) {
            const err11 = { instancePath: instancePath + "/id", schemaPath: "#/$defs/nonEmptyString/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
            if (vErrors === null) {
              vErrors = [err11];
            } else {
              vErrors.push(err11);
            }
            errors++;
          }
        } else {
          const err12 = { instancePath: instancePath + "/id", schemaPath: "#/$defs/nonEmptyString/type", keyword: "type", params: { type: "string" }, message: "must be string" };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
      }
      if (data.class !== void 0) {
        let data1 = data.class;
        if (!(data1 === "AUTHORITY" || data1 === "EXECUTION" || data1 === "COMMITMENT" || data1 === "OPERATIONAL_STATE")) {
          const err13 = { instancePath: instancePath + "/class", schemaPath: "#/$defs/domain/enum", keyword: "enum", params: { allowedValues: schema38.enum }, message: "must be equal to one of the allowed values" };
          if (vErrors === null) {
            vErrors = [err13];
          } else {
            vErrors.push(err13);
          }
          errors++;
        }
      }
      if (data.disposition !== void 0) {
        let data2 = data.disposition;
        if (!(data2 === "NONE" || data2 === "EXTINGUISH" || data2 === "SETTLE" || data2 === "TRANSFER" || data2 === "RETAIN")) {
          const err14 = { instancePath: instancePath + "/disposition", schemaPath: "#/properties/disposition/enum", keyword: "enum", params: { allowedValues: schema55.properties.disposition.enum }, message: "must be equal to one of the allowed values" };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        }
      }
      if (data.presence !== void 0) {
        let data3 = data.presence;
        if (!(data3 === "PRESENT" || data3 === "ABSENT" || data3 === "UNKNOWN")) {
          const err15 = { instancePath: instancePath + "/presence", schemaPath: "#/properties/presence/enum", keyword: "enum", params: { allowedValues: schema55.properties.presence.enum }, message: "must be equal to one of the allowed values" };
          if (vErrors === null) {
            vErrors = [err15];
          } else {
            vErrors.push(err15);
          }
          errors++;
        }
      }
      if (data.effect !== void 0) {
        let data4 = data.effect;
        if (!(data4 === "ACTIVE" || data4 === "INERT" || data4 === "UNKNOWN")) {
          const err16 = { instancePath: instancePath + "/effect", schemaPath: "#/properties/effect/enum", keyword: "enum", params: { allowedValues: schema55.properties.effect.enum }, message: "must be equal to one of the allowed values" };
          if (vErrors === null) {
            vErrors = [err16];
          } else {
            vErrors.push(err16);
          }
          errors++;
        }
      }
      if (data.root_linkage !== void 0) {
        let data5 = data.root_linkage;
        if (!(data5 === "LIVE" || data5 === "ENDED" || data5 === "UNKNOWN")) {
          const err17 = { instancePath: instancePath + "/root_linkage", schemaPath: "#/properties/root_linkage/enum", keyword: "enum", params: { allowedValues: schema55.properties.root_linkage.enum }, message: "must be equal to one of the allowed values" };
          if (vErrors === null) {
            vErrors = [err17];
          } else {
            vErrors.push(err17);
          }
          errors++;
        }
      }
      if (data.settlement !== void 0) {
        let data6 = data.settlement;
        if (!(data6 === "PENDING" || data6 === "SETTLED" || data6 === "NOT_APPLICABLE" || data6 === "UNKNOWN")) {
          const err18 = { instancePath: instancePath + "/settlement", schemaPath: "#/properties/settlement/enum", keyword: "enum", params: { allowedValues: schema55.properties.settlement.enum }, message: "must be equal to one of the allowed values" };
          if (vErrors === null) {
            vErrors = [err18];
          } else {
            vErrors.push(err18);
          }
          errors++;
        }
      }
      if (data.successor_id !== void 0) {
        let data7 = data.successor_id;
        const _errs13 = errors;
        let valid3 = false;
        let passing0 = null;
        const _errs14 = errors;
        if (typeof data7 === "string") {
          if (func1(data7) < 1) {
            const err19 = { instancePath: instancePath + "/successor_id", schemaPath: "#/$defs/nonEmptyString/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
            if (vErrors === null) {
              vErrors = [err19];
            } else {
              vErrors.push(err19);
            }
            errors++;
          }
        } else {
          const err20 = { instancePath: instancePath + "/successor_id", schemaPath: "#/$defs/nonEmptyString/type", keyword: "type", params: { type: "string" }, message: "must be string" };
          if (vErrors === null) {
            vErrors = [err20];
          } else {
            vErrors.push(err20);
          }
          errors++;
        }
        var _valid0 = _errs14 === errors;
        if (_valid0) {
          valid3 = true;
          passing0 = 0;
        }
        const _errs17 = errors;
        if (data7 !== null) {
          const err21 = { instancePath: instancePath + "/successor_id", schemaPath: "#/properties/successor_id/oneOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
          if (vErrors === null) {
            vErrors = [err21];
          } else {
            vErrors.push(err21);
          }
          errors++;
        }
        var _valid0 = _errs17 === errors;
        if (_valid0 && valid3) {
          valid3 = false;
          passing0 = [passing0, 1];
        } else {
          if (_valid0) {
            valid3 = true;
            passing0 = 1;
          }
        }
        if (!valid3) {
          const err22 = { instancePath: instancePath + "/successor_id", schemaPath: "#/properties/successor_id/oneOf", keyword: "oneOf", params: { passingSchemas: passing0 }, message: "must match exactly one schema in oneOf" };
          if (vErrors === null) {
            vErrors = [err22];
          } else {
            vErrors.push(err22);
          }
          errors++;
        } else {
          errors = _errs13;
          if (vErrors !== null) {
            if (_errs13) {
              vErrors.length = _errs13;
            } else {
              vErrors = null;
            }
          }
        }
      }
      if (data.transfer_acceptance !== void 0) {
        let data8 = data.transfer_acceptance;
        if (!(data8 === "ACCEPTED" || data8 === "REJECTED" || data8 === "NOT_APPLICABLE" || data8 === "UNKNOWN")) {
          const err23 = { instancePath: instancePath + "/transfer_acceptance", schemaPath: "#/properties/transfer_acceptance/enum", keyword: "enum", params: { allowedValues: schema55.properties.transfer_acceptance.enum }, message: "must be equal to one of the allowed values" };
          if (vErrors === null) {
            vErrors = [err23];
          } else {
            vErrors.push(err23);
          }
          errors++;
        }
      }
      if (data.evidence_refs !== void 0) {
        let data9 = data.evidence_refs;
        if (Array.isArray(data9)) {
          if (data9.length < 1) {
            const err24 = { instancePath: instancePath + "/evidence_refs", schemaPath: "#/properties/evidence_refs/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
            if (vErrors === null) {
              vErrors = [err24];
            } else {
              vErrors.push(err24);
            }
            errors++;
          }
          const len0 = data9.length;
          for (let i0 = 0; i0 < len0; i0++) {
            let data10 = data9[i0];
            if (typeof data10 === "string") {
              if (func1(data10) < 1) {
                const err25 = { instancePath: instancePath + "/evidence_refs/" + i0, schemaPath: "#/$defs/nonEmptyString/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                if (vErrors === null) {
                  vErrors = [err25];
                } else {
                  vErrors.push(err25);
                }
                errors++;
              }
            } else {
              const err26 = { instancePath: instancePath + "/evidence_refs/" + i0, schemaPath: "#/$defs/nonEmptyString/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err26];
              } else {
                vErrors.push(err26);
              }
              errors++;
            }
          }
        } else {
          const err27 = { instancePath: instancePath + "/evidence_refs", schemaPath: "#/properties/evidence_refs/type", keyword: "type", params: { type: "array" }, message: "must be array" };
          if (vErrors === null) {
            vErrors = [err27];
          } else {
            vErrors.push(err27);
          }
          errors++;
        }
      }
      if (data.action_report !== void 0) {
        let data11 = data.action_report;
        if (data11 && typeof data11 == "object" && !Array.isArray(data11)) {
          if (data11.operation === void 0) {
            const err28 = { instancePath: instancePath + "/action_report", schemaPath: "#/properties/action_report/required", keyword: "required", params: { missingProperty: "operation" }, message: "must have required property 'operation'" };
            if (vErrors === null) {
              vErrors = [err28];
            } else {
              vErrors.push(err28);
            }
            errors++;
          }
          if (data11.reported === void 0) {
            const err29 = { instancePath: instancePath + "/action_report", schemaPath: "#/properties/action_report/required", keyword: "required", params: { missingProperty: "reported" }, message: "must have required property 'reported'" };
            if (vErrors === null) {
              vErrors = [err29];
            } else {
              vErrors.push(err29);
            }
            errors++;
          }
          if (data11.evidence_ref === void 0) {
            const err30 = { instancePath: instancePath + "/action_report", schemaPath: "#/properties/action_report/required", keyword: "required", params: { missingProperty: "evidence_ref" }, message: "must have required property 'evidence_ref'" };
            if (vErrors === null) {
              vErrors = [err30];
            } else {
              vErrors.push(err30);
            }
            errors++;
          }
          for (const key1 in data11) {
            if (!(key1 === "operation" || key1 === "reported" || key1 === "evidence_ref")) {
              const err31 = { instancePath: instancePath + "/action_report", schemaPath: "#/properties/action_report/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
              if (vErrors === null) {
                vErrors = [err31];
              } else {
                vErrors.push(err31);
              }
              errors++;
            }
          }
          if (data11.operation !== void 0) {
            let data12 = data11.operation;
            if (typeof data12 === "string") {
              if (func1(data12) < 1) {
                const err32 = { instancePath: instancePath + "/action_report/operation", schemaPath: "#/$defs/nonEmptyString/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                if (vErrors === null) {
                  vErrors = [err32];
                } else {
                  vErrors.push(err32);
                }
                errors++;
              }
            } else {
              const err33 = { instancePath: instancePath + "/action_report/operation", schemaPath: "#/$defs/nonEmptyString/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err33];
              } else {
                vErrors.push(err33);
              }
              errors++;
            }
          }
          if (data11.reported !== void 0) {
            let data13 = data11.reported;
            if (!(data13 === "SUCCESS" || data13 === "FAILURE" || data13 === "UNKNOWN")) {
              const err34 = { instancePath: instancePath + "/action_report/reported", schemaPath: "#/properties/action_report/properties/reported/enum", keyword: "enum", params: { allowedValues: schema55.properties.action_report.properties.reported.enum }, message: "must be equal to one of the allowed values" };
              if (vErrors === null) {
                vErrors = [err34];
              } else {
                vErrors.push(err34);
              }
              errors++;
            }
          }
          if (data11.evidence_ref !== void 0) {
            let data14 = data11.evidence_ref;
            if (typeof data14 === "string") {
              if (func1(data14) < 1) {
                const err35 = { instancePath: instancePath + "/action_report/evidence_ref", schemaPath: "#/$defs/nonEmptyString/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                if (vErrors === null) {
                  vErrors = [err35];
                } else {
                  vErrors.push(err35);
                }
                errors++;
              }
            } else {
              const err36 = { instancePath: instancePath + "/action_report/evidence_ref", schemaPath: "#/$defs/nonEmptyString/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err36];
              } else {
                vErrors.push(err36);
              }
              errors++;
            }
          }
        } else {
          const err37 = { instancePath: instancePath + "/action_report", schemaPath: "#/properties/action_report/type", keyword: "type", params: { type: "object" }, message: "must be object" };
          if (vErrors === null) {
            vErrors = [err37];
          } else {
            vErrors.push(err37);
          }
          errors++;
        }
      }
    } else {
      const err38 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
      if (vErrors === null) {
        vErrors = [err38];
      } else {
        vErrors.push(err38);
      }
      errors++;
    }
    validate29.errors = vErrors;
    return errors === 0;
  }
  validate29.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
  function validate31(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
    let vErrors = null;
    let errors = 0;
    const evaluated0 = validate31.evaluated;
    if (evaluated0.dynamicProps) {
      evaluated0.props = void 0;
    }
    if (evaluated0.dynamicItems) {
      evaluated0.items = void 0;
    }
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.from === void 0) {
        const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "from" }, message: "must have required property 'from'" };
        if (vErrors === null) {
          vErrors = [err0];
        } else {
          vErrors.push(err0);
        }
        errors++;
      }
      if (data.to === void 0) {
        const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "to" }, message: "must have required property 'to'" };
        if (vErrors === null) {
          vErrors = [err1];
        } else {
          vErrors.push(err1);
        }
        errors++;
      }
      if (data.type === void 0) {
        const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "type" }, message: "must have required property 'type'" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
      if (data.evidence_ref === void 0) {
        const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "evidence_ref" }, message: "must have required property 'evidence_ref'" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
      for (const key0 in data) {
        if (!(key0 === "from" || key0 === "to" || key0 === "type" || key0 === "evidence_ref")) {
          const err4 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
      }
      if (data.from !== void 0) {
        let data0 = data.from;
        if (typeof data0 === "string") {
          if (func1(data0) < 1) {
            const err5 = { instancePath: instancePath + "/from", schemaPath: "#/$defs/nonEmptyString/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
            if (vErrors === null) {
              vErrors = [err5];
            } else {
              vErrors.push(err5);
            }
            errors++;
          }
        } else {
          const err6 = { instancePath: instancePath + "/from", schemaPath: "#/$defs/nonEmptyString/type", keyword: "type", params: { type: "string" }, message: "must be string" };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
      }
      if (data.to !== void 0) {
        let data1 = data.to;
        if (typeof data1 === "string") {
          if (func1(data1) < 1) {
            const err7 = { instancePath: instancePath + "/to", schemaPath: "#/$defs/nonEmptyString/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
            if (vErrors === null) {
              vErrors = [err7];
            } else {
              vErrors.push(err7);
            }
            errors++;
          }
        } else {
          const err8 = { instancePath: instancePath + "/to", schemaPath: "#/$defs/nonEmptyString/type", keyword: "type", params: { type: "string" }, message: "must be string" };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
      }
      if (data.type !== void 0) {
        if ("DERIVED_FROM" !== data.type) {
          const err9 = { instancePath: instancePath + "/type", schemaPath: "#/properties/type/const", keyword: "const", params: { allowedValue: "DERIVED_FROM" }, message: "must be equal to constant" };
          if (vErrors === null) {
            vErrors = [err9];
          } else {
            vErrors.push(err9);
          }
          errors++;
        }
      }
      if (data.evidence_ref !== void 0) {
        let data3 = data.evidence_ref;
        if (typeof data3 === "string") {
          if (func1(data3) < 1) {
            const err10 = { instancePath: instancePath + "/evidence_ref", schemaPath: "#/$defs/nonEmptyString/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
            if (vErrors === null) {
              vErrors = [err10];
            } else {
              vErrors.push(err10);
            }
            errors++;
          }
        } else {
          const err11 = { instancePath: instancePath + "/evidence_ref", schemaPath: "#/$defs/nonEmptyString/type", keyword: "type", params: { type: "string" }, message: "must be string" };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
      }
    } else {
      const err12 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
      if (vErrors === null) {
        vErrors = [err12];
      } else {
        vErrors.push(err12);
      }
      errors++;
    }
    validate31.errors = vErrors;
    return errors === 0;
  }
  validate31.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
  function validate28(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
    let vErrors = null;
    let errors = 0;
    const evaluated0 = validate28.evaluated;
    if (evaluated0.dynamicProps) {
      evaluated0.props = void 0;
    }
    if (evaluated0.dynamicItems) {
      evaluated0.items = void 0;
    }
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.source_id === void 0) {
        const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "source_id" }, message: "must have required property 'source_id'" };
        if (vErrors === null) {
          vErrors = [err0];
        } else {
          vErrors.push(err0);
        }
        errors++;
      }
      if (data.coverage === void 0) {
        const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "coverage" }, message: "must have required property 'coverage'" };
        if (vErrors === null) {
          vErrors = [err1];
        } else {
          vErrors.push(err1);
        }
        errors++;
      }
      if (data.attribution_coverage === void 0) {
        const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "attribution_coverage" }, message: "must have required property 'attribution_coverage'" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
      if (data.stability_witness === void 0) {
        const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "stability_witness" }, message: "must have required property 'stability_witness'" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
      if (data.evidence_refs === void 0) {
        const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "evidence_refs" }, message: "must have required property 'evidence_refs'" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
      if (data.residuals === void 0) {
        const err5 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "residuals" }, message: "must have required property 'residuals'" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
      if (data.lineage_edges === void 0) {
        const err6 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "lineage_edges" }, message: "must have required property 'lineage_edges'" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
      for (const key0 in data) {
        if (!(key0 === "source_id" || key0 === "coverage" || key0 === "attribution_coverage" || key0 === "stability_witness" || key0 === "evidence_refs" || key0 === "residuals" || key0 === "lineage_edges")) {
          const err7 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
      }
      if (data.source_id !== void 0) {
        let data0 = data.source_id;
        if (typeof data0 === "string") {
          if (func1(data0) < 1) {
            const err8 = { instancePath: instancePath + "/source_id", schemaPath: "#/$defs/nonEmptyString/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
            if (vErrors === null) {
              vErrors = [err8];
            } else {
              vErrors.push(err8);
            }
            errors++;
          }
        } else {
          const err9 = { instancePath: instancePath + "/source_id", schemaPath: "#/$defs/nonEmptyString/type", keyword: "type", params: { type: "string" }, message: "must be string" };
          if (vErrors === null) {
            vErrors = [err9];
          } else {
            vErrors.push(err9);
          }
          errors++;
        }
      }
      if (data.coverage !== void 0) {
        let data1 = data.coverage;
        if (!(data1 === "COMPLETE" || data1 === "PARTIAL" || data1 === "UNAVAILABLE")) {
          const err10 = { instancePath: instancePath + "/coverage", schemaPath: "#/properties/coverage/enum", keyword: "enum", params: { allowedValues: schema48.properties.coverage.enum }, message: "must be equal to one of the allowed values" };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
      }
      if (data.attribution_coverage !== void 0) {
        let data2 = data.attribution_coverage;
        if (!(data2 === "COMPLETE" || data2 === "PARTIAL" || data2 === "UNAVAILABLE")) {
          const err11 = { instancePath: instancePath + "/attribution_coverage", schemaPath: "#/properties/attribution_coverage/enum", keyword: "enum", params: { allowedValues: schema48.properties.attribution_coverage.enum }, message: "must be equal to one of the allowed values" };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
      }
      if (data.stability_witness !== void 0) {
        let data3 = data.stability_witness;
        const _errs8 = errors;
        let valid2 = false;
        let passing0 = null;
        const _errs9 = errors;
        if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
          if (data3.barrier === void 0) {
            const err12 = { instancePath: instancePath + "/stability_witness", schemaPath: "#/properties/stability_witness/oneOf/0/required", keyword: "required", params: { missingProperty: "barrier" }, message: "must have required property 'barrier'" };
            if (vErrors === null) {
              vErrors = [err12];
            } else {
              vErrors.push(err12);
            }
            errors++;
          }
          if (data3.barrier_captured_at_ms === void 0) {
            const err13 = { instancePath: instancePath + "/stability_witness", schemaPath: "#/properties/stability_witness/oneOf/0/required", keyword: "required", params: { missingProperty: "barrier_captured_at_ms" }, message: "must have required property 'barrier_captured_at_ms'" };
            if (vErrors === null) {
              vErrors = [err13];
            } else {
              vErrors.push(err13);
            }
            errors++;
          }
          if (data3.observed_through === void 0) {
            const err14 = { instancePath: instancePath + "/stability_witness", schemaPath: "#/properties/stability_witness/oneOf/0/required", keyword: "required", params: { missingProperty: "observed_through" }, message: "must have required property 'observed_through'" };
            if (vErrors === null) {
              vErrors = [err14];
            } else {
              vErrors.push(err14);
            }
            errors++;
          }
          if (data3.evidence_ref === void 0) {
            const err15 = { instancePath: instancePath + "/stability_witness", schemaPath: "#/properties/stability_witness/oneOf/0/required", keyword: "required", params: { missingProperty: "evidence_ref" }, message: "must have required property 'evidence_ref'" };
            if (vErrors === null) {
              vErrors = [err15];
            } else {
              vErrors.push(err15);
            }
            errors++;
          }
          for (const key1 in data3) {
            if (!(key1 === "barrier" || key1 === "barrier_captured_at_ms" || key1 === "observed_through" || key1 === "evidence_ref")) {
              const err16 = { instancePath: instancePath + "/stability_witness", schemaPath: "#/properties/stability_witness/oneOf/0/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
              if (vErrors === null) {
                vErrors = [err16];
              } else {
                vErrors.push(err16);
              }
              errors++;
            }
          }
          if (data3.barrier !== void 0) {
            let data4 = data3.barrier;
            if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)) && isFinite(data4))) {
              const err17 = { instancePath: instancePath + "/stability_witness/barrier", schemaPath: "#/$defs/nonNegativeSafeInteger/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
              if (vErrors === null) {
                vErrors = [err17];
              } else {
                vErrors.push(err17);
              }
              errors++;
            }
            if (typeof data4 == "number" && isFinite(data4)) {
              if (data4 > 9007199254740991 || isNaN(data4)) {
                const err18 = { instancePath: instancePath + "/stability_witness/barrier", schemaPath: "#/$defs/nonNegativeSafeInteger/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" };
                if (vErrors === null) {
                  vErrors = [err18];
                } else {
                  vErrors.push(err18);
                }
                errors++;
              }
              if (data4 < 0 || isNaN(data4)) {
                const err19 = { instancePath: instancePath + "/stability_witness/barrier", schemaPath: "#/$defs/nonNegativeSafeInteger/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                if (vErrors === null) {
                  vErrors = [err19];
                } else {
                  vErrors.push(err19);
                }
                errors++;
              }
            }
          }
          if (data3.barrier_captured_at_ms !== void 0) {
            let data5 = data3.barrier_captured_at_ms;
            if (!(typeof data5 == "number" && (!(data5 % 1) && !isNaN(data5)) && isFinite(data5))) {
              const err20 = { instancePath: instancePath + "/stability_witness/barrier_captured_at_ms", schemaPath: "#/$defs/nonNegativeSafeInteger/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
              if (vErrors === null) {
                vErrors = [err20];
              } else {
                vErrors.push(err20);
              }
              errors++;
            }
            if (typeof data5 == "number" && isFinite(data5)) {
              if (data5 > 9007199254740991 || isNaN(data5)) {
                const err21 = { instancePath: instancePath + "/stability_witness/barrier_captured_at_ms", schemaPath: "#/$defs/nonNegativeSafeInteger/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" };
                if (vErrors === null) {
                  vErrors = [err21];
                } else {
                  vErrors.push(err21);
                }
                errors++;
              }
              if (data5 < 0 || isNaN(data5)) {
                const err22 = { instancePath: instancePath + "/stability_witness/barrier_captured_at_ms", schemaPath: "#/$defs/nonNegativeSafeInteger/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                if (vErrors === null) {
                  vErrors = [err22];
                } else {
                  vErrors.push(err22);
                }
                errors++;
              }
            }
          }
          if (data3.observed_through !== void 0) {
            let data6 = data3.observed_through;
            if (!(typeof data6 == "number" && (!(data6 % 1) && !isNaN(data6)) && isFinite(data6))) {
              const err23 = { instancePath: instancePath + "/stability_witness/observed_through", schemaPath: "#/$defs/nonNegativeSafeInteger/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
              if (vErrors === null) {
                vErrors = [err23];
              } else {
                vErrors.push(err23);
              }
              errors++;
            }
            if (typeof data6 == "number" && isFinite(data6)) {
              if (data6 > 9007199254740991 || isNaN(data6)) {
                const err24 = { instancePath: instancePath + "/stability_witness/observed_through", schemaPath: "#/$defs/nonNegativeSafeInteger/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" };
                if (vErrors === null) {
                  vErrors = [err24];
                } else {
                  vErrors.push(err24);
                }
                errors++;
              }
              if (data6 < 0 || isNaN(data6)) {
                const err25 = { instancePath: instancePath + "/stability_witness/observed_through", schemaPath: "#/$defs/nonNegativeSafeInteger/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                if (vErrors === null) {
                  vErrors = [err25];
                } else {
                  vErrors.push(err25);
                }
                errors++;
              }
            }
          }
          if (data3.evidence_ref !== void 0) {
            let data7 = data3.evidence_ref;
            if (typeof data7 === "string") {
              if (func1(data7) < 1) {
                const err26 = { instancePath: instancePath + "/stability_witness/evidence_ref", schemaPath: "#/$defs/nonEmptyString/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                if (vErrors === null) {
                  vErrors = [err26];
                } else {
                  vErrors.push(err26);
                }
                errors++;
              }
            } else {
              const err27 = { instancePath: instancePath + "/stability_witness/evidence_ref", schemaPath: "#/$defs/nonEmptyString/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err27];
              } else {
                vErrors.push(err27);
              }
              errors++;
            }
          }
        } else {
          const err28 = { instancePath: instancePath + "/stability_witness", schemaPath: "#/properties/stability_witness/oneOf/0/type", keyword: "type", params: { type: "object" }, message: "must be object" };
          if (vErrors === null) {
            vErrors = [err28];
          } else {
            vErrors.push(err28);
          }
          errors++;
        }
        var _valid0 = _errs9 === errors;
        if (_valid0) {
          valid2 = true;
          passing0 = 0;
        }
        const _errs24 = errors;
        if (data3 !== null) {
          const err29 = { instancePath: instancePath + "/stability_witness", schemaPath: "#/properties/stability_witness/oneOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
          if (vErrors === null) {
            vErrors = [err29];
          } else {
            vErrors.push(err29);
          }
          errors++;
        }
        var _valid0 = _errs24 === errors;
        if (_valid0 && valid2) {
          valid2 = false;
          passing0 = [passing0, 1];
        } else {
          if (_valid0) {
            valid2 = true;
            passing0 = 1;
          }
        }
        if (!valid2) {
          const err30 = { instancePath: instancePath + "/stability_witness", schemaPath: "#/properties/stability_witness/oneOf", keyword: "oneOf", params: { passingSchemas: passing0 }, message: "must match exactly one schema in oneOf" };
          if (vErrors === null) {
            vErrors = [err30];
          } else {
            vErrors.push(err30);
          }
          errors++;
        } else {
          errors = _errs8;
          if (vErrors !== null) {
            if (_errs8) {
              vErrors.length = _errs8;
            } else {
              vErrors = null;
            }
          }
        }
      }
      if (data.evidence_refs !== void 0) {
        let data8 = data.evidence_refs;
        if (Array.isArray(data8)) {
          if (data8.length < 1) {
            const err31 = { instancePath: instancePath + "/evidence_refs", schemaPath: "#/properties/evidence_refs/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
            if (vErrors === null) {
              vErrors = [err31];
            } else {
              vErrors.push(err31);
            }
            errors++;
          }
          const len0 = data8.length;
          for (let i0 = 0; i0 < len0; i0++) {
            let data9 = data8[i0];
            if (typeof data9 === "string") {
              if (func1(data9) < 1) {
                const err32 = { instancePath: instancePath + "/evidence_refs/" + i0, schemaPath: "#/$defs/nonEmptyString/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                if (vErrors === null) {
                  vErrors = [err32];
                } else {
                  vErrors.push(err32);
                }
                errors++;
              }
            } else {
              const err33 = { instancePath: instancePath + "/evidence_refs/" + i0, schemaPath: "#/$defs/nonEmptyString/type", keyword: "type", params: { type: "string" }, message: "must be string" };
              if (vErrors === null) {
                vErrors = [err33];
              } else {
                vErrors.push(err33);
              }
              errors++;
            }
          }
        } else {
          const err34 = { instancePath: instancePath + "/evidence_refs", schemaPath: "#/properties/evidence_refs/type", keyword: "type", params: { type: "array" }, message: "must be array" };
          if (vErrors === null) {
            vErrors = [err34];
          } else {
            vErrors.push(err34);
          }
          errors++;
        }
      }
      if (data.residuals !== void 0) {
        let data10 = data.residuals;
        if (Array.isArray(data10)) {
          const len1 = data10.length;
          for (let i1 = 0; i1 < len1; i1++) {
            if (!validate29(data10[i1], { instancePath: instancePath + "/residuals/" + i1, parentData: data10, parentDataProperty: i1, rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate29.errors : vErrors.concat(validate29.errors);
              errors = vErrors.length;
            }
          }
        } else {
          const err35 = { instancePath: instancePath + "/residuals", schemaPath: "#/properties/residuals/type", keyword: "type", params: { type: "array" }, message: "must be array" };
          if (vErrors === null) {
            vErrors = [err35];
          } else {
            vErrors.push(err35);
          }
          errors++;
        }
      }
      if (data.lineage_edges !== void 0) {
        let data12 = data.lineage_edges;
        if (Array.isArray(data12)) {
          const len2 = data12.length;
          for (let i2 = 0; i2 < len2; i2++) {
            if (!validate31(data12[i2], { instancePath: instancePath + "/lineage_edges/" + i2, parentData: data12, parentDataProperty: i2, rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate31.errors : vErrors.concat(validate31.errors);
              errors = vErrors.length;
            }
          }
        } else {
          const err36 = { instancePath: instancePath + "/lineage_edges", schemaPath: "#/properties/lineage_edges/type", keyword: "type", params: { type: "array" }, message: "must be array" };
          if (vErrors === null) {
            vErrors = [err36];
          } else {
            vErrors.push(err36);
          }
          errors++;
        }
      }
    } else {
      const err37 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
      if (vErrors === null) {
        vErrors = [err37];
      } else {
        vErrors.push(err37);
      }
      errors++;
    }
    validate28.errors = vErrors;
    return errors === 0;
  }
  validate28.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
  function validate27(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
    let vErrors = null;
    let errors = 0;
    const evaluated0 = validate27.evaluated;
    if (evaluated0.dynamicProps) {
      evaluated0.props = void 0;
    }
    if (evaluated0.dynamicItems) {
      evaluated0.items = void 0;
    }
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.scan_id === void 0) {
        const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "scan_id" }, message: "must have required property 'scan_id'" };
        if (vErrors === null) {
          vErrors = [err0];
        } else {
          vErrors.push(err0);
        }
        errors++;
      }
      if (data.observed_at_ms === void 0) {
        const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "observed_at_ms" }, message: "must have required property 'observed_at_ms'" };
        if (vErrors === null) {
          vErrors = [err1];
        } else {
          vErrors.push(err1);
        }
        errors++;
      }
      if (data.sources === void 0) {
        const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "sources" }, message: "must have required property 'sources'" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
      for (const key0 in data) {
        if (!(key0 === "scan_id" || key0 === "observed_at_ms" || key0 === "sources")) {
          const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
      }
      if (data.scan_id !== void 0) {
        let data0 = data.scan_id;
        if (typeof data0 === "string") {
          if (func1(data0) < 1) {
            const err4 = { instancePath: instancePath + "/scan_id", schemaPath: "#/$defs/nonEmptyString/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        } else {
          const err5 = { instancePath: instancePath + "/scan_id", schemaPath: "#/$defs/nonEmptyString/type", keyword: "type", params: { type: "string" }, message: "must be string" };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      }
      if (data.observed_at_ms !== void 0) {
        let data1 = data.observed_at_ms;
        if (!(typeof data1 == "number" && (!(data1 % 1) && !isNaN(data1)) && isFinite(data1))) {
          const err6 = { instancePath: instancePath + "/observed_at_ms", schemaPath: "#/$defs/nonNegativeSafeInteger/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
        if (typeof data1 == "number" && isFinite(data1)) {
          if (data1 > 9007199254740991 || isNaN(data1)) {
            const err7 = { instancePath: instancePath + "/observed_at_ms", schemaPath: "#/$defs/nonNegativeSafeInteger/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" };
            if (vErrors === null) {
              vErrors = [err7];
            } else {
              vErrors.push(err7);
            }
            errors++;
          }
          if (data1 < 0 || isNaN(data1)) {
            const err8 = { instancePath: instancePath + "/observed_at_ms", schemaPath: "#/$defs/nonNegativeSafeInteger/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
            if (vErrors === null) {
              vErrors = [err8];
            } else {
              vErrors.push(err8);
            }
            errors++;
          }
        }
      }
      if (data.sources !== void 0) {
        let data2 = data.sources;
        if (Array.isArray(data2)) {
          const len0 = data2.length;
          for (let i0 = 0; i0 < len0; i0++) {
            if (!validate28(data2[i0], { instancePath: instancePath + "/sources/" + i0, parentData: data2, parentDataProperty: i0, rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate28.errors : vErrors.concat(validate28.errors);
              errors = vErrors.length;
            }
          }
        } else {
          const err9 = { instancePath: instancePath + "/sources", schemaPath: "#/properties/sources/type", keyword: "type", params: { type: "array" }, message: "must be array" };
          if (vErrors === null) {
            vErrors = [err9];
          } else {
            vErrors.push(err9);
          }
          errors++;
        }
      }
    } else {
      const err10 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
      if (vErrors === null) {
        vErrors = [err10];
      } else {
        vErrors.push(err10);
      }
      errors++;
    }
    validate27.errors = vErrors;
    return errors === 0;
  }
  validate27.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
  function validate20(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
    ;
    let vErrors = null;
    let errors = 0;
    const evaluated0 = validate20.evaluated;
    if (evaluated0.dynamicProps) {
      evaluated0.props = void 0;
    }
    if (evaluated0.dynamicItems) {
      evaluated0.items = void 0;
    }
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.spec_version === void 0) {
        const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "spec_version" }, message: "must have required property 'spec_version'" };
        if (vErrors === null) {
          vErrors = [err0];
        } else {
          vErrors.push(err0);
        }
        errors++;
      }
      if (data.profile_id === void 0) {
        const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "profile_id" }, message: "must have required property 'profile_id'" };
        if (vErrors === null) {
          vErrors = [err1];
        } else {
          vErrors.push(err1);
        }
        errors++;
      }
      if (data.time_basis === void 0) {
        const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "time_basis" }, message: "must have required property 'time_basis'" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
      if (data.root === void 0) {
        const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "root" }, message: "must have required property 'root'" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
      if (data.domain_bindings === void 0) {
        const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "domain_bindings" }, message: "must have required property 'domain_bindings'" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
      if (data.sources === void 0) {
        const err5 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "sources" }, message: "must have required property 'sources'" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
      if (data.scans === void 0) {
        const err6 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "scans" }, message: "must have required property 'scans'" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
      for (const key0 in data) {
        if (!(key0 === "spec_version" || key0 === "profile_id" || key0 === "time_basis" || key0 === "root" || key0 === "domain_bindings" || key0 === "sources" || key0 === "scans")) {
          const err7 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
      }
      if (data.spec_version !== void 0) {
        if ("0.3" !== data.spec_version) {
          const err8 = { instancePath: instancePath + "/spec_version", schemaPath: "#/properties/spec_version/const", keyword: "const", params: { allowedValue: "0.3" }, message: "must be equal to constant" };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
      }
      if (data.profile_id !== void 0) {
        if ("RISU_AGENT_CLOSURE_V0" !== data.profile_id) {
          const err9 = { instancePath: instancePath + "/profile_id", schemaPath: "#/properties/profile_id/const", keyword: "const", params: { allowedValue: "RISU_AGENT_CLOSURE_V0" }, message: "must be equal to constant" };
          if (vErrors === null) {
            vErrors = [err9];
          } else {
            vErrors.push(err9);
          }
          errors++;
        }
      }
      if (data.time_basis !== void 0) {
        if ("BUNDLE_MONOTONIC_MS" !== data.time_basis) {
          const err10 = { instancePath: instancePath + "/time_basis", schemaPath: "#/properties/time_basis/const", keyword: "const", params: { allowedValue: "BUNDLE_MONOTONIC_MS" }, message: "must be equal to constant" };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
      }
      if (data.root !== void 0) {
        if (!validate21(data.root, { instancePath: instancePath + "/root", parentData: data, parentDataProperty: "root", rootData, dynamicAnchors })) {
          vErrors = vErrors === null ? validate21.errors : vErrors.concat(validate21.errors);
          errors = vErrors.length;
        }
      }
      if (data.domain_bindings !== void 0) {
        let data4 = data.domain_bindings;
        if (Array.isArray(data4)) {
          if (data4.length > 4) {
            const err11 = { instancePath: instancePath + "/domain_bindings", schemaPath: "#/properties/domain_bindings/maxItems", keyword: "maxItems", params: { limit: 4 }, message: "must NOT have more than 4 items" };
            if (vErrors === null) {
              vErrors = [err11];
            } else {
              vErrors.push(err11);
            }
            errors++;
          }
          if (data4.length < 4) {
            const err12 = { instancePath: instancePath + "/domain_bindings", schemaPath: "#/properties/domain_bindings/minItems", keyword: "minItems", params: { limit: 4 }, message: "must NOT have fewer than 4 items" };
            if (vErrors === null) {
              vErrors = [err12];
            } else {
              vErrors.push(err12);
            }
            errors++;
          }
          const len0 = data4.length;
          for (let i0 = 0; i0 < len0; i0++) {
            if (!validate23(data4[i0], { instancePath: instancePath + "/domain_bindings/" + i0, parentData: data4, parentDataProperty: i0, rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate23.errors : vErrors.concat(validate23.errors);
              errors = vErrors.length;
            }
          }
        } else {
          const err13 = { instancePath: instancePath + "/domain_bindings", schemaPath: "#/properties/domain_bindings/type", keyword: "type", params: { type: "array" }, message: "must be array" };
          if (vErrors === null) {
            vErrors = [err13];
          } else {
            vErrors.push(err13);
          }
          errors++;
        }
      }
      if (data.sources !== void 0) {
        let data6 = data.sources;
        if (Array.isArray(data6)) {
          const len1 = data6.length;
          for (let i1 = 0; i1 < len1; i1++) {
            if (!validate25(data6[i1], { instancePath: instancePath + "/sources/" + i1, parentData: data6, parentDataProperty: i1, rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate25.errors : vErrors.concat(validate25.errors);
              errors = vErrors.length;
            }
          }
        } else {
          const err14 = { instancePath: instancePath + "/sources", schemaPath: "#/properties/sources/type", keyword: "type", params: { type: "array" }, message: "must be array" };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        }
      }
      if (data.scans !== void 0) {
        let data8 = data.scans;
        if (Array.isArray(data8)) {
          if (data8.length < 1) {
            const err15 = { instancePath: instancePath + "/scans", schemaPath: "#/properties/scans/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
            if (vErrors === null) {
              vErrors = [err15];
            } else {
              vErrors.push(err15);
            }
            errors++;
          }
          const len2 = data8.length;
          for (let i2 = 0; i2 < len2; i2++) {
            if (!validate27(data8[i2], { instancePath: instancePath + "/scans/" + i2, parentData: data8, parentDataProperty: i2, rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate27.errors : vErrors.concat(validate27.errors);
              errors = vErrors.length;
            }
          }
        } else {
          const err16 = { instancePath: instancePath + "/scans", schemaPath: "#/properties/scans/type", keyword: "type", params: { type: "array" }, message: "must be array" };
          if (vErrors === null) {
            vErrors = [err16];
          } else {
            vErrors.push(err16);
          }
          errors++;
        }
      }
    } else {
      const err17 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
      if (vErrors === null) {
        vErrors = [err17];
      } else {
        vErrors.push(err17);
      }
      errors++;
    }
    validate20.errors = vErrors;
    return errors === 0;
  }
  validate20.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };

  // .tmp/bac-engine/node_modules/@noble/hashes/esm/utils.js
  function isBytes(a) {
    return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
  }
  function abytes(b, ...lengths) {
    if (!isBytes(b))
      throw new Error("Uint8Array expected");
    if (lengths.length > 0 && !lengths.includes(b.length))
      throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
  }
  function aexists(instance, checkFinished = true) {
    if (instance.destroyed)
      throw new Error("Hash instance has been destroyed");
    if (checkFinished && instance.finished)
      throw new Error("Hash#digest() has already been called");
  }
  function aoutput(out, instance) {
    abytes(out);
    const min = instance.outputLen;
    if (out.length < min) {
      throw new Error("digestInto() expects output buffer of length at least " + min);
    }
  }
  function clean(...arrays) {
    for (let i = 0; i < arrays.length; i++) {
      arrays[i].fill(0);
    }
  }
  function createView(arr) {
    return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
  }
  function rotr(word, shift) {
    return word << 32 - shift | word >>> shift;
  }
  var hasHexBuiltin = /* @__PURE__ */ (() => (
    // @ts-ignore
    typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
  ))();
  var hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
  function bytesToHex(bytes) {
    abytes(bytes);
    if (hasHexBuiltin)
      return bytes.toHex();
    let hex = "";
    for (let i = 0; i < bytes.length; i++) {
      hex += hexes[bytes[i]];
    }
    return hex;
  }
  function utf8ToBytes(str) {
    if (typeof str !== "string")
      throw new Error("string expected");
    return new Uint8Array(new TextEncoder().encode(str));
  }
  function toBytes(data) {
    if (typeof data === "string")
      data = utf8ToBytes(data);
    abytes(data);
    return data;
  }
  var Hash = class {
  };
  function createHasher(hashCons) {
    const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
    const tmp = hashCons();
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.create = () => hashCons();
    return hashC;
  }

  // .tmp/bac-engine/node_modules/@noble/hashes/esm/_md.js
  function setBigUint64(view, byteOffset, value, isLE) {
    if (typeof view.setBigUint64 === "function")
      return view.setBigUint64(byteOffset, value, isLE);
    const _32n = BigInt(32);
    const _u32_max = BigInt(4294967295);
    const wh = Number(value >> _32n & _u32_max);
    const wl = Number(value & _u32_max);
    const h = isLE ? 4 : 0;
    const l = isLE ? 0 : 4;
    view.setUint32(byteOffset + h, wh, isLE);
    view.setUint32(byteOffset + l, wl, isLE);
  }
  function Chi(a, b, c) {
    return a & b ^ ~a & c;
  }
  function Maj(a, b, c) {
    return a & b ^ a & c ^ b & c;
  }
  var HashMD = class extends Hash {
    constructor(blockLen, outputLen, padOffset, isLE) {
      super();
      this.finished = false;
      this.length = 0;
      this.pos = 0;
      this.destroyed = false;
      this.blockLen = blockLen;
      this.outputLen = outputLen;
      this.padOffset = padOffset;
      this.isLE = isLE;
      this.buffer = new Uint8Array(blockLen);
      this.view = createView(this.buffer);
    }
    update(data) {
      aexists(this);
      data = toBytes(data);
      abytes(data);
      const { view, buffer, blockLen } = this;
      const len = data.length;
      for (let pos = 0; pos < len; ) {
        const take = Math.min(blockLen - this.pos, len - pos);
        if (take === blockLen) {
          const dataView = createView(data);
          for (; blockLen <= len - pos; pos += blockLen)
            this.process(dataView, pos);
          continue;
        }
        buffer.set(data.subarray(pos, pos + take), this.pos);
        this.pos += take;
        pos += take;
        if (this.pos === blockLen) {
          this.process(view, 0);
          this.pos = 0;
        }
      }
      this.length += data.length;
      this.roundClean();
      return this;
    }
    digestInto(out) {
      aexists(this);
      aoutput(out, this);
      this.finished = true;
      const { buffer, view, blockLen, isLE } = this;
      let { pos } = this;
      buffer[pos++] = 128;
      clean(this.buffer.subarray(pos));
      if (this.padOffset > blockLen - pos) {
        this.process(view, 0);
        pos = 0;
      }
      for (let i = pos; i < blockLen; i++)
        buffer[i] = 0;
      setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE);
      this.process(view, 0);
      const oview = createView(out);
      const len = this.outputLen;
      if (len % 4)
        throw new Error("_sha2: outputLen should be aligned to 32bit");
      const outLen = len / 4;
      const state = this.get();
      if (outLen > state.length)
        throw new Error("_sha2: outputLen bigger than state");
      for (let i = 0; i < outLen; i++)
        oview.setUint32(4 * i, state[i], isLE);
    }
    digest() {
      const { buffer, outputLen } = this;
      this.digestInto(buffer);
      const res = buffer.slice(0, outputLen);
      this.destroy();
      return res;
    }
    _cloneInto(to) {
      to || (to = new this.constructor());
      to.set(...this.get());
      const { blockLen, buffer, length, finished, destroyed, pos } = this;
      to.destroyed = destroyed;
      to.finished = finished;
      to.length = length;
      to.pos = pos;
      if (length % blockLen)
        to.buffer.set(buffer);
      return to;
    }
    clone() {
      return this._cloneInto();
    }
  };
  var SHA256_IV = /* @__PURE__ */ Uint32Array.from([
    1779033703,
    3144134277,
    1013904242,
    2773480762,
    1359893119,
    2600822924,
    528734635,
    1541459225
  ]);

  // .tmp/bac-engine/node_modules/@noble/hashes/esm/sha2.js
  var SHA256_K = /* @__PURE__ */ Uint32Array.from([
    1116352408,
    1899447441,
    3049323471,
    3921009573,
    961987163,
    1508970993,
    2453635748,
    2870763221,
    3624381080,
    310598401,
    607225278,
    1426881987,
    1925078388,
    2162078206,
    2614888103,
    3248222580,
    3835390401,
    4022224774,
    264347078,
    604807628,
    770255983,
    1249150122,
    1555081692,
    1996064986,
    2554220882,
    2821834349,
    2952996808,
    3210313671,
    3336571891,
    3584528711,
    113926993,
    338241895,
    666307205,
    773529912,
    1294757372,
    1396182291,
    1695183700,
    1986661051,
    2177026350,
    2456956037,
    2730485921,
    2820302411,
    3259730800,
    3345764771,
    3516065817,
    3600352804,
    4094571909,
    275423344,
    430227734,
    506948616,
    659060556,
    883997877,
    958139571,
    1322822218,
    1537002063,
    1747873779,
    1955562222,
    2024104815,
    2227730452,
    2361852424,
    2428436474,
    2756734187,
    3204031479,
    3329325298
  ]);
  var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
  var SHA256 = class extends HashMD {
    constructor(outputLen = 32) {
      super(64, outputLen, 8, false);
      this.A = SHA256_IV[0] | 0;
      this.B = SHA256_IV[1] | 0;
      this.C = SHA256_IV[2] | 0;
      this.D = SHA256_IV[3] | 0;
      this.E = SHA256_IV[4] | 0;
      this.F = SHA256_IV[5] | 0;
      this.G = SHA256_IV[6] | 0;
      this.H = SHA256_IV[7] | 0;
    }
    get() {
      const { A, B, C, D, E, F, G, H } = this;
      return [A, B, C, D, E, F, G, H];
    }
    // prettier-ignore
    set(A, B, C, D, E, F, G, H) {
      this.A = A | 0;
      this.B = B | 0;
      this.C = C | 0;
      this.D = D | 0;
      this.E = E | 0;
      this.F = F | 0;
      this.G = G | 0;
      this.H = H | 0;
    }
    process(view, offset) {
      for (let i = 0; i < 16; i++, offset += 4)
        SHA256_W[i] = view.getUint32(offset, false);
      for (let i = 16; i < 64; i++) {
        const W15 = SHA256_W[i - 15];
        const W2 = SHA256_W[i - 2];
        const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
        const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
        SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
      }
      let { A, B, C, D, E, F, G, H } = this;
      for (let i = 0; i < 64; i++) {
        const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
        const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
        const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
        const T2 = sigma0 + Maj(A, B, C) | 0;
        H = G;
        G = F;
        F = E;
        E = D + T1 | 0;
        D = C;
        C = B;
        B = A;
        A = T1 + T2 | 0;
      }
      A = A + this.A | 0;
      B = B + this.B | 0;
      C = C + this.C | 0;
      D = D + this.D | 0;
      E = E + this.E | 0;
      F = F + this.F | 0;
      G = G + this.G | 0;
      H = H + this.H | 0;
      this.set(A, B, C, D, E, F, G, H);
    }
    roundClean() {
      clean(SHA256_W);
    }
    destroy() {
      this.set(0, 0, 0, 0, 0, 0, 0, 0);
      clean(this.buffer);
    }
  };
  var sha256 = /* @__PURE__ */ createHasher(() => new SHA256());

  // .tmp/bac-engine/node_modules/@noble/hashes/esm/sha256.js
  var sha2562 = sha256;

  // .tmp/bac-engine/src/canonicalize-browser.mjs
  function canonicalize(value) {
    if (Array.isArray(value)) return value.map(canonicalize);
    if (value !== null && typeof value === "object") {
      return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
    }
    return value;
  }
  function canonicalStringify(value) {
    return JSON.stringify(canonicalize(value));
  }
  function sha256Digest(value) {
    const bytes = new TextEncoder().encode(canonicalStringify(value));
    return `sha256:${bytesToHex(sha2562(bytes))}`;
  }

  // .tmp/bac-engine/src/verify-closure.browser.mjs
  var PROFILE_DOMAINS = [
    "AUTHORITY",
    "COMMITMENT",
    "EXECUTION",
    "OPERATIONAL_STATE"
  ];
  function compareText(left, right) {
    return left < right ? -1 : left > right ? 1 : 0;
  }
  function compareProblems(left, right) {
    return compareText(canonicalStringify(left), canonicalStringify(right));
  }
  function sortedProblems(problems) {
    return [...problems].sort(compareProblems);
  }
  function edgeKey(edge) {
    return canonicalStringify([edge.from, edge.to, edge.type]);
  }
  function transferTargetsRetiringRoot(residual, retiringRootId) {
    return residual.disposition === "TRANSFER" && residual.successor_id !== null && (residual.successor_id === "$root" || residual.successor_id === retiringRootId);
  }
  function validationError(errors) {
    return {
      runner_state: "VALIDATION_ERROR",
      errors: sortedProblems(errors)
    };
  }
  function duplicateValues(values) {
    const seen = /* @__PURE__ */ new Set();
    const duplicates = /* @__PURE__ */ new Set();
    for (const value of values) {
      if (seen.has(value)) duplicates.add(value);
      seen.add(value);
    }
    return [...duplicates].sort();
  }
  function findCycle(edges) {
    const adjacency = /* @__PURE__ */ new Map();
    for (const { from, to } of edges) {
      if (!adjacency.has(from)) adjacency.set(from, /* @__PURE__ */ new Set());
      adjacency.get(from).add(to);
    }
    const visiting = /* @__PURE__ */ new Set();
    const visited = /* @__PURE__ */ new Set();
    const stack = [];
    function visit(node) {
      if (visiting.has(node)) {
        const start = stack.indexOf(node);
        return [...stack.slice(start), node];
      }
      if (visited.has(node)) return null;
      visiting.add(node);
      stack.push(node);
      for (const next of [...adjacency.get(node) ?? []].sort()) {
        const cycle = visit(next);
        if (cycle) return cycle;
      }
      stack.pop();
      visiting.delete(node);
      visited.add(node);
      return null;
    }
    const nodes = /* @__PURE__ */ new Set([...adjacency.keys()]);
    for (const targets of adjacency.values()) {
      for (const target of targets) nodes.add(target);
    }
    for (const node of [...nodes].sort()) {
      const cycle = visit(node);
      if (cycle) return cycle;
    }
    return null;
  }
  function semanticValidation(bundle) {
    const errors = [];
    const sourceById = /* @__PURE__ */ new Map();
    const bindingByDomain = /* @__PURE__ */ new Map();
    for (const sourceId of duplicateValues(bundle.sources.map(({ id }) => id))) {
      errors.push({ code: "DUPLICATE_SOURCE_ID", source_id: sourceId });
    }
    for (const source of bundle.sources) sourceById.set(source.id, source);
    for (const domain of duplicateValues(bundle.domain_bindings.map(({ domain: domain2 }) => domain2))) {
      errors.push({ code: "DUPLICATE_DOMAIN_BINDING", domain });
    }
    for (const binding of bundle.domain_bindings) bindingByDomain.set(binding.domain, binding);
    for (const domain of PROFILE_DOMAINS) {
      if (!bindingByDomain.has(domain)) {
        errors.push({ code: "MISSING_DOMAIN_BINDING", domain });
      }
    }
    const referencedSources = /* @__PURE__ */ new Set();
    for (const binding of bundle.domain_bindings) {
      if (binding.status !== "COVERED") continue;
      for (const sourceId of binding.source_ids) {
        referencedSources.add(sourceId);
        const source = sourceById.get(sourceId);
        if (!source) {
          errors.push({
            code: "COVERED_BINDING_UNKNOWN_SOURCE",
            domain: binding.domain,
            source_id: sourceId
          });
        } else if (!source.domains.includes(binding.domain)) {
          errors.push({
            code: "SOURCE_DOES_NOT_DECLARE_DOMAIN",
            domain: binding.domain,
            source_id: sourceId
          });
        }
      }
    }
    for (const source of bundle.sources) {
      if (!referencedSources.has(source.id)) {
        errors.push({ code: "UNUSED_DECLARED_SOURCE", source_id: source.id });
      }
    }
    for (const scanId of duplicateValues(bundle.scans.map(({ scan_id }) => scan_id))) {
      errors.push({ code: "DUPLICATE_SCAN_ID", scan_id: scanId });
    }
    const identities = /* @__PURE__ */ new Map();
    const edgeLedger = /* @__PURE__ */ new Map();
    const previousBarrierBySource = /* @__PURE__ */ new Map();
    const previousObservedThroughBySource = /* @__PURE__ */ new Map();
    let previousObservedAt = -1;
    for (const scan of bundle.scans) {
      if (scan.observed_at_ms < previousObservedAt) {
        errors.push({
          code: "NON_MONOTONIC_SCAN_TIME",
          scan_id: scan.scan_id,
          observed_at_ms: scan.observed_at_ms,
          previous_observed_at_ms: previousObservedAt
        });
      }
      previousObservedAt = scan.observed_at_ms;
      const observationIds = scan.sources.map(({ source_id }) => source_id);
      for (const sourceId of duplicateValues(observationIds)) {
        errors.push({
          code: "DUPLICATE_SOURCE_OBSERVATION",
          scan_id: scan.scan_id,
          source_id: sourceId
        });
      }
      const observationIdSet = new Set(observationIds);
      for (const source of bundle.sources) {
        if (!observationIdSet.has(source.id)) {
          errors.push({
            code: "MISSING_SOURCE_OBSERVATION",
            scan_id: scan.scan_id,
            source_id: source.id
          });
        }
      }
      for (const sourceId of [...observationIdSet].sort()) {
        if (!sourceById.has(sourceId)) {
          errors.push({
            code: "UNKNOWN_SOURCE_OBSERVATION",
            scan_id: scan.scan_id,
            source_id: sourceId
          });
        }
      }
      const currentResidualIds = [];
      for (const observation of scan.sources) {
        const source = sourceById.get(observation.source_id);
        if (source) {
          const contractType = source.stability_contract.type;
          const witness = observation.stability_witness;
          const validBarrier = contractType === "MONOTONIC_BARRIER" && witness !== null && typeof witness.barrier === "number" && typeof witness.barrier_captured_at_ms === "number" && typeof witness.observed_through === "number";
          const completeBarrierObservation = contractType === "MONOTONIC_BARRIER" && observation.coverage === "COMPLETE" && observation.attribution_coverage === "COMPLETE";
          const validUnavailableBarrierWitness = contractType === "MONOTONIC_BARRIER" && !completeBarrierObservation && (witness === null || validBarrier);
          const validNullWitness = contractType !== "MONOTONIC_BARRIER" && witness === null;
          const validWitness = validBarrier || validUnavailableBarrierWitness || validNullWitness;
          if (!validWitness || completeBarrierObservation && !validBarrier) {
            errors.push({
              code: "INVALID_STABILITY_WITNESS",
              scan_id: scan.scan_id,
              source_id: observation.source_id,
              stability_contract: contractType
            });
          }
          if (validBarrier) {
            if (witness.barrier_captured_at_ms > scan.observed_at_ms) {
              errors.push({
                barrier_captured_at_ms: witness.barrier_captured_at_ms,
                code: "BARRIER_AFTER_SCAN",
                observed_at_ms: scan.observed_at_ms,
                scan_id: scan.scan_id,
                source_id: observation.source_id
              });
            }
            const previousBarrier = previousBarrierBySource.get(observation.source_id);
            if (previousBarrier !== void 0 && witness.barrier < previousBarrier) {
              errors.push({
                barrier: witness.barrier,
                code: "BARRIER_REGRESSED",
                previous_barrier: previousBarrier,
                scan_id: scan.scan_id,
                source_id: observation.source_id
              });
            }
            const previousObservedThrough = previousObservedThroughBySource.get(
              observation.source_id
            );
            if (previousObservedThrough !== void 0 && witness.observed_through < previousObservedThrough) {
              errors.push({
                code: "OBSERVED_THROUGH_REGRESSED",
                observed_through: witness.observed_through,
                previous_observed_through: previousObservedThrough,
                scan_id: scan.scan_id,
                source_id: observation.source_id
              });
            }
            previousBarrierBySource.set(observation.source_id, witness.barrier);
            previousObservedThroughBySource.set(
              observation.source_id,
              witness.observed_through
            );
          }
        }
        for (const residual of observation.residuals) {
          currentResidualIds.push(residual.id);
          if (residual.id === "$root") {
            errors.push({ code: "RESERVED_RESIDUAL_ID", scan_id: scan.scan_id, residual_id: residual.id });
            continue;
          }
          const binding = bindingByDomain.get(residual.class);
          if (binding?.status === "NOT_APPLICABLE") {
            errors.push({
              code: "RESIDUAL_IN_NOT_APPLICABLE_DOMAIN",
              domain: residual.class,
              residual_id: residual.id,
              scan_id: scan.scan_id
            });
          }
          if (source && !source.domains.includes(residual.class)) {
            errors.push({
              code: "RESIDUAL_DOMAIN_NOT_DECLARED_BY_SOURCE",
              domain: residual.class,
              residual_id: residual.id,
              scan_id: scan.scan_id,
              source_id: observation.source_id
            });
          }
          const identity = identities.get(residual.id);
          if (!identity) {
            identities.set(residual.id, {
              class: residual.class,
              source_id: observation.source_id
            });
          } else {
            if (identity.class !== residual.class) {
              errors.push({
                code: "RESIDUAL_CLASS_CHANGED",
                actual_class: residual.class,
                expected_class: identity.class,
                residual_id: residual.id,
                scan_id: scan.scan_id
              });
            }
            if (identity.source_id !== observation.source_id) {
              errors.push({
                code: "RESIDUAL_SOURCE_CHANGED",
                actual_source_id: observation.source_id,
                expected_source_id: identity.source_id,
                residual_id: residual.id,
                scan_id: scan.scan_id
              });
            }
          }
        }
      }
      for (const residualId of duplicateValues(currentResidualIds)) {
        errors.push({
          code: "DUPLICATE_RESIDUAL_OBSERVATION",
          residual_id: residualId,
          scan_id: scan.scan_id
        });
      }
      const knownThroughCurrentScan = new Set(identities.keys());
      for (const observation of scan.sources) {
        for (const edge of observation.lineage_edges) {
          if (edge.from === edge.to) {
            errors.push({
              code: "LINEAGE_SELF_EDGE",
              residual_id: edge.from,
              scan_id: scan.scan_id
            });
          }
          if (edge.to === "$root" || !knownThroughCurrentScan.has(edge.to)) {
            errors.push({
              code: "DANGLING_LINEAGE_TO",
              residual_id: edge.to,
              scan_id: scan.scan_id
            });
          }
          if (edge.from !== "$root" && !knownThroughCurrentScan.has(edge.from)) {
            errors.push({
              code: "DANGLING_LINEAGE_FROM",
              residual_id: edge.from,
              scan_id: scan.scan_id
            });
          }
          edgeLedger.set(edgeKey(edge), {
            from: edge.from,
            to: edge.to,
            type: edge.type
          });
        }
      }
    }
    const cycle = findCycle([...edgeLedger.values()]);
    if (cycle) errors.push({ code: "LINEAGE_CYCLE", path: cycle });
    return errors;
  }
  function validateEvidenceBundle(bundle) {
    if (!validate_schema_browser_default(bundle)) {
      return validationError(
        validate_schema_browser_default.errors.map((error) => ({
          code: "SCHEMA_VALIDATION_ERROR",
          instance_path: error.instancePath,
          keyword: error.keyword,
          message: error.message,
          schema_path: error.schemaPath
        }))
      );
    }
    const errors = semanticValidation(bundle);
    return errors.length > 0 ? validationError(errors) : null;
  }
  function terminality(residual, retiringRootId = null) {
    switch (residual.disposition) {
      case "NONE":
        return "NONTERMINAL";
      case "EXTINGUISH":
        if (residual.effect === "ACTIVE" || residual.root_linkage === "LIVE") {
          return "NONTERMINAL";
        }
        if (residual.root_linkage === "ENDED" && (residual.presence === "ABSENT" || residual.presence === "PRESENT" && residual.effect === "INERT")) {
          return "TERMINAL";
        }
        return "UNKNOWN";
      case "SETTLE":
        if (residual.settlement === "SETTLED" && residual.effect === "INERT" && residual.root_linkage === "ENDED") {
          return "TERMINAL";
        }
        if (residual.settlement === "PENDING" || residual.settlement === "NOT_APPLICABLE" || residual.effect === "ACTIVE" || residual.root_linkage === "LIVE") {
          return "NONTERMINAL";
        }
        return "UNKNOWN";
      case "TRANSFER":
        if (transferTargetsRetiringRoot(residual, retiringRootId)) {
          return "NONTERMINAL";
        }
        if (residual.root_linkage === "ENDED" && residual.successor_id !== null && residual.transfer_acceptance === "ACCEPTED") {
          return "TERMINAL";
        }
        if (residual.root_linkage === "LIVE" || residual.successor_id === null || residual.transfer_acceptance === "REJECTED" || residual.transfer_acceptance === "NOT_APPLICABLE") {
          return "NONTERMINAL";
        }
        return "UNKNOWN";
      case "RETAIN":
        if (residual.presence === "PRESENT" && residual.effect === "INERT" && residual.root_linkage === "ENDED") {
          return "TERMINAL";
        }
        if (residual.presence === "ABSENT" || residual.effect === "ACTIVE" || residual.root_linkage === "LIVE") {
          return "NONTERMINAL";
        }
        return "UNKNOWN";
      default:
        throw new Error(`Unsupported disposition: ${residual.disposition}`);
    }
  }
  function adjacencyFor(edges) {
    const adjacency = /* @__PURE__ */ new Map();
    for (const edge of edges) {
      if (!adjacency.has(edge.from)) adjacency.set(edge.from, /* @__PURE__ */ new Set());
      adjacency.get(edge.from).add(edge.to);
    }
    return adjacency;
  }
  function closureCone(edges) {
    const adjacency = adjacencyFor(edges);
    const reachable = /* @__PURE__ */ new Set();
    const queue = ["$root"];
    for (let index = 0; index < queue.length; index += 1) {
      const node = queue[index];
      for (const next of [...adjacency.get(node) ?? []].sort()) {
        if (!reachable.has(next)) {
          reachable.add(next);
          queue.push(next);
        }
      }
    }
    return reachable;
  }
  function lineagePath(edges, target) {
    const adjacency = adjacencyFor(edges);
    const queue = [["$root"]];
    const visited = /* @__PURE__ */ new Set(["$root"]);
    for (let index = 0; index < queue.length; index += 1) {
      const path = queue[index];
      const node = path.at(-1);
      for (const next of [...adjacency.get(node) ?? []].sort()) {
        const nextPath = [...path, next];
        if (next === target) return nextPath;
        if (!visited.has(next)) {
          visited.add(next);
          queue.push(nextPath);
        }
      }
    }
    return [];
  }
  function normalizedBindings(bundle) {
    return bundle.domain_bindings.map((binding) => ({
      domain: binding.domain,
      source_ids: [...binding.source_ids].sort(),
      status: binding.status
    })).sort((left, right) => compareText(left.domain, right.domain));
  }
  function normalizedSources(bundle, includeContract = false) {
    return bundle.sources.map((source) => ({
      domains: [...source.domains].sort(),
      id: source.id,
      ...includeContract ? { stability_contract: source.stability_contract } : {}
    })).sort((left, right) => compareText(left.id, right.id));
  }
  function scopeDigest(bundle) {
    return sha256Digest({
      domain_bindings: normalizedBindings(bundle),
      profile_id: bundle.profile_id,
      root_id: bundle.root.id,
      sources: normalizedSources(bundle, true),
      spec_version: bundle.spec_version,
      time_basis: bundle.time_basis
    });
  }
  function evidenceBundleDigest(bundle) {
    return sha256Digest(bundle);
  }
  function semanticClosureCone(bundle, cone, currentResiduals, edges) {
    const residuals = [...cone].sort().map((id) => {
      const { residual, source_id: owningSource } = currentResiduals.get(id);
      return {
        class: residual.class,
        disposition: residual.disposition,
        effect: residual.effect,
        id: residual.id,
        owning_source: owningSource,
        presence: residual.presence,
        root_linkage: residual.root_linkage,
        settlement: residual.settlement,
        successor_id: residual.successor_id,
        transfer_acceptance: residual.transfer_acceptance
      };
    });
    const includedNodes = /* @__PURE__ */ new Set(["$root", ...cone]);
    const includedEdges = edges.filter(({ from, to }) => includedNodes.has(from) && includedNodes.has(to)).map(({ from, to, type }) => ({ from, to, type })).sort(
      (left, right) => compareText(left.from, right.from) || compareText(left.to, right.to) || compareText(left.type, right.type)
    );
    return {
      domain_bindings: normalizedBindings(bundle),
      edges: includedEdges,
      profile_id: bundle.profile_id,
      residuals,
      root: {
        id: bundle.root.id,
        new_business_authority: bundle.root.new_business_authority
      },
      sources: normalizedSources(bundle)
    };
  }
  function sourceUnknowns(bundle, scan) {
    const sourceById = new Map(bundle.sources.map((source) => [source.id, source]));
    const unknowns = [];
    for (const observation of [...scan.sources].sort((a, b) => compareText(a.source_id, b.source_id))) {
      const source = sourceById.get(observation.source_id);
      if (observation.coverage === "PARTIAL") {
        unknowns.push({ code: "SOURCE_COVERAGE_PARTIAL", source_id: observation.source_id });
      } else if (observation.coverage === "UNAVAILABLE") {
        unknowns.push({ code: "SOURCE_UNAVAILABLE", source_id: observation.source_id });
      }
      if (observation.attribution_coverage === "PARTIAL") {
        unknowns.push({ code: "ATTRIBUTION_COVERAGE_PARTIAL", source_id: observation.source_id });
      } else if (observation.attribution_coverage === "UNAVAILABLE") {
        unknowns.push({ code: "ATTRIBUTION_UNAVAILABLE", source_id: observation.source_id });
      }
      const contract = source.stability_contract;
      if (contract.type === "UNBOUNDED") {
        unknowns.push({ code: "UNBOUNDED_STABILITY", source_id: source.id });
      } else if (contract.type === "MONOTONIC_BARRIER" && observation.stability_witness !== null) {
        if (observation.stability_witness.barrier_captured_at_ms < bundle.root.quiesced_at_ms) {
          unknowns.push({
            code: "BARRIER_PRECEDES_QUIESCENCE",
            source_id: source.id
          });
        }
        if (observation.stability_witness.observed_through < observation.stability_witness.barrier) {
          unknowns.push({
            code: "STABILITY_NOT_SATISFIED",
            source_id: source.id,
            stability_contract: "MONOTONIC_BARRIER"
          });
        }
      } else if (contract.type === "BOUNDED_LAG" && scan.observed_at_ms < bundle.root.quiesced_at_ms + contract.max_visibility_lag_ms) {
        unknowns.push({
          code: "STABILITY_NOT_SATISFIED",
          source_id: source.id,
          stability_contract: "BOUNDED_LAG"
        });
      }
    }
    return unknowns;
  }
  function boundedLagConfirmationUnknowns(bundle, previousScan, finalScan) {
    const elapsedMs = finalScan.observed_at_ms - previousScan.observed_at_ms;
    return sortedProblems(
      bundle.sources.filter(({ stability_contract: contract }) => contract.type === "BOUNDED_LAG").filter(
        ({ stability_contract: contract }) => elapsedMs < contract.max_visibility_lag_ms
      ).map((source) => ({
        code: "BOUNDED_LAG_CONFIRMATION_WINDOW_NOT_ELAPSED",
        required_lag_ms: source.stability_contract.max_visibility_lag_ms,
        source_id: source.id
      }))
    );
  }
  function evaluatePass(bundle, scan, cone, currentResiduals, edges) {
    const blockers = [];
    const unknowns = sourceUnknowns(bundle, scan);
    if (scan.observed_at_ms < bundle.root.quiesced_at_ms) {
      unknowns.push({ code: "SCAN_PRECEDES_QUIESCENCE", scan_id: scan.scan_id });
    }
    if (bundle.root.new_business_authority === "ACTIVE") {
      blockers.push({ code: "ROOT_AUTHORITY_ACTIVE", root_id: bundle.root.id });
    } else if (bundle.root.new_business_authority === "UNKNOWN") {
      unknowns.push({ code: "ROOT_AUTHORITY_UNKNOWN", root_id: bundle.root.id });
    }
    for (const residualId of [...cone].sort()) {
      const observed = currentResiduals.get(residualId);
      if (!observed) {
        unknowns.push({ code: "NODE_NOT_REOBSERVED", residual_id: residualId });
        continue;
      }
      const state = terminality(observed.residual, bundle.root.id);
      if (state === "NONTERMINAL") {
        blockers.push({
          code: observed.residual.disposition === "NONE" ? "RESIDUAL_DISPOSITION_NONE" : transferTargetsRetiringRoot(observed.residual, bundle.root.id) ? "TRANSFER_TO_RETIRING_ROOT" : "RESIDUAL_NONTERMINAL",
          path: lineagePath(edges, residualId),
          residual_id: residualId,
          source_id: observed.source_id
        });
      } else if (state === "UNKNOWN") {
        unknowns.push({
          code: "RESIDUAL_TERMINALITY_UNKNOWN",
          path: lineagePath(edges, residualId),
          residual_id: residualId,
          source_id: observed.source_id
        });
      }
    }
    const sortedBlockers = sortedProblems(blockers);
    const sortedUnknowns = sortedProblems(unknowns);
    const terminalQualified = sortedBlockers.length === 0 && sortedUnknowns.length === 0;
    const semantic = terminalQualified ? semanticClosureCone(bundle, cone, currentResiduals, edges) : null;
    return {
      blockers: sortedBlockers,
      pass: {
        scan_id: scan.scan_id,
        closure_cone_nodes: cone.size,
        terminal_qualified: terminalQualified,
        semantic_signature: semantic === null ? null : sha256Digest(semantic)
      },
      unknowns: sortedUnknowns
    };
  }
  function verifyClosure(bundle) {
    const invalid = validateEvidenceBundle(bundle);
    if (invalid) return invalid;
    const edgeLedger = /* @__PURE__ */ new Map();
    const passes = [];
    const passDetails = [];
    for (const scan of bundle.scans) {
      const currentResiduals = /* @__PURE__ */ new Map();
      for (const observation of scan.sources) {
        for (const residual of observation.residuals) {
          currentResiduals.set(residual.id, {
            residual,
            source_id: observation.source_id
          });
        }
        for (const edge of observation.lineage_edges) {
          edgeLedger.set(edgeKey(edge), {
            from: edge.from,
            to: edge.to,
            type: edge.type
          });
        }
      }
      const edges = [...edgeLedger.values()].sort(
        (left, right) => compareText(left.from, right.from) || compareText(left.to, right.to) || compareText(left.type, right.type)
      );
      const cone = closureCone(edges);
      const detail = evaluatePass(bundle, scan, cone, currentResiduals, edges);
      passes.push(detail.pass);
      passDetails.push(detail);
    }
    const latestIndex = passes.length - 1;
    const latest = passDetails[latestIndex];
    const previous = latestIndex > 0 ? passDetails[latestIndex - 1] : null;
    let blockers = [...latest.blockers];
    let unknowns = [...latest.unknowns];
    let verdict;
    if (blockers.length > 0) {
      verdict = "INCOMPLETE";
    } else if (unknowns.length > 0) {
      verdict = "UNKNOWN";
    } else if (latest.pass.terminal_qualified && previous?.pass.terminal_qualified) {
      if (latest.pass.semantic_signature !== previous.pass.semantic_signature) {
        verdict = "INCOMPLETE";
        blockers = sortedProblems([
          {
            code: "CONE_NOT_STABLE",
            scan_ids: [previous.pass.scan_id, latest.pass.scan_id]
          }
        ]);
      } else {
        const confirmationUnknowns = boundedLagConfirmationUnknowns(
          bundle,
          bundle.scans[latestIndex - 1],
          bundle.scans[latestIndex]
        );
        if (confirmationUnknowns.length > 0) {
          verdict = "UNKNOWN";
          unknowns = confirmationUnknowns;
        } else {
          verdict = "CLOSED";
        }
      }
    } else {
      verdict = "UNKNOWN";
      unknowns = sortedProblems([
        ...unknowns,
        { code: "SECOND_CONFIRMATION_MISSING", scan_id: latest.pass.scan_id }
      ]);
    }
    let certificate = null;
    if (verdict === "CLOSED") {
      certificate = {
        claim: "CLOSED within RISU_AGENT_CLOSURE_V0 and the declared source contracts.",
        closure_cone_digest: latest.pass.semantic_signature,
        closure_cone_nodes: latest.pass.closure_cone_nodes,
        domain_status: Object.fromEntries(
          [...bundle.domain_bindings].sort((left, right) => compareText(left.domain, right.domain)).map(({ domain, status }) => [domain, status])
        ),
        evidence_bundle_digest: evidenceBundleDigest(bundle),
        profile_id: bundle.profile_id,
        root_id: bundle.root.id,
        scope_digest: scopeDigest(bundle),
        terminal_scan_ids: [previous.pass.scan_id, latest.pass.scan_id],
        unknown_count: 0
      };
    }
    return {
      verdict,
      latest_scan_id: bundle.scans.at(-1).scan_id,
      blockers: sortedProblems(blockers),
      unknowns: sortedProblems(unknowns),
      passes,
      certificate
    };
  }

  // .tmp/bac-inspector/inspector/presentation.mjs
  var EXPLANATIONS = Object.freeze({
    RESIDUAL_NONTERMINAL: "A reachable residual was classified as nonterminal.",
    RESIDUAL_DISPOSITION_NONE: "A reachable residual has no terminal disposition.",
    TRANSFER_TO_RETIRING_ROOT: "A transfer targets the retiring root and remains nonterminal.",
    ROOT_AUTHORITY_ACTIVE: "The retiring root still has active new-business authority.",
    CONE_NOT_STABLE: "The final qualified observations have different semantic signatures.",
    SOURCE_COVERAGE_PARTIAL: "The source reports only partial coverage.",
    SOURCE_UNAVAILABLE: "The source was unavailable for this observation.",
    ATTRIBUTION_COVERAGE_PARTIAL: "The source reports only partial root-attribution coverage.",
    ATTRIBUTION_UNAVAILABLE: "Root-attribution coverage was unavailable.",
    UNBOUNDED_STABILITY: "The declared source contract does not establish a bounded visibility horizon.",
    BARRIER_PRECEDES_QUIESCENCE: "The stability barrier was captured before root quiescence.",
    STABILITY_NOT_SATISFIED: "The declared source stability condition was not satisfied.",
    SCAN_PRECEDES_QUIESCENCE: "The scan occurred before the declared root quiescence point.",
    ROOT_AUTHORITY_UNKNOWN: "The root authority state is unknown.",
    NODE_NOT_REOBSERVED: "A known lineage node was not reobserved in the scan.",
    RESIDUAL_TERMINALITY_UNKNOWN: "The observed residual state does not establish terminality.",
    SECOND_CONFIRMATION_MISSING: "A second matching terminal-qualified observation is required.",
    BOUNDED_LAG_CONFIRMATION_WINDOW_NOT_ELAPSED: "The final confirmation interval is shorter than the declared visibility lag.",
    SCHEMA_VALIDATION_ERROR: "The evidence does not conform to the required bundle schema.",
    DUPLICATE_SOURCE_ID: "A source identifier is declared more than once.",
    DUPLICATE_DOMAIN_BINDING: "A domain binding is declared more than once.",
    MISSING_DOMAIN_BINDING: "A required profile domain binding is missing.",
    COVERED_BINDING_UNKNOWN_SOURCE: "A covered domain binding references an undeclared source.",
    SOURCE_DOES_NOT_DECLARE_DOMAIN: "The bound source does not declare the referenced domain.",
    UNUSED_DECLARED_SOURCE: "A declared source is not used by a covered domain binding.",
    DUPLICATE_SCAN_ID: "A scan identifier is used more than once.",
    NON_MONOTONIC_SCAN_TIME: "Scan observation time regressed.",
    DUPLICATE_SOURCE_OBSERVATION: "A scan contains duplicate observations for one source.",
    MISSING_SOURCE_OBSERVATION: "A declared source has no observation in the scan.",
    UNKNOWN_SOURCE_OBSERVATION: "A scan contains an observation for an undeclared source.",
    INVALID_STABILITY_WITNESS: "A source observation has an invalid stability witness.",
    BARRIER_AFTER_SCAN: "A stability barrier was captured after its containing scan.",
    BARRIER_REGRESSED: "A source stability barrier regressed between scans.",
    OBSERVED_THROUGH_REGRESSED: "A source observed-through position regressed between scans.",
    RESERVED_RESIDUAL_ID: "A residual uses the reserved root sentinel identifier.",
    RESIDUAL_IN_NOT_APPLICABLE_DOMAIN: "A residual appears in a domain declared not applicable.",
    RESIDUAL_DOMAIN_NOT_DECLARED_BY_SOURCE: "A residual class is not declared by its owning source.",
    RESIDUAL_CLASS_CHANGED: "A residual changed class between observations.",
    RESIDUAL_SOURCE_CHANGED: "A residual changed owning source between observations.",
    DUPLICATE_RESIDUAL_OBSERVATION: "A residual is observed more than once in one scan.",
    LINEAGE_SELF_EDGE: "A lineage edge points from a residual to itself.",
    DANGLING_LINEAGE_TO: "A lineage edge targets an unknown residual.",
    DANGLING_LINEAGE_FROM: "A lineage edge starts at an unknown residual.",
    LINEAGE_CYCLE: "The supplied lineage contains a cycle.",
    MALFORMED_JSON: "The uploaded file is not valid JSON.",
    REQUEST_BODY_TOO_LARGE: "The uploaded evidence exceeds the local request-size limit."
  });
  var FACT_FIELDS = Object.freeze([
    "class",
    "disposition",
    "presence",
    "effect",
    "root_linkage",
    "settlement",
    "successor_id",
    "transfer_acceptance"
  ]);
  var PHASE1_PROVENANCE = Object.freeze({
    tag: "phase1-freeze-v0.3",
    commit: "a46456f028cd3dd1d386111b1faab890a26ae5e9"
  });
  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }
  function compareText2(left, right) {
    const leftText = String(left);
    const rightText = String(right);
    return leftText < rightText ? -1 : leftText > rightText ? 1 : 0;
  }
  function copy(value) {
    return value === void 0 ? void 0 : structuredClone(value);
  }
  function explainCode(code) {
    return EXPLANATIONS[code] ?? "No display explanation is registered for this machine code.";
  }
  function presentProblem(problem) {
    const code = typeof problem?.code === "string" ? problem.code : "UNRECOGNIZED_CODE";
    return {
      code,
      explanation: explainCode(code),
      facts: copy(problem ?? {})
    };
  }
  function flattenScan(scan) {
    const residuals = [];
    const edges = [];
    for (const observation of asArray(scan?.sources)) {
      for (const residual of asArray(observation?.residuals)) {
        residuals.push({
          ...copy(residual),
          source_id: observation.source_id
        });
      }
      for (const edge of asArray(observation?.lineage_edges)) {
        edges.push({
          ...copy(edge),
          source_id: observation.source_id
        });
      }
    }
    residuals.sort((left, right) => compareText2(left.id, right.id));
    edges.sort(
      (left, right) => compareText2(left.from, right.from) || compareText2(left.to, right.to) || compareText2(left.type, right.type)
    );
    return { residuals, edges };
  }
  function diffResidual(previous, current, seenBefore = false) {
    if (!previous) {
      return [
        {
          field: "observation",
          before: seenBefore ? "NOT_REOBSERVED" : null,
          after: seenBefore ? "REOBSERVED" : "FIRST_OBSERVED"
        }
      ];
    }
    const changes = [];
    for (const field of FACT_FIELDS) {
      if (previous[field] !== current[field]) {
        changes.push({ field, before: previous[field], after: current[field] });
      }
    }
    const previousReport = previous.action_report?.reported ?? null;
    const currentReport = current.action_report?.reported ?? null;
    if (previousReport !== currentReport) {
      changes.push({
        field: "action_report.reported",
        before: previousReport,
        after: currentReport
      });
    }
    return changes;
  }
  function scanPresentations(bundle, evaluation) {
    const passById = new Map(
      asArray(evaluation?.passes).map((pass) => [pass.scan_id, pass])
    );
    const edgeLedger = /* @__PURE__ */ new Map();
    const identityLedger = /* @__PURE__ */ new Map();
    const seenResidualIds = /* @__PURE__ */ new Set();
    let previousResiduals = /* @__PURE__ */ new Map();
    return asArray(bundle?.scans).map((scan, index) => {
      const seenBeforeScan = new Set(seenResidualIds);
      const flattened = flattenScan(scan);
      const currentResiduals = new Map(
        flattened.residuals.map((residual) => [residual.id, residual])
      );
      for (const residual of flattened.residuals) {
        identityLedger.set(residual.id, {
          id: residual.id,
          class: residual.class,
          source_id: residual.source_id
        });
      }
      for (const edge of flattened.edges) {
        const key = JSON.stringify([edge.from, edge.to, edge.type]);
        edgeLedger.set(key, edge);
      }
      const nodes = [
        {
          id: "$root",
          label: bundle?.root?.id ?? "$root",
          kind: "ROOT",
          observed: true,
          facts: copy(bundle?.root ?? {})
        },
        ...[...identityLedger.values()].sort((left, right) => compareText2(left.id, right.id)).map((identity) => {
          const residual = currentResiduals.get(identity.id);
          return {
            id: identity.id,
            label: identity.id,
            kind: "RESIDUAL",
            observed: Boolean(residual),
            class: residual?.class ?? identity.class,
            source_id: residual?.source_id ?? identity.source_id,
            facts: copy(residual ?? identity),
            changes: residual ? diffResidual(
              previousResiduals.get(identity.id),
              residual,
              seenBeforeScan.has(identity.id)
            ) : []
          };
        })
      ];
      for (const residual of flattened.residuals) {
        seenResidualIds.add(residual.id);
      }
      previousResiduals = currentResiduals;
      return {
        index,
        scan_id: scan.scan_id,
        observed_at_ms: scan.observed_at_ms,
        pass: copy(passById.get(scan.scan_id) ?? null),
        sources: copy(asArray(scan.sources)),
        nodes,
        edges: [...edgeLedger.values()].map(copy)
      };
    });
  }
  function verdictCopy(verdict) {
    if (verdict === "INCOMPLETE") {
      return {
        summary: "A known blocker prevents bounded operational closure.",
        detail: "The verifier reported one or more closure blockers."
      };
    }
    if (verdict === "UNKNOWN") {
      return {
        summary: "Available evidence is insufficient to establish closure.",
        detail: "No known blocker establishes failure. Closure is not established either."
      };
    }
    if (verdict === "CLOSED") {
      return {
        summary: "Closure was established within the declared profile and source contracts.",
        detail: "The final two scans were terminal-qualified with the same semantic signature, and no remaining confirmation uncertainty prevented closure."
      };
    }
    return {
      summary: "No closure verdict was supplied.",
      detail: "The presentation does not infer a verdict from evidence fields."
    };
  }
  function actionReports(bundle) {
    const reports = [];
    for (const scan of asArray(bundle?.scans)) {
      for (const observation of asArray(scan?.sources)) {
        for (const residual of asArray(observation?.residuals)) {
          if (residual.action_report) {
            reports.push({
              scan_id: scan.scan_id,
              residual_id: residual.id,
              reported_operation: copy(residual.action_report),
              observed_state: {
                presence: residual.presence,
                effect: residual.effect,
                root_linkage: residual.root_linkage
              }
            });
          }
        }
      }
    }
    return reports;
  }
  function actionReportsForBlockers(bundle, blockers, latestScanId) {
    const blockerKeys = new Set(
      asArray(blockers).filter((problem) => typeof problem?.residual_id === "string").map(
        (problem) => JSON.stringify([problem.residual_id, problem.source_id ?? null])
      )
    );
    if (!blockerKeys.size) return [];
    const latestScan = asArray(bundle?.scans).find(
      (scan) => scan?.scan_id === latestScanId
    );
    if (!latestScan) return [];
    const reports = [];
    for (const observation of asArray(latestScan.sources)) {
      for (const residual of asArray(observation?.residuals)) {
        if (!residual.action_report) continue;
        const exactKey = JSON.stringify([residual.id, observation.source_id ?? null]);
        const idOnlyKey = JSON.stringify([residual.id, null]);
        if (!blockerKeys.has(exactKey) && !blockerKeys.has(idOnlyKey)) continue;
        reports.push({
          scan_id: latestScan.scan_id,
          residual_id: residual.id,
          source_id: observation.source_id ?? null,
          reported_operation: copy(residual.action_report),
          observed_state: {
            presence: residual.presence,
            effect: residual.effect,
            root_linkage: residual.root_linkage
          }
        });
      }
    }
    return reports;
  }
  function transfers(bundle) {
    const found = [];
    for (const scan of asArray(bundle?.scans)) {
      for (const observation of asArray(scan?.sources)) {
        for (const residual of asArray(observation?.residuals)) {
          if (residual.disposition === "TRANSFER") {
            found.push({
              scan_id: scan.scan_id,
              residual_id: residual.id,
              presence: residual.presence,
              effect: residual.effect,
              root_linkage: residual.root_linkage,
              successor_id: residual.successor_id,
              transfer_acceptance: residual.transfer_acceptance
            });
          }
        }
      }
    }
    return found;
  }
  function presentValidationError(evaluation) {
    return {
      runner_state: "VALIDATION_ERROR",
      title: "Evidence could not be evaluated",
      notice: "No verdict issued.",
      errors: asArray(evaluation?.errors).map(presentProblem)
    };
  }
  function presentParseError(code = "MALFORMED_JSON", message = "Invalid JSON.") {
    return {
      runner_state: "PARSE_ERROR",
      title: "Evidence could not be evaluated",
      notice: "No verdict issued.",
      errors: [
        {
          code,
          explanation: explainCode(code),
          facts: { code, message }
        }
      ]
    };
  }
  function presentEvaluation(bundle, evaluation, metadata = null) {
    if (evaluation?.runner_state === "VALIDATION_ERROR") {
      return presentValidationError(evaluation);
    }
    const verdict = evaluation?.verdict ?? null;
    const rawBlockers = asArray(evaluation?.blockers);
    const blockers = rawBlockers.map(presentProblem);
    const unknowns = asArray(evaluation?.unknowns).map(presentProblem);
    const bindings = asArray(bundle?.domain_bindings);
    const scans = scanPresentations(bundle, evaluation);
    return {
      runner_state: "EVALUATED",
      verdict,
      verdict_copy: verdictCopy(verdict),
      root: {
        id: bundle?.root?.id ?? null,
        authority: bundle?.root?.new_business_authority ?? null
      },
      profile_id: bundle?.profile_id ?? null,
      latest_scan_id: evaluation?.latest_scan_id ?? null,
      closure_cone_nodes: asArray(evaluation?.passes).at(-1)?.closure_cone_nodes ?? null,
      declared_domain_count: bindings.length,
      covered_domain_count: bindings.filter((binding) => binding.status === "COVERED").length,
      not_applicable_domain_count: bindings.filter(
        (binding) => binding.status === "NOT_APPLICABLE"
      ).length,
      blockers,
      unknowns,
      blocker_paths: blockers.map(({ facts }) => facts.path).filter((path) => Array.isArray(path)).map(copy),
      scans,
      action_reports: actionReports(bundle),
      reason_action_reports: actionReportsForBlockers(
        bundle,
        rawBlockers,
        evaluation?.latest_scan_id ?? null
      ),
      transfers: transfers(bundle),
      certificate: copy(evaluation?.certificate ?? null),
      metadata: copy(metadata),
      provenance: copy(PHASE1_PROVENANCE)
    };
  }

  // .tmp/browser-build/entry.mjs
  var MAX_BODY_BYTES = 1024 * 1024;
  function result(status, body) {
    return { status, body };
  }
  function evaluateRequest({ method, contentType, raw }) {
    if (method !== "POST") return result(405, { runner_state: "REQUEST_ERROR", error: { code: "METHOD_NOT_ALLOWED" } });
    if (String(contentType ?? "").split(";", 1)[0].trim().toLowerCase() !== "application/json") {
      return result(415, { runner_state: "REQUEST_ERROR", error: { code: "UNSUPPORTED_MEDIA_TYPE" } });
    }
    if (new TextEncoder().encode(String(raw ?? "")).byteLength > MAX_BODY_BYTES) {
      const message = "Request body exceeds 1 MiB.";
      return result(413, { runner_state: "PARSE_ERROR", presentation: presentParseError("REQUEST_BODY_TOO_LARGE", message) });
    }
    let bundle;
    try {
      bundle = JSON.parse(String(raw ?? ""));
    } catch (error) {
      return result(400, { runner_state: "PARSE_ERROR", presentation: presentParseError("MALFORMED_JSON", error.message) });
    }
    const evaluation = verifyClosure(bundle);
    return result(200, { evaluation, presentation: presentEvaluation(bundle, evaluation) });
  }
  self.addEventListener("message", (event) => {
    const message = event.data ?? {};
    if (message.type !== "evaluate" || typeof message.id !== "string") return;
    try {
      const response = evaluateRequest(message.request ?? {});
      self.postMessage({ type: "result", id: message.id, ...response });
    } catch {
      self.postMessage({ type: "result", id: message.id, status: 500, body: { runner_state: "REQUEST_ERROR", error: { code: "INTERNAL_WORKER_ERROR" } } });
    }
  });
  self.postMessage({ type: "ready" });
})();
