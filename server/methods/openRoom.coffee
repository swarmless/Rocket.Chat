Meteor.methods
  openRoom: (rid, room) ->
    if not Meteor.userId()
      throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'openRoom' }

    RocketChat.models.Subscriptions.openByRoomIdAndUserId rid, Meteor.userId(), room.open
