# CLAUDE.md - AI Assistant Guide for dstrkto Repository

## Repository Overview

This is a GitHub profile repository for the user **dstrkto**. Profile repositories are special repositories where the README.md file appears on the user's GitHub profile page.

**Repository Type:** GitHub Profile Repository
**Primary Language:** Markdown
**Current State:** Initial setup with profile README

## Repository Structure

```
dstrkto/
├── .git/              # Git version control
└── README.md          # Profile page content (appears on GitHub profile)
```

## Current Files

### README.md
- **Purpose:** GitHub profile page content
- **Location:** Root directory
- **Visibility:** Publicly displayed on @dstrkto's GitHub profile
- **Content:** Personal introduction, interests, and contact information

## Development Workflows

### Branch Strategy

- **Main Branch:** `main` (or default branch)
- **Feature Branches:** Use `claude/` prefix followed by descriptive name and session ID
- **Current Working Branch:** `claude/claude-md-mic3bxy60kn60byu-0183xWgFbAuL5UHjZMriurmB`

### Git Operations

#### Committing Changes
1. Stage relevant files: `git add <files>`
2. Create descriptive commit messages that explain the "why"
3. Use conventional commit format when appropriate
4. Example: `git commit -m "docs: add comprehensive CLAUDE.md guide"`

#### Pushing Changes
- Always use: `git push -u origin <branch-name>`
- Branch names must start with `claude/` and match session ID
- Retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s) on network failures

#### Fetching/Pulling
- Prefer specific branches: `git fetch origin <branch-name>`
- For pulls: `git pull origin <branch-name>`
- Retry up to 4 times with exponential backoff on network failures

## Key Conventions for AI Assistants

### File Modification Guidelines

1. **Profile README (README.md)**
   - Keep content concise and professional
   - Use GitHub-flavored Markdown
   - Include standard profile sections:
     - Introduction/greeting
     - Current interests
     - Learning goals
     - Collaboration interests
     - Contact information (if desired)
   - Avoid excessive emoji unless user prefers it
   - Keep HTML comments for GitHub special repository notes

2. **Documentation Files**
   - Use clear, descriptive headings
   - Maintain consistent formatting
   - Update modification dates when applicable
   - Keep language clear and concise

### Content Standards

#### Markdown Formatting
- Use ATX-style headers (`#` syntax)
- Employ code blocks with language specifiers
- Use bullet points and numbered lists appropriately
- Include blank lines between sections for readability

#### Tone and Style
- Professional yet personable for public-facing content
- Clear and direct documentation
- Avoid unnecessary superlatives
- No emoji unless explicitly requested by user

### Security Considerations

1. **Never Commit Sensitive Information**
   - No API keys, tokens, or credentials
   - No personal email addresses (unless explicitly intended)
   - No private contact information
   - Review changes before committing

2. **Profile Privacy**
   - README.md is publicly visible
   - Assume all content will be indexed by search engines
   - Keep personal information minimal and intentional

## Common Tasks

### Updating the Profile README

```bash
# 1. Read current content
cat README.md

# 2. Make changes (use Edit tool)
# Edit the file with desired changes

# 3. Review changes
git diff README.md

# 4. Commit and push
git add README.md
git commit -m "docs: update profile information"
git push -u origin <branch-name>
```

### Adding New Files

```bash
# 1. Create file with Write tool
# Write new file content

# 2. Add to git
git add <new-file>

# 3. Commit with descriptive message
git commit -m "docs: add <description>"

# 4. Push changes
git push -u origin <branch-name>
```

### Creating Documentation

When adding documentation:
1. Choose clear, descriptive filenames
2. Use `.md` extension for Markdown files
3. Structure with clear hierarchy
4. Include table of contents for long documents
5. Add examples where appropriate
6. Keep language accessible

## Repository Purpose & Goals

Based on the profile README, this repository serves to:
- Present @dstrkto's GitHub profile
- Share interests ("all the things")
- Indicate current learning (GitHub usage)
- Express collaboration interests (story projects)
- Provide basic contact preferences

## Best Practices for AI Assistants

### Before Making Changes

1. **Read First:** Always read existing files before modifying
2. **Understand Context:** Review commit history when relevant
3. **Confirm Intent:** Clarify user requirements if ambiguous
4. **Plan Complex Tasks:** Use TodoWrite for multi-step operations

### When Making Changes

1. **Minimal Changes:** Only modify what's requested
2. **Preserve Formatting:** Maintain existing style and structure
3. **Test Markdown:** Ensure syntax is valid
4. **Review Diffs:** Check changes before committing

### After Making Changes

1. **Verify Success:** Confirm changes are correct
2. **Document Work:** Write clear commit messages
3. **Push to Correct Branch:** Always use the designated branch
4. **Report Completion:** Summarize what was done

## Special Notes for Profile Repositories

1. **Special Status:** The `README.md` in this repository automatically appears on the GitHub profile
2. **Public Visibility:** All content is publicly accessible
3. **Limited Scope:** Typically contains only profile-related content
4. **No Build Process:** Static content, no compilation or deployment needed

## Troubleshooting

### Common Issues

**Problem:** Push fails with 403 error
**Solution:** Verify branch name starts with `claude/` and ends with matching session ID

**Problem:** Changes don't appear on profile
**Solution:** Ensure file is named exactly `README.md` (case-sensitive) in root directory

**Problem:** Markdown rendering incorrectly
**Solution:** Validate Markdown syntax, check for proper spacing and formatting

## Future Expansion Possibilities

This repository could potentially be expanded with:
- Additional documentation files
- Project links or portfolio items
- GitHub Actions workflows
- Configuration files for various tools
- Badges and status indicators
- Links to other repositories or projects

## Metadata

**Last Updated:** 2025-11-23
**Repository Owner:** @dstrkto
**Repository Name:** dstrkto/dstrkto
**Primary Purpose:** GitHub Profile README
**AI Assistant Guide Version:** 1.0

## References

- [GitHub Profile README Guide](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/customizing-your-profile/managing-your-profile-readme)
- [GitHub Flavored Markdown Spec](https://github.github.com/gfm/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

*This document provides guidance for AI assistants working with this repository. Update as the repository evolves.*
