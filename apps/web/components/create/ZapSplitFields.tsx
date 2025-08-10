import { FieldArrayWithId, UseFormRegister } from 'react-hook-form';

interface Props {
  zapFields: FieldArrayWithId<any, 'zapSplits', 'id'>[];
  register: UseFormRegister<any>;
  removeSplit: (idx: number) => void;
  addSplit: () => void;
  totalPct: number;
  canAddMore: boolean;
  errorsMessage?: string;
  lnaddrOptions: string[];
  t: (key: string, values?: any) => string;
}

export default function ZapSplitFields({
  zapFields,
  register,
  removeSplit,
  addSplit,
  totalPct,
  canAddMore,
  errorsMessage,
  lnaddrOptions,
  t,
}: Props) {
  return (
    <>
      {zapFields.map((field, i) => (
        <div key={field.id} className="flex items-center gap-2">
          <input
            list="lnaddr-options"
            {...register(`zapSplits.${i}.lnaddr` as const)}
            placeholder={t('lnaddr_placeholder')}
            className="flex-1 text-sm rounded-md border border-border bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          />
          <input
            type="number"
            min={0}
            max={95}
            {...register(`zapSplits.${i}.pct` as const, { valueAsNumber: true })}
            className="w-20 text-sm rounded-md border border-border bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          />
          <button type="button" className="text-xs underline" onClick={() => removeSplit(i)}>
            {t('remove')}
          </button>
        </div>
      ))}
      {errorsMessage && <div className="text-sm text-red-500">{errorsMessage}</div>}
      {canAddMore && (
        <button type="button" onClick={addSplit} className="rounded border px-2 py-1 text-sm">
          {t('add_collaborator')}
        </button>
      )}
      {zapFields.length > 0 && (
        <div className="text-sm">{t('total_pct', { pct: totalPct })}</div>
      )}
      <datalist id="lnaddr-options">
        {lnaddrOptions.map((addr) => (
          <option key={addr} value={addr}>
            {addr}
          </option>
        ))}
      </datalist>
    </>
  );
}
