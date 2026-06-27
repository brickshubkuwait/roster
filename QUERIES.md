# Commands

What each command returns.

| Command | Returns |
|---|---|
| `stats` | Team size, and counts of open / done / overdue cards, plus how many people are tracking time right now. |
| `team` | Your team members — name, role, and whether they're tracking. |
| `overdue` | Cards past their due date and not done — card, client, assignee, due date. |
| `workload` | Open + overdue card counts per person, so you can see who's buried. |
| `active` | Who is tracking time right now, and on which card. |
| `comments` | Recent comments on your team's cards — card, author, comment, date. |
| `search "<text>"` | Cards whose title or client matches the text. |
| `card <id>` | One card in detail (first 8 characters of the id are enough). |

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
