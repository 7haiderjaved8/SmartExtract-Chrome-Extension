/**
 * SmartExtract - Manifest V3 Chrome Extension Logic
 * Professional client-side product extractor with safe CSV export
 */

(function () {
  'use strict';

  // --- Selectors & Presets Definitions ---
  const PRESETS = {
    sample: {
      mode: 'list',
      container: '.product-card',
      title: '.product-title',
      price: '.product-price',
      url: '.product-link'
    },
    generic: {
      mode: 'list',
      container: '.product, .item, .product-item, article, [data-product-id]',
      title: 'h2, h3, .title, .product-name, [itemprop="name"]',
      price: '[class*="price"], .amount, [itemprop="price"], .cost',
      url: 'a[href*="product"], h2 a, h3 a, a'
    },
    single: {
      mode: 'single',
      container: 'body',
      title: 'h1, .product-title, [itemprop="name"]',
      price: '.price, [itemprop="price"], .product-price, .amount',
      url: ''
    },
    amazon: {
      mode: 'list',
      container: '[data-component-type="s-search-result"]',
      title: 'h2 span, .a-size-medium',
      price: '.a-price .a-offscreen, .a-price span',
      url: 'h2 a'
    },
    shopify: {
      mode: 'list',
      container: '.grid__item, .product-card, .card',
      title: '.card__heading, .product__title, h3',
      price: '.price-item--regular, .price, .money',
      url: 'a.card__link, a'
    }
  };

  // State
  let currentActiveTab = null;
  let isTabSupported = true;
  let extractedItems = [];
  let currentFilter = '';

  // DOM Elements
  const tabStatusBadge = document.getElementById('tabStatusBadge');
  const statusDot = document.getElementById('statusDot');
  const tabHostText = document.getElementById('tabHostText');
  const unsupportedBanner = document.getElementById('unsupportedBanner');
  const bannerTitle = document.getElementById('bannerTitle');
  const bannerDesc = document.getElementById('bannerDesc');
  const btnOpenSampleCatalog = document.getElementById('btnOpenSampleCatalog');

  // Nav tabs
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  // Extract Controls
  const quickPresetSelect = document.getElementById('quickPresetSelect');
  const btnExtract = document.getElementById('btnExtract');
  const btnExtractText = document.getElementById('btnExtractText');
  const recordCountText = document.getElementById('recordCountText');
  const searchFilterInput = document.getElementById('searchFilterInput');
  const emptyState = document.getElementById('emptyState');
  const tableContainer = document.getElementById('tableContainer');
  const resultsTableBody = document.getElementById('resultsTableBody');
  const btnEmptySampleLink = document.getElementById('btnEmptySampleLink');
  const btnGuideSampleCatalog = document.getElementById('btnGuideSampleCatalog');

  // Export Buttons
  const btnExportCsv = document.getElementById('btnExportCsv');
  const btnCopyCsv = document.getElementById('btnCopyCsv');
  const btnCopyJson = document.getElementById('btnCopyJson');
  const btnClearData = document.getElementById('btnClearData');

  // Config Form
  const extractionMode = document.getElementById('extractionMode');
  const containerGroup = document.getElementById('containerGroup');
  const containerSelector = document.getElementById('containerSelector');
  const titleSelector = document.getElementById('titleSelector');
  const priceSelector = document.getElementById('priceSelector');
  const urlSelector = document.getElementById('urlSelector');
  const toggleCleanPrice = document.getElementById('toggleCleanPrice');
  const toggleHighlight = document.getElementById('toggleHighlight');
  const btnSavePreset = document.getElementById('btnSavePreset');
  const btnResetSelectors = document.getElementById('btnResetSelectors');
  const btnTestSelectors = document.getElementById('btnTestSelectors');
  const toast = document.getElementById('toast');

  // --- Initializer ---
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    setupTabSwitching();
    loadSavedSettings();
    setupEventListeners();
    await detectActiveTab();
  }

  // --- Tab Navigation ---
  function setupTabSwitching() {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab');
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetPane = document.getElementById(targetId);
        if (targetPane) targetPane.classList.add('active');
      });
    });
  }

  // --- Active Tab Detection & Permission Guarding ---
  async function detectActiveTab() {
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        currentActiveTab = tab;
        validateTab(tab);
      } else {
        // Fallback for standalone/mock environment
        tabHostText.textContent = 'Standalone Dev Mode';
        statusDot.className = 'status-dot';
        isTabSupported = true;
      }
    } catch (err) {
      console.warn('Tab detection error:', err);
      showUnsupportedState('Failed to detect tab: ' + err.message);
    }
  }

  function validateTab(tab) {
    if (!tab || !tab.url) {
      showUnsupportedState('No active tab detected');
      return;
    }

    const url = tab.url;
    let urlObj;
    try {
      urlObj = new URL(url);
    } catch (e) {
      showUnsupportedState('Invalid tab URL');
      return;
    }

    // Check for restricted URLs (chrome://, edge://, chrome-extension://, view-source:, about:, etc.)
    const restrictedProtocols = ['chrome:', 'chrome-extension:', 'edge:', 'about:', 'view-source:', 'data:'];
    const isRestrictedProtocol = restrictedProtocols.some(p => url.startsWith(p));
    const isWebStore = urlObj.hostname === 'chromewebstore.google.com' || urlObj.hostname === 'chrome.google.com';

    if (isRestrictedProtocol || isWebStore) {
      isTabSupported = false;
      statusDot.className = 'status-dot error';
      tabHostText.textContent = urlObj.protocol || 'Restricted Page';
      unsupportedBanner.style.display = 'flex';
      bannerTitle.textContent = 'Restricted Browser Page';
      bannerDesc.textContent = `Extensions cannot run on ${urlObj.protocol || 'this page'} due to Chrome security policies. Navigate to any online shop or open our built-in sample catalog below.`;
      btnExtract.disabled = true;
      btnExtractText.textContent = 'Page Restricted';
    } else {
      isTabSupported = true;
      statusDot.className = 'status-dot';
      tabHostText.textContent = urlObj.hostname || 'Active Tab';
      unsupportedBanner.style.display = 'none';
      btnExtract.disabled = false;
      btnExtractText.textContent = 'Extract from Active Tab';
    }
  }

  function showUnsupportedState(message) {
    isTabSupported = false;
    statusDot.className = 'status-dot warning';
    tabHostText.textContent = 'Unsupported';
    unsupportedBanner.style.display = 'flex';
    bannerTitle.textContent = 'Action Required';
    bannerDesc.textContent = message;
    btnExtract.disabled = true;
  }

  // --- Presets & Settings Storage ---
  function loadSavedSettings() {
    try {
      const savedPresetKey = localStorage.getItem('smartExtract_activePreset') || 'sample';
      const customConfigStr = localStorage.getItem('smartExtract_customConfig');

      if (customConfigStr) {
        PRESETS.custom = JSON.parse(customConfigStr);
      } else {
        PRESETS.custom = { ...PRESETS.sample };
      }

      quickPresetSelect.value = savedPresetKey;
      applyPresetToInputs(savedPresetKey);
    } catch (e) {
      console.warn('Error loading settings:', e);
      applyPresetToInputs('sample');
    }
  }

  function applyPresetToInputs(presetKey) {
    const config = PRESETS[presetKey] || PRESETS.sample;
    extractionMode.value = config.mode || 'list';
    containerSelector.value = config.container || '';
    titleSelector.value = config.title || '';
    priceSelector.value = config.price || '';
    urlSelector.value = config.url || '';

    updateModeVisibility();
  }

  function updateModeVisibility() {
    if (extractionMode.value === 'single') {
      containerGroup.style.display = 'none';
    } else {
      containerGroup.style.display = 'flex';
    }
  }

  function saveCustomProfile() {
    const customConfig = {
      mode: extractionMode.value,
      container: containerSelector.value.trim(),
      title: titleSelector.value.trim(),
      price: priceSelector.value.trim(),
      url: urlSelector.value.trim()
    };

    PRESETS.custom = customConfig;
    localStorage.setItem('smartExtract_customConfig', JSON.stringify(customConfig));
    localStorage.setItem('smartExtract_activePreset', 'custom');
    quickPresetSelect.value = 'custom';
    showToast('Custom selector profile saved!');
  }

  function resetToDefaults() {
    applyPresetToInputs('sample');
    quickPresetSelect.value = 'sample';
    localStorage.setItem('smartExtract_activePreset', 'sample');
    showToast('Reset to default sample selectors');
  }

  // --- Event Listeners ---
  function setupEventListeners() {
    // Preset dropdown change
    quickPresetSelect.addEventListener('change', (e) => {
      const selected = e.target.value;
      applyPresetToInputs(selected);
      localStorage.setItem('smartExtract_activePreset', selected);
      showToast(`Preset: ${e.target.options[e.target.selectedIndex].text}`);
    });

    // Strategy mode toggle
    extractionMode.addEventListener('change', () => {
      updateModeVisibility();
    });

    // Save & Reset buttons
    btnSavePreset.addEventListener('click', saveCustomProfile);
    btnResetSelectors.addEventListener('click', resetToDefaults);

    // Extract button
    btnExtract.addEventListener('click', performExtraction);

    // Test Match button in config tab
    btnTestSelectors.addEventListener('click', testSelectorsMatch);

    // Export buttons
    btnExportCsv.addEventListener('click', exportToCsv);
    btnCopyCsv.addEventListener('click', copyCsvToClipboard);
    btnCopyJson.addEventListener('click', copyJsonToClipboard);
    btnClearData.addEventListener('click', clearExtractedData);

    // Filter preview
    searchFilterInput.addEventListener('input', (e) => {
      currentFilter = e.target.value.toLowerCase().trim();
      renderResultsTable();
    });

    // Open Sample Catalog buttons
    const openSampleCatalog = () => {
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url: chrome.runtime.getURL('sample-catalog/index.html') });
      } else {
        window.open('sample-catalog/index.html', '_blank');
      }
    };

    if (btnOpenSampleCatalog) btnOpenSampleCatalog.addEventListener('click', openSampleCatalog);
    if (btnEmptySampleLink) btnEmptySampleLink.addEventListener('click', openSampleCatalog);
    if (btnGuideSampleCatalog) btnGuideSampleCatalog.addEventListener('click', openSampleCatalog);
  }

  // --- Main Extraction Execution ---
  async function performExtraction() {
    if (!isTabSupported || !currentActiveTab) {
      showToast('Cannot extract: Please open a regular web page.');
      return;
    }

    const config = {
      mode: extractionMode.value,
      containerSelector: containerSelector.value.trim(),
      titleSelector: titleSelector.value.trim(),
      priceSelector: priceSelector.value.trim(),
      urlSelector: urlSelector.value.trim(),
      cleanPrice: toggleCleanPrice.checked,
      highlight: toggleHighlight.checked
    };

    // Basic selector validation
    if (config.mode === 'list' && !config.containerSelector) {
      showToast('Error: Container selector is required for List mode.');
      return;
    }
    if (!config.titleSelector && !config.priceSelector) {
      showToast('Error: Please specify at least a title or price selector.');
      return;
    }

    setLoadingState(true);

    try {
      if (typeof chrome !== 'undefined' && chrome.scripting && chrome.scripting.executeScript) {
        const results = await chrome.scripting.executeScript({
          target: { tabId: currentActiveTab.id },
          func: extractDataInPageContext,
          args: [config]
        });

        if (!results || !results[0] || !results[0].result) {
          throw new Error('No response received from active tab script.');
        }

        const data = results[0].result;
        if (!data.success) {
          throw new Error(data.error || 'Extraction failed on page.');
        }

        handleExtractionSuccess(data.items);
      } else {
        // Fallback or demo execution
        showToast('Extension scripting not available in current environment.');
      }
    } catch (err) {
      console.error('Extraction error:', err);
      showToast('Extraction failed: ' + err.message);
    } finally {
      setLoadingState(false);
    }
  }

  // --- Injected Extraction Logic (Runs directly in Active Tab DOM) ---
  function extractDataInPageContext(config) {
    try {
      const items = [];
      const doc = (typeof window !== 'undefined' && window.__smartExtractTargetDoc) ? window.__smartExtractTargetDoc : document;
      const win = doc.defaultView || (typeof window !== 'undefined' ? window : null);
      const {
        mode,
        containerSelector,
        titleSelector,
        priceSelector,
        urlSelector,
        cleanPrice,
        highlight
      } = config;

      // Price cleaner helper
      function cleanPriceText(raw) {
        if (!raw) return '';
        let cleaned = raw.replace(/\s+/g, ' ').trim();
        if (cleanPrice) {
          // Match standard currency pattern: e.g. $199.99, €49.00, £15, 199.99 USD, etc.
          const match = cleaned.match(/(?:[\$\€\£\¥\₹\A-Z]{1,4}\s*[\d,]+(?:\.\d{1,2})?|[\d,]+(?:\.\d{1,2})?\s*(?:[\$\€\£\¥\₹]|USD|EUR|GBP|CAD|AUD))/i);
          if (match) {
            cleaned = match[0].trim();
          }
        }
        return cleaned;
      }

      // Safe Absolute URL resolver
      function resolveUrl(href) {
        if (!href) return '';
        try {
          return new URL(href, doc.baseURI).href;
        } catch (e) {
          return href;
        }
      }

      // Optional DOM Highlight
      function addHighlight(el) {
        if (!highlight || !el) return;
        const prevOutline = el.style.outline;
        const prevTransition = el.style.transition;
        el.style.outline = '2px solid #00f2fe';
        el.style.outlineOffset = '2px';
        el.style.transition = 'outline 0.3s ease';
        setTimeout(() => {
          el.style.outline = prevOutline;
          el.style.transition = prevTransition;
        }, 2200);
      }

      if (mode === 'single') {
        // Single Product extraction
        const titleEl = titleSelector ? doc.querySelector(titleSelector) : null;
        const priceEl = priceSelector ? doc.querySelector(priceSelector) : null;
        const linkEl = urlSelector ? doc.querySelector(urlSelector) : null;

        const title = titleEl ? titleEl.textContent.trim() : (doc.title || '');
        const price = priceEl ? cleanPriceText(priceEl.textContent) : '';
        const url = linkEl ? resolveUrl(linkEl.getAttribute('href')) : (win ? win.location.href : '');

        if (titleEl) addHighlight(titleEl);
        if (priceEl) addHighlight(priceEl);

        if (title || price) {
          items.push({
            id: 1,
            title: title || 'Untitled Product',
            price: price || 'N/A',
            url: url || (win ? win.location.href : '')
          });
        }
      } else {
        // List / Catalog Extraction
        const containers = doc.querySelectorAll(containerSelector);

        containers.forEach((container, index) => {
          let title = '';
          let price = '';
          let url = '';

          // 1. Extract Title
          if (titleSelector) {
            const el = container.querySelector(titleSelector);
            if (el) {
              title = el.textContent.trim();
              if (highlight) addHighlight(el);
            }
          }

          // 2. Extract Price
          if (priceSelector) {
            const el = container.querySelector(priceSelector);
            if (el) {
              price = cleanPriceText(el.textContent);
              if (highlight) addHighlight(el);
            }
          }

          // 3. Extract URL
          if (urlSelector) {
            const el = container.querySelector(urlSelector);
            if (el && el.getAttribute('href')) {
              url = resolveUrl(el.getAttribute('href'));
            }
          }

          // URL fallback: check if container itself is an anchor
          if (!url && container.tagName === 'A' && container.getAttribute('href')) {
            url = resolveUrl(container.getAttribute('href'));
          }

          // Secondary fallback: find first anchor with href inside container
          if (!url) {
            const firstA = container.querySelector('a[href]');
            if (firstA) {
              url = resolveUrl(firstA.getAttribute('href'));
            }
          }

          if (highlight) addHighlight(container);

          // Only add if at least title or price was found
          if (title || price) {
            items.push({
              id: index + 1,
              title: title || `Product #${index + 1}`,
              price: price || 'N/A',
              url: url || (win ? win.location.href : '')
            });
          }
        });
      }

      return {
        success: true,
        count: items.length,
        items: items
      };
    } catch (err) {
      return {
        success: false,
        error: err.message
      };
    }
  }

  // --- Test Selectors Match Count ---
  async function testSelectorsMatch() {
    if (!isTabSupported || !currentActiveTab) {
      showToast('Cannot test: Unsupported active tab.');
      return;
    }

    const config = {
      mode: extractionMode.value,
      containerSelector: containerSelector.value.trim(),
      titleSelector: titleSelector.value.trim(),
      priceSelector: priceSelector.value.trim(),
      urlSelector: urlSelector.value.trim(),
      cleanPrice: false,
      highlight: true
    };

    try {
      if (typeof chrome !== 'undefined' && chrome.scripting) {
        const results = await chrome.scripting.executeScript({
          target: { tabId: currentActiveTab.id },
          func: extractDataInPageContext,
          args: [config]
        });

        if (results && results[0] && results[0].result) {
          const res = results[0].result;
          if (res.success) {
            showToast(`Selector match test: Found ${res.count} items!`);
          } else {
            showToast(`Test error: ${res.error}`);
          }
        }
      }
    } catch (err) {
      showToast(`Test failed: ${err.message}`);
    }
  }

  // --- Extraction Success Handling ---
  function handleExtractionSuccess(items) {
    extractedItems = items || [];
    renderResultsTable();

    if (extractedItems.length === 0) {
      showToast('0 products found. Try adjusting your CSS selectors.');
    } else {
      showToast(`Successfully extracted ${extractedItems.length} products!`);
      // Switch to preview tab if not already on it
      document.getElementById('tabBtnExtract').click();
    }
  }

  // --- Render Preview Table ---
  function renderResultsTable() {
    resultsTableBody.innerHTML = '';

    const filtered = extractedItems.filter(item => {
      if (!currentFilter) return true;
      const titleMatch = (item.title || '').toLowerCase().includes(currentFilter);
      const priceMatch = (item.price || '').toLowerCase().includes(currentFilter);
      const urlMatch = (item.url || '').toLowerCase().includes(currentFilter);
      return titleMatch || priceMatch || urlMatch;
    });

    // Update Counter & Controls State
    recordCountText.textContent = `${extractedItems.length} products extracted`;

    const hasData = extractedItems.length > 0;
    btnExportCsv.disabled = !hasData;
    btnCopyCsv.disabled = !hasData;
    btnCopyJson.disabled = !hasData;
    btnClearData.disabled = !hasData;

    if (!hasData) {
      emptyState.style.display = 'flex';
      tableContainer.style.display = 'none';
      return;
    }

    emptyState.style.display = 'none';
    tableContainer.style.display = 'block';

    if (filtered.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `<td colspan="5" style="text-align: center; color: var(--text-dim); padding: 18px;">No matching records for "${escapeHtml(currentFilter)}"</td>`;
      resultsTableBody.appendChild(emptyRow);
      return;
    }

    filtered.forEach((item, index) => {
      const row = document.createElement('tr');

      row.innerHTML = `
        <td class="col-idx">${index + 1}</td>
        <td class="col-title" title="${escapeHtml(item.title)}">
          <span class="cell-title">${escapeHtml(item.title)}</span>
        </td>
        <td class="col-price">
          <span class="price-pill">${escapeHtml(item.price)}</span>
        </td>
        <td class="col-url">
          <a href="${escapeHtml(safePreviewUrl(item.url))}" target="_blank" rel="noopener noreferrer" class="url-link" title="${escapeHtml(item.url)}">
            <span>🔗</span>
            <span>${escapeHtml(shortenUrl(item.url))}</span>
          </a>
        </td>
        <td class="col-actions">
          <button class="action-icon-btn btn-delete-row" data-id="${item.id}" title="Remove record">✕</button>
        </td>
      `;

      resultsTableBody.appendChild(row);
    });

    // Setup row delete buttons
    document.querySelectorAll('.btn-delete-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idToRemove = parseInt(e.currentTarget.getAttribute('data-id'), 10);
        extractedItems = extractedItems.filter(item => item.id !== idToRemove);
        renderResultsTable();
        showToast('Record removed');
      });
    });
  }

  function clearExtractedData() {
    extractedItems = [];
    currentFilter = '';
    searchFilterInput.value = '';
    renderResultsTable();
    showToast('Extracted data cleared');
  }

  // --- Safe CSV Generation & Escaping ---
  /**
   * Generates safe RFC 4180 CSV with formula injection protection:
   * 1. Formula prefix sanitization for `=, +, -, @, \t, \r`
   * 2. Quotes escaping (`" -> ""`)
   * 3. Enclosure in double quotes
   * 4. UTF-8 Byte Order Mark (`\uFEFF`) for seamless Excel / Google Sheets compatibility
   */
  function generateSafeCsvString(data) {
    if (!data || data.length === 0) return '';

    const headers = ['Product Title', 'Price', 'URL'];

    function sanitizeCell(val) {
      if (val === null || val === undefined) return '""';
      let str = String(val).trim();

      // Formula injection mitigation
      const formulaTriggers = ['=', '+', '-', '@', '\t', '\r'];
      if (formulaTriggers.some(trigger => str.startsWith(trigger))) {
        str = "'" + str; // Prefix with single apostrophe to neutralize formula execution in Excel/Sheets
      }

      // Escape internal double quotes with double quotes
      str = str.replace(/"/g, '""');

      // Wrap in double quotes
      return `"${str}"`;
    }

    const headerLine = headers.map(h => `"${h}"`).join(',');

    const rows = data.map(item => {
      const title = sanitizeCell(item.title);
      const price = sanitizeCell(item.price);
      const url = sanitizeCell(item.url);
      return `${title},${price},${url}`;
    });

    return [headerLine, ...rows].join('\r\n');
  }

  function exportToCsv() {
    if (extractedItems.length === 0) {
      showToast('No data to export.');
      return;
    }

    const csvContent = generateSafeCsvString(extractedItems);
    // Prepend UTF-8 BOM (\uFEFF) so Excel recognizes non-ASCII & currency symbols properly
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    let hostSlug = 'web';
    try {
      if (currentActiveTab && currentActiveTab.url) {
        hostSlug = new URL(currentActiveTab.url).hostname.replace(/[^a-z0-9]/gi, '_');
      }
    } catch (e) {}

    const filename = `smartextract_${hostSlug}_${dateStr}.csv`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Exported ${extractedItems.length} records to CSV!`);
  }

  async function copyCsvToClipboard() {
    if (extractedItems.length === 0) {
      showToast('No data to copy.');
      return;
    }
    const csvContent = generateSafeCsvString(extractedItems);
    try {
      await navigator.clipboard.writeText(csvContent);
      showToast(`Copied ${extractedItems.length} CSV rows to clipboard!`);
    } catch (err) {
      // Fallback
      fallbackCopyText(csvContent);
      showToast('Copied CSV to clipboard!');
    }
  }

  async function copyJsonToClipboard() {
    if (extractedItems.length === 0) {
      showToast('No data to copy.');
      return;
    }
    const jsonStr = JSON.stringify(extractedItems, null, 2);
    try {
      await navigator.clipboard.writeText(jsonStr);
      showToast(`Copied ${extractedItems.length} items as JSON!`);
    } catch (err) {
      fallbackCopyText(jsonStr);
      showToast('Copied JSON to clipboard!');
    }
  }

  function fallbackCopyText(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  // --- Helpers ---
  function setLoadingState(loading) {
    btnExtract.disabled = loading;
    if (loading) {
      btnExtractText.textContent = 'Extracting...';
      statusDot.className = 'status-dot pulse';
    } else {
      btnExtractText.textContent = 'Extract from Active Tab';
      statusDot.className = isTabSupported ? 'status-dot' : 'status-dot error';
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }

  function safePreviewUrl(value) {
    try {
      const url = new URL(String(value || ''));
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '#';
    } catch (_) { return '#'; }
  }

  function shortenUrl(url) {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      const path = parsed.pathname.length > 15 ? parsed.pathname.slice(0, 15) + '...' : parsed.pathname;
      return parsed.hostname + path;
    } catch (e) {
      return url.length > 25 ? url.slice(0, 25) + '...' : url;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Export internal engine for standalone/testing mode
  if (typeof window !== 'undefined') {
    window.SmartExtractEngine = {
      extractDataInPageContext,
      generateSafeCsvString,
      PRESETS
    };
  }

})();
