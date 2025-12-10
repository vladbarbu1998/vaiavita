import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Save, Building2, Mail, Phone, MapPin, Globe, Key } from 'lucide-react';

interface Settings {
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  company_cui: string;
  company_reg_com: string;
  google_place_id: string;
  ga4_id: string;
  stripe_public_key: string;
  netopia_merchant_id: string;
  admin_notification_email: string;
  admin_notification_phone: string;
}

const defaultSettings: Settings = {
  company_name: 'VAIAVITA S.R.L.',
  company_email: 'office@vaiavita.com',
  company_phone: '',
  company_address: 'Brașov, România',
  company_cui: '49945945',
  company_reg_com: 'J8/1310/2024',
  google_place_id: '',
  ga4_id: '',
  stripe_public_key: '',
  netopia_merchant_id: '',
  admin_notification_email: '',
  admin_notification_phone: '',
};

const AdminSettings = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value');

    if (error) {
      console.error('Error fetching settings:', error);
    } else if (data) {
      const settingsObj = { ...defaultSettings };
      data.forEach((item) => {
        if (item.key in settingsObj) {
          (settingsObj as any)[item.key] = item.value;
        }
      });
      setSettings(settingsObj);
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);

    try {
      // Upsert each setting
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from('settings')
          .upsert(
            { key, value: value as any },
            { onConflict: 'key' }
          );

        if (error) throw error;
      }

      toast.success('Setări salvate cu succes');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Eroare la salvarea setărilor');
    }

    setSaving(false);
  };

  const updateSetting = (key: keyof Settings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl tracking-wide">Setări</h1>
          <p className="text-muted-foreground mt-1">Configurează setările magazinului</p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvează
        </Button>
      </div>

      {/* Company Info */}
      <div className="card-premium p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-lg">Date companie</h2>
            <p className="text-sm text-muted-foreground">Informații afișate în footer și documente</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nume companie</Label>
            <Input
              value={settings.company_name}
              onChange={(e) => updateSetting('company_name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>CUI</Label>
            <Input
              value={settings.company_cui}
              onChange={(e) => updateSetting('company_cui', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Reg. Com.</Label>
            <Input
              value={settings.company_reg_com}
              onChange={(e) => updateSetting('company_reg_com', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="w-4 h-4" /> Email
            </Label>
            <Input
              type="email"
              value={settings.company_email}
              onChange={(e) => updateSetting('company_email', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Phone className="w-4 h-4" /> Telefon
            </Label>
            <Input
              value={settings.company_phone}
              onChange={(e) => updateSetting('company_phone', e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Adresă
            </Label>
            <Textarea
              value={settings.company_address}
              onChange={(e) => updateSetting('company_address', e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div className="card-premium p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-lg">Integrări</h2>
            <p className="text-sm text-muted-foreground">Google, Analytics și recenzii</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Google Place ID</Label>
            <Input
              value={settings.google_place_id}
              onChange={(e) => updateSetting('google_place_id', e.target.value)}
              placeholder="ChIJ..."
            />
            <p className="text-xs text-muted-foreground">Pentru afișarea recenziilor Google</p>
          </div>
          <div className="space-y-2">
            <Label>Google Analytics 4 ID</Label>
            <Input
              value={settings.ga4_id}
              onChange={(e) => updateSetting('ga4_id', e.target.value)}
              placeholder="G-XXXXXXXXXX"
            />
          </div>
        </div>
      </div>

      {/* Payment Keys */}
      <div className="card-premium p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Key className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-lg">Plăți</h2>
            <p className="text-sm text-muted-foreground">Configurare Stripe și Netopia</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Stripe Public Key</Label>
            <Input
              value={settings.stripe_public_key}
              onChange={(e) => updateSetting('stripe_public_key', e.target.value)}
              placeholder="pk_live_..."
            />
          </div>
          <div className="space-y-2">
            <Label>Netopia Merchant ID</Label>
            <Input
              value={settings.netopia_merchant_id}
              onChange={(e) => updateSetting('netopia_merchant_id', e.target.value)}
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Notă: Cheile secrete sunt stocate în variabilele de mediu pentru securitate.
        </p>
      </div>

      {/* Notifications */}
      <div className="card-premium p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-lg">Notificări admin</h2>
            <p className="text-sm text-muted-foreground">Unde primești alertele pentru comenzi noi</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Email notificări</Label>
            <Input
              type="email"
              value={settings.admin_notification_email}
              onChange={(e) => updateSetting('admin_notification_email', e.target.value)}
              placeholder="admin@vaiavita.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Telefon notificări (SMS/WhatsApp)</Label>
            <Input
              value={settings.admin_notification_phone}
              onChange={(e) => updateSetting('admin_notification_phone', e.target.value)}
              placeholder="+40..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
