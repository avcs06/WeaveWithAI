# The coding agent's sandbox (CD3): Muse Code runs here with only the app mounted.
# Node's major matches the host's, since node_modules is installed on the host.
FROM node:24-bookworm

# The app is installed on the host with pnpm 10.20.0; another major refuses its
# node_modules, and the agent then tries to reinstall it (2026-11-01).
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

# The Chromium of the template's playwright-core, for `pnpm verify` inside a session.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx -y playwright-core@1.56.1 install --with-deps chromium && chmod -R a+rX /ms-playwright

# Muse Code is mounted from the host at /opt/muse; it must not update itself in here.
ENV MUSE_UPDATE_INTERVAL_SECONDS=31536000
WORKDIR /app
