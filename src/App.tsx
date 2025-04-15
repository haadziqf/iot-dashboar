import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

type Device = {
  id: string;
  name: string;
  status: string | null;
  last_seen: string | null;
};

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<any>(null);

  // Device management state
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceName, setDeviceName] = useState('');
  const [loadingDevices, setLoadingDevices] = useState(false);

  useEffect(() => {
    const session = supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchDevices();
    } else {
      setDevices([]);
    }
    // eslint-disable-next-line
  }, [user]);

  const fetchDevices = async () => {
    setLoadingDevices(true);
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setDevices(data);
    setLoadingDevices(false);
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName.trim()) return;
    const { error } = await supabase.from('devices').insert([
      {
        name: deviceName,
        user_id: user.id,
        status: 'offline',
        last_seen: null,
      },
    ]);
    if (!error) {
      setDeviceName('');
      fetchDevices();
    } else {
      alert('Gagal menambah device: ' + error.message);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setMessage(error ? error.message : 'Login berhasil!');
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      setMessage(error ? error.message : 'Registrasi berhasil! Silakan cek email Anda.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (user) {
    return (
      <div style={{ maxWidth: 500, margin: '40px auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
        <h2>Dashboard</h2>
        <p>Selamat datang, <b>{user.email}</b></p>
        <button onClick={handleLogout} style={{ marginBottom: 24, width: '100%' }}>
          Logout
        </button>
        <h3>Device List</h3>
        {loadingDevices ? (
          <p>Loading devices...</p>
        ) : (
          <ul>
            {devices.map((d) => (
              <li key={d.id}>
                <b>{d.name}</b> — Status: {d.status || 'unknown'} {d.last_seen ? `(last seen: ${d.last_seen})` : ''}
              </li>
            ))}
            {devices.length === 0 && <li>Belum ada device.</li>}
          </ul>
        )}
        <form onSubmit={handleAddDevice} style={{ marginTop: 24 }}>
          <input
            type="text"
            placeholder="Nama device"
            value={deviceName}
            onChange={e => setDeviceName(e.target.value)}
            style={{ width: '70%', marginRight: 8, padding: 8 }}
          />
          <button type="submit" style={{ padding: 8 }}>Tambah Device</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
      <h2>{isLogin ? 'Login' : 'Register'} IoT Dashboard</h2>
      <form onSubmit={handleAuth}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', marginBottom: 12, padding: 8 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          required
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', marginBottom: 12, padding: 8 }}
        />
        <button type="submit" style={{ width: '100%', padding: 10 }}>
          {isLogin ? 'Login' : 'Register'}
        </button>
      </form>
      <button onClick={() => setIsLogin(!isLogin)} style={{ marginTop: 12, width: '100%' }}>
        {isLogin ? 'Belum punya akun? Register' : 'Sudah punya akun? Login'}
      </button>
      {message && <p style={{ marginTop: 16 }}>{message}</p>}
    </div>
  );
}

export default App;
