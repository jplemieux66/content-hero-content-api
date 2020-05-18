export const getUserEmail = (event) => {
  const namespace = 'https://www.content-hero.com';
  return event.auth.payload[namespace + '_email'];
};
