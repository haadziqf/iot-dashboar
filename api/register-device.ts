import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { chip_id, mac, pairing_code } = req.body;

  if (!chip_id || !mac || !pairing_code) {
    return res.status(400).json({ error: 'chip_id, mac, and pairing_code required' });
  }

  // Cari user berdasarkan pairing_code (misal: email, token, dsb)
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('pairing_code', pairing_code)
    .single();

  if (userError || !user) {
    return res.status(404).json({ error: 'User not found or invalid pairing code' });
  }

  // Simpan device ke tabel devices
  const { error: deviceError } = await supabase.from('devices').insert([
    {
      name: `Wemos ${chip_id}`,
      user_id: user.id,
      status: 'online',
      last_seen: new Date().toISOString(),
      chip_id,
      mac,
    },
  ]);

  if (deviceError) {
    return res.status(500).json({ error: deviceError.message });
  }

  return res.status(200).json({ success: true });
}
