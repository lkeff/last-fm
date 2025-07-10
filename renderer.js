// Renderer process for Brass Stabs Electron App
// Handles UI interactions and communicates with main process via preload APIs

class BrassStabsApp {
  constructor() {
    this.currentSearchType = 'lastfm';
    this.searchCache = new Map();
    this.isLoading = false;
    this.selectedFiles = [];
    this.fiddleTemplates = [];
    
    this.init();
  }

  async init() {
    try {
      this.setupEventListeners();
      this.setupSearchDebouncing();
      await this.loadFiddleTemplates();
      this.showNotification('🎺 Brass Stabs App loaded successfully!', 'success');
    } catch (error) {
      this.showError('Failed to initialize app', error);
    }
  }

  setupEventListeners() {
    // Search form submissions
    const lastfmForm = document.getElementById('lastfm-search-form');
    const localBrassForm = document.getElementById('local-brass-search-form');
    const onlineBrassForm = document.getElementById('online-brass-search-form');

    if (lastfmForm) {
      lastfmForm.addEventListener('submit', (e) => this.handleSearch(e, 'lastfm'));
    }
    if (localBrassForm) {
      localBrassForm.addEventListener('submit', (e) => this.handleSearch(e, 'local-brass'));
    }
    if (onlineBrassForm) {
      onlineBrassForm.addEventListener('submit', (e) => this.handleSearch(e, 'online-brass'));
    }

    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    // File selection for brass samples
    const selectFileBtn = document.getElementById('select-brass-file-btn');
    if (selectFileBtn) {
      selectFileBtn.addEventListener('click', () => this.selectBrassFiles());
    }

    // Add brass sample form
    const addSampleForm = document.getElementById('add-sample-form');
    if (addSampleForm) {
      addSampleForm.addEventListener('submit', (e) => this.handleAddSample(e));
    }

    // Fiddle template buttons
    const openFiddleBtn = document.getElementById('open-fiddle-btn');
    if (openFiddleBtn) {
      openFiddleBtn.addEventListener('click', () => this.openSelectedFiddle());
    }

    // Clear results buttons
    const clearButtons = document.querySelectorAll('.clear-results-btn');
    clearButtons.forEach(btn => {
      btn.addEventListener('click', (e) => this.clearResults(e.target.dataset.type));
    });

    // Search input real-time validation
    const searchInputs = document.querySelectorAll('.search-input');
    searchInputs.forEach(input => {
      input.addEventListener('input', (e) => this.validateSearchInput(e.target));
    });
  }

  setupSearchDebouncing() {
    // Create debounced search functions for real-time search
    this.debouncedLastFmSearch = window.api.utils.debounce(
      (query) => this.performSearch('lastfm', query), 
      window.api.constants.DEBOUNCE_DELAY
    );
    
    this.debouncedLocalSearch = window.api.utils.debounce(
      (query) => this.performSearch('local-brass', query), 
      window.api.constants.DEBOUNCE_DELAY
    );

    // Add real-time search listeners
    const lastfmInput = document.getElementById('lastfm-query');
    const localInput = document.getElementById('local-brass-query');

    if (lastfmInput) {
      lastfmInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length > 2) {
          this.debouncedLastFmSearch(query);
        }
      });
    }

    if (localInput) {
      localInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length > 1) {
          this.debouncedLocalSearch(query);
        }
      });
    }
  }

  async handleSearch(event, searchType) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const query = formData.get('query')?.trim();

    if (!window.api.validators.isValidQuery(query)) {
      this.showError('Please enter a valid search query');
      return;
    }

    await this.performSearch(searchType, query);
  }

  async performSearch(searchType, query) {
    if (this.isLoading) return;

    try {
      this.setLoadingState(searchType, true);
      this.clearError();

      // Check cache first
      const cacheKey = `${searchType}:${query}`;
      if (this.searchCache.has(cacheKey)) {
        const cachedResults = this.searchCache.get(cacheKey);
        this.displayResults(searchType, cachedResults, query);
        return;
      }

      let result;
      switch (searchType) {
        case 'lastfm':
          result = await window.api.searchLastFm(query);
          break;
        case 'local-brass':
          result = await window.api.searchLocalBrass(query);
          break;
        case 'online-brass':
          result = await window.api.searchOnlineBrass(query);
          break;
        default:
          throw new Error(`Unknown search type: ${searchType}`);
      }

      if (result.success) {
        // Cache successful results
        this.searchCache.set(cacheKey, result.data);
        this.displayResults(searchType, result.data, query);
        this.showNotification(`Found ${this.getResultCount(result.data)} results for "${query}"`, 'success');
      } else {
        this.showError(`Search failed: ${result.error.message}`);
        this.displayResults(searchType, [], query);
      }
    } catch (error) {
      this.showError('Search failed', error);
      this.displayResults(searchType, [], query);
    } finally {
      this.setLoadingState(searchType, false);
    }
  }

  displayResults(searchType, data, query) {
    const resultsContainer = document.getElementById(`${searchType}-results`);
    if (!resultsContainer) return;

    resultsContainer.innerHTML = '';

    if (!data || (Array.isArray(data) && data.length === 0)) {
      resultsContainer.innerHTML = `
        <div class="no-results">
          <p>No results found for "${window.api.validators.sanitizeString(query)}"</p>
        </div>
      `;
      return;
    }

    switch (searchType) {
      case 'lastfm':
        this.displayLastFmResults(resultsContainer, data);
        break;
      case 'local-brass':
        this.displayBrassResults(resultsContainer, data, 'local');
        break;
      case 'online-brass':
        this.displayBrassResults(resultsContainer, data, 'online');
        break;
    }
  }

  displayLastFmResults(container, data) {
    if (!data.result) {
      container.innerHTML = '<div class="no-results"><p>No Last.fm results found</p></div>';
      return;
    }

    const results = data.result;
    const normalization = data.normalization || {};
    let html = '<div class="results-grid">';

    // Add normalization legend if available
    if (Object.keys(normalization).length > 0) {
      html += this.renderNormalizationLegend(normalization);
    }

    // Display artists
    if (results.artist && results.artist.length > 0) {
      html += '<div class="result-section"><h3>Artists</h3>';
      results.artist.forEach(artist => {
        const normalizedMetrics = this.renderNormalizedMetrics(artist, ['listeners', 'playcount'], normalization.artist);
        html += `
          <div class="result-item artist-item">
            <div class="result-info">
              <h4>${window.api.validators.sanitizeString(artist.name)}</h4>
              <div class="result-meta-container">
                <p class="result-meta">Listeners: ${artist.listeners || 'N/A'}</p>
                ${artist.playcount ? `<p class="result-meta">Play Count: ${artist.playcount}</p>` : ''}
                ${normalizedMetrics}
              </div>
              ${artist.url ? `<a href="${artist.url}" class="external-link" target="_blank">View on Last.fm</a>` : ''}
            </div>
          </div>
        `;
      });
      html += '</div>';
    }

    // Display tracks
    if (results.track && results.track.length > 0) {
      html += '<div class="result-section"><h3>Tracks</h3>';
      results.track.forEach(track => {
        const normalizedMetrics = this.renderNormalizedMetrics(track, ['listeners', 'playcount'], normalization.track);
        html += `
          <div class="result-item track-item">
            <div class="result-info">
              <h4>${window.api.validators.sanitizeString(track.name)}</h4>
              <p class="result-artist">by ${window.api.validators.sanitizeString(track.artist)}</p>
              <div class="result-meta-container">
                <p class="result-meta">Listeners: ${track.listeners || 'N/A'}</p>
                ${track.playcount ? `<p class="result-meta">Play Count: ${track.playcount}</p>` : ''}
                ${normalizedMetrics}
              </div>
              ${track.url ? `<a href="${track.url}" class="external-link" target="_blank">View on Last.fm</a>` : ''}
            </div>
          </div>
        `;
      });
      html += '</div>';
    }

    // Display albums
    if (results.album && results.album.length > 0) {
      html += '<div class="result-section"><h3>Albums</h3>';
      results.album.forEach(album => {
        const normalizedMetrics = this.renderNormalizedMetrics(album, ['listeners', 'playcount'], normalization.album);
        html += `
          <div class="result-item album-item">
            <div class="result-info">
              <h4>${window.api.validators.sanitizeString(album.name)}</h4>
              <p class="result-artist">by ${window.api.validators.sanitizeString(album.artist)}</p>
              <div class="result-meta-container">
                <p class="result-meta">Listeners: ${album.listeners || 'N/A'}</p>
                ${album.playcount ? `<p class="result-meta">Play Count: ${album.playcount}</p>` : ''}
                ${normalizedMetrics}
              </div>
              ${album.url ? `<a href="${album.url}" class="external-link" target="_blank">View on Last.fm</a>` : ''}
            </div>
          </div>
        `;
      });
      html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
  }

  displayBrassResults(container, data, source) {
    // Handle both old format (array) and new format (object with results and normalization)
    let samples, normalization;
    if (Array.isArray(data)) {
      samples = data;
      normalization = null;
    } else {
      samples = data.results || data.data || [];
      normalization = data.normalization;
    }

    if (!Array.isArray(samples) || samples.length === 0) {
      container.innerHTML = '<div class="no-results"><p>No brass samples found</p></div>';
      return;
    }

    let html = '<div class="results-grid">';
    
    // Add normalization legend if available
    if (normalization && Object.keys(normalization.ranges || {}).length > 0) {
      html += this.renderNormalizationLegend({ [source]: normalization });
    }
    
    samples.forEach(sample => {
      const duration = sample.duration ? window.api.utils.formatDuration(sample.duration) : 'Unknown';
      const filesize = sample.filesize ? window.api.utils.formatFileSize(sample.filesize) : 'Unknown';
      const tags = Array.isArray(sample.tags) ? sample.tags.slice(0, 5).join(', ') : '';
      
      // Determine which fields to show normalized values for based on source
      const fieldsToNormalize = source === 'online' ? ['duration', 'filesize', 'downloads'] : ['duration', 'filesize'];
      const normalizedMetrics = this.renderNormalizedMetrics(sample, fieldsToNormalize, normalization);

      html += `
        <div class="result-item brass-item" data-sample-id="${sample.id || sample.name}">
          <div class="result-info">
            <h4>${window.api.validators.sanitizeString(sample.name)}</h4>
            ${sample.description ? `<p class="result-description">${window.api.validators.sanitizeString(sample.description)}</p>` : ''}
            <div class="result-meta-container">
              <div class="result-meta">
                <span class="meta-item">Duration: ${duration}</span>
                <span class="meta-item">Size: ${filesize}</span>
                ${source === 'online' && sample.downloads ? `<span class="meta-item">Downloads: ${sample.downloads}</span>` : ''}
                ${source === 'online' ? `<span class="meta-item">By: ${window.api.validators.sanitizeString(sample.username || 'Unknown')}</span>` : ''}
              </div>
              ${normalizedMetrics}
            </div>
            ${tags ? `<div class="result-tags">${tags}</div>` : ''}
            <div class="result-actions">
              ${sample.previews && sample.previews.preview_hq_mp3 ? 
                `<button class="btn-secondary play-preview-btn" data-preview-url="${sample.previews.preview_hq_mp3}">▶ Preview</button>` : ''}
              ${source === 'online' ? 
                `<button class="btn-primary add-sample-btn" data-sample='${JSON.stringify(sample)}'>Add to Library</button>` : ''}
              ${source === 'local' && sample.path ? 
                `<button class="btn-secondary open-file-btn" data-file-path="${sample.path}">Open File</button>` : ''}
            </div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;

    // Add event listeners for action buttons
    this.setupResultActionListeners(container);
  }

  setupResultActionListeners(container) {
    // Preview buttons
    const playButtons = container.querySelectorAll('.play-preview-btn');
    playButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const url = e.target.dataset.previewUrl;
        this.playPreview(url, e.target);
      });
    });

    // Add sample buttons
    const addButtons = container.querySelectorAll('.add-sample-btn');
    addButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sampleData = JSON.parse(e.target.dataset.sample);
        this.addSampleToLibrary(sampleData, e.target);
      });
    });

    // Open file buttons
    const openButtons = container.querySelectorAll('.open-file-btn');
    openButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filePath = e.target.dataset.filePath;
        this.openFile(filePath);
      });
    });
  }

  async playPreview(url, button) {
    try {
      const originalText = button.textContent;
      button.textContent = '⏸ Playing...';
      button.disabled = true;

      const audio = new Audio(url);
      audio.addEventListener('ended', () => {
        button.textContent = originalText;
        button.disabled = false;
      });
      audio.addEventListener('error', () => {
        button.textContent = originalText;
        button.disabled = false;
        this.showError('Failed to play preview');
      });

      await audio.play();
    } catch (error) {
      this.showError('Failed to play preview', error);
      button.textContent = '▶ Preview';
      button.disabled = false;
    }
  }

  async addSampleToLibrary(sampleData, button) {
    try {
      const originalText = button.textContent;
      button.textContent = 'Adding...';
      button.disabled = true;

      const result = await window.api.addBrassSample({
        name: sampleData.name,
        description: sampleData.description,
        tags: sampleData.tags || [],
        duration: sampleData.duration,
        filesize: sampleData.filesize,
        source: 'freesound',
        freesoundId: sampleData.id,
        username: sampleData.username,
        previewUrl: sampleData.previews?.preview_hq_mp3
      });

      if (result.success) {
        button.textContent = '✓ Added';
        button.classList.add('added');
        this.showNotification('Sample added to library successfully!', 'success');
      } else {
        button.textContent = originalText;
        button.disabled = false;
        this.showError(`Failed to add sample: ${result.error.message}`);
      }
    } catch (error) {
      button.textContent = 'Add to Library';
      button.disabled = false;
      this.showError('Failed to add sample', error);
    }
  }

  async openFile(filePath) {
    try {
      const { shell } = require('electron');
      await shell.openPath(filePath);
    } catch (error) {
      this.showError('Failed to open file', error);
    }
  }

  async selectBrassFiles() {
    try {
      this.setLoadingState('file-selection', true);
      
      const result = await window.api.selectBrassFile();
      
      if (result.success && !result.canceled) {
        this.selectedFiles = result.files;
        this.displaySelectedFiles();
        this.showNotification(`Selected ${result.files.length} file(s)`, 'success');
      }
    } catch (error) {
      this.showError('Failed to select files', error);
    } finally {
      this.setLoadingState('file-selection', false);
    }
  }

  displaySelectedFiles() {
    const container = document.getElementById('selected-files');
    if (!container) return;

    if (this.selectedFiles.length === 0) {
      container.innerHTML = '<p class="no-files">No files selected</p>';
      return;
    }

    let html = '<div class="selected-files-list">';
    this.selectedFiles.forEach((file, index) => {
      html += `
        <div class="selected-file-item">
          <div class="file-info">
            <span class="file-name">${window.api.validators.sanitizeString(file.name)}</span>
            <span class="file-meta">${window.api.utils.formatFileSize(file.size)} • ${file.extension}</span>
          </div>
          <button class="btn-remove" onclick="app.removeSelectedFile(${index})">×</button>
        </div>
      `;
    });
    html += '</div>';
    
    container.innerHTML = html;
  }

  removeSelectedFile(index) {
    this.selectedFiles.splice(index, 1);
    this.displaySelectedFiles();
  }

  async handleAddSample(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const name = formData.get('sample-name')?.trim();
    const description = formData.get('sample-description')?.trim();
    const tags = formData.get('sample-tags')?.trim().split(',').map(tag => tag.trim()).filter(tag => tag);

    if (!name) {
      this.showError('Sample name is required');
      return;
    }

    if (this.selectedFiles.length === 0) {
      this.showError('Please select at least one file');
      return;
    }

    try {
      this.setLoadingState('add-sample', true);
      
      for (const file of this.selectedFiles) {
        const sampleData = {
          name: `${name}${this.selectedFiles.length > 1 ? ` - ${file.name}` : ''}`,
          path: file.path,
          description,
          tags,
          filesize: file.size,
          source: 'local'
        };

        const result = await window.api.addBrassSample(sampleData);
        
        if (!result.success) {
          this.showError(`Failed to add ${file.name}: ${result.error.message}`);
          continue;
        }
      }

      // Reset form and selected files
      event.target.reset();
      this.selectedFiles = [];
      this.displaySelectedFiles();
      
      this.showNotification('Sample(s) added successfully!', 'success');
      
      // Refresh local search if there are results displayed
      const localResults = document.getElementById('local-brass-results');
      if (localResults && localResults.children.length > 0) {
        const lastQuery = document.getElementById('local-brass-query')?.value;
        if (lastQuery) {
          this.performSearch('local-brass', lastQuery);
        }
      }
    } catch (error) {
      this.showError('Failed to add sample', error);
    } finally {
      this.setLoadingState('add-sample', false);
    }
  }

  async loadFiddleTemplates() {
    try {
      const result = await window.api.getFiddleTemplates();
      
      if (result.success) {
        this.fiddleTemplates = result.data;
        this.displayFiddleTemplates();
      } else {
        this.showError('Failed to load fiddle templates');
      }
    } catch (error) {
      this.showError('Failed to load fiddle templates', error);
    }
  }

  displayFiddleTemplates() {
    const container = document.getElementById('fiddle-templates');
    if (!container) return;

    if (this.fiddleTemplates.length === 0) {
      container.innerHTML = '<p class="no-templates">No fiddle templates available</p>';
      return;
    }

    let html = '<div class="templates-grid">';
    this.fiddleTemplates.forEach(template => {
      html += `
        <div class="template-item" data-template='${JSON.stringify(template)}'>
          <h4>${window.api.validators.sanitizeString(template.name)}</h4>
          <p>${window.api.validators.sanitizeString(template.description)}</p>
          <button class="btn-primary open-template-btn">Open in Fiddle</button>
        </div>
      `;
    });
    html += '</div>';

    container.innerHTML = html;

    // Add event listeners for template buttons
    const templateButtons = container.querySelectorAll('.open-template-btn');
    templateButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const templateData = JSON.parse(e.target.closest('.template-item').dataset.template);
        this.openFiddle(templateData, e.target);
      });
    });
  }

  async openSelectedFiddle() {
    const selectedTemplate = document.querySelector('input[name="fiddle-template"]:checked');
    if (!selectedTemplate) {
      this.showError('Please select a fiddle template');
      return;
    }

    const template = this.fiddleTemplates.find(t => t.filename === selectedTemplate.value);
    if (!template) {
      this.showError('Selected template not found');
      return;
    }

    await this.openFiddle(template);
  }

  async openFiddle(template, button = null) {
    try {
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'Opening...';
        button.disabled = true;
      }

      const result = await window.api.openFiddle(template);
      
      if (result.success) {
        let message = 'Fiddle opened successfully!';
        if (result.method === 'file') {
          message = 'Fiddle file created. Import it manually in Electron Fiddle.';
        } else if (result.method === 'content') {
          message = 'Electron Fiddle not found. Template content available for manual use.';
        }
        
        this.showNotification(message, 'success');
      } else {
        this.showError(`Failed to open fiddle: ${result.error.message}`);
      }
    } catch (error) {
      this.showError('Failed to open fiddle', error);
    } finally {
      if (button) {
        button.textContent = 'Open in Fiddle';
        button.disabled = false;
      }
    }
  }

  switchTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));

    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));

    // Show selected tab content
    const selectedContent = document.getElementById(`${tabName}-tab`);
    if (selectedContent) {
      selectedContent.classList.add('active');
    }

    // Add active class to selected tab button
    const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedButton) {
      selectedButton.classList.add('active');
    }

    this.currentSearchType = tabName;
  }

  validateSearchInput(input) {
    const query = input.value.trim();
    const isValid = window.api.validators.isValidQuery(query);
    
    input.classList.toggle('invalid', !isValid && query.length > 0);
    
    // Update submit button state
    const form = input.closest('form');
    const submitBtn = form?.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = !isValid;
    }
  }

  setLoadingState(type, isLoading) {
    this.isLoading = isLoading;
    
    // Update loading indicators
    const loadingIndicators = document.querySelectorAll(`[data-loading="${type}"]`);
    loadingIndicators.forEach(indicator => {
      indicator.style.display = isLoading ? 'block' : 'none';
    });

    // Update buttons
    const buttons = document.querySelectorAll(`[data-loading-btn="${type}"]`);
    buttons.forEach(btn => {
      btn.disabled = isLoading;
      if (isLoading) {
        btn.dataset.originalText = btn.textContent;
        btn.textContent = 'Loading...';
      } else if (btn.dataset.originalText) {
        btn.textContent = btn.dataset.originalText;
      }
    });
  }

  clearResults(type) {
    const container = document.getElementById(`${type}-results`);
    if (container) {
      container.innerHTML = '';
    }
    
    // Clear cache for this type
    for (const [key] of this.searchCache) {
      if (key.startsWith(`${type}:`)) {
        this.searchCache.delete(key);
      }
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    const container = document.getElementById('notifications') || document.body;
    container.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  showError(message, error = null) {
    console.error('App Error:', message, error);
    
    let errorMessage = message;
    if (error) {
      errorMessage += `: ${error.message || error}`;
    }
    
    this.showNotification(errorMessage, 'error');
    
    // Update error display element if it exists
    const errorDisplay = document.getElementById('error-display');
    if (errorDisplay) {
      errorDisplay.textContent = errorMessage;
      errorDisplay.style.display = 'block';
    }
  }

  clearError() {
    const errorDisplay = document.getElementById('error-display');
    if (errorDisplay) {
      errorDisplay.style.display = 'none';
    }
  }

  /**
   * Renders normalized metrics as visual elements (progress bars, badges, etc.)
   * @param {Object} item - The data item containing normalized values
   * @param {Array<string>} fields - Fields to render normalized values for
   * @param {Object} normalizationMeta - Normalization metadata with ranges
   * @returns {string} HTML string with normalized value visualizations
   */
  renderNormalizedMetrics(item, fields, normalizationMeta) {
    if (!item || !fields || !normalizationMeta) {
      return '';
    }

    let html = '<div class="normalized-metrics">';
    
    fields.forEach(field => {
      const normalizedValue = item[`${field}_normalized`];
      const originalValue = item[`${field}_original`] || item[field];
      const fieldMeta = normalizationMeta.ranges?.[field];
      
      if (typeof normalizedValue === 'number' && fieldMeta) {
        const percentage = Math.round(normalizedValue);
        const colorClass = this.getNormalizedValueColorClass(percentage);
        const tooltipText = this.createNormalizationTooltip(field, originalValue, normalizedValue, fieldMeta);
        
        html += `
          <div class="normalized-metric" data-field="${field}">
            <div class="metric-label">${this.formatFieldName(field)} Score:</div>
            <div class="metric-visualization">
              <div class="progress-bar-container" title="${tooltipText}">
                <div class="progress-bar ${colorClass}" style="width: ${percentage}%"></div>
                <span class="progress-text">${percentage}%</span>
              </div>
              <span class="normalized-badge ${colorClass}">${this.getNormalizedValueLabel(percentage)}</span>
            </div>
          </div>
        `;
      }
    });
    
    html += '</div>';
    return html;
  }

  /**
   * Creates a normalization legend explaining the context
   * @param {Object} normalizationData - Normalization metadata for different result types
   * @returns {string} HTML string with normalization legend
   */
  renderNormalizationLegend(normalizationData) {
    let html = '<div class="normalization-legend">';
    html += '<div class="legend-header">';
    html += '<h4>📊 Normalized Scores</h4>';
    html += '<button class="legend-toggle" onclick="this.parentElement.parentElement.classList.toggle(\'expanded\')">ℹ️</button>';
    html += '</div>';
    html += '<div class="legend-content">';
    html += '<p>Values are normalized to 0-100% scale for easy comparison:</p>';
    html += '<div class="legend-items">';
    
    Object.entries(normalizationData).forEach(([type, meta]) => {
      if (meta && meta.ranges) {
        html += `<div class="legend-section">`;
        html += `<h5>${this.formatResultType(type)}</h5>`;
        
        Object.entries(meta.ranges).forEach(([field, range]) => {
          if (range && typeof range.min !== 'undefined' && typeof range.max !== 'undefined') {
            html += `
              <div class="legend-item">
                <span class="field-name">${this.formatFieldName(field)}:</span>
                <span class="range-info">
                  ${this.formatFieldValue(field, range.min)} - ${this.formatFieldValue(field, range.max)}
                  ${range.count ? `(${range.count} items)` : ''}
                </span>
              </div>
            `;
          }
        });
        
        html += '</div>';
      }
    });
    
    html += '</div>';
    html += '<div class="legend-scale">';
    html += '<div class="scale-bar">';
    html += '<div class="scale-segment low"></div>';
    html += '<div class="scale-segment medium"></div>';
    html += '<div class="scale-segment high"></div>';
    html += '</div>';
    html += '<div class="scale-labels">';
    html += '<span>Low (0-33%)</span>';
    html += '<span>Medium (34-66%)</span>';
    html += '<span>High (67-100%)</span>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    
    return html;
  }

  /**
   * Gets CSS color class based on normalized percentage value
   * @param {number} percentage - Normalized percentage (0-100)
   * @returns {string} CSS class name
   */
  getNormalizedValueColorClass(percentage) {
    if (percentage >= 67) return 'high-value';
    if (percentage >= 34) return 'medium-value';
    return 'low-value';
  }

  /**
   * Gets human-readable label for normalized percentage
   * @param {number} percentage - Normalized percentage (0-100)
   * @returns {string} Label text
   */
  getNormalizedValueLabel(percentage) {
    if (percentage >= 67) return 'High';
    if (percentage >= 34) return 'Medium';
    return 'Low';
  }

  /**
   * Creates tooltip text explaining normalization context
   * @param {string} field - Field name
   * @param {*} originalValue - Original raw value
   * @param {number} normalizedValue - Normalized value (0-100)
   * @param {Object} fieldMeta - Field metadata with min/max ranges
   * @returns {string} Tooltip text
   */
  createNormalizationTooltip(field, originalValue, normalizedValue, fieldMeta) {
    const formattedOriginal = this.formatFieldValue(field, originalValue);
    const formattedMin = this.formatFieldValue(field, fieldMeta.min);
    const formattedMax = this.formatFieldValue(field, fieldMeta.max);
    
    return `${this.formatFieldName(field)}: ${formattedOriginal} (${Math.round(normalizedValue)}%)\nRange: ${formattedMin} - ${formattedMax}\nClick for more details`;
  }

  /**
   * Formats field names for display
   * @param {string} field - Raw field name
   * @returns {string} Formatted field name
   */
  formatFieldName(field) {
    const fieldNames = {
      'listeners': 'Listeners',
      'playcount': 'Play Count',
      'duration': 'Duration',
      'filesize': 'File Size',
      'downloads': 'Downloads'
    };
    return fieldNames[field] || field.charAt(0).toUpperCase() + field.slice(1);
  }

  /**
   * Formats field values for display based on field type
   * @param {string} field - Field name
   * @param {*} value - Value to format
   * @returns {string} Formatted value
   */
  formatFieldValue(field, value) {
    if (typeof value !== 'number' || isNaN(value)) {
      return 'N/A';
    }
    
    switch (field) {
      case 'duration':
        return window.api.utils.formatDuration(value);
      case 'filesize':
        return window.api.utils.formatFileSize(value);
      case 'listeners':
      case 'playcount':
      case 'downloads':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  }

  /**
   * Formats result type names for display
   * @param {string} type - Raw type name
   * @returns {string} Formatted type name
   */
  formatResultType(type) {
    const typeNames = {
      'artist': 'Artists',
      'track': 'Tracks', 
      'album': 'Albums',
      'local': 'Local Samples',
      'online': 'Online Samples'
    };
    return typeNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
  }

  getResultCount(data) {
    if (Array.isArray(data)) {
      return data.length;
    }
    if (data && data.results) {
      return Array.isArray(data.results) ? data.results.length : 0;
    }
    if (data && data.result) {
      let count = 0;
      Object.values(data.result).forEach(items => {
        if (Array.isArray(items)) count += items.length;
      });
      return count;
    }
    return 0;
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new BrassStabsApp();
});

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  if (window.app) {
    window.app.showError('An unexpected error occurred', event.error);
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  if (window.app) {
    window.app.showError('An unexpected error occurred', event.reason);
  }
});
