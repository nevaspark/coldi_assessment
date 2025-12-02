// ...existing code...
import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { enforceTenantAccess } from '../middleware/tenantGuard.js';
import { Balance, Call, Tenant } from '../models/index.js';
import { publishAdmin, publishTenant } from '../services/sse.js';
import dayjs from 'dayjs';
import { calculateCostCents } from '../services/billing.js';

const router = Router();

router.post('/:tenantId/summary', authRequired, enforceTenantAccess, async (req, res) => {
  try {
    const tenantId = parseInt(req.params.tenantId, 10);
    if (!Number.isFinite(tenantId) || tenantId <= 0) return res.status(400).json({ error: 'Invalid tenant id' });

    const balance = await Balance.findByPk(tenantId);
    const calls = await Call.findAll({ where: { tenant_id: tenantId } });
    const totalCalls = calls.length;
    const totalMinutes = calls.reduce((acc, c) => acc + ((c.billed_seconds || 0) / 60), 0);
    res.json({
      total_calls: totalCalls,
      total_minutes: +totalMinutes.toFixed(2),
      current_balance_cents: balance?.current_cents ?? 0,
    });
  } catch (err) {
    console.error('POST /:tenantId/summary error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:tenantId/bot', authRequired, enforceTenantAccess, async (req, res) => {
  try {
    const tenantId = parseInt(req.params.tenantId, 10);
    if (!Number.isFinite(tenantId) || tenantId <= 0) return res.status(400).json({ error: 'Invalid tenant id' });

    const tenant = await Tenant.findByPk(tenantId);
    res.json({ bot_id: tenant?.bot_id ?? null, tenant_name: tenant?.name ?? null });
  } catch (err) {
    console.error('POST /:tenantId/bot error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/*
  Single POST /:tenantId/calls that supports:
   - list: return list of calls (client can send { list: true } or an empty body)
   - start/create: client sends { start: true } to create a new call
  This keeps POST-only usage (works with free ngrok).
*/
router.post('/:tenantId/calls', authRequired, enforceTenantAccess, async (req, res) => {
  try {
    const tenantId = parseInt(req.params.tenantId, 10);
    if (!Number.isFinite(tenantId) || tenantId <= 0) return res.status(400).json({ error: 'Invalid tenant id' });

    // If client explicitly asks to start a call, create it.
    if (req.body && (req.body.start === true || req.body.action === 'start')) {
      const tenant = await Tenant.findByPk(tenantId);
      const balance = await Balance.findByPk(tenantId);
      if (!balance || (balance.current_cents ?? 0) < 0) {
        return res.status(402).json({ error: 'Insufficient balance' });
      }
      const call = await Call.create({
        tenant_id: tenantId,
        bot_id: tenant?.bot_id ?? null,
        status: 'started',
        started_at: new Date(),
      });
      publishTenant(tenantId, 'call_started', { id: call.id, started_at: call.started_at });
      publishAdmin('tenant_update', { tenant_id: tenantId, type: 'call_started' });
      return res.json(call);
    }

    // Otherwise return list (client can send { list: true } or nothing)
    const calls = await Call.findAll({ where: { tenant_id: tenantId }, order: [['id','DESC']], limit: 50 });
    res.json(calls);
  } catch (err) {
    console.error('POST /:tenantId/calls error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:tenantId/calls/:id/end', authRequired, enforceTenantAccess, async (req, res) => {
  try {
    const tenantId = parseInt(req.params.tenantId, 10);
    const id = Number(req.params.id);
    if (!Number.isFinite(tenantId) || tenantId <= 0) return res.status(400).json({ error: 'Invalid tenant id' });
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'Invalid call id' });

    const call = await Call.findOne({ where: { id, tenant_id: tenantId } });
    if (!call) return res.status(404).json({ error: 'Call not found' });
    if (call.status === 'ended') return res.json(call);

    call.ended_at = new Date();
    call.status = 'ended';
    const started = dayjs(call.started_at);
    const ended = dayjs(call.ended_at);
    const billedSeconds = Math.max(1, ended.diff(started, 'second'));
    call.billed_seconds = billedSeconds;
    const costCents = calculateCostCents(billedSeconds);
    call.cost_cents = costCents;
    await call.save();

    const balance = await Balance.findByPk(tenantId);
    balance.current_cents = (balance.current_cents || 0) - costCents;
    balance.updated_at = new Date();
    await balance.save();

    publishTenant(tenantId, 'call_ended', { id: call.id, billed_seconds: billedSeconds, cost_cents: costCents, new_balance_cents: balance.current_cents });
    publishAdmin('tenant_update', { tenant_id: tenantId, type: 'call_ended' });

    res.json(call);
  } catch (err) {
    console.error('POST /:tenantId/calls/:id/end error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
// ...existing code...