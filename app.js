require('dotenv').config()
const BOT_TOKEN = process.env.BOT_TOKEN
const BOT_NAME = process.env.BOT_NAME

const MIN = process.env.MIN_ROLL || 1
const MAX = process.env.MAX_ROLL || 99999

const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const utils = require('./src/utils.js')
let _ = require('lodash')

if (!BOT_TOKEN) {
  throw new Error('Missing Bot API Key in ENV: (BOT_TOKEN)')
}

if (!BOT_NAME) {
  throw new Error('Missing Bot Name in ENV: (BOT_NAME)')
}

const bot = new Telegraf(BOT_TOKEN)
const games = {}

console.log(`Starting Bot: ${BOT_NAME} with min: ${MIN} max: ${MAX}`)

bot.command(['dr', 'deathroll', 'roll'], async (ctx) => {
  const source = utils.parseMessage(ctx.message)

  if (_.isUndefined(games[source.chatId])) {
    games[source.chatId] = {}
  }

  let reply = `*${source.player.displayName}* new ☠🎲 _(${MIN} - ${MAX})_`

  try {
    await ctx.reply(`${reply}`, Extra.markdown().markup((m) =>
      m.inlineKeyboard([
        m.callbackButton('🎲', 'roll')
      ]))).then((data) => {
      games[source.chatId][data.message_id] = {
        chatId: source.chatId,
        message_id: data.message_id,
        isPlaying: false,
        rolls: 0,
        maxRoll: MAX,
        consecutiveRoll: false,
        history: reply
      }
    })
  } catch (error) {
    console.error(`Could not start new game: ${error.toString()}`)
  }
})

bot.action('roll', async (ctx) => {
  const source = utils.parseQuery(ctx.update.callback_query)

  if (_.isUndefined(games[source.chatId]) || _.isUndefined(games[source.chatId][source.message_id])) {
    try {
      await ctx.editMessageText('Game state lost.\nStart a new game `\\roll \\dr \\deathroll`', Extra.markdown())
    } catch (error) {
      console.error(`Could send game state lost messsage: ${error.toString()}`)
    }

    return
  }

  let game = games[source.chatId][source.message_id]

  let max = game.maxRoll
  let roll = utils.rollDice(MIN, max)
  let previousMessage = game.history
  let newMessage = `*${source.player.displayName}* 🎲 *${roll}*  _(${MIN} - ${max})_`

  games[source.chatId][source.message_id].isPlaying = true
  games[source.chatId][source.message_id].maxRoll = roll
  games[source.chatId][source.message_id].rolls++
  games[source.chatId][source.message_id].history = utils.appendMessage(previousMessage, newMessage)

  let updatedMessage = games[source.chatId][source.message_id].history

  if (roll === 1) {
    games[source.chatId][source.message_id].isPlaying = false

    let gameOver = `*${source.player.displayName}* ☠☠☠ in *${game.rolls}* rolls!`
    updatedMessage = utils.appendMessage(updatedMessage, gameOver)

    try {
      await ctx.editMessageText(updatedMessage, Extra.markdown())
    } catch (error) {
      console.error(`Could not end game: ${error.toString()}`)
    }
  } else {
    try {
      await ctx.editMessageText(updatedMessage, Extra.markdown().markup((m) =>
        m.inlineKeyboard([
          m.callbackButton('🎲', 'roll')
        ])))
    } catch (error) {
      console.error(`Could roll again: ${error.toString()}`)
    }
  }
})

bot.launch()
