const path = require('path');

const cardsData = require('../../data/tarot.cards.json');

const TAROT_CARDS = cardsData;

function getAllCards() {
  return TAROT_CARDS;
}

function getCardByName(name = '') {
  const query = String(name).trim().toLowerCase();
  return TAROT_CARDS.find((c) => c.name.toLowerCase() === query) || null;
}

module.exports = {
  TAROT_CARDS,
  getAllCards,
  getCardByName,
};
