# Roger Loomis Website

This repository contains the static publish directory for the Roger Loomis website. The repository root is intentionally structured as the deployable site root for Netlify.

For Netlify, use the following settings:

| Setting | Value |
|---|---|
| Build command | Leave blank |
| Publish directory | `.` |
| Base directory | Repository root |

The site is plain HTML, CSS, JavaScript, and static media. Future edits can be made directly to files in this repository; pushing to the default branch will trigger a Netlify redeploy once the repository is connected in Netlify.

## Adding a blog post

1. Copy an existing `blog/<slug>.html` as the template and drop in the new post.
2. Add its card to the grid in `blog.html` (`data-cat` + `data-search`).
3. Commit, then run:

```bash
node scripts/stamp-posts.mjs
```

The script dates every post from the day its file was first committed, writes the date into the page and its JSON-LD, and re-sorts the `blog.html` grid newest first. Safe to rerun. To change a post's date, edit `datePublished` in that post's JSON-LD and rerun the script.
