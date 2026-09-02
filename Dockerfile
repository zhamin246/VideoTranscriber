# Node 20: Next 15 + pnpm 9 are reliable here. Avoid corepack+pnpm@latest
# (pnpm 11 on Node 18 hits ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING).
FROM node:20-bookworm-slim AS base

# Install dependencies only when needed
FROM base AS deps
# Install build dependencies for native modules + pin pnpm (matches lockfile v9)
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && npm install -g pnpm@9.15.9 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies based on the preferred package manager
# Include workspace file so pnpm treats the project consistently across stages
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Install dependencies (skip postinstall as it may need source files)
# Postinstall scripts will run after we copy the source code
# Use --frozen-lockfile to ensure reproducible builds
RUN pnpm install --frozen-lockfile --ignore-scripts

# Rebuild the source code only when needed
FROM deps AS builder

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# -----------------------------------------------------------------------------
# Build Arguments for NEXT_PUBLIC_* variables
# These variables are embedded at build time and must be provided during docker build
# -----------------------------------------------------------------------------
# 必需变量
ARG NEXT_PUBLIC_WEB_URL
ARG NEXT_PUBLIC_PROJECT_NAME

# 支付相关（可选，有默认值）
ARG NEXT_PUBLIC_PAY_SUCCESS_URL
ARG NEXT_PUBLIC_PAY_FAIL_URL
ARG NEXT_PUBLIC_PAY_CANCEL_URL

# 认证相关（可选，如果不需要登录功能可以不配置）
ARG NEXT_PUBLIC_AUTH_ENABLED
ARG NEXT_PUBLIC_AUTH_GOOGLE_ENABLED
ARG NEXT_PUBLIC_AUTH_GOOGLE_ID
ARG NEXT_PUBLIC_AUTH_GITHUB_ENABLED
ARG NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED

# 其他配置（可选）
ARG NEXT_PUBLIC_SUPPORT_EMAIL
ARG NEXT_PUBLIC_LOCALE_DETECTION
ARG NEXT_PUBLIC_GOOGLE_ADCODE
ARG NEXT_PUBLIC_DEFAULT_THEME

# 分析统计（可选）
ARG NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
ARG NEXT_PUBLIC_PLAUSIBLE_DOMAIN
ARG NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL
ARG NEXT_PUBLIC_OPENPANEL_CLIENT_ID
ARG NEXT_PUBLIC_CLARITY_PROJECT_ID

# Set environment variables for build
ENV NEXT_PUBLIC_WEB_URL=${NEXT_PUBLIC_WEB_URL}
ENV NEXT_PUBLIC_PROJECT_NAME=${NEXT_PUBLIC_PROJECT_NAME}
ENV NEXT_PUBLIC_PAY_SUCCESS_URL=${NEXT_PUBLIC_PAY_SUCCESS_URL}
ENV NEXT_PUBLIC_PAY_FAIL_URL=${NEXT_PUBLIC_PAY_FAIL_URL}
ENV NEXT_PUBLIC_PAY_CANCEL_URL=${NEXT_PUBLIC_PAY_CANCEL_URL}
ENV NEXT_PUBLIC_AUTH_ENABLED=${NEXT_PUBLIC_AUTH_ENABLED}
ENV NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=${NEXT_PUBLIC_AUTH_GOOGLE_ENABLED}
ENV NEXT_PUBLIC_AUTH_GOOGLE_ID=${NEXT_PUBLIC_AUTH_GOOGLE_ID}
ENV NEXT_PUBLIC_AUTH_GITHUB_ENABLED=${NEXT_PUBLIC_AUTH_GITHUB_ENABLED}
ENV NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED=${NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED}
ENV NEXT_PUBLIC_SUPPORT_EMAIL=${NEXT_PUBLIC_SUPPORT_EMAIL}
ENV NEXT_PUBLIC_LOCALE_DETECTION=${NEXT_PUBLIC_LOCALE_DETECTION}
ENV NEXT_PUBLIC_GOOGLE_ADCODE=${NEXT_PUBLIC_GOOGLE_ADCODE}
ENV NEXT_PUBLIC_DEFAULT_THEME=${NEXT_PUBLIC_DEFAULT_THEME}
ENV NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=${NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}
ENV NEXT_PUBLIC_PLAUSIBLE_DOMAIN=${NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
ENV NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL=${NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL}
ENV NEXT_PUBLIC_OPENPANEL_CLIENT_ID=${NEXT_PUBLIC_OPENPANEL_CLIENT_ID}
ENV NEXT_PUBLIC_CLARITY_PROJECT_ID=${NEXT_PUBLIC_CLARITY_PROJECT_ID}

# Copy source code (excluding node_modules via .dockerignore)
COPY . .
# Run postinstall scripts now that source files are available
# fumadocs-mdx needs source files to scan and generate MDX configuration
# Prefer explicit commands so a broken workspace file cannot block the script name lookup
RUN pnpm exec fumadocs-mdx && node scripts/copy-mediapipe.mjs
# Build the application
RUN pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs \
    && mkdir .next \
    && chown nextjs:nodejs .next

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]