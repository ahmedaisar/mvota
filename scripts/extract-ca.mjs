/**
 * Extracts the TLS certificate chain presented by the Supabase Postgres pooler
 * and writes it to ca.pooler.pem for NODE_EXTRA_CA_CERTS / SSL_CERT_FILE.
 * (Postgres requires an SSLRequest preamble before TLS, and some pooler LB
 * nodes reject the first attempt — we retry.)
 *
 * Usage: node scripts/extract-ca.mjs
 */
import { createConnection } from 'node:net';
import { connect as tlsConnect } from 'node:tls';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HOST = process.env.PG_HOST || 'aws-0-us-east-1.pooler.supabase.com';
const PORT = Number(process.env.PG_PORT || 6543);
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'ca.pooler.pem');
const ATTEMPTS = 6;

function attempt(n) {
  const sock = createConnection({ host: HOST, port: PORT, family: 4 }, () => {
    // Postgres SSLRequest: int32 length (8) + int32 code (80877103 = 0x04D2162F)
    sock.write(Buffer.from([0x00, 0x00, 0x00, 0x08, 0x04, 0xd2, 0x16, 0x2f]));
  });

  const timer = setTimeout(() => {
    sock.destroy();
    retry(n, 'timeout');
  }, 8000);

  sock.once('data', (d) => {
    if (d[0] !== 0x53) {
      clearTimeout(timer);
      sock.destroy();
      retry(n, `server reply 0x${d[0].toString(16)}`);
      return;
    }
    const tls = tlsConnect({ socket: sock, servername: HOST, rejectUnauthorized: false }, () => {
      const cert = tls.getPeerCertificate(true);
      const pems = [];
      let c = cert;
      const seen = new Set();
      while (c && Object.keys(c).length && !seen.has(c.fingerprint256)) {
        seen.add(c.fingerprint256);
        const b64 = c.raw.toString('base64').replace(/(.{64})/g, '$1\n');
        pems.push(`-----BEGIN CERTIFICATE-----\n${b64}\n-----END CERTIFICATE-----`);
        if (!c.issuerCertificate || c.issuerCertificate === c) break;
        c = c.issuerCertificate;
      }
      writeFileSync(OUT, pems.join('\n'), 'utf8');
      console.log(`Wrote ${pems.length} certificate(s) to ${OUT}`);
      console.log('Leaf subject :', cert.subject?.CN);
      console.log('Leaf issuer  :', cert.issuer?.CN);
      console.log('Valid to     :', cert.valid_to);
      tls.end();
      sock.end();
      process.exit(0);
    });
    tls.on('error', (e) => {
      clearTimeout(timer);
      retry(n, `tls: ${e.message}`);
    });
  });

  sock.on('error', (e) => {
    clearTimeout(timer);
    retry(n, `tcp: ${e.message}`);
  });
}

function retry(n, why) {
  if (n >= ATTEMPTS) {
    console.error(`Failed after ${ATTEMPTS} attempts (last: ${why})`);
    process.exit(1);
  }
  console.log(`  attempt ${n} failed (${why}), retrying…`);
  setTimeout(() => attempt(n + 1), 400);
}

attempt(1);
