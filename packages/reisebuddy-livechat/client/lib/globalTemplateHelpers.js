Template.registerHelper('and', (a, b)=> a && b);
Template.registerHelper('or', (a, b)=> a || b);

/**
 * Allows to access reactive dict components in Blaze-templates: {{instance.state.get "foo"}}
 */
Template.registerHelper('instance', function () {
	return Template.instance();
});

Template.registerHelper('arrayLength', function (array) {
	return array.length;
});

Template.registerHelper('add', function (a, b) {
	return a + b;
});
