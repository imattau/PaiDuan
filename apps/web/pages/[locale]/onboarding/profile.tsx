import { locales } from '../../../utils/locales';
export { default } from '../../onboarding/profile';

export function getStaticPaths() {
  return {
    paths: locales.map((locale) => ({ params: { locale } })),
    fallback: false,
  };
}

export async function getStaticProps() {
  return { props: {} };
}
