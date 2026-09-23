export function actionContext(params, countries, categoryMap) {
  const category = params.get("category");
  if (categoryMap.has(category)) return { country: null, categories: [category] };

  const country = countries.find((item) => item.code === params.get("country")) || null;
  return {
    country,
    categories: country ? country.categories.filter((id) => categoryMap.has(id)) : [],
  };
}

export function rankOrganizations(organizations, categories, selectedOffers) {
  const relevant = (org) => Number(categories.some((id) => org.categories.includes(id)));
  const offerCount = (org) => org.needs.filter((id) => selectedOffers.has(id)).length;
  return [...organizations].sort((a, b) =>
    relevant(b) - relevant(a) || offerCount(b) - offerCount(a)
  );
}
