# RenderNest Production Firewall & Network Architecture (Oracle Cloud + Host)

This document provides exact, production-hardened network security rules for deploying RenderNest on an **Oracle Cloud Infrastructure (OCI) Compute Instance** running Ubuntu Linux.

RenderNest's security architecture strictly enforces the principle of least privilege:
1. **Public Ingress**: Restricted exclusively to HTTPS (`443`) and HTTP (`80` for TLS challenge/redirect).
2. **Management Ingress**: Restricted SSH (`22`) with key-based authentication only.
3. **Internal Services**: PostgreSQL (`5432`), Redis (`6379`), Web App (`3000`), and Worker internals are bound to Docker private networks only and **never exposed to the public internet or external host interfaces**.
4. **Worker Egress**: Allows outbound traffic to public web targets on ports `80` and `443`, but strictly blocks private IP ranges, cloud metadata services, and internal infrastructure.

---

## 1. Oracle Cloud VCN Security List / NSG Rules

In the Oracle Cloud Console under:
`Networking` → `Virtual Cloud Networks` → `[Your VCN]` → `Security Lists` (or `Network Security Groups`):

### Ingress Rules

| Stateless | Source Type | Source CIDR | IP Protocol | Source Port Range | Destination Port Range | Description |
|---|---|---|---|---|---|---|
| No | CIDR | `0.0.0.0/0` | TCP (6) | All | `443` | Public HTTPS traffic (Cloudflare / Public clients) |
| No | CIDR | `0.0.0.0/0` | TCP (6) | All | `80` | Public HTTP traffic (ACME HTTP-01 challenge & HTTP->HTTPS redirect) |
| No | CIDR | `YOUR_ADMIN_IP/32` (or `0.0.0.0/0` if dynamic) | TCP (6) | All | `22` | Administrative SSH access (Key-based only) |

> [!WARNING]
> **DO NOT** open ports `5432` (PostgreSQL), `6379` (Redis), or `3000` (Node.js) in the Oracle Security List or NSG. All inter-service communication occurs within the isolated Docker bridge network `rendernest_prod_net`.

### Egress Rules

| Stateless | Destination Type | Destination CIDR | IP Protocol | Destination Port Range | Description |
|---|---|---|---|---|---|
| No | CIDR | `0.0.0.0/0` | All Protocols | All | Allow outbound internet traffic (Package updates, Cloudflare R2, external target rendering) |

---

## 2. Ubuntu Host Firewall (UFW) Configuration

Before enabling UFW, ensure SSH is explicitly permitted to prevent accidental lockout.

### Step-by-Step Host Firewall Setup

```bash
# 1. Ensure UFW is installed
sudo apt-get update && sudo apt-get install -y ufw

# 2. Set default policies: deny incoming, allow outgoing
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 3. Allow SSH (Port 22) - Crucial before enabling!
# If you use a static IP, replace with: sudo ufw allow from YOUR_IP to any port 22 proto tcp
sudo ufw allow 22/tcp comment 'SSH Administrative Access'

# 4. Allow HTTP and HTTPS for Caddy reverse proxy
sudo ufw allow 80/tcp comment 'HTTP ACME & Redirect'
sudo ufw allow 443/tcp comment 'HTTPS Production Ingress'

# 5. Enable UFW
sudo ufw enable

# 6. Verify status
sudo ufw status verbose
```

### Expected UFW Output

```text
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)
New profiles: skip

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW IN    Anywhere                   # SSH Administrative Access
80/tcp                     ALLOW IN    Anywhere                   # HTTP ACME & Redirect
443/tcp                    ALLOW IN    Anywhere                   # HTTPS Production Ingress
22/tcp (v6)                ALLOW IN    Anywhere (v6)              # SSH Administrative Access
80/tcp (v6)                ALLOW IN    Anywhere (v6)              # HTTP ACME & Redirect
443/tcp (v6)               ALLOW IN    Anywhere (v6)              # HTTPS Production Ingress
```

---

## 3. Worker Outbound Egress & SSRF Protection

RenderNest's worker renders arbitrary public websites via Playwright Chromium. To prevent malicious targets or SSRF exploits from pivoting into internal infrastructure or cloud metadata services:

### Application-Level SSRF Guards (Active by Default)
The RenderNest API and Worker run `UrlSafetyService` (`packages/providers/src/security/url-safety.ts`) on every URL before navigation or fetching:
- Blocks private IPv4 ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`).
- Blocks IPv6 loopback and private ranges (`::1`, `fc00::/7`, `fe80::/10`).
- Blocks link-local addresses (`169.254.0.0/16`, including Cloud metadata `169.254.169.254`).
- Blocks file, gopher, dict, ftp schemes (only `http:` and `https:` permitted).
- Resolves DNS before request and checks the target IP to mitigate DNS rebinding.

### Host-Level Iptables/Docker Egress Isolation (Optional Defense-in-Depth)
To enforce kernel-level egress blocking for the worker container against Oracle Cloud metadata:

```bash
# Block access to Oracle IMDS (Instance Metadata Service) from Docker network
sudo iptables -I DOCKER-USER -d 169.254.169.254 -j DROP comment 'Block Cloud Metadata'

# Ensure Docker user chain persists across reboots (using iptables-persistent)
sudo apt-get install -y iptables-persistent
sudo netfilter-persistent save
```

---

## 4. Docker Port Binding Security

In `docker-compose.production.yml`:
- **Caddy**: Binds host ports `80:80` and `443:443`.
- **PostgreSQL**: Bound to `127.0.0.1:5432:5432` for administrative maintenance or migrations only. Never `0.0.0.0:5432`.
- **Redis**: No host port mapped. Resolvable only via Docker DNS `redis:6379`.
- **Web API**: No host port mapped. Resolvable only by Caddy via `web:3000`.
- **Worker**: No host port mapped. Operates as an internal queue consumer.
