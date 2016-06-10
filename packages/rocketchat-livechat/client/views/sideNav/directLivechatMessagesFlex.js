Template.directLivechatMessagesFlex.helpers({
	error: function () {
		return Template.instance().error.get()
	},
	autocompleteSettings: function () {
		return {
			limit: 10,
			rules: [{
				collection: 'UserAndRoom',
				subscription: 'userCrmAutocomplete',
				field: 'username',
				template: Template.userSearch,
				noMatchTemplate: Template.userSearchEmpty,
				matchAll: true,
				filter: {
					exceptions: [Meteor.user().username],
					types: ['visitor']
				},
				selector: function (match) {
					return {username: match}
				},
				sort: 'username'
			}]
		}
	}
});

Template.directLivechatMessagesFlex.events({
	'autocompleteselect #who': function (event, instance, doc) {
		instance.selectedUser.set(doc.username);
		event.currentTarget.focus();
	},
	'click .cancel-direct-message': function (e, instance) {
		SideNav.closeFlex();
		instance.clearForm()
	},
	'click header': function (e, instance) {
		SideNav.closeFlex();
		instance.clearForm();
	},
	'mouseenter header': function () {
		SideNav.overArrow();
	},
	'mouseleave header': function () {
		SideNav.leaveArrow();
	},
	'keydown input[type="text"]': function (e, instance) {
		Template.instance().error.set([]);
		if (e.keyCode === 13) {
			instance.$('.save-direct-message').click();
		}
	},
	'click .save-direct-message': function (e, instance) {
		const err = SideNav.validate();
		if (!err) {
			const username = instance.selectedUser.get();
			if (!username) {
				return;
			}
			Meteor.call('createDirectLivechatMessage', username, function (err, result) {
				if (err) {
					return handleError(err)
				}
				SideNav.closeFlex();
				instance.clearForm();
				FlowRouter.go('live', {code: result.code})
			});
		} else {
			Template.instance().error.set(err)
		}
	}
});

Template.directLivechatMessagesFlex.onCreated(function () {
	const instance = this;
	instance.selectedUser = new ReactiveVar;
	instance.error = new ReactiveVar([]);

	instance.clearForm = function () {
		instance.error.set([]);
		instance.selectedUser.set(null);
		instance.find('#who').value = ''
	}
});
