/**
 * @fileoverview A rule to set the maximum number of statements in a function.
 * @author Ian Christian Myers
 * @copyright 2013 Ian Christian Myers. All rights reserved.
 */

"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function(context) {

    //--------------------------------------------------------------------------
    // Helpers
    //--------------------------------------------------------------------------

    var functionStack = [],
        maxStatements = context.options[0] || 10,
        ignoreTopLevelFunctions = context.options[1] && context.options[1].ignoreTopLevelFunctions || false,
        topLevelFunctions = [];

    /**
     * Reports a node if it has too many statements
     * @param {ASTNode} node node to evaluate
     * @param {int} count Number of statements in node
     * @param {int} max Maximum number of statements allowed
     * @returns {void}
     * @private
     */
    function reportIfTooManyStatements(node, count, max) {
        if (count > max) {
            context.report(
                node,
                "This function has too many statements ({{count}}). Maximum allowed is {{max}}.",
                { count: count, max: max });
        }
    }

    /**
     * When parsing a new function, store it in our function stack
     * @returns {void}
     * @private
     */
    function startFunction() {
        functionStack.push(0);
    }

    /**
     * Evaluate the node at the end of function
     * @param {ASTNode} node node to evaluate
     * @returns {void}
     * @private
     */
    function endFunction(node) {
        var count = functionStack.pop();
        if (ignoreTopLevelFunctions && functionStack.length === 0) {
            topLevelFunctions.push({ node: node, count: count});
        } else {
            reportIfTooManyStatements(node, count, maxStatements);
        }
    }

    /**
     * Increment the count of the functions
     * @param {ASTNode} node node to evaluate
     * @returns {void}
     * @private
     */
    function countStatements(node) {
        functionStack[functionStack.length - 1] += node.body.length;
    }

    //--------------------------------------------------------------------------
    // Public API
    //--------------------------------------------------------------------------

    return {
        "FunctionDeclaration": startFunction,
        "FunctionExpression": startFunction,
        "ArrowFunctionExpression": startFunction,

        "BlockStatement": countStatements,

        "FunctionDeclaration:exit": endFunction,
        "FunctionExpression:exit": endFunction,
        "ArrowFunctionExpression:exit": endFunction,

        "Program:exit": function() {
            if (topLevelFunctions.length === 1) {
                return;
            }

            topLevelFunctions.forEach(function(element) {
                var count = element.count;
                var node = element.node;
                reportIfTooManyStatements(node, count, maxStatements);
            });
        }
    };

};

module.exports.schema = [
    {
        "type": "integer",
        "minimum": 0
    },
    {
        "type": "object",
        "properties": {
            "ignoreTopLevelFunctions": {
                "type": "boolean"
            }
        },
        "additionalProperties": false
    }
];
