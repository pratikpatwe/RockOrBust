import { Router } from 'express';
import { nanoid } from 'nanoid';
import { supabase } from '../lib/supabase';

const router = Router();

/**
 * POST /auth/register
 * Generates a new cryptographically random key and stores it in Supabase.
 */
router.post('/register', async (req, res) => {
  try {
    const keyString = `rob_${nanoid(32)}`;

    // We store the key. In a more advanced version, we might store a hash
    // and only show the raw key once, but for simplicity and following the 
    // project spec, we'll store it.
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
      console.error('Error inserting key:', error);
      return res.status(500).json({ error: 'Failed to generate key' });
    }

    res.status(201).json({
      message: 'Key generated successfully',
      key: keyString
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
