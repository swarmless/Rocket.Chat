Meteor.methods
  openRoom: (rid, room) ->
    if not Meteor.userId()
      return false

    ChatSubscription.update
      rid: rid
      'u._id': Meteor.userId()
    ,
      $set:
        open: room.open
