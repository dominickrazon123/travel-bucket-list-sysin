module.exports = {
  port: Number(process.env.PORT) || 3001,
  apiKey: process.env.RESTCOUNTRIES_API_KEY || "",
  v5Url: "https://api.restcountries.com/countries/v5",
  legacyUrl: "https://restcountries.com/v3.1/name",
  maxResults: 5,
};
