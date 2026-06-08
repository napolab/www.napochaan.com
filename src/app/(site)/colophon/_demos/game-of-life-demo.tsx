import { GameOfLife } from '@components/game-of-life';
import { LifeEngineProvider } from '@components/game-of-life/provider';

import * as styles from './game-of-life-demo.css';

// The real GameOfLife, filling the cell (the default Resizer measures this box). Its
// own LifeEngineProvider gives it an isolated engine, so this contained instance
// never touches the background's shared engine (which drives the sys-bar gen count).
export const GameOfLifeDemo = () => {
  return (
    <div className={styles.frame}>
      <LifeEngineProvider>
        <GameOfLife />
      </LifeEngineProvider>
    </div>
  );
};
