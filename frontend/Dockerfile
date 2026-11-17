FROM node:24.22.2-alpine3.24 AS base
WORKDIR /app
COPY --from=ghcr.io/pnpm/pnpm:12-alpine /opt/pnpm /opt/pnpm
RUN for bin in pnpm pn pnpx pnx; do ln -s "/opt/pnpm/$bin" "/usr/local/bin/$bin"; done
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .

FROM base AS dev
CMD ["pnpm", "dev", "--host", "0.0.0.0"]

FROM base AS build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_BASE_URL
ENV VITE_BASE_URL=$VITE_BASE_URL
RUN ["pnpm", "build"]

FROM base AS prod
RUN ["pnpm", "preview"]
