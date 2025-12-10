import { useLanguage } from '@/context/LanguageContext';

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

interface ProductSpecificationsDisplayProps {
  specifications: ProductSpecifications | null;
}

export function ProductSpecificationsDisplay({ specifications }: ProductSpecificationsDisplayProps) {
  const { language } = useLanguage();

  if (!specifications?.items || specifications.items.length === 0) {
    return (
      <div className="card-premium p-8">
        <p className="text-muted-foreground text-center">
          {language === 'ro' ? 'Nu există specificații disponibile.' : 'No specifications available.'}
        </p>
      </div>
    );
  }

  // Separate items by type for better organization
  const listItems = specifications.items.filter(item => item.type === 'list');
  const textItems = specifications.items.filter(item => item.type === 'text');
  const highlightItems = specifications.items.filter(item => item.type === 'highlight');

  return (
    <div className="card-premium p-8 space-y-6">
      {/* List type items (like ingredients) */}
      {listItems.map((item, index) => (
        <div key={`list-${index}`}>
          <h4 className="font-display text-lg mb-3">
            {language === 'ro' ? item.label_ro : item.label_en}:
          </h4>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
            {language === 'ro' ? item.value_ro : item.value_en}
          </p>
        </div>
      ))}

      {/* Text type items in a grid */}
      {textItems.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {textItems.map((item, index) => (
            <div key={`text-${index}`} className="p-4 rounded-xl bg-muted/50">
              <h4 className="font-display text-sm text-muted-foreground mb-1">
                {language === 'ro' ? item.label_ro : item.label_en}
              </h4>
              <p className="font-semibold">
                {language === 'ro' ? item.value_ro : item.value_en}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Highlight items (certifications, badges) */}
      {highlightItems.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {highlightItems.map((item, index) => (
            <div
              key={`highlight-${index}`}
              className="px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm"
            >
              {language === 'ro' ? item.value_ro : item.value_en}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
