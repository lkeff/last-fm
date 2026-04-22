/**
 * South American Orchestra — Discord Slash Commands
 *
 * Slash commands:
 *   /orchestra-sa info     — full rig overview & musician count
 *   /orchestra-sa section  — details for a specific section
 *   /orchestra-sa roster   — paginated musician roster
 *   /orchestra-sa audit    — Claude extended thinking authenticity audit
 *   /orchestra-sa repertoire — Claude programme recommendations
 *   /orchestra-sa rehearsal  — Claude rehearsal plan generator
 *   /orchestra-sa instruments — list all SA-specific instruments
 *
 * @module commands/orchestra-sa
 */

'use strict'

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js')
const {
  getSAOrchestra,
  getSAMusicianCount,
  getSAInstruments,
  generateSARoster
} = require('../rigs/south-american-orchestra')
const {
  auditSAOrchestra,
  recommendRepertoire,
  generateRehearsalPlan,
  formatAuditEmbed,
  formatRepertoireEmbed
} = require('../rigs/claude-orchestra-audit')

// ---------------------------------------------------------------------------
// Command definition
// ---------------------------------------------------------------------------
const data = new SlashCommandBuilder()
  .setName('orchestra-sa')
  .setDescription('South American Section Orchestra — rig info, Claude audits & repertoire')
  .addSubcommand(sub => sub
    .setName('info')
    .setDescription('Full rig overview and musician count breakdown'))
  .addSubcommand(sub => sub
    .setName('section')
    .setDescription('Details for a specific orchestra section')
    .addStringOption(opt => opt
      .setName('name')
      .setDescription('Section to inspect')
      .setRequired(true)
      .addChoices(
        { name: 'Strings (classical)', value: 'strings' },
        { name: 'Andean Winds', value: 'andeanWinds' },
        { name: 'Woodwinds', value: 'woodwinds' },
        { name: 'Brass', value: 'brass' },
        { name: 'Tango Section', value: 'tangoSection' },
        { name: 'Afro-Brazilian Percussion', value: 'afroBrazilianPercussion' },
        { name: 'Andean Percussion', value: 'andeanPercussion' },
        { name: 'Keyboards & Harp', value: 'keyboards' }
      )))
  .addSubcommand(sub => sub
    .setName('roster')
    .setDescription('Full 72-musician roster'))
  .addSubcommand(sub => sub
    .setName('instruments')
    .setDescription('List all SA-specific (non-European) instruments in the rig'))
  .addSubcommand(sub => sub
    .setName('audit')
    .setDescription('[Admin] Claude extended thinking authenticity audit')
    .addStringOption(opt => opt
      .setName('focus')
      .setDescription('Audit focus area')
      .setRequired(false)
      .addChoices(
        { name: 'All sections', value: 'all' },
        { name: 'Andean instruments', value: 'andean' },
        { name: 'Tango section', value: 'tango' },
        { name: 'Afro-Brazilian percussion', value: 'afrobrazilian' }
      )))
  .addSubcommand(sub => sub
    .setName('repertoire')
    .setDescription('[Admin] Claude programme recommendations')
    .addStringOption(opt => opt
      .setName('venue')
      .setDescription('Performance venue type')
      .addChoices(
        { name: 'Concert hall', value: 'concert-hall' },
        { name: 'Open air', value: 'open-air' },
        { name: 'Studio recording', value: 'studio' },
        { name: 'Festival', value: 'festival' }
      ))
    .addIntegerOption(opt => opt
      .setName('duration')
      .setDescription('Programme duration in minutes (default 90)')
      .setMinValue(30)
      .setMaxValue(180))
    .addStringOption(opt => opt
      .setName('style')
      .setDescription('Programme style')
      .addChoices(
        { name: 'Mixed (recommended)', value: 'mixed' },
        { name: 'SA Classical (Villa-Lobos / Ginastera)', value: 'classical_SA' },
        { name: 'Folk fusion', value: 'folk_fusion' },
        { name: 'Andean classical', value: 'andean_classical' }
      )))
  .addSubcommand(sub => sub
    .setName('rehearsal')
    .setDescription('[Admin] Claude rehearsal plan for multi-cultural ensemble')
    .addIntegerOption(opt => opt
      .setName('minutes')
      .setDescription('Total rehearsal duration (default 180 min)')
      .setMinValue(60)
      .setMaxValue(300)))

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
async function execute (interaction) {
  const sub = interaction.options.getSubcommand()

  // Admin-only subcommands require ManageGuild permission
  const ADMIN_SUBS = ['audit', 'repertoire', 'rehearsal']
  if (ADMIN_SUBS.includes(sub)) {
    const member = interaction.member
    if (!member || !member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        content: '❌ This command requires the **Manage Server** permission.',
        ephemeral: true
      })
    }
  }

  try {
    switch (sub) {
      case 'info': return handleInfo(interaction)
      case 'section': return handleSection(interaction)
      case 'roster': return handleRoster(interaction)
      case 'instruments': return handleInstruments(interaction)
      case 'audit': return handleAudit(interaction)
      case 'repertoire': return handleRepertoire(interaction)
      case 'rehearsal': return handleRehearsal(interaction)
      default:
        return interaction.reply({ content: '❌ Unknown subcommand.', ephemeral: true })
    }
  } catch (err) {
    console.error('[orchestra-sa] error:', err)
    const msg = `❌ Error: ${err.message || 'Unknown error'}`
    if (interaction.replied || interaction.deferred) {
      return interaction.followUp({ content: msg, ephemeral: true })
    }
    return interaction.reply({ content: msg, ephemeral: true })
  }
}

// ---------------------------------------------------------------------------
// Subcommand handlers
// ---------------------------------------------------------------------------

async function handleInfo (interaction) {
  const rig = getSAOrchestra()
  const counts = getSAMusicianCount()

  const embed = new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle('🌎 South American Section Orchestra')
    .setDescription(
      `A **${rig.totalMusicians}-musician** ensemble fusing classical European tradition ` +
      'with Andean, Afro-Brazilian, Argentine tango, and Venezuelan/Colombian folk voices.\n\n' +
      `*"${rig.layout.arrangement}"*`
    )
    .addFields(
      { name: '🎻 Strings (classical)', value: `${counts.strings} musicians`, inline: true },
      { name: '🪈 Andean Winds', value: `${counts.andeanWinds} musicians`, inline: true },
      { name: '🎵 Classical Woodwinds', value: `${counts.woodwinds} musicians`, inline: true },
      { name: '🎺 Brass', value: `${counts.brass} musicians`, inline: true },
      { name: '💃 Tango Section', value: `${counts.tangoSection} musicians`, inline: true },
      { name: '🥁 Afro-Brazilian Perc', value: `${counts.afroBrazilianPercussion} musicians`, inline: true },
      { name: '⛰️ Andean Percussion', value: `${counts.andeanPercussion} musicians`, inline: true },
      { name: '🎹 Keyboards & Harp', value: `${counts.keyboards} musicians`, inline: true },
      { name: '🎼 Total', value: `**${counts.total}** musicians`, inline: true },
      { name: '🗺️ Regional Zones', value: Object.entries(rig.layout.regionalZones).map(([k, v]) => `**${k}**: ${v}`).join('\n'), inline: false },
      { name: '🎵 Tuning', value: `${rig.technical.tuning.orchestralA}\nTango: ${rig.technical.tuning.tango}`, inline: false }
    )
    .setFooter({ text: `${rig.name} v${rig.version}` })
    .setTimestamp()

  return interaction.reply({ embeds: [embed] })
}

async function handleSection (interaction) {
  const sectionKey = interaction.options.getString('name')
  const rig = getSAOrchestra()
  const section = rig[sectionKey]

  if (!section) {
    return interaction.reply({ content: `❌ Section \`${sectionKey}\` not found.`, ephemeral: true })
  }

  const sectionNames = {
    strings: '🎻 Strings (Classical)',
    andeanWinds: '🪈 Andean Winds',
    woodwinds: '🎵 Woodwinds',
    brass: '🎺 Brass',
    tangoSection: '💃 Tango Section',
    afroBrazilianPercussion: '🥁 Afro-Brazilian Percussion',
    andeanPercussion: '⛰️ Andean Percussion',
    keyboards: '🎹 Keyboards & Harp'
  }

  const embed = new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle(sectionNames[sectionKey] || sectionKey)
    .setDescription(`**${section.totalMusicians} musicians**${section.origin ? ` · Origin: ${section.origin}` : ''}`)

  // Build field list from subsections
  const subsectionFields = []
  for (const [key, val] of Object.entries(section)) {
    if (['totalMusicians', 'position', 'origin', 'style', 'roots', 'note', 'notes'].includes(key)) continue
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      if (val.count !== undefined || val.players || val.description) {
        const desc = val.description
          ? val.description.slice(0, 120)
          : val.players
            ? val.players.map(p => p.role).join(', ')
            : `${val.count} player(s)`
        subsectionFields.push({ name: key, value: desc, inline: false })
      }
    }
  }

  if (section.position) {
    embed.addFields({ name: '📍 Position', value: section.position, inline: false })
  }
  subsectionFields.slice(0, 8).forEach(f => embed.addFields(f))
  embed.setFooter({ text: '/orchestra-sa section' }).setTimestamp()

  return interaction.reply({ embeds: [embed] })
}

async function handleRoster (interaction) {
  await interaction.deferReply()
  const roster = generateSARoster()

  // Group by section
  const bySection = {}
  roster.forEach(m => {
    if (!bySection[m.section]) bySection[m.section] = []
    bySection[m.section].push(m)
  })

  const embed = new EmbedBuilder()
    .setColor(0xf39c12)
    .setTitle('🎼 SA Orchestra — Full 72-Musician Roster')
    .setDescription(`Total: **${roster.length}** musicians across **${Object.keys(bySection).length}** sections`)

  for (const [section, members] of Object.entries(bySection)) {
    const value = members.slice(0, 6).map(m => `• ${m.role} (${m.instrument})`).join('\n') +
      (members.length > 6 ? `\n*...+${members.length - 6} more*` : '')
    embed.addFields({ name: `${section} (${members.length})`, value, inline: false })
  }

  embed.setFooter({ text: 'SA Orchestra Roster • /orchestra-sa roster' }).setTimestamp()
  return interaction.followUp({ embeds: [embed] })
}

async function handleInstruments (interaction) {
  const instruments = getSAInstruments()

  const embed = new EmbedBuilder()
    .setColor(0x1abc9c)
    .setTitle('🌎 SA Orchestra — Native Instruments')
    .setDescription(`**${instruments.length} South American instruments** in the rig`)

  instruments.slice(0, 10).forEach(inst => {
    embed.addFields({
      name: `${inst.name}`,
      value: `*${inst.origin}*\n${(inst.description || '').slice(0, 100)}`,
      inline: false
    })
  })

  if (instruments.length > 10) {
    embed.addFields({ name: `+${instruments.length - 10} more instruments`, value: 'Use /orchestra-sa section to dig deeper.', inline: false })
  }

  embed.setFooter({ text: 'SA Orchestra Instruments' }).setTimestamp()
  return interaction.reply({ embeds: [embed] })
}

async function handleAudit (interaction) {
  await interaction.deferReply()
  const focus = interaction.options.getString('focus') || 'all'

  const loadingEmbed = new EmbedBuilder()
    .setColor(0xf39c12)
    .setTitle('🎼 SA Orchestra Audit — Claude Thinking...')
    .setDescription(`Claude is conducting an extended-reasoning audit (focus: **${focus}**).\nThis may take 15–30 seconds.`)

  await interaction.editReply({ embeds: [loadingEmbed] })

  const result = await auditSAOrchestra({ focus })
  const embed = formatAuditEmbed(result)

  return interaction.editReply({ embeds: [new EmbedBuilder(embed)] })
}

async function handleRepertoire (interaction) {
  await interaction.deferReply()
  const venue = interaction.options.getString('venue') || 'concert-hall'
  const duration = interaction.options.getInteger('duration') || 90
  const style = interaction.options.getString('style') || 'mixed'

  const loadingEmbed = new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle('🎶 Repertoire Recommendations — Claude Thinking...')
    .setDescription(`Venue: **${venue}** · Duration: **${duration}min** · Style: **${style}**\nClaude is generating a programme...`)

  await interaction.editReply({ embeds: [loadingEmbed] })

  const result = await recommendRepertoire({ venue, duration, style })
  const embed = formatRepertoireEmbed(result)

  return interaction.editReply({ embeds: [new EmbedBuilder(embed)] })
}

async function handleRehearsal (interaction) {
  await interaction.deferReply()
  const minutes = interaction.options.getInteger('minutes') || 180

  const loadingEmbed = new EmbedBuilder()
    .setColor(0xe67e22)
    .setTitle('📋 Rehearsal Plan — Claude Thinking...')
    .setDescription(`Generating a ${minutes}-min multi-cultural rehearsal plan...`)

  await interaction.editReply({ embeds: [loadingEmbed] })

  const result = await generateRehearsalPlan({ rehearsalMinutes: minutes })

  if (!result.available) {
    return interaction.editReply({
      embeds: [new EmbedBuilder()
        .setColor(0x95a5a6)
        .setTitle('📋 Rehearsal Plan')
        .setDescription(result.decision.summary)
        .setFooter({ text: 'Claude not available — set ANTHROPIC_API_KEY' })]
    })
  }

  const d = result.decision
  const embed = new EmbedBuilder()
    .setColor(0xe67e22)
    .setTitle(`📋 SA Orchestra Rehearsal Plan — ${minutes} minutes`)
    .setDescription(d.tuningSequence ? `**Tuning sequence:**\n${d.tuningSequence.join('\n')}` : result.raw?.slice(0, 300) || 'Plan generated')

  if (d.blocks?.length) {
    const blocksText = d.blocks.slice(0, 6)
      .map(b => `**${b.startMin}–${b.endMin}min** ${b.activity}\n*Sections: ${(b.sections || []).join(', ')}*`)
      .join('\n\n')
    embed.addFields({ name: '📅 Schedule', value: blocksText.slice(0, 1000), inline: false })
  }

  if (d.pitfalls?.length) {
    embed.addFields({
      name: '⚠️ Pitfalls',
      value: d.pitfalls.slice(0, 3).map(p => `• ${p}`).join('\n'),
      inline: false
    })
  }

  embed.setFooter({ text: 'Claude extended thinking • SA Orchestra' }).setTimestamp()
  return interaction.editReply({ embeds: [embed] })
}

module.exports = { data, execute }
