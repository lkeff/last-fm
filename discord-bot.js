/*
 * Last.fm Discord Bot
 * Provides a /countdown slash command backed by utils/countdown.js.
 *
 * Required env: DISCORD_TOKEN
 * Optional env: DISCORD_GUILD_ID (register commands to one guild for instant updates),
 *               LASTFM_API_KEY (enables /countdown nowplaying),
 *               COUNTDOWN_STORE_PATH (default ./data/countdowns.json; timers survive restarts),
 *               COUNTDOWN_ALERTS (comma-separated seconds, default 60,30,10),
 *               COUNTDOWN_MAX_HOURS (default 24), COUNTDOWN_MAX_PER_USER (default 5)
 */
require('dotenv').config()

const {
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  SlashCommandBuilder,
  escapeMarkdown
} = require('discord.js')
const LastFM = require('./index.js')
const { CountdownManager, countdownOptionsFromEnv, formatDuration } = require('./utils/countdown')
const { JsonFileStore } = require('./utils/countdown-store')
const { nowPlayingTrack } = require('./utils/now-playing')

const token = process.env.DISCORD_TOKEN
if (!token) {
  console.error('DISCORD_TOKEN is not set. Copy .env.example to .env and add your bot token.')
  process.exit(1)
}

const countdowns = new CountdownManager({
  ...countdownOptionsFromEnv(),
  store: new JsonFileStore(process.env.COUNTDOWN_STORE_PATH || 'data/countdowns.json')
})

const DISCORD_MESSAGE_LIMIT = 2000

const lastfm = process.env.LASTFM_API_KEY ? new LastFM(process.env.LASTFM_API_KEY) : null

const countdownCommand = new SlashCommandBuilder()
  .setName('countdown')
  .setDescription('Countdown timers')
  .addSubcommand(sub => sub
    .setName('start')
    .setDescription('Start a countdown in this channel')
    .addStringOption(opt => opt
      .setName('duration')
      .setDescription('e.g. 90, 45s, 5m, 1h30m, 1:30')
      .setRequired(true))
    .addStringOption(opt => opt
      .setName('label')
      .setDescription('What the countdown is for')
      .setMaxLength(100)))
  .addSubcommand(sub => sub
    .setName('nowplaying')
    .setDescription('Count down the length of the track a Last.fm user is playing')
    .addStringOption(opt => opt
      .setName('user')
      .setDescription('Last.fm username')
      .setRequired(true)
      .setMaxLength(64)))
  .addSubcommand(sub => sub
    .setName('list')
    .setDescription('List active countdowns in this channel'))
  .addSubcommand(sub => sub
    .setName('cancel')
    .setDescription('Cancel one of your countdowns')
    .addIntegerOption(opt => opt
      .setName('id')
      .setDescription('Countdown ID (see /countdown list)')
      .setRequired(true)
      .setMinValue(1)))

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

function timerName (timer) {
  return timer.label ? `#${timer.id} **${escapeMarkdown(timer.label, { heading: true, bulletedList: true, numberedList: true, maskedLink: true })}**` : `#${timer.id}`
}

function unixSeconds (ms) {
  return Math.floor(ms / 1000)
}

async function sendToChannel (timer, payload) {
  try {
    const channel = await client.channels.fetch(timer.channelId)
    if (channel && channel.isTextBased()) await channel.send(payload)
  } catch (err) {
    console.error(`Failed to post update for countdown #${timer.id}:`, err.message)
  }
}

countdowns.on('alert', (timer, remainingMs) => {
  sendToChannel(timer, {
    content: `Countdown ${timerName(timer)}: ${formatDuration(remainingMs)} remaining`,
    allowedMentions: { parse: [] }
  })
})

countdowns.on('finish', (timer, { missed }) => {
  const suffix = missed ? ` (ended <t:${unixSeconds(timer.endsAt)}:R> while the bot was offline)` : ''
  sendToChannel(timer, {
    content: `<@${timer.ownerId}> Countdown ${timerName(timer)} is done!${suffix}`,
    allowedMentions: { parse: [], users: [timer.ownerId] }
  })
})

async function handleStart (interaction) {
  const timer = countdowns.start({
    duration: interaction.options.getString('duration', true),
    label: interaction.options.getString('label') || '',
    ownerId: interaction.user.id,
    channelId: interaction.channelId
  })
  await interaction.reply({
    content: `Countdown ${timerName(timer)} started for ${formatDuration(timer.durationMs)}, ends <t:${unixSeconds(timer.endsAt)}:R>.`,
    allowedMentions: { parse: [] }
  })
}

async function handleNowPlaying (interaction) {
  if (!lastfm) throw new Error('LASTFM_API_KEY is not configured for this bot')
  const user = interaction.options.getString('user', true)
  await interaction.deferReply()
  const track = await nowPlayingTrack(lastfm, user)
  const timer = countdowns.start({
    duration: track.durationMs,
    label: `${track.artistName} - ${track.name}`,
    ownerId: interaction.user.id,
    channelId: interaction.channelId
  })
  await interaction.editReply({
    content: `Countdown ${timerName(timer)} started for ${user}'s track (${formatDuration(timer.durationMs)}, full length from now), ends <t:${unixSeconds(timer.endsAt)}:R>.`,
    allowedMentions: { parse: [] }
  })
}

async function handleList (interaction) {
  const timers = countdowns.list({ channelId: interaction.channelId })
  const lines = timers.map(t => `${timerName(t)} by <@${t.ownerId}>, ends <t:${unixSeconds(t.endsAt)}:R>`)
  let content = lines.length === 0 ? 'No active countdowns in this channel.' : ''
  for (const [i, line] of lines.entries()) {
    const more = `\n...and ${lines.length - i} more`
    const reserved = i < lines.length - 1 ? `\n...and ${lines.length - i - 1} more`.length : 0
    if (content.length + 1 + line.length + reserved > DISCORD_MESSAGE_LIMIT) {
      content += more
      break
    }
    content += (content ? '\n' : '') + line
  }
  await interaction.reply({ content, flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } })
}

async function handleCancel (interaction) {
  const id = interaction.options.getInteger('id', true)
  const timer = countdowns.get(id)
  const cancelled = countdowns.cancel(id, interaction.user.id)
  if (cancelled) {
    await interaction.reply({ content: `Cancelled countdown ${timerName(timer)}.`, allowedMentions: { parse: [] } })
  } else {
    await interaction.reply({ content: `You have no active countdown with ID ${id}.`, flags: MessageFlags.Ephemeral })
  }
}

let timersRestored = false

client.once(Events.ClientReady, async (readyClient) => {
  const { restored, missed } = countdowns.restore()
  timersRestored = true
  if (restored || missed) console.log(`Restored ${restored} countdown(s); ${missed} ended while offline.`)

  const guildId = process.env.DISCORD_GUILD_ID
  const commands = [countdownCommand.toJSON()]
  try {
    await readyClient.application.commands.set(commands, guildId)
  } catch (err) {
    console.error(`Failed to register /countdown ${guildId ? `to guild ${guildId}` : 'globally'}: ${err.message}`)
    if (guildId) console.error('Check that DISCORD_GUILD_ID is a server ID and the bot was invited with the applications.commands scope.')
    countdowns.stop()
    client.destroy()
    process.exit(1)
  }
  console.log(`Logged in as ${readyClient.user.tag}; /countdown registered ${guildId ? `to guild ${guildId}` : 'globally'}.`)
})

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== 'countdown') return
  if (!timersRestored) {
    await interaction.reply({ content: 'The bot is still starting up, try again in a few seconds.', flags: MessageFlags.Ephemeral }).catch(() => {})
    return
  }
  try {
    switch (interaction.options.getSubcommand()) {
      case 'start': return await handleStart(interaction)
      case 'nowplaying': return await handleNowPlaying(interaction)
      case 'list': return await handleList(interaction)
      case 'cancel': return await handleCancel(interaction)
    }
  } catch (err) {
    const payload = { content: `Error: ${err.message}`, flags: MessageFlags.Ephemeral }
    if (interaction.deferred && !interaction.replied) {
      await interaction.deleteReply().catch(() => {})
      await interaction.followUp(payload).catch(() => {})
    } else if (interaction.replied) await interaction.followUp(payload).catch(() => {})
    else await interaction.reply(payload).catch(() => {})
  }
})

function shutdown () {
  countdowns.stop()
  client.destroy()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

client.login(token).catch((err) => {
  console.error('Discord login failed:', err.message)
  process.exit(1)
})
