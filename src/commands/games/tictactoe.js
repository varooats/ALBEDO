const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { messages } = require('../../messages');
const { resolveMentionJids, getSenderJid } = require('../../utils/message');
const { setSession, hasSession, deleteSession } = require('../../features/games/game.state');
const { awardXp } = require('../../features/games/xp.engine');

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function checkWinner(board) {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] !== '⬜' && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  if (!board.includes('⬜')) return 'draw';
  return null;
}

module.exports = createCommand({
  name: 'tictactoe',
  aliases: ['ttt'],
  description: 'Main Tic Tac Toe melawan user lain.',
  execute: async (client, message) => {
    const jid = message?.key?.remoteJid;
    if (!jid) return false;

    const sender = getSenderJid(message);
    const mentions = resolveMentionJids(message);
    const opponent = mentions[0] || null;

    if (!opponent || opponent === sender) {
      await replyText(client, message, 'Tag lawanmu untuk bertanding: ```.tictactoe @user```');
      return true;
    }

    if (hasSession(jid)) {
      await replyText(client, message, messages.games.quiz.alreadyActive);
      return true;
    }

    const p1Tag = `@${sender.split('@')[0]}`;
    const p2Tag = `@${opponent.split('@')[0]}`;
    const board = Array(9).fill('⬜');

    const session = {
      type: 'tictactoe',
      p1: sender,
      p2: opponent,
      turn: sender,
      board,
      timer: setTimeout(async () => {
        deleteSession(jid);
        await replyText(client, message, '⏰ Waktu Tic Tac Toe habis! Permainan selesai.');
      }, 120 * 1000),
      onMove: async (playerJid, posStr) => {
        const pos = parseInt(posStr, 10) - 1;
        if (isNaN(pos) || pos < 0 || pos > 8) return false;
        if (playerJid !== session.turn) return false;
        if (session.board[pos] !== '⬜') return false;

        const symbol = session.turn === session.p1 ? '❌' : '⭕';
        session.board[pos] = symbol;

        const outcome = checkWinner(session.board);
        if (outcome) {
          clearTimeout(session.timer);
          deleteSession(jid);

          let winnerTag = 'draw';
          if (outcome === '❌') {
            winnerTag = p1Tag;
            await awardXp(session.p1, 'win');
            await awardXp(session.p2, 'lose');
          } else if (outcome === '⭕') {
            winnerTag = p2Tag;
            await awardXp(session.p2, 'win');
            await awardXp(session.p1, 'lose');
          } else {
            await awardXp(session.p1, 'draw');
            await awardXp(session.p2, 'draw');
          }

          await replyText(
            client,
            message,
            messages.games.battle.tttEnd({
              winner: winnerTag,
              isDraw: outcome === 'draw',
            }),
            { mentions: [session.p1, session.p2] }
          );
          return true;
        }

        session.turn = session.turn === session.p1 ? session.p2 : session.p1;
        const currentTurnTag = session.turn === session.p1 ? p1Tag : p2Tag;

        await replyText(
          client,
          message,
          messages.games.battle.tttBoard({
            p1: p1Tag,
            p2: p2Tag,
            turn: currentTurnTag,
            board: session.board,
          }),
          { mentions: [session.p1, session.p2] }
        );
        return true;
      },
    };

    setSession(jid, session);

    await replyText(
      client,
      message,
      messages.games.battle.tttBoard({
        p1: p1Tag,
        p2: p2Tag,
        turn: p1Tag,
        board,
      }),
      { mentions: [sender, opponent] }
    );
    return true;
  },
});
