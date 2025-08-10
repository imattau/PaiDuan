import { FieldErrors, UseFormHandleSubmit, UseFormRegister } from 'react-hook-form';
import ZapSplitFields from './ZapSplitFields';

interface FormValues {
  caption: string;
  topics: string;
  license: string;
  lightningAddress: string;
  zapSplits: { lnaddr: string; pct: number }[];
}

interface Props {
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
  license: string;
  customLicense: string;
  setCustomLicense: (v: string) => void;
  nsfw: boolean;
  setNsfw: (v: boolean) => void;
  showZapSelect: boolean;
  zapOptions: string[];
  selectedZapOption: string;
  setLightningAddress: (v: string) => void;
  zapFields: any[];
  addSplit: () => void;
  removeSplit: (idx: number) => void;
  totalPct: number;
  lnaddrOptions: string[];
  errorsZapSplits?: string;
  t: (key: string, values?: any) => string;
  tCommon: (key: string, values?: any) => string;
  outBlob: Blob | null;
  posting: boolean;
  isValid: boolean;
  handleSubmit: UseFormHandleSubmit<FormValues>;
  onSubmit: (values: FormValues) => void;
}

export default function MetadataForm({
  register,
  errors,
  license,
  customLicense,
  setCustomLicense,
  nsfw,
  setNsfw,
  showZapSelect,
  zapOptions,
  selectedZapOption,
  setLightningAddress,
  zapFields,
  addSplit,
  removeSplit,
  totalPct,
  lnaddrOptions,
  errorsZapSplits,
  t,
  tCommon,
  outBlob,
  posting,
  isValid,
  handleSubmit,
  onSubmit,
}: Props) {
  return (
    <>
      <input
        type="text"
        {...register('caption')}
        placeholder={t('caption_placeholder')}
        className="block w-full text-sm rounded-md border border-border bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      />
      {errors.caption && (
        <div className="text-sm text-red-500">{errors.caption.message}</div>
      )}
      <input
        type="text"
        {...register('topics')}
        placeholder={t('topics_placeholder')}
        className="block w-full text-sm rounded-md border border-border bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      />
      {errors.topics && (
        <div className="text-sm text-red-500">{errors.topics.message}</div>
      )}
      <label className="block text-sm">
        <span className="mb-1 block">{t('lightning_address')}</span>
        {showZapSelect && (
          <select
            value={selectedZapOption}
            onChange={(e) => setLightningAddress(e.target.value)}
            className="block w-full rounded-md border border-border bg-transparent px-3 py-2 mb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {zapOptions.map((addr) => (
              <option key={addr} value={addr}>
                {addr}
              </option>
            ))}
            <option value="">{t('other_option')}</option>
          </select>
        )}
        <input
          type="text"
          {...register('lightningAddress')}
          className="block w-full rounded-md border border-border bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        />
        {errors.lightningAddress && (
          <div className="text-sm text-red-500">{errors.lightningAddress.message}</div>
        )}
      </label>
      <ZapSplitFields
        zapFields={zapFields}
        register={register as any}
        removeSplit={removeSplit}
        addSplit={addSplit}
        totalPct={totalPct}
        canAddMore={zapFields.length < 4 && totalPct < 95}
        errorsMessage={errorsZapSplits}
        lnaddrOptions={lnaddrOptions}
        t={t}
      />
      <label className="block text-sm">
        <span className="mb-1 block">{tCommon('license')}</span>
        <select
          data-testid="license-select"
          {...register('license')}
          className="block w-full rounded-md border border-border bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          <option value="All Rights Reserved">{tCommon('license_all_rights_reserved')}</option>
          <option value="CC0 (Public Domain)">{tCommon('license_cc0')}</option>
          <option value="CC BY">{tCommon('license_cc_by')}</option>
          <option value="CC BY-SA">{tCommon('license_cc_by_sa')}</option>
          <option value="CC BY-ND">{tCommon('license_cc_by_nd')}</option>
          <option value="CC BY-NC">{tCommon('license_cc_by_nc')}</option>
          <option value="CC BY-NC-SA">{tCommon('license_cc_by_nc_sa')}</option>
          <option value="CC BY-NC-ND">{tCommon('license_cc_by_nc_nd')}</option>
          <option value="other">{tCommon('license_other')}</option>
        </select>
        {license === 'other' && (
          <input
            data-testid="custom-license-input"
            type="text"
            value={customLicense}
            onChange={(e) => setCustomLicense(e.target.value)}
            placeholder={tCommon('license_custom')}
            className="mt-2 block w-full text-sm rounded-md border border-border bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          />
        )}
        {errors.license && (
          <div className="text-sm text-red-500">{errors.license.message}</div>
        )}
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={nsfw} onChange={(e) => setNsfw(e.target.checked)} />
        <span className="text-sm">{t('nsfw')}</span>
      </label>
      <button
        className="btn btn-primary disabled:opacity-60"
        data-testid="publish-button"
        disabled={!outBlob || posting || !isValid}
        onClick={handleSubmit(onSubmit)}
      >
        {posting ? t('publishing') : t('publish')}
      </button>
    </>
  );
}
