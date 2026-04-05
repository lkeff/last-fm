/**
 * Claude Extended Thinking — Orchestra Audit Service
 *
 * Uses Anthropic Claude (extended thinking) to:
 *  1. Audit a rig or orchestra section for musical authenticity & completeness
 *  2. Recommend South American repertoire for a given lineup
 *  3. Generate tuning/scheduling notes for multi-cultural ensemble sessions
 *  4. Compare a custom roster against the SA Orchestra reference
 *
 * Requires:  ANTHROPIC_API_KEY env var
 * Optional:  CLAUDE_THINKING_BUDGET_TOKENS (default 10 000)
 *            CLAUDE_AUDIT_LOG_CHANNEL_ID   (Discord channel for audit embeds)
 *
 * @module rigs/claude-orchestra-audit
 */

'use strict'

const { getSAOrchestra, getSAMusicianCount, getSAInstruments, getSAPrincipals } = require('./south-american-orchestra')

let Anthropic
try {
    Anthropic = require('@anthropic-ai/sdk')
} catch (_) {
    Anthropic = null
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const MODEL = 'claude-opus-4-6'
const DEFAULT_BUDGET = 10_000
const MAX_TOKENS = 16_000

// ---------------------------------------------------------------------------
// Singleton client
// ---------------------------------------------------------------------------
let _client = null
function getClient () {
    if (!Anthropic) return null
    if (!process.env.ANTHROPIC_API_KEY) return null
    if (!_client) _client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY })
    return _client
}

// ---------------------------------------------------------------------------
// Core thinking call
// ---------------------------------------------------------------------------
async function _think (systemPrompt, userPrompt, budgetTokens) {
    const client = getClient()
    if (!client) {
        return {
            available: false,
            thinking: null,
            decision: { summary: 'Claude not configured — ANTHROPIC_API_KEY missing', recommendation: null }
        }
    }

    const budget = budgetTokens || parseInt(process.env.CLAUDE_THINKING_BUDGET_TOKENS || DEFAULT_BUDGET, 10)

    const response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        thinking: { type: 'enabled', budget_tokens: budget },
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
    })

    let thinkingContent = null
    let textContent = ''
    for (const block of response.content) {
        if (block.type === 'thinking') thinkingContent = block.thinking
        if (block.type === 'text') textContent += block.text
    }

    let parsed = null
    try {
        const jsonMatch = textContent.match(/```json\s*([\s\S]*?)```/) ||
                          textContent.match(/(\{[\s\S]*\})/)
        if (jsonMatch) parsed = JSON.parse(jsonMatch[1])
    } catch (_) { /* non-JSON response is fine */ }

    return {
        available: true,
        thinking: thinkingContent,
        raw: textContent,
        decision: parsed || { summary: textContent.slice(0, 400) }
    }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Full authenticity & completeness audit for the SA orchestra rig.
 * Claude reasons about: instrument coverage by region, historical accuracy,
 * missing voices, recording setup adequacy.
 *
 * @param {Object} [options]
 * @param {string} [options.focus] - 'andean' | 'tango' | 'afrobrazilian' | 'all'
 * @returns {Promise<Object>}
 */
async function auditSAOrchestra (options = {}) {
    const rig = getSAOrchestra()
    const counts = getSAMusicianCount()
    const saInstruments = getSAInstruments()
    const { focus = 'all' } = options

    const system = `You are a world-class ethnomusicologist and orchestral consultant
specialising in South American music. You apply extended reasoning to evaluate
orchestral rigs for musical authenticity, regional coverage, and performance practicality.

Always respond with a JSON block in this schema:
{
  "overallScore": <0-100>,
  "authenticityScore": <0-100>,
  "coverageScore": <0-100>,
  "practicalityScore": <0-100>,
  "summary": "<2-3 sentences>",
  "strengths": ["..."],
  "gaps": ["..."],
  "recommendations": ["..."],
  "missingInstruments": ["..."],
  "tuningNotes": "...",
  "conductorNotes": "..."
}`

    const user = `Audit the following South American Section Orchestra rig.
Focus: ${focus}

Total musicians: ${rig.totalMusicians}
Section counts: ${JSON.stringify(counts, null, 2)}
SA-specific instruments: ${JSON.stringify(saInstruments.map(i => i.name), null, 2)}

Tango section instruments: ${JSON.stringify(Object.keys(rig.tangoSection).filter(k => !['totalMusicians', 'position', 'origin', 'style'].includes(k)))}
Andean wind instruments: ${JSON.stringify(Object.keys(rig.andeanWinds).filter(k => !['totalMusicians', 'position', 'origin'].includes(k)))}
Afro-Brazilian percussion inventory (membranophones): ${JSON.stringify(rig.afroBrazilianPercussion.inventory.membranophones)}
Andean percussion: ${JSON.stringify(rig.andeanPercussion.players.map(p => p.primaryInstrument))}

Tuning standard: ${rig.technical.tuning.orchestralA}

Please assess: regional coverage (Andean, Tango, Afro-Brazilian, Caribbean, Amazonian),
instrument authenticity, ensemble balance, missing voices, and recording setup adequacy.`

    return _think(system, user, 12_000)
}

/**
 * Recommend SA repertoire for a given performance context.
 *
 * @param {Object} context
 * @param {string} context.venue     - 'concert-hall' | 'open-air' | 'studio' | 'festival'
 * @param {number} context.duration  - programme duration in minutes
 * @param {string} [context.style]   - 'classical_SA' | 'folk_fusion' | 'andean_classical' | 'mixed'
 * @param {string} [context.audience]- 'general' | 'academic' | 'folk-festival' | 'children'
 * @returns {Promise<Object>}
 */
async function recommendRepertoire (context) {
    const { venue = 'concert-hall', duration = 90, style = 'mixed', audience = 'general' } = context
    const rig = getSAOrchestra()

    const system = `You are a South American music programming expert.
Given an orchestra rig and performance context, you recommend a balanced concert programme.

Respond with JSON:
{
  "programmeTitle": "...",
  "duration": <minutes>,
  "works": [
    {
      "title": "...",
      "composer": "...",
      "origin": "...",
      "duration": <minutes>,
      "instrumentation": "...",
      "difficulty": "easy|medium|hard",
      "whyRecommended": "..."
    }
  ],
  "openingNote": "...",
  "intermissionNote": "...",
  "closingNote": "..."
}`

    const user = `Design a ${duration}-minute South American orchestra programme.
Venue: ${venue}
Style preference: ${style}
Target audience: ${audience}

Available sections:
- Classical strings (${rig.strings.totalMusicians} musicians)
- Andean winds (quena, siku, tarka, charango etc.)
- Tango section (bandoneón, tango violin, piano)
- Afro-Brazilian percussion (surdo, pandeiro, cuíca, atabaques, etc.)
- Andean percussion (cajón peruano, wankara)
- Classical woodwinds, brass
- Arpa Llanera, piano, accordion

Notable composers to draw from: Villa-Lobos, Ginastera, Piazzolla, Revueltas, Chávez.`

    return _think(system, user, 8_000)
}

/**
 * Generate multi-cultural tuning and rehearsal schedule.
 *
 * @param {Object} [opts]
 * @param {number} [opts.rehearsalMinutes=180]
 * @returns {Promise<Object>}
 */
async function generateRehearsalPlan (opts = {}) {
    const { rehearsalMinutes = 180 } = opts
    const rig = getSAOrchestra()

    const system = `You are an experienced orchestral rehearsal director
specialising in multi-cultural ensembles. Output JSON:
{
  "totalMinutes": <number>,
  "tuningSequence": ["step 1...", "step 2..."],
  "blocks": [
    { "startMin": 0, "endMin": 30, "activity": "...", "sections": ["..."], "notes": "..." }
  ],
  "pitfalls": ["..."],
  "conductorCues": ["..."]
}`

    const user = `Create a ${rehearsalMinutes}-minute rehearsal plan for the South American Section Orchestra.

Key challenges:
1. Classical strings tune to A=442 Hz; tango section uses A=440 Hz — reconcile before full ensemble.
2. Andean winds (quena in G, siku in G) need separate acoustic check — interlocking Siku ira/arka technique requires 15 min drill.
3. Afro-Brazilian bateria (${rig.afroBrazilianPercussion.totalMusicians} players) warms up with call & response before full ensemble.
4. Tango bandoneón players use push/pull bisonoric technique — conductor must accommodate long note delays on direction changes.
5. Cajón peruano needs isolation mic check; Cuíca friction drum needs separate monitor mix.
6. ${rig.totalMusicians} total musicians across ${Object.keys(rig).filter(k => typeof rig[k] === 'object' && rig[k].totalMusicians).length} sections.`

    return _think(system, user, 8_000)
}

/**
 * Compare a user-supplied custom roster against the SA Orchestra reference.
 * Identifies gaps, excesses, and substitution recommendations.
 *
 * @param {Array} customRoster  - array of { instrument: string, count: number }
 * @returns {Promise<Object>}
 */
async function compareRoster (customRoster) {
    const reference = getSAMusicianCount()
    const principals = getSAPrincipals()

    const system = `You are an orchestral consultant. Compare a custom roster
against the South American Section Orchestra reference and output JSON:
{
  "matchScore": <0-100>,
  "missingPrincipals": ["..."],
  "overStaffed": [{ "section": "...", "extra": <number> }],
  "underStaffed": [{ "section": "...", "missing": <number> }],
  "substitutions": [{ "missing": "...", "suggestion": "..." }],
  "verdict": "...",
  "adjustments": ["..."]
}`

    const user = `Reference SA orchestra section counts:
${JSON.stringify(reference, null, 2)}

Required principals (14 key seats):
${principals.map(p => `${p.role} (${p.instrument})`).join('\n')}

Custom roster provided:
${JSON.stringify(customRoster, null, 2)}

Identify gaps, surplus staff, substitution options for missing SA instruments,
and give an overall fit score.`

    return _think(system, user, 6_000)
}

// ---------------------------------------------------------------------------
// Formatting helpers for Discord
// ---------------------------------------------------------------------------

/**
 * Format an audit result as a Discord embed object.
 * @param {Object} result - from auditSAOrchestra()
 * @returns {Object} Discord embed
 */
function formatAuditEmbed (result) {
    if (!result.available) {
        return {
            color: 0x95a5a6,
            title: '🎼 SA Orchestra Audit',
            description: result.decision.summary,
            footer: { text: 'Claude not available — set ANTHROPIC_API_KEY' }
        }
    }

    const d = result.decision
    const scoreEmoji = s => s >= 85 ? '🟢' : s >= 65 ? '🟡' : '🔴'

    return {
        color: 0x2ecc71,
        title: '🎼 South American Orchestra — Claude Audit',
        description: d.summary || 'Audit complete',
        fields: [
            {
                name: `${scoreEmoji(d.overallScore || 0)} Overall Score`,
                value: `**${d.overallScore || 'N/A'} / 100**`,
                inline: true
            },
            {
                name: `${scoreEmoji(d.authenticityScore || 0)} Authenticity`,
                value: `${d.authenticityScore || 'N/A'} / 100`,
                inline: true
            },
            {
                name: `${scoreEmoji(d.coverageScore || 0)} Regional Coverage`,
                value: `${d.coverageScore || 'N/A'} / 100`,
                inline: true
            },
            d.strengths?.length ? {
                name: '✅ Strengths',
                value: d.strengths.slice(0, 3).map(s => `• ${s}`).join('\n'),
                inline: false
            } : null,
            d.gaps?.length ? {
                name: '⚠️ Gaps',
                value: d.gaps.slice(0, 3).map(g => `• ${g}`).join('\n'),
                inline: false
            } : null,
            d.recommendations?.length ? {
                name: '💡 Recommendations',
                value: d.recommendations.slice(0, 3).map(r => `• ${r}`).join('\n'),
                inline: false
            } : null,
            d.tuningNotes ? {
                name: '🎵 Tuning Notes',
                value: d.tuningNotes.slice(0, 200),
                inline: false
            } : null
        ].filter(Boolean),
        footer: { text: `SA Orchestra Audit • Claude extended thinking • ${new Date().toISOString()}` },
        timestamp: new Date().toISOString()
    }
}

/**
 * Format a repertoire recommendation as a Discord embed.
 * @param {Object} result - from recommendRepertoire()
 * @returns {Object} Discord embed
 */
function formatRepertoireEmbed (result) {
    if (!result.available) {
        return {
            color: 0x95a5a6,
            title: '🎶 Repertoire Recommendations',
            description: result.decision.summary,
            footer: { text: 'Claude not available' }
        }
    }

    const d = result.decision
    const worksField = d.works?.slice(0, 5).map(w =>
        `**${w.title}** — *${w.composer}* (${w.origin}, ${w.duration}min)\n${w.whyRecommended || ''}`
    ).join('\n\n') || 'No works generated'

    return {
        color: 0x9b59b6,
        title: `🎶 ${d.programmeTitle || 'SA Orchestra Programme'}`,
        description: d.openingNote || '',
        fields: [
            { name: '📋 Works', value: worksField.slice(0, 1000), inline: false },
            d.closingNote ? { name: '🎭 Closing Note', value: d.closingNote, inline: false } : null
        ].filter(Boolean),
        footer: { text: `Total duration: ${d.duration || '?'} min • Claude extended thinking` },
        timestamp: new Date().toISOString()
    }
}

module.exports = {
    auditSAOrchestra,
    recommendRepertoire,
    generateRehearsalPlan,
    compareRoster,
    formatAuditEmbed,
    formatRepertoireEmbed
}
