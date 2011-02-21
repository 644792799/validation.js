/**
 * @author Matt Hinchliffe <http://www.maketea.co.uk>
 * @version 0.9.0
 * @modified 21/02/2011
 */

var Validation = {

	/**
	 * Instantiate Validation
	 * @see Validate
	 */
	init: function (form_id, model, opts)
	{
		// Default options
		this.options = {
			error_node: opts.error_node || 'p',                                 // Node to wrap error message with
			error_class: opts.error_class || 'form_error',                      // Class to apply to error node
			error_display: opts.error_display !== false,                        // Display errors (you can always retrieve errors manually)
			error_message: opts.error_message || 'The given value is invalid.', // Default error message to display
			error_placement: opts.error_placement || 'after'                    // At the top or bottom of the inputs parent node
		};

		// Check target form is available and given model is a valid object
		if (!(this.form = document.getElementById(form_id)) || typeof model !== 'object')
		{
			return null;
		}

		this.model = model;

		// Keep scope reference when changing to DOM nodes
		var self = this;

		// Bind submit event listener to form
		this.bind(function (event)
		{
			event = event || null;

			self.form_valid = true;
			self.errors = self.valid = [];

			// loop through form inputs
			for (var input in self.model)
			{
				var target;

				// Check the input is available
				if (!(target = document.getElementById(input)))
				{
					break;
				}

				// Get the input value
				var value = self.get_value(target);

				// Remove any previous error
				self.clear_error_message(input);

				// Loop through validation methods for the input
				for (var method in self.model[input])
				{
					var error,
					    arguments = self.model[input][method];

					if (method != 'error')
					{
						// Check validation method is available
						if (typeof self[method] !== 'function')
						{
							break;
						}

						// Work out the error message to display
						// Array literals return as an object type but behave as arrays
						if (Object.prototype.toString.call(arguments) === '[object Array]')
						{
							error = arguments[arguments.length - 1]|| self.options.error_message;
						}
						else
						{
							error = self.model[input]['error'] || self.options.error_message;
							arguments = [arguments];
						}

						// Test validation method
						if (self[method].apply(self, [value].concat(arguments)) === false)
						{
							self.form_valid = self.valid[input] = false;
							self.create_error_message(target, error);
							break;
						}
					}
				}
			}

			event.returnValue = self.form_valid;

			// Prevent form submission if invalid
			if (!self.form_valid && event.preventDefault)
			{
				event.preventDefault();
			}
		});
	},

	/**
	 * Bind method to target form submit event
	 *
	 * @param {function} handler
	 */
	bind: function (handler)
	{
		if (this.form.addEventListener)
		{
			this.form.addEventListener('submit', handler, false);
		}
		else
		{
			this.form.attachEvent('onsubmit', handler);
		}
	},

	/**
	 * Get an inputs value or status
	 *
	 * @param {object} obj
	 * @return The target input value
	 */
	get_value: function (obj)
	{
		var type = false;

		if (obj.nodeName.toLowerCase() == 'input')
		{
			type = obj.getAttribute('type');
		}

		if (type && (type == 'checkbox' || type == 'radio'))
		{
			return obj.checked ? true : false;
		}
		else
		{
			return obj.value !== undefined ? obj.value : false;
		}
	},

	/**
	 * Create an error message
	 *
	 * @param {object} target
	 * @param {string} message
	 */
	create_error_message: function (target, message)
	{
		this.errors[target.id] = message;

		if (!message || !this.options.error_display)
		{
			return;
		}

		var msg = document.createElement(this.options.error_node);
		    msg.setAttribute('class', this.options.error_class);
		    msg.setAttribute('id', 'error__' + target.id);

		var txt = document.createTextNode(message);
		    msg.appendChild(txt);

		var parent = target.parentNode;

		if (this.options.error_placement == 'before')
		{
			var before = parent.firstChild;
			parent.insertBefore(msg, before);
		}
		else
		{
			parent.appendChild(msg);
		}
	},

	/**
	 * Clear error message
	 *
	 * @param {string} id
	 */
	clear_error_message: function (id)
	{
		var error = document.getElementById('error__' + id);

		if (error)
		{
			error.parentNode.removeChild(error);
		}
	},

	/**
	 * Test if any value is present or checked
	 *
	 * @param {boolean|string|undefined} value
	 * @returns Whether argument is true or false
	 */
	present: function (value, not)
	{
		var bool;

		// Boolean checkboxes or radio buttons
		if (typeof value == 'boolean')
		{
			bool = value;
		}
		// Check if value is null or undefined with loose check
		else if (!value)
		{
			bool = false;
		}
		// Check string entered is greater than zero
		else
		{
			bool = !! (value.length > 0);
		}

		// Optionally invert if checking for NOT present
		return (not) ? bool : !bool;
	},

	/**
	 * Regular expressions for use with test() method
	 * Add more with 'your_object.methods.expressions[name] = /^*$/'
	 */
	expressions: {
		alphanumeric: /^([a-z0-9_\-])$/,                                         // Characters a-z, 0-9, underscores and hyphens in lowercase only
		number: /^([0-9])+$/,                                                    // Characters 0-9 only of any length
		text: /^(^[a-z])+$/,                                                     // Characters a-z of any length in either case
		email: /^([a-z0-9_\.\-]+)@([\da-z\.\-]+)\.([a-z\.]{2,6})$/,              // TLD email address
		url: /^(https?:\/\/)?([\da-z\.\-]+)\.([a-z\.]{2,6})([\/\w \.\-]*)*\/?$/, // URL with or without http(s)/www
		date: /^(([0-3])?[0-9]\-([0-1])?[0-9]\-([0-9][0-9])?[0-9][0-9])$/,       // UK date in format day-month-year with or without leading zeroes or century
		time: /^(([0-2])?[0-9]:[0-5][0-9])$/                                     // Time in format hours:minutes with or without leading hour zero in 12 or 24 hour format
	},

	/**
	 * Test value against regular expression
	 *
	 * @param {string} value
	 * @param {string} regex
	 * @return A boolean if test is performed or does not exist. Null if no value is present.
	 */
	test: function (value, regex)
	{
		if (!this.present(value, true))
		{
			return null;
		}

		if (this.expressions[regex])
		{
			return !! (this.expressions[regex]).test(value);
		}
		else
		{
			return false;
		}
	},

	/**
	 * Minimum string length
	 *
	 * @param {string} value
	 * @param {int} required
	 */
	minimum_length: function (value, required)
	{
		if (!this.present(value))
		{
			return null;
		}

		return !! (value.length >= required);
	},

	/**
	 * Maximum string length
	 *
	 * @param {string} value
	 * @param {int} required
	 */
	maximum_length: function (value, required)
	{
		if (!this.present(value))
		{
			return null;
		}

		return !! (value.length <= required);
	},

	/**
	 * Integer is greater than
	 *
	 * @param {string} value
	 * @param {int} required
	 */
	greater_than: function (value, required)
	{
		if (!this.present(value))
		{
			return null;
		}

		return !! (parseInt(value, 10) >= required);
	},

	/**
	 * Integer is less than
	 *
	 * @param {string} value
	 * @param {int} required
	 */
	less_than: function (value, required)
	{
		if (!this.present(value))
		{
			return null;
		}

		return !! (parseInt(value, 10) <= required);
	},

	/**
	 * Fields match
	 *
	 * @param {string} value
	 * @param {string} target_id
	 */
	match: function (value, target_id)
	{
		var target = document.getElementById(target_id),
		    match = target ? this.get_value(target) : null;
		return !! (value === match);
	}
};

/**
 * Validate constructor method
 *
 * @param {string} form_id
 * @param {object} model
 * @param {object} opts
 * @return A new Validation object
 */
function Validate (form_id, model, opts)
{
	opts = opts || {};

	/**
	 * Prototypal inheritance operator support.
	 * Douglas Crockford <http://javascript.crockford.com/prototypal.html>
	 */
	if (typeof Object.create !== 'function') {
		Object.create = function (o) {
			function F() {}
			F.prototype = o;
			return new F();
		};
	}

	var validation = Object.create(Validation);
	validation.init(form_id, model, opts);

	return validation;
}