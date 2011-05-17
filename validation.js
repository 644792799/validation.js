/**
 * @author Matt Hinchliffe <http://www.maketea.co.uk>
 * @version 1.1.0
 * @modified 16/05/2011
 * @title Validation.js
 * @fileOverview Standalone Javascript form validation. No gimmicks, fluff or feature bloat.
 */

/**
 * Validate
 *
 * Global constructor for Validation.js
 *
 * @param {string} form_id
 * @param {object} model
 * @param {object} options
 * @return A new Validation object
 */
function Validate (form_id, model, options)
{
	var Validation = {

		form_valid: true, errors: {}, valid: {},

	/**
	 * Instantiation methods
	 */

		/**
		 * Instantiate Validation
		 * 
		 * @see Validate
		 */
		init: function(form_id, model, options)
		{
			var self = this;
			this.id = form_id;
			this.model = model;

			// Check target form is available and given model is a valid object
			if (!(this.form = document.getElementById(form_id)) || typeof model !== 'object')
			{
				return;
			}

			if (options === undefined)
			{
				options = {};
			}

			// Default options
			this.options = {

				// Display errors (you can always retrieve errors manually)
				display: options.display !== false,

				// Default error message to display
				message: options.message || 'The given value is invalid.',

				// Node to wrap error message with
				message_node: options.message_node || 'span',

				// Class to apply to error node
				message_class: options.message_class || 'error',

				// Show error messages above or below (before | after) the input or the form
				placement: options.placement || 'after',

				// Display errors within a list above or below the form
				list: options.list || false,

				// Class to apply to list of errors
				list_class: options.list_class || 'error_list'
			};

			// Bind submit event listener to the form
			this.bind('submit', function(event)
			{
				self.form_valid = true;

				// Destroy previous error list if necessary
				self.clear_error_message('list__' + self.id);

				// loop through form input objects
				for (var input in self.model)
				{
					self.validate(input);
				}

				self.form_valid = false;

				event.returnValue = self.form_valid;

				// Prevent form submission if invalid
				if (!self.form_valid && event.preventDefault)
				{
					event.preventDefault();
				}
			});
		},

		/**
		 * Bind
		 *
		 * Bind an event listener to a target
		 *
		 * @param {string} listener Event listener
		 * @param {function} handler Method to execute on event
		 * @param {string|object} target ID string or DOM object reference
		 */
		bind: function(listener, handler, target)
		{
			target = target || this.form;

			if (typeof target === 'string')
			{
				target = this.form.elements[target];
			}

			if (!target)
			{
				return;
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
	 * Error messaging
	 */

		/**
		 * Create error list
		 *
		 * @returns Error list node
		 */
		create_error_list: function()
		{
			var list;

			if (!(list = document.getElementById('list__' + this.id)))
			{
				list = document.createElement('ol');
				list.setAttribute('id', 'list__' + this.id);
				list.className = this.options.list_class;

				if (this.options.placement == 'before')
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
		 * Create error message
		 *
		 * @param {object} target
		 * @param {string} message
		 */
		create_error_message: function(target, message)
		{
			var list = false;

			// Check there is a message to display
			if (!message && !this.options.display)
			{
				return;
			}

			this.errors[target.name] = message;

			// Manage ordered list
			if (this.options.list)
			{
				list = this.create_error_list();
			}

			var container = list || target.parentNode,
			    text = document.createTextNode(message),
			    node = list ? 'li' : this.options.message_node,
			    msg = document.createElement(node);

			msg.setAttribute('id', 'input_error_' + target.name);
			msg.className = this.options.message_class;
			msg.appendChild(text);

			if (!list && this.options.placement == 'before')
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
		 * Clear error message
		 *
		 * @param {string} name
		 */
		clear_error_message: function(name)
		{
			var error = document.getElementById('input_error_' + name);

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
		get_error: function(input)
		{
			return this.errors[input] || undefined;
		},

		/**
		 * Is valid
		 *
		 * @param {string} input
		 * @returns boolean
		 */
		is_valid: function(input)
		{
			return !! (this.valid[input]);
		},

	/**
	 * Validation methods
	 */

		/**
		 * Validate
		 *
		 * @param {string} input
		 */
		validate: function(input)
		{
			var targets, validations = [];

			// Remove any previous error messages
			this.clear_error_message(input);

			// Check the input is available
			if (!(targets = this.form.elements[input]))
			{
				return;
			}

			// Force single input into an array
			if (Object.prototype.toString.call(targets) !== '[object NodeList]')
			{
				targets = [targets];
			}

			// If required option is set make push present() to validations
			if (this.model[input].required)
			{
				validations.push({
					method: 'present',
					params: true
				});
			}

			if (this.model[input].validate)
			{
				validations = validations.concat(this.model[input].validate);
			}

			// Loop through inputs
			for (var e = 0; e < targets.length; e++)
			{
				var valid,
				    target = targets[e],
				    value = this.get_value(target);

				// Loop through validation methods
				for (var i = 0; i < validations.length; i++)
				{
					var method = validations[i].method || false;

					// Check validation method is available
					if (!method || typeof this[method] !== 'function')
					{
						break;
					}

					var args = validations[i].params,
					    error = validations[i].error || (this.model[input].error || this.options.message);

					// Force single argument into an array
					// Note: Arrays are objects when a constructor is not used; see <http://bit.ly/lMo5> and <http://mzl.la/bx6jI8>
					if (!(Array.isArray ? Array.isArray(args) : Object.prototype.toString.call(args) === '[object Array]'))
					{
						args = [args];
					}

					// Perform validation method only if a value is present
					if (method != 'present' && !this.present(value, true))
					{
						return null;
					}

					if (this[method].apply(this, [value].concat(args)) === false)
					{
						valid = false;

						this.create_error_message(target, error);

						break;
					}
					else
					{
						this.valid[input] = true;
					}
				}
			}

			// Create error
			// TODO
			this.valid[input] = this.form_valid = valid;
		},

		/**
		 * Get value
		 *
		 * @param {object} obj
		 * @return The target input value
		 */
		get_value: function(obj)
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
		 * Present
		 *
		 * @param value
		 * @param {boolean} not
		 * @returns Boolean
		 */
		present: function(value, not)
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
				bool = (value.length > 0);
			}

			// Invert boolean if checking for not present
			return (not) ? bool : !bool;
		},

		/**
		 * Regular expressions for use with test() method
		 * Add more with 'your_object.expressions[name] = /^*$/'
		 */
		expressions: {
			alphanumeric: /^([a-z0-9_\-])$/,                                                         // Characters a-z, 0-9, underscores and hyphens in lowercase only
			text: /^(^[a-z])+$/,                                                                     // Characters a-z of any length in either case
			email: /^([a-z0-9_\.\-]+)@([\da-z\.\-]+)\.([a-z\.]{2,6})$/,                              // TLD email address
			url: /^(https?:\/\/)?([\da-z\.\-]+)\.([a-z\.]{2,6})([\/\w \.\-]*)*\/?$/,                 // URL with or without http(s)/www
			date: /^(([0-3][0-9]|[1-9])[\/\-\.]([0-1][0-9]|[1-9])[\/\-\.]([0-9][0-9])?[0-9][0-9])$/, // Date in format 'day, month, year' with or without leading zeroes or century and separated by a point, hyphen or forward slash
			time: /^(([0-2])?[0-9]:[0-5][0-9])$/                                                     // Time in format hours:minutes with or without leading hour zero in 12 or 24 hour format
		},

		/**
		 * Format
		 *
		 * Test a value string against a regular expression
		 *
		 * @param {string} value
		 * @param {string} regex
		 * @return A boolean if test is performed or does not exist or null if no value is present
		 */
		format: function(value, regex)
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
		 * Valid date
		 *
		 * Valid strings may include 1-1-2011, 1.1.11, 01/01/2011 etc. The Javascript Date object is useless in this 
		 * instance as an invalid date of 32/13/11 would be 'rounded' up as 1/2/12
		 *
		 * @param {string} value
		 * @param {boolean} usa Use US month/day/year format
		 * @param {string} delimiter
		 * @return A boolean or null if no value is present
		 * @example
		 * valid_date: {
		 *     params: [false, '/']
		 * }
		 */
		valid_date: function(value, usa, delimiter)
		{
			var parts, day, month, year;

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
		longer_than: function(value, length)
		{
			return (value.toString().length >= length);
		},

		/**
		 * String is shorter than
		 *
		 * @param {string} value
		 * @param {int} length
		 */
		shorter_than: function(value, length)
		{
			return (value.toString().length <= length);
		},

		/**
		 * Number is an integer
		 *
		 * For a round-up on testing for integers see <http://bit.ly/aOpiDa>
		 *
		 * @param {number} value
		 * @param {boolean} not
		 */
		is_integer: function(value, not)
		{
			var bool = !! ((parseFloat(value, 10) == parseInt(value, 10)) && !isNaN(value));

			// Invert boolean if checking for NOT an integer
			return (not) ? bool : !bool;
		},

		/**
		 * Value is a number
		 *
		 * @param {number} value
		 * @param {boolean} not
		 */
		is_number: function(value, not)
		{
			var test = new Number(value).valueOf(),
			    bool = isNaN(test);

			// Invert boolean if checking for NOT an integer
			return (not) ? bool : !bool;
		},
		
		/**
		 * Greater than
		 *
		 * This is a shortcut for the compare_numbers() method
		 *
		 * @param value
		 * @param required
		 */
		greater_than: function(value, required)
		{
			return this.compare_numbers(value, required, '>=');
		},

		/**
		 * Less than
		 *
		 * This is a shortcut for the compare_numbers() method
		 *
		 * @param value
		 * @param required
		 */
		less_than: function(value, required)
		{
			return this.compare_numbers(value, required, '<=');
		},

		/**
		 * Compare numbers
		 *
		 * @param value
		 * @param required
		 * @param {string} operator
		 * 
		 */
		compare_numbers: function(value, required, operator)
		{
			// Make sure we're working with a number primitive
			required = new Number(required).valueOf();
			value = new Number(value).valueOf();

			if (isNaN(value) || isNaN(required))
			{
				return false;
			}

			var result;

			switch (operator)
			{
				// Value is greater than
				case '>' :
					result = (value > required);
					break;

				// Value is greater or equal to
				case '>=' :
					result = (value >= required);
					break;

				// Value is less than
				case '<' :
					result = (value < required);
					break;

				// Value is less than or equal to
				case '<=' :
					result = (value <= required);
					break;

				// Value is a factor of
				case '%':
					result = (value % required === 0);
					break;

				// Value does is not equal to
				case '!=' :
					result = (value != required);
					break;

				// Value is equal to
				default: /* == */
					result = (value == required);
					break;
			}

			return result;
		},

		/**
		 * Match
		 *
		 * Compare two input values
		 *
		 * @param {string} value
		 * @param {string} target_id
		 */
		match: function(value, target_id)
		{
			var target = document.getElementById(target_id),
			    match = target ? this.get_value(target) : null;

			return (value === match);
		}
	};

	/**
	 * Object constructor
	 */

	var validation = Object.create(Validation);
	validation.init(form_id, model, options);

	return validation;
}

/**
 * Prototypal inheritance operator support
 * Douglas Crockford <http://javascript.crockford.com/prototypal.html>
 */
if (typeof Object.create !== 'function') {
	Object.create = function(o) {
		function F() {}
		F.prototype = o;
		return new F();
	};
}
