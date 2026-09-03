import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: [
      'src/test/spec/dateFormat.spec.ts',
      'src/test/spec/paste/pasteTransform.spec.ts',
      'src/test/spec/table/tableFormatter.spec.ts',
    ],
  },
});
