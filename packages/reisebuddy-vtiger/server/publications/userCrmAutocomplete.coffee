# see \server\publications\userAutocomplete.coffee
Meteor.publish 'userCrmAutocomplete', (selector) ->
	unless this.userId
		return this.ready()

	pub = this
	exceptions = selector.exceptions or []

	options =
		fields:
			name: 1
			username: 1
			status: 1
		limit: 10
		sort:
			name: 1
	#todo handle duplicates
	if selector.username
		_vtiger.getAdapter().findContactsFulltextPromise('%'+selector.username+'%').then((records) =>
			for rec in records
				do (rec) ->
					pub.added("autocompleteRecords", Random.id(), {
						name: rec.lastname + ', ' + rec.firstname
						username: rec.email
						crmContactId: rec.id
						status: 'offline'
					});
		).catch (resp) ->
			SystemLogger.error "unable to query crm for user autocomplete: " + resp

	cursorHandle = RocketChat.models.Users.findVisitorsByUsername(selector.username, exceptions, options).observeChanges
		added: (_id, record) ->
			pub.added("autocompleteRecords", _id, record)
		changed: (_id, record) ->
			pub.changed("autocompleteRecords", _id, record)
		removed: (_id, record) ->
			pub.removed("autocompleteRecords", _id, record)
	@ready()
	@onStop ->
		cursorHandle.stop()
	return
