/**
 * Theme utility functions for dynamic CSS generation
 */

/**
 * Gets the current theme CSS variables as an object
 * @returns {Object} Object containing CSS variable values
 */
export function getCurrentThemeVariables() {
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  
  return {
    bgPrimary: computedStyle.getPropertyValue('--bg-primary').trim(),
    bgSecondary: computedStyle.getPropertyValue('--bg-secondary').trim(),
    bgTertiary: computedStyle.getPropertyValue('--bg-tertiary').trim(),
    textPrimary: computedStyle.getPropertyValue('--text-primary').trim(),
    textSecondary: computedStyle.getPropertyValue('--text-secondary').trim(),
    textMuted: computedStyle.getPropertyValue('--text-muted').trim(),
    borderColor: computedStyle.getPropertyValue('--border-color').trim(),
    borderHover: computedStyle.getPropertyValue('--border-hover').trim(),
    shadow: computedStyle.getPropertyValue('--shadow').trim(),
    accentPrimary: computedStyle.getPropertyValue('--accent-primary').trim(),
    accentSuccess: computedStyle.getPropertyValue('--accent-success').trim(),
    accentWarning: computedStyle.getPropertyValue('--accent-warning').trim(),
    accentDanger: computedStyle.getPropertyValue('--accent-danger').trim(),
    accentInfo: computedStyle.getPropertyValue('--accent-info').trim(),
    cardBg: computedStyle.getPropertyValue('--card-bg').trim(),
    headerBg: computedStyle.getPropertyValue('--header-bg').trim(),
    tableStripe: computedStyle.getPropertyValue('--table-stripe').trim(),
    tableHover: computedStyle.getPropertyValue('--table-hover').trim(),
    inputBg: computedStyle.getPropertyValue('--input-bg').trim(),
    modalBg: computedStyle.getPropertyValue('--modal-bg').trim(),
  };
}

/**
 * Generates theme-aware CSS for print styles
 * @returns {string} CSS string with current theme variables
 */
export function generatePrintCSS() {
  const theme = getCurrentThemeVariables();
  
  return `
    <style>
      body { 
        font-family: Arial, sans-serif; 
        margin: 20px; 
        font-size: 11px;
        background-color: ${theme.bgPrimary};
        color: ${theme.textPrimary};
      }
      .letterhead {
        border-bottom: 3px solid ${theme.accentPrimary};
        padding-bottom: 15px;
        margin-bottom: 20px;
      }
      .letterhead h1 {
        font-size: 24px;
        margin: 0 0 5px 0;
        color: ${theme.accentPrimary};
        display: flex;
        justify-content: center;
      }
      .letterhead .tagline {
        font-size: 11px;
        font-weight: bold;
        color: ${theme.textSecondary};
        margin: 5px 0;
      }
      .letterhead .address {
        font-size: 10px;
        color: ${theme.textMuted};
        line-height: 1.4;
      }
      .letterhead .ref-date {
        display: flex;
        justify-content: space-between;
        margin-top: 10px;
        font-size: 10px;
        font-weight: bold;
      }
      h1 { 
        color: ${theme.textPrimary}; 
        border-bottom: 2px solid ${theme.accentPrimary};
        padding-bottom: 10px;
        font-size: 18px;
        margin-top: 20px;
      }
      h2 {
        color: ${theme.textSecondary};
        font-size: 16px;
        margin-top: 25px;
        border-bottom: 1px solid ${theme.borderColor};
        padding-bottom: 5px;
      }
      h4 {
        color: ${theme.textSecondary};
        margin: 15px 0 5px 0;
        font-size: 14px;
      }
      table { 
        border-collapse: collapse; 
        width: 100%; 
        margin-top: 20px; 
        font-size: 10px;
        background-color: ${theme.cardBg};
      }
      th, td { 
        border: 1px solid ${theme.borderColor}; 
        padding: 6px; 
        text-align: left; 
        color: ${theme.textPrimary};
      }
      th { 
        background-color: ${theme.accentPrimary}; 
        color: white;
        font-weight: bold;
      }
      tr:nth-child(even) { 
        background-color: ${theme.tableStripe}; 
      }
      .badge-success { background-color: ${theme.accentSuccess}; color: white; }
      .badge-warning { background-color: ${theme.accentWarning}; color: black; }
      .badge-danger { background-color: ${theme.accentDanger}; color: white; }
      .badge-secondary { background-color: ${theme.textMuted}; color: white; }
      .badge-primary { background-color: ${theme.accentPrimary}; color: white; }
      .badge-info { background-color: ${theme.accentInfo}; color: white; }
      .summary {
        background: ${theme.bgSecondary};
        padding: 15px;
        border-radius: 5px;
        margin: 20px 0;
      }
      .summary-item {
        font-weight: bold;
        padding: 10px;
        background: ${theme.cardBg};
        border-radius: 3px;
        border-left: 4px solid ${theme.accentPrimary};
      }
      @media print {
        body { margin: 0; }
        .no-print { display: none; }
        .charts-section { page-break-before: always; }
        .chart-container { break-inside: avoid; }
      }
    </style>
  `;
}

/**
 * Gets the current theme mode (light or dark)
 * @returns {string} 'light' or 'dark'
 */
export function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

/**
 * Sets the theme mode
 * @param {string} theme - 'light' or 'dark'
 */
export function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

/**
 * Toggles between light and dark theme
 * @returns {string} The new theme mode
 */
export function toggleTheme() {
  const currentTheme = getCurrentTheme();
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  return newTheme;
}