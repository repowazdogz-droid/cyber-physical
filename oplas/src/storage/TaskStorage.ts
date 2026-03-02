/**
 * Task Storage
 * 
 * Storage layout for Gate 1a: task_<id>/ structure.
 * 
 * Version: 1.0.0
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { CanonicalRepresentation } from '../contracts/types/Repr';
import { RawGridInput } from '../domains/grid_2d/types';
import { hashCanonical } from '../contracts/invariants/CanonicalHashing';

/**
 * Task storage structure:
 * task_<id>/
 *   request.json
 *   inputs/grid.json
 *   repr.json
 *   repr.sha256
 *   replay.sh
 */
export class TaskStorage {
  private taskRoot: string;

  constructor(taskRoot: string) {
    this.taskRoot = taskRoot;
  }

  /**
   * Stores a task run.
   */
  async storeTask(
    taskId: string,
    gridInput: RawGridInput,
    repr: CanonicalRepresentation
  ): Promise<void> {
    const taskDir = join(this.taskRoot, `task_${taskId}`);
    const inputsDir = join(taskDir, 'inputs');

    // Create directories
    await fs.mkdir(taskDir, { recursive: true });
    await fs.mkdir(inputsDir, { recursive: true });

    // Store grid input
    await fs.writeFile(
      join(inputsDir, 'grid.json'),
      JSON.stringify(gridInput, null, 2),
      'utf8'
    );

    // Store representation
    await fs.writeFile(
      join(taskDir, 'repr.json'),
      JSON.stringify(repr, null, 2),
      'utf8'
    );

    // Store hash
    const hash = hashCanonical(repr);
    await fs.writeFile(
      join(taskDir, 'repr.sha256'),
      hash,
      'utf8'
    );

    // Create replay script
    const replayScript = `#!/bin/bash
# Replay script for task ${taskId}
# Regenerates repr from grid and verifies hash

cd "$(dirname "$0")"
echo "Replaying task ${taskId}..."

# Run replay (requires Node.js/tsx)
tsx ../../scripts/replay-task.ts ${taskId} || node ../../scripts/replay-task.ts ${taskId}

echo "Replay complete."
`;
    await fs.writeFile(
      join(taskDir, 'replay.sh'),
      replayScript,
      'utf8'
    );
    await fs.chmod(join(taskDir, 'replay.sh'), 0o755);
  }

  /**
   * Retrieves a task run.
   */
  async getTask(taskId: string): Promise<{
    gridInput: RawGridInput;
    repr: CanonicalRepresentation;
    hash: string;
  } | null> {
    const taskDir = join(this.taskRoot, `task_${taskId}`);

    try {
      const gridInput = JSON.parse(
        await fs.readFile(join(taskDir, 'inputs', 'grid.json'), 'utf8')
      ) as RawGridInput;

      const repr = JSON.parse(
        await fs.readFile(join(taskDir, 'repr.json'), 'utf8')
      ) as CanonicalRepresentation;

      const hash = await fs.readFile(join(taskDir, 'repr.sha256'), 'utf8');

      return { gridInput, repr, hash: hash.trim() };
    } catch (error) {
      return null;
    }
  }
}























