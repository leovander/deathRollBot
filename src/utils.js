let _ = require('lodash')

function parseMessage (message) {
  return {
    params: parseParams(message.text),
    chatId: message.chat.id,
    player: {
      playerId: message.from.id,
      displayName: getDisplayName(message.from)
    }
  }
}

function parseQuery (query) {
  return {
    chatId: query.message.chat.id,
    message_id: query.message.message_id,
    player: {
      playerId: query.from.id,
      displayName: getDisplayName(query.from)
    }
  }
}

function appendMessage (previousMessage, newMessage) {
  return [previousMessage, newMessage].join('\n')
}

function parseParams (message) {
  return _.drop(_.split(message, ' '))
}

function getDisplayName (player) {
  if (player.username) {
    return player.username
  }
  return `${_.camelCase(player.first_name + player.last_name)}`
}

function rollDice (min, max) {
  return _.random(min, max)
}

module.exports.parseMessage = parseMessage
module.exports.parseQuery = parseQuery
module.exports.appendMessage = appendMessage
module.exports.rollDice = rollDice
