import * as migration_20260915_103709_initial_schema from './20260915_103709_initial_schema';
import * as migration_20260915_104651_unlocalize_reference_slugs from './20260915_104651_unlocalize_reference_slugs';

export const migrations = [
  {
    up: migration_20260915_103709_initial_schema.up,
    down: migration_20260915_103709_initial_schema.down,
    name: '20260915_103709_initial_schema',
  },
  {
    up: migration_20260915_104651_unlocalize_reference_slugs.up,
    down: migration_20260915_104651_unlocalize_reference_slugs.down,
    name: '20260915_104651_unlocalize_reference_slugs'
  },
];
