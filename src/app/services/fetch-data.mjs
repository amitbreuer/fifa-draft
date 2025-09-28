async function fetchPlayerData(offset) {
  const res = await fetch(`https://drop-api.ea.com/rating/ea-sports-fc?locale=en&limit=100&offset=${offset}&gender=0&orderBy=ovr%3Adesc`, {
    "headers": {
      "accept": "/",
      "accept-language": "en-US,en;q=0.9",
      "if-none-match": "4ecd172776bc031c2e5ae7a99e3af1df4c7ddef2e7db8004f761c898b4e0ef8f",
      "priority": "u=1, i",
      "sec-ch-ua": "\"Chromium\";v=\"140\", \"Not=A?Brand\";v=\"24\", \"Google Chrome\";v=\"140\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "x-feature": "{\"disable_share_image\":false,\"enable_addon_bundle_sections\":true,\"enable_age_gate\":true,\"enable_age_gate_refactor\":true,\"enable_bf2042_glacier_theme\":true,\"enable_checkout_page\":true,\"enable_college_football_ratings\":true,\"enable_currency\":false,\"enable_events_page\":true,\"enable_franchise_hub\":false,\"enable_franchise_newsletter\":false,\"enable_im_resize_query_param\":true,\"enable_language_redirection\":true,\"enable_legal_disclaimer_page\":false,\"enable_mobile_download_flow_optimization\":true,\"enable_multimedia_consent\":false,\"enable_newsletter_with_incentive\":true,\"enable_next_ratings_release\":true,\"enable_non_mobile_download_flow_optimization\":true,\"enable_player_tag\":false,\"enable_portal\":false,\"enable_portal_filter\":false,\"enable_postlaunch_webstore_focus\":true,\"enable_postlaunch_webstore_image_link_ab_test\":false,\"enable_postlaunch_webstore_pdp_promotion\":true,\"enable_ratings_up_down_vote\":true,\"enable_showcase_edition\":false,\"enable_spotlight_carousel\":true,\"enable_translations_api_route\":false,\"enable_ugc_page\":true,\"enable_ugx\":false}",
      "Referer": "https://www.ea.com/"
    },
    "body": null,
    "method": "GET"
  });

  const json = await res.json();
  const {items} = json;
  return items.map(({
                              id,
                              firstName,
                              lastName,
                              commonName,
                              overallRating,
                              skillMoves,
                              weakFootAbility,
                              preferredFoot,
                              position,
                              alternatePositions,
                              playerAbilities,
                              team,
                              nationality,
                              stats,
                              shieldUrl,
                            }) => ({
    id,
    firstName,
    lastName,
    commonName,
    overallRating,
    skillMoves,
    weakFootAbility,
    preferredFoot: preferredFoot === 1 ? "Right" : "Left",
    position,
    alternatePositions,
    playerAbilities,
    team,
    nationality,
    stats,
    shieldUrl,
  }));
}

const promises = [0, 100, 200, 300, 400].map(fetchPlayerData);
const allPlayers = (await Promise.all(promises)).flat();
console.log(allPlayers);
