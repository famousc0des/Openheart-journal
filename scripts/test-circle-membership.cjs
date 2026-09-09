const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Run the domain logic without starting Expo or accessing device storage.
function load(relativePath, dependencies = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require(name) {
      if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  }, { filename: relativePath });
  return exports;
}

const membership = load('src/lib/circle-membership.ts');
const { circleMemberLimit, membersOfCircle, searchMembers, circleLimitError } = membership;
const circle = { id: 'openheart-cord', kind: 'cord', name: 'Cord', createdAt: '2026-01-01' };
const roster = [
  { id: 'one', circleId: circle.id, name: 'José Okafor' },
  { id: 'two', circleId: circle.id, name: 'Ruth Afolabi' },
  { id: 'other', circleId: 'another-circle', name: 'Other Person' },
  { id: `dummy-member-${circle.id}-0`, circleId: circle.id, name: 'Sample Person' },
];
const added = membersOfCircle(roster, circle.id);
assert.equal(added.length, 2, 'Only actual members of this circle are shown');
assert.equal(roster.length, 4, 'Filtering must not erase stored data');
assert.equal(searchMembers(added, '  OKAFOR  jose ').at(0)?.id, 'one');
assert.equal(searchMembers(added, '   ').length, 2);
assert.equal(searchMembers(added, 'sample').length, 0);
assert.equal(searchMembers(added, 'other').length, 0);
assert.equal(searchMembers(added, 'missing').length, 0);
assert.equal(circleMemberLimit(circle), 3);
assert.equal(circleMemberLimit({ ...circle, memberLimit: 8 }), 8);
assert.equal(circleMemberLimit({ ...circle, memberLimit: null }), null);
assert.equal(circleMemberLimit({ ...circle, kind: 'custom' }), null);
assert.equal(circleLimitError('2', 2), null, 'Capacity may equal the current member count');
assert.equal(circleLimitError('', 2), null, 'Blank means unlimited');
for (const invalid of ['0', '-1', '2.5', 'abc', '1e3', '9007199254740992']) {
  assert.ok(circleLimitError(invalid, 0), `Reject invalid capacity: ${invalid}`);
}
assert.ok(circleLimitError('1', 2), 'Cannot lower capacity below the current roster');
assert.equal(circleLimitError(' 12 ', 2), null);

let shares = 0;
let invites = 0;
const circles = load('src/lib/circles.ts', {
  'expo-linking': { createURL: () => 'https://example.invalid/invite' },
  'react-native': { Share: { share: async () => { shares += 1; } } },
  '@/lib/id': { createId: () => 'test-invite' },
  '@/lib/circle-membership': membership,
  '@/lib/stores': {
    accountEmailStore: { getSnapshot: () => 'test@example.invalid' },
    displayNameStore: { getSnapshot: () => 'Test' },
    circleMemberStore: { getSnapshot: () => roster },
    circleInviteStore: { add: () => { invites += 1; } },
  },
});
const savedCircle = JSON.parse(JSON.stringify({ ...circle, memberLimit: 7 }));
const merged = circles.withBuiltInCircles([savedCircle]);
assert.equal(merged.filter((item) => item.id === circle.id).length, 1);
assert.equal(circleMemberLimit(merged.find((item) => item.id === circle.id)), 7, 'Saved built-in circle limits survive loading');
assert.equal(circleMemberLimit(circles.withBuiltInCircles([])[0]), 3, 'Overrides must not mutate the defaults');

(async () => {
  await circles.shareCircleInvite({ ...circle, memberLimit: 2 });
  assert.equal(shares, 0, 'Full circles cannot generate or share invites');
  assert.equal(invites, 0);
  await circles.shareCircleInvite(circle);
  assert.equal(shares, 1, 'Legacy samples do not consume capacity');
  await circles.shareCircleInvite({ ...circle, memberLimit: null });
  assert.equal(shares, 2, 'Unlimited circles allow invitations');
  assert.equal(invites, 2);
  console.log('Circle membership checks passed: filtering, search, capacity, stored overrides, and invite limits.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
