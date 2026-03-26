import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
} from 'react';
import Storage from '../utils/storage';

const STORAGE_KEY = '@runner_v2';

// ─── Initial state ────────────────────────────────────────────────────────────
const initialState = {
  coins: 0,
  extraLives: 0,           // purchased extra lives (stackable)
  startShieldOwned: false, // permanent upgrade – start every run with shield
  playerColor: null,       // null = default, '#hex' = tinted ring around player
  reviewQueue: [],         // questions the player answered wrong → shown more often
};

// ─── Action types ─────────────────────────────────────────────────────────────
export const ACTIONS = {
  HYDRATE: 'HYDRATE',
  ADD_COINS: 'ADD_COINS',
  BUY_EXTRA_LIFE: 'BUY_EXTRA_LIFE',
  USE_EXTRA_LIFE: 'USE_EXTRA_LIFE',
  BUY_START_SHIELD: 'BUY_START_SHIELD',
  SET_PLAYER_COLOR: 'SET_PLAYER_COLOR',
  ADD_TO_REVIEW: 'ADD_TO_REVIEW',
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.HYDRATE:
      return { ...initialState, ...action.payload };

    case ACTIONS.ADD_COINS:
      return { ...state, coins: state.coins + action.amount };

    case ACTIONS.BUY_EXTRA_LIFE:
      if (state.coins < 50) return state;
      return { ...state, coins: state.coins - 50, extraLives: state.extraLives + 1 };

    case ACTIONS.USE_EXTRA_LIFE:
      return { ...state, extraLives: Math.max(0, state.extraLives - 1) };

    case ACTIONS.BUY_START_SHIELD:
      if (state.coins < 30 || state.startShieldOwned) return state;
      return { ...state, coins: state.coins - 30, startShieldOwned: true };

    case ACTIONS.SET_PLAYER_COLOR: {
      // Selecting the same color → no charge
      if (action.color === state.playerColor) return state;
      // Resetting to default is free
      if (action.color === null) return { ...state, playerColor: null };
      // Switching to a new color costs 20 coins
      if (state.coins < 20) return state;
      return { ...state, coins: state.coins - 20, playerColor: action.color };
    }

    case ACTIONS.ADD_TO_REVIEW: {
      const exists = state.reviewQueue.some(
        (q) => q.question === action.question.question
      );
      if (exists) return state;
      return {
        ...state,
        reviewQueue: [...state.reviewQueue, action.question],
      };
    }

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [loaded, setLoaded] = useState(false);

  // Hydrate from storage once on mount
  useEffect(() => {
    Storage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            dispatch({ type: ACTIONS.HYDRATE, payload: JSON.parse(raw) });
          } catch {}
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Persist on every state change (after initial load)
  useEffect(() => {
    if (!loaded) return;
    Storage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, loaded]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGameStore = () => useContext(GameContext);
