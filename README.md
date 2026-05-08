# Roger Loomis Website

This repository contains the static publish directory for the Roger Loomis website. The repository root is intentionally structured as the deployable site root for Netlify.

For Netlify, use the following settings:

| Setting | Value |
|---|---|
| Build command | Leave blank |
| Publish directory | `.` |
| Base directory | Repository root |

The site is plain HTML, CSS, JavaScript, and static media. Future edits can be made directly to files in this repository; pushing to the default branch will trigger a Netlify redeploy once the repository is connected in Netlify.
