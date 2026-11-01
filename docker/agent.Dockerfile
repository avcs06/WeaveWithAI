# The coding agent's sandbox (CD3): Muse Code runs here with only the app mounted.
# Node's major matches the host's, since node_modules is installed on the host.
FROM node:24-bookworm

RUN corepack enable

# The Chromium of the template's playwright-core, for `pnpm verify` inside a session.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx -y playwright-core@1.56.1 install --with-deps chromium && chmod -R a+rX /ms-playwright

# Muse Code is mounted from the host at /opt/muse; it must not update itself in here.
ENV MUSE_UPDATE_INTERVAL_SECONDS=31536000
WORKDIR /app
