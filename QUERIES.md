# Query reference

Every command is **read-only** and scoped by your token to your department. Below is
what each one returns.

| Query | Returns | Admin only |
|---|---|:--:|
| `stats` | Team size, and counts of open / done / overdue cards, plus how many people are tracking time right now. | |
| `team` | Your department's team members — name, role, and whether they're tracking. | |
| `overdue` | Cards past their due date and not done — card, client, assignee, due date. | |
| `workload` | Open + overdue card counts per person, so you can see who's buried. | |
| `active` | Who is tracking time right now (live), and on which card. | |
| `comments` | Recent comments on your team's cards — card, author, comment, date. | |
| `search "<text>"` | Cards whose title or client matches the text. | |
| `card <id>` | One card in detail (first 8 characters of the id are enough). | |
| `ps-issues` | Open product-support issues. | ✅ |
| `audit` | Access log — who ran which query and when. | ✅ |

## Scope

A token carries the department(s) it may see. Everything you run is filtered to
**your department's team and their cards** — you never see other departments,
leadership, admins, or anything financial. Admin-only queries (`ps-issues`, `audit`)
return a permission error for a team token.

## Examples

```text
$ roster stats
team size: 7
open: 24   done: 37   overdue: 5
active now: 2

$ roster overdue
CARD            CLIENT    ASSIGNEE        DUE
JUN Reel 1      —         Mahmoud Hesham  Jun 23
Video Prod 03   Deboned   Thahir Jabbar   Jun 25

$ roster workload
PERSON           OPEN  OVERDUE
Mahmoud Hesham   8     3
Joshin Samuel    4     1
```
