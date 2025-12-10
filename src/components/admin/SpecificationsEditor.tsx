import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, Loader2, Sparkles, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SpecificationItem {
  label_ro: string;
  label_en: string;
  value_ro: string;
  value_en: string;
  type: 'text' | 'list' | 'highlight';
}

export interface ProductSpecifications {
  items: SpecificationItem[];
}

interface SpecificationsEditorProps {
  specifications: ProductSpecifications;
  onChange: (specs: ProductSpecifications) => void;
  productNameRo?: string;
  productDescriptionRo?: string;
}

const SPEC_TEMPLATES = [
  { label_ro: 'Ingrediente', label_en: 'Ingredients', type: 'list' as const },
  { label_ro: 'Greutate netă', label_en: 'Net weight', type: 'text' as const },
  { label_ro: 'Origine', label_en: 'Origin', type: 'text' as const },
  { label_ro: 'Mod de administrare', label_en: 'Usage instructions', type: 'text' as const },
  { label_ro: 'Avertismente', label_en: 'Warnings', type: 'text' as const },
  { label_ro: 'Depozitare', label_en: 'Storage', type: 'text' as const },
  { label_ro: 'Termen de valabilitate', label_en: 'Shelf life', type: 'text' as const },
  { label_ro: 'Certificări', label_en: 'Certifications', type: 'highlight' as const },
];

export function SpecificationsEditor({ 
  specifications, 
  onChange, 
  productNameRo,
  productDescriptionRo 
}: SpecificationsEditorProps) {
  const [generating, setGenerating] = useState(false);
  
  // Ensure specifications.items always exists
  const items = specifications?.items ?? [];

  const addSpecification = (template?: typeof SPEC_TEMPLATES[0]) => {
    const newItem: SpecificationItem = template ? {
      label_ro: template.label_ro,
      label_en: template.label_en,
      value_ro: '',
      value_en: '',
      type: template.type,
    } : {
      label_ro: '',
      label_en: '',
      value_ro: '',
      value_en: '',
      type: 'text',
    };

    onChange({
      items: [...items, newItem],
    });
  };

  const updateSpecification = (index: number, field: keyof SpecificationItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange({ items: newItems });
  };

  const removeSpecification = (index: number) => {
    onChange({
      items: items.filter((_, i) => i !== index),
    });
  };

  const generateWithAI = async () => {
    if (!productNameRo) {
      toast.error('Completează numele produsului mai întâi');
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-specifications', {
        body: {
          productName: productNameRo,
          productDescription: productDescriptionRo || '',
          existingSpecs: items,
        }
      });

      if (error) throw error;

      if (data?.specifications) {
        onChange({ items: data.specifications });
        toast.success('Specificații generate cu succes!');
      }
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast.error(error.message || 'Eroare la generare. Încearcă din nou.');
    } finally {
      setGenerating(false);
    }
  };

  const usedTemplates = items.map(item => item.label_ro);
  const availableTemplates = SPEC_TEMPLATES.filter(t => !usedTemplates.includes(t.label_ro));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Specificații produs</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={generateWithAI}
          disabled={generating || !productNameRo}
          className="gap-2"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Generează cu AI
        </Button>
      </div>

      {/* Quick Add Templates */}
      {availableTemplates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableTemplates.map((template) => (
            <Button
              key={template.label_ro}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addSpecification(template)}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              {template.label_ro}
            </Button>
          ))}
        </div>
      )}

      {/* Specifications List */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <GripVertical className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">
                  {item.type === 'list' ? '📋 Listă' : item.type === 'highlight' ? '⭐ Highlight' : '📝 Text'}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={() => removeSpecification(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Etichetă RO</Label>
                <Input
                  value={item.label_ro}
                  onChange={(e) => updateSpecification(index, 'label_ro', e.target.value)}
                  placeholder="ex: Ingrediente"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Etichetă EN</Label>
                <Input
                  value={item.label_en}
                  onChange={(e) => updateSpecification(index, 'label_en', e.target.value)}
                  placeholder="ex: Ingredients"
                  className="h-9"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Valoare RO</Label>
                {item.type === 'list' ? (
                  <Textarea
                    value={item.value_ro}
                    onChange={(e) => updateSpecification(index, 'value_ro', e.target.value)}
                    placeholder="O valoare per linie..."
                    rows={3}
                    className="text-sm"
                  />
                ) : (
                  <Input
                    value={item.value_ro}
                    onChange={(e) => updateSpecification(index, 'value_ro', e.target.value)}
                    placeholder="Valoare..."
                    className="h-9"
                  />
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Valoare EN</Label>
                {item.type === 'list' ? (
                  <Textarea
                    value={item.value_en}
                    onChange={(e) => updateSpecification(index, 'value_en', e.target.value)}
                    placeholder="One value per line..."
                    rows={3}
                    className="text-sm"
                  />
                ) : (
                  <Input
                    value={item.value_en}
                    onChange={(e) => updateSpecification(index, 'value_en', e.target.value)}
                    placeholder="Value..."
                    className="h-9"
                  />
                )}
              </div>
            </div>

            {/* Type Selector */}
            <div className="flex gap-2">
              {(['text', 'list', 'highlight'] as const).map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={item.type === type ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                  onClick={() => updateSpecification(index, 'type', type)}
                >
                  {type === 'text' ? '📝 Text' : type === 'list' ? '📋 Listă' : '⭐ Highlight'}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom */}
      <Button
        type="button"
        variant="outline"
        onClick={() => addSpecification()}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Adaugă specificație personalizată
      </Button>
    </div>
  );
}
