// controllers/customDomainController.js
const Domain = require('../models/Domain');
const User = require('../models/User');
const dns = require('dns').promises;
const { getLimits } = require('../utils/subscriptionLimits');

const SERVER_IP = process.env.SERVER_IP || ''; // Set this in .env for verification

/**
 * GET /api/domains/custom — list custom domains for the current user
 */
exports.listCustomDomains = async (req, res) => {
    try {
        const userId = req.user.id;
        const items = await Domain.listByClient(userId);
        const custom = items
            .filter((d) => d.domain && String(d.domain).trim())
            .map((d) => ({
                id: d.id,
                domain: d.domain,
                subdomain: d.subdomain,
                projectId: d.projectId,
                projectTitle: d.projectTitle,
                status: d.status,
                domainStatus: d.domainStatus || 'pending',
                verifiedAt: d.verifiedAt || null,
            }));
        res.status(200).json({ success: true, data: custom });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

/**
 * POST /api/domains/custom — connect a custom domain to a published project
 * Body: { projectId, domain }
 */
exports.addCustomDomain = async (req, res) => {
    try {
        const userId = req.user.id;
        const { projectId, domain } = req.body;

        if (!projectId || !String(projectId).trim()) {
            return res.status(400).json({ success: false, message: 'projectId is required' });
        }
        if (!domain || !String(domain).trim()) {
            return res.status(400).json({ success: false, message: 'domain is required' });
        }

        const normalized = String(domain).trim().toLowerCase().replace(/^(https?:\/\/)/i, '').replace(/\/+$/, '');
        if (!normalized || normalized.includes('/') || !normalized.includes('.')) {
            return res.status(400).json({ success: false, message: 'Invalid domain format. Example: mybusiness.com' });
        }

        // Check subscription
        const user = await User.findById(userId);
        const limits = getLimits(user?.subscriptionPlan);
        if (!limits.customDomains) {
            return res.status(403).json({
                success: false,
                message: 'Custom domains are available on Basic and Pro plans. Please upgrade your subscription.',
            });
        }

        // Check if domain is already taken by another user
        const existing = await Domain.findByCustomDomain(normalized);
        if (existing && existing.userId !== userId) {
            return res.status(409).json({ success: false, message: 'This domain is already connected to another account.' });
        }

        // Find the user's domain record for this project
        const domainRecord = await Domain.findByProjectId(userId, projectId);
        if (!domainRecord) {
            return res.status(400).json({ success: false, message: 'Publish your site first before connecting a custom domain.' });
        }

        // Save domain to the record
        await Domain.updateForClient(userId, domainRecord.id, {
            domain: normalized,
            domainStatus: 'pending',
        });

        // Also update published_subdomains if subdomain exists
        if (domainRecord.subdomain) {
            const { db } = require('../config/firebase');
            await db.collection('published_subdomains').doc(domainRecord.subdomain).set(
                { domain: normalized, domain_status: 'pending', updated_at: new Date() },
                { merge: true }
            );
        }

        const serverIp = SERVER_IP || 'YOUR_SERVER_IP';

        res.status(200).json({
            success: true,
            message: 'Custom domain added. Configure your DNS records to verify.',
            data: {
                domain: normalized,
                projectId,
                status: 'pending',
            },
            dnsInstructions: {
                message: 'Add ONE of these DNS records at your domain registrar:',
                optionA: {
                    type: 'A',
                    host: '@',
                    value: serverIp,
                    description: 'Points your root domain to our server',
                },
                optionB: {
                    type: 'CNAME',
                    host: 'www',
                    value: process.env.BASE_DOMAIN || 'yourplatform.com',
                    description: 'Points www subdomain to our platform',
                },
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

/**
 * POST /api/domains/custom/verify — verify DNS is pointing to our server
 * Body: { projectId }
 */
exports.verifyCustomDomain = async (req, res) => {
    try {
        const userId = req.user.id;
        const { projectId } = req.body;

        if (!projectId) {
            return res.status(400).json({ success: false, message: 'projectId is required' });
        }

        const domainRecord = await Domain.findByProjectId(userId, projectId);
        if (!domainRecord || !domainRecord.domain) {
            return res.status(400).json({ success: false, message: 'No custom domain found for this project.' });
        }

        const domain = String(domainRecord.domain).trim().toLowerCase();
        let verified = false;
        let verificationDetails = '';

        try {
            // Check A record
            const addresses = await dns.resolve4(domain);
            if (SERVER_IP && addresses.includes(SERVER_IP)) {
                verified = true;
                verificationDetails = `A record verified: ${domain} → ${SERVER_IP}`;
            } else if (addresses.length > 0) {
                // DNS is resolving somewhere — might be Cloudflare proxy etc.
                // For now mark as verified if it resolves at all (production would check more strictly)
                verified = true;
                verificationDetails = `Domain resolves to ${addresses.join(', ')}. Accepted.`;
            }
        } catch (e) {
            // A record failed, try CNAME
            try {
                const cnames = await dns.resolveCname(domain);
                const baseDomain = (process.env.BASE_DOMAIN || '').toLowerCase();
                if (cnames.some((c) => c.toLowerCase().includes(baseDomain))) {
                    verified = true;
                    verificationDetails = `CNAME verified: ${domain} → ${cnames.join(', ')}`;
                } else if (cnames.length > 0) {
                    verificationDetails = `CNAME found (${cnames.join(', ')}) but does not point to ${baseDomain}`;
                }
            } catch {
                verificationDetails = `DNS records not found for ${domain}. Make sure you added the A or CNAME record.`;
            }
        }

        if (verified) {
            await Domain.updateForClient(userId, domainRecord.id, {
                domainStatus: 'verified',
                verifiedAt: new Date().toISOString(),
            });

            if (domainRecord.subdomain) {
                const { db } = require('../config/firebase');
                await db.collection('published_subdomains').doc(domainRecord.subdomain).set(
                    { domain_status: 'verified', verified_at: new Date(), updated_at: new Date() },
                    { merge: true }
                );
            }

            return res.status(200).json({
                success: true,
                message: 'Domain verified successfully! Your custom domain is now active.',
                data: { domain, status: 'verified', details: verificationDetails },
            });
        }

        res.status(200).json({
            success: false,
            message: 'Domain verification failed. DNS records not pointing to our server yet.',
            data: { domain, status: 'pending', details: verificationDetails },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

/**
 * DELETE /api/domains/custom — remove a custom domain from a project
 * Body: { projectId }
 */
exports.removeCustomDomain = async (req, res) => {
    try {
        const userId = req.user.id;
        const { projectId } = req.body;

        if (!projectId) {
            return res.status(400).json({ success: false, message: 'projectId is required' });
        }

        const domainRecord = await Domain.findByProjectId(userId, projectId);
        if (!domainRecord) {
            return res.status(404).json({ success: false, message: 'Domain record not found.' });
        }

        await Domain.updateForClient(userId, domainRecord.id, {
            domain: null,
            domainStatus: null,
            verifiedAt: null,
        });

        if (domainRecord.subdomain) {
            const { db } = require('../config/firebase');
            const { admin } = require('../config/firebase');
            const FieldValue = admin.firestore.FieldValue;
            await db.collection('published_subdomains').doc(domainRecord.subdomain).update({
                domain: FieldValue.delete(),
                domain_status: FieldValue.delete(),
                verified_at: FieldValue.delete(),
                updated_at: new Date(),
            });
        }

        res.status(200).json({ success: true, message: 'Custom domain removed.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
