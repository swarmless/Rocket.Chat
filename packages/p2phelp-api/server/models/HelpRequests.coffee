RocketChat.models.HelpRequests = new class extends RocketChat.models._Base
	constructor: ->
		@_initModel 'helpRequest'

		@tryEnsureIndex { 'roomId': 1 }, { unique: 1, sparse: 1 }
		@tryEnsureIndex { 'supportArea': 1 }

	####### Constants ######
	RESOLUTION_STATUS =
		open: 'open'
		authorAction: 'authorAction'
		resolved: 'resolved'

	# FIND ONE
	findOneById: (_id, options) ->
		query =
			_id: _id
		return @findOne query, options

	findOneByRoomId: (roomId, options) ->
		query =
			roomId: roomId
		return @findOne query, options


	# FIND
	findById: (_id, options) ->
		return @find { _id: _id }, options

	findByIds: (_ids, options) ->
		return @find { _id: $in: [].concat _ids }, options

	findBySupportArea: (supportArea, options) ->
		query =
			supportArea: supportArea
		return @find query, options

	# CREATE
	createForSupportArea: (supportArea, roomId, question, environment) ->
		helpRequest =
			createdOn: new Date()
			supportArea: supportArea
			question: question
			environment: environment
			resolutionStatus: RESOLUTION_STATUS.open

		@insert helpRequest
		return helpRequest

	# UPDATE
	markResolved: (_id) ->
		query =
			_id: _id

		update =
			$set:
				resolutionStatus: RESOLUTION_STATUS.resolved

		return @update query, update


	# REMOVE
	removeById: (_id) ->
		query =
			_id: _id
		return @remove query
