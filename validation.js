/**
 * @author Matt Hinchliffe <http://www.maketea.co.uk>
 * @version 1.0.0
 * @modified 27/04/2011
 * @title Validation.js
 * @fileOverview Standalone Javascript form validation. No gimmicks, fluff or feature bloat.
 */

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
	var Validation = {

		form_valid: true, errors: {}, valid: {},

	/**
	 Instantiation methods
	 **/

		/**
		 * Instantiate Validation
		 * @see Validate
		 */
		init: function (form_id, model, opts)
		{
			if (opts === undefined)
			{
				opts = {};
			}

			// Default options
			this.options = {
				error_node: opts.error_node || 'span',                              // Node to wrap error message with
				error_class: opts.error_class || 'error',                           // Class to apply to error node
				error_list_class: opts.error_list_class || 'error_list',            // Class to apply to list of errors
				error_display: opts.error_display !== false,                        // Display errors (you can always retrieve errors manually)
				error_message: opts.error_message || 'The given value is invalid.', // Default error message to display
				error_placement: opts.error_placement || 'after'                    // Within a list (list-top|list-bottom) or before|after the input parent node
			};

			// Check target form is available and given model is a valid object
			if (!(this.form = document.getElementById(form_id)) || typeof model !== 'object')
			{
				return null;
			}

			this.id = form_id;
			this.model = model;

			// Keep scope reference when changing to DOM nodes
			var self = this;

			// Bind submit event listener to form
			this.bind('submit', function (event)
			{
				self.form_valid = true;

				// Destroy previous error list if necessary
				self.clear_error('list__' + self.id);

				// loop through form inputs
				for (var input in self.model)
				{
					self.validate(input);
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
		 * @param {string} listener Event listener
		 * @param {function} handler Method to execute on event
		 * @param {string|object} target ID string or DOM object reference
		 */
		bind: function (listener, handler, target)
		{
			target = target || this.form;

			if (typeof target === 'string')
			{
				target = document.getElementById(target);
			}

			if (target.addEventListener)
			{
				target.addEventListener(listener, handler, false);
			}
			else
			{
				target.attachEvent('on' + listener, handler);
			}
		},

	/**
	 Error messaging
	**/

		/**
		 * Error list
		 *
		 * @returns Error list node
		 */
		error_list: function ()
		{
			var list;

			if (!(list = document.getElementById('list__' + this.id)))
			{
				list = document.createElement('ol');
				list.setAttribute('id', 'list__' + this.id);
				list.className = this.options.error_list_class;

				if (this.options.error_placement == 'list-top')
				{
					var before = this.form.firstChild;
					this.form.insertBefore(list, before);
				}
				else
				{
					this.form.appendChild(list);
				}
			}

			return list;
		},

		/**
		 * Create error
		 *
		 * @param {object} target
		 * @param {string} message
		 */
		create_error: function (target, message)
		{
			this.errors[target.id] = message;

			// Check there is a message to display
			if (!message && !this.options.error_display)
			{
				return;
			}

			// Manage ordered list
			if (this.options.error_placement == 'list-top' || this.options.error_placement == 'list-bottom')
			{
				var list = this.error_list();
			}

			// Create individual error nodes
			var container = list || target.parentNode,
			    text = document.createTextNode(message),
			    node = list ? 'li' : this.options.error_node,
			    msg = document.createElement(node);

			msg.setAttribute('id', 'error__' + target.id);
			msg.className = this.options.error_class;
			msg.appendChild(text);

			if (this.options.error_placement == 'before' && !list)
			{
				var before = container.firstChild;
				container.insertBefore(msg, before);
			}
			else
			{
				container.appendChild(msg);
			}
		},

		/**
		 * Clear error
		 *
		 * @param {string} id
		 */
		clear_error: function (id)
		{
			var error = document.getElementById('error__' + id);

			if (error)
			{
				error.parentNode.removeChild(error);
			}
		},

		/**
		 * Get error
		 *
		 * @param {string} input
		 * @returns error string
		 */
		get_error: function (input)
		{
			return this.errors[input] || undefined;
		},

		/**
		 * Is valid
		 *
		 * @param {string} input
		 * @returns boolean
		 */
		is_valid: function (input)
		{
			return !! (this.valid[input]);
		},

	/**
	 Validation methods
	 **/

		/**
		 * Validate input
		 *
		 * @param {string} input
		 */
		validate: function (input)
		{
			var target;

			// Remove any previous error messages
			this.clear_error(input);

			// Check the input is available
			if (!(target = document.getElementById(input)))
			{
				return;
			}

			// Get the input value
			var value = this.get_value(target);

			// Loop through validation methods for the input
			for (var method in this.model[input])
			{
				if (method != 'error_message')
				{
					// Check validation method is available
					if (typeof this[method] !== 'function')
					{
						break;
					}

					var args = this.model[input][method],
					    error = args.error_message || (this.model[input].error_message || this.options.error_message);

					// Make sure arguments are in an array
					if (Object.prototype.toString.call(args) === '[object Object]')
					{
						args = args.arguments;
					}

					// Arrays are objects when a constructor is not used; see <http://bit.ly/lMo5> and <http://mzl.la/bx6jI8>
					if (!(Array.isArray ? Array.isArray(args) : Object.prototype.toString.call(args) === '[object Array]'))
					{
						args = [args];
					}

					// Perform validation method
					if (this[method].apply(this, [value].concat(args)) === false)
					{
						this.valid[input] = this.form_valid = false;

						// Create error message
						this.create_error(target, error);

						break;
					}
					else
					{
						this.valid[input] = true;
					}
				}
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
				// Return value and trim white space
				return obj.value !== undefined ? obj.value.replace(/^\s\s*/, '').replace(/\s\s*$/, '') : false;
			}
		},

		/**
		 * Test if any value is present or checked
		 *
		 * @param {mixed} value
		 * @param {boolean} not
		 * @returns Boolean
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

			// Invert boolean if checking for not present
			return (not) ? bool : !bool;
		},

		/**
		 * Regular expressions for use with test() method
		 * Add more with 'your_object.methods.expressions[name] = /^*$/'
		 */
		expressions: {
			alphanumeric: /^([a-z0-9_\-])$/,                                                         // Characters a-z, 0-9, underscores and hyphens in lowercase only
			number: /^([0-9\-])+$/,                                                                  // Characters 0-9 only of any length
			text: /^(^[a-z])+$/,                                                                     // Characters a-z of any length in either case
			email: /^([a-z0-9_\.\-]+)@([\da-z\.\-]+)\.([a-z\.]{2,6})$/,                              // TLD email address
			url: /^(https?:\/\/)?([\da-z\.\-]+)\.([a-z\.]{2,6})([\/\w \.\-]*)*\/?$/,                 // URL with or without http(s)/www
			date: /^(([0-3][0-9]|[1-9])[\/\-\.]([0-1][0-9]|[1-9])[\/\-\.]([0-9][0-9])?[0-9][0-9])$/, // Date in format 'day, month, year' with or without leading zeroes or century and separated by a point, hyphen or forward slash
			time: /^(([0-2])?[0-9]:[0-5][0-9])$/                                                     // Time in format hours:minutes with or without leading hour zero in 12 or 24 hour format
		},

		/**
		 * Test a value string against a regular expression
		 *
		 * @param {string} value
		 * @param {string} regex
		 * @return A boolean if test is performed or does not exist or null if no value is present
		 */
		test: function (value, regex)
		{
			if (!this.present(value, true))
			{
				return null;
			}

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
		 * Valid strings may include 1-1-2011, 1.1.11, 01/01/2011 etc. The Javascript Date object is useless in this 
		 * instance as an invalid date of 32/13/11 would be 'rounded' up as 1/2/12
		 *
		 * @param {string} value
		 * @param {boolean} usa Use US month/day/year format
		 * @param {string} delimiter
		 * @return A boolean or null if no value is present
		 * @example
		 * valid_date: [false, '/', 'Please enter a valid date']
		 */
		valid_date: function (value, usa, delimiter)
		{
			var parts, day, month, year;

			if (!this.present(value, true))
			{
				return null;
			}

			// Standardise date string with a new delimiter
			value = value.split(delimiter || '-').join(',');

			// Split date into components and validate format
			if (!(parts = value.match(/^(\d{1,2})[,](\d{1,2})[,](\d{2,4})$/)))
			{
				return false;
			}

			// Apply data to vars as integers and standardise days/months
			day = parseInt(usa ? parts[2] : parts[1], 10);
			month = parseInt(usa ? parts[1] : parts[2], 10);
			year = parseInt(parts[3].length == 2 ? '' + '20' + parts[3] : parts[3], 10);

			// Test integers are within boundaries
			if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100)
			{
				return false;
			}
			// Months with only 30 days, mimics in_array()
			else if (day > 30 && month in {4:'', 6:'', 9:'', 11:''})
			{
				return false;
			}
			// February and leap years
			else if (month == 2 && !(day <= 28 || (day == 29 && (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)))))
			{
				return false;
			}

			return true;
		},

		/**
		 * String is longer than
		 *
		 * @param {string} value
		 * @param {int} length
		 */
		longer_than: function (value, length)
		{
			return (value.toString().length >= length);
		},

		/**
		 * String is shorter than
		 *
		 * @param {string} value
		 * @param {int} length
		 */
		shorter_than: function (value, length)
		{
			return (value.toString().length <= length);
		},

		/**
		 * Number is an integer
		 *
		 * For a round-up on testing for intergers see <http://bit.ly/aOpiDa>
		 *
		 * @param {number} value
		 * @param {boolean} not
		 */
		is_int: function (value, not)
		{
			var bool = !! ((parseFloat(value) == parseInt(value)) && !isNaN(value));

			// Invert boolean if checking for NOT an integer
			return (not) ? bool : !bool;
		},

		/**
		 * Number is greater than
		 *
		 * @param value
		 * @param required
		 */
		greater_than: function (value, required)
		{
			return this.compare_numbers(value, required, '>=');
		},

		/**
		 * Number is less than
		 *
		 * @param value
		 * @param required
		 */
		less_than: function (value, required)
		{
			return this.compare_numbers(value, required, '<=');
		},

		/**
		 * Compare two numbers
		 *
		 * @param value
		 * @param required
		 * @param {string} operator
		 * 
		 */
		compare_numbers: function (value, required, operator)
		{
			if (!this.present(value, true))
			{
				return null;
			}

			// Make sure we're working with a number primitive
			required = new Number(required).valueOf();
			value = new Number(value).valueOf();

			if (value === NaN || required === NaN)
			{
				return false;
			}

			switch (operator)
			{
				// Value is greater than
				case '>' :
					return (value > required);
					break;

				// Value is greater or equal to
				case '>=' :
					return (value >= required);
					break;

				// Value is less than
				case '<' :
					return (value < required);
					break;

				// Value is less than or equal to
				case '<=' :
					return (value <= required);
					break;

				// Value is a factor of
				case '%':
					return (value % required == 0);
					break;

				// Value does is not equal to
				case '!=' :
					return (value != required);
					break;

				// Value is equal to
				default: /* == */
					return (value == required);
					break;
			}
		},

		/**
		 * Compare input values
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
	 Object constructor
	 **/

	var validation = Object.create(Validation);
	validation.init(form_id, model, opts);

	return validation;
}

/**
 Prototypal inheritance operator support
 Douglas Crockford <http://javascript.crockford.com/prototypal.html>
 **/
if (typeof Object.create !== 'function') {
	Object.create = function (o) {
		function F() {}
		F.prototype = o;
		return new F();
	};
}
