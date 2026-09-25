const { MENU_CATEGORIES } = require('./menu.data');

function getCategoryRows(categoryKey) {
  const category = MENU_CATEGORIES[categoryKey];

  if (!category) {
    return [];
  }

  return category.rows;
}

function buildCategorySelect() {
  // return sections where each category becomes a section with its rows
  return Object.entries(MENU_CATEGORIES).map(([key, category]) => ({
    title: category.title,
    rows: (category.rows || []).map((row) => ({
      title: row.title,
      id: row.rowId,
      description: row.description || '',
    })),
  }));
}

function getMainMenuSection() {
  const mainCategory = MENU_CATEGORIES.menu_utama;
  if (!mainCategory) return null;

  return {
    title: mainCategory.title,
    rows: (mainCategory.rows || []).map((row) => ({
      title: row.title,
      id: row.rowId,
      description: row.description || '',
    })),
  };
}

function getFiturBotSection() {
  const fiturCategory = MENU_CATEGORIES.fitur_bot;
  if (!fiturCategory) return null;

  return {
    title: fiturCategory.title,
    rows: (fiturCategory.rows || []).map((row) => ({
      title: row.title,
      id: row.rowId,
      description: row.description || '',
    })),
  };
}

function buildCommandSelect(categoryKey) {
  const category = MENU_CATEGORIES[categoryKey];

  if (!category) {
    return [];
  }

  const sections = [
    {
      title: category.title,
      rows: category.rows.map((row) => ({
        title: row.title,
        id: row.rowId,
        description: row.description,
      })),
    },
  ];

  // Include MENU UTAMA and FITUR BOT sections if category is not menu_utama
  if (categoryKey !== 'menu_utama') {
    const mainMenuSection = getMainMenuSection();
    if (mainMenuSection) {
      sections.push(mainMenuSection);
    }
  }

  return sections;
}

module.exports = {
  getCategoryRows,
  buildCategorySelect,
  buildCommandSelect,
  getMainMenuSection,
  getFiturBotSection,
};
