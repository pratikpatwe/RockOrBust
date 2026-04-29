import { Router } from 'express';
import crypto from 'crypto';
import { rateLimit } from 'express-rate-limit';
import { supabase } from '../lib/supabase';

const router = Router();

// Rate limit: 1 key generation per 1 hour per IP
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1, 
  message: { error: 'Rate limit exceeded. You can only generate 1 key per hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /auth/register
 * Generates a new cryptographically random key and stores it in Supabase.
 * Implements O(1) retry logic for collisions.
 */
router.post('/register', registrationLimiter, async (req, res) => {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const keyString = `rob_${crypto.randomBytes(16).toString('hex')}`;

      const { data, error } = await supabase
        .from('rob_keys')
        .insert([
          {
            key_string: keyString,
            status: 'active'
          }
        ])
        .select()
        .single();

      if (error) {
        // Postgrest Error 23505 is Unique Violation
        if (error.code === '23505' && attempts < maxAttempts - 1) {
          attempts++;
          continue; // Retry with a new key
        }
        console.error('Error inserting key:', error);
        return res.status(500).json({ error: 'Failed to generate key' });
      }

      return res.status(201).json({
        message: 'Key generated successfully',
        key: keyString
      });
    } catch (err) {
      console.error('Registration error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
