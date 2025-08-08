import { GetServerSideProps } from 'next';
export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: '/en', permanent: false },
});
export default function RootRedirect() { return null; }
