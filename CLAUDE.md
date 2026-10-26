# Things by K

## Before opening a pull request

Every change gets a ponytail review before the PR is opened, so Kyle only sees
work that already passed it:

1. Build the change and commit it (commit messages start with a `[Tag]`).
2. Run `/ponytail-review` on the whole branch: `git diff origin/main...HEAD`.
3. Fix every **Must fix** and **Should fix** finding, commit, and review again.
   Repeat until the verdict is `Verdict: Ship.` A finding you are sure is wrong
   can stay, with the reason written in the PR description.
4. Run `node .claude/hooks/check-pr-review.mjs --mark`, then open the PR. A hook
   blocks the PR until the reviewed commit is the one being opened.
5. In the PR description, add a short **Ponytail review** section: how many
   rounds, what was fixed, and anything left as "Nice to have".

Open the PR when it is clean, but merge only when Kyle says so.
