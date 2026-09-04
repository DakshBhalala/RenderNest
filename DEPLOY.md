# RenderNest Production Deployment Guide (Oracle Cloud VM + Docker)

This is the complete, canonical operations guide for deploying **RenderNest** on an Oracle Cloud Infrastructure (OCI) Ubuntu compute instance using Docker, Docker Compose, Caddy (automatic TLS), PostgreSQL 16, Redis 7, Playwright Chromium, Cloudflare R2, and RapidAPI.

---

## Architecture Overview

```text
                                INTERNET
                                   |
                                   v
                          CLOUDFLARE (DNS + SSL)
                                   |
                                   v
                             HTTPS / 443
                                   |
                                   v
                       CADDY REVERSE PROXY (Docker)
                                   |
               +-------------------+-------------------+
               |                                       |
               v                                       v
         web (Node.js/Next.js)                 /health & /ready
         Port: internal 3000
               |
      +--------+--------+
      |                 |
      v                 v
PostgreSQL 16        Redis 7
(db data volume)   (queue data)
                        |
                        v
                 worker (Node.js)
                        |
                        v
                 Playwright/Chromium
                        |
                        v
                 OUTBOUND INTERNET (Target URLs)
                        |
           (Artifacts: screenshots, PDFs)
                        |
                        v
                 Cloudflare R2 Bucket
```

---

## Separation of Responsibilities

### Automated / Scriptable by RenderNest Tooling
- Generating cryptographically secure secrets (`scripts/generate-production-secrets.sh`)
- Automated production pre-flight checks (`pnpm deploy:check`)
- Safe database migration (`scripts/migrate-production.sh`)
- Database backup and recovery (`scripts/backup-postgres.sh`, `scripts/restore-postgres.sh`)
- Docker container orchestration and healthchecks (`docker-compose.production.yml`)
- Zero-downtime rolling updates (`scripts/update-production.sh`)
- Instant rollback (`scripts/rollback-production.sh`)
- RapidAPI integration validation (`scripts/verify-rapidapi.ts`)
- Production smoke test (`scripts/production-smoke-test.ts`)

### Requires Your Personal Accounts / Manual Actions
- Creating Oracle Cloud VM & provisioning SSH keys
- Creating Cloudflare DNS records & R2 storage bucket
- Pasting generated secrets into `/opt/rendernest/.env.production`
- Creating API listing on RapidAPI Provider Portal

---

## Step-by-Step Deployment (21 Steps)

### Step 1: Oracle Cloud Compute Instance Setup
1. Log into your **Oracle Cloud Console**.
2. Navigate to **Compute** → **Instances** → **Create Instance**.
3. **Name**: `rendernest-production-vm`.
4. **Image**: `Canonical Ubuntu 24.04 LTS` (or `22.04 LTS`).
5. **Shape**:
   - Recommended: Ampere A1 (ARM64) 4 OCPUs / 24 GB RAM (Always Free eligible) OR AMD E4 Flex / Intel Standard (x86_64) with at least 2 OCPUs / 8 GB RAM.
   - *Note*: Chromium runs reliably on both x86_64 and arm64 Linux.
6. **Networking**: Assign a public IPv4 address.
7. **SSH Keys**: Download and save your private SSH key (`rendernest-key.pem`).
8. Click **Create** and note the public IP address (`ORACLE_VM_IP`).

### Step 2: Ubuntu Initial Server Configuration
Connect to your instance via SSH:
```bash
ssh -i rendernest-key.pem ubuntu@<ORACLE_VM_IP>
```

Update system packages and install essential utilities:
```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl wget git jq ufw ca-certificates gnupg lsb-release
```

Configure timezone and swap space (recommended 4GB swap to safeguard browser spikes):
```bash
# Add 4GB swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Step 3: Docker & Docker Compose Installation
Install official Docker Engine:
```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Enable Docker service and add user to docker group
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ubuntu
```
Log out and log back in for docker group permissions to take effect.

### Step 4: Repository Deployment
Clone the repository into `/opt/rendernest`:
```bash
sudo mkdir -p /opt/rendernest
sudo chown ubuntu:ubuntu /opt/rendernest
git clone https://github.com/your-org/rendernest.git /opt/rendernest
cd /opt/rendernest
```

### Step 5: Environment Variables & Secret Generation
Run the secret generation script to produce fresh, cryptographically strong tokens:
```bash
bash scripts/generate-production-secrets.sh
```

Copy the production example file:
```bash
cp .env.production.example .env.production
chmod 600 .env.production
nano .env.production
```
Fill in the values generated by the secret generator, along with your domain and R2 credentials.

### Step 6: Cloudflare R2 Storage Setup
1. Go to **Cloudflare Dashboard** → **R2** → **Create Bucket**.
2. **Bucket Name**: `rendernest-production-artifacts`.
3. Set **Object Lifecycle**: Add rule to expire objects in `artifacts/` after **7 days** (prevents unbounded disk/cloud accumulation).
4. Go to **Manage R2 API Tokens** → **Create API Token**:
   - Permissions: `Object Read & Write`.
   - Apply to: `rendernest-production-artifacts`.
5. Copy the **Access Key ID**, **Secret Access Key**, and **Account ID** into `/opt/rendernest/.env.production`:
   ```bash
   STORAGE_DRIVER=r2
   R2_ACCOUNT_ID=<your_account_id>
   R2_ACCESS_KEY=<your_access_key>
   R2_SECRET_KEY=<your_secret_key>
   R2_BUCKET=rendernest-production-artifacts
   ```

### Step 7: PostgreSQL Production Configuration
The database runs as an isolated container (`postgres:16-alpine`) on the internal bridge network. Data is persisted to the Docker volume `postgres_prod_data`.
In `.env.production`:
```bash
POSTGRES_USER=rendernest
POSTGRES_PASSWORD=<generated_db_password>
POSTGRES_DB=rendernest_production
DATABASE_URL=postgresql://rendernest:<generated_db_password>@postgres:5432/rendernest_production
```

### Step 8: Redis Production Configuration
Redis runs as an isolated container (`redis:7-alpine`) on the internal bridge network with append-only persistence enabled.
In `.env.production`:
```bash
REDIS_URL=redis://redis:6379
```

### Step 9: Firewall Setup (Oracle Security List + Host UFW)
Follow [ORACLE-FIREWALL.md](./ORACLE-FIREWALL.md):
1. In Oracle VCN Console: Allow ingress on TCP ports `80`, `443`, and restricted `22`.
2. On the Ubuntu host:
   ```bash
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow 22/tcp comment 'SSH'
   sudo ufw allow 80/tcp comment 'HTTP'
   sudo ufw allow 443/tcp comment 'HTTPS'
   sudo ufw enable
   ```

### Step 10: Reverse Proxy (Caddyfile) Setup
Verify `Caddyfile` in the repository root:
- Automatically issues and renews Let's Encrypt / ZeroSSL TLS certificates.
- Proxies requests to internal container `web:3000`.
- Injects standard HSTS, CSP, and security headers.
- Restricts payload sizes to 10MB to prevent DoS.

### Step 11: Cloudflare DNS Setup
In your Cloudflare dashboard:
1. Navigate to **DNS** → **Records**.
2. Add an **A record**:
   - **Name**: `api` (or `@` for apex domain)
   - **IPv4 Address**: `<ORACLE_VM_IP>`
   - **Proxy Status**: **Proxied** (Orange Cloud) for DDoS protection, OR **DNS Only** (Grey Cloud) if you prefer direct Caddy TLS management.
   - *Note*: If Proxied, set Cloudflare SSL/TLS mode to **Full (Strict)**.

### Step 12: Domain & HTTPS Verification
Set your canonical URLs in `.env.production`:
```bash
APP_URL=https://rendernest.com
API_URL=https://api.rendernest.com
```

### Step 13: Database Migration
Run the automated migration script to initialize the PostgreSQL schema:
```bash
bash scripts/migrate-production.sh
```

### Step 14: Start Production Services
Launch the entire 5-service production stack:
```bash
bash scripts/deploy.sh
```
Or directly via Docker Compose:
```bash
docker compose -f docker-compose.production.yml up -d --build
```

### Step 15: Health & Readiness Verification
Check running containers:
```bash
docker compose -f docker-compose.production.yml ps
```
All containers (`caddy`, `web`, `worker`, `postgres`, `redis`) should display status `Up (healthy)`.

Verify endpoints directly:
```bash
# Process liveness
curl -i http://localhost/health
# Dependency readiness (PostgreSQL + Redis)
curl -i http://localhost/ready
```

### Step 16: Production Smoke Test
Verify public end-to-end functionality using the smoke test script:
```bash
API_KEY=wf_live_your_key API_URL=https://api.rendernest.com node --import tsx scripts/production-smoke-test.ts
```

### Step 17: RapidAPI Provider Setup
1. Follow [RAPIDAPI-DEPLOY.md](./RAPIDAPI-DEPLOY.md) to register your API in the RapidAPI Provider Portal.
2. Set Target URL: `https://api.rendernest.com`.
3. Set Proxy Secret in `/opt/rendernest/.env.production` (`RAPIDAPI_PROXY_SECRET`).
4. Run verification:
   ```bash
   node --import tsx scripts/verify-rapidapi.ts
   ```

### Step 18: Zero-Downtime Updates
When releasing new versions:
```bash
bash scripts/update-production.sh
```
The script pulls the latest Git commit, re-verifies dependencies, applies database migrations safely, rebuilds images, and restarts containers with zero downtime.

### Step 19: Database Backups
Create on-demand backups:
```bash
bash scripts/backup-postgres.sh
```
Backups are saved to `/opt/rendernest/backups/rendernest_backup_<TIMESTAMP>.sql.gz`.

To automate daily backups via cron:
```bash
(crontab -l 2>/dev/null; echo "0 3 * * * /bin/bash /opt/rendernest/scripts/backup-postgres.sh >> /var/log/rendernest-backup.log 2>&1") | crontab -
```

### Step 20: Disaster Recovery & Rollback
To rollback to a previous version:
```bash
bash scripts/rollback-production.sh
```
To restore a database backup:
```bash
bash scripts/restore-postgres.sh /opt/rendernest/backups/rendernest_backup_<TIMESTAMP>.sql.gz
```

### Step 21: Troubleshooting Guide
- **Container won't start**: Inspect container logs:
  `docker compose -f docker-compose.production.yml logs web --tail=100`
- **Worker browser crash**: Check shared memory and worker memory:
  `docker compose -f docker-compose.production.yml exec worker free -m`
- **Redis connection refused**: Verify Redis is running and healthy:
  `docker compose -f docker-compose.production.yml exec redis redis-cli ping`
- **502 Bad Gateway from Caddy**: Ensure web container is listening on port 3000 and healthy:
  `docker compose -f docker-compose.production.yml exec web curl -s http://localhost:3000/health`

---

# MY MANUAL STEPS

The following actions require your personal account credentials or manual console actions. Everything else is handled automatically by the repository deployment scripts:

1. **Oracle Cloud Console**:
   - Create Compute Instance (Ubuntu 22.04 or 24.04).
   - In VCN Security List: Allow ingress on TCP `80`, `443`, and restricted `22`.
   - Note the instance public IP address.
2. **Domain & Cloudflare**:
   - Point your DNS A record (e.g. `api.rendernest.com`) to the Oracle VM IP.
   - Set Cloudflare SSL/TLS encryption mode to **Full (Strict)**.
3. **Cloudflare R2 Bucket**:
   - Create bucket `rendernest-production-artifacts`.
   - Set a 7-day lifecycle deletion rule on `artifacts/`.
   - Create R2 API tokens and copy Account ID, Access Key, and Secret Key.
4. **Configure Production Secrets**:
   - SSH into the Oracle VM (`ssh -i key.pem ubuntu@<IP>`).
   - Run `bash scripts/generate-production-secrets.sh`.
   - Paste the generated values and R2 credentials into `/opt/rendernest/.env.production`.
5. **Execute Deployment Script**:
   - Run `bash scripts/deploy.sh`.
6. **RapidAPI Provider Portal**:
   - Create new API listing on [rapidapi.com/provider](https://rapidapi.com/provider).
   - Set Target URL to `https://api.rendernest.com`.
   - Copy Proxy Secret into `/opt/rendernest/.env.production` as `RAPIDAPI_PROXY_SECRET`.
   - Run `node --import tsx scripts/verify-rapidapi.ts`.
   - Publish listing following [RAPIDAPI-LISTING.md](./RAPIDAPI-LISTING.md).
