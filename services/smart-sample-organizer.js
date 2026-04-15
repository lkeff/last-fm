/**
 * Smart Sample Organizer
 * Music theory-based automatic sample categorization and organization system
 * Uses tonal analysis, machine learning, and audio feature extraction
 *
 * @module services/smart-sample-organizer
 * @version 1.0.0
 */

const { Tonal } = require('tonal');
const { FFT } = require('fft.js');
const musicTempo = require('music-tempo');
const EventEmitter = require('events');
const path = require('path');
const fs = require('fs').promises;
const { unpackBuffers } = require('../utils/zip-unpack');
const { RAMDAC } = require('../utils/ramdac');

/**
 * SmartSampleOrganizer - Intelligent audio sample categorization
 * Automatically analyzes and organizes samples based on musical characteristics
 */
class SmartSampleOrganizer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Analysis settings
      fftSize: options.fftSize || 2048,
      sampleRate: options.sampleRate || 44100,
      hopSize: options.hopSize || 512,
      
      // Classification thresholds
      tempoThresholds: options.tempoThresholds || {
        slow: [60, 90],
        medium: [90, 140],
        fast: [140, 200]
      },
      
      // Musical categories
      categories: options.categories || {
        brass: ['trumpet', 'trombone', 'horn', 'tuba', 'brass-section'],
        woodwind: ['flute', 'clarinet', 'saxophone', 'oboe'],
        strings: ['violin', 'viola', 'cello', 'bass', 'string-section'],
        percussion: ['kick', 'snare', 'hihat', 'crash', 'percussion'],
        harmonic: ['chord', 'arp', 'pad', 'lead', 'bass'],
        rhythmic: ['beat', 'loop', 'pattern', 'groove'],
        atmospheric: ['ambient', 'texture', 'fx', 'sweep', 'drone']
      },
      
      // Key detection
      keyProfiles: this.createKeyProfiles(),
      
      // Database settings
      databasePath: options.databasePath || './data/sample-analysis.json',
      autoSave: options.autoSave !== false,
      
      ...options
    };

    this.state = {
      analyzing: false,
      sampleDatabase: new Map(),
      analysisQueue: [],
      statistics: {
        totalSamples: 0,
        categorized: 0,
        keyDetected: 0,
        tempoDetected: 0
      }
    };

    // Initialize analysis tools
    this.fft = new FFT(this.config.fftSize);
    this.loadDatabase();
  }

  /**
   * Analyze a single audio sample and categorize it
   * @param {Buffer} audioBuffer - Raw audio data
   * @param {string} filename - Sample filename
   * @param {Object} metadata - Additional metadata
   */
  async analyzeSample(audioBuffer, filename, metadata = {}) {
    try {
      this.emit('analysisStarted', { filename });
      
      // Convert audio buffer to analysis format
      const audioData = this.preprocessAudio(audioBuffer);
      
      // Perform comprehensive analysis
      const analysis = {
        filename,
        timestamp: Date.now(),
        metadata,
        
        // Basic properties
        duration: audioData.length / this.config.sampleRate,
        sampleRate: this.config.sampleRate,
        channels: audioData.channels || 1,
        
        // Musical analysis
        key: await this.detectKey(audioData),
        tempo: await this.detectTempo(audioData),
        scale: null,
        chords: [],
        
        // Audio characteristics
        spectralFeatures: this.extractSpectralFeatures(audioData),
        harmonicContent: this.analyzeHarmonicContent(audioData),
        rhythmicFeatures: this.extractRhythmicFeatures(audioData),
        
        // Classification
        category: null,
        subcategory: null,
        tags: [],
        confidence: 0,
        
        // Organization metadata
        suggested_folder: null,
        similar_samples: [],
        musical_compatibility: {}
      };

      // Detect scale if key is found
      if (analysis.key && analysis.key !== 'unknown') {
        analysis.scale = this.detectScale(audioData, analysis.key);
      }

      // Detect chords and harmonic progressions
      if (analysis.harmonicContent.isHarmonic) {
        analysis.chords = this.detectChords(audioData, analysis.key);
      }

      // Classify sample category
      const classification = this.classifySample(analysis);
      analysis.category = classification.category;
      analysis.subcategory = classification.subcategory;
      analysis.tags = classification.tags;
      analysis.confidence = classification.confidence;

      // Generate organization suggestions
      analysis.suggested_folder = this.generateFolderSuggestion(analysis);
      analysis.similar_samples = this.findSimilarSamples(analysis);
      analysis.musical_compatibility = this.calculateCompatibility(analysis);

      // Store analysis results
      this.state.sampleDatabase.set(filename, analysis);
      this.updateStatistics();
      
      if (this.config.autoSave) {
        await this.saveDatabase();
      }

      this.emit('analysisComplete', analysis);
      return analysis;
      
    } catch (error) {
      this.emit('error', `Analysis failed for ${filename}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Preprocess audio data for analysis
   */
  preprocessAudio(audioBuffer) {
    // Convert buffer to float array
    let audioData;
    if (audioBuffer instanceof Float32Array) {
      audioData = audioBuffer;
    } else {
      // Convert from Int16 or other formats
      audioData = new Float32Array(audioBuffer.length / 2);
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = audioBuffer.readInt16LE(i * 2) / 32768.0;
      }
    }

    // Normalize audio
    const maxValue = Math.max(...audioData.map(Math.abs));
    if (maxValue > 0) {
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] /= maxValue;
      }
    }

    return audioData;
  }

  /**
   * Detect the musical key of the sample
   */
  async detectKey(audioData) {
    try {
      // Calculate chromagram
      const chromagram = this.calculateChromagram(audioData);
      
      // Compare with key profiles
      let bestKey = 'unknown';
      let bestScore = 0;
      
      for (const [key, profile] of Object.entries(this.config.keyProfiles)) {
        const score = this.correlateWithProfile(chromagram, profile);
        if (score > bestScore) {
          bestScore = score;
          bestKey = key;
        }
      }
      
      // Return key if confidence is high enough
      return bestScore > 0.6 ? bestKey : 'unknown';
      
    } catch (error) {
      console.error('Key detection failed:', error);
      return 'unknown';
    }
  }

  /**
   * Detect tempo using music-tempo library
   */
  async detectTempo(audioData) {
    try {
      const tempoData = musicTempo(audioData, this.config.sampleRate);
      return tempoData.tempo || 0;
    } catch (error) {
      console.error('Tempo detection failed:', error);
      return 0;
    }
  }

  /**
   * Detect scale based on key and note distribution
   */
  detectScale(audioData, key) {
    const chromagram = this.calculateChromagram(audioData);
    const keyNote = Tonal.Note.get(key.replace(/m$/, ''));
    
    // Test against common scales
    const scales = ['major', 'minor', 'dorian', 'mixolydian', 'pentatonic'];
    let bestScale = 'major';
    let bestScore = 0;
    
    scales.forEach(scaleName => {
      const scale = Tonal.Scale.get(`${keyNote.name} ${scaleName}`);
      const scaleProfile = this.createScaleProfile(scale.notes);
      const score = this.correlateWithProfile(chromagram, scaleProfile);
      
      if (score > bestScore) {
        bestScore = score;
        bestScale = scaleName;
      }
    });
    
    return bestScore > 0.5 ? bestScale : 'major';
  }

  /**
   * Detect chords in harmonic content
   */
  detectChords(audioData, key) {
    const frameSize = 4096;
    const hopSize = 2048;
    const chords = [];
    
    for (let i = 0; i < audioData.length - frameSize; i += hopSize) {
      const frame = audioData.slice(i, i + frameSize);
      const chromagram = this.calculateChromagram(frame);
      
      // Find dominant chord
      const chord = this.identifyChord(chromagram, key);
      if (chord && chord !== 'unknown') {
        const timePosition = i / this.config.sampleRate;
        chords.push({
          time: timePosition,
          chord: chord,
          confidence: 0.8 // Simplified confidence
        });
      }
    }
    
    return this.consolidateChords(chords);
  }

  /**
   * Extract spectral features for classification
   */
  extractSpectralFeatures(audioData) {
    const spectrum = this.calculateSpectrum(audioData);
    
    return {
      centroid: this.calculateSpectralCentroid(spectrum),
      rolloff: this.calculateSpectralRolloff(spectrum),
      flux: this.calculateSpectralFlux(spectrum),
      flatness: this.calculateSpectralFlatness(spectrum),
      brightness: this.calculateBrightness(spectrum),
      roughness: this.calculateRoughness(spectrum)
    };
  }

  /**
   * Analyze harmonic content
   */
  analyzeHarmonicContent(audioData) {
    const spectrum = this.calculateSpectrum(audioData);
    const harmonics = this.findHarmonics(spectrum);
    
    return {
      isHarmonic: harmonics.length > 2,
      fundamentalFreq: harmonics[0]?.frequency || 0,
      harmonicStrength: this.calculateHarmonicStrength(harmonics),
      inharmonicity: this.calculateInharmonicity(harmonics),
      harmonicCount: harmonics.length
    };
  }

  /**
   * Extract rhythmic features
   */
  extractRhythmicFeatures(audioData) {
    // Calculate onset detection function
    const onsets = this.detectOnsets(audioData);
    
    return {
      onsetCount: onsets.length,
      onsetDensity: onsets.length / (audioData.length / this.config.sampleRate),
      isRhythmic: onsets.length > 4,
      rhythmicComplexity: this.calculateRhythmicComplexity(onsets),
      pulse: this.detectPulse(onsets)
    };
  }

  /**
   * Classify sample into categories
   */
  classifySample(analysis) {
    const features = {
      spectral: analysis.spectralFeatures,
      harmonic: analysis.harmonicContent,
      rhythmic: analysis.rhythmicFeatures,
      tempo: analysis.tempo,
      duration: analysis.duration
    };
    
    // Rule-based classification
    const scores = {};
    
    // Brass classification
    scores.brass = this.calculateBrassScore(features);
    
    // Percussion classification  
    scores.percussion = this.calculatePercussionScore(features);
    
    // Harmonic/melodic classification
    scores.harmonic = this.calculateHarmonicScore(features);
    
    // Rhythmic classification
    scores.rhythmic = this.calculateRhythmicScore(features);
    
    // Atmospheric classification
    scores.atmospheric = this.calculateAtmosphericScore(features);
    
    // Find best category
    const bestCategory = Object.keys(scores).reduce((a, b) => 
      scores[a] > scores[b] ? a : b
    );
    
    const confidence = scores[bestCategory];
    const subcategory = this.determineSubcategory(bestCategory, features);
    const tags = this.generateTags(analysis, bestCategory, subcategory);
    
    return {
      category: bestCategory,
      subcategory,
      tags,
      confidence: Math.min(confidence, 1.0),
      scores
    };
  }

  /**
   * Calculate brass instrument score
   */
  calculateBrassScore(features) {
    let score = 0;
    
    // Brass instruments have strong harmonics
    if (features.harmonic.harmonicStrength > 0.7) score += 0.3;
    
    // Specific spectral characteristics
    if (features.spectral.centroid > 800 && features.spectral.centroid < 2500) score += 0.2;
    
    // Brass brightness
    if (features.spectral.brightness > 0.6) score += 0.2;
    
    // Harmonic content
    if (features.harmonic.harmonicCount > 6) score += 0.2;
    
    // Low inharmonicity
    if (features.harmonic.inharmonicity < 0.3) score += 0.1;
    
    return score;
  }

  /**
   * Calculate percussion score
   */
  calculatePercussionScore(features) {
    let score = 0;
    
    // High onset density
    if (features.rhythmic.onsetDensity > 2) score += 0.3;
    
    // Short duration typical for percussion
    if (features.duration < 2) score += 0.2;
    
    // Low harmonic content
    if (!features.harmonic.isHarmonic) score += 0.2;
    
    // High spectral flux (transients)
    if (features.spectral.flux > 0.5) score += 0.2;
    
    // Rhythmic complexity
    if (features.rhythmic.isRhythmic) score += 0.1;
    
    return score;
  }

  /**
   * Generate folder suggestion based on analysis
   */
  generateFolderSuggestion(analysis) {
    const parts = [];
    
    // Category
    parts.push(analysis.category);
    
    // Key (if detected)
    if (analysis.key && analysis.key !== 'unknown') {
      parts.push(`Key_${analysis.key}`);
    }
    
    // Tempo category
    if (analysis.tempo > 0) {
      const tempoCategory = this.categorizeTempo(analysis.tempo);
      parts.push(`Tempo_${tempoCategory}`);
    }
    
    // Subcategory
    if (analysis.subcategory) {
      parts.push(analysis.subcategory);
    }
    
    return parts.join('/');
  }

  /**
   * Find similar samples in database
   */
  findSimilarSamples(targetAnalysis) {
    const similarities = [];
    
    for (const [filename, analysis] of this.state.sampleDatabase.entries()) {
      if (filename === targetAnalysis.filename) continue;
      
      const similarity = this.calculateSimilarity(targetAnalysis, analysis);
      if (similarity > 0.6) {
        similarities.push({
          filename,
          similarity,
          sharedFeatures: this.getSharedFeatures(targetAnalysis, analysis)
        });
      }
    }
    
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);
  }

  /**
   * Calculate musical compatibility with other samples
   */
  calculateCompatibility(analysis) {
    const compatibility = {
      keyCompatible: [],
      tempoCompatible: [],
      categoryCompatible: []
    };
    
    for (const [filename, otherAnalysis] of this.state.sampleDatabase.entries()) {
      if (filename === analysis.filename) continue;
      
      // Key compatibility
      if (this.areKeysCompatible(analysis.key, otherAnalysis.key)) {
        compatibility.keyCompatible.push(filename);
      }
      
      // Tempo compatibility (within 10% or same category)
      if (this.areTemposCompatible(analysis.tempo, otherAnalysis.tempo)) {
        compatibility.tempoCompatible.push(filename);
      }
      
      // Category compatibility
      if (analysis.category === otherAnalysis.category) {
        compatibility.categoryCompatible.push(filename);
      }
    }
    
    return compatibility;
  }

  /**
   * Create key profiles for key detection
   */
  createKeyProfiles() {
    const profiles = {};
    
    // Major keys
    Tonal.Note.names().forEach(note => {
      const scale = Tonal.Scale.get(`${note} major`);
      profiles[note] = this.createScaleProfile(scale.notes);
    });
    
    // Minor keys  
    Tonal.Note.names().forEach(note => {
      const scale = Tonal.Scale.get(`${note} minor`);
      profiles[`${note}m`] = this.createScaleProfile(scale.notes);
    });
    
    return profiles;
  }

  /**
   * Create scale profile for comparison
   */
  createScaleProfile(notes) {
    const profile = new Array(12).fill(0);
    
    notes.forEach(note => {
      const noteObj = Tonal.Note.get(note);
      if (noteObj.chroma !== null) {
        profile[noteObj.chroma] = 1;
      }
    });
    
    return profile;
  }

  /**
   * Calculate chromagram from audio data
   */
  calculateChromagram(audioData) {
    const spectrum = this.calculateSpectrum(audioData);
    const chromagram = new Array(12).fill(0);
    
    for (let i = 0; i < spectrum.length; i++) {
      const frequency = i * this.config.sampleRate / (2 * spectrum.length);
      if (frequency > 80 && frequency < 2000) { // Focus on musical range
        const note = Tonal.Note.fromFreq(frequency);
        if (note.chroma !== null) {
          chromagram[note.chroma] += spectrum[i];
        }
      }
    }
    
    // Normalize
    const sum = chromagram.reduce((a, b) => a + b, 0);
    return sum > 0 ? chromagram.map(x => x / sum) : chromagram;
  }

  /**
   * Batch organize multiple samples
   */
  async organizeSampleLibrary(samplePaths) {
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      categories: {}
    };
    
    for (const samplePath of samplePaths) {
      try {
        const audioBuffer = await fs.readFile(samplePath);
        const filename = path.basename(samplePath);
        
        const analysis = await this.analyzeSample(audioBuffer, filename);
        
        // Update category counts
        if (!results.categories[analysis.category]) {
          results.categories[analysis.category] = 0;
        }
        results.categories[analysis.category]++;
        
        results.successful++;
        
        this.emit('sampleProcessed', {
          filename,
          category: analysis.category,
          suggestedFolder: analysis.suggested_folder
        });
        
      } catch (error) {
        results.failed++;
        this.emit('processingError', {
          filename: path.basename(samplePath),
          error: error.message
        });
      }
      
      results.processed++;
    }
    
    this.emit('batchComplete', results);
    return results;
  }

  /**
   * Get organization statistics
   */
  getStatistics() {
    return {
      ...this.state.statistics,
      categories: this.getCategoryDistribution(),
      keys: this.getKeyDistribution(),
      tempos: this.getTempoDistribution()
    };
  }

  /**
   * Save analysis database to file
   */
  async saveDatabase() {
    try {
      const data = {
        timestamp: Date.now(),
        version: '1.0.0',
        samples: Object.fromEntries(this.state.sampleDatabase),
        statistics: this.state.statistics
      };
      
      await fs.writeFile(
        this.config.databasePath,
        JSON.stringify(data, null, 2),
        'utf8'
      );
      
      this.emit('databaseSaved');
      
    } catch (error) {
      this.emit('error', `Failed to save database: ${error.message}`);
    }
  }

  /**
   * Load analysis database from file
   */
  async loadDatabase() {
    try {
      const data = await fs.readFile(this.config.databasePath, 'utf8');
      const parsed = JSON.parse(data);
      
      this.state.sampleDatabase = new Map(Object.entries(parsed.samples || {}));
      this.state.statistics = parsed.statistics || this.state.statistics;
      
      this.emit('databaseLoaded', {
        samples: this.state.sampleDatabase.size,
        version: parsed.version
      });
      
    } catch (error) {
      // Database doesn't exist yet, start fresh
      console.log('Starting with empty sample database');
    }
  }

  /**
   * Get current organizer state
   */
  getState() {
    return {
      analyzing: this.state.analyzing,
      databaseSize: this.state.sampleDatabase.size,
      queueLength: this.state.analysisQueue.length,
      statistics: this.state.statistics,
      categories: Object.keys(this.config.categories)
    };
  }

  /**
   * Dispose of organizer resources
   */
  async dispose() {
    if (this.config.autoSave) {
      await this.saveDatabase();
    }
    
    this.state.sampleDatabase.clear();
    this.state.analysisQueue = [];
    
    this.emit('disposed');
  }

  /**
   * Load and analyze all audio samples from a .zip archive using RAMDAC
   * double-buffering to prevent cuts during extraction.
   *
   * Each entry is atomically committed before analysis begins, so no consumer
   * ever sees a partial buffer.
   *
   * @param {Buffer|string} zipSource  Buffer of zip data or absolute file path
   * @param {object}        [opts]
   * @param {function}      [opts.filter]  (entryName) => bool — skip entries
   * @returns {Promise<Array>}  Array of analysis results for each sample
   */
  async loadFromZip (zipSource, opts = {}) {
    this.emit('zipLoadStarted', { source: typeof zipSource === 'string' ? zipSource : '<buffer>' });

    const bufferMap = await unpackBuffers(zipSource, {
      filter: opts.filter || (name => /\.(wav|mp3|aiff?|flac|ogg)$/i.test(name))
    });

    const results = [];
    for (const [entryName, audioBuffer] of bufferMap) {
      const ramdac = new RAMDAC({ id: `sample:${entryName}` });
      await ramdac.loadAndCommit(audioBuffer, { format: 'raw' });
      const committed = ramdac.read();
      const analysis = await this.analyzeSample(committed, path.basename(entryName), { zipEntry: entryName });
      results.push(analysis);
    }

    this.emit('zipLoadComplete', { count: results.length });
    return results;
  }
}

module.exports = SmartSampleOrganizer;
