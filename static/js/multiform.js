/*
 *
 * MultiForm 0.1 - Replicate a set of fields in a form for a one-to-many form.
 * Version 0.1b
 * @requires jQuery v3.2.1
 *
 * Copyright (c) 2017 Malcolm VanOrder
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 *
 */

// https://tc39.github.io/ecma262/#sec-array.prototype.includes
if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, 'includes', {
    value: function(searchElement, fromIndex) {

      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      // 1. Let O be ? ToObject(this value).
      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If len is 0, return false.
      if (len === 0) {
        return false;
      }

      // 4. Let n be ? ToInteger(fromIndex).
      //    (If fromIndex is undefined, this step produces the value 0.)
      var n = fromIndex | 0;

      // 5. If n ≥ 0, then
      //  a. Let k be n.
      // 6. Else n < 0,
      //  a. Let k be len + n.
      //  b. If k < 0, let k be 0.
      var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

      function sameValueZero(x, y) {
        return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
      }

      // 7. Repeat, while k < len
      while (k < len) {
        // a. Let elementK be the result of ? Get(O, ! ToString(k)).
        // b. If SameValueZero(searchElement, elementK) is true, return true.
        if (sameValueZero(o[k], searchElement)) {
          return true;
        }
        // c. Increase k by 1.
        k++;
      }

      // 8. Return false
      return false;
    }
  });
}

var FORM_ELEMENTS = ["DATALIST", "INPUT", "OPTGROUP", "SELECT", "TEXTAREA"];

/**
 * Clone nodes and add a prefix to ids, names, and for attributes on fields and labels.
 * @param {object} nodes - A nodes list of array of nodes to be cloned.
 * @param {string} prefix - The prefix to be added to the ids, names, and for attributes.
 */
function cloneFormNodes(nodes, prefix) {
  var newNodes = new Array();

  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].nodeName != "#text") {
      // Use createElement to create clones for all except #text nodes to avoid modifying the original.
      newNodes[i] = document.createElement(nodes[i].nodeName);

      // Copy all attributes from the original node to the new node
      for (var attrIndex = 0, attrSize = nodes[i].attributes.length; attrIndex < attrSize; attrIndex++) {
        newNodes[i].setAttribute(nodes[i].attributes[attrIndex].name, nodes[i].attributes[attrIndex].value);
      }

      if (FORM_ELEMENTS.includes(nodes[i].nodeName)) {
        // Prefix ids and names on fields.
        newNodes[i].name = prefix + nodes[i].name;
        newNodes[i].id = prefix + nodes[i].id;
      } else if (nodes[i].nodeName == "LABEL") {
        // Prefix for attributes on labels.
        newNodes[i].setAttribute('for', prefix + nodes[i].getAttribute('for'));
      } else {
        // If an element doesn't fall into either of the above statements then only apply the prefix if an is or name
        // exists.
        if (nodes[i].id) {
          newNodes[i].id = prefix + nodes[i].id;
        }
        if (nodes[i].name) {
          newNodes[i].name = prefix + nodes[i].name;
        }
      }
    } else {
      // Clone any simple #text nodes.
      newNodes[i] = nodes[i].cloneNode(true)
    }

    // If the current node has children, process them as well.
    if (nodes[i].childNodes.length > 0) {
      var newChildNodes = cloneFormNodes(nodes[i].childNodes, prefix);
      for (var childNodeIndex = 0, size = newChildNodes.length; childNodeIndex < size ; childNodeIndex++) {
        newNodes[i].appendChild(newChildNodes[childNodeIndex])
      }
    }
  }
  return newNodes;
}

/**
 * Represents a template instance of the form to be replicated.
 * @constructor
 * @param {object} baseObject - The DOM object containing the form objects to be templated.
 * @param {string} prefix - The prefix to set on all field names.
 */
function Template(baseObject, prefix) {
  this.nodes = Array();
  this.prefix = prefix;
  this.currentIteration = 0;

  // Create a template list of nodes from the nodes in the baseObject and remove the original nodes.
  for (var nodeIndex = 0, nodeCount = baseObject.childNodes.length; nodeIndex < nodeCount; nodeIndex++) {
    this.nodes[nodeIndex] = baseObject.childNodes[0].cloneNode(true);
    baseObject.removeChild(baseObject.childNodes[0]);
  }

  /**
   * Creates a new instance from the template.
   * @return {object} A div element containing a clone of the nodes in this template.
   */
  this.createInstance = function() {
    var prefix = "";
    var nodes;
    var instanceContainer = document.createElement('div');

    // Set up the instance prefix as "[<prefix>_]<iteration>-".
    if (this.prefix) {
      prefix = this.prefix + "_";
    }
    prefix += this.currentIteration.toString() + "-";

    // Create a set of nodes and populate the new container.
    nodes = cloneFormNodes(this.nodes, prefix);
    for(var node in nodes) {
      instanceContainer.appendChild(nodes[node]);
    }

    // Increment the iteration counter.
    this.currentIteration++;

    return instanceContainer;
  }
}

/**
 * Represents the container for the multiform instances and controls.
 * @constructor
 * @param {object} containerObject - The DOM object containing multiform.
 */
function MultiformContainer(containerObject) {
  this.container = containerObject;
  this.controlsContainer = document.createElement('div');
  this.addButton = document.createElement('div');

  this.addButton.innerHTML = 'Add';
  this.addButton.setAttribute('type', 'button');
  this.addButton.setAttribute('class', 'btn btn-success');
  this.addButton.setAttribute('id', 'multiform-add');
  this.controlsContainer.appendChild(this.addButton);
  this.container.appendChild(this.controlsContainer);

  /**
   * Append a child to the container.  This is simply created to prevent container.container.appendChild()
   * @param {object} child - The DOM object to append to the container
   */
  this.appendChild = function(child) {
    this.container.appendChild(child);
  }
}

(function( $ ) {
  /**
   * Build a multi-record form from a jQuery selector.
   * @param {string} prefix - The prefix to set on all field names.
   */
  $.fn.multiForm = function(prefix) {
    // Create a template object from the first object in the jQuery selector.
    var template = new Template(this[0], prefix);

    var container = new MultiformContainer(this[0]);

    // Create an instance of the template to start the form.
    container.appendChild(template.createInstance());

    // When the add button is clicked create an instance of the template and append it to the container.
    $("#multiform-add").click(function() {
      container.appendChild(template.createInstance());
    });

    return this;
  };
}( jQuery ));