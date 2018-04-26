import Arena from './Arena';
import MCTS from './MCTS';
import Utils from './Utils';
import { getTrainedNN } from './main';

import { TicTacToeGame, display } from './tictactoe/TicTacToeGame';

import { NNetWrapper as NNet } from './tictactoe/tensorflow/NNet';
// from tictactoe.keras.NNet import NNetWrapper

import * as players from './tictactoe/TicTacToePlayers';
// from tictactoe.TicTacToePlayers import *

// TicTacToeGame reference
let humanGame = null;
let preTrainedModel = null;
let humanArena = null;

export async function downloadPretrained() {
  if (!preTrainedModel) {
    if (!humanGame) {
      humanGame = new TicTacToeGame();
    }
    preTrainedModel = new NNet(humanGame);
    // firstPlayr = new players.RandomPlayer(g);
    await preTrainedModel.loadPretrained('https://grimmer.io/alphago-tictactoe-keras-trained/model.json');
  }
}

export function humanMove(action) {
  if (humanArena) {
    return humanArena.humanStep(action);
  }

  return -1;
}

/**
 * play a game or games
 * mode:
 *  0: two rp
 *  1: self-trained vs rp
 *  2: 1 pretrained vs rp
 *  3: 1 pretrained vs human
 */
export default function play(mode, aiFirst) {
  let g = new TicTacToeGame();
  let firstPlayr = null;
  if (!mode) {
    firstPlayr = new players.RandomPlayer(g);
  } else if (mode === 1) {
    // nnet players

    // TODO: Not test yet
    // const n1 = new NNet(g);
    // n1.load_checkpoint('./pretrained_models/tictactoe/keras/', 'best.pth-grimmer2-less.tar');

    const n1 = getTrainedNN();
    const args1 = { numMCTSSims: 50, cpuct: 1.0 }; // dotdict({ numMCTSSims:
    const mcts1 = new MCTS(g, n1, args1);

    // python ver.: n1p = lambda x: np.argmax(mcts1.getActionProb(x, temp=0))
    const n1p = (x) => {
      const list = mcts1.getActionProb(x, 0);
      return Utils.argmax(list);
    };
    firstPlayr = { play: n1p };
    // const arena = Arena.Arena({play:n1p}, rp2, g, display);
  } else if (mode === 2 || mode === 3) {
    // const n1 = getGlobalNN;

    if (!preTrainedModel) {
      console.log('no preTrainedModel, return');
      return;
    }
    // if (mode === 3) {
    g = humanGame;
    // }

    const args1 = { numMCTSSims: 50, cpuct: 1.0 }; // dotdict({ numMCTSSims:
    const mcts1 = new MCTS(g, preTrainedModel, args1);

    // python ver.: n1p = lambda x: np.argmax(mcts1.getActionProb(x, temp=0))
    const n1p = (x) => {
      const list = mcts1.getActionProb(x, 0);
      return Utils.argmax(list);
    };
    firstPlayr = { play: n1p };

    console.log('load pretraind to play');

    if (mode === 3) {
      const hp = new players.HumanTicTacToePlayer(g);// .play
      if (aiFirst) {
        humanArena = new Arena(firstPlayr, hp, g, display);
      } else {
        humanArena = new Arena(hp, firstPlayr, g, display);
      }
      const action = humanArena.playNewGameWithHuman();

      return action;
    }
  } else {
    console.log('invalid mode, return');
    return;
  }
  // const rp = new players.RandomPlayer(g);// .play;
  const rp2 = new players.RandomPlayer(g);// .play;

  const arena = new Arena(firstPlayr, rp2, g, display);
  console.log(arena.playGames(10, false));
  console.log('finish');
}
