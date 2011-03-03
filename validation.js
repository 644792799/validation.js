/**
 * @author Matt Hinchliffe <http://www.maketea.co.uk>
 * @version 0.9.7
 * @modified 03/03/2011
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
			self.form_valid = true;
			self.errors = self.valid = {};

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
					    is_array,
					    arguments = self.model[input][method];

					if (method != 'error')
					{
						// Check validation method is available
						if (typeof self[method] !== 'function')
						{
							break;
						}

						// Check if given argument is an array
						// Arrays return as objects when a constructor is not used; see <http://bit.ly/lMo5> and <http://mzl.la/bx6jI8>
						if (Array.isArray)
						{
							is_array = Array.isArray(arguments);
						}
						else
						{
							is_array = (Object.prototype.toString.call(arguments) === '[object Array]');
						}

						// Work out the error message to display
						if (is_array)
						{
							error = arguments[arguments.length - 1] || self.options.error_message;
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
		var type;

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

		var parent = target.parentNode,
		    text = document.createTextNode(message),
		    msg = document.createElement(this.options.error_node);

		msg.setAttribute('id', 'error__' + target.id);
		msg.className = this.options.error_class;
		msg.appendChild(text);

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

		// Invert boolean if checking for NOT present
		return (not) ? bool : !bool;
	},

	/**
	 * Regular expressions for use with test() method
	 * Add more with 'your_object.methods.expressions[name] = /^*$/'
	 */
	expressions: {
		alphanumeric: /^([a-z0-9_\-])$/,                                                         // Characters a-z, 0-9, underscores and hyphens in lowercase only
		number: /^([0-9])+$/,                                                                    // Characters 0-9 only of any length
		text: /^(^[a-z])+$/,                                                                     // Characters a-z of any length in either case
		email: /^([a-z0-9_\.\-]+)@([\da-z\.\-]+)\.([a-z\.]{2,6})$/,                              // TLD email address
		url: /^(https?:\/\/)?([\da-z\.\-]+)\.([a-z\.]{2,6})([\/\w \.\-]*)*\/?$/,                 // URL with or without http(s)/www
		date: /^(([0-3][0-9]|[1-9])[\/\-\.]([0-1][0-9]|[1-9])[\/\-\.]([0-9][0-9])?[0-9][0-9])$/, // Date in format 'day, month, year' with or without leading zeroes or century and separated by a point, hyphen or forward slash
		time: /^(([0-2])?[0-9]:[0-5][0-9])$/                                                     // Time in format hours:minutes with or without leading hour zero in 12 or 24 hour format
	},

	/**
	 * Test value string against regular expression
	 *
	 * @param {string} value
	 * @param {string} regex
	 * @return A boolean if test is performed or does not exist.
	 */
	test: function (value, regex)
	{
		if (this.expressions[regex])
		{
			return !! (this.expressions[regex]).test(value.toString());
		}
		else
		{
			return false;
		}
	},

	/**
	 * Test if a string is a valid date
	 *
	 * Valid strings may include 1-1-2011, 1.1.11, 01/01/2011 etc.
	 *
	 * @param {string} value
	 */
	valid_date: function (value, us)
	{
		us = !! us;

		var parts, day, month, year;

		// Split date into components
		if (!(parts = value.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/)))
		{
			return false;
		}

		day = us ? parts[2] : parts[1];
		month = us ? parts[1] : parts[2];
		year = parts[3].length == 2 ? '' + '20' + parts[3] : parts[3];

		// Test integers are within boundaries
		if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100)
		{
			return false;
		}
		// Months with 30 days
		else if (day > 30 && month == (4 || 6 || 9 || 11))
		{
			return false;
		}
		// February and leap years
		else if (month == 2 && !(day <= 28 || (day == 29 && (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0)))))
		{
			return false;
		}

		return true;
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

	var validation = Object.create(Validation);
	validation.init(form_id, model, opts);

	return validation;
}

/**
 * Prototypal inheritance operator support
 * Douglas Crockford <http://javascript.crockford.com/prototypal.html>
 */
if (typeof Object.create !== 'function') {
	Object.create = function (o) {
		function F() {}
		F.prototype = o;
		return new F();
	};
}