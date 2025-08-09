import { otherLocales } from '../../utils/locales';
export { default } from '../offline';

export function getStaticPaths() {
  return {
    paths: otherLocales.map((locale) => ({ params: { locale } })),
    fallback: false,
  };
}

export async function getStaticProps() {
  return { props: {} };
}

